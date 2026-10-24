import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createGame } from "../../helpers/game.mjs";

const earlierStages = ["forest_path", "mist_road", "sky_castle", "storm_cove", "grassland_path", "flower_meadow", "swarm_meadow"];
const saved = extra => ({ "into-the-typing.player.v2": JSON.stringify({
  version: 2, totalExperience: 755, stats: { attack: 2, agility: 1 }, weaponId: "greatsword",
  introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true,
  greatswordObtained: true, dualBladesObtained: true, skillTutorialCompleted: true,
  clearedStages: earlierStages, ...extra,
}) });
function clearForest(game, beforeReward = false) {
  game.run('startGame("mushroom_forest")');
  for (let tick = 0; tick < 1000 && game.run("state.running"); tick++) {
    if (beforeReward && game.run("state.cleared === state.roundLimit")) return;
    if (game.run("Boolean(getInputEnemy())")) game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
    game.advance(100);
  }
  assert.equal(game.run("state.running"), false);
}

test("3-1 first clear saves sword and shield, shows the treasure, and guides manual equipment", () => {
  const game = createGame(saved());
  clearForest(game, true);
  assert.equal(game.run('isWeaponAvailable("swordShield")'), false);
  game.advance(1000);
  assert.equal(game.run("els.treasureText.textContent"), "片手剣を手に入れた！");
  assert.equal(game.run("els.treasureSwordShield.style.display"), "");
  assert.equal(game.run("els.treasureSingleSword.style.display"), "none");
  assert.equal(game.run("els.noticeButton.textContent"), "装備画面へ");
  assert.equal(game.savedProgress().swordShieldObtained, true);
  assert.equal(game.savedProgress().swordShieldEquipPending, true);
  assert.equal(game.savedProgress().weaponId, "greatsword");
  assert.equal(game.savedProgress().totalExperience, 890);
  game.run("continueAfterResult()");
  assert.equal(game.run("document.documentElement.dataset.screen"), "weapons");
  assert.equal(game.run("document.activeElement === els.weaponSwordShield"), true);
  assert.equal(game.run("els.weaponEquipGuide.textContent"), "片手剣を選んで装備しよう");
  assert.equal(game.run("els.weaponEquipNext.disabled"), true);
  assert.equal(game.run("els.weaponEquipNext.hidden"), true);
  game.run('selectWeapon("swordShield")');
  assert.equal(game.savedProgress().swordShieldEquipPending, false);
  assert.equal(game.savedProgress().weaponId, "swordShield");
  assert.equal(game.run("els.weaponEquipNext.textContent"), "");
  assert.equal(game.run("els.weaponEquipNext.hidden"), true);
  game.run("continueAfterWeaponEquip()");
  assert.equal(game.run("document.documentElement.dataset.screen"), "battle");
  assert.equal(game.run("state.stageId"), "spore_path");
  assert.match(game.run("els.playerFrameGuard.src"), /sword_shield\/guard/);
  const reloaded = createGame(game.saved());
  assert.equal(reloaded.run("state.weaponId"), "swordShield");
});

test("early, failed and interrupted 3-1 runs never award sword and shield", () => {
  for (const action of ["finishGame(false)", "resetGame()", 'startGame("mushroom_forest")']) {
    const game = createGame(saved());
    game.run('selectWeapon("swordShield"); startGame("mushroom_forest"); finishGame(true)');
    assert.equal(game.run("state.swordShieldObtained"), false);
    assert.equal(game.run("state.weaponId"), "greatsword");
    clearForest(game, true);
    game.run(action); game.advance(1200);
    assert.equal(game.run("state.swordShieldObtained || state.swordShieldEquipPending"), false);
    assert.equal(createGame(game.saved()).run('isWeaponAvailable("swordShield")'), false);
  }
});

test("older 3-1 clears receive the new reward with stats and equipment preserved", () => {
  const game = createGame(saved({ clearedStages: [...earlierStages, "mushroom_forest"] }));
  assert.equal(game.run("state.swordShieldObtained && state.swordShieldEquipPending"), true);
  assert.deepEqual(game.snapshot("({ xp: state.totalExperience, stats: state.stats, weapon: state.weaponId })"),
    { xp: 755, stats: { attack: 2, agility: 1 }, weapon: "greatsword" });
  game.run("savePlayerProgress()");
  const reloaded = createGame(game.saved(), { chooseSave: false });
  reloaded.run('showSaveMenu("continue"); selectSaveSlot(0)');
  assert.equal(reloaded.run("state.weaponEquipGuideId"), "swordShield");
  assert.equal(reloaded.run("document.documentElement.dataset.screen"), "weapons");
  reloaded.run('showStartScreen(); showSaveMenu("new"); selectSaveSlot(1); saveEls.name.value = "別の冒険"; createPlayerSave()');
  assert.equal(reloaded.run("state.swordShieldObtained || state.swordShieldEquipPending"), false);
});

test("replaying a cleared forest never repeats an acquired reward or equipment guide", () => {
  const game = createGame(saved({ swordShieldObtained: true, swordShieldEquipPending: false }));
  clearForest(game);
  assert.equal(game.run("els.treasureReward.hidden"), true);
  assert.equal(game.run("state.swordShieldEquipPending"), false);
  assert.equal(game.run("state.weaponId"), "greatsword");
  assert.equal(game.run("els.noticeButton.textContent"), "ステージ3-2へ");
  game.run("continueAfterResult()");
  assert.equal(game.run("document.documentElement.dataset.screen"), "battle");
  assert.equal(game.run("state.stageId"), "spore_path");
});

test("all sword and shield poses and its treasure are included in startup preloading", () => {
  const game = createGame(saved());
  for (const image of game.snapshot('[...new Set([...Object.values(playerWeaponAssets.swordShield), weaponDefinitions.swordShield.itemImage])]')) {
    assert.equal(existsSync(image), true, image);
    assert.equal(game.run(`collectGameImageSources().some(src => src.endsWith(${JSON.stringify(image)}))`), true, image);
  }
});
