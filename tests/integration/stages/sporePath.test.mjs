import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../../helpers/game.mjs";

const earlierStages = ["forest_path", "mist_road", "sky_castle", "storm_cove", "grassland_path", "flower_meadow", "swarm_meadow", "mushroom_forest"];
function battle(touch = false) {
  const game = createGame({ "into-the-typing.player.v2": JSON.stringify({
    version: 2, totalExperience: 890, stats: { attack: 2, agility: 1 }, weaponId: "swordShield",
    introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true,
    greatswordObtained: true, dualBladesObtained: true, swordShieldObtained: true,
    skillTutorialCompleted: true, clearedStages: earlierStages,
  }) }, { touch });
  game.run(`
    let seed = 32;
    Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    startGame("spore_path");
  `);
  return game;
}
function tick(game, ms) {
  game.advance(ms);
  game.run("enemyLoop(performance.now())");
}

test("both waves warn before firing from a fixed position and can be guarded", () => {
  const game = battle();
  tick(game, 850);
  const seen = [];
  for (let index = 0; index < 4; index++) {
    assert.equal(game.run("state.activeEnemies.length"), 1);
    seen.push(game.snapshot('({ type: getCurrentEnemy().type, hp: getCurrentEnemy().hp, attack: getCurrentEnemy().attackPower, charge: getCurrentEnemy().chargeDurationMs })'));
    const duration = game.run("getCurrentEnemy().chargeDurationMs");
    tick(game, duration * .75 - game.run("getCurrentEnemy().chargeElapsedMs"));
    assert.equal(game.run('getCurrentEnemy().element.dataset.chargePhase'), "warning");
    assert.match(game.run("getCurrentEnemy().chargeLabel.textContent"), /攻撃まで 1\.[34]秒/);
    game.run('beginPlayerGuard("keyboard")');
    tick(game, duration * .25 - 1);
    assert.notEqual(game.run("getCurrentEnemy().animation"), "attack");
    tick(game, 1);
    assert.equal(game.run("getCurrentEnemy().animation"), "attack");
    assert.equal(game.run("getCurrentEnemy().chargeElapsedMs"), 0);
    assert.equal(game.run("getCurrentEnemy().progress"), .15);
    assert.equal(game.run("state.hp"), game.run("getMaxHp()"));
    game.run('endPlayerGuard("keyboard")');
    tick(game, 360);
    const id = game.run("getCurrentEnemy().id");
    for (let step = 0; step < 100 && game.run(`state.running && state.activeEnemies.some(enemy => enemy.id === ${JSON.stringify(id)})`); step++) {
      if (game.run("Boolean(getInputEnemy())")) game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
      tick(game, 100);
    }
    if (index < 3) tick(game, 300);
  }
  assert.deepEqual(seen.map(enemy => [enemy.hp, enemy.charge]), [[14, 5500], [14, 5500], [16, 5000], [16, 5000]]);
  assert.ok(seen.every(enemy => enemy.type === "mushroom_level_1"));
  assert.deepEqual(seen.map(enemy => enemy.attack), [{ min: 18, max: 22 }, { min: 18, max: 22 }, { min: 20, max: 24 }, { min: 20, max: 24 }]);
});

for (const touch of [false, true]) {
  test(`3-2 can be cleared with paced ${touch ? "touch" : "keyboard"} input and guard, saving 220 EXP once`, () => {
    const game = battle(touch);
    game.run('let nextInputAt = 850; let guards = 0; let maxActive = 0;');
    for (let elapsed = 0; elapsed < 180000 && game.run("state.running"); elapsed += 50) {
      tick(game, 50);
      game.run(`{
        maxActive = Math.max(maxActive, state.activeEnemies.length);
        const current = getCurrentEnemy();
        if (state.guarding && (!current || current.chargeElapsedMs === 0)) endPlayerGuard("keyboard");
        if (current && !current.resolving && current.chargeDurationMs - current.chargeElapsedMs <= 250 && !state.guarding) {
          if (beginPlayerGuard("keyboard")) guards++;
        }
        if (state.specialGauge === 100) useSpecialMove();
        const input = getInputEnemy();
        if (input && performance.now() >= nextInputAt) {
          ${touch ? `const reading = getFlickReading(input).reading;
            els.flickInput.value = reading.slice(0, els.flickInput.value.length + 1);
            handleFlickInput({ isComposing: false });` : `handleTypingKeydown({ key: input.matchedWord[input.typed.length], code: "", preventDefault() {} });`}
          nextInputAt = performance.now() + 600;
        }
      }`);
    }
    assert.equal(game.run("state.running"), false);
    assert.equal(game.run("state.cleared"), 4);
    assert.equal(game.run("maxActive"), 1);
    assert.ok(game.run("guards") > 0);
    assert.equal(game.run("state.hp"), game.run("getMaxHp()"));
    assert.equal(game.run("state.battleExperience"), 220);
    assert.equal(game.savedProgress().totalExperience, 1110);
    assert.deepEqual(game.savedProgress().clearedStages, [...earlierStages, "spore_path"]);
    assert.equal(game.run("els.treasureReward.hidden"), true);
    game.run("finishGame(true); continueAfterResult()");
    assert.equal(game.savedProgress().totalExperience, 1110);
    assert.equal(game.run("document.documentElement.dataset.screen"), "stage");
    assert.equal(game.run("state.stageMapRegionId"), "forest");
    const reloaded = createGame(game.saved());
    assert.equal(reloaded.run("state.clearedStages.includes('spore_path')"), true);
    assert.equal(reloaded.run("getHighestAvailableStageCode()"), "3-2");
  });
}

test("losing or leaving 3-2 discards its pending EXP and cancels its old attacks", () => {
  for (const action of ['startGame("spore_path")', "showStageSelect()", "finishGame(false)"]) {
    const game = battle();
    tick(game, 850);
    game.run("const first = getCurrentEnemy(); first.hp = 1; applyTypedValue(first, first.matchedWord)");
    tick(game, 1400);
    assert.equal(game.run("state.pendingExperience"), 50);
    game.run(`const oldEnemy = getCurrentEnemy(); ${action}`);
    const hp = game.run("state.hp");
    game.advance(10000);
    game.run("oldEnemy.chargeElapsedMs = oldEnemy.chargeDurationMs; enemyAttack(oldEnemy)");
    assert.equal(game.run("state.hp"), hp);
    assert.equal(game.savedProgress().totalExperience, 890);
    assert.deepEqual(game.savedProgress().clearedStages, earlierStages);
  }
});
