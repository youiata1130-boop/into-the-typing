import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createGame } from "../../helpers/game.mjs";

const clearedStages = ["forest_path", "mist_road", "sky_castle", "storm_cove", "grassland_path", "flower_meadow", "swarm_meadow"];
function battle(touch = false) {
  const game = createGame({
    "into-the-typing.player.v2": JSON.stringify({
      version: 2, totalExperience: 755, stats: { attack: 2, agility: 1 },
      weaponId: "greatsword", introCompleted: true, equipmentTutorialCompleted: true,
      ironSwordObtained: true, greatswordObtained: true, dualBladesObtained: true,
      skillTutorialCompleted: true, clearedStages,
    }),
  }, { touch });
  game.run('startGame("mushroom_forest"); const mushroom = getCurrentEnemy()');
  return game;
}
function tick(game, ms) {
  game.advance(ms);
  game.run("enemyLoop(performance.now())");
}

test("stationary mushroom warns before the exact attack boundary and charges again after recovery", () => {
  const game = battle();
  const hp = game.run("state.hp");
  const position = game.run("mushroom.progress");
  tick(game, 849);
  assert.equal(game.run("mushroom.chargeElapsedMs"), 0);
  assert.equal(game.run("mushroom.chargeLabel.textContent"), "攻撃まで 6.0秒");
  tick(game, 1);
  tick(game, 4500);
  assert.equal(game.run("mushroom.element.dataset.chargePhase"), "warning");
  assert.equal(game.run("mushroom.chargeLabel.textContent"), "攻撃まで 1.5秒");
  assert.equal(game.run('mushroom.chargeMeter.getAttribute("aria-valuenow")'), "75");
  game.run("enemyAttack(mushroom)");
  assert.equal(game.run("state.hp"), hp);
  tick(game, 1499);
  assert.equal(game.run("state.hp"), hp);
  tick(game, 1);
  const after = game.run("state.hp");
  assert.ok(after < hp);
  assert.equal(game.run("mushroom.progress"), position);
  assert.equal(game.run("mushroom.chargeLabel.textContent"), "胞子攻撃！");
  assert.equal(game.run("getInputEnemy() === mushroom"), true);
  game.run("enemyAttack(mushroom)");
  assert.equal(game.run("state.hp"), after);
  tick(game, 360);
  assert.equal(game.run("mushroom.chargeLabel.textContent"), "攻撃まで 6.0秒");
  tick(game, 5999);
  assert.equal(game.run("state.hp"), after);
  tick(game, 1);
  assert.ok(game.run("state.hp") < after);
  assert.equal(game.run("mushroom.progress"), position);
});

test("ordinary hits briefly pause charging without moving the mushroom or erasing its warning", () => {
  const game = battle();
  tick(game, 850);
  tick(game, 5000);
  game.run("mushroom.hp = 100; applyTypedValue(mushroom, mushroom.matchedWord)");
  assert.equal(game.run("mushroom.progress"), .15);
  tick(game, 219);
  assert.equal(game.run("mushroom.chargeElapsedMs"), 5000);
  tick(game, 1);
  assert.equal(game.run("mushroom.chargeElapsedMs"), 5000);
  const hp = game.run("state.hp");
  tick(game, 999);
  assert.equal(game.run("state.hp"), hp);
  tick(game, 1);
  assert.ok(game.run("state.hp") < hp);
  assert.equal(game.run("mushroom.progress"), .15);
});

test("strong strike resets the charge while survivors stay planted", () => {
  const game = battle();
  tick(game, 850);
  tick(game, 5500);
  game.run("mushroom.hp = 100; state.specialGauge = 100");
  assert.equal(game.run("useSpecialMove()"), true);
  assert.equal(game.run("mushroom.chargeElapsedMs"), 0);
  assert.equal(game.run("mushroom.progress"), .15);
  tick(game, 420);
  assert.equal(game.run("mushroom.chargeElapsedMs"), 0);
  const hp = game.run("state.hp");
  tick(game, 5999);
  assert.equal(game.run("state.hp"), hp);
  tick(game, 1);
  assert.ok(game.run("state.hp") < hp);
});

test("defeat, restart and leaving cancel the old charge and discard pending rewards", () => {
  for (const action of ['startGame("mushroom_forest")', "showStageSelect()", "finishGame(false)"]) {
    const game = battle();
    tick(game, 850);
    tick(game, 5900);
    game.run("mushroom.hp = 1; applyTypedValue(mushroom, mushroom.matchedWord)");
    tick(game, 220);
    assert.equal(game.run("mushroom.chargeMeter.hidden"), true);
    game.run(action);
    const hp = game.run("state.hp");
    game.advance(8000);
    game.run("enemyAttack(mushroom)");
    assert.equal(game.run("state.hp"), hp);
    assert.equal(game.savedProgress().totalExperience, 755);
    assert.deepEqual(game.savedProgress().clearedStages, clearedStages);
  }
});

test("three mushrooms award 135 EXP once on desktop and touch, and the clear survives reload", () => {
  for (const touch of [false, true]) {
    const game = battle(touch);
    const seen = new Set();
    for (let step = 0; step < 500 && game.run("state.running"); step++) {
      if (game.run("Boolean(getInputEnemy())")) {
        seen.add(game.run("getInputEnemy().id"));
        assert.equal(game.run("getInputEnemy().type"), "mushroom_level_1");
        game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
      }
      tick(game, 100);
    }
    assert.equal(seen.size, 3);
    assert.equal(game.run("state.running"), false);
    assert.equal(game.run("state.battleExperience"), 135);
    assert.equal(game.savedProgress().totalExperience, 890);
    assert.deepEqual(game.savedProgress().clearedStages, [...clearedStages, "mushroom_forest"]);
    game.run("finishGame(true)");
    assert.equal(game.savedProgress().totalExperience, 890);
    const reloaded = createGame(game.saved());
    assert.equal(reloaded.run("state.stageMapRegionId"), "forest");
  }
});

test("forest art preloads and the mushroom uses its own sprite for every state", () => {
  const game = battle();
  const urls = game.snapshot("collectGameImageSources()");
  for (const path of ["backgrounds/stage_map/forest.png", "backgrounds/stages/forest.png", "enemies/mushroom/level_1/idle/frame_01.png"]) {
    assert.ok(urls.some(url => url.includes(path)));
    assert.ok(existsSync(new URL("../../../src/assets/images/" + path, import.meta.url)));
  }
  for (const animation of ["idle", "damage", "attack", "defeat"]) {
    assert.match(game.run(`getEnemyFrames("mushroom_level_1", "${animation}")[0]`), /enemies\/mushroom\//);
  }
});
