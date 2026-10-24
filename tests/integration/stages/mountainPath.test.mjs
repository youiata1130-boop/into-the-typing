import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createGame } from "../../helpers/game.mjs";

const cleared = ["forest_path", "mist_road", "sky_castle", "storm_cove", "grassland_path", "flower_meadow", "swarm_meadow", "mushroom_forest", "spore_path", "fairy_forest", "thorn_depths"];
function battle({ touch = false, weaponId = "swordShield", unlocked = true } = {}) {
  const game = createGame({ "into-the-typing.player.v2": JSON.stringify({
    version: 2, totalExperience: 2850, stats: { attack: 7, agility: 3 }, weaponId,
    introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true,
    greatswordObtained: true, dualBladesObtained: true, swordShieldObtained: true,
    skillTutorialCompleted: true, clearedStages: unlocked ? cleared : cleared.slice(0, -1),
  }) }, { touch });
  game.run('startGame("mountain_path")');
  game.advance(1600);
  return game;
}
function capture(game) {
  // Real defeat/removal callbacks must enter the event before the next wave spawns.
  for (let index = 0; index < 2; index++) {
    game.run('{ const enemy = getCurrentEnemy(); enemy.hp = 0; defeatEnemy(enemy); }');
    game.advance(index ? 620 : 900);
  }
  assert.equal(game.run('isMountainCaptureActive()'), true);
}

test("4-1 unlocks after 3-4 with its own mountain map, birds and stage-only capture artwork", () => {
  assert.equal(battle({ unlocked: false }).run('state.running'), false);
  const game = battle();
  assert.equal(game.run('state.stageId'), 'mountain_path');
  assert.equal(game.run('state.stageMapRegionId'), 'mountain');
  assert.equal(game.run('state.roundLimit'), 5);
  assert.equal(game.run('getStageDefinition("thorn_depths").nextStageId'), 'mountain_path');
  assert.equal(game.run('getCurrentEnemy().type'), 'mountain_bird_level_1');
  const sources = game.snapshot('collectStageImageSources("mountain_path")');
  for (const source of sources) assert.ok(existsSync(new URL(source).pathname.slice(1)), source);
  assert.ok(sources.some(src => src.includes('/mountain_eagle/')));
  assert.ok(!game.snapshot('collectStageImageSources("thorn_depths")').some(src => src.includes('/mountain_eagle/')));
});

test("birds approach the player and attack on arrival rather than charging in place", () => {
  const game = battle();
  game.run('enemyLoop(performance.now())');
  const before = game.run('getCurrentEnemy().progress');
  game.advance(1000);
  game.run('enemyLoop(performance.now())');
  assert.ok(game.run('getCurrentEnemy().progress') > before);
  assert.notEqual(game.run('getCurrentEnemy().attackStyle'), 'charge');
  const hp = game.run('state.hp');
  game.advance(10000);
  game.run('enemyLoop(performance.now())');
  assert.equal(game.run('getCurrentEnemy().atBase'), true);
  assert.ok(game.run('state.hp') < hp);
});

for (const weaponId of ['sword', 'greatsword', 'dualBlades', 'swordShield']) {
  test(`${weaponId}: capture uses the full passage and blocks weapon actions without spending the gauge`, () => {
    const game = battle({ weaponId });
    capture(game);
    game.run('state.specialGauge = 100');
    assert.equal(game.run('state.activeEnemies.length'), 0);
    assert.equal(game.run('getInputEnemy().translation'), 'たちまち足の下で雲雀の声がし出した。');
    assert.equal(game.run('getInputEnemy().translation.length'), 18);
    assert.equal(game.run('beginPlayerGuard("keyboard")'), false);
    assert.equal(game.run('beginPlayerCounter()'), false);
    assert.equal(game.run('useSpecialMove()'), false);
    assert.equal(game.run('state.specialGauge'), 100);
    assert.equal(game.run('els.weaponCharge.hidden'), true);
    assert.equal(game.run('els.nextWordPreview.hidden'), true);
    const deadline = game.run('mountainCapture.deadline');
    game.run('applyTypedValue(getInputEnemy(), "ta"); applyTypedValue(getInputEnemy(), "tax")');
    assert.equal(game.run('getInputEnemy().typed'), 'ta');
    game.run('handleTypingKeydown({key:"Backspace",preventDefault(){}})');
    assert.equal(game.run('getInputEnemy().typed'), 't');
    assert.equal(game.run('mountainCapture.deadline'), deadline);
    game.advance(1000);
    assert.equal(game.run('captureUi.time.textContent'), '残り29秒');
  });
}

