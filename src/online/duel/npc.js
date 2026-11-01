// Local opponent: uses the same input, attack and defense rules as a player.
window.ONLINE_NPC = (() => {
  const duel = window.ONLINE_DUEL;
  const playerHp = 1000;
  const hpChoices = Object.freeze([500, 1000, 1500, 2000, 2500, 3000]);
  const levels = Object.freeze([
    Object.freeze({ name: "弱い", speed: 1 }), Object.freeze({ name: "普通", speed: 3 }),
    Object.freeze({ name: "強い", speed: 7 }), Object.freeze({ name: "師匠", speed: 20 }),
    Object.freeze({ name: "最強", speed: 60 }),
  ]);
  const speeds = Object.freeze(levels.map(level => level.speed));
  function validConfig(config) {
    return Boolean(config && duel.isWeapon(config.weaponId) && hpChoices.includes(config.hp) && speeds.includes(config.speed));
  }
  function createMatch(id, order, name, mode, weaponId, config) {
    if (!validConfig(config)) throw new Error("Invalid NPC settings");
    const match = duel.create(id, order, [name, "NPC"], [mode, mode],
      { battleMode: "weapons", weapons: [weaponId, config.weaponId] });
    // NPC health is local-only. Network snapshots keep their stricter handicap limits.
    match.players[0].hp = match.players[0].maxHp = playerHp;
    match.players[1].hp = match.players[1].maxHp = config.hp;
    return match;
  }
  function create(match, config, random = Math.random) {
    if (!validConfig(config)) throw new Error("Invalid NPC settings");
    return { matchId: match.id, speed: config.speed, random, lastAt: null, credit: 0, index: 0,
      seenAttack: -1, defendAt: null, releaseAt: null };
  }
  function typeNext(bot, match, words, target, elapsed, now, acceptInput) {
    const player = match.players[1];
    // Cap catch-up to one 50 ms update, while allowing superhuman presets multiple keys per update.
    bot.credit = Math.min(Math.ceil(bot.speed / 20) + 1, bot.credit + Math.min(elapsed, 50) * bot.speed / 1000);
    const count = Math.min(Math.floor(bot.credit + 1e-9), target.length - player.value.length);
    if (count < 1 || !acceptInput(match, words, 1, { match: match.id, index: player.index, seq: player.seq + 1,
      value: target.slice(0, player.value.length + count) }, now)) return;
    bot.credit = Math.max(0, bot.credit - count);
    if (player.value === target) {
      // Local NPCs begin the usual weapon windup as soon as their typing finishes.
      player.attackAt = now + duel.attackProfile(duel.wordFor(match, words, player.index, 1), player.mode, player.value).windupMs;
      match.revision++;
    }
  }
  function step(bot, match, words, now) {
    if (!Number.isFinite(now) || bot.matchId !== match.id) return;
    const elapsed = Math.max(0, Math.min(250, now - (bot.lastAt ?? now)));
    bot.lastAt = now;
    if (match.phase !== "fighting" || now >= match.endsAt) { bot.credit = 0; return; }
    const player = match.players[1], opponent = match.players[0];
    const defend = action => duel.defense(match, words, 1,
      { match: match.id, seq: player.defenseSeq + 1, action }, now);
    // React only to the visible attack warning, once per swing. No perfect defense.
    if (opponent.attackAt !== null && bot.seenAttack !== opponent.index) {
      bot.seenAttack = opponent.index;
      bot.defendAt = bot.random() < .45 ? now + 250 : null;
    }
    if (bot.defendAt !== null && now >= bot.defendAt) {
      bot.defendAt = null;
      const kind = duel.weapons[player.weaponId].defense;
      if (opponent.attackAt !== null && now < opponent.attackAt && kind !== "none") {
        if (defend(kind === "guard" ? "guard-start" : "counter") && kind === "guard") bot.releaseAt = now + 350;
      }
    }
    if (player.guarding && (opponent.attackAt === null || (bot.releaseAt !== null && now >= bot.releaseAt))) {
      defend("guard-end"); bot.releaseAt = null;
    }
    if (player.index !== bot.index) { bot.index = player.index; bot.credit = 0; }
    const countering = player.counterStartedAt !== null && now - player.counterStartedAt <= duel.rules.counterWindowMs;
    const target = duel.targetFor(duel.wordFor(match, words, player.index, 1), player.mode, player.value);
    if (player.guarding || countering || player.attackAt !== null || player.value === target) { bot.credit = 0; return; }
    typeNext(bot, match, words, target, elapsed, now, duel.acceptInput);
  }
  function resume(bot, match, pausedAt, now) {
    const elapsed = Math.max(0, now - pausedAt);
    for (const key of ["startsAt", "endsAt"]) if (Number.isFinite(match[key])) match[key] += elapsed;
    for (const player of match.players) {
      player.openedAt += elapsed;
      for (const key of ["attackAt", "guardStartedAt", "counterStartedAt"]) if (player[key] !== null) player[key] += elapsed;
      if (player.counterReadyAt) player.counterReadyAt += elapsed;
    }
    for (const key of ["defendAt", "releaseAt"]) if (bot[key] !== null) bot[key] += elapsed;
    bot.lastAt = now; match.clockNow = now;
  }
  return { playerHp, hpChoices, levels, speeds, validConfig, createMatch, create, typeNext, step, resume };
})();
