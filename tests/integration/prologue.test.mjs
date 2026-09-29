import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

test("a new adventure opens with the voyage, storm and island while battle is paused", () => {
  const game = createGame({}, { touch: true });
  game.run("startGame()");
  const story = game.run("els.storyText.textContent");
  assert.match(story, /少年.*木の船.*冒険/s);
  assert.match(story, /嵐.*無人島.*浜辺/s);
  assert.equal(game.run("els.storyDialog.classList.contains('is-prologue')"), true);
  assert.equal(game.run("els.storyNextButton.textContent"), "浜辺へ");
  assert.equal(game.run("els.storyDialog.getAttribute('aria-label')"), "物語のはじまり");
  assert.equal(game.run("gameFlickUi.keyboard.hidden"), true);
  game.advance(30000);
  game.run('enemyLoop(performance.now()); enqueueBufferedInput("letter", "a"); handleTypingKeydown({ key:"a", code:"KeyA", preventDefault() {} })');
  assert.deepEqual(game.snapshot("({ enemies: state.activeEnemies.length, hp: state.hp, xp: state.totalExperience, seen: state.prologueCompleted })"),
    { enemies: 0, hp: 100, xp: 0, seen: false });
  game.run("els.storyNextButton.dispatchEvent({ type: 'click' })");
  assert.equal(game.savedProgress().prologueCompleted, true);
  assert.equal(game.savedProgress().equipmentTutorialCompleted, false);
  assert.equal(game.run("els.storyDialog.hidden"), true);
  assert.equal(game.run("els.storyDialog.classList.contains('is-prologue')"), false);
  assert.equal(game.run("state.activeEnemies.length"), 1);
  assert.equal(game.run("getCurrentEnemy().weaponId"), "unarmed");
  assert.equal(game.run("getCurrentEnemy().typed"), "");
  assert.equal(game.run("canUseGameFlickKeyboard()"), true);
});

test("reading the prologue survives retry and reload before completing the tutorial", () => {
  const game = createGame();
  game.run("startGame(); advanceStory(); resetGame(); startGame()");
  assert.equal(game.run("els.storyText.textContent"), "敵が現れた！");
  assert.equal(game.run("els.storyNextButton.textContent"), "次へ");
  const reloaded = createGame(game.saved());
  reloaded.run("startGame()");
  assert.equal(reloaded.run("els.storyDialog.classList.contains('is-prologue')"), false);
  assert.equal(reloaded.run("els.storyText.textContent"), "敵が現れた！");
  assert.equal(reloaded.run("state.introCompleted"), false);
});

test("leaving before continuing does not mark the prologue as read", () => {
  const game = createGame();
  game.run("startGame(); showStartScreen()");
  assert.equal(game.run("saveSlots.read(0).data.progress.prologueCompleted"), false);
  const reloaded = createGame(game.saved());
  reloaded.run("startGame()");
  assert.equal(reloaded.run("els.storyDialog.classList.contains('is-prologue')"), true);
});

test("prologue progress belongs to each named save and resets on a new adventure", () => {
  const game = createGame({}, { chooseSave: false });
  const newPlayer = (index, name) => game.run(
    "showStartScreen(); showSaveMenu('new'); selectSaveSlot(" + index + "); saveEls.name.value = "
    + JSON.stringify(name) + "; createPlayerSave(); startGame()");
  newPlayer(0, "あおい");
  game.run("advanceStory()");
  newPlayer(1, "そら");
  assert.equal(game.run("els.storyDialog.classList.contains('is-prologue')"), true);
  game.run("showStartScreen(); showSaveMenu('continue'); selectSaveSlot(0); startGame()");
  assert.equal(game.run("state.playerName"), "あおい");
  assert.equal(game.run("els.storyDialog.classList.contains('is-prologue')"), false);
  newPlayer(0, "新しい冒険");
  assert.equal(game.run("els.storyDialog.classList.contains('is-prologue')"), true);
  assert.equal(game.run("saveSlots.read(1).data.progress.prologueCompleted"), false);
});

test("existing progressed saves skip the added prologue without changing their progress", () => {
  for (const extra of [{ introCompleted: true }, { totalExperience: 40 }]) {
    const saved = { version: 2, totalExperience: 0, stats: { attack: 1, agility: 1 }, weaponId: "branch", ...extra };
    const game = createGame({ "into-the-typing.player.v2": JSON.stringify(saved) });
    const progress = game.snapshot("({ xp: state.totalExperience, stats: state.stats, weapon: state.weaponId })");
    game.run("startGame()");
    assert.equal(game.run("els.storyText.textContent"), "敵が現れた！");
    assert.equal(game.run("els.storyDialog.classList.contains('is-prologue')"), false);
    assert.deepEqual(game.snapshot("({ xp: state.totalExperience, stats: state.stats, weapon: state.weaponId })"), progress);
  }
});
