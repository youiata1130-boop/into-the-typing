import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

const saveKey = "into-the-typing.player.v2";

function completeLesson(game, { waitForReward = true } = {}) {
  game.run('startGame("forest_path"); advanceStory()');
  for (let hit = 0; hit < 3; hit++) {
    game.run('applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)');
    game.advance(480);
  }
  game.run("advanceStory()");
  for (let hit = 0; hit < 4; hit++) {
    game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
    game.advance(220);
  }
  if (waitForReward) game.advance(620);
}

test("stage 1 saves the sword reward and guides manual equipment before stage 2", () => {
  for (const touch of [false, true]) {
    const game = createGame({}, { touch });
    assert.equal(game.run('isWeaponAvailable("sword")'), false);
    game.run('selectWeapon("sword")');
    assert.equal(game.run("state.weaponId"), "branch");
    completeLesson(game, { waitForReward: false });
    assert.equal(game.savedProgress().ironSwordObtained, false);
    game.advance(620);
    assert.deepEqual(game.snapshot("({ running: state.running, weapon: state.weaponId, sword: state.ironSwordObtained, xp: state.totalExperience })"),
      { running: false, weapon: "branch", sword: true, xp: 10 });
    assert.equal(game.run("els.treasureReward.hidden || els.treasureText.hidden"), false);
    assert.equal(game.run('els.gameNotice.classList.contains("has-treasure")'), true);
    assert.equal(game.run("els.noticeButton.textContent"), "装備画面へ");
    assert.equal(game.run("document.activeElement === els.noticeButton"), true);
    const saved = game.savedProgress();
    assert.equal(saved.ironSwordObtained, true);
    assert.equal(saved.weaponId, "branch");
    assert.equal(saved.swordEquipPending, true);
    assert.equal(saved.totalExperience, 10);
    game.run("finishGame(true); continueAfterResult()");
    assert.equal(game.run("state.totalExperience"), 10);
    assert.equal(game.run("document.documentElement.dataset.screen"), "weapons");
    assert.equal(game.run("els.swordEquipGuide.hidden"), false);
    assert.equal(game.run("els.swordEquipGuide.textContent"), "鉄の剣を選んで装備しよう");
    assert.equal(game.run("document.activeElement === els.weaponSword"), true);
    assert.equal(game.run('els.weaponSwordOption.classList.contains("is-recommended")'), true);
    game.run("continueAfterSwordEquip()");
    assert.equal(game.run("state.running"), false);
    game.run('selectWeapon("greatsword")');
    assert.equal(game.run("els.swordEquipNext.disabled"), true);
    assert.equal(game.savedProgress().swordEquipPending, true);
    game.run('selectWeapon("sword")');
    assert.equal(game.savedProgress().weaponId, "sword");
    assert.equal(game.savedProgress().swordEquipPending, false);
    assert.equal(game.run("els.swordEquipGuide.textContent"), "鉄の剣を装備しました");
    assert.equal(game.run("els.swordEquipNext.disabled"), false);
    assert.equal(game.run('els.weaponSwordOption.classList.contains("is-recommended")'), false);
    const reloaded = createGame(game.saved());
    assert.equal(reloaded.run("state.weaponId"), "sword");
    assert.equal(reloaded.run("state.swordEquipPending"), false);
    game.run("continueAfterSwordEquip()");
    assert.equal(game.run("state.stageId"), "mist_road");
    assert.equal(game.run("getCurrentEnemy().weaponId"), "sword");
    assert.equal(game.run("els.treasureReward.hidden && els.treasureText.hidden"), true);
    assert.equal(game.run("els.swordEquipGuide.hidden"), true);
  }
});

test("unfinished sword equipment resumes per save and disappears after equipment", () => {
  const first = createGame();
  completeLesson(first);
  const game = createGame(first.saved(), { chooseSave: false });
  game.run('showSaveMenu("continue"); selectSaveSlot(0)');
  assert.equal(game.run("document.documentElement.dataset.screen"), "weapons");
  assert.equal(game.run("state.weaponId"), "branch");
  assert.equal(game.run("els.swordEquipGuide.hidden"), false);
  game.run('showStartScreen(); showSaveMenu("new"); selectSaveSlot(1); saveEls.name.value = "別のプレイヤー"; createPlayerSave(); showWeaponScreen()');
  assert.equal(game.run("state.swordEquipPending"), false);
  assert.equal(game.run("els.swordEquipGuide.hidden"), true);
  game.run('showStartScreen(); showSaveMenu("continue"); selectSaveSlot(0)');
  assert.equal(game.run("document.documentElement.dataset.screen"), "weapons");
  assert.equal(game.run("els.swordEquipGuide.hidden"), false);
  game.run('selectWeapon("sword"); selectWeapon("greatsword"); showHomeScreen(); showWeaponScreen()');
  assert.equal(game.run("els.swordEquipGuide.hidden"), true);
  const reloaded = createGame(game.saved(), { chooseSave: false });
  reloaded.run('showSaveMenu("continue"); selectSaveSlot(0)');
  assert.equal(reloaded.run("document.documentElement.dataset.screen"), "stage");
  assert.equal(reloaded.run("state.weaponId"), "greatsword");
});