for (const touch of [false, true]) test(`${touch ? 'flick' : 'keyboard'} passage completion escapes once, resumes the next wave and saves 460 EXP on clear`, () => {
  const game = battle({ touch });
  capture(game);
  const hp = game.run('state.hp');
  const gauge = game.run('state.specialGauge');
  if (touch) {
    const reading = game.run('getFlickReading(getInputEnemy()).reading');
    assert.equal(reading, 'たちまちあしのしたでひばりのこえがしだした');
    for (let length = 1; length <= reading.length; length++) {
      game.run(`els.flickInput.value = ${JSON.stringify(reading.slice(0, length))}; handleFlickInput({isComposing:false})`);
      game.advance(100);
    }
  } else {
    const input = game.run('getInputEnemy().matchedWord');
    for (const key of input) {
      game.run(`handleTypingKeydown({key:${JSON.stringify(key)},code:"",preventDefault(){}})`);
      game.advance(100);
    }
  }
  assert.equal(game.run('captureUi.heading.textContent'), '脱出！');
  assert.equal(game.run('state.cleared'), 2);
  assert.equal(game.run('state.hp'), hp);
  assert.equal(game.run('state.specialGauge'), gauge);
  assert.equal(game.run('state.pendingExperience'), 160);
  game.advance(1000);
  assert.equal(game.run('isMountainCaptureActive()'), false);
  assert.equal(game.run('getCurrentEnemy().type'), 'mountain_bird_level_1');
  assert.equal(game.run('state.currentWaveIndex'), 1);
  for (let index = 0; index < 3; index++) {
    game.run('{const enemy = getCurrentEnemy(); enemy.hp = 0; defeatEnemy(enemy)}');
    game.advance(900);
  }
  assert.equal(game.run('state.running'), false);
  assert.equal(game.savedProgress().totalExperience, 3310);
  assert.ok(game.savedProgress().clearedStages.includes('mountain_path'));
  game.advance(31000);
  assert.equal(game.savedProgress().totalExperience, 3310);
});

test("an unfinished passage fails at exactly 30 seconds and grants no partial EXP", () => {
  const game = battle();
  capture(game);
  game.run('applyTypedValue(getInputEnemy(), "ta")');
  game.advance(29999);
  assert.equal(game.run('state.running'), true);
  game.advance(1);
  assert.equal(game.run('state.running'), false);
  assert.equal(game.run('state.hp'), 0);
  assert.equal(game.run('isMountainCaptureActive()'), false);
  assert.match(game.run('els.noticeTitle.textContent'), /大鳥から脱出できなかった/);
  assert.equal(game.savedProgress().totalExperience, 2850);
  assert.ok(!game.savedProgress().clearedStages.includes('mountain_path'));
});

test("late input cannot beat an expired deadline, while input just before it can escape", () => {
  const late = battle();
  capture(late);
  late.run('mountainCapture.deadline = performance.now(); applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)');
  assert.equal(late.run('state.running'), false);
  const timely = battle();
  capture(timely);
  timely.advance(29999);
  timely.run('applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)');
  timely.advance(1000);
  assert.equal(timely.run('state.running'), true);
  assert.equal(timely.run('state.currentWaveIndex'), 1);
});

test("leaving and restarting clears capture, input and old deadline callbacks", () => {
  const game = battle();
  capture(game);
  game.run('applyTypedValue(getInputEnemy(), "ta"); interruptGame(); startGame("mountain_path")');
  assert.equal(game.run('isMountainCaptureActive()'), false);
  assert.equal(game.run('mountainCapture.completed'), false);
  assert.equal(game.run('captureUi.hud.hidden'), true);
  game.advance(31000);
  assert.equal(game.run('state.running'), true);
  capture(game);
  assert.equal(game.run('getInputEnemy().typed'), '');
  assert.equal(game.run('captureUi.time.textContent'), '残り30秒');
});
