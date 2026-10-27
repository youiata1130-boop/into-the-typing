(() => {
  const duel = window.ONLINE_DUEL;
  const transport = window.ONLINE_CONNECTION;
  const npc = window.ONLINE_NPC;
  const words = duel.makeWords(wordSets.ja, getWordInputs, window.JAPANESE_INPUT);
  const protocol = duel.signature(words);
  const $ = id => document.querySelector("#" + id);
  const ui = {
    screen: $("onlineScreen"), enter: $("onlineButton"), back: $("onlineBack"), lobby: $("onlineLobby"),
    name: $("onlineName"), roomInput: $("onlineRoomInput"), create: $("onlineCreate"), join: $("onlineJoin"),
    status: $("onlineStatus"), room: $("onlineRoom"), code: $("onlineCode"), copy: $("onlineCopy"),
    ready: $("onlineReady"), arena: $("onlineArena"), banner: $("onlineBanner"), clock: $("onlineClock"),
    target: $("onlineTarget"), typed: $("onlineTyped"), remaining: $("onlineRemaining"),
    opponentTarget: $("onlineOpponentTarget"), opponentTyped: $("onlineOpponentTyped"), opponentRemaining: $("onlineOpponentRemaining"),
    opponentCount: $("onlineOpponentCount"), opponentProgress: $("onlineOpponentProgress"),
    input: $("onlineInput"), keyboard: $("onlineKeyboard"), entry: $("onlineEntry"), erase: $("onlineErase"),
    popup: $("onlineFlickPopup"), setup: $("onlineSetup"), battleMode: $("onlineBattleMode"),
    weapon: $("onlineWeapon"), weaponLabel: $("onlineWeaponLabel"), next: $("onlineNext"), opponent: $("onlineOpponent"),
    nextTranslation: $("onlineNextTranslation"), nextTarget: $("onlineNextTarget"),
    defense: $("onlineDefense"), touchDefense: $("onlineTouchDefense"), damageRule: $("onlineDamageRule"),
    handicapRatio: $("onlineHandicapRatio"), handicapSeat: $("onlineHandicapSeat"), handicapSeatLabel: $("onlineHandicapSeatLabel"),
    handicapHost: $("onlineHandicapHost"), handicapGuest: $("onlineHandicapGuest"),
    title: $("onlineTitle"), battleModeLabel: $("onlineBattleModeLabel"), handicapRatioLabel: $("onlineHandicapRatioLabel"),
    npcEnter: $("npcButton"), npcStart: $("npcStart"), npcSettings: $("npcSettings"),
    npcWeapon: $("npcWeapon"), npcHp: $("npcHp"), npcSpeed: $("npcSpeed"),
    npcFields: ["npcWeapon", "npcWeaponLabel", "npcHp", "npcHpLabel", "npcSpeed", "npcSpeedLabel"].map($),
    players: ["Self", "Other"].map(side => ({ card: $("online" + side), name: $("online" + side + "Name"),
      hp: $("online" + side + "Hp"), bar: $("online" + side + "Bar"), image: $("online" + side + "Image"), effect: $("online" + side + "Effect") })),
  };
  const session = { active: false, generation: 0, peer: null, conn: null, host: false, seat: 0, match: null,
    room: "", mode: "roman", name: "", remote: null, timer: 0, connectTimer: 0, lastSeen: 0, lastSent: 0,
    seq: 0, localValue: "", localIndex: -1, localMatch: "", kanaValue: "", pending: false,
    votes: [false, false], gesture: null, readyPending: false, lastRendered: null,
    battleMode: "simple", weaponId: "sword", handicapRatio: 1, handicapSeat: 1,
    opponent: "online", npcConfig: { weaponId: "sword", hp: 1000, speed: 3 }, npcBot: null, npcPausedAt: null,
    defenseSeq: 0, defensePending: null, held: new Set(), visual: [{}, {}] };
  const keyboardButtons = [];
  const popupChoices = [];
  function status(message) { ui.status.textContent = message; }
  function send(packet) {
    if (session.opponent === "npc") return false;
    if (!session.conn?.open) return false;
    try { session.conn.send(packet); return true; }
    catch { stop("通信が切れました。部屋を作り直してください。"); return false; }
  }
  function close(notify = true) {
    const conn = session.conn, peer = session.peer;
    session.generation++;
    session.conn = null; session.peer = null;
    window.clearTimeout(session.timer); window.clearTimeout(session.connectTimer);
    session.timer = session.connectTimer = 0;
    cancelGesture();
    if (notify && conn?.open) { try { conn.send({ type: "leave" }); } catch {} }
    conn?.close(); peer?.destroy();
    session.match = null; session.remote = null; session.room = "";
    session.localMatch = ""; session.localIndex = -1; session.localValue = ""; session.kanaValue = "";
    session.votes = [false, false]; session.readyPending = false; session.lastRendered = null;
    session.defenseSeq = 0; session.defensePending = null; session.held.clear(); session.visual = [{}, {}];
    session.npcBot = null; session.npcPausedAt = null;
  }
  function stop(message) {
    close(false);
    render(); status(message);
  }
  function leave() {
    close(); session.active = false;
    showStartScreen();
  }
  function open(opponent = "online") {
    if (!assetLoadingState.ready) return;
    const sources = imageSources(Object.keys(duel.weapons).map(id => Object.values(getPlayerWeaponAssets(id))));
    if (ensureGameAssets(sources, () => open(opponent))) return;
    close(); session.active = true;
    session.opponent = opponent === "npc" ? "npc" : "online";
    session.mode = flickState.enabled ? "kana" : "roman";
    ui.name.value = state.playerName || "プレイヤー";
    ui.roomInput.value = "";
    ui.players.forEach(player => { player.image.src = getPlayerWeaponAssets("sword").idle; });
    showScreen("online"); render(); status("");
    (session.opponent === "npc" ? ui.npcStart : ui.create).focus({ preventScroll: true });
  }
  function setNpcConfig(config) {
    if (!session.active || session.opponent !== "npc" || session.match || !npc.validConfig(config)) return false;
    session.npcConfig = { weaponId: config.weaponId, hp: config.hp, speed: config.speed };
    render(); return true;
  }
  function startNpc() {
    if (!session.active || session.opponent !== "npc" || (session.match && session.match.phase !== "finished")
        || !npc.validConfig(session.npcConfig)) return false;
    close(); session.host = true; session.seat = 0;
    session.name = cleanName(ui.name.value);
    session.match = npc.createMatch(transport.randomHex(), duel.shuffledOrder(words.length), session.name,
      session.mode, session.weaponId, session.npcConfig);
    session.npcBot = npc.create(session.match, session.npcConfig);
    const now = performance.now();
    duel.ready(session.match, 0, now); duel.ready(session.match, 1, now);
    session.lastSent = 0; render(); status("");
    if (document.hidden) session.npcPausedAt = now;
    else loop(session.generation);
    return true;
  }
  function npcSettings() {
    if (!session.active || session.opponent !== "npc" || session.match?.phase !== "finished") return;
    close(); render(); status(""); ui.npcStart.focus({ preventScroll: true });
  }
  function cleanName(value) { return value.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 20) || "プレイヤー"; }
  function newMatch(autoReady = false) {
    session.match = duel.create(transport.randomHex(), duel.shuffledOrder(words.length),
      [session.name, session.remote.name], [session.mode, session.remote.mode],
      { battleMode: session.battleMode, weapons: [session.weaponId, session.remote.weaponId],
        handicapRatio: session.handicapRatio, handicapSeat: session.handicapSeat });
    session.votes = [false, false]; session.readyPending = false;
    if (autoReady) {
      duel.ready(session.match, 0, performance.now());
      duel.ready(session.match, 1, performance.now());
    }
    publish();
  }
  function publish() {
    if (!session.match) return;
    send({ type: "state", match: duel.snapshot(session.match) });
    render();
  }
  function acceptState(match) {
    if (!duel.validSnapshot(match, words)) return;
    if (session.match?.id === match.id && match.revision < session.match.revision) return;
    if (session.match && session.match.id !== match.id && session.match.phase !== "finished") return;
    if (session.match?.id !== match.id || session.match.settingsRevision !== match.settingsRevision) {
      session.votes = [false, false]; session.readyPending = false;
    }
    session.match = match;
    session.battleMode = match.battleMode;
    session.weaponId = match.players[session.seat].weaponId;
    session.handicapRatio = match.handicapRatio; session.handicapSeat = match.handicapSeat;
    render();
  }
  function vote(seat) {
    if (session.match?.phase !== "finished") return;
    session.votes[seat] = true;
    if (session.votes.every(Boolean)) newMatch(true);
    else { send({ type: "votes", match: session.match.id, votes: session.votes }); render(); }
  }
  function receive(packet) {
    if (session.opponent === "npc") return;
    if (!packet || typeof packet !== "object" || typeof packet.type !== "string") return;
    if (packet.type === "leave") { stop("相手が退出しました。"); return; }
    if (packet.type === "busy") { stop("この部屋は対戦中です。"); return; }
    if (packet.type === "mismatch") { stop("ゲームを再読み込みしてから接続してください。"); return; }
    if (packet.type === "ping") { send({ type: "pong" }); return; }
    if (packet.type === "pong") return;
    if (packet.type === "hello") {
      if (packet.protocol !== protocol) { send({ type: "mismatch" }); stop("ゲームを再読み込みしてから接続してください。"); return; }
      if (session.remote || typeof packet.name !== "string" || packet.name.length > 20 || !["kana", "roman"].includes(packet.mode)
          || (packet.weaponId !== undefined && !duel.isWeapon(packet.weaponId))) return;
      session.remote = { name: cleanName(packet.name), mode: packet.mode, weaponId: packet.weaponId ?? "sword" };
      window.clearTimeout(session.connectTimer); session.connectTimer = 0;
      if (session.host) newMatch();
      status("対戦相手が参加しました"); render();
      return;
    }
    if (!session.remote) return;
    if (packet.type === "state" && !session.host) { acceptState(packet.match); return; }
    if (!session.match || packet.match !== session.match.id) return;
    if (packet.type === "input" && session.host) {
      if (duel.acceptInput(session.match, words, 1, packet, performance.now())) publish();
      else send({ type: "input-rejected", match: session.match.id, index: packet.index, seq: packet.seq,
        value: session.match.players[1].value });
    } else if (packet.type === "input-rejected" && !session.host && packet.index === session.localIndex
        && packet.seq === session.seq && typeof packet.value === "string" && packet.value.length <= 40
        && duel.targetFor(duel.wordFor(session.match, words, packet.index, session.seat), session.mode, packet.value).startsWith(packet.value)) {
      session.localValue = session.kanaValue = packet.value; session.pending = false; render();
    } else if (packet.type === "weapon" && session.host) {
      if (duel.chooseWeapon(session.match, 1, packet.weaponId)) {
        session.remote.weaponId = packet.weaponId; session.readyPending = false; publish();
      }
    } else if (packet.type === "defense" && session.host) {
      duel.defense(session.match, words, 1, packet, performance.now());
      publish(); send({ type: "defense-ack", match: session.match.id, seq: packet.seq });
    } else if (packet.type === "defense-ack" && !session.host && packet.seq === session.defensePending?.seq) {
      session.defensePending = null; render();
    } else if (packet.type === "ready" && session.host) {
      if (Number.isSafeInteger(packet.settingsRevision)) duel.ready(session.match, 1, performance.now(), packet.settingsRevision);
      publish();
    } else if (packet.type === "again" && session.host) vote(1);
    else if (packet.type === "votes" && !session.host && session.match.phase === "finished"
        && Array.isArray(packet.votes) && packet.votes.length === 2 && packet.votes.every(value => typeof value === "boolean")) {
      session.votes = packet.votes; render();
    }
  }
  function bindConnection(conn, generation) {
    session.conn = conn;
    conn.on("open", () => {
      if (session.generation !== generation) { conn.close(); return; }
      session.lastSeen = performance.now(); session.lastSent = 0;
      send({ type: "hello", protocol, name: session.name, mode: session.mode, weaponId: session.weaponId });
      window.clearTimeout(session.connectTimer);
      session.connectTimer = window.setTimeout(() => stop("相手の応答がありません。もう一度接続してください。"), 15000);
      loop(generation);
    });
    let budgetAt = 0, packets = 0;
    conn.on("data", packet => {
      if (session.generation !== generation) return;
      const now = performance.now();
      if (now - budgetAt >= 1000) { budgetAt = now; packets = 0; }
      if (++packets > 200) { stop("通信内容を確認できなかったため対戦を終了しました。"); return; }
      // Limit untrusted payloads before processing names, indices or snapshots.
      try { if (JSON.stringify(packet).length > 20000) return; } catch { return; }
      session.lastSeen = now;
      receive(packet);
    });
    conn.on("close", () => { if (session.generation === generation) stop("通信が切れました。部屋を作り直してください。"); });
    conn.on("error", () => { if (session.generation === generation) stop("通信が切れました。部屋を作り直してください。"); });
  }
  function loop(generation) {
    if (generation !== session.generation || !session.active) return;
    const now = performance.now();
    if (session.opponent === "npc") {
      if (!session.match || !session.npcBot || session.npcPausedAt !== null) return;
      const revision = session.match.revision;
      npc.step(session.npcBot, session.match, words, now);
      duel.tick(session.match, words, now);
      if (revision !== session.match.revision || now - session.lastSent >= 250) {
        session.lastSent = now; render();
      }
      if (session.match.phase === "finished") {
        session.timer = window.setTimeout(() => {
          if (generation === session.generation) { render(); session.timer = 0; }
        }, 750);
      } else session.timer = window.setTimeout(() => loop(generation), 50);
      return;
    }
    if (!session.conn?.open) return;
    if (now - session.lastSeen > 12000) { stop("相手との通信が途切れました。部屋を作り直してください。"); return; }
    if (session.host && session.match) {
      const revision = session.match.revision;
      duel.tick(session.match, words, now);
      const activeAttack = session.match.players.some(player => player.attackAt !== null || player.counterStartedAt !== null);
      if (revision !== session.match.revision || now - session.lastSent >= (activeAttack ? 50 : 250)) {
        session.lastSent = now; publish();
      }
    } else if (now - session.lastSent >= 1000) {
      session.lastSent = now; send({ type: "ping" });
    }
    session.timer = window.setTimeout(() => loop(generation), 50);
  }
  async function connect(host) {
    if (!session.active || session.opponent === "npc" || session.peer || session.connectTimer) return;
    const room = ui.roomInput.value.normalize("NFKC").replace(/[\s-]/g, "");
    if (!host && !/^\d{8}$/.test(room)) { status("8桁の部屋番号を入力してください。"); return; }
    close();
    session.host = host; session.seat = host ? 0 : 1;
    session.name = cleanName(ui.name.value); ui.name.value = session.name;
    const generation = session.generation;
    session.connectTimer = window.setTimeout(() => stop("接続できませんでした。通信環境を確認してもう一度お試しください。"), 25000);
    render(); status("接続中…");
    try {
      const Peer = await transport.load();
      if (generation !== session.generation || !session.active) return;
      session.room = host ? transport.roomNumber() : room;
      const peer = new Peer(host ? transport.prefix + session.room : undefined, transport.peerOptions);
      session.peer = peer;
      peer.on("open", () => {
        if (generation !== session.generation) return;
        if (host) {
          window.clearTimeout(session.connectTimer); session.connectTimer = 0;
          status("相手の参加を待っています"); render();
        } else bindConnection(peer.connect(transport.prefix + session.room, { reliable: true, serialization: "json" }), generation);
      });
      peer.on("connection", conn => {
        if (generation !== session.generation) { conn.close(); return; }
        if (!host || session.conn) {
          conn.on("open", () => { conn.send({ type: "busy" }); window.setTimeout(() => conn.close(), 200); });
          conn.on("error", () => conn.close());
          return;
        }
        window.clearTimeout(session.connectTimer);
        session.connectTimer = window.setTimeout(() => stop("接続できませんでした。部屋を作り直してください。"), 25000);
        bindConnection(conn, generation);
      });
      peer.on("error", error => {
        if (generation !== session.generation) return;
        if (session.conn?.open && ["network", "disconnected", "server-error", "socket-error"].includes(error.type)) return;
        stop(transport.errorText(error));
      });
      peer.on("disconnected", () => {
        if (generation === session.generation && !session.conn?.open) stop("対戦サーバーとの通信が切れました。部屋を作り直してください。");
      });
      render();
    } catch { if (generation === session.generation) stop("通信機能を読み込めませんでした。もう一度お試しください。"); }
  }
  function ready() {
    if (session.opponent === "npc") { if (session.match?.phase === "finished") startNpc(); return; }
    const match = session.match;
    if (!match || !session.conn?.open) return;
    if (match.phase === "finished") {
      if (session.votes[session.seat]) return;
      session.votes[session.seat] = true;
      if (session.host) vote(0); else send({ type: "again", match: match.id });
    } else if (match.phase === "lobby" && !session.readyPending) {
      session.readyPending = true;
      if (session.host) { duel.ready(match, 0, performance.now()); publish(); }
      else send({ type: "ready", match: match.id, settingsRevision: match.settingsRevision });
    }
    render();
  }
  function canType() {
    if (!session.active || session.match?.phase !== "fighting" || session.npcPausedAt !== null
        || (session.opponent !== "npc" && !session.conn?.open)) return false;
    const player = session.match.players[session.seat];
    const releasing = session.defensePending?.action === "guard-end";
    // The reliable channel delivers release before subsequent typing. Do not
    // discard the first character while waiting for the release acknowledgment.
    if (session.match.battleMode === "weapons" && ((player.guarding && !releasing) || player.countering
        || (session.host && player.counterStartedAt !== null && performance.now() - player.counterStartedAt <= duel.rules.defenseWindowMs)
        || (session.defensePending && !releasing) || (session.host ? player.attackAt !== null : player.attackWaitMs !== null))) return false;
    return session.localValue !== duel.targetFor(duel.wordFor(session.match, words, player.index, session.seat), player.mode, session.localValue);
  }
  function input(value) {
    if (!canType()) return false;
    const match = session.match, player = match.players[session.seat], word = duel.wordFor(match, words, player.index, session.seat);
    const target = duel.targetFor(word, player.mode, value);
    if (typeof value !== "string" || !target.startsWith(value)) { window.GAME_SOUND.play("miss"); return false; }
    const packet = { type: "input", match: match.id, index: player.index, seq: ++session.seq, value, pending: session.pending };
    if (session.host && !duel.acceptInput(match, words, 0, packet, performance.now())) return false;
    session.localValue = value;
    if (session.host) publish();
    else { send(packet); render(); }
    window.GAME_SOUND.play("typing");
    return true;
  }
  function applyKana(value) {
    if (!canType() || session.mode !== "kana") return false;
    const word = duel.wordFor(session.match, words, session.localIndex, session.seat);
    const parsed = { reading: word.reading };
    const pending = window.JAPANESE_INPUT.pendingPrefix(value, parsed);
    if (!word.reading.startsWith(value) && pending === null) { window.GAME_SOUND.play("miss"); return false; }
    session.kanaValue = value; session.pending = pending !== null;
    return input(pending ?? value);
  }
  function chooseWeapon(id) {
    if (!duel.isWeapon(id) || (session.match && session.match.phase !== "lobby")) return;
    if (!session.match) { session.weaponId = id; render(); return; }
    if (session.match.battleMode !== "weapons") return;
    session.readyPending = false;
    if (session.host) {
      if (duel.chooseWeapon(session.match, 0, id)) { session.weaponId = id; publish(); }
    } else send({ type: "weapon", match: session.match.id, weaponId: id });
  }
  function setHandicap(ratio, seat) {
    if (session.opponent === "npc") return false;
    if (!duel.validHandicap(ratio, seat) || ((session.peer || session.connectTimer) && !session.host)) return false;
    if (session.match) {
      if (!session.host || !duel.setHandicap(session.match, ratio, seat)) return false;
      session.readyPending = false;
    }
    session.handicapRatio = ratio; session.handicapSeat = seat;
    if (session.match) publish(); else render();
    return true;
  }
  function defense(action) {
    const match = session.match;
    if (!session.active || match?.battleMode !== "weapons" || match.phase !== "fighting" || session.npcPausedAt !== null
        || (session.opponent !== "npc" && !session.conn?.open)) return false;
    const player = match.players[session.seat];
    // Include kana which is still awaiting a dakuten/small-letter correction.
    const partial = session.localValue && session.localValue !== duel.targetFor(duel.wordFor(match, words, player.index, session.seat), player.mode, session.localValue);
    if (action === "guard-start" && player.weaponId === "greatsword" && (partial || session.pending)) return false;
    const packet = { type: "defense", match: match.id, seq: ++session.defenseSeq, action };
    if (session.host) {
      const accepted = duel.defense(match, words, 0, packet, performance.now());
      publish(); return accepted;
    }
    session.defensePending = packet;
    send(packet); render(); return true;
  }
  function pressDefense(source) {
    if (session.held.has(source)) return;
    const first = !session.held.size; session.held.add(source);
    if (!first || session.match?.battleMode !== "weapons") return;
    const kind = duel.weapons[session.match.players[session.seat].weaponId].defense;
    if (kind !== "none") defense(kind === "guard" ? "guard-start" : "counter");
  }
  function releaseDefense(source) {
    if (!session.held.delete(source) || session.held.size) return;
    if (session.match && duel.weapons[session.match.players[session.seat].weaponId].defense === "guard") defense("guard-end");
  }
  function releaseAll() {
    for (const source of [...session.held]) releaseDefense(source);
    cancelGesture();
  }
  function render() {
    const match = session.match && (session.host ? duel.snapshot(session.match) : session.match);
    const npcMode = session.opponent === "npc";
    const busy = Boolean(session.peer || session.connectTimer), weaponMode = npcMode || (match?.battleMode || session.battleMode) === "weapons";
    ui.damageRule.textContent = weaponMode ? "文字数に応じて変化" : String(duel.rules.damage);
    ui.title.textContent = npcMode ? "NPC戦" : "オンライン対戦";
    ui.battleMode.hidden = ui.battleModeLabel.hidden = npcMode;
    ui.handicapRatio.hidden = ui.handicapRatioLabel.hidden = npcMode;
    ui.npcFields.forEach(field => { field.hidden = !npcMode; });
    ui.npcWeapon.value = session.npcConfig.weaponId; ui.npcHp.value = String(session.npcConfig.hp); ui.npcSpeed.value = String(session.npcConfig.speed);
    ui.npcStart.hidden = !npcMode || Boolean(match);
    ui.npcSettings.hidden = !npcMode || match?.phase !== "finished";
    ui.setup.hidden = Boolean(match && match.phase !== "lobby");
    ui.battleMode.value = match?.battleMode || session.battleMode; ui.battleMode.disabled = busy;
    ui.weapon.hidden = ui.weaponLabel.hidden = !weaponMode;
    ui.weapon.value = match?.players[session.seat].weaponId || session.weaponId;
    ui.weapon.disabled = Boolean((match && match.phase !== "lobby") || (session.conn && !match));
    const handicapRatio = match?.handicapRatio ?? session.handicapRatio;
    ui.handicapRatio.value = String(handicapRatio);
    ui.handicapSeat.value = String(match?.handicapSeat ?? session.handicapSeat);
    ui.handicapRatio.disabled = ui.handicapSeat.disabled = Boolean((busy && !session.host) || (match && match.phase !== "lobby"));
    ui.handicapSeat.hidden = ui.handicapSeatLabel.hidden = npcMode || handicapRatio === 1;
    ui.handicapHost.textContent = match ? `${session.seat === 0 ? "あなた" : "相手"}：${match.players[0].name}` : "部屋を作る人";
    ui.handicapGuest.textContent = match ? `${session.seat === 1 ? "あなた" : "相手"}：${match.players[1].name}` : "参加する人";
    ui.screen.dataset.phase = match?.phase || "room";
    ui.screen.dataset.battleMode = weaponMode ? "weapons" : "simple";
    ui.lobby.hidden = npcMode || busy; ui.room.hidden = npcMode || !session.room;
    ui.code.textContent = session.room.replace(/(\d{4})(\d{4})/, "$1 $2");
    ui.create.disabled = ui.join.disabled = busy;
    ui.arena.hidden = !match;
    ui.ready.hidden = !match || !["lobby", "finished"].includes(match.phase);
    ui.keyboard.hidden = !match || match.phase !== "fighting" || session.mode !== "kana";
    ui.entry.hidden = ui.keyboard.hidden;
    if (!match) { ui.banner.textContent = ""; return; }
    const self = match.players[session.seat], other = match.players[1 - session.seat];
    ui.input.dataset.weapon = self.weaponId;
    if (session.localMatch !== match.id) {
      session.defenseSeq = self.defenseSeq; session.defensePending = null; session.held.clear(); session.visual = [{}, {}];
    }
    if (session.localMatch !== match.id || session.localIndex !== self.index) {
      session.localMatch = match.id; session.localIndex = self.index;
      session.localValue = self.value; session.kanaValue = self.value; session.pending = false;
      session.seq = self.seq; cancelGesture();
    } else if (self.seq >= session.seq) session.localValue = self.value;
    const selfWord = duel.wordFor(match, words, self.index, session.seat), otherWord = duel.wordFor(match, words, other.index, 1 - session.seat);
    const selfTarget = duel.targetFor(selfWord, self.mode, session.localValue), otherTarget = duel.targetFor(otherWord, other.mode, other.value);
    const showWords = match.phase === "fighting" || match.phase === "finished";
    ui.target.textContent = showWords ? selfWord.text : "";
    ui.typed.textContent = showWords ? session.localValue : "";
    ui.remaining.textContent = showWords ? selfTarget.slice(session.localValue.length) : "";
    ui.opponentTarget.textContent = showWords ? otherWord.text : "";
    ui.opponentTyped.textContent = showWords ? other.value : "";
    ui.opponentRemaining.textContent = showWords ? otherTarget.slice(other.value.length) : "";
    ui.opponentCount.textContent = showWords ? `${other.value.length} / ${otherTarget.length}文字` : "";
    ui.opponentProgress.max = showWords ? otherTarget.length : 1;
    ui.opponentProgress.value = showWords ? other.value.length : 0;
    ui.opponent.classList.toggle("is-striking", weaponMode && other.attackWaitMs !== null);
    ui.input.classList.toggle("is-complete", session.localValue === selfTarget);
    ui.entry.querySelector("output").textContent = session.kanaValue;
    ui.entry.classList.toggle("is-pending", session.pending);
    ui.next.hidden = !weaponMode || self.weaponId !== "dualBlades" || match.phase !== "fighting";
    const nextWord = duel.wordFor(match, words, self.index + 1, session.seat);
    ui.nextTranslation.textContent = ui.next.hidden ? "" : nextWord.text;
    ui.nextTarget.textContent = ui.next.hidden ? "" : duel.targetFor(nextWord, self.mode);
    const kind = duel.weapons[self.weaponId].defense;
    const hasDefense = weaponMode && kind !== "none" && match.phase === "fighting";
    ui.defense.hidden = !hasDefense || self.mode === "kana";
    ui.touchDefense.hidden = !hasDefense || self.mode !== "kana";
    const partial = session.localValue && session.localValue !== selfTarget;
    for (const button of [ui.defense, ui.touchDefense]) {
      button.textContent = self.defenseCost ? `防御コスト ${self.defenseCost}` : kind === "counter" ? "カウンター" : "ガード";
      if (button === ui.defense && !self.defenseCost) button.textContent += " ［Space］";
      button.disabled = Boolean(self.defenseCost || self.counterWaitMs || session.defensePending
        || (self.weaponId === "greatsword" && (partial || session.pending)));
      button.setAttribute("aria-pressed", String(self.guarding || self.countering));
    }
    ui.clock.textContent = `${Math.floor(Math.ceil(match.remainingMs / 1000) / 60)}:${String(Math.ceil(match.remainingMs / 1000) % 60).padStart(2, "0")}`;
    [self, other].forEach((player, index) => {
      const card = ui.players[index], before = session.lastRendered?.id === match.id ? session.lastRendered.players[index] : null;
      const weapon = duel.weapons[player.weaponId], visual = session.visual[index], now = performance.now();
      card.name.textContent = `${weaponMode ? weapon.name : index ? "相手" : "あなた"}：${player.name}`;
      card.name.setAttribute("title", `${index ? "相手" : "あなた"}：${player.name}${weaponMode ? " / " + weapon.name : ""}`);
      card.hp.textContent = `${player.hp} / ${player.maxHp}`;
      card.bar.max = player.maxHp; card.bar.value = player.hp;
      if (before && before.hp > player.hp && (!weaponMode || player.feedback === "hit")) visual.hurtUntil = now + 350;
      if (before && (before.attacks < player.attacks || before.counterHits < player.counterHits)) {
        visual.attackUntil = now + 350; window.GAME_SOUND.play("impact");
      }
      if (before && before.feedbackId < player.feedbackId && ["guard", "justGuard", "counter"].includes(player.feedback)) {
        visual.effectUntil = now + 650; visual.effect = player.feedback;
      }
      const attacking = now < visual.attackUntil;
      card.card.classList.toggle("is-hurt", now < visual.hurtUntil);
      card.card.classList.toggle("is-attacking", attacking);
      card.card.classList.toggle("is-guarding", player.guarding);
      card.card.classList.toggle("is-countering", player.countering);
      card.card.classList.toggle("is-winding", player.attackWaitMs !== null);
      card.card.dataset.weapon = player.weaponId;
      card.effect.hidden = !(now < visual.effectUntil);
      card.effect.dataset.effect = visual.effect || "";
      card.effect.setAttribute("aria-label", visual.effect === "justGuard" ? "ジャストガード" : visual.effect === "counter" ? "カウンター" : "ガード");
      const assets = getPlayerWeaponAssets(player.weaponId);
      const value = index ? player.value : session.localValue;
      const target = index ? otherTarget : selfTarget;
      const charge = player.weaponId === "greatsword" ? Math.min(2, Math.floor(value.length / target.length * 2.5)) : 0;
      const source = attacking ? assets.strike : player.guarding ? assets.guard : player.countering || player.attackWaitMs !== null ? assets.windup : assets.charge?.[charge] || assets.idle;
      if (card.image.getAttribute("src") !== source) card.image.setAttribute("src", source);
    });
    session.lastRendered = { id: match.id, players: [self, other].map(player => ({ hp: player.hp, attacks: player.attacks,
      feedbackId: player.feedbackId, counterHits: player.counterHits })) };
    let banner = "";
    if (match.phase === "lobby") banner = self.ready ? "相手の準備を待っています" : "準備ができたら開始";
    if (match.phase === "countdown") banner = String(match.countdown);
    if (match.phase === "finished") banner = match.winner === -1 ? "引き分け" : match.winner === session.seat ? "勝利！" : "敗北";
    ui.banner.textContent = banner; ui.banner.hidden = !banner;
    ui.screen.dataset.phase = match.phase;
    ui.ready.textContent = match.phase === "finished" ? (!npcMode && session.votes[session.seat] ? "相手の再戦を待っています" : "もう一度対戦") : (self.ready || session.readyPending ? "準備完了" : "準備完了にする");
    ui.ready.disabled = match.phase === "finished" ? session.votes[session.seat] : self.ready || session.readyPending;
    if (match.phase !== "lobby") status("");
    const available = canType();
    ui.erase.disabled = !available || !session.kanaValue;
    keyboardButtons.forEach(({ button, definition }) => {
      button.disabled = !available || Boolean(definition.action && !getGameFlickModified(session.kanaValue.at(-1), definition.action));
    });
  }
  function keydown(event) {
    if (!session.active || event.isComposing || event.ctrlKey || event.altKey || event.metaKey
        || event.target?.closest?.("input,textarea,select")) return;
    if (event.key === "Escape") { event.preventDefault(); leave(); return; }
    if ([" ", "ArrowDown"].includes(event.key) && session.match?.phase === "fighting") {
      event.preventDefault(); if (!event.repeat) pressDefense(event.key); return;
    }
    if (event.key === "Enter" && session.match?.phase === "fighting") { event.preventDefault(); return; }
    if (session.mode !== "roman" || !canType()) return;
    if (event.key === "Backspace") { event.preventDefault(); input(session.localValue.slice(0, -1)); return; }
    const character = getTypingCharacterFromKey(event);
    if (character) { event.preventDefault(); input(session.localValue + character); }
  }
  function cancelGesture() {
    const gesture = session.gesture; session.gesture = null;
    window.clearTimeout(gesture?.timer); ui.popup.hidden = true;
    if (gesture) { gesture.button.classList.remove("is-pressed"); if (gesture.button.hasPointerCapture?.(gesture.id)) gesture.button.releasePointerCapture(gesture.id); }
  }
  function kanaKey(definition, direction = 0) {
    if (definition.action) {
      const changed = getGameFlickModified(session.kanaValue.at(-1), definition.action);
      if (changed) applyKana(session.kanaValue.slice(0, -1) + changed);
    } else if (definition.kana[direction]) applyKana(session.kanaValue + definition.kana[direction]);
  }
  function showChoices(gesture) {
    const rect = gesture.button.getBoundingClientRect();
    ui.popup.style.left = Math.max(4, Math.min(window.innerWidth - 184, rect.left + rect.width / 2 - 90)) + "px";
    ui.popup.style.top = Math.max(4, Math.min(window.innerHeight - 166, rect.top + rect.height / 2 - 81)) + "px";
    popupChoices.forEach((choice, index) => {
      choice.textContent = gesture.definition.kana?.[index] || "";
      choice.hidden = !choice.textContent;
      choice.classList.toggle("is-selected", index === gesture.direction);
    });
    ui.popup.hidden = false;
  }
  function initializeKeyboard() {
    for (let i = 0; i < 5; i++) {
      const choice = document.createElement("span"); choice.className = "game-flick-choice"; choice.dataset.direction = String(i);
      popupChoices.push(choice); ui.popup.appendChild(choice);
    }
    for (const definition of gameFlickKeys) {
      const button = document.createElement("button");
      button.type = "button"; button.className = "game-flick-key"; button.dataset.flickKey = definition.id;
      button.textContent = definition.label; button.setAttribute("aria-label", definition.description || definition.kana.filter(Boolean).join(" "));
      button.addEventListener("pointerdown", event => {
        if (event.isPrimary === false) { cancelGesture(); return; }
        if (event.button > 0 || !canType() || session.gesture) return;
        event.preventDefault();
        const gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, direction: 0,
          definition, button, index: session.localIndex, match: session.localMatch };
        session.gesture = gesture; button.setPointerCapture?.(event.pointerId); button.classList.add("is-pressed");
        if (definition.kana?.length > 1) gesture.timer = window.setTimeout(() => { if (session.gesture === gesture) showChoices(gesture); }, 300);
      });
      button.addEventListener("pointermove", event => {
        const gesture = session.gesture; if (!gesture || gesture.id !== event.pointerId) return;
        event.preventDefault(); gesture.direction = gameFlickDirection(event.clientX - gesture.x, event.clientY - gesture.y);
        if (gesture.direction > 0 && definition.kana?.length > 1) showChoices(gesture);
      });
      button.addEventListener("pointerup", event => {
        const gesture = session.gesture; if (!gesture || gesture.id !== event.pointerId) return;
        event.preventDefault();
        const direction = gameFlickDirection(event.clientX - gesture.x, event.clientY - gesture.y);
        cancelGesture();
        if (gesture.index === session.localIndex && gesture.match === session.localMatch && direction >= 0
            && (!definition.action || direction === 0)) kanaKey(definition, definition.kana?.length === 1 ? 0 : direction);
      });
      for (const event of ["pointercancel", "lostpointercapture"]) button.addEventListener(event, cancelGesture);
      button.addEventListener("click", event => { if (!event.detail) kanaKey(definition); });
      button.addEventListener("contextmenu", event => event.preventDefault());
      keyboardButtons.push({ button, definition }); ui.keyboard.appendChild(button);
    }
    for (const type of ["touchstart", "touchmove", "touchend", "gesturestart", "gesturechange", "gestureend"]) {
      ui.keyboard.addEventListener(type, event => { if (event.cancelable) event.preventDefault(); }, { passive: false });
    }
  }
  ui.enter.addEventListener("click", () => open()); ui.back.addEventListener("click", leave);
  ui.npcEnter.addEventListener("click", () => open("npc")); ui.npcStart.addEventListener("click", startNpc);
  ui.npcSettings.addEventListener("click", npcSettings);
  for (const select of [ui.npcWeapon, ui.npcHp, ui.npcSpeed]) select.addEventListener("change", () => {
    setNpcConfig({ weaponId: ui.npcWeapon.value, hp: Number(ui.npcHp.value), speed: Number(ui.npcSpeed.value) });
  });
  ui.battleMode.addEventListener("change", () => {
    if (session.opponent === "npc" || session.peer || session.connectTimer || !["simple", "weapons"].includes(ui.battleMode.value)) return;
    session.battleMode = ui.battleMode.value; render();
  });
  ui.weapon.addEventListener("change", () => chooseWeapon(ui.weapon.value));
  for (const select of [ui.handicapRatio, ui.handicapSeat]) select.addEventListener("change", () => {
    setHandicap(Number(ui.handicapRatio.value), Number(ui.handicapSeat.value));
  });
  ui.create.addEventListener("click", () => connect(true)); ui.join.addEventListener("click", () => connect(false));
  ui.roomInput.addEventListener("keydown", event => { if (event.key === "Enter" && !event.isComposing) { event.preventDefault(); connect(false); } });
  ui.ready.addEventListener("click", ready);
  ui.copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(session.room); status("部屋番号をコピーしました"); }
    catch { status("表示された部屋番号を相手に伝えてください。"); }
  });
  ui.erase.addEventListener("click", () => applyKana(session.kanaValue.slice(0, -1)));
  for (const button of [ui.defense, ui.touchDefense]) {
    button.addEventListener("pointerdown", event => {
      if (event.button > 0 || button.disabled) return;
      event.preventDefault(); button.setPointerCapture?.(event.pointerId); pressDefense("pointer:" + event.pointerId);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) button.addEventListener(type, event => releaseDefense("pointer:" + event.pointerId));
    button.addEventListener("click", event => {
      if (event.detail || button.disabled) return;
      // Assistive-technology activation toggles a guard; pointer/keyboard hold releases normally.
      if (session.held.has("accessible")) releaseDefense("accessible"); else pressDefense("accessible");
      if (session.match && duel.weapons[session.match.players[session.seat].weaponId].defense === "counter") releaseDefense("accessible");
    });
    button.addEventListener("contextmenu", event => event.preventDefault());
  }
  document.addEventListener("keydown", keydown);
  document.addEventListener("keyup", event => { if ([" ", "ArrowDown"].includes(event.key)) releaseDefense(event.key); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseAll();
    if (session.opponent !== "npc" || !session.match || !["countdown", "fighting"].includes(session.match.phase)) return;
    const now = performance.now();
    if (document.hidden && session.npcPausedAt === null) {
      session.npcPausedAt = now; window.clearTimeout(session.timer); session.timer = 0;
    } else if (!document.hidden && session.npcPausedAt !== null) {
      npc.resume(session.npcBot, session.match, session.npcPausedAt, now);
      session.npcPausedAt = null; loop(session.generation);
    }
  });
  window.addEventListener("blur", releaseAll);
  window.addEventListener("pagehide", () => { close(); session.active = false; });
  initializeKeyboard();
  window.ONLINE_PLAY = { open, close() { close(); session.active = false; }, leave, connect, ready, input, applyKana, chooseWeapon, setHandicap, defense,
    setNpcConfig, startNpc, npcSettings,
    get active() { return session.active; }, get session() { return session; }, words, receive };
})();
