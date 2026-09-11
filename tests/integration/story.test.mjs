import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

const saveKey = "into-the-typing.player.v2";
const equippedSave = (extra = {}) => ({
  [saveKey]: JSON.stringify({ version: 2, totalExperience: 0, stats: { attack: 1, agility: 1 },
    weaponId: "branch", introCompleted: true, equipmentTutorialCompleted: true, ...extra }),
});

function punch(game, times = 1) {
  for (let i = 0; i < times; i++) {
    game.run('applyTypedValue(getCurrentEnemy(), "a")');
    game.advance(480);
  }
}

test("stage 2 stays locked until the tutorial is completed and stage 1 waits for Next", () => {
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
  assert.deepEqual(game.snapshot("({ word: getCurrentEnemy().matchedWord, text: getCurrentEnemy().translation, hasHp: Object.hasOwn(getCurrentEnemy(), 'hp') })"),
    { word: "a", text: "あ", hasHp: false });
  assert.equal(game.run("useSpecialMove()"), false);
  game.run('applyTypedValue(getCurrentEnemy(), "x")');
  assert.equal(game.run("(getCurrentEnemy()?.tutorial?.punches || 0)"), 0);
  for (let count = 1; count <= 3; count++) {
    game.run('applyTypedValue(getCurrentEnemy(), "a"); enqueueBufferedInput("letter", "a")');
    game.advance(480);
    assert.deepEqual(game.snapshot("({ gauge: Number(getCurrentEnemy().hpTrack.getAttribute('aria-valuenow')), phase: state.storyPhase, count: (getCurrentEnemy()?.tutorial?.punches || 0), buffer: state.inputBuffer.length, reward: state.pendingExperience })"),
      { gauge: 100 - count, phase: count === 3 ? "weapon-offer" : "unarmed", count, buffer: 0, reward: 0 });
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
  assert.equal(game.run("getCurrentEnemy().hpFill.style.width"), "97%");
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
  game.run('startGame("mist_road")');
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
  game.run('startGame("mist_road")');
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
  assert.equal(game.run("(getCurrentEnemy()?.tutorial?.punches || 0)"), 0);
  assert.equal(game.run("state.activeEnemies.length"), 0);
  game.run("advanceStory()");
  punch(game);
  assert.equal(game.run("state.storyPhase"), "unarmed");
  assert.equal(game.run("getCurrentEnemy().hpFill.style.width"), "99%");
});

test("completing the equipment lesson persists and stage 2 starts with the equipped weapon", () => {
  const first = createGame();
  first.run("startGame(); advanceStory()");
  punch(first, 3);
  first.run("advanceStory()");
  for (let hit = 0; hit < 4; hit++) {
    first.run("applyTypedValue(getCurrentEnemy(), getCurrentEnemy().matchedWord)");
    first.advance(220);
  }
  first.run("resetGame()");
  const game = createGame(first.saved());
  assert.equal(game.run("state.introCompleted"), true);
  game.run('startGame("mist_road")');
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
  game.run("progression.gainExperience(state, 110); savePlayerProgress(); startGame(\"mist_road\")");
  game.advance(850);
  game.run("resetGame(); showStageSelect()");
  const reloaded = createGame(game.saved());
  assert.deepEqual(reloaded.snapshot("({ xp: state.totalExperience, level: state.level, weapon: state.weaponId, intro: state.introCompleted })"),
    { xp: 110, level: 3, weapon: "branch", intro: true });
});

test("the tutorial has no HP and requires exactly four branch hits regardless of attack upgrades", () => {
  for (const attack of [1, 99]) {
    const game = createGame();
    game.run("state.stats.attack = " + attack + "; startGame(); advanceStory(); const tutorialEnemy = getCurrentEnemy()");
    assert.equal(game.run("Object.hasOwn(tutorialEnemy, 'hp') || Object.hasOwn(tutorialEnemy, 'maxHp')"), false);
    assert.equal(game.run("tutorialEnemy.hpFill.style.width"), "100%");
    punch(game, 3);
    game.run("advanceStory(); state.specialGauge = 100");
    assert.equal(game.run("tutorialEnemy.hpFill.style.width"), "97%");
    assert.equal(game.run("useSpecialMove()"), false);
    const remaining = [72.75, 48.5, 24.25, 0];
    for (let hit = 0; hit < 4; hit++) {
      game.run("applyTypedValue(tutorialEnemy, 'x')");
      assert.equal(game.run("tutorialEnemy.tutorial.branchHits"), hit);
      game.run("applyTypedValue(tutorialEnemy, tutorialEnemy.matchedWord); damageEnemy(tutorialEnemy)");
      assert.equal(game.run("tutorialEnemy.tutorial.branchHits"), hit + 1);
      assert.equal(game.run("Number(tutorialEnemy.hpTrack.getAttribute('aria-valuenow'))"), remaining[hit]);
      assert.equal(game.run("isEnemyAlive(tutorialEnemy)"), hit < 3);
      game.advance(220);
      assert.equal(game.run("state.cleared"), hit < 3 ? 0 : 1);
      assert.equal(game.run("state.equipmentTutorialCompleted"), hit === 3);
    }
    game.run("defeatEnemy(tutorialEnemy)");
    assert.equal(game.run("state.cleared"), 1);
    assert.equal(game.run("state.pendingExperience"), 10);
    assert.equal(game.run("state.totalExperience"), 0);
    assert.equal(game.run("Object.hasOwn(tutorialEnemy, 'hp') || Object.hasOwn(tutorialEnemy, 'maxHp')"), false);
    assert.equal(JSON.parse(game.saved()[saveKey]).equipmentTutorialCompleted, true);
    game.advance(880);
    assert.equal(game.run("state.running"), false);
    assert.equal(game.run("state.totalExperience"), 10);
    assert.equal(game.run("els.noticeTitle.textContent"), "チュートリアル完了");
    assert.equal(game.run("els.noticeButton.textContent"), "ステージ2へ");
    game.run("continueAfterResult()");
    assert.equal(game.run("state.stageId"), "mist_road");
    assert.equal(game.run("getCurrentEnemy().tutorial"), undefined);
    assert.equal(game.run("getCurrentEnemy().hp"), 2);
  }
});

test("an interrupted branch lesson restarts, and its old defeat callback cannot finish the new tutorial", () => {
  const game = createGame();
  game.run("startGame(); advanceStory()");
  punch(game, 3);
  game.run("advanceStory()");
  for (let hit = 0; hit < 3; hit++) {
    game.run("applyTypedValue(getCurrentEnemy(), getCurrentEnemy().matchedWord)");
    game.advance(220);
  }
  const saved = game.saved();
  assert.equal(JSON.parse(saved[saveKey]).equipmentTutorialCompleted, false);
  const reloaded = createGame(saved);
  reloaded.run("startGame(); advanceStory()");
  assert.equal(reloaded.run("getCurrentEnemy().tutorial.punches"), 0);
  assert.equal(reloaded.run("getCurrentEnemy().tutorial.branchHits"), 0);
  game.run("applyTypedValue(getCurrentEnemy(), getCurrentEnemy().matchedWord); startGame(); advanceStory()");
  game.advance(1000);
  assert.equal(game.run("state.equipmentTutorialCompleted"), false);
  assert.equal(game.run("state.cleared"), 0);
  assert.equal(game.run("getCurrentEnemy().tutorial.branchHits"), 0);
});

test("existing progress is preserved and the completed lesson unlocks stage 2", () => {
  const oldSave = { version: 2, totalExperience: 350, stats: { attack: 3, agility: 2 }, weaponId: "greatsword", introCompleted: true };
  const game = createGame({ [saveKey]: JSON.stringify(oldSave) });
  const growth = game.snapshot("({ xp: state.totalExperience, level: state.level, stats: state.stats, points: state.skillPoints })");
  assert.equal(game.run("state.weaponId"), "greatsword");
  game.run("startGame(); advanceStory()");
  assert.equal(game.run("getCurrentEnemy().weaponId"), "unarmed");
  punch(game, 3);
  game.run("advanceStory()");
  for (let hit = 0; hit < 4; hit++) {
    game.run("applyTypedValue(getCurrentEnemy(), getCurrentEnemy().matchedWord)");
    game.advance(220);
  }
  const reloaded = createGame(game.saved());
  assert.deepEqual(reloaded.snapshot("({ xp: state.totalExperience, level: state.level, stats: state.stats, points: state.skillPoints })"), growth);
  reloaded.run('startGame("mist_road")');
  assert.equal(reloaded.run("state.storyPhase"), "none");
  assert.equal(reloaded.run("getCurrentEnemy().tutorial"), undefined);
});

test("stage 1 ends after its single tutorial egg and seven successful attacks", () => {
  const game = createGame();
  game.run("startGame(); advanceStory()");
  const seen = new Map();
  let attacks = 0;
  for (let tick = 0; tick < 2000 && game.run("state.running"); tick++) {
    if (game.run("isStoryDialogueOpen()")) game.run("advanceStory()");
    const target = game.snapshot("getCurrentEnemy() ? { id: getCurrentEnemy().id, type: getCurrentEnemy().type, boss: getCurrentEnemy().boss } : null");
    if (target) seen.set(target.id, target);
    if (game.run("Boolean(getInputEnemy())")) {
      game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
      attacks++;
    }
    game.advance(100);
  }
  assert.equal(game.run("state.running"), false);
  assert.equal(seen.size, 1);
  assert.ok([...seen.values()].every(enemy => enemy.type === "egg_level_1"));
  assert.equal([...seen.values()].filter(enemy => enemy.boss).length, 0);
  assert.equal(attacks, 7);
  assert.deepEqual(game.snapshot("({ cleared: state.cleared, xp: state.totalExperience, level: state.level, points: state.skillPoints })"),
    { cleared: 1, xp: 10, level: 1, points: 0 });
});

test("equipping the branch or failing the lesson does not unlock stage 2", () => {
  const game = createGame();
  game.run('showStageConfirm("mist_road")');
  assert.equal(game.run("state.pendingStageId"), "");
  game.run('state.pendingStageId = "mist_road"; startConfirmedStage()');
  assert.equal(game.run("state.running"), false);
  game.run("startGame(); advanceStory()");
  punch(game, 3);
  game.run("advanceStory()");
  for (let hit = 0; hit < 3; hit++) {
    game.run("applyTypedValue(getCurrentEnemy(), getCurrentEnemy().matchedWord)");
    game.advance(220);
  }
  game.run("finishGame(false)");
  assert.equal(game.run("els.noticeButton.textContent"), "ステージ選択へ");
  game.run('continueAfterResult(); startGame("mist_road")');
  assert.equal(game.run("state.running"), false);
  const reloaded = createGame(game.saved());
  assert.equal(reloaded.run('isStageAvailable("mist_road")'), false);
  assert.equal(reloaded.run("state.totalExperience"), 0);
});

test("stage 1 remains a replayable tutorial after completion", () => {
  const game = createGame(equippedSave({ totalExperience: 350, stats: { attack: 3, agility: 2 } }));
  game.run('startGame("forest_path"); advanceStory()');
  assert.equal(game.run("state.roundLimit"), 1);
  assert.equal(game.run("getCurrentEnemy().weaponId"), "unarmed");
  assert.equal(game.run("getCurrentEnemy().tutorial.punches"), 0);
  assert.equal(game.run('isStageAvailable("mist_road")'), true);
  punch(game, 3);
  game.run("advanceStory()");
  for (let hit = 0; hit < 4; hit++) {
    game.run("applyTypedValue(getCurrentEnemy(), getCurrentEnemy().matchedWord)");
    game.advance(220);
  }
  game.advance(620);
  assert.equal(game.run("state.running"), false);
  assert.equal(game.run("state.cleared"), 1);
  assert.equal(game.run("state.totalExperience"), 360);
});

test("stage 2 uses normal HP for seven encounters and awards EXP only on clear", () => {
  const game = createGame(equippedSave({ totalExperience: 10 }));
  game.run('showStageConfirm("mist_road"); startConfirmedStage()');
  assert.equal(game.run("state.stageId"), "mist_road");
  assert.equal(game.run("state.storyPhase"), "none");
  const seen = new Map();
  let attacks = 0;
  for (let tick = 0; tick < 2000 && game.run("state.running"); tick++) {
    const target = game.snapshot("getCurrentEnemy() ? { id: getCurrentEnemy().id, type: getCurrentEnemy().type, boss: getCurrentEnemy().boss, hp: getCurrentEnemy().maxHp } : null");
    if (target) {
      seen.set(target.id, target);
      assert.equal(game.run("getCurrentEnemy().tutorial"), undefined);
    }
    if (game.run("Boolean(getInputEnemy())")) {
      assert.equal(game.run("state.totalExperience"), 10);
      game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
      attacks++;
    }
    game.advance(100);
  }
  assert.equal(game.run("state.running"), false);
  assert.equal(seen.size, 7);
  assert.equal(attacks, 95);
  assert.equal([...seen.values()].filter(enemy => enemy.boss).length, 1);
  assert.equal([...seen.values()].filter(enemy => enemy.type === "chick_level_1").length, 4);
  assert.deepEqual(game.snapshot("({ cleared: state.cleared, xp: state.totalExperience, level: state.level, points: state.skillPoints })"),
    { cleared: 7, xp: 120, level: 3, points: 2 });
  assert.match(game.run("els.noticeText.textContent"), /獲得経験値 110 EXP/);
  assert.match(game.run("els.noticeText.textContent"), /レベルアップ！/);
  assert.equal(game.run("els.noticeButton.textContent"), "ステージ選択へ");
  game.run("continueAfterResult()");
  assert.equal(game.run("els.stageScreen.hidden"), false);
  assert.equal(game.run('isStageAvailable("sky_castle")'), false);
  const reloaded = createGame(game.saved());
  assert.equal(reloaded.run("state.totalExperience"), 120);
  assert.equal(reloaded.run('isStageAvailable("mist_road")'), true);
});
