// Local ally: all damage and defenses still pass through the co-op battle rules.
window.COOP_NPC = (() => {
  const coop = window.ONLINE_COOP, duel = window.ONLINE_DUEL, npc = window.ONLINE_NPC;
  const validConfig = config => Boolean(config && duel.isWeapon(config.weaponId) && npc.speeds.includes(config.speed));
  function create(match, config, random = Math.random) {
    if (!validConfig(config) || match.players.length !== 2) throw new Error("Invalid NPC co-op settings");
    return { matchId: match.id, speed: config.speed, random, lastAt: null, credit: 0, index: 0,
      seenAttack: -1, defendAt: null, releaseAt: null };
  }
  function step(bot, match, words, now) {
    if (!Number.isFinite(now) || bot.matchId !== match.id) return;
    const elapsed = Math.max(0, Math.min(250, now - (bot.lastAt ?? now)));
    bot.lastAt = now;
    const player = match.players[1];
    if (match.phase !== "fighting" || now >= match.endsAt || !player.hp) { bot.credit = 0; return; }
    const attack = coop.attacksFor(match).filter(attack => attack.kind !== "slow" && attack.targets.includes(player.id))
      .sort((a, b) => a.hitsAt - b.hitsAt)[0], targeted = Boolean(attack);
    const defend = action => coop.defense(match, words, 1,
      { match: match.id, seq: player.defenseSeq + 1, action }, now);
    const kind = duel.weapons[player.weaponId].defense;
    const attackKey = attack && `${attack.source}:${attack.number}`;
    if (bot.seenAttack !== attackKey) {
      bot.seenAttack = attackKey;
      // React to the public warning. Sometimes miss the cue; guards are not perfect.
      bot.defendAt = targeted && bot.random() < .65 && kind !== "none"
        ? attack.hitsAt - (kind === "counter" ? 200 : 350) : null;
    }
    if (bot.defendAt !== null && now >= bot.defendAt) {
      bot.defendAt = null;
      if (targeted && now < attack.hitsAt && defend(kind === "guard" ? "guard-start" : "counter") && kind === "guard") {
        bot.releaseAt = attack.hitsAt + 100;
      }
    }
    if (player.guarding && (!targeted || (bot.releaseAt !== null && now >= bot.releaseAt))) {
      defend("guard-end"); bot.releaseAt = null;
    }
    if (player.index !== bot.index) { bot.index = player.index; bot.credit = 0; }
    if (match.stageId === "octopus" && !player.targetLocked) {
      const part = match.boss.tentacles.filter(part => part.hp > 0).sort((a, b) => a.hp - b.hp)[0];
      const targetId = part?.id || "body";
      if (player.targetId !== targetId) coop.chooseTarget(match, 1,
        { match: match.id, index: player.index, seq: player.targetSeq + 1, targetId });
    }
    const countering = player.counterStartedAt !== null && now - player.counterStartedAt <= duel.rules.counterWindowMs;
    const target = duel.targetFor(coop.wordFor(match, words, player.index, 1), player.mode, player.value);
    if (player.guarding || countering || player.attackAt !== null || player.value === target) { bot.credit = 0; return; }
    npc.typeNext(bot, match, words, target, elapsed, now, coop.acceptInput);
  }
  function resume(bot, match, pausedAt, now) {
    npc.resume(bot, match, pausedAt, now);
    const elapsed = Math.max(0, now - pausedAt);
    if (Number.isFinite(match.boss?.nextAttackAt)) match.boss.nextAttackAt += elapsed;
    if (match.boss?.attack) match.boss.attack.hitsAt += elapsed;
    for (const part of match.boss?.tentacles || []) {
      if (Number.isFinite(part.nextAttackAt)) part.nextAttackAt += elapsed;
      if (part.attack) part.attack.hitsAt += elapsed;
    }
    if (match.boss?.regrowth) match.boss.regrowth.revivesAt += elapsed;
  }
  return { validConfig, create, step, resume };
})();
