const defaultWeaponId = "branch";
const weaponDefinitions = {
  branch: {
    id: "branch",
    name: "木の枝",
    damageMultiplier: 0.2,
    words: wordSets.branch,
    wordLength: { fixed: true, normalMin: 2, normalMax: 3, bossMin: 2, bossMax: 3 },
  },
  sword: {
    id: "sword",
    name: "片手剣",
    damageMultiplier: 1,
  },
  greatsword: {
    id: "greatsword",
    name: "大剣",
    wordLength: {
      normalMin: 12,
      bossMin: 14,
      maxSpan: 8,
    },
    useShortestInputLength: true,
    maxDamageMultiplier: 4,
    minDamageMultiplier: 1,
    missPenalty: 1,
  },
};
const unarmedWeapon = { id: "unarmed", name: "素手", damage: 0.1 };
const playerAssetVersion = "branch-intro-v1";
const playerWeaponAssets = {
  branch: {
    idle: `src/assets/images/player/branch/idle/frame_01.png?v=${playerAssetVersion}`,
    windup: `src/assets/images/player/branch/idle/frame_01.png?v=${playerAssetVersion}`,
    strike: `src/assets/images/player/branch/attack/frame_01.png?v=${playerAssetVersion}`,
  },
  unarmed: {
    idle: `src/assets/images/player/unarmed/idle/frame_01.png?v=${playerAssetVersion}`,
    windup: `src/assets/images/player/unarmed/idle/frame_01.png?v=${playerAssetVersion}`,
    strike: `src/assets/images/player/unarmed/attack/frame_01.png?v=${playerAssetVersion}`,
  },
  sword: {
    idle: `src/assets/images/player/sword/idle/frame_01.png?v=${playerAssetVersion}`,
    windup: `src/assets/images/player/sword/attack/frame_01.png?v=${playerAssetVersion}`,
    strike: `src/assets/images/player/sword/attack/frame_02.png?v=${playerAssetVersion}`,
  },
  greatsword: {
    idle: `src/assets/images/player/greatsword/charge/frame_01.png?v=${playerAssetVersion}`,
    charge: [
      `src/assets/images/player/greatsword/charge/frame_01.png?v=${playerAssetVersion}`,
      `src/assets/images/player/greatsword/idle/frame_01.png?v=${playerAssetVersion}`,
      `src/assets/images/player/greatsword/attack/frame_01.png?v=${playerAssetVersion}`,
    ],
    windup: `src/assets/images/player/greatsword/attack/frame_01.png?v=${playerAssetVersion}`,
    strike: `src/assets/images/player/greatsword/attack/frame_02.png?v=${playerAssetVersion}`,
  },
};
