import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

const saveKey = "into-the-typing.player.v2";
const equippedSave = (extra = {}) => ({
  [saveKey]: JSON.stringify({ version: 2, totalExperience: 0, stats: { attack: 1, agility: 1 },
    weaponId: "branch", introCompleted: true, ...extra }),
});

function punch(game, times = 1) {
  for (let i = 0; i < times; i++) {
    game.run('applyTypedValue(getCurrentEnemy(), "a")');
    game.advance(480);
  }
}

test("only stage 1 starts and its enemy waits for Next", () => {
  const game = createGame();
  game.run('startGame("mist_road"); startGame("sky_castle")');
  assert.equal(game.run("state.running"), false);
  game.run("startGame()");
  game.advance(20000);
  assert.deepEqual(game.snapshot("({ phase: state.storyPhase, enemies: state.activeEnemies.length, hp: state.hp })"),
    { phase: "encounter", enemies: 0, hp: 100 });
  game.run('enqueueBufferedInput("letter", "a"); advanceStory(); advanceStory()');
  assert.equal(game.run("state.activeEnemies.length"), 1);
  assert.equal(game.run("getCurrentEnemy().typed"), "");
});

test("the new adventure starts fresh once and preserves the legacy save", () => {
  const legacy = JSON.stringify({ version: 1, totalExperience: 350, stats: { attack: 4, agility: 2 }, weaponId: "greatsword" });
  const game = createGame({ "into-the-typing.player.v1": legacy });
  game.run('selectWeapon("greatsword"); selectWeapon("sword")');
  assert.deepEqual(game.snapshot("({ xp: state.totalExperience, level: state.level, weapon: state.weaponId, intro: state.introCompleted })"),
    { xp: 0, level: 1, weapon: "branch", intro: false });
  assert.equal(game.saved()["into-the-typing.player.v1"], legacy);
});

test("exactly three successful one-character punches trigger the offer, even with upgraded attack", () => {
  const game = createGame();
  game.run("state.stats.attack = 99; startGame(); advanceStory(); state.specialGauge = 100");
  assert.deepEqual(game.snapshot("({ word: getCurrentEnemy().matchedWord, text: getCurrentEnemy().translation, damage: getPlayerAttackDamage(getCurrentEnemy()) })"),
    { word: "a", text: "あ", damage: 0.1 });
  assert.equal(game.run("useSpecialMove()"), false);
  game.run('applyTypedValue(getCurrentEnemy(), "x")');
  assert.equal(game.run("state.storyPunches"), 0);
  for (let count = 1; count <= 3; count++) {
    game.run('applyTypedValue(getCurrentEnemy(), "a"); enqueueBufferedInput("letter", "a")');
    game.advance(480);
    assert.deepEqual(game.snapshot("({ hp: getCurrentEnemy().hp, phase: state.storyPhase, count: state.storyPunches, buffer: state.inputBuffer.length, reward: state.pendingExperience })"),
      { hp: (20 - count) / 10, phase: count === 3 ? "weapon-offer" : "unarmed", count, buffer: 0, reward: 0 });
  }
});

test("the branch picture and dialogue pause battle before Next equips the same enemy encounter", () => {
  const game = createGame();
  game.run("startGame(); advanceStory()");
  punch(game, 3);
  assert.equal(game.run("els.storyItem.hidden"), false);
  assert.equal(game.run("state.introCompleted"), false);
  assert.equal(game.run("els.storyText.textContent"), "これを使って！");
  const paused = game.snapshot("({ id: getCurrentEnemy().id, progress: getCurrentEnemy().progress, hp: state.hp })");
  game.advance(30000);
  game.run('enemyLoop(performance.now()); enemyAttack(getCurrentEnemy()); applyTypedValue(getCurrentEnemy(), "a"); enqueueBufferedInput("letter", "n")');
  assert.deepEqual(game.snapshot("({ id: getCurrentEnemy().id, progress: getCurrentEnemy().progress, hp: state.hp })"), paused);
  game.run("advanceStory(); advanceStory()");
  assert.equal(game.run("getCurrentEnemy().id"), paused.id);
  assert.equal(game.run("state.activeEnemies.length"), 1);
  assert.equal(game.run("getCurrentEnemy().hp"), 1.7);
  assert.equal(game.run("getCurrentEnemy().weaponId"), "branch");
  assert.equal(game.run("getPlayerAttackDamage(getCurrentEnemy())"), 0.2);
  assert.equal(game.run("getCurrentEnemy().typed"), "");
  assert.equal(game.run("state.inputBuffer.length"), 0);
  assert.equal(game.run("els.storyItem.hidden"), true);
  assert.equal(game.run("els.storyDialog.hidden"), true);
  assert.equal(JSON.parse(game.saved()[saveKey]).introCompleted, true);
  assert.equal(JSON.parse(game.saved()[saveKey]).weaponId, "branch");
});

