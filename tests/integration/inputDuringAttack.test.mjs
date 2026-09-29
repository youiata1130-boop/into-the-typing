import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

function battle({ touch = false } = {}) {
  const game = createGame({
    "into-the-typing.player.v2": JSON.stringify({
      version: 2, totalExperience: 0, stats: { attack: 1, agility: 1 },
      weaponId: "greatsword", introCompleted: true, equipmentTutorialCompleted: true,
    }),
  }, { touch });
  game.run('startGame("mist_road")');
  game.advance(850);
  game.run(`
    const target = getCurrentEnemy();
    target.hp = target.maxHp = 20;
    target.attackPower = { min: 3, max: 3 };
    target.word = target.matchedWord = "gakkou";
    target.inputs = ["gakkou"];
    target.translation = "学校";
    renderWord();
    const type = key => handleTypingKeydown({ key, code: "", preventDefault() {} });
  `);
  return game;
}

test("keyboard letters and backspace apply immediately during an incoming attack", () => {
  const game = battle();
  game.run('type("g"); enemyAttack(target); type("a"); type("Backspace"); type("a")');
  assert.equal(game.run("target.typed"), "ga");
  assert.equal(game.run("state.inputBuffer.length"), 0);
  assert.equal(game.run("getInputEnemy() === target"), true);
  assert.equal(game.run("state.hp"), game.run("getMaxHp() - 3"));
  game.advance(200);
  game.run("enemyLoop(performance.now())");
  assert.equal(game.run("target.animation"), "attack");
  assert.equal(game.run("target.element.classList.contains('attack')"), true);
  assert.equal(game.run("state.hp"), game.run("getMaxHp() - 3"));
});

test("a flick held across an incoming attack commits and preserves pending modifiers", () => {
  const game = battle({ touch: true });
  game.run(`
    const ka = gameFlickUi.buttons.find(item => item.definition.id === "ka");
    const pointer = { pointerId: 1, button: 0, clientX: 50, clientY: 50, preventDefault() {} };
    beginGameFlickGesture(pointer, ka.definition, ka.button);
    enemyAttack(target);
  `);
  assert.equal(game.run("Boolean(gameFlickState.gesture)"), true);
  assert.equal(game.run("ka.button.disabled"), false);
  game.run("endGameFlickGesture(pointer)");
  assert.equal(game.run("els.flickInput.value"), "か");
  assert.equal(game.run("flickState.lastPending"), true);
  assert.equal(game.run('applyGameFlickKey("modifier")'), true);
  assert.equal(game.run("els.flickInput.value"), "が");
  assert.equal(game.run('applyGameFlickKey("ta", 2)'), true);
  game.advance(360);
  assert.equal(game.run("els.flickInput.value"), "がつ");
  assert.equal(game.run('applyGameFlickKey("modifier")'), true);
  assert.equal(game.run("els.flickInput.value"), "がっ");
  assert.equal(game.run("target.typingMisses"), 0);
});

test("completing a word during an incoming attack hits immediately without an early unlock", () => {
  const game = battle({ touch: true });
  game.run('applyGameFlickKey("ka"); applyGameFlickKey("modifier"); enemyAttack(target)');
  assert.equal(game.run("els.flickInput.value"), "が");
  game.advance(350);
  game.run('applyGameFlickKey("ta", 2); applyGameFlickKey("modifier"); applyGameFlickKey("ka", 4); applyGameFlickKey("a", 2)');
  assert.equal(game.run("target.hp"), 16);
  assert.equal(game.run("els.flickInput.value"), "");
  assert.equal(game.run("target.animation"), "damage");
  assert.equal(game.run("target.element.classList.contains('attack')"), false);
  game.advance(10);
  assert.equal(game.run("target.resolving"), true);
  assert.equal(game.run("target.animation"), "damage");
  assert.equal(game.run("getInputEnemy()"), null);
  game.advance(210);
  assert.equal(game.run("target.resolving"), false);
  assert.equal(game.run("target.typed"), "");
  assert.equal(game.run("canUseGameFlickKeyboard()"), true);
});

test("a counterattack that defeats the enemy is not reset by its old attack timer", () => {
  const game = battle();
  game.run("target.hp = 4; enemyAttack(target)");
  game.advance(100);
  game.run('applyTypedValue(target, "gakkou")');
  assert.equal(game.run("target.hp"), 0);
  game.advance(220);
  assert.equal(game.run("target.animation"), "defeat");
  assert.equal(game.run("state.cleared"), 1);
  game.advance(40);
  assert.equal(game.run("target.animation"), "defeat");
  assert.equal(game.run("target.resolving"), true);
  assert.equal(game.run("target.element.classList.contains('attack')"), false);
});

test("a special move during an incoming attack keeps its damage animation until it resolves", () => {
  const game = battle();
  game.run("enemyAttack(target); state.specialGauge = 100");
  assert.equal(game.run("useSpecialMove()"), true);
  game.advance(360);
  assert.equal(game.run("target.animation"), "damage");
  assert.equal(game.run("target.resolving"), true);
  assert.equal(game.run("state.specialInProgress"), true);
  game.advance(60);
  assert.equal(game.run("target.resolving"), false);
  assert.equal(game.run("state.specialInProgress"), false);
});

test("incoming attacks retain their recovery and repeat interval without repeated damage per frame", () => {
  const game = battle();
  game.run("target.atBase = true; target.nextAttackAt = performance.now(); enemyLoop(performance.now())");
  game.advance(359);
  game.run("enemyLoop(performance.now())");
  assert.equal(game.run("target.animation"), "attack");
  assert.equal(game.run("state.hp"), game.run("getMaxHp() - 3"));
  game.advance(1);
  assert.equal(game.run("target.animation"), "idle");
  assert.equal(game.run("target.element.classList.contains('attack')"), false);
  game.advance(2199);
  game.run("enemyLoop(performance.now())");
  assert.equal(game.run("state.hp"), game.run("getMaxHp() - 3"));
  game.advance(1);
  game.run("enemyLoop(performance.now())");
  assert.equal(game.run("target.animation"), "attack");
  assert.equal(game.run("state.hp"), game.run("getMaxHp() - 6"));
});

test("a fatal incoming attack still ends the battle and disables flick input", () => {
  const game = battle({ touch: true });
  game.run("state.hp = 3; enemyAttack(target)");
  assert.equal(game.run("state.hp"), 0);
  assert.equal(game.run("canUseGameFlickKeyboard()"), false);
  game.advance(320);
  assert.equal(game.run("state.running"), false);
  assert.equal(game.run("target.element.classList.contains('attack')"), false);
  game.advance(40);
  assert.equal(game.run("state.running"), false);
});
