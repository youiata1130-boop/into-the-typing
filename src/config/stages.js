const minimumWordMaxLength = 4;
const defaultEnemyAttackPower = {
  min: 8,
  max: 14,
};
const defaultSpecialGaugeSettings = {
  chargeStartStreak: 5,
  baseGain: 0.25,
  gainPerStreak: 0.03,
  streakCap: 16,
};
const defaultStageId = "forest_path";
const stageDefinitions = {
  forest_path: {
    code: "1",
    name: "旅の始まり",
    meta: "",
    enabled: true,
    tutorial: true,
    nextStageId: "mist_road",
    rewardWeaponId: "sword",
    storyIntro: { punches: 3, branchHits: 4, weaponId: "branch" },
    waves: [
      { types: ["medaka_level_1"], hp: 2, attackPower: { min: 6, max: 10 }, count: 1, experience: 0 },
    ],
  },
  mist_road: {
    code: "2",
    name: "霧の古道",
    meta: "",
    enabled: true,
    requiresTutorial: true,
    skillPointTutorial: true,
    nextStageId: "sky_castle",
    wordLength: {
      normalMin: 0,
    },
    specialGauge: {
      chargeStartStreak: 3,
      baseGain: 1.8,
      gainPerStreak: 0.14,
      streakCap: 16,
    },
    waves: [
      { types: ["medaka_level_1"], hp: 2, attackPower: { min: 6, max: 10 }, count: 2, experience: 10 },
      { types: ["medaka_boss"], hp: 4, attackPower: { min: 12, max: 18 }, count: 1, experience: 20, boss: true },
    ],
  },
  sky_castle: {
    code: "3",
    name: "潮風の浜辺",
    meta: "",
    enabled: true,
    requiresTutorial: true,
    requiresStage: "mist_road",
    wordLength: { normalMin: 0 },
    specialGauge: {
      chargeStartStreak: 3,
      baseGain: 1.8,
      gainPerStreak: 0.14,
      streakCap: 16,
    },
    waves: [
      { types: ["crab_level_1"], hp: 5, attackPower: { min: 10, max: 15 }, count: 3, experience: 25 },
    ],
  },
};
