import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

const progress = extra => ({
  version: 2, totalExperience: 40, stats: { attack: 2, agility: 1 },
  weaponId: "sword", introCompleted: true, equipmentTutorialCompleted: true,
  ironSwordObtained: true, greatswordObtained: false,
  skillTutorialCompleted: true, clearedStages: ["forest_path", "mist_road"], ...extra,
});
const saved = extra => ({ "into-the-typing.player.v2": JSON.stringify(progress(extra)) });
function clearCrabs(game, beforeReward = false) {
  game.run('startGame("sky_castle")');
  for (let tick = 0; tick < 1000 && game.run("state.running"); tick++) {
    if (beforeReward && game.run("state.cleared === state.roundLimit")) return;
    if (game.run("Boolean(getInputEnemy())")) game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
    game.advance(100);
  }
  assert.equal(game.run("state.running"), false);
}

test("stage 3 gives a greatsword and guides manual equipment before stage 4", () => {
  const game = createGame(saved());
  clearCrabs(game, true);
  assert.equal(game.run('isWeaponAvailable("greatsword")'), false);
  assert.equal(game.savedProgress().greatswordObtained, false);
  game.advance(1000);
  assert.equal(game.run("els.treasureText.textContent"), "大剣を手に入れた！");
  assert.equal(game.run('els.treasureArt.getAttribute("aria-label")'), "宝箱から現れた大剣");
  assert.match(game.run('els.treasureBlade.getAttribute("d")'), /166/);
  assert.equal(game.run("els.noticeButton.textContent"), "装備画面へ");
  assert.equal(game.savedProgress().greatswordObtained, true);
  assert.equal(game.savedProgress().greatswordEquipPending, true);
  assert.equal(game.savedProgress().weaponId, "sword");
  game.run("continueAfterResult()");
  assert.equal(game.run("document.documentElement.dataset.screen"), "weapons");
  assert.equal(game.run("els.weaponEquipGuide.textContent"), "大剣を選んで装備しよう");
  assert.equal(game.run("document.activeElement === els.weaponGreatsword"), true);
  assert.equal(game.run('els.weaponGreatswordOption.classList.contains("is-recommended")'), true);
  assert.equal(game.run('els.weaponSwordOption.classList.contains("is-recommended")'), false);
  assert.equal(game.run("els.weaponEquipNext.disabled"), true);
  game.run("continueAfterWeaponEquip()");
  assert.equal(game.run("document.documentElement.dataset.screen"), "weapons");
  game.run('selectWeapon("greatsword")');
  assert.equal(game.savedProgress().weaponId, "greatsword");
  assert.equal(game.savedProgress().greatswordEquipPending, false);
  assert.equal(game.run("els.weaponEquipGuide.textContent"), "大剣を装備しました");
  assert.equal(game.run("els.weaponEquipNext.disabled"), false);
  assert.equal(game.run("els.weaponEquipNext.textContent"), "ステージ4へ");
  assert.equal(game.run('els.weaponGreatswordOption.classList.contains("is-recommended")'), false);
  game.run("continueAfterWeaponEquip()");
  assert.equal(game.run("document.documentElement.dataset.screen"), "battle");
  assert.equal(game.run("state.stageId"), "storm_cove");
  assert.equal(game.run("state.running"), true);
  assert.equal(game.run("els.weaponEquipGuide.hidden"), true);
  game.run('startGame("sky_castle")');
  game.advance(1500);
  assert.equal(game.run("getCurrentEnemy().weaponId"), "greatsword");
});

test("failed, early, or interrupted stage 3 never gives the greatsword", () => {
  for (const action of ["finishGame(false)", "resetGame()", 'startGame("sky_castle")']) {
    const game = createGame(saved());
    game.run('startGame("sky_castle"); finishGame(true)');
    assert.equal(game.run("state.running"), true);
    assert.equal(game.run("state.greatswordObtained"), false);
    clearCrabs(game, true);
    game.run(action); game.advance(2000);
    assert.equal(game.run("state.greatswordObtained"), false);
    assert.equal(game.run("state.greatswordEquipPending"), false);
    assert.equal(game.run("els.treasureReward.hidden"), true);
    const reloaded = createGame(game.saved());
    reloaded.run('selectWeapon("greatsword")');
    assert.equal(reloaded.run("state.weaponId"), "sword");
    assert.equal(reloaded.run('isWeaponAvailable("greatsword")'), false);
  }
});

