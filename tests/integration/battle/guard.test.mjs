import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../../helpers/game.mjs";

function battle({ weaponId = "swordShield", stage = "mushroom_forest", touch = false } = {}) {
  const game = createGame({ "into-the-typing.player.v2": JSON.stringify({
    version: 2, totalExperience: 755, stats: { attack: 2, agility: 1 }, weaponId,
    introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true,
    greatswordObtained: true, dualBladesObtained: true, swordShieldObtained: true,
    skillTutorialCompleted: true,
    clearedStages: ["forest_path", "mist_road", "sky_castle", "storm_cove", "grassland_path", "flower_meadow", "swarm_meadow"],
  }) }, { touch });
  game.run(`startGame("${stage}")`);
  game.advance(850);
  game.run(`
    const enemy = getCurrentEnemy();
    const pressSpace = (shiftKey = false, repeat = false) => handleTypingKeydown({
      key: " ", code: "Space", shiftKey, repeat, preventDefault() {},
    });
    const releaseSpace = () => document.dispatchEvent({ type: "keyup", key: " ", code: "Space" });
    const attack = () => {
      if (enemy.attackStyle === "charge") enemy.chargeElapsedMs = enemy.chargeDurationMs;
      else setEnemyProgress(enemy, 1);
      enemyAttack(enemy);
    };
  `);
  return game;
}

for (const stage of ["mushroom_forest", "grassland_path"]) {
  test(`${stage}: holding Space blocks damage, preserves streak and releases for the next hit`, () => {
    const game = battle({ stage });
    game.run("state.combo = 4; state.successStreak = 3; state.specialGauge = 100; pressSpace(); attack()");
    assert.equal(game.run("state.hp"), game.run("getMaxHp()"));
    assert.equal(game.run("state.combo"), 4);
    assert.equal(game.run("state.successStreak"), 3);
    assert.equal(game.run("state.perfect"), true);
    assert.equal(game.run("state.specialGauge"), 100);
    assert.equal(game.run('els.player.classList.contains("is-guarding")'), true);
    assert.equal(game.run('els.player.classList.contains("is-guard-hit")'), true);
    assert.equal(game.run('els.guardButton.getAttribute("aria-pressed")'), "true");
    assert.equal(game.run("els.specialButton.disabled"), true);
    if (stage === "mushroom_forest") {
      assert.equal(game.run("enemy.chargeElapsedMs"), 0);
      assert.equal(game.run("enemy.progress"), .15);
    }
    game.advance(360);
    game.run("releaseSpace(); attack()");
    assert.equal(game.run("state.guarding"), false);
    assert.ok(game.run("state.hp") < game.run("getMaxHp()"));
    assert.equal(game.run("state.combo"), 0);
    assert.equal(game.run("state.perfect"), false);
  });
}

test("guard keeps partial input and prevents typing, buffered attacks, flick input and skills", () => {
  const game = battle({ touch: true });
  game.run(`
    applyTypedValue(enemy, enemy.matchedWord.slice(0, 1));
    const partial = enemy.typed;
    state.specialGauge = 100;
    pressSpace();
    handleTypingKeydown({ key: "a", code: "KeyA", preventDefault() {} });
    handleTypingKeydown({ key: "Backspace", preventDefault() {} });
    enqueueBufferedInput("letter", "a");
    applyTypedValue(enemy, enemy.matchedWord); damageEnemy(enemy);
    applyGameFlickKey("ka"); useSpecialMove();
  `);
  assert.equal(game.run("enemy.typed"), game.run("partial"));
  assert.equal(game.run("enemy.hp"), game.run("enemy.maxHp"));
  assert.equal(game.run("state.inputBuffer.length"), 0);
  assert.equal(game.run("state.specialGauge"), 100);
  assert.equal(game.run("state.specialInProgress"), false);
  assert.equal(game.run("canUseGameFlickKeyboard()"), false);
  game.run("releaseSpace()");
  assert.equal(game.run("canUseGameFlickKeyboard()"), true);
  game.run("applyTypedValue(enemy, enemy.matchedWord)");
  assert.ok(game.run("enemy.hp") < game.run("enemy.maxHp"));
});

