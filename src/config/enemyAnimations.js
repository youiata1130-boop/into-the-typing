const enemyAssetVersion = "asset-layout-v1";
const enemyFrame = (enemy, level, state, frame) =>
  `src/assets/images/enemies/${enemy}/${level}/${state}/frame_${String(frame).padStart(2, "0")}.png?v=${enemyAssetVersion}`;

// Add new frames in order:
// frame_01.png, frame_02.png, frame_03.png ...
// Then add the same paths to the matching array below.
window.ENEMY_ANIMATIONS = {
  defaultEnemy: "goblin_level_1",
  frameMs: 140,
  enemies: {
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
