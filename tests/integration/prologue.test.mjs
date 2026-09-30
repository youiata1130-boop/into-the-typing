import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { createGame } from "../helpers/game.mjs";

test("a new adventure shows departure, storm and island one page at a time while battle stays paused", () => {
  const game = createGame({}, { touch: true });
  game.run("startGame()");
  const scenes = [
    { title: "海への出発", text: /少年.*いかだ.*冒険/s, image: /story\/raft_departure\.png$/ },
    { title: "突然の嵐", text: /嵐.*大波/s, image: /story\/raft_storm\.png$/ },
    { title: "見知らぬ浜辺", text: /無人島.*浜辺/s, image: /stages\/crab_shore\.png$/ },
  ];
  for (const [index, scene] of scenes.entries()) {
    assert.equal(game.run("els.prologueTitle.textContent"), scene.title);
    assert.match(game.run("els.storyText.textContent"), scene.text);
    assert.match(game.run("els.prologueImage.src"), scene.image);
    assert.ok(game.run("els.prologueImage.alt.length > 0"));
    assert.equal(game.run("els.prologueImage.hidden || els.prologueTitle.hidden"), false);
    assert.equal(game.run("els.storyDialog.classList.contains('is-prologue')"), true);
    assert.equal(game.run("els.storyNextButton.textContent"), index === 2 ? "浜辺へ" : "次へ");
    assert.equal(game.run("els.storyDialog.getAttribute('aria-label')"), "物語のはじまり");
    assert.equal(game.run("gameFlickUi.keyboard.hidden"), true);
    game.advance(30000);
    game.run('enemyLoop(performance.now()); enqueueBufferedInput("letter", "a"); handleTypingKeydown({ key:"a", code:"KeyA", preventDefault() {} })');
    assert.deepEqual(game.snapshot("({ enemies: state.activeEnemies.length, hp: state.hp, xp: state.totalExperience, seen: state.prologueCompleted })"),
      { enemies: 0, hp: 100, xp: 0, seen: false });
    assert.equal(game.savedProgress().prologueCompleted, false);
    game.run("els.storyNextButton.dispatchEvent({ type: 'click' })");
  }
  assert.equal(game.savedProgress().prologueCompleted, true);
  assert.equal(game.savedProgress().equipmentTutorialCompleted, false);
  assert.equal(game.run("els.storyDialog.hidden"), true);
  assert.equal(game.run("els.storyDialog.classList.contains('is-prologue')"), false);
  assert.equal(game.run("els.prologueImage.hidden && els.prologueTitle.hidden"), true);
  assert.equal(game.run("state.activeEnemies.length"), 1);
  assert.equal(game.run("getCurrentEnemy().weaponId"), "unarmed");
  assert.equal(game.run("getCurrentEnemy().typed"), "");
  assert.equal(game.run("canUseGameFlickKeyboard()"), true);
});

test("reading the prologue survives retry and reload before completing the tutorial", () => {
  const game = createGame();
  game.run("startGame(); continueStoryToBattle(); resetGame(); startGame()");
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
  for (const pagesRead of [0, 1, 2]) {
    game.run("startGame()");
    for (let index = 0; index < pagesRead; index++) game.run("advanceStory()");
    game.run("showStartScreen()");
    assert.equal(game.run("saveSlots.read(0).data.progress.prologueCompleted"), false);
    assert.equal(game.run("els.prologueImage.hidden && els.prologueTitle.hidden"), true);
    const reloaded = createGame(game.saved());
    reloaded.run("startGame()");
    assert.equal(reloaded.run("els.storyDialog.classList.contains('is-prologue')"), true);
    assert.equal(reloaded.run("els.prologueTitle.textContent"), "海への出発");
  }
});

test("prologue progress belongs to each named save and resets on a new adventure", () => {
  const game = createGame({}, { chooseSave: false });
  const newPlayer = (index, name) => game.run(
    "showStartScreen(); showSaveMenu('new'); selectSaveSlot(" + index + "); saveEls.name.value = "
    + JSON.stringify(name) + "; createPlayerSave(); startGame()");
  newPlayer(0, "あおい");
  game.run("continueStoryToBattle()");
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

test("every illustrated prologue scene is preloaded and exists as a local project asset", () => {
  const game = createGame();
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const preloads = [...html.matchAll(/<link\b[^>]*rel="preload"[^>]*href="([^"]+)"/g)].map(match => match[1]);
  for (const scene of game.snapshot("prologueScenes")) {
    assert.ok(preloads.includes(scene.image), scene.image + " must preload before play");
    assert.ok(existsSync(new URL("../../" + scene.image, import.meta.url)), scene.image);
  }
});