test("guard cancels queued typing and attack animation without shortening the stage cooldown", () => {
  const game = battle();
  game.run(`applyTypedValue(enemy, enemy.matchedWord);
    const readyAt = state.playerAttackReadyAt;
    enqueueBufferedInput("letter", "a"); pressSpace();`);
  assert.equal(game.run("state.inputBuffer.length"), 0);
  assert.equal(game.run('els.player.classList.contains("is-attacking")'), false);
  game.advance(300);
  game.run("releaseSpace()");
  assert.equal(game.run("state.playerAttackReadyAt"), game.run("readyAt"));
  assert.equal(game.run("getInputEnemy()"), null);
  game.advance(400);
  assert.equal(game.run("getInputEnemy() === enemy"), true);
  assert.equal(game.run("state.combo"), 1);
});

test("sword and shield reserves Space for guard and Shift+Space for the existing skill", () => {
  const game = battle();
  game.run("state.specialGauge = 100; pressSpace(); pressSpace(false, true)");
  assert.equal(game.run("state.specialInProgress"), false);
  assert.equal(game.run("state.guarding"), true);
  assert.equal(game.run("els.specialShortcut.textContent"), "Shift+Space");
  game.run("releaseSpace(); pressSpace(true)");
  assert.equal(game.run("state.specialGauge"), 0);
  assert.equal(game.run("state.specialInProgress"), true);
  assert.equal(game.run("state.guarding"), false);
  game.run("pressSpace()");
  assert.equal(game.run("state.guarding"), false);
  for (const weaponId of ["branch", "sword", "greatsword", "dualBlades"]) {
    const other = battle({ weaponId });
    other.run("state.specialGauge = 100; pressSpace()");
    assert.equal(other.run("state.specialInProgress"), true);
    assert.equal(other.run("state.guarding"), false);
    assert.equal(other.run("els.guardButton.hidden"), true);
    assert.equal(other.run("els.specialShortcut.textContent"), "Space");
  }
});

test("pointer hold survives a different pointer release and combines with keyboard hold", () => {
  const game = battle({ touch: true });
  game.run(`
    const pointer = (type, pointerId) => els.guardButton.dispatchEvent({ type, pointerId, button: 0, preventDefault() {} });
    pointer("pointerdown", 4); pointer("pointerup", 9);
  `);
  assert.equal(game.run("state.guarding"), true);
  game.run('pressSpace(); pointer("pointercancel", 4)');
  assert.equal(game.run("state.guarding"), true);
  game.run("releaseSpace()");
  assert.equal(game.run("state.guarding"), false);
  game.run('pointer("pointerdown", 5); pointer("lostpointercapture", 5)');
  assert.equal(game.run("state.guarding"), false);
});

test("hiding the page, leaving battle, restarting and losing clear the guard and its input latch", () => {
  for (const action of [
    'document.hidden = true; document.dispatchEvent({ type: "visibilitychange" })',
    "showStageSelect()", "showHomeScreen()", "resetGame()", 'startGame("mushroom_forest")', "finishGame(false)",
  ]) {
    const game = battle();
    game.run(`pressSpace(); attack(); ${action}`);
    assert.equal(game.run("state.guarding"), false, action);
    assert.equal(game.run("playerGuardInput.keys.size"), 0, action);
    assert.equal(game.run("playerGuardInput.pointerId"), null, action);
    assert.equal(game.run('els.player.classList.contains("is-guard-hit")'), false, action);
    game.advance(1000);
    assert.equal(game.run("state.guarding"), false, action);
  }
});

test("Enter on the guard button and Space release independently", () => {
  const game = battle();
  game.run(`pressSpace(); els.guardButton.dispatchEvent({ type: "keydown", key: "Enter", preventDefault() {} }); releaseSpace()`);
  assert.equal(game.run("state.guarding"), true);
  game.run('document.dispatchEvent({ type: "keyup", key: "Enter" })');
  assert.equal(game.run("state.guarding"), false);
});
