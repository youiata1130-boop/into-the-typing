const defaultWeaponId = "branch";
const weaponDefinitions = {
  branch: {
    id: "branch",
    name: "木の枝",
    damageMultiplier: 0.2,
    attackCooldownMs: 220,
    words: wordSets.branch,
    wordLength: { fixed: true, normalMin: 2, normalMax: 3 },
  },
  sword: {
    id: "sword",
    name: "鉄の剣",
    damageMultiplier: 1,
    attackCooldownMs: 700,
  },
  swordShield: {
    id: "swordShield",
    name: "片手剣",
    damageMultiplier: 1,
    attackCooldownMs: 700,
    guardDamageMultiplier: 0,
    itemImage: "src/assets/images/items/weapons/sword_shield.png",
  },
  dualBlades: {
    id: "dualBlades",
    name: "双剣",
    damageMultiplier: 0.6,
    attackCooldownMs: 200,
    attackTargets: 1,
    wordLength: { fixed: true, normalMin: 2, normalMax: 4 },
    attackRecoveryMs: 110,
    attackAnimationMs: 240,
    itemImage: "src/assets/images/items/weapons/dual_blades.png",
  },
  greatsword: {
    id: "greatsword",
    name: "大剣",
    attackCooldownMs: 1500,
    wordLength: {
      normalMin: 12,
      maxSpan: 8,
    },
    useShortestInputLength: true,
    maxDamageMultiplier: 4,
    minDamageMultiplier: 1,
    chargeMissPenalty: 0.25,
    chargePoseThresholds: [0.4, 0.8],
  },
};
const unarmedWeapon = { id: "unarmed", name: "素手", damage: 0.1, attackCooldownMs: 480 };
const playerAssetVersion = "branch-intro-v1";
const greatswordPoseVersion = "greatsword-poses-v4";
const playerWeaponAssets = {
  swordShield: {
    idle: "src/assets/images/player/sword_shield/idle/frame_01.png",
    windup: "src/assets/images/player/sword_shield/idle/frame_01.png",
    strike: "src/assets/images/player/sword_shield/attack/frame_01.png",
    guard: "src/assets/images/player/sword_shield/guard/frame_01.png",
  },
  dualBlades: {
    idle: "src/assets/images/player/dual_blades/idle/frame_01.png",
    windup: "src/assets/images/player/dual_blades/idle/frame_01.png",
    strike: "src/assets/images/player/dual_blades/attack/frame_01.png",
  },
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
    idle: `src/assets/images/player/greatsword/charge/frame_01.png?v=${greatswordPoseVersion}`,
    charge: [
      `src/assets/images/player/greatsword/charge/frame_01.png?v=${greatswordPoseVersion}`,
      `src/assets/images/player/greatsword/idle/frame_01.png?v=${greatswordPoseVersion}`,
      `src/assets/images/player/greatsword/attack/frame_01.png?v=${playerAssetVersion}`,
    ],
    windup: `src/assets/images/player/greatsword/attack/frame_01.png?v=${playerAssetVersion}`,
    strike: `src/assets/images/player/greatsword/attack/frame_02.png?v=${playerAssetVersion}`,
  },
};
