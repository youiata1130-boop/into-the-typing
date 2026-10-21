import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../../helpers/game.mjs";

function battle(weaponId = "greatsword", touch = false, swarm = false) {
  const game = createGame({
    "into-the-typing.player.v2": JSON.stringify({
      version: 2, totalExperience: 415, stats: { attack: 2, agility: 1 }, weaponId,
      introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true,
      greatswordObtained: true, dualBladesObtained: true, swordShieldObtained: true, skillTutorialCompleted: true,
      clearedStages: ["forest_path", "mist_road", "sky_castle", "storm_cove", "grassland_path", "flower_meadow"],
    }),
  }, { touch });
  game.run(`startGame("${swarm ? "swarm_meadow" : "grassland_path"}")`);
  game.advance(swarm ? 3000 : 850);
  game.run(`
    const target = getInputEnemy();
    target.hp = target.maxHp = 100;
    const hit = () => applyTypedValue(target, target.matchedWord);
    const type = key => handleTypingKeydown({ key, code: "", preventDefault() {} });
  `);
  return game;
}

for (const [weaponId, cooldown, reaction] of [["greatsword", 1500, 220], ["sword", 700, 220], ["swordShield", 700, 220], ["dualBlades", 200, 110]]) {
  test(`${weaponId}: cooldown blocks normal attacks until its exact boundary and re-enables touch`, () => {
    const game = battle(weaponId, true);
    game.run("hit()");
    const hp = game.run("target.hp");
    assert.equal(game.run("els.attackCooldown.hidden"), false);
    assert.equal(game.run("canUseGameFlickKeyboard()"), false);
    game.advance(reaction);
    assert.equal(game.run("target.resolving"), false);
    assert.equal(game.run("target.animation"), "idle");
    game.run("hit(); damageEnemy(target); applyGameFlickKey('ka')");
    assert.equal(game.run("target.hp"), hp);
    assert.equal(game.run("target.typed"), "");
    game.advance(cooldown - reaction - 1);
    assert.equal(game.run("getInputEnemy()"), null);
    game.advance(1);
    assert.equal(game.run("getInputEnemy() === target"), true);
    assert.equal(game.run("canUseGameFlickKeyboard()"), true);
    assert.equal(game.run("gameFlickUi.buttons.find(item => item.definition.id === 'ka').button.disabled"), false);
    assert.equal(game.run("els.attackCooldown.hidden"), true);
    game.run("hit()");
    assert.ok(game.run("target.hp") < hp);
    assert.equal(game.run("els.attackCooldown.hidden"), false);
  });
}

test("early keyboard input survives the full greatsword cooldown and attacks only once per interval", () => {
  const game = battle();
  game.run(`
    setNextWord = enemy => {
      enemy.word = enemy.matchedWord = "neko";
      enemy.inputs = ["neko"]; enemy.typed = "";
      enemy.translation = "猫"; enemy.inputRevision++;
    };
    hit();
    [..."nek"].forEach(type); type("Backspace"); [..."ko"].forEach(type);
  `);
  game.advance(1499);
  assert.equal(game.run("state.combo"), 1);
  assert.equal(game.run("target.typed"), "");
  game.advance(1);
  assert.equal(game.run("state.combo"), 2);
  assert.equal(game.run("state.inputBuffer.length"), 0);
  game.run('[..."neko"].forEach(type)');
  game.advance(1499);
  assert.equal(game.run("state.combo"), 2);
  game.advance(1);
  assert.equal(game.run("state.combo"), 3);
  assert.equal(game.run("state.inputBuffer.length"), 0);
});

test("killing a target, switching targets and new spawns cannot bypass cooldown", () => {
  const game = battle("greatsword", false, true);
  game.run("target.hp = 1; hit()");
  game.advance(840);
  game.run("const second = getCurrentEnemy(); setTargetEnemy(second); damageEnemy(second)");
  assert.equal(game.run("second.hp"), 1);
  assert.equal(game.run("getInputEnemy()"), null);
  game.advance(260);
  assert.equal(game.run("state.currentWaveSpawned"), 4);
  assert.equal(game.run("getInputEnemy()"), null);
  game.advance(400);
  assert.equal(game.run("getInputEnemy() === second"), true);
});

