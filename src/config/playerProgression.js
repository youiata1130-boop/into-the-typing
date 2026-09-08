(() => {
  const rules = Object.freeze({
    maxLevel: 99,
    baseHp: 100,
    hpPerLevel: 10,
    pointsPerLevel: 1,
    statMax: Object.freeze({ attack: 99, agility: 9 }),
  });
  const defaultStats = Object.freeze({ attack: 1, agility: 1 });
  const experienceToNextLevel = (level) => level >= rules.maxLevel
    ? 0
    : 40 + 20 * (level - 1) + 5 * (level - 1) ** 2;
  const maxHp = (level) => rules.baseHp + (level - 1) * rules.hpPerLevel;
  const maxExperience = Array.from({ length: rules.maxLevel - 1 }, (_, i) => experienceToNextLevel(i + 1))
    .reduce((sum, amount) => sum + amount, 0);
  const integer = (value, fallback, min, max) => Number.isSafeInteger(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;

  function restore(data = {}) {
    const totalExperience = integer(data?.totalExperience, 0, 0, maxExperience);
    let experience = totalExperience;
    let level = 1;
    while (level < rules.maxLevel && experience >= experienceToNextLevel(level)) {
      experience -= experienceToNextLevel(level);
      level += 1;
    }
    const earnedPoints = (level - 1) * rules.pointsPerLevel;
    let stats = {
      attack: integer(data?.stats?.attack, 1, 1, rules.statMax.attack),
      agility: integer(data?.stats?.agility, 1, 1, rules.statMax.agility),
    };
    let spentPoints = stats.attack - 1 + stats.agility - 1;
    if (spentPoints > earnedPoints) {
      stats = { ...defaultStats };
      spentPoints = 0;
    }
    return {
      totalExperience,
      level,
      experience,
      skillPoints: earnedPoints - spentPoints,
      stats,
    };
  }

  function gainExperience(player, amount) {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return { gained: 0, levels: 0, hpGained: 0 };
    }
    const previousLevel = player.level;
    const previousTotal = player.totalExperience;
    Object.assign(player, restore({
      totalExperience: Math.min(maxExperience, previousTotal + amount),
      stats: player.stats,
    }));
    const levels = player.level - previousLevel;
    return {
      gained: player.totalExperience - previousTotal,
      levels,
      hpGained: levels * rules.hpPerLevel,
    };
  }

  function canUpgrade(player, stat) {
    return Object.hasOwn(defaultStats, stat)
      && player.skillPoints >= 1
      && player.stats[stat] < rules.statMax[stat];
  }

  function upgrade(player, stat) {
    if (!canUpgrade(player, stat)) return false;
    player.stats[stat] += 1;
    player.skillPoints -= 1;
    return true;
  }

  window.PLAYER_PROGRESSION = Object.freeze({
    rules, defaultStats, experienceToNextLevel, maxHp, restore, gainExperience, canUpgrade, upgrade,
  });
})();
