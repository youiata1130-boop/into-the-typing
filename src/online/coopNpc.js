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
    const attack = match.boss.attack, targeted = attack?.targets.includes(player.id);
    const defend = action => coop.defense(match, words, 1,
      { match: match.id, seq: player.defenseSeq + 1, action }, now);
    const kind = duel.weapons[player.weaponId].defense;
    if (targeted && bot.seenAttack !== match.boss.attacks) {
      bot.seenAttack = match.boss.attacks;
      // React to the public warning. Sometimes miss the cue; guards are not perfect.
      bot.defendAt = bot.random() < .65 && kind !== "none"
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
    const countering = player.counterStartedAt !== null && now - player.counterStartedAt <= duel.rules.counterWindowMs;
    const target = duel.targetFor(duel.wordFor(match, words, player.index, 1), player.mode, player.value);
    if (player.guarding || countering || player.attackAt !== null || player.value === target) { bot.credit = 0; return; }
    bot.credit = Math.min(2, bot.credit + elapsed * bot.speed / 1000);
    if (bot.credit + 1e-9 < 1) return;
    if (coop.acceptInput(match, words, 1, { match: match.id, index: player.index, seq: player.seq + 1,
      value: target.slice(0, player.value.length + 1) }, now)) bot.credit = Math.max(0, bot.credit - 1);
  }
  function resume(bot, match, pausedAt, now) {
    npc.resume(bot, match, pausedAt, now);
    const elapsed = Math.max(0, now - pausedAt);
    if (Number.isFinite(match.boss?.nextAttackAt)) match.boss.nextAttackAt += elapsed;
    if (match.boss?.attack) match.boss.attack.hitsAt += elapsed;
  }
  return { validConfig, create, step, resume };
})();