test("enemies keep moving and can attack during recovery; a charged skill remains available", () => {
  const game = battle();
  game.run("hit()");
  game.advance(220);
  const before = game.run("target.progress");
  game.advance(300);
  game.run("enemyLoop(performance.now())");
  assert.ok(game.run("target.progress") > before);
  const hp = game.run("state.hp");
  game.run("setEnemyProgress(target, 1); enemyAttack(target)");
  assert.ok(game.run("state.hp") < hp);
  assert.equal(game.run("getInputEnemy()"), null);
  game.run("state.specialGauge = 100");
  assert.equal(game.run("useSpecialMove()"), true);
  game.advance(420);
  assert.equal(game.run("getInputEnemy()"), null);
  game.advance(560);
  assert.equal(game.run("getInputEnemy() === target"), true);
});

test("leaving, losing or restarting clears cooldown and old callbacks cannot unlock a new battle", () => {
  for (const action of ['showStageSelect()', 'finishGame(false)', 'startGame("grassland_path")']) {
    const game = battle();
    game.run("hit()");
    game.advance(500);
    game.run(action);
    assert.equal(game.run("state.playerAttackReadyAt"), 0);
    assert.equal(game.run("state.playerAttackCooldownTimerId"), 0);
    assert.equal(game.run("els.attackCooldown.hidden"), true);
    game.run('startGame("grassland_path"); applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)');
    game.advance(1000);
    assert.equal(game.run("getInputEnemy()"), null);
    game.advance(500);
    assert.ok(game.run("getInputEnemy()"));
  }
});

test("weapon cooldown settings are captured again on the next stage start", () => {
  const game = battle("dualBlades", false, true);
  game.run('weaponDefinitions.dualBlades.attackCooldownMs = 80; startGame("swarm_meadow")');
  game.advance(3000);
  game.run('const nextTarget = getInputEnemy(); nextTarget.hp = 100; applyTypedValue(nextTarget, nextTarget.matchedWord)');
  game.advance(79);
  assert.equal(game.run("getInputEnemy()"), null);
  game.advance(1);
  assert.equal(game.run("getInputEnemy() === nextTarget"), true);
  game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
  assert.equal(game.run("state.combo"), 2);
});

for (const weaponId of ["branch", "sword", "dualBlades", "greatsword", "swordShield"]) {
  test(`${weaponId}: agility shortens the fixed stage cooldown and hides the prompt until it ends`, () => {
    const game = battle(weaponId, true);
    const baseDuration = game.run(`state.stageAttackCooldowns.${weaponId}`);
    game.run('state.stats.agility = 3; startGame("grassland_path")');
    game.advance(850);
    const duration = game.run(`state.stageAttackCooldowns.${weaponId}`);
    assert.ok(duration > 0 && duration < baseDuration);
    game.run(`
      const fixedTarget = getInputEnemy();
      fixedTarget.hp = 100;
      applyTypedValue(fixedTarget, fixedTarget.matchedWord);
      state.stats.agility = 9;
      weaponDefinitions.${weaponId}.attackCooldownMs = 9000;
    `);
    assert.equal(game.run("state.playerAttackCooldownMs"), duration);
    game.advance(duration - 1);
    assert.equal(game.run("els.wordTranslation.textContent"), "");
    assert.equal(game.run("els.remainingWord.textContent"), "");
    assert.equal(game.run("getInputEnemy()"), null);
    game.advance(1);
    assert.equal(game.run("els.wordTranslation.textContent === fixedTarget.translation"), true);
    assert.ok(game.run("els.remainingWord.textContent"));
    game.run(`
      fixedTarget.word = fixedTarget.matchedWord = "a";
      fixedTarget.inputs = ["a"];
      applyTypedValue(fixedTarget, "a");
    `);
    assert.equal(game.run("state.playerAttackCooldownMs"), duration);
    assert.equal(game.run("state.combo"), 2);
  });
}
