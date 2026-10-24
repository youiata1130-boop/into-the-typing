import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../../helpers/game.mjs";

test("attack cycles vary within ten percent without cumulative drift or mid-charge rerolls", () => {
  const game = createGame();
  game.run('state.running = true; state.storyPhase = "armed"; state.battleStartsAt = 0; Math.random = () => 0; const enemy = createEnemy({types: ["mushroom_level_1"], hp: 20, attackStyle: "charge", chargeMs: 6000}, 0); state.activeEnemies = [enemy]');
  assert.equal(game.run('enemy.chargeDurationMs'), 5400);
  game.run('Math.random = () => 0.999999; enemy.chargeElapsedMs = 1000; updateEnemyCharge(enemy)');
  assert.equal(game.run('enemy.chargeDurationMs'), 5400);
  game.run('enemy.chargeElapsedMs = enemy.chargeDurationMs; enemyAttack(enemy)');
  assert.equal(game.run('enemy.chargeDurationMs'), 6600);
  assert.equal(game.run('enemy.chargeElapsedMs'), 0);
  game.advance(360);
  game.run('Math.random = () => 0.5; resetEnemyCharge(enemy)');
  assert.equal(game.run('enemy.chargeDurationMs'), 6000);
  for(let index=0;index<30;index++) {
    game.run('Math.random = () => 0; resetEnemyCharge(enemy)');
    assert.equal(game.run('enemy.chargeDurationMs'), 5400);
  }
  game.run('enemy.chargeElapsedMs = enemy.chargeDurationMs * .75; updateEnemyCharge(enemy)');
  assert.equal(game.run('enemy.element.dataset.chargePhase'), 'warning');
});

test("melee approach and each repeat interval use the same bounded variation", () => {
  const game = createGame();
  game.run('state.running = true; state.storyPhase = "armed"; Math.random = () => 0; const enemy = createEnemy({types: ["mushroom_level_1"], hp: 20, approachMs: 8000, repeatAttackMs: 2000, attackPower: 1}, 0); state.activeEnemies = [enemy]; setEnemyProgress(enemy, 1)');
  assert.equal(game.run('enemy.approachMs'),7200);
  game.run('enemyAttack(enemy)');
  assert.equal(game.run('enemy.nextAttackAt - performance.now() - enemyAttackRecoveryMs'),1800);
  game.advance(360);
  game.run('Math.random = () => 0.999999; enemyAttack(enemy)');
  assert.equal(game.run('enemy.nextAttackAt - performance.now() - enemyAttackRecoveryMs'),2200);
});
