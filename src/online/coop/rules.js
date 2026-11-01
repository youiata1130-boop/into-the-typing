// Host-authoritative cooperative combat. Typing and weapon defenses share duel rules.
window.ONLINE_COOP = (() => {
  const duel = window.ONLINE_DUEL;
  const rules = Object.freeze({ maxPlayers: 4, minPlayers: 2, hp: 1000, giantHpPerPlayer: 500,
    attackIntervalMs: 6000, warningMs: 2500, singleDamage: 160, allDamage: 80, slowWords: 2, maxInputLength: 80 });
  const difficulties = Object.freeze({
    easy: Object.freeze({ name: "やさしい", giantHpPerPlayer: 350, attackIntervalMs: 8000, warningMs: 3000, singleDamage: 100, allDamage: 50 }),
    normal: Object.freeze({ name: "普通", giantHpPerPlayer: 500, attackIntervalMs: 6000, warningMs: 2500, singleDamage: 160, allDamage: 80 }),
    hard: Object.freeze({ name: "難しい", giantHpPerPlayer: 750, attackIntervalMs: 4500, warningMs: 1800, singleDamage: 240, allDamage: 120 }),
  });
  const isDifficulty = id => typeof id === "string" && Object.hasOwn(difficulties, id);
  const difficultyFor = match => difficulties[match.difficulty];
  const stage = Object.freeze({ id: "giant", name: "巨人討伐", enemyName: "岩の巨人",
    image: "src/assets/images/enemies/giant/idle.webp",
    windups: Object.freeze({ single: "src/assets/images/enemies/giant/windup-single.webp", all: "src/assets/images/enemies/giant/windup-all.webp" }),
    background: "src/assets/images/backgrounds/stages/mountain.webp" });
  const stages = Object.freeze({ giant: stage, octopus: Object.freeze({ id: "octopus", name: "タコの滝", enemyName: "タコツル草",
    image: "src/assets/images/enemies/octopus_plant/body-left-v2.webp",
    tentacle: "src/assets/images/enemies/octopus_plant/tentacle-left-v2.webp", windups: Object.freeze({}),
    background: "src/assets/images/backgrounds/stages/mountain.webp" }) });
  const isStage = id => typeof id === "string" && Object.hasOwn(stages, id);
  const stageFor = match => stages[match.stageId] || stage;
  const isSlowed = (player, index = player.index) => player.slowUntil > index && player.slowFrom <= index;
  const slowSentences = coopSlowSentences.map(word => ({ text: word.translation, roman: word.text,
    reading: word.reading, inputs: createJapaneseInputVariants(word.text) }));
  const slowWordPools = new WeakMap();
  function wordFor(match, words, index, seat = 0) {
    const word = duel.wordFor(match, words, index, seat);
    if (!isSlowed(match.players[seat], index)) return word;
    if (!slowWordPools.has(word)) {
      const length = Math.max(...word.inputs.map(input => input.length));
      const candidates = slowSentences.filter(sentence => sentence.reading.length > word.reading.length
        && sentence.inputs.every(input => input.length > length));
      const shortest = Math.min(...candidates.map(sentence => sentence.inputs[0].length));
      slowWordPools.set(word, candidates.filter(sentence => sentence.inputs[0].length <= shortest + 8)
        .map(sentence => ({ ...sentence, slow: true, normalWord: word })));
    }
    const pool = slowWordPools.get(word);
    const playerSeed = parseInt(match.players[seat].id.slice(-4), 16);
    return pool[(match.order[index % match.order.length] + index + playerSeed) % pool.length];
  }
  function attackProfile(word, mode, value = "") {
    const profile = duel.attackProfile(word, mode, value);
    // Extra typing delays the attack without increasing its damage or weapon windup.
    if (!word.slow) return profile;
    const normal = duel.attackProfile(word.normalWord, mode);
    return { ...profile, damage: normal.damage, windupMs: normal.windupMs };
  }
  const typing = { wordFor, maxInputLength: rules.maxInputLength };
  const validId = id => typeof id === "string" && /^[a-f0-9]{24}$/.test(id);
  function playerFor(id, name, mode, weaponId = "sword") {
    return { ...duel.create(id, [], [name], [mode], { battleMode: "weapons", weapons: [weaponId, "sword"] }).players[0],
      id, hp: rules.hp, maxHp: rules.hp, slowFrom: 0, slowUntil: 0 };
  }
  function create(id, order, host, difficulty = "normal") {
    if (!isDifficulty(difficulty)) throw new Error("Invalid co-op difficulty");
    const match = duel.create(id, order, [host.name], [host.mode], { battleMode: "weapons" });
    match.players[0] = playerFor(host.id, host.name, host.mode);
    return Object.assign(match, { difficulty, stageId: null, outcome: null, boss: null });
  }
  function invalidateReady(match) {
    match.players.forEach(player => { player.ready = false; });
    match.settingsRevision++; match.revision++;
  }
  function addPlayer(match, player) {
    if (match.phase !== "lobby" || match.players.length >= rules.maxPlayers || !validId(player.id)
        || match.players.some(p => p.id === player.id) || typeof player.name !== "string" || !player.name.length
        || player.name.length > 20 || !["roman", "kana"].includes(player.mode)) return false;
    match.players.push(playerFor(player.id, player.name, player.mode));
    invalidateReady(match); return true;
  }
  function removePlayer(match, id) {
    const seat = match.players.findIndex(player => player.id === id);
    if (seat <= 0) return false;
    if (match.phase === "finished") return true;
    if (match.phase !== "lobby") { finish(match, "aborted"); return true; }
    match.players.splice(seat, 1); invalidateReady(match); return true;
  }
  function chooseWeapon(match, seat, weaponId, settingsRevision) {
    if (settingsRevision !== match.settingsRevision) return false;
    return duel.chooseWeapon(match, seat, weaponId);
  }
  function chooseDifficulty(match, seat, difficulty, settingsRevision) {
    if (match.phase !== "lobby" || seat !== 0 || settingsRevision !== match.settingsRevision || !isDifficulty(difficulty)) return false;
    if (match.difficulty === difficulty) return true;
    match.difficulty = difficulty; invalidateReady(match); return true;
  }
  function ready(match, seat, value, settingsRevision) {
    if (match.phase !== "lobby" || !match.players[seat] || typeof value !== "boolean"
        || settingsRevision !== match.settingsRevision) return false;
    match.players[seat].ready = value; match.revision++; return true;
  }
  function canStart(match) {
    return match.phase === "lobby" && match.players.length >= rules.minPlayers && match.players.every(p => p.ready);
  }
  function start(match, seat, stageId, now, settingsRevision) {
    if (seat !== 0 || !isStage(stageId) || settingsRevision !== match.settingsRevision || !canStart(match)) return false;
    match.stageId = stageId; match.phase = "countdown"; match.countdown = 3;
    match.startsAt = now + duel.rules.countdownMs; match.clockNow = now;
    const profile = difficultyFor(match);
    match.boss = { hp: profile.giantHpPerPlayer * match.players.length, maxHp: profile.giantHpPerPlayer * match.players.length,
      attack: null, nextAttackAt: null, attacks: 0 };
    match.revision++; return true;
  }
  function acceptInput(match, words, seat, packet, now) {
    return Boolean(match.players[seat]?.hp > 0 && now < match.endsAt && duel.acceptInput(match, words, seat, packet, now, typing));
  }
  function defense(match, words, seat, packet, now) {
    return Boolean(match.players[seat]?.hp > 0 && duel.defense(match, words, seat, packet, now, typing));
  }
  function settleCounter(player, success) {
    if (player.counterStartedAt === null) return;
    player.counterEnergy = success ? 0 : Math.floor(player.counterEnergy / 2);
    player.counterStartedAt = null;
  }
  function finish(match, outcome) {
    match.phase = "finished"; match.outcome = outcome;
    if (match.boss) match.boss.attack = null;
    match.players.forEach(player => {
      player.guarding = false; player.guardStartedAt = null; player.attackAt = null;
      settleCounter(player, false); player.counterReadyAt = 0;
    });
    match.revision++;
  }
  function prepareAttack(match, now, random) {
    const alive = match.players.filter(player => player.hp > 0);
    const roll = random();
    const kind = match.stageId === "octopus" ? roll < .35 ? "single" : roll < .7 ? "all" : "slow" : roll < .5 ? "single" : "all";
    const targets = kind === "single" ? [alive[Math.min(alive.length - 1, Math.floor(random() * alive.length))].id] : alive.map(p => p.id);
    match.boss.attack = { kind, targets, hitsAt: now + difficultyFor(match).warningMs };
    match.revision++;
  }
  function hitPlayers(match, now) {
    const attack = match.boss.attack, profile = difficultyFor(match);
    for (const player of match.players) {
      if (!player.hp || !attack.targets.includes(player.id)) continue;
      if (attack.kind === "slow") {
        // Start at the next prompt, keeping current input (including in-flight packets) stable.
        if (!isSlowed(player)) player.slowFrom = player.index + 1;
        player.slowUntil = player.index + rules.slowWords + 1;
        continue;
      }
      const damage = attack.kind === "single" ? profile.singleDamage : profile.allDamage;
      let taken = damage, effect = "hit";
      if (player.counterStartedAt !== null && now - player.counterStartedAt <= duel.rules.counterWindowMs) {
        taken = 0; effect = "counter"; player.counterHits++;
        match.boss.hp = Math.max(0, match.boss.hp - duel.rules.counterDamage);
        settleCounter(player, true);
      } else if (player.guarding) {
        const just = now - player.guardStartedAt <= duel.rules.defenseWindowMs;
        taken = Math.ceil(damage * (just ? .25 : .5)); effect = just ? "justGuard" : "guard";
      }
      player.hp = Math.max(0, player.hp - taken);
      player.guarding = false; player.guardStartedAt = null;
      player.feedback = effect; player.feedbackId++;
      if (!player.hp) { player.attackAt = null; settleCounter(player, false); }
    }
    match.boss.attacks++; match.boss.attack = null;
    match.boss.nextAttackAt = now + profile.attackIntervalMs - profile.warningMs;
    match.revision++;
  }
  function tick(match, words, now, random = Math.random) {
    match.clockNow = now;
    if (match.phase === "countdown") {
      const countdown = Math.max(0, Math.ceil((match.startsAt - now) / 1000));
      if (match.countdown !== countdown) { match.countdown = countdown; match.revision++; }
      if (now < match.startsAt) return;
      match.phase = "fighting"; match.endsAt = now + duel.rules.limitMs;
      match.players.forEach(player => { player.openedAt = now; });
      const profile = difficultyFor(match);
      match.boss.nextAttackAt = now + profile.attackIntervalMs - profile.warningMs;
      match.revision++;
    }
    if (match.phase !== "fighting") return;
    match.remainingMs = Math.max(0, match.endsAt - now);
    if (!match.remainingMs) { finish(match, "defeat"); return; }
    for (const [seat, player] of match.players.entries()) {
      if (!player.hp) continue;
      if (player.counterStartedAt !== null && now - player.counterStartedAt > duel.rules.counterWindowMs) {
        settleCounter(player, false); match.revision++;
      }
      const word = wordFor(match, words, player.index, seat);
      const profile = attackProfile(word, player.mode, player.value);
      if (player.attackAt === null && now - player.openedAt >= profile.inputMs
          && player.value === duel.targetFor(word, player.mode, player.value)) {
        player.attackAt = now + profile.windupMs; match.revision++;
      }
      if (player.attackAt !== null && now >= player.attackAt) {
        match.boss.hp = Math.max(0, match.boss.hp - profile.damage);
        player.index++; player.attacks++; player.value = ""; player.pendingInput = false;
        player.counterBestLength = 0; player.openedAt = now; player.attackAt = null;
        if (player.index >= player.slowUntil) player.slowFrom = player.slowUntil = 0;
        match.revision++;
      }
    }
    if (!match.boss.hp) { finish(match, "victory"); return; }
    if (match.boss.attack && now >= match.boss.attack.hitsAt) hitPlayers(match, now);
    if (!match.boss.hp) { finish(match, "victory"); return; }
    if (match.players.every(player => !player.hp)) { finish(match, "defeat"); return; }
    if (!match.boss.attack && now >= match.boss.nextAttackAt) prepareAttack(match, now, random);
  }
  function snapshot(match) {
    const boss = match.boss;
    return { ...duel.snapshot(match), difficulty: match.difficulty, stageId: match.stageId, outcome: match.outcome,
      boss: boss && { hp: boss.hp, maxHp: boss.maxHp, attacks: boss.attacks,
        attack: boss.attack && { kind: boss.attack.kind, targets: [...boss.attack.targets],
          remainingMs: Math.max(0, boss.attack.hitsAt - match.clockNow) } } };
  }
  function validSnapshot(data, words) {
    if (!data || !isDifficulty(data.difficulty) || data.battleMode !== "weapons" || data.handicapRatio !== 1 || data.handicapSeat !== 1
        || !Array.isArray(data.players) || data.players.length < 1 || data.players.length > rules.maxPlayers
        || new Set(data.players.map(p => p?.id)).size !== data.players.length
        || !data.players.every(p => p && validId(p.id) && p.name?.length > 0 && p.defenseCost === 0
          && Number.isSafeInteger(p.slowFrom) && Number.isSafeInteger(p.slowUntil) && p.slowFrom >= 0
          && ((p.slowFrom === 0 && p.slowUntil === 0) || (data.stageId === "octopus" && data.phase !== "lobby"
            && p.slowFrom <= p.index + 1 && p.slowUntil > p.index && p.slowUntil > p.slowFrom
            && p.slowUntil <= p.index + rules.slowWords + 1))
          && duel.validSnapshot({ ...data, players: [p, p] }, words, rules.hp, typing))
        || ![null, "victory", "defeat", "aborted"].includes(data.outcome)) return false;
    if (data.phase === "lobby") return data.stageId === null && data.boss === null && data.outcome === null;
    const boss = data.boss, attack = boss?.attack, profile = difficultyFor(data);
    if (!isStage(data.stageId) || data.players.length < rules.minPlayers || !boss
        || boss.maxHp !== profile.giantHpPerPlayer * data.players.length
        || !Number.isInteger(boss.hp) || boss.hp < 0 || boss.hp > boss.maxHp
        || !Number.isSafeInteger(boss.attacks) || boss.attacks < 0
        || (data.phase === "finished") !== (data.outcome !== null)) return false;
    if (attack === null) return true;
    return data.phase === "fighting" && (attack?.kind === "slow" ? data.stageId === "octopus" : ["single", "all"].includes(attack?.kind))
      && Number.isFinite(attack.remainingMs) && attack.remainingMs >= 0 && attack.remainingMs <= profile.warningMs
      && Array.isArray(attack.targets) && attack.targets.length > 0
      && new Set(attack.targets).size === attack.targets.length
      && attack.targets.every(id => data.players.some(p => p.id === id && p.hp > 0))
      && (attack.kind !== "single" || attack.targets.length === 1)
      && (attack.kind === "single" || attack.targets.length === data.players.filter(p => p.hp > 0).length);
  }
  return { rules, difficulties, isDifficulty, difficultyFor, stage, stages, isStage, stageFor, isSlowed, wordFor, attackProfile,
    create, addPlayer, removePlayer, chooseWeapon, chooseDifficulty, ready, canStart, start,
    acceptInput, defense, tick, snapshot, validSnapshot };
})();
