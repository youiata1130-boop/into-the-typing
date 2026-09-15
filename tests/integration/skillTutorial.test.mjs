import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

function finishBattle(game, { beforeReward = false } = {}) {
  for (let tick = 0; tick < 3000 && game.run("state.running"); tick++) {
    if (beforeReward && game.run("state.cleared === state.roundLimit")) return;
    if (game.run("isStoryDialogueOpen()")) game.run("advanceStory()");
    if (game.run("Boolean(getInputEnemy())")) game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
    game.advance(100);
  }
  assert.equal(game.run("state.running"), false);
}

test("stage 1 never levels up and stage 2 teaches spending its one new skill point", () => {
  for (const stat of ["attack", "agility"]) {
    const game = createGame();
    for (let replay = 0; replay < 2; replay++) {
      game.run('startGame("forest_path")');
      finishBattle(game);
      assert.deepEqual(game.snapshot("({ level: state.level, xp: state.totalExperience, points: state.skillPoints })"),
        { level: 1, xp: 0, points: 0 });
      assert.equal(game.run("state.skillTutorialPending"), false);
      assert.doesNotMatch(game.run("els.noticeText.textContent"), /レベルアップ/);
    }
    game.run('continueAfterResult(); selectWeapon("sword"); continueAfterSwordEquip()');
    finishBattle(game);
    assert.deepEqual(game.snapshot("({ level: state.level, xp: state.totalExperience, points: state.skillPoints, hp: getMaxHp() })"),
      { level: 2, xp: 40, points: 1, hp: 110 });
    assert.match(game.run("els.noticeText.textContent"), /Lv.1 → Lv.2/);
    assert.equal(game.run("els.noticeButton.textContent"), "ステータスへ");
    assert.equal(game.run("els.statusScreen.hidden"), true);
    assert.equal(game.savedProgress().skillTutorialPending, true);
    game.run("continueAfterResult(); continueAfterSkillTutorial()");
    assert.equal(game.run("document.documentElement.dataset.screen"), "status");
    assert.equal(game.run("els.skillTutorialGuide.hidden"), false);
    assert.equal(game.run("els.skillTutorialNext.disabled"), true);
    assert.equal(game.run('changePlayerStat("attack", 2)'), false);
    assert.equal(game.run('changePlayerStat("unknown", 1)'), false);
    assert.equal(game.run("state.skillTutorialPending"), true);
    assert.equal(game.run("changePlayerStat(" + JSON.stringify(stat) + ", 1)"), true);
    assert.equal(game.run("state.stats." + stat), 2);
    assert.equal(game.run("state.skillPoints"), 0);
    assert.equal(game.run('changePlayerStat("attack", 1)'), false);
    assert.equal(game.run("els.skillTutorialText.textContent"), "振り分け完了！");
    assert.equal(game.run("els.skillTutorialNext.disabled"), false);
    assert.equal(game.savedProgress().skillTutorialCompleted, true);
    assert.equal(game.savedProgress().skillTutorialPending, false);
    game.run("continueAfterSkillTutorial()");
    assert.equal(game.run("document.documentElement.dataset.screen"), "stage");
    assert.equal(game.run("els.skillTutorialGuide.hidden"), true);
    const reloaded = createGame(game.saved());
    assert.equal(reloaded.run("state.stats." + stat), 2);
    assert.equal(reloaded.run("state.skillPoints"), 0);
    for (let replay = 0; replay < 2; replay++) {
      reloaded.run('startGame("mist_road")');
      finishBattle(reloaded);
      assert.equal(reloaded.run("state.skillTutorialPending"), false);
      assert.equal(reloaded.run("els.noticeButton.textContent"), "ステージ3へ");
    }
    assert.equal(reloaded.run("state.level"), 3);
  }
});

test("pending skill guidance resumes in its own save and completion persists", () => {
  const progress = { version: 2, totalExperience: 40, stats: { attack: 1, agility: 1 },
    weaponId: "sword", introCompleted: true, equipmentTutorialCompleted: true,
    ironSwordObtained: true, skillTutorialPending: true };
  const game = createGame({ "into-the-typing.player.v2": JSON.stringify(progress) }, { chooseSave: false });
  game.run('showSaveMenu("continue"); selectSaveSlot(0)');
  assert.equal(game.run("document.documentElement.dataset.screen"), "status");
  assert.equal(game.run("state.skillPoints"), 1);
  game.run('showStartScreen(); showSaveMenu("new"); selectSaveSlot(1); saveEls.name.value = "別の人"; createPlayerSave(); showStatusScreen()');
  assert.equal(game.run("els.skillTutorialGuide.hidden"), true);
  assert.equal(game.run("state.skillTutorialPending"), false);
  game.run('showStartScreen(); showSaveMenu("continue"); selectSaveSlot(0)');
  assert.equal(game.run("document.documentElement.dataset.screen"), "status");
  assert.equal(game.run("els.skillTutorialGuide.hidden"), false);
  game.run('changePlayerStat("agility", 1)');
  const reloaded = createGame(game.saved(), { chooseSave: false });
  reloaded.run('showSaveMenu("continue"); selectSaveSlot(0); showStatusScreen()');
  assert.equal(reloaded.run("els.skillTutorialGuide.hidden"), true);
  assert.equal(reloaded.run("state.stats.agility"), 2);
  assert.equal(reloaded.run("state.skillPoints"), 0);
});

test("failed or interrupted stage 2 clears cannot award a point or start skill guidance", () => {
  const save = { version: 2, totalExperience: 0, stats: { attack: 1, agility: 1 },
    weaponId: "sword", introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true };
  for (const action of ["finishGame(false)", "resetGame()"]) {
    const game = createGame({ "into-the-typing.player.v2": JSON.stringify(save) });
    game.run('startGame("mist_road")');
    finishBattle(game, { beforeReward: true });
    game.run(action);
    game.advance(2000);
    assert.equal(game.run("state.level"), 1);
    assert.equal(game.run("state.skillPoints"), 0);
    assert.equal(game.run("state.totalExperience"), 0);
    assert.equal(game.run("state.skillTutorialPending"), false);
    assert.equal(createGame(game.saved()).run("state.skillTutorialPending"), false);
  }
});
