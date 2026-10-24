import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function battle(weaponId = "greatsword", touch = false) {
  const game = createGame({ "into-the-typing.player.v2": JSON.stringify({
    version: 2, totalExperience: 255, stats: { attack: 2, agility: 1 }, weaponId,
    introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true,
    greatswordObtained: true, skillTutorialCompleted: true,
    clearedStages: ["forest_path", "mist_road", "sky_castle", "storm_cove"],
  }) }, { touch });
  game.run(`
    startGame("grassland_path");
    const target = getCurrentEnemy();
    target.hp = target.maxHp = 100;
    target.word = target.matchedWord = "a".repeat(40);
    target.inputs = [target.word];
    const space = (repeat = false) => handleTypingKeydown({ key: " ", code: "Space", shiftKey: hasGuardWeapon(), repeat, preventDefault() {} });
  `);
  return game;
}

test("correct input charges a visible capped gauge; misses and retyping cannot farm it", () => {
  const game = battle();
  assert.equal(game.run("els.skillPanel.hidden"), false);
  assert.equal(game.run("els.specialButton.disabled"), true);
  game.run('applyTypedValue(target, "a")');
  assert.equal(game.run("state.specialGauge"), 4);
  game.run('applyTypedValue(target, "ax"); applyTypedValue(target, ""); applyTypedValue(target, "a")');
  assert.equal(game.run("state.specialGauge"), 4);
  game.run('applyTypedValue(target, "a".repeat(24))');
  assert.equal(game.run("state.specialGauge"), 96);
  game.run("space()");
  assert.equal(game.run("state.specialGauge"), 96);
  assert.equal(game.run("target.hp"), 100);
  game.run('applyTypedValue(target, "a".repeat(25))');
  assert.equal(game.run("els.specialButton.disabled"), false);
  assert.equal(game.run("els.skillPanel.dataset.ready"), "true");
  assert.equal(game.run("els.skillGaugeValue.textContent"), "100％");
  assert.equal(game.run('els.skillGauge.getAttribute("aria-valuenow")'), "100");
  game.run('applyTypedValue(target, "a".repeat(30))');
  assert.equal(game.run("state.specialGauge"), 100);
});

test("the skill shortcut spends a full gauge once and deals triple maximum weapon damage", () => {
  for (const [weapon, damage] of [["greatsword", 24]]) {
    const game = battle(weapon);
    game.run('applyTypedValue(target, "a".repeat(25)); target.typingMisses = 5; space()');
    assert.equal(game.run("target.hp"), 100 - damage);
    assert.equal(game.run("state.specialGauge"), 0);
    assert.equal(game.run("state.specialInProgress"), true);
    assert.equal(game.run("els.specialButton.disabled"), true);
    assert.equal(game.run('els.specialEffect.classList.contains("is-active")'), true);
    game.run("space(); space(true)");
    assert.equal(game.run("target.hp"), 100 - damage);
    game.advance(420);
    assert.equal(game.run("state.specialInProgress"), false);
    assert.equal(game.run("target.resolving"), false);
    game.run("state.specialGauge = 100; space(true)");
    assert.equal(game.run("state.specialGauge"), 100);
    game.run("space()");
    assert.equal(game.run("state.specialGauge"), 0);
  }
});

test("skills cannot fire during attack resolution, after fatal damage, or with no target", () => {
  for (const setup of ["target.resolving = true", "state.hp = 0", "clearEnemies()"] ) {
    const game = battle();
    game.run("state.specialGauge = 100; " + setup + "; updateHud()");
    assert.equal(game.run("els.specialButton.disabled"), true);
    assert.equal(game.run("useSpecialMove()"), false);
    assert.equal(game.run("state.specialGauge"), 100);
  }
});

test("tutorial and dialogue never charge or expose the skill panel", () => {
  const game = createGame();
  game.run("startGame(); addSuccessfulCharacters(100); updateHud()");
  assert.equal(game.run("els.skillPanel.hidden"), true);
  assert.equal(game.run("state.specialGauge"), 0);
  game.run("continueStoryToBattle(); addSuccessfulCharacters(100); updateHud()");
  assert.equal(game.run("els.skillPanel.hidden"), true);
  assert.equal(game.run("state.specialGauge"), 0);
});

