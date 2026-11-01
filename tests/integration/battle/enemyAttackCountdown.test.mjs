import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../../helpers/game.mjs';

function battle(charge = false) {
  const game = createGame();
  game.run(`state.running=true; state.storyPhase="armed"; state.battleStartsAt=0;
    Math.random=()=>0.5;
    const enemy=createEnemy({types:["mushroom_level_1"],hp:100,approachMs:6000,
      repeatAttackMs:5000,attackStyle:${JSON.stringify(charge ? 'charge' : 'melee')},chargeMs:6000,attackPower:{min:10,max:10}},0);
    state.activeEnemies=[enemy]; const hp=state.hp;`);
  return game;
}
function tick(game, ms) { game.advance(ms); game.run('enemyLoop(performance.now())'); }
function count(game) { return game.run('enemy.attackCountdownEl.hidden ? null : enemy.attackCountdownEl.textContent'); }

for (const charge of [false, true]) test(`${charge ? 'charge' : 'approach'} shows 3, 2, 1 and attacks exactly at visible zero`, () => {
  const game = battle(charge);
  tick(game, 2999); assert.equal(count(game), null);
  tick(game, 1); assert.equal(count(game), '3');
  tick(game, 999); assert.equal(count(game), '3');
  tick(game, 1); assert.equal(count(game), '2');
  tick(game, 1000); assert.equal(count(game), '1');
  tick(game, 999); assert.equal(game.run('state.hp'), game.run('hp'));
  tick(game, 1); assert.equal(count(game), '0');
  assert.equal(game.run('state.hp'), game.run('hp') - 10);
  tick(game, 220); assert.equal(count(game), null);
});

test('melee repeat countdown uses its real scheduled attack deadline', () => {
  const game = battle();
  tick(game, 6000);
  const delay = game.run('enemy.nextAttackAt - performance.now()');
  tick(game, delay - 3000); assert.equal(count(game), '3');
  tick(game, 1000); assert.equal(count(game), '2');
  tick(game, 1000); assert.equal(count(game), '1');
  tick(game, 1000); assert.equal(count(game), '0');
  assert.equal(game.run('state.hp'), game.run('hp') - 20);
});

test('knockback recalculates approach, charge recovery pauses time, and time stop freezes the displayed count', () => {
  for (const charge of [false, true]) {
    const game = battle(charge);
    tick(game, 4000); assert.equal(count(game), '2');
    game.run('resolveWeaponHit(enemy,1,220)');
    assert.equal(count(game), null);
    tick(game, 220);
    assert.equal(count(game), charge ? '2' : '3');
    game.run('startEnemyActionStop(5000)');
    const before = count(game);
    tick(game, 4999); assert.equal(count(game), before);
    tick(game, 1); assert.equal(count(game), before);
    assert.equal(game.run('state.hp'), game.run('hp'));
  }
  const game = battle();
  game.run('setEnemyProgress(enemy,1); enemy.atBase=true; enemy.nextAttackAt=performance.now()+2000; startEnemyActionStop(5000)');
  tick(game, 4999); assert.equal(count(game), '2');
  tick(game, 1); assert.equal(count(game), '2');
  tick(game, 2000); assert.equal(count(game), '0');
});

test('each active enemy has an independent countdown, hidden before start, in dialogue, on death and after battle', () => {
  const game = battle();
  game.run(`const second=createEnemy({types:["mushroom_level_1"],hp:100,approachMs:8000},0);
    state.activeEnemies.push(second);`);
  tick(game, 4000);
  assert.equal(count(game), '2');
  assert.equal(game.run('second.attackCountdownEl.hidden'), true);
  game.run('state.battleStartsAt=performance.now()+100; updateHud()');
  assert.equal(count(game), null);
  game.run('state.battleStartsAt=0; state.storyPhase="encounter"; updateHud()');
  assert.equal(count(game), null);
  game.run('state.storyPhase="armed"; enemy.hp=0; updateEnemyHud(enemy)');
  assert.equal(count(game), null);
  game.run('enemy.hp=100; state.running=false; updateHud()');
  assert.equal(count(game), null);
});