test("branch prompts stay at two or three letters for normal enemies and bosses", () => {
  const game = createGame(equippedSave());
  game.run("startGame()");
  game.advance(850);
  assert(game.run("wordSets.branch.every(word => getWordInputs(word).every(input => input.length >= 2 && input.length <= 3))"));
  for (const boss of [false, true]) {
    game.run("getCurrentEnemy().boss = " + boss);
    for (let i = 0; i < 40; i++) {
      game.run("setNextWord(getCurrentEnemy())");
      assert([2, 3].includes(game.run("getCurrentEnemy().matchedWord.length")));
    }
  }
  game.run("state.stats.agility = 9");
  for (let i = 0; i < 30; i++) {
    game.run("setNextWord(getCurrentEnemy())");
    assert.equal(game.run("getCurrentEnemy().matchedWord.length"), 2);
  }
});

test("three branch hits finish 0.6 HP exactly and only stage clear awards EXP", () => {
  const game = createGame(equippedSave());
  game.run("startGame()");
  game.advance(850);
  game.run("const target = getCurrentEnemy(); target.hp = 0.6");
  for (const hp of [0.4, 0.2, 0]) {
    game.run("applyTypedValue(target, target.matchedWord)");
    assert.equal(game.run("target.hp"), hp);
    game.advance(220);
  }
  assert.deepEqual(game.snapshot("({ cleared: state.cleared, pending: state.pendingExperience, xp: state.totalExperience, level: state.level })"),
    { cleared: 1, pending: 10, xp: 0, level: 1 });
});

test("restarting during the third punch cancels the old weapon handoff", () => {
  const game = createGame();
  game.run("startGame(); advanceStory()");
  punch(game, 2);
  game.run('applyTypedValue(getCurrentEnemy(), "a")');
  game.advance(100);
  game.run("startGame()");
  game.advance(1000);
  assert.equal(game.run("state.storyPhase"), "encounter");
  assert.equal(game.run("state.storyPunches"), 0);
  assert.equal(game.run("state.activeEnemies.length"), 0);
  game.run("advanceStory()");
  punch(game);
  assert.equal(game.run("state.storyPhase"), "unarmed");
  assert.equal(game.run("getCurrentEnemy().hp"), 1.9);
});

test("receiving the branch persists and subsequent adventures skip the introduction", () => {
  const first = createGame();
  first.run("startGame(); advanceStory()");
  punch(first, 3);
  first.run("advanceStory(); resetGame()");
  const game = createGame(first.saved());
  assert.equal(game.run("state.introCompleted"), true);
  game.run("startGame()");
  game.advance(850);
  assert.equal(game.run("state.storyPhase"), "none");
  assert.equal(game.run("getCurrentEnemy().weaponId"), "branch");
  assert.equal(game.run("getCurrentEnemy().hp"), 2);
  game.run('resetGame(); selectWeapon("greatsword")');
  assert.equal(game.run("state.weaponId"), "greatsword");
  const reloaded = createGame(game.saved());
  assert.equal(reloaded.run("state.weaponId"), "greatsword");
});

test("new progress is retained through return, retry, and reload", () => {
  const game = createGame(equippedSave());
  game.run("progression.gainExperience(state, 110); savePlayerProgress(); startGame()");
  game.advance(850);
  game.run("resetGame(); showStageSelect()");
  const reloaded = createGame(game.saved());
  assert.deepEqual(reloaded.snapshot("({ xp: state.totalExperience, level: state.level, weapon: state.weaponId, intro: state.introCompleted })"),
    { xp: 110, level: 3, weapon: "branch", intro: true });
});
