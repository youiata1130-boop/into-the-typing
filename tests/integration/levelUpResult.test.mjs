import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

function battle(totalExperience = 0) {
  const game = createGame({ "into-the-typing.player.v2": JSON.stringify({
    version: 2, totalExperience, stats: { attack: 1, agility: 1 }, weaponId: "sword",
    introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true,
  }) });
  game.run('startGame("mist_road")');
  return game;
}
function finish(game, experience) {
  game.run("state.cleared = state.roundLimit; state.pendingExperience = " + experience + "; finishGame(true)");
}
function displayedReward(game) {
  return game.snapshot("[els.levelUpBefore.textContent, els.levelUpAfter.textContent, els.levelUpHp.textContent, els.levelUpPoints.textContent]");
}

test("a level-up result shows the actual level change and rewards with the skill tutorial action", () => {
  const game = battle();
  finish(game, 40);
  assert.deepEqual(displayedReward(game), ["Lv.1", "Lv.2", "+10", "+1"]);
  assert.equal(game.run("els.levelUpReward.hidden"), false);
  assert.equal(game.run("els.gameNotice.classList.contains('has-level-up')"), true);
  assert.equal(game.run("els.noticeText.textContent"), "獲得経験値 40 EXP");
  assert.equal(game.run("els.noticeButton.textContent"), "ステータスへ");
  assert.equal(game.run("document.activeElement === els.noticeButton"), true);
  game.run("finishGame(true)");
  assert.equal(game.run("state.totalExperience"), 40);
  assert.deepEqual(displayedReward(game), ["Lv.1", "Lv.2", "+10", "+1"]);
});

test("gaining multiple levels displays their total HP and skill point gains", () => {
  const game = battle();
  finish(game, 500);
  assert.equal(game.run("state.level"), 5);
  assert.deepEqual(displayedReward(game), ["Lv.1", "Lv.5", "+40", "+4"]);
});

test("reaching the level cap displays only the rewards actually gained", () => {
  const total = createGame().run("Array.from({ length: 98 }, (_, i) => progression.experienceToNextLevel(i + 1)).reduce((a, b) => a + b, 0)");
  const game = battle(total - 5);
  finish(game, 40);
  assert.deepEqual(displayedReward(game), ["Lv.98", "Lv.99", "+10", "+1"]);
  assert.equal(game.run("els.noticeText.textContent"), "獲得経験値 5 EXP");
});

test("restarting and a clear without a level gain remove the celebration", () => {
  const game = battle();
  finish(game, 40);
  game.run('startGame("mist_road")');
  assert.equal(game.run("els.levelUpReward.hidden"), true);
  assert.equal(game.run("els.gameNotice.classList.contains('has-level-up')"), false);
  finish(game, 40);
  assert.equal(game.run("state.level"), 2);
  assert.equal(game.run("els.levelUpReward.hidden"), true);
  assert.equal(game.run("els.gameNotice.classList.contains('has-level-up')"), false);
});

test("defeat and hiding the result cannot leave level-up effects active", () => {
  const game = battle();
  finish(game, 40);
  game.run("hideGameNotice()");
  assert.equal(game.run("els.levelUpReward.hidden"), true);
  assert.equal(game.run("els.gameNotice.classList.contains('has-level-up')"), false);
  game.run('startGame("mist_road"); state.pendingExperience = 500; finishGame(false)');
  assert.equal(game.run("els.levelUpReward.hidden"), true);
  assert.equal(game.run("els.gameNotice.classList.contains('has-level-up')"), false);
  assert.equal(game.run("state.totalExperience"), 40);
});