test("failure and an interrupted clear never grant the sword", () => {
  for (const action of ["finishGame(false)", "resetGame()", 'startGame("forest_path")']) {
    const game = createGame();
    completeLesson(game, { waitForReward: false });
    game.run(action);
    game.advance(2000);
    assert.equal(game.run("state.ironSwordObtained"), false);
    assert.equal(game.run("state.totalExperience"), 0);
    assert.equal(game.run("els.treasureReward.hidden"), true);
    const reloaded = createGame(game.saved());
    reloaded.run('selectWeapon("sword")');
    assert.equal(reloaded.run("state.weaponId"), "branch");
    assert.equal(reloaded.run('isWeaponAvailable("sword")'), false);
  }
});

test("receiving the branch alone and an early clear cannot grant the sword", () => {
  const game = createGame();
  game.run("startGame(); advanceStory()");
  for (let hit = 0; hit < 3; hit++) {
    game.run('applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)');
    game.advance(480);
  }
  game.run("advanceStory(); finishGame(true)");
  assert.equal(game.run("state.running"), true);
  assert.equal(game.run("state.introCompleted"), true);
  assert.equal(game.run("state.ironSwordObtained"), false);
  game.run('resetGame(); selectWeapon("sword")');
  assert.equal(game.run("state.weaponId"), "branch");
  assert.equal(createGame(game.saved()).run('isWeaponAvailable("sword")'), false);
});

test("returning home, changing weapons, and replaying preserve the sword unlock", () => {
  const game = createGame();
  completeLesson(game);
  game.run('showHomeScreen(); selectWeapon("branch"); selectWeapon("sword")');
  assert.equal(game.run("state.weaponId"), "sword");
  game.run('selectWeapon("greatsword")');
  const reloaded = createGame(game.saved());
  assert.equal(reloaded.run("state.weaponId"), "greatsword");
  assert.equal(reloaded.run('isWeaponAvailable("sword")'), true);
  completeLesson(reloaded);
  assert.equal(reloaded.run("state.weaponId"), "branch");
  assert.equal(reloaded.run("state.swordEquipPending"), false);
  assert.equal(reloaded.run("state.totalExperience"), 20);
});

test("stage 2 awards EXP without showing another chest or switching weapons", () => {
  const game = createGame();
  completeLesson(game);
  game.run('showHomeScreen(); selectWeapon("greatsword"); startGame("mist_road")');
  for (let tick = 0; tick < 2000 && game.run("state.running"); tick++) {
    if (game.run("Boolean(getInputEnemy())")) {
      game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
    }
    game.advance(100);
  }
  assert.equal(game.run("state.running"), false);
  assert.equal(game.run("state.totalExperience"), 120);
  assert.equal(game.run("state.weaponId"), "greatsword");
  assert.equal(game.run("state.ironSwordObtained"), true);
  assert.equal(game.run("els.treasureReward.hidden && els.treasureText.hidden"), true);
  assert.equal(game.run('els.gameNotice.classList.contains("has-treasure")'), false);
});

test("older saves retain sword access and new saves honor the recorded unlock", () => {
  const base = { version: 2, totalExperience: 350, stats: { attack: 3, agility: 2 },
    weaponId: "sword", introCompleted: true, equipmentTutorialCompleted: true };
  for (const extra of [{}, { ironSwordObtained: true }, { ironSwordObtained: false },
    { introCompleted: false, ironSwordObtained: true }]) {
    const saved = { ...base, ...extra };
    const allowed = saved.introCompleted && saved.ironSwordObtained !== false;
    const game = createGame({ [saveKey]: JSON.stringify(saved) });
    assert.equal(game.run('isWeaponAvailable("sword")'), allowed);
    assert.equal(game.run("state.weaponId"), allowed ? "sword" : "branch");
    assert.equal(game.run("state.totalExperience"), 350);
    assert.deepEqual(game.snapshot("state.stats"), base.stats);
    game.run("savePlayerProgress()");
    assert.equal(createGame(game.saved()).run('isWeaponAvailable("sword")'), allowed);
  }
});

test("the chest still grants a usable sword when saving is unavailable", () => {
  const game = createGame();
  game.run('window.localStorage.setItem = () => { throw new Error("storage unavailable"); }');
  completeLesson(game);
  assert.equal(game.run("state.ironSwordObtained"), true);
  assert.equal(game.run("state.weaponId"), "branch");
  assert.equal(game.run("els.treasureReward.hidden"), false);
  game.run('continueAfterResult(); selectWeapon("sword"); continueAfterSwordEquip()');
  assert.equal(game.run("getCurrentEnemy().weaponId"), "sword");
});
