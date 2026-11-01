(() => {
  const coop = window.ONLINE_COOP, duel = window.ONLINE_DUEL, transport = window.ONLINE_CONNECTION;
  const words = window.ONLINE_PLAY.words, protocol = "coop-1-" + duel.signature(words);
  const prefix = transport.prefix + "coop-", $ = name => document.querySelector("#coop" + name);
  const ui = Object.fromEntries(["Screen", "Button", "Back", "Lobby", "Name", "Create", "Join", "RoomInput", "Room", "Code", "Copy",
    "Status", "Party", "Count", "Clock", "Players", "Loadout", "Weapon", "Ready", "Stages", "Start", "Battle", "Boss", "BossHp",
    "BossBar", "BossImage", "Target", "AttackBar", "Input", "InputLabel", "Word", "Typed", "Remaining", "Next", "NextWord", "NextTarget",
    "Defense", "Controls", "Entry", "Erase", "Keyboard", "Banner", "Again", "FlickPopup"].map(name => [name, $(name)]));
  const session = { active: false, generation: 0, host: false, peer: null, links: new Map(), match: null, room: "", selfId: "",
    mode: "roman", name: "", timer: 0, connectTimer: 0, lastSent: 0, seq: 0, defenseSeq: 0, defensePending: null,
    localMatch: "", localIndex: -1, localValue: "", kanaValue: "", pending: false, held: new Set(), gesture: null };
  const cards = new Map(), keys = [], choices = [];
  const cleanName = value => value.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 20) || "プレイヤー";
  const status = value => { ui.Status.textContent = value; };
  const seat = () => session.match?.players.findIndex(p => p.id === session.selfId) ?? -1;
  const self = () => session.match?.players[seat()];
  function send(link, packet) {
    if (!link?.conn.open) return false;
    try { link.conn.send(packet); return true; } catch { drop(link); return false; }
  }
  function toHost(packet) { return send(session.links.values().next().value, packet); }
  function close(notify = true) {
    session.generation++;
    window.clearTimeout(session.timer); window.clearTimeout(session.connectTimer);
    session.timer = session.connectTimer = 0;
    cancelGesture();
    for (const link of session.links.values()) {
      if (notify && link.conn.open) { try { link.conn.send({ type: "leave" }); } catch {} }
      link.conn.close();
    }
    session.links.clear(); session.peer?.destroy(); session.peer = null;
    session.match = null; session.room = ""; session.selfId = "";
    session.localMatch = ""; session.localIndex = -1; session.localValue = session.kanaValue = "";
    session.seq = session.defenseSeq = 0; session.defensePending = null; session.pending = false; session.held.clear();
    cards.clear(); ui.Players.replaceChildren();
  }
  function stop(message) { close(false); render(); status(message); }
  function leave() { close(); session.active = false; showStartScreen(); }
  function open() {
    if (!assetLoadingState.ready) return;
    const sources = imageSources([coop.stage.image, coop.stage.background,
      ...Object.keys(duel.weapons).map(id => Object.values(getPlayerWeaponAssets(id)))]);
    if (ensureGameAssets(sources, open)) return;
    close(); session.active = true; session.mode = flickState.enabled ? "kana" : "roman";
    ui.Name.value = state.playerName || "プレイヤー"; ui.RoomInput.value = "";
    ui.BossImage.src = coop.stage.image;
    ui.Boss.style.backgroundImage = `linear-gradient(#152d4533, #14263255), url("${coop.stage.background}")`;
    showScreen("coop"); render(); status(""); ui.Create.focus({ preventScroll: true });
  }
  function publish() {
    if (!session.match) return;
    const match = coop.snapshot(session.match);
    for (const link of session.links.values()) if (link.joined) send(link, { type: "state", match });
    render();
  }
  function drop(link) {
    if (!session.links.has(link.conn)) return;
    session.links.delete(link.conn); link.conn.close();
    if (!session.host) { stop("ホストとの通信が切れました。部屋に入り直してください。"); return; }
    if (link.joined && session.match) {
      coop.removePlayer(session.match, link.id); publish();
    }
  }
  function receive(link, packet) {
    if (!packet || typeof packet !== "object" || typeof packet.type !== "string") return;
    if (packet.type === "leave") { drop(link); return; }
    if (!session.host && ["busy", "mismatch"].includes(packet.type)) {
      stop(packet.type === "busy" ? "満員または戦闘中です。別の部屋に参加してください。" : "ゲームを再読み込みしてから接続してください。"); return;
    }
    if (packet.type === "ping") { send(link, { type: "pong" }); return; }
    if (packet.type === "pong") return;
    if (session.host && packet.type === "hello" && !link.joined) {
      if (packet.protocol !== protocol) { reject(link, "mismatch"); return; }
      if (typeof packet.name !== "string" || packet.name.length > 20 || !["roman", "kana"].includes(packet.mode)) { drop(link); return; }
      link.id = transport.randomHex();
      if (!coop.addPlayer(session.match, { id: link.id, name: cleanName(packet.name), mode: packet.mode })) { reject(link, "busy"); return; }
      link.joined = true;
      send(link, { type: "welcome", protocol, selfId: link.id, match: coop.snapshot(session.match) }); publish(); return;
    }
    if (!session.host && packet.type === "welcome" && !link.joined) {
      if (packet.protocol !== protocol || !coop.validSnapshot(packet.match, words)
          || !packet.match.players.some((p, i) => i > 0 && p.id === packet.selfId)) return;
      link.joined = true; session.selfId = packet.selfId; session.match = packet.match;
      window.clearTimeout(session.connectTimer); session.connectTimer = 0; render(); return;
    }
    if (!link.joined) return;
    if (!session.host && packet.type === "state") {
      const match = packet.match, current = session.match;
      if (!coop.validSnapshot(match, words) || !match.players.some(p => p.id === session.selfId)
          || (current?.id === match.id && match.revision < current.revision)
          || (current && current.id !== match.id && current.phase !== "finished")) return;
      session.match = match; render(); return;
    }
    const match = session.match;
    if (!match || packet.match !== match.id) return;
    if (!session.host) {
      if (packet.type === "input-rejected" && packet.index === session.localIndex && packet.seq === session.seq
          && typeof packet.value === "string" && packet.value.length <= 40
          && duel.targetFor(duel.wordFor(match, words, packet.index, seat()), session.mode, packet.value).startsWith(packet.value)) {
        session.localValue = session.kanaValue = packet.value; session.pending = false; render();
      }
      if (packet.type === "defense-ack" && packet.seq === session.defensePending?.seq) { session.defensePending = null; render(); }
      return;
    }
    const index = match.players.findIndex(p => p.id === link.id), now = performance.now();
    if (packet.type === "input") {
      if (!coop.acceptInput(match, words, index, packet, now)) send(link, { type: "input-rejected", match: match.id,
        index: packet.index, seq: packet.seq, value: match.players[index]?.value || "" });
    } else if (packet.type === "weapon") coop.chooseWeapon(match, index, packet.weaponId, packet.settingsRevision);
    else if (packet.type === "ready") coop.ready(match, index, packet.value, packet.settingsRevision);
    else if (packet.type === "defense") {
      coop.defense(match, words, index, packet, now); publish();
      send(link, { type: "defense-ack", match: match.id, seq: packet.seq }); return;
    } else return; // Only the local host can select a stage or reset the room.
    publish();
  }
  function reject(link, type) {
    send(link, { type });
    const generation = session.generation;
    window.setTimeout(() => { if (generation === session.generation) drop(link); }, 200);
  }
  function bind(conn, generation) {
    const link = { conn, joined: false, id: "", lastSeen: performance.now(), openedAt: performance.now(), packets: 0, budgetAt: 0 };
    session.links.set(conn, link);
    conn.on("open", () => {
      if (generation !== session.generation) { conn.close(); return; }
      link.lastSeen = link.openedAt = performance.now();
      if (!session.host) send(link, { type: "hello", protocol, name: session.name, mode: session.mode });
    });
    conn.on("data", packet => {
      if (generation !== session.generation || !session.links.has(conn)) return;
      const now = performance.now();
      if (now - link.budgetAt >= 1000) { link.budgetAt = now; link.packets = 0; }
      if (++link.packets > 200) { drop(link); return; }
      try { if (JSON.stringify(packet).length > 30000) return; } catch { return; }
      link.lastSeen = now; receive(link, packet);
    });
    for (const event of ["close", "error"]) conn.on(event, () => { if (generation === session.generation) drop(link); });
  }
  function loop(generation) {
    if (!session.active || generation !== session.generation) return;
    const now = performance.now();
    for (const link of [...session.links.values()]) {
      if (now - (link.joined ? link.lastSeen : link.openedAt) > (link.joined ? 12000 : 15000)) drop(link);
    }
    if (generation !== session.generation) return;
    if (session.host && session.match) {
      const revision = session.match.revision;
      coop.tick(session.match, words, now);
      if (session.match.revision !== revision || now - session.lastSent >= 100) { session.lastSent = now; publish(); }
    } else if (now - session.lastSent >= 1000) { session.lastSent = now; toHost({ type: "ping" }); }
    session.timer = window.setTimeout(() => loop(generation), 50);
  }
  async function connect(host) {
    if (!session.active || session.peer || session.connectTimer) return;
    const room = ui.RoomInput.value.normalize("NFKC").replace(/[\s-]/g, "");
    if (!host && !/^\d{8}$/.test(room)) { status("8桁の部屋番号を入力してください。"); return; }
    close(); session.host = host; session.name = cleanName(ui.Name.value); ui.Name.value = session.name;
    const generation = session.generation;
    session.connectTimer = window.setTimeout(() => stop("接続できませんでした。通信環境を確認してもう一度お試しください。"), 25000);
    render(); status("接続中…");
    try {
      const Peer = await transport.load();
      if (generation !== session.generation || !session.active) return;
      session.room = host ? transport.roomNumber() : room;
      const peer = new Peer(host ? prefix + session.room : undefined, transport.peerOptions); session.peer = peer;
      peer.on("open", () => {
        if (generation !== session.generation) return;
        if (host) {
          window.clearTimeout(session.connectTimer); session.connectTimer = 0; session.selfId = transport.randomHex();
          session.match = coop.create(transport.randomHex(), duel.shuffledOrder(words.length), { id: session.selfId, name: session.name, mode: session.mode });
          render();
        } else bind(peer.connect(prefix + session.room, { reliable: true, serialization: "json" }), generation);
        loop(generation);
      });
      peer.on("connection", conn => {
        if (generation !== session.generation) { conn.close(); return; }
        if (!host || !session.match || session.match.phase !== "lobby" || session.links.size >= coop.rules.maxPlayers - 1) {
          conn.on("open", () => { try { conn.send({ type: "busy" }); } finally { window.setTimeout(() => conn.close(), 200); } });
          conn.on("error", () => conn.close()); return;
        }
        bind(conn, generation);
      });
      peer.on("error", error => {
        if (generation !== session.generation) return;
        if (host && error.type === "peer-unavailable") return;
        if (session.links.size && ["network", "disconnected", "server-error", "socket-error"].includes(error.type)) return;
        stop(transport.errorText(error));
      });
      peer.on("disconnected", () => {
        if (generation === session.generation && !session.links.size) stop("接続サーバーとの通信が切れました。部屋を作り直してください。");
      });
    } catch { if (generation === session.generation) stop("通信機能を読み込めませんでした。もう一度お試しください。"); }
  }
  function chooseWeapon(weaponId) {
    if (session.match?.phase !== "lobby" || !duel.isWeapon(weaponId)) return;
    const packet = { type: "weapon", match: session.match.id, weaponId, settingsRevision: session.match.settingsRevision };
    if (session.host) { coop.chooseWeapon(session.match, 0, weaponId, packet.settingsRevision); publish(); }
    else toHost(packet);
  }
  function ready() {
    if (session.match?.phase !== "lobby") return;
    const packet = { type: "ready", match: session.match.id, value: !self().ready, settingsRevision: session.match.settingsRevision };
    if (session.host) { coop.ready(session.match, 0, packet.value, packet.settingsRevision); publish(); }
    else toHost(packet);
  }
  function start() {
    if (!session.host || !session.match) return false;
    const accepted = coop.start(session.match, 0, coop.stage.id, performance.now(), session.match.settingsRevision);
    if (accepted) { ui.Input.focus({ preventScroll: true }); publish(); }
    return accepted;
  }
  function again() {
    if (!session.host || session.match?.phase !== "finished") return;
    const old = session.match, connected = new Set([...session.links.values()].filter(l => l.joined).map(l => l.id));
    session.match = coop.create(transport.randomHex(), duel.shuffledOrder(words.length), old.players[0]);
    for (const player of old.players.slice(1)) if (connected.has(player.id)) coop.addPlayer(session.match, player);
    session.match.players.forEach(player => { player.weaponId = old.players.find(p => p.id === player.id).weaponId; });
    publish();
  }
  function canType() {
    const player = self();
    if (!session.active || session.match?.phase !== "fighting" || !player?.hp) return false;
    const view = session.host ? coop.snapshot(session.match).players[seat()] : player;
    const releasing = session.defensePending?.action === "guard-end";
    if ((view.guarding && !releasing) || view.countering || view.attackWaitMs !== null || (session.defensePending && !releasing)) return false;
    return session.localValue !== duel.targetFor(duel.wordFor(session.match, words, player.index, seat()), player.mode, session.localValue);
  }
  function input(value) {
    if (!canType()) return false;
    const player = self(), word = duel.wordFor(session.match, words, player.index, seat());
    if (typeof value !== "string" || !duel.targetFor(word, player.mode, value).startsWith(value)) { window.GAME_SOUND.play("miss"); return false; }
    const packet = { type: "input", match: session.match.id, index: player.index, seq: ++session.seq, value, pending: session.pending };
    if (session.host && !coop.acceptInput(session.match, words, seat(), packet, performance.now())) return false;
    session.localValue = value;
    if (session.host) publish(); else { toHost(packet); render(); }
    window.GAME_SOUND.play("typing"); return true;
  }
  function applyKana(value) {
    if (!canType() || session.mode !== "kana") return false;
    const word = duel.wordFor(session.match, words, self().index, seat());
    const pending = window.JAPANESE_INPUT.pendingPrefix(value, { reading: word.reading });
    if (!word.reading.startsWith(value) && pending === null) { window.GAME_SOUND.play("miss"); return false; }
    session.kanaValue = value; session.pending = pending !== null; return input(pending ?? value);
  }
  function defense(action) {
    const player = self();
    if (!session.active || session.match?.phase !== "fighting" || !player?.hp) return false;
    const partial = session.localValue && session.localValue !== duel.targetFor(duel.wordFor(session.match, words, player.index, seat()), player.mode, session.localValue);
    if (action === "guard-start" && player.weaponId === "greatsword" && (partial || session.pending)) return false;
    const packet = { type: "defense", match: session.match.id, seq: ++session.defenseSeq, action };
    if (session.host) { const accepted = coop.defense(session.match, words, seat(), packet, performance.now()); publish(); return accepted; }
    session.defensePending = packet; toHost(packet); render(); return true;
  }
  function pressDefense(source) {
    if (session.held.has(source) || !self()) return;
    const first = !session.held.size; session.held.add(source);
    const kind = duel.weapons[self().weaponId].defense;
    if (first && kind !== "none") defense(kind === "guard" ? "guard-start" : "counter");
  }
  function releaseDefense(source) {
    if (!session.held.delete(source) || session.held.size) return;
    if (self() && duel.weapons[self().weaponId].defense === "guard") defense("guard-end");
  }
  function releaseAll() { for (const source of [...session.held]) releaseDefense(source); cancelGesture(); }
  function createCard() {
    const card = document.createElement("article"); card.className = "online-fighter coop-player";
    const image = document.createElement("img"), info = document.createElement("div"), name = document.createElement("h3"), weapon = document.createElement("p");
    const hp = document.createElement("strong"), bar = document.createElement("progress"), label = document.createElement("p"), energy = document.createElement("p");
    const effect = document.createElement("span"); effect.className = "online-defense-effect"; effect.hidden = true; effect.setAttribute("role", "img");
    card.appendChild(effect); card.appendChild(image); card.appendChild(info);
    for (const el of [name, weapon, hp, bar, energy, label]) info.appendChild(el);
    label.className = "coop-player-state"; energy.className = "coop-energy";
    ui.Players.appendChild(card);
    return { card, image, name, weapon, hp, bar, label, energy, effect, before: null, attackUntil: 0, hurtUntil: 0, effectUntil: 0 };
  }
  function render() {
    const match = session.match && (session.host ? coop.snapshot(session.match) : session.match), player = match?.players[seat()];
    const lobby = match?.phase === "lobby", fighting = match?.phase === "fighting", finished = match?.phase === "finished";
    ui.Screen.dataset.phase = match?.phase || "room";
    ui.Lobby.hidden = Boolean(session.peer || session.connectTimer); ui.Party.hidden = !player;
    ui.Create.disabled = ui.Join.disabled = Boolean(session.peer || session.connectTimer);
    ui.Room.hidden = !match || fighting; ui.Code.textContent = session.room.replace(/(\d{4})(\d{4})/, "$1 $2");
    if (!player) return;
    const newMatch = session.localMatch !== match.id;
    const fresh = newMatch || session.localIndex !== player.index;
    if (newMatch) {
      session.defenseSeq = player.defenseSeq; session.defensePending = null; session.held.clear();
    }
    if (fresh) {
      session.localMatch = match.id; session.localIndex = player.index; session.localValue = session.kanaValue = player.value;
      session.pending = false; session.seq = player.seq; cancelGesture();
    }
    ui.Count.textContent = `${match.players.length} / ${coop.rules.maxPlayers}`;
    ui.Loadout.hidden = !lobby; ui.Weapon.value = player.weaponId;
    ui.Ready.textContent = player.ready ? "準備を解除" : "準備完了にする";
    ui.Stages.hidden = !session.host || !coop.canStart(match);
    ui.Again.hidden = !finished || !session.host;
    ui.Battle.hidden = lobby; ui.Clock.hidden = !fighting;
    const seconds = Math.ceil(match.remainingMs / 1000);
    ui.Clock.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    status(lobby ? match.players.length < coop.rules.minPlayers ? "参加待ち（2〜4人）" : coop.canStart(match)
      ? session.host ? "全員準備完了" : "ホストのステージ選択待ち" : `準備完了 ${match.players.filter(p => p.ready).length} / ${match.players.length}`
      : finished && !session.host ? "ホストが武器選択に戻るのを待っています" : "");
    for (const [id, card] of cards) if (!match.players.some(p => p.id === id)) { card.card.remove(); cards.delete(id); }
    const now = performance.now(), attack = match.boss?.attack;
    for (const p of match.players) {
      if (!cards.has(p.id)) cards.set(p.id, createCard());
      const card = cards.get(p.id), before = card.before, targeted = Boolean(attack?.targets.includes(p.id));
      if (before?.match === match.id) {
        if (before.hp > p.hp) card.hurtUntil = now + 350;
        if (before.attacks < p.attacks || before.counterHits < p.counterHits) { card.attackUntil = now + 350; window.GAME_SOUND.play("impact"); }
        if (before.feedbackId < p.feedbackId && ["guard", "justGuard", "counter"].includes(p.feedback)) {
          card.effectUntil = now + 650; card.effect.dataset.effect = p.feedback;
          card.effect.setAttribute("aria-label", p.feedback === "counter" ? "カウンター" : p.feedback === "justGuard" ? "ジャストガード" : "ガード");
        }
      }
      card.name.textContent = `${match.players.indexOf(p) + 1}. ${p.name}${p.id === session.selfId ? "（あなた）" : ""}`;
      card.name.setAttribute("title", card.name.textContent);
      card.weapon.textContent = duel.weapons[p.weaponId].name;
      card.hp.textContent = `${p.hp} / ${p.maxHp}`; card.hp.hidden = card.bar.hidden = lobby;
      card.bar.max = p.maxHp; card.bar.value = p.hp; card.bar.setAttribute("aria-label", p.name + "の体力");
      card.energy.hidden = !fighting || p.weaponId !== "sword"; card.energy.textContent = `気 ${p.counterEnergy}％`;
      card.label.textContent = lobby ? p.ready ? "準備完了" : "武器選択中" : !p.hp ? "戦闘不能" : targeted ? attack.kind === "single" ? "狙われています" : "全体攻撃" : "";
      card.card.classList.toggle("is-targeted", targeted); card.card.classList.toggle("is-down", !p.hp);
      card.card.classList.toggle("is-ready", lobby && p.ready); card.card.classList.toggle("is-guarding", p.guarding);
      card.card.classList.toggle("is-countering", p.countering); card.card.classList.toggle("is-hurt", now < card.hurtUntil);
      card.card.classList.toggle("is-attacking", now < card.attackUntil); card.card.dataset.weapon = p.weaponId;
      card.effect.hidden = now >= card.effectUntil;
      const assets = getPlayerWeaponAssets(p.weaponId), value = p.id === player.id ? session.localValue : p.value;
      const target = duel.targetFor(duel.wordFor(match, words, p.index, match.players.indexOf(p)), p.mode, value);
      const charge = Math.min(2, Math.floor(value.length / target.length * 2.5));
      const src = now < card.attackUntil ? assets.strike : p.guarding ? assets.guard : p.countering || p.attackWaitMs !== null ? assets.windup : assets.charge?.[charge] || assets.idle;
      if (card.image.getAttribute("src") !== src) card.image.setAttribute("src", src);
      card.image.alt = duel.weapons[p.weaponId].name;
      card.before = { ...p, match: match.id };
    }
    if (match.boss) {
      ui.BossHp.textContent = `${match.boss.hp} / ${match.boss.maxHp}`; ui.BossBar.max = match.boss.maxHp; ui.BossBar.value = match.boss.hp;
      ui.Boss.dataset.attack = attack?.kind || ""; ui.Boss.classList.toggle("is-defeated", match.boss.hp === 0);
      const target = attack?.kind === "single" && match.players.find(p => p.id === attack.targets[0]);
      ui.Target.textContent = attack ? target ? `単体攻撃 → ${match.players.indexOf(target) + 1}. ${target.name}${target.id === session.selfId ? "（あなた）" : ""}` : "全体攻撃 → 全員" : "";
      ui.AttackBar.hidden = !attack; ui.AttackBar.max = coop.rules.warningMs; ui.AttackBar.value = attack ? coop.rules.warningMs - attack.remainingMs : 0;
    }
    ui.Input.hidden = !fighting; ui.InputLabel.textContent = player.hp ? "あなたの入力" : "戦闘不能";
    const word = duel.wordFor(match, words, player.index, seat()), target = duel.targetFor(word, player.mode, session.localValue);
    const showWord = fighting && player.hp > 0;
    ui.Word.textContent = showWord ? word.text : ""; ui.Typed.textContent = showWord ? session.localValue : "";
    ui.Remaining.textContent = showWord ? target.slice(session.localValue.length) : "";
    ui.Input.classList.toggle("is-complete", showWord && session.localValue === target);
    ui.Next.hidden = !showWord || player.weaponId !== "dualBlades";
    const next = duel.wordFor(match, words, player.index + 1, seat());
    ui.NextWord.textContent = ui.Next.hidden ? "" : next.text; ui.NextTarget.textContent = ui.Next.hidden ? "" : duel.targetFor(next, player.mode);
    const kind = duel.weapons[player.weaponId].defense;
    ui.Defense.hidden = !showWord || kind === "none";
    ui.Defense.textContent = (kind === "counter" ? "カウンター" : "ガード") + (player.mode === "roman" ? " ［Space］" : "");
    ui.Defense.disabled = Boolean(session.defensePending || (kind === "counter" && (player.counterEnergy < duel.rules.counterMaxEnergy || player.counterWaitMs))
      || (player.weaponId === "greatsword" && ((session.localValue && session.localValue !== target) || session.pending)));
    ui.Defense.setAttribute("aria-pressed", String(player.guarding || player.countering));
    ui.Controls.hidden = !showWord || player.mode !== "kana";
    ui.Entry.querySelector("output").textContent = session.kanaValue; ui.Entry.classList.toggle("is-pending", session.pending);
    const available = canType(); ui.Erase.disabled = !available || !session.kanaValue;
    keys.forEach(({ button, definition }) => { button.disabled = !available || Boolean(definition.action && !getGameFlickModified(session.kanaValue.at(-1), definition.action)); });
    ui.Banner.hidden = !finished && match.phase !== "countdown";
    ui.Banner.textContent = match.phase === "countdown" ? String(match.countdown) : finished ? { victory: "巨人討伐 成功！", defeat: "討伐失敗", aborted: "参加者が退出したため中止しました" }[match.outcome] : "";
  }
  function cancelGesture() {
    const gesture = session.gesture; session.gesture = null; window.clearTimeout(gesture?.timer); ui.FlickPopup.hidden = true;
    if (gesture) { gesture.button.classList.remove("is-pressed"); if (gesture.button.hasPointerCapture?.(gesture.id)) gesture.button.releasePointerCapture(gesture.id); }
  }
  function kanaKey(definition, direction = 0) {
    if (definition.action) {
      const value = getGameFlickModified(session.kanaValue.at(-1), definition.action);
      if (value) applyKana(session.kanaValue.slice(0, -1) + value);
    } else if (definition.kana[direction]) applyKana(session.kanaValue + definition.kana[direction]);
  }
  function showChoices(gesture) {
    const rect = gesture.button.getBoundingClientRect();
    ui.FlickPopup.style.left = Math.max(4, Math.min(window.innerWidth - 184, rect.left + rect.width / 2 - 90)) + "px";
    ui.FlickPopup.style.top = Math.max(4, Math.min(window.innerHeight - 166, rect.top + rect.height / 2 - 81)) + "px";
    choices.forEach((choice, i) => { choice.textContent = gesture.definition.kana?.[i] || ""; choice.hidden = !choice.textContent; choice.classList.toggle("is-selected", i === gesture.direction); });
    ui.FlickPopup.hidden = false;
  }
  for (let i = 0; i < 5; i++) {
    const choice = document.createElement("span"); choice.className = "game-flick-choice"; choice.dataset.direction = String(i); choices.push(choice); ui.FlickPopup.appendChild(choice);
  }
  for (const definition of gameFlickKeys) {
    const button = document.createElement("button"); button.type = "button"; button.className = "game-flick-key";
    button.textContent = definition.label; button.dataset.flickKey = definition.id; button.setAttribute("aria-label", definition.description || definition.kana.filter(Boolean).join(" "));
    button.addEventListener("pointerdown", event => {
      if (event.isPrimary === false) { cancelGesture(); return; }
      if (event.button > 0 || !canType() || session.gesture) return;
      event.preventDefault(); button.setPointerCapture?.(event.pointerId); button.classList.add("is-pressed");
      const gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, direction: 0, definition, button, index: session.localIndex, match: session.localMatch };
      session.gesture = gesture;
      if (definition.kana?.length > 1) gesture.timer = window.setTimeout(() => { if (session.gesture === gesture) showChoices(gesture); }, 300);
    });
    button.addEventListener("pointermove", event => {
      const gesture = session.gesture; if (!gesture || gesture.id !== event.pointerId) return;
      event.preventDefault(); gesture.direction = gameFlickDirection(event.clientX - gesture.x, event.clientY - gesture.y);
      if (gesture.direction > 0 && definition.kana?.length > 1) showChoices(gesture);
    });
    button.addEventListener("pointerup", event => {
      const gesture = session.gesture; if (!gesture || gesture.id !== event.pointerId) return;
      event.preventDefault(); const direction = gameFlickDirection(event.clientX - gesture.x, event.clientY - gesture.y); cancelGesture();
      if (gesture.index === session.localIndex && gesture.match === session.localMatch && direction >= 0 && (!definition.action || direction === 0)) kanaKey(definition, definition.kana?.length === 1 ? 0 : direction);
    });
    for (const event of ["pointercancel", "lostpointercapture"]) button.addEventListener(event, cancelGesture);
    button.addEventListener("click", event => { if (!event.detail) kanaKey(definition); });
    button.addEventListener("contextmenu", event => event.preventDefault());
    keys.push({ button, definition }); ui.Keyboard.appendChild(button);
  }
  for (const type of ["touchstart", "touchmove", "touchend", "gesturestart", "gesturechange", "gestureend"]) {
    ui.Keyboard.addEventListener(type, event => { if (event.cancelable) event.preventDefault(); }, { passive: false });
  }
  ui.Button.addEventListener("click", open); ui.Back.addEventListener("click", leave);
  ui.Create.addEventListener("click", () => connect(true)); ui.Join.addEventListener("click", () => connect(false));
  ui.RoomInput.addEventListener("keydown", event => { if (event.key === "Enter" && !event.isComposing) { event.preventDefault(); connect(false); } });
  ui.Weapon.addEventListener("change", () => chooseWeapon(ui.Weapon.value)); ui.Ready.addEventListener("click", ready);
  ui.Start.addEventListener("click", start); ui.Again.addEventListener("click", again);
  ui.Copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(session.room); status("部屋番号をコピーしました"); }
    catch { status("表示された部屋番号を仲間に伝えてください。"); }
  });
  ui.Erase.addEventListener("click", () => applyKana(session.kanaValue.slice(0, -1)));
  ui.Defense.addEventListener("pointerdown", event => {
    if (event.button > 0 || ui.Defense.disabled) return;
    event.preventDefault(); ui.Defense.setPointerCapture?.(event.pointerId); pressDefense("pointer:" + event.pointerId);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) ui.Defense.addEventListener(type, event => releaseDefense("pointer:" + event.pointerId));
  ui.Defense.addEventListener("click", event => {
    if (event.detail || ui.Defense.disabled) return;
    if (session.held.has("accessible")) releaseDefense("accessible"); else pressDefense("accessible");
    if (duel.weapons[self().weaponId].defense === "counter") releaseDefense("accessible");
  });
  ui.Defense.addEventListener("contextmenu", event => event.preventDefault());
  document.addEventListener("keydown", event => {
    if (!session.active || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || event.target?.closest?.("input,textarea,select")) return;
    if (event.key === "Escape") { event.preventDefault(); leave(); return; }
    if ([" ", "ArrowDown"].includes(event.key) && session.match?.phase === "fighting") { event.preventDefault(); if (!event.repeat) pressDefense(event.key); return; }
    if (event.key === "Enter" && session.match?.phase === "fighting") { event.preventDefault(); return; }
    if (session.mode !== "roman" || !canType()) return;
    if (event.key === "Backspace") { event.preventDefault(); input(session.localValue.slice(0, -1)); return; }
    const character = getTypingCharacterFromKey(event); if (character) { event.preventDefault(); input(session.localValue + character); }
  });
  document.addEventListener("keyup", event => { if ([" ", "ArrowDown"].includes(event.key)) releaseDefense(event.key); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) releaseAll(); });
  window.addEventListener("blur", releaseAll); window.addEventListener("pagehide", () => { close(); session.active = false; });
  window.COOP_PLAY = { open, leave, close() { close(); session.active = false; }, connect, chooseWeapon, ready, start, again,
    input, applyKana, defense, get active() { return session.active; }, get session() { return session; } };
})();
