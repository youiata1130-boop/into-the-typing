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
    code: "1-1",
    name: "はじまりの森",
    description: "短い単語でテンポよく進むステージ",
    meta: "推奨Lv.1",
    enabled: true,
    storyIntro: { punches: 3, weaponId: "branch" },
    wordLength: {
      normalMin: 0,
      bossMin: 7,
    },
    specialGauge: {
      chargeStartStreak: 3,
      baseGain: 1.8,
      gainPerStreak: 0.14,
      streakCap: 16,
    },
    waves: [
      { types: ["egg_level_1"], hp: 2, attackPower: { min: 6, max: 10 }, count: 3, experience: 10 },
      { types: ["egg_level_1", "chick_level_1"], hp: 3, attackPower: { min: 8, max: 12 }, count: 3, experience: 15 },
      { types: ["chick_level_1"], hp: 4, attackPower: { min: 12, max: 18 }, count: 1, experience: 35, boss: true },
    ],
  },
  mist_road: {
    code: "1-2",
    name: "霧の古道",
    description: "長めの単語でじっくり戦うステージ",
    meta: "準備中",
    enabled: false,
    wordLength: {
      normalMin: 9,
      bossMin: 13,
    },
    specialGauge: {
      streakCap: 50,
    },
    waves: [
      { types: ["chicken_level_1"], hp: 4, attackPower: { min: 10, max: 16 }, count: 2, experience: 25 },
      { types: ["chicken_level_2"], hp: 5, attackPower: { min: 12, max: 18 }, count: 1, experience: 35 },
      { types: ["chicken_level_2"], hp: 8, attackPower: { min: 18, max: 26 }, count: 1, experience: 70, boss: true },
    ],
  },
  sky_castle: {
    code: "1-3",
    name: "天空城",
    description: "まだ門が開いていない高難度ステージ",
    meta: "封印中",
    enabled: false,
    waves: [],
  },
};
