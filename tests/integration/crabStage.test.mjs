import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

function key(game, id, direction = 0) {
  return game.run("applyGameFlickKey(" + JSON.stringify(id) + ", " + direction + ")");
}

function typeKana(game, value) {
  for (const character of value) {
    const small = { ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お", っ: "つ", ゃ: "や", ゅ: "ゆ", ょ: "よ", ゎ: "わ" }[character];
    const [base, mark] = character.normalize("NFD");
    const plain = small || base;
    const mapping = game.snapshot("gameFlickKeys.filter(k => k.kana).map(k => ({ id: k.id, kana: k.kana }))");
    const row = mapping.find(row => row.kana.includes(plain));
    assert.ok(row, character);
    assert.equal(key(game, row.id, row.kana.indexOf(plain)), true);
    if (small || mark) {
      const taps = character === "づ" || character === "ゔ" || mark === "\u309a" ? 2 : 1;
      for (let i = 0; i < taps; i++) key(game, "modifier");
    }
  }
}

const progress = extra => ({
  version: 2, totalExperience: 0, stats: { attack: 1, agility: 1 },
  weaponId: "sword", introCompleted: true, equipmentTutorialCompleted: true,
  ironSwordObtained: true, clearedStages: ["forest_path"], ...extra,
});
const saved = extra => ({ "into-the-typing.player.v2": JSON.stringify(progress(extra)) });
function finishBattle(game, beforeReward = false) {
  for (let tick = 0; tick < 2000 && game.run("state.running"); tick++) {
    if (beforeReward && game.run("state.cleared === state.roundLimit")) return;
    if (game.run("Boolean(getInputEnemy())")) game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
    game.advance(100);
  }
  assert.equal(game.run("state.running"), false);
}

test("stage 3 unlocks only on the saved stage 2 clear, after the skill guide", () => {
  const game = createGame(saved());
  game.run('showStageConfirm("sky_castle"); startGame("sky_castle")');
  assert.equal(game.run("state.pendingStageId"), "");
  assert.equal(game.run("state.running"), false);
  assert.equal(game.run("getHighestAvailableStageCode()"), "2");
  game.run('startGame("mist_road"); finishGame(true)');
  assert.equal(game.run('isStageAvailable("sky_castle")'), false);
  finishBattle(game);
  assert.equal(game.run('isStageAvailable("sky_castle")'), true);
  assert.deepEqual(game.savedProgress().clearedStages, ["forest_path", "mist_road"]);
  assert.equal(game.run("els.noticeButton.textContent"), "ステータスへ");
  game.run('continueAfterResult(); changePlayerStat("attack", 1); continueAfterSkillTutorial()');
  assert.equal(game.run("document.documentElement.dataset.screen"), "stage");
  game.run('showStageConfirm("sky_castle"); startConfirmedStage()');
  assert.equal(game.run("state.stageId"), "sky_castle");
  assert.equal(game.run("els.arena.dataset.stage"), "sky_castle");
  assert.equal(game.run("els.stageConfirmName.textContent"), "潮風の浜辺");
  assert.equal(game.run("state.weaponId"), "sword");
  assert.equal(createGame(game.saved()).run('isStageAvailable("sky_castle")'), true);
});

test("stage 3 spawns exactly three crabs and saves its 75 EXP once on clear", () => {
  for (const touch of [false, true]) {
    const game = createGame(saved({ totalExperience: 40, stats: { attack: 2, agility: 1 },
      skillTutorialCompleted: true, clearedStages: ["forest_path", "mist_road"] }), { touch });
    game.run('startGame("sky_castle")');
    assert.equal(game.run("state.roundLimit"), 3);
    const seen = new Map();
    let attacks = 0;
    for (let tick = 0; tick < 1000 && game.run("state.running"); tick++) {
      const enemy = game.snapshot("getCurrentEnemy() ? { id: getCurrentEnemy().id, type: getCurrentEnemy().type, hp: getCurrentEnemy().maxHp, boss: getCurrentEnemy().boss } : null");
      if (enemy) seen.set(enemy.id, enemy);
      if (game.run("Boolean(getInputEnemy())")) {
        assert.equal(game.run("state.totalExperience"), 40);
        assert.equal(game.run('state.clearedStages.includes("sky_castle")'), false);
        if (touch) typeKana(game, game.run("getFlickReading(getInputEnemy()).reading"));
        else game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
        attacks++;
      }
      game.advance(100);
    }
    assert.equal(game.run("state.running"), false);
    assert.equal(seen.size, 3);
    assert.ok([...seen.values()].every(e => e.type === "crab_level_1" && e.hp === 5 && !e.boss));
    assert.equal(attacks, 9);
    assert.deepEqual(game.snapshot("({ xp: state.totalExperience, level: state.level, sp: state.skillPoints, clears: state.clearedStages })"),
      { xp: 115, level: 3, sp: 1, clears: ["forest_path", "mist_road", "sky_castle"] });
    assert.equal(game.run("els.noticeButton.textContent"), "ステージ選択へ");
    assert.equal(game.run("state.skillTutorialPending"), false);
    assert.equal(game.run("els.treasureReward.hidden"), true);
    game.run("finishGame(true)");
    assert.equal(game.run("state.totalExperience"), 115);
    const reloaded = createGame(game.saved());
    assert.equal(reloaded.run("state.totalExperience"), 115);
    assert.equal(reloaded.run("getHighestAvailableStageCode()"), "3");
    game.run('continueAfterResult(); startGame("forest_path")');
    assert.equal(game.run("els.arena.dataset.stage"), "forest_path");
  }
});

test("failed or interrupted stage 2 never unlocks stage 3, including before the reward callback", () => {
  for (const action of ["finishGame(false)", "resetGame()", 'startGame("mist_road")']) {
    const game = createGame(saved());
    game.run('startGame("mist_road")');
    finishBattle(game, true);
    game.run(action); game.advance(2000);
    assert.equal(game.run('isStageAvailable("sky_castle")'), false);
    assert.equal(game.run("state.totalExperience"), 0);
    assert.equal(createGame(game.saved()).run('isStageAvailable("sky_castle")'), false);
  }
});

test("stage 3 failure discards pending EXP and does not mark the stage cleared", () => {
  const game = createGame(saved({ totalExperience: 40, clearedStages: ["forest_path", "mist_road"] }));
  game.run('startGame("sky_castle")');
  finishBattle(game, true);
  game.run("finishGame(false)"); game.advance(2000);
  assert.equal(game.run("state.totalExperience"), 40);
  assert.deepEqual(game.savedProgress().clearedStages, ["forest_path", "mist_road"]);
});

test("older completed saves unlock stage 3 without altering stats, and explicit clear records win", () => {
  for (const [extra, expected] of [
    [{ totalExperience: 40, clearedStages: undefined }, true],
    [{ totalExperience: 350, clearedStages: undefined }, true],
    [{ totalExperience: 0, clearedStages: undefined }, false],
    [{ totalExperience: 40, equipmentTutorialCompleted: false, clearedStages: undefined }, false],
    [{ totalExperience: 40, clearedStages: [] }, false],
    [{ totalExperience: 40, clearedStages: "mist_road" }, false],
    [{ totalExperience: 40, clearedStages: ["forest_path", "mist_road", "mist_road", "invalid"] }, true],
  ]) {
    const game = createGame(saved(extra));
    const before = game.snapshot("({ xp: state.totalExperience, stats: state.stats, weapon: state.weaponId })");
    assert.equal(game.run('isStageAvailable("sky_castle")'), expected);
    game.run("savePlayerProgress()");
    const reloaded = createGame(game.saved());
    assert.equal(reloaded.run('isStageAvailable("sky_castle")'), expected);
    assert.deepEqual(reloaded.snapshot("({ xp: state.totalExperience, stats: state.stats, weapon: state.weaponId })"), before);
    assert.equal(new Set(game.savedProgress().clearedStages).size, game.savedProgress().clearedStages.length);
    assert.ok(!game.savedProgress().clearedStages.includes("invalid"));
  }
});

test("stage unlocks and save-card progress stay isolated across all three players", () => {
  const game = createGame(saved(), { chooseSave: false });
  game.run('showSaveMenu("continue"); selectSaveSlot(0); startGame("mist_road")');
  finishBattle(game);
  game.run('showStartScreen(); showSaveMenu("continue")');
  assert.match(game.run('saveEls.slots[0].querySelector("[data-save-detail]").textContent'), /ステージ3$/);
  for (const slot of [1, 2]) {
    game.run('showSaveMenu("new"); selectSaveSlot(' + slot + '); saveEls.name.value = "別の冒険"; createPlayerSave()');
    assert.equal(game.run('isStageAvailable("sky_castle")'), false);
    assert.deepEqual(game.snapshot("state.clearedStages"), []);
  }
  game.run('showStartScreen(); showSaveMenu("continue")');
  assert.match(game.run('saveEls.slots[1].querySelector("[data-save-detail]").textContent'), /ステージ1$/);
  assert.match(game.run('saveEls.slots[2].querySelector("[data-save-detail]").textContent'), /ステージ1$/);
  game.run('selectSaveSlot(0)');
  assert.equal(game.run('isStageAvailable("sky_castle")'), true);
});
