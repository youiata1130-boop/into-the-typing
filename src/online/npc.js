// Local opponent: uses the same input, attack and defense rules as a player.
window.ONLINE_NPC = (() => {
  const duel = window.ONLINE_DUEL;
  const hpChoices = Object.freeze([500, 1000, 1500, 2000, 2500, 3000]);
  const speeds = Object.freeze([1, 2, 3, 4, 6]);
  function validConfig(config) {
    return Boolean(config && duel.isWeapon(config.weaponId) && hpChoices.includes(config.hp) && speeds.includes(config.speed));
  }
  function createMatch(id, order, name, mode, weaponId, config) {
    if (!validConfig(config)) throw new Error("Invalid NPC settings");
    const match = duel.create(id, order, [name, "NPC"], [mode, mode],
      { battleMode: "weapons", weapons: [weaponId, config.weaponId] });
    // NPC health is local-only. Network snapshots keep their stricter handicap limits.
    match.players[1].hp = match.players[1].maxHp = config.hp;
    return match;
  }
  function create(match, config, random = Math.random) {
    if (!validConfig(config)) throw new Error("Invalid NPC settings");
    return { matchId: match.id, speed: config.speed, random, lastAt: null, credit: 0, index: 0,
      seenAttack: -1, defendAt: null, releaseAt: null };
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
    const countering = player.counterStartedAt !== null && now - player.counterStartedAt <= duel.rules.defenseWindowMs;
    const target = duel.targetFor(duel.wordFor(match, words, player.index), player.mode, player.value);
    if (player.guarding || countering || player.attackAt !== null || player.value === target) { bot.credit = 0; return; }
    // A late frame never fills a whole word at once; progress advances character by character.
    bot.credit = Math.min(2, bot.credit + elapsed * bot.speed / 1000);
    if (bot.credit + 1e-9 < 1) return;
    if (duel.acceptInput(match, words, 1, { match: match.id, index: player.index, seq: player.seq + 1,
      value: target.slice(0, player.value.length + 1) }, now)) bot.credit = Math.max(0, bot.credit - 1);
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
  return { hpChoices, speeds, validConfig, createMatch, create, step, resume };
})();