test("a skill boss kill follows the ordinary clear and reward flow exactly once", () => {
  const game = battle();
  game.run(`
    stageDefinitions.grassland_path.waves = [{ types: ["snake_boss"], name: "蛇の王様", hp: 24, count: 1, experience: 70, boss: true }];
    startGame("grassland_path"); state.specialGauge = 100; space();
  `);
  assert.equal(game.run("state.activeEnemies[0].hp"), 0);
  assert.equal(game.run("state.totalExperience"), 255);
  game.advance(420);
  assert.equal(game.run("state.cleared"), 1);
  game.advance(620);
  assert.equal(game.run("state.running"), false);
  assert.equal(game.run("state.totalExperience"), 325);
  assert.equal(game.run("els.skillPanel.hidden"), true);
  assert.ok(game.savedProgress().clearedStages.includes("grassland_path"));
  game.run("space(); finishGame(true)");
  assert.equal(game.run("state.totalExperience"), 325);
});

test("skills hit every active enemy and mixed lethal/nonlethal hits resolve safely", () => {
  const game = battle();
  game.run(`
    target.hp = 5;
    addEnemyToWave({ types: ["snake_level_1"], hp: 50, count: 1, experience: 30 }, 0);
    const survivor = state.activeEnemies.at(-1);
    state.specialGauge = 100; space();
  `);
  assert.equal(game.run("target.hp"), 0);
  assert.equal(game.run("survivor.hp"), 26);
  game.advance(420);
  assert.equal(game.run("state.cleared"), 1);
  assert.equal(game.run("survivor.resolving"), false);
  assert.equal(game.run("getInputEnemy() === survivor"), true);
});

test("restart cancels old skill callbacks and resets the gauge", () => {
  const game = battle();
  game.run('state.specialGauge = 100; space(); startGame("grassland_path"); const freshEnemy = getCurrentEnemy()');
  game.advance(1000);
  assert.equal(game.run("state.specialGauge"), 0);
  assert.equal(game.run("state.specialInProgress"), false);
  assert.equal(game.run("state.cleared"), 0);
  assert.equal(game.run("freshEnemy.hp"), 14);
  assert.equal(game.run('els.specialEffect.classList.contains("is-active")'), false);
});

test("touch skill controls keep native activation and use the same effect", () => {
  const game = battle("greatsword", true);
  game.run(`
    const skillTarget = { closest: selector => selector === "#specialButton" ? els.specialButton : gameFlickUi.surface };
    let canceledSkillTap = false;
    guardGameFlickTouch({ type: "touchstart", target: skillTarget, touches: [{ identifier: 1, target: skillTarget }],
      changedTouches: [], cancelable: true, preventDefault() { canceledSkillTap = true; } });
  `);
  assert.equal(game.run("canceledSkillTap"), false);
  game.run('state.specialGauge = 100; updateHud(); els.specialButton.dispatchEvent({ type: "click" })');
  assert.equal(game.run("target.hp"), 76);
  assert.equal(game.run("state.specialGauge"), 0);
});

for (const touch of [false, true]) test('branch cannot charge or use a skill through any control (' + (touch ? 'touch' : 'keyboard') + ')', () => {
  const game = battle('branch', touch);
  game.run('applyTypedValue(target, "a".repeat(25))');
  assert.equal(game.run('state.specialGauge'), 0);
  assert.equal(game.run('els.skillPanel.hidden'), true);
  assert.equal(game.run('els.specialButton.disabled'), true);
  game.run('state.specialGauge = 100; updateHud(); space(); els.specialButton.dispatchEvent({type:"click"})');
  assert.equal(game.run('useSpecialMove()'), false);
  assert.equal(game.run('target.hp'), 100);
  assert.equal(game.run('state.specialInProgress'), false);
  assert.equal(game.run('state.specialGauge'), 100);
  game.run('applyTypedValue(target, target.matchedWord)');
  assert.ok(game.run('target.hp') < 100);
});
