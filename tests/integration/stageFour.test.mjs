import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

const progress = extra => ({
  version: 2, totalExperience: 115, stats: { attack: 2, agility: 1 },
  weaponId: "greatsword", introCompleted: true, equipmentTutorialCompleted: true,
  ironSwordObtained: true, greatswordObtained: true, greatswordEquipPending: false,
  skillTutorialCompleted: true, clearedStages: ["forest_path", "mist_road", "sky_castle"], ...extra,
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

test("stage 4 requires a recorded stage 3 clear, including older saves", () => {
  for (const clearedStages of [undefined, [], ["forest_path", "mist_road"]]) {
    const game = createGame(saved({ totalExperience: 350, clearedStages }));
    game.run('showStageConfirm("storm_cove"); startGame("storm_cove")');
    assert.equal(game.run("state.running"), false);
    assert.equal(game.run("state.pendingStageId"), "");
    assert.equal(game.run('isStageAvailable("storm_cove")'), false);
  }
  const game = createGame(saved());
  const before = game.snapshot("({xp:state.totalExperience,stats:state.stats,weapon:state.weaponId})");
  assert.equal(game.run('isStageAvailable("storm_cove")'), true);
  assert.equal(game.run("getHighestAvailableStageCode()"), "4");
  game.run('showStageConfirm("storm_cove")');
  assert.equal(game.run("els.stageConfirmName.textContent"), "荒波の入り江");
  assert.equal(game.run("state.pendingStageId"), "storm_cove");
  game.run("savePlayerProgress()");
  const reloaded = createGame(game.saved());
  assert.equal(reloaded.run('isStageAvailable("storm_cove")'), true);
  assert.deepEqual(reloaded.snapshot("({xp:state.totalExperience,stats:state.stats,weapon:state.weaponId})"), before);
});

test("stage 4 has two fish, two crabs and a stronger king, then saves 140 EXP once", () => {
  for (const touch of [false, true]) {
    const game = createGame(saved(), { touch });
    game.run('showStageConfirm("storm_cove"); startConfirmedStage()');
    assert.equal(game.run("els.arena.dataset.stage"), "storm_cove");
    assert.equal(game.run("state.roundLimit"), 5);
    const seen = new Map();
    let attacks = 0;
    for (let tick = 0; tick < 2000 && game.run("state.running"); tick++) {
      const enemy = game.snapshot("getCurrentEnemy() ? {id:getCurrentEnemy().id,type:getCurrentEnemy().type,hp:getCurrentEnemy().maxHp,boss:getCurrentEnemy().boss} : null");
      if (enemy) {
        if (!seen.has(enemy.id) && enemy.boss) {
          assert.equal(game.run("els.bossIntroTitle.textContent"), "荒波のカニ王");
          assert.equal(game.run('getCurrentEnemy().hpTrack.getAttribute("aria-label")'), "荒波のカニ王のHP");
        }
        seen.set(enemy.id, enemy);
      }
      if (game.run("Boolean(getInputEnemy())")) {
        assert.equal(game.run("state.totalExperience"), 115);
        assert.equal(game.run('state.clearedStages.includes("storm_cove")'), false);
        game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
        attacks++;
      }
      game.advance(100);
    }
    assert.equal(game.run("state.running"), false);
    assert.deepEqual([...seen.values()].map(({type,hp,boss}) => ({type,hp,boss})), [
      {type:"medaka_level_1",hp:8,boss:false}, {type:"medaka_level_1",hp:8,boss:false},
      {type:"crab_level_1",hp:12,boss:false}, {type:"crab_level_1",hp:12,boss:false},
      {type:"crab_boss",hp:24,boss:true},
    ]);
    assert.equal(attacks, 9);
    assert.deepEqual(game.snapshot("({xp:state.totalExperience,level:state.level,sp:state.skillPoints,weapon:state.weaponId})"),
      {xp:255,level:4,sp:2,weapon:"greatsword"});
    assert.equal(game.run("state.battleExperience"), 140);
    assert.equal(game.run("els.treasureReward.hidden"), true);
    assert.equal(game.run("els.noticeButton.textContent"), "ステージ選択へ");
    assert.equal(game.run("state.greatswordEquipPending || state.skillTutorialPending"), false);
    game.run("finishGame(true)");
    assert.equal(game.run("state.totalExperience"), 255);
    assert.deepEqual(game.savedProgress().clearedStages, ["forest_path","mist_road","sky_castle","storm_cove"]);
    assert.equal(createGame(game.saved()).run("state.totalExperience"), 255);
    game.run("continueAfterResult()");
    assert.equal(game.run("document.documentElement.dataset.screen"), "stage");
  }
});

test("stage 4 failure or interruption before the reward cannot save EXP or a clear", () => {
  for (const action of ["finishGame(false)", "resetGame()", 'startGame("storm_cove")']) {
    const game = createGame(saved());
    game.run('startGame("storm_cove"); finishGame(true)');
    assert.equal(game.run("state.running"), true);
    finishBattle(game, true);
    game.run(action); game.advance(2000);
    assert.equal(game.run("state.totalExperience"), 115);
    assert.equal(game.run('state.clearedStages.includes("storm_cove")'), false);
    const reloaded = createGame(game.saved());
    assert.equal(reloaded.run('state.clearedStages.includes("storm_cove")'), false);
    assert.equal(reloaded.run("state.totalExperience"), 115);
    assert.equal(reloaded.run("state.weaponId"), "greatsword");
  }
});

test("greatsword equipment resumes after reload and leads directly into stage 4", () => {
  const game = createGame(saved({ greatswordObtained:false, weaponId:"sword" }), { chooseSave:false });
  game.run('showSaveMenu("continue"); selectSaveSlot(0)');
  assert.equal(game.run("document.documentElement.dataset.screen"), "weapons");
  assert.equal(game.run("state.stageId"), "forest_path");
  assert.equal(game.run("els.weaponEquipNext.textContent"), "ステージ4へ");
  assert.equal(game.run("els.weaponEquipNext.disabled"), true);
  game.run('selectWeapon("greatsword"); continueAfterWeaponEquip()');
  assert.equal(game.run("state.stageId"), "storm_cove");
  assert.equal(game.run("state.running"), true);
  assert.equal(game.run("getCurrentEnemy().weaponId"), "greatsword");
});

test("stage 4 progress and save-card stage stay separate for all three players", () => {
  const game = createGame(saved(), { chooseSave:false });
  game.run('showSaveMenu("continue"); selectSaveSlot(0); startGame("storm_cove")');
  finishBattle(game);
  game.run('showStartScreen(); showSaveMenu("continue")');
  assert.match(game.run('saveEls.slots[0].querySelector("[data-save-detail]").textContent'), /ステージ4$/);
  for (const slot of [1,2]) {
    game.run('showSaveMenu("new"); selectSaveSlot(' + slot + '); saveEls.name.value="新しい冒険"; createPlayerSave()');
    assert.equal(game.run('isStageAvailable("storm_cove")'), false);
    assert.deepEqual(game.snapshot("state.clearedStages"), []);
  }
  game.run('showStartScreen(); showSaveMenu("continue"); selectSaveSlot(0)');
  assert.equal(game.run('isStageAvailable("storm_cove")'), true);
  assert.equal(game.run('state.clearedStages.includes("storm_cove")'), true);
  assert.equal(game.run("state.totalExperience"), 255);
});
