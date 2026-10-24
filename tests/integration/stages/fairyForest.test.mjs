import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createGame } from "../../helpers/game.mjs";

const earlierStages = ["forest_path", "mist_road", "sky_castle", "storm_cove", "grassland_path", "flower_meadow", "swarm_meadow", "mushroom_forest", "spore_path"];
function battle(touch = false, fixedTiming = true) {
  const game = createGame({ "into-the-typing.player.v2": JSON.stringify({
    version: 2, totalExperience: 1270, stats: { attack: 3, agility: 2 }, weaponId: "swordShield",
    introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true,
    greatswordObtained: true, dualBladesObtained: true, swordShieldObtained: true,
    skillTutorialCompleted: true, clearedStages: earlierStages,
  }) }, { touch });
  game.run(`let seed = 33; Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); if (${fixedTiming}) randomizeEnemyAttackMs = baseMs => baseMs; startGame("fairy_forest")`);
  return game;
}
function tick(game, ms) { game.advance(ms); game.run("enemyLoop(performance.now())"); }
function reachFairy(game) {
  const types = [];
  for (let step = 0; step < 600 && !game.run('getCurrentEnemy()?.boss'); step++) {
    if (game.run("Boolean(getInputEnemy())")) {
      types.push(game.run("getInputEnemy().type"));
      game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
    }
    tick(game, 100);
  }
  assert.ok(types.length > 0 && types.every(type => type === "mushroom_level_1"));
  assert.equal(game.run("state.cleared"), 4);
  assert.equal(game.run("state.pendingExperience"), 260);
  assert.equal(game.savedProgress().totalExperience, 1270);
  game.run("const fairy = getCurrentEnemy()");
  assert.equal(game.run("fairy.type"), "tree_fairy_boss");
}

test("3-3 ends with the tree fairy, a visible wind-up and a half-damage guardable leaf attack", () => {
  const game = battle();
  reachFairy(game);
  assert.equal(game.run("els.bossIntroTitle.textContent"), "木の妖精");
  assert.equal(game.run("fairy.hp"), 60);
  assert.equal(game.run("fairy.chargeDurationMs"), 4200);
  assert.equal(game.run('fairy.element.getAttribute("aria-label")'), "木の妖精、溜め中");
  tick(game, 3149 - game.run("fairy.chargeElapsedMs"));
  assert.match(game.run("fairy.image.src"), /tree_fairy\/boss\/idle/);
  tick(game, 1);
  assert.equal(game.run("fairy.element.dataset.chargePhase"), "warning");
  assert.match(game.run("fairy.image.src"), /tree_fairy\/boss\/windup/);
  assert.doesNotMatch(game.run('fairy.element.getAttribute("aria-label")'), /\d|秒/);
  const hp = game.run("state.hp");
  game.run('fairy.attackPower = { min: 32, max: 32 }; beginPlayerGuard("keyboard")');
  tick(game, 1050);
  assert.equal(game.run("state.hp"), hp - 16);
  assert.equal(game.run("fairy.progress"), .15);
  assert.equal(game.run("fairy.element.dataset.chargePhase"), "attack");
  game.run('endPlayerGuard("keyboard")');
  tick(game, 360);
  assert.match(game.run("fairy.image.src"), /tree_fairy\/boss\/idle/);
  tick(game, 4200);
  assert.equal(game.run("state.hp"), hp - 16 - 32);
});

