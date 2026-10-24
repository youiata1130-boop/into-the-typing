import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../../helpers/game.mjs';
function battle(stage='mushroom_forest') {const game=createGame({'into-the-typing.player.v2':JSON.stringify({version:2,totalExperience:1750,stats:{attack:7,agility:3},weaponId:'dualBlades',introCompleted:true,equipmentTutorialCompleted:true,ironSwordObtained:true,greatswordObtained:true,dualBladesObtained:true,swordShieldObtained:true,skillTutorialCompleted:true,clearedStages:['forest_path','mist_road','sky_castle','storm_cove','grassland_path','flower_meadow','swarm_meadow','mushroom_forest','spore_path','fairy_forest']})});game.run('startGame('+JSON.stringify(stage)+');const enemy=getCurrentEnemy()');game.advance(850);return game;}
function tick(game,ms){game.advance(ms);game.run('enemyLoop(performance.now())');}
test('time stop pauses charge and damage for exactly five seconds while player input still works',()=>{
 const game=battle();game.run('enemy.chargeElapsedMs=1000;state.specialGauge=100;const hp=state.hp;const enemyHp=enemy.hp;const typed=enemy.matchedWord[0];useSpecialMove()');
 assert.equal(game.run('state.specialGauge'),0);assert.equal(game.run('state.specialInProgress'),false);assert.equal(game.run('els.skillName.textContent'),'時止め');
 game.run('enemyAttack(enemy);applyTypedValue(enemy,typed)');assert.equal(game.run('enemy.typed'),game.run('typed'));assert.equal(game.run('enemy.hp'),game.run('enemyHp'));assert.equal(game.run('state.hp'),game.run('hp'));
 tick(game,4999);assert.equal(game.run('enemy.chargeElapsedMs'),1000);assert.equal(game.run('isEnemyActionStopped()'),true);
 tick(game,1);assert.equal(game.run('isEnemyActionStopped()'),false);assert.equal(game.run('enemy.chargeElapsedMs'),1000);
 tick(game,100);assert.equal(game.run('enemy.chargeElapsedMs'),1100);
});
test('killing an enemy does not end or restart the remaining stop time for its successor',()=>{
 const game=battle();game.run('enemy.hp=1;state.specialGauge=100;useSpecialMove();const deadline=enemyActionStop.until;applyTypedValue(enemy,enemy.matchedWord)');tick(game,1500);
 assert.equal(game.run('getCurrentEnemy().id===enemy.id'),false);assert.equal(game.run('getCurrentEnemy().element.classList.contains("is-time-stopped")'),true);assert.equal(game.run('enemyActionStop.until===deadline'),true);
 const charge=game.run('getCurrentEnemy().chargeElapsedMs');tick(game,3499);assert.equal(game.run('getCurrentEnemy().chargeElapsedMs'),charge);tick(game,1);
 assert.equal(game.run('isEnemyActionStopped()'),false);assert.equal(game.run('getCurrentEnemy().element.classList.contains("is-time-stopped")'),false);tick(game,100);assert.equal(game.run('getCurrentEnemy().chargeElapsedMs'),charge+100);
});
test('melee movement and remaining repeat-attack delay resume without catching up',()=>{
 const moving=battle('grassland_path');moving.run('state.specialGauge=100;const position=enemy.progress;useSpecialMove()');tick(moving,5000);assert.equal(moving.run('enemy.progress'),moving.run('position'));tick(moving,100);assert.ok(moving.run('enemy.progress')>moving.run('position'));
 const game=battle('grassland_path');game.run('setEnemyProgress(enemy,1);enemy.atBase=true;enemy.nextAttackAt=performance.now()+800;state.specialGauge=100;const hp=state.hp;useSpecialMove()');tick(game,5000);tick(game,799);assert.equal(game.run('state.hp'),game.run('hp'));tick(game,1);assert.ok(game.run('state.hp')<game.run('hp'));
});
test('new bosses are stopped too, and retry or leaving battle cancels the effect and old expiry',()=>{
 const game=battle('thorn_depths');game.run('state.specialGauge=100;useSpecialMove();clearEnemies();state.currentWaveIndex=2;state.currentWaveSpawned=0;spawnNextEnemy()');assert.equal(game.run('getCurrentEnemy().boss'),true);assert.equal(game.run('getCurrentEnemy().element.classList.contains("is-time-stopped")'),true);
 game.run('startGame("thorn_depths")');assert.equal(game.run('isEnemyActionStopped()'),false);assert.equal(game.run('els.enemyStopIndicator.hidden'),true);tick(game,5200);
 assert.equal(game.run('isEnemyActionStopped()'),false);
 game.run('state.specialGauge=100;useSpecialMove();showStageSelect()');assert.equal(game.run('isEnemyActionStopped()'),false);
});
test('an active stop cannot be extended by spending another full gauge',()=>{
 const game=battle();game.run('state.specialGauge=100;useSpecialMove();const deadline=enemyActionStop.until;state.specialGauge=100');tick(game,1000);assert.equal(game.run('useSpecialMove()'),false);assert.equal(game.run('state.specialGauge'),100);assert.equal(game.run('enemyActionStop.until===deadline'),true);
});
