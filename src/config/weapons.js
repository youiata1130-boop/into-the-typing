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
    skillId: "healing_light",
    damageMultiplier: 1,
    attackCooldownMs: 700,
  },
  swordShield: {
    id: "swordShield",
    name: "片手剣",
    skillId: "battle_spirit",
    damageMultiplier: 1,
    attackCooldownMs: 700,
    guardDamageMultiplier: 0.5,
    justGuardDamageMultiplier: 0.25,
    itemImage: "src/assets/images/items/weapons/sword_shield.webp",
  },
  dualBlades: {
    id: "dualBlades",
    name: "双剣",
    skillId: "time_stop",
    damageMultiplier: 0.6,
    attackCooldownMs: 200,
    attackTargets: 1,
    wordLength: { fixed: true, normalMin: 2, normalMax: 4 },
    attackRecoveryMs: 110,
    attackAnimationMs: 240,
    itemImage: "src/assets/images/items/weapons/dual_blades.webp",
  },
  greatsword: {
    id: "greatsword",
    name: "大剣",
    attackCooldownMs: 1500,
    guardDamageMultiplier: 0.5,
    justGuardDamageMultiplier: 0.25,
    guardRequiresEmptyInput: true,
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
    idle: "src/assets/images/player/sword_shield/idle/frame_01.webp",
    windup: "src/assets/images/player/sword_shield/idle/frame_01.webp",
    strike: "src/assets/images/player/sword_shield/attack/frame_01.webp",
    guard: "src/assets/images/player/sword_shield/guard/frame_01.webp",
  },
  dualBlades: {
    idle: "src/assets/images/player/dual_blades/idle/frame_01.webp",
    windup: "src/assets/images/player/dual_blades/idle/frame_01.webp",
    strike: "src/assets/images/player/dual_blades/attack/frame_01.webp",
  },
  branch: {
    idle: `src/assets/images/player/branch/idle/frame_01.webp?v=${playerAssetVersion}`,
    windup: `src/assets/images/player/branch/idle/frame_01.webp?v=${playerAssetVersion}`,
    strike: `src/assets/images/player/branch/attack/frame_01.webp?v=${playerAssetVersion}`,
  },
  unarmed: {
    idle: `src/assets/images/player/unarmed/idle/frame_01.webp?v=${playerAssetVersion}`,
    windup: `src/assets/images/player/unarmed/idle/frame_01.webp?v=${playerAssetVersion}`,
    strike: `src/assets/images/player/unarmed/attack/frame_01.webp?v=${playerAssetVersion}`,
  },
  sword: {
    idle: `src/assets/images/player/sword/idle/frame_01.webp?v=${playerAssetVersion}`,
    windup: `src/assets/images/player/sword/attack/frame_01.webp?v=${playerAssetVersion}`,
    strike: `src/assets/images/player/sword/attack/frame_02.webp?v=${playerAssetVersion}`,
  },
  greatsword: {
    idle: `src/assets/images/player/greatsword/charge/frame_01.webp?v=${greatswordPoseVersion}`,
    guard: "src/assets/images/player/greatsword/guard/frame_01.webp",
    charge: [
      `src/assets/images/player/greatsword/charge/frame_01.webp?v=${greatswordPoseVersion}`,
      `src/assets/images/player/greatsword/idle/frame_01.webp?v=${greatswordPoseVersion}`,
      `src/assets/images/player/greatsword/attack/frame_01.webp?v=${playerAssetVersion}`,
    ],
    windup: `src/assets/images/player/greatsword/attack/frame_01.webp?v=${playerAssetVersion}`,
    strike: `src/assets/images/player/greatsword/attack/frame_02.webp?v=${playerAssetVersion}`,
  },
};