for (const touch of [false, true]) {
  test(`3-3 clears with ${touch ? "touch" : "keyboard"} input and saves 480 EXP only after the fairy`, () => {
    const game = battle(touch, false);
    game.run("let nextInputAt = 850; let maxActive = 0; let guarded = 0; const seen = new Set()");
    for (let time = 0; time < 180000 && game.run("state.running"); time += 50) {
      tick(game, 50);
      game.run(`{
        const enemy = getCurrentEnemy();
        if (enemy) seen.add(enemy.type);
        maxActive = Math.max(maxActive, state.activeEnemies.length);
        if (state.guarding && (!enemy || enemy.chargeElapsedMs === 0)) endPlayerGuard("keyboard");
        if (enemy && !enemy.resolving && enemy.chargeDurationMs - enemy.chargeElapsedMs <= 180 && !state.guarding) {
          if (beginPlayerGuard("keyboard")) guarded++;
        }
        if (state.specialGauge === 100) useSpecialMove();
        const input = getInputEnemy();
        if (input && performance.now() >= nextInputAt) {
          ${touch ? `const reading = getFlickReading(input).reading;
            els.flickInput.value = reading.slice(0, els.flickInput.value.length + 1);
            handleFlickInput({ isComposing: false });` : `handleTypingKeydown({ key: input.matchedWord[input.typed.length], code: "", preventDefault() {} });`}
          nextInputAt = performance.now() + 400;
        }
      }`);
    }
    assert.equal(game.run("state.running"), false);
    assert.equal(game.run("state.cleared"), 5);
    assert.equal(game.run("maxActive"), 1);
    assert.ok(game.run("guarded") > 0);
    assert.ok(game.run("state.hp") > 0);
    assert.deepEqual(game.snapshot("[...seen]"), ["mushroom_level_1", "tree_fairy_boss"]);
    assert.equal(game.run("state.battleExperience"), 480);
    assert.equal(game.savedProgress().totalExperience, 1750);
    assert.deepEqual(game.savedProgress().clearedStages, [...earlierStages, "fairy_forest"]);
    game.run("finishGame(true); continueAfterResult()");
    assert.equal(game.savedProgress().totalExperience, 1750);
    assert.equal(game.run("document.documentElement.dataset.screen"), "battle");
    assert.equal(game.run("state.stageId"), "thorn_depths");
    assert.equal(game.run("state.stageMapRegionId"), "forest");
    assert.equal(createGame(game.saved()).run("state.clearedStages.includes('fairy_forest')"), true);
  });
}

test("failing or interrupting the fairy fight discards rewards and invalidates old leaf attacks", () => {
  for (const action of ['startGame("fairy_forest")', "showStageSelect()", "finishGame(false)"]) {
    const game = battle();
    reachFairy(game);
    game.run(action);
    const hp = game.run("state.hp");
    game.advance(10000);
    game.run("fairy.chargeElapsedMs = fairy.chargeDurationMs; enemyAttack(fairy)");
    assert.equal(game.run("state.hp"), hp);
    assert.equal(game.savedProgress().totalExperience, 1270);
    assert.deepEqual(game.savedProgress().clearedStages, earlierStages);
  }
});

test("tree fairy idle and wind-up art preload and never fall back to a mushroom", () => {
  const game = battle();
  for (const pose of ["idle", "windup"]) {
    const path = `src/assets/images/enemies/tree_fairy/boss/${pose}/frame_01.webp`;
    assert.equal(existsSync(path), true);
    assert.equal(game.run(`collectGameImageSources().some(src => src.includes(${JSON.stringify(path)}))`), true);
  }
  for (const animation of ["idle", "windup", "attack", "damage", "defeat"]) {
    assert.match(game.run(`getEnemyFrames("tree_fairy_boss", "${animation}")[0]`), /tree_fairy\/boss\//);
  }
});

test("3-3 stays below 3-4 in durability, damage and even the fastest randomized attack", () => {
  const game = battle();
  const stages = game.snapshot('({fairy:stageDefinitions.fairy_forest.waves,thorn:stageDefinitions.thorn_depths.waves})');
  assert.equal(stages.fairy.reduce((sum,wave)=>sum+wave.hp*wave.count,0),152);
  for(let index=0;index<stages.fairy.length;index++) {
    const easier=stages.fairy[index],harder=stages.thorn[index];
    assert.ok(easier.hp<harder.hp);
    assert.ok(easier.attackPower.max<harder.attackPower.min);
    assert.ok(easier.chargeMs*.9>harder.chargeMs*1.1);
  }
});