test("unfinished greatsword equipment resumes and stays isolated across three saves", () => {
  const first = createGame(saved());
  clearCrabs(first);
  const game = createGame(first.saved(), { chooseSave: false });
  game.run('showSaveMenu("continue"); selectSaveSlot(0)');
  assert.equal(game.run("document.documentElement.dataset.screen"), "weapons");
  assert.equal(game.run("state.weaponEquipGuideId"), "greatsword");
  assert.equal(game.run("state.weaponId"), "sword");
  for (const slot of [1, 2]) {
    game.run('showStartScreen(); showSaveMenu("new"); selectSaveSlot(' + slot + '); saveEls.name.value = "別の冒険"; createPlayerSave(); showWeaponScreen()');
    assert.equal(game.run("state.greatswordObtained || state.greatswordEquipPending"), false);
    assert.equal(game.run("els.weaponEquipGuide.hidden"), true);
  }
  game.run('showStartScreen(); showSaveMenu("continue"); selectSaveSlot(0)');
  assert.equal(game.run("state.weaponEquipGuideId"), "greatsword");
  game.run('showHomeScreen(); showWeaponScreen(); selectWeapon("greatsword"); selectWeapon("sword"); showHomeScreen(); showWeaponScreen()');
  assert.equal(game.run("els.weaponEquipGuide.hidden"), true);
  const reloaded = createGame(game.saved(), { chooseSave: false });
  reloaded.run('showSaveMenu("continue"); selectSaveSlot(0)');
  assert.equal(reloaded.run("document.documentElement.dataset.screen"), "stage");
  assert.equal(reloaded.run("state.weaponId"), "sword");
  assert.equal(reloaded.run('isWeaponAvailable("greatsword")'), true);
});

test("replaying stage 3 never repeats the reward or completed equipment guide", () => {
  for (const weaponId of ["sword", "greatsword"]) {
    const game = createGame(saved({ weaponId, greatswordObtained: true, greatswordEquipPending: false }));
    clearCrabs(game);
    assert.equal(game.run("state.weaponId"), weaponId);
    assert.equal(game.run("state.greatswordEquipPending"), false);
    assert.equal(game.run("els.treasureReward.hidden"), true);
    assert.equal(game.run("els.noticeButton.textContent"), "ステージ4へ");
    game.run("continueAfterResult()");
    assert.equal(game.run("state.stageId"), "storm_cove");
    assert.equal(game.run("document.documentElement.dataset.screen"), "battle");
  }
});

test("a pending greatsword guide remains reachable after a replay without a duplicate reward", () => {
  const game = createGame(saved({ greatswordObtained: true, greatswordEquipPending: true }));
  clearCrabs(game);
  assert.equal(game.run("els.treasureReward.hidden"), true);
  assert.equal(game.run("els.noticeButton.textContent"), "装備画面へ");
  game.run("continueAfterResult()");
  assert.equal(game.run("state.weaponEquipGuideId"), "greatsword");
});

test("recorded older stage 3 clears receive the new reward without changing stats or weapon", () => {
  for (const greatswordObtained of [false, undefined]) {
    const extra = { totalExperience: 115, greatswordObtained,
      clearedStages: ["forest_path", "mist_road", "sky_castle"] };
    const game = createGame(saved(extra), { chooseSave: false });
    game.run('showSaveMenu("continue"); selectSaveSlot(0)');
    assert.equal(game.run("state.greatswordObtained && state.greatswordEquipPending"), true);
    assert.equal(game.run("document.documentElement.dataset.screen"), "weapons");
    assert.equal(game.run("state.weaponEquipGuideId"), "greatsword");
    assert.deepEqual(game.snapshot("({ xp: state.totalExperience, stats: state.stats, weapon: state.weaponId })"),
      { xp: 115, stats: { attack: 2, agility: 1 }, weapon: "sword" });
    game.run("savePlayerProgress()");
    const reloaded = createGame(game.saved());
    assert.equal(reloaded.savedProgress().greatswordEquipPending, true);
    reloaded.run('selectWeapon("greatsword")');
    assert.equal(createGame(reloaded.saved()).run("state.greatswordEquipPending"), false);
  }
  for (const clearedStages of [undefined, [], ["forest_path", "mist_road"]]) {
    assert.equal(createGame(saved({ totalExperience: 350, clearedStages })).run("state.greatswordObtained"), false);
  }
});

test("greatsword reward and manual equipment remain usable if saving is unavailable", () => {
  const game = createGame(saved());
  game.run('window.localStorage.setItem = () => { throw new Error("storage unavailable"); }');
  clearCrabs(game);
  assert.equal(game.run("progressionSaveAvailable"), false);
  assert.equal(game.run("els.treasureText.textContent"), "大剣を手に入れた！");
  game.run('continueAfterResult(); selectWeapon("greatsword"); continueAfterWeaponEquip()');
  assert.equal(game.run("state.weaponId"), "greatsword");
  assert.equal(game.run("state.greatswordEquipPending"), false);
  assert.equal(game.run("state.stageId"), "storm_cove");
  assert.equal(game.run("document.documentElement.dataset.screen"), "battle");
});
