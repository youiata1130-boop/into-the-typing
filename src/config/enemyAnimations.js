const enemyAssetVersion = "asset-layout-v1";
const enemyFrame = (enemy, level, state, frame) =>
  `src/assets/images/enemies/${enemy}/${level}/${state}/frame_${String(frame).padStart(2, "0")}.webp?v=${enemyAssetVersion}`;

// Add new frames in order:
// frame_01.webp, frame_02.webp, frame_03.webp ...
// Then add the same paths to the matching array below.
window.ENEMY_ANIMATIONS = {
  defaultEnemy: "goblin_level_1",
  frameMs: 140,
  settings: {
    mountain_bird_level_1: { frameMs: 220 },
    medaka_level_1: { frameMs: 70, idleWhileStopped: true },
    medaka_boss: { frameMs: 70, idleWhileStopped: true },
  },
  enemies: {
    mountain_bird_level_1: {
      idle: [enemyFrame("mountain_bird", "level_1", "idle", 1), enemyFrame("mountain_bird", "level_1", "idle", 2)],
      attack: [enemyFrame("mountain_bird", "level_1", "idle", 2)],
      damage: [enemyFrame("mountain_bird", "level_1", "idle", 1)],
      defeat: [enemyFrame("mountain_bird", "level_1", "idle", 2)],
    },
    thorn_stag_boss: {
      idle: [enemyFrame("thorn_stag", "boss", "idle", 1)],
      windup: [enemyFrame("thorn_stag", "boss", "windup", 1)],
      attack: [enemyFrame("thorn_stag", "boss", "windup", 1)],
      damage: [enemyFrame("thorn_stag", "boss", "idle", 1)],
      defeat: [enemyFrame("thorn_stag", "boss", "idle", 1)],
    },
    tree_fairy_boss: {
      idle: [enemyFrame("tree_fairy", "boss", "idle", 1)],
      windup: [enemyFrame("tree_fairy", "boss", "windup", 1)],
      attack: [enemyFrame("tree_fairy", "boss", "idle", 1)],
      damage: [enemyFrame("tree_fairy", "boss", "idle", 1)],
      defeat: [enemyFrame("tree_fairy", "boss", "idle", 1)],
    },
    mushroom_boss: {
      idle: [enemyFrame("mushroom", "boss", "idle", 1)],
      windup: [enemyFrame("mushroom", "boss", "windup", 1)],
      attack: [enemyFrame("mushroom", "boss", "idle", 1)],
      damage: [enemyFrame("mushroom", "boss", "idle", 1)],
      defeat: [enemyFrame("mushroom", "boss", "idle", 1)],
    },
    mushroom_level_1: {
      idle: [enemyFrame("mushroom", "level_1", "idle", 1)],
      windup: [enemyFrame("mushroom", "level_1", "windup", 1)],
      attack: [enemyFrame("mushroom", "level_1", "idle", 1)],
      damage: [enemyFrame("mushroom", "level_1", "idle", 1)],
      defeat: [enemyFrame("mushroom", "level_1", "idle", 1)],
    },
    bee_boss: {
      idle: [enemyFrame("bee", "boss", "idle", 1)],
      attack: [enemyFrame("bee", "boss", "idle", 1)],
      damage: [enemyFrame("bee", "boss", "idle", 1)],
      defeat: [enemyFrame("bee", "boss", "idle", 1)],
    },
    bee_level_1: {
      idle: [enemyFrame("bee", "level_1", "idle", 1)],
      attack: [enemyFrame("bee", "level_1", "idle", 1)],
      damage: [enemyFrame("bee", "level_1", "idle", 1)],
      defeat: [enemyFrame("bee", "level_1", "idle", 1)],
    },
    snake_level_1: {
      idle: [enemyFrame("snake", "level_1", "idle", 1)],
      attack: [enemyFrame("snake", "level_1", "idle", 1)],
      damage: [enemyFrame("snake", "level_1", "idle", 1)],
      defeat: [enemyFrame("snake", "level_1", "idle", 1)],
    },
    snake_boss: {
      idle: [enemyFrame("snake", "boss", "idle", 1)],
      attack: [enemyFrame("snake", "boss", "idle", 1)],
      damage: [enemyFrame("snake", "boss", "idle", 1)],
      defeat: [enemyFrame("snake", "boss", "idle", 1)],
    },
    // Swimming frames preserve the approved face; combat reactions use the original art.
    medaka_level_1: {
      idle: Array.from({ length: 16 }, (_, index) => enemyFrame("medaka", "level_1", "swim", index + 1)),
      attack: [enemyFrame("medaka", "level_1", "idle", 1)],
      damage: [enemyFrame("medaka", "level_1", "idle", 1)],
      defeat: [enemyFrame("medaka", "level_1", "idle", 1)],
    },
    medaka_boss: {
      idle: Array.from({ length: 16 }, (_, index) => enemyFrame("medaka", "boss", "swim", index + 1)),
      attack: [enemyFrame("medaka", "boss", "idle", 1)],
      damage: [enemyFrame("medaka", "boss", "idle", 1)],
      defeat: [enemyFrame("medaka", "boss", "idle", 1)],
    },
    crab_level_1: {
      idle: [enemyFrame("crab", "level_1", "idle", 1)],
      attack: [enemyFrame("crab", "level_1", "idle", 1)],
      damage: [enemyFrame("crab", "level_1", "idle", 1)],
      defeat: [enemyFrame("crab", "level_1", "idle", 1)],
    },
    crab_boss: {
      idle: [enemyFrame("crab", "boss", "idle", 1)],
      attack: [enemyFrame("crab", "boss", "idle", 1)],
      damage: [enemyFrame("crab", "boss", "idle", 1)],
      defeat: [enemyFrame("crab", "boss", "idle", 1)],
    },
    egg_level_1: {
      idle: [
        enemyFrame("egg", "level_1", "idle", 1),
        enemyFrame("egg", "level_1", "idle", 2),
        enemyFrame("egg", "level_1", "idle", 3),
        enemyFrame("egg", "level_1", "idle", 2),
      ],
      attack: [
        enemyFrame("egg", "level_1", "attack", 2),
      ],
      damage: [
        enemyFrame("egg", "level_1", "damage", 2),
      ],
      defeat: [
        enemyFrame("egg", "level_1", "defeat", 2),
      ],
    },
    chick_level_1: {
      idle: [
        enemyFrame("chick", "level_1", "idle", 1),
        enemyFrame("chick", "level_1", "idle", 1),
        enemyFrame("chick", "level_1", "idle", 2),
        enemyFrame("chick", "level_1", "idle", 2),
      ],
      attack: [
        enemyFrame("chick", "level_1", "attack", 2),
      ],
      damage: [
        enemyFrame("chick", "level_1", "damage", 2),
      ],
      defeat: [
        enemyFrame("chick", "level_1", "defeat", 2),
      ],
    },
    chicken_level_1: {
      idle: [
        enemyFrame("chicken", "level_1", "idle", 2),
      ],
      attack: [
        enemyFrame("chicken", "level_1", "attack", 2),
      ],
      damage: [
        enemyFrame("chicken", "level_1", "damage", 2),
      ],
      defeat: [
        enemyFrame("chicken", "level_1", "defeat", 2),
      ],
    },
    chicken_level_2: {
      idle: [
        enemyFrame("chicken", "level_2", "idle", 2),
      ],
      attack: [
        enemyFrame("chicken", "level_2", "attack", 2),
      ],
      damage: [
        enemyFrame("chicken", "level_2", "damage", 2),
      ],
      defeat: [
        enemyFrame("chicken", "level_2", "defeat", 2),
      ],
    },
    goblin_level_1: {
      idle: [
        enemyFrame("goblin", "level_1", "idle", 2),
        // enemyFrame("goblin", "level_1", "idle", 2),
      ],
      attack: [
        enemyFrame("goblin", "level_1", "attack", 2),
        // enemyFrame("goblin", "level_1", "attack", 2),
      ],
      damage: [
        enemyFrame("goblin", "level_1", "damage", 2),
        // enemyFrame("goblin", "level_1", "damage", 2),
      ],
      defeat: [
        enemyFrame("goblin", "level_1", "defeat", 2),
        // enemyFrame("goblin", "level_1", "defeat", 2),
      ],
    },
    goblin_level_2: {
      idle: [
        enemyFrame("goblin", "level_2", "idle", 2),
        // enemyFrame("goblin", "level_2", "idle", 2),
      ],
      attack: [
        enemyFrame("goblin", "level_2", "attack", 2),
        // enemyFrame("goblin", "level_2", "attack", 2),
      ],
      damage: [
        enemyFrame("goblin", "level_2", "damage", 2),
        // enemyFrame("goblin", "level_2", "damage", 2),
      ],
      defeat: [
        enemyFrame("goblin", "level_2", "defeat", 2),
        // enemyFrame("goblin", "level_2", "defeat", 2),
      ],
    },
    goblin_level_3: {
      idle: [
        enemyFrame("goblin", "level_3", "idle", 2),
        // enemyFrame("goblin", "level_3", "idle", 2),
      ],
      attack: [
        enemyFrame("goblin", "level_3", "attack", 2),
        // enemyFrame("goblin", "level_3", "attack", 2),
      ],
      damage: [
        enemyFrame("goblin", "level_3", "damage", 2),
        // enemyFrame("goblin", "level_3", "damage", 2),
      ],
      defeat: [
        enemyFrame("goblin", "level_3", "defeat", 2),
        // enemyFrame("goblin", "level_3", "defeat", 2),
      ],
    },
  },
};

document.documentElement.dataset.enemyAnimations = "loaded";
