import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../../helpers/game.mjs';
function battle(weaponId='sword',stage='mushroom_forest'){const game=createGame({'into-the-typing.player.v2':JSON.stringify({version:2,totalExperience:1750,stats:{attack:6,agility:3},weaponId,introCompleted:true,equipmentTutorialCompleted:true,ironSwordObtained:true,greatswordObtained:true,dualBladesObtained:true,swordShieldObtained:true,skillTutorialCompleted:true,clearedStages:['forest_path','mist_road','sky_castle','storm_cove','grassland_path','flower_meadow','swarm_meadow','mushroom_forest','spore_path','fairy_forest']})});game.run('startGame('+JSON.stringify(stage)+');const enemy=getCurrentEnemy();enemy.hp=100;enemy.attackPower={min:40,max:40};const press=(repeat=false)=>handleTypingKeydown({key:" ",code:"Space",repeat,preventDefault(){}});const incoming=()=>{if(enemy.attackStyle==="charge")enemy.chargeElapsedMs=enemy.chargeDurationMs;else setEnemyProgress(enemy,1);enemyAttack(enemy)}');game.advance(850);return game;}
test('counter matches the inclusive 200ms just-guard window and hits for five times normal damage',()=>{
 for(const elapsed of [0,199,200,201,500]){const game=battle();const hp=game.run('state.hp');game.run('press()');game.advance(elapsed);game.run('incoming()');const success=elapsed<=200;
 assert.equal(game.run('state.hp'),hp-(success?0:40));assert.equal(game.run('enemy.hp'),success?70:100);assert.equal(game.run('els.player.classList.contains("is-counter-hit")'),success);assert.equal(game.run('state.guarding'),false);}
});
test('a held or rapidly repeated Space cannot extend or reopen the counter window',()=>{
 const game=battle();game.run('press()');game.advance(250);game.run('press(true);press()');assert.equal(game.run('playerCounter.openedAt'),null);game.advance(349);assert.equal(game.run('beginPlayerCounter()'),false);game.advance(1);assert.equal(game.run('beginPlayerCounter()'),true);
});
test('counter can kill a boss and grants its reward once through the ordinary defeat path',()=>{
 const game=battle('sword','thorn_depths');game.run('clearEnemies();state.currentWaveIndex=2;state.currentWaveSpawned=0;state.cleared=4;state.pendingExperience=500;spawnNextEnemy();const boss=getCurrentEnemy();boss.hp=20');game.advance(1600);
 const hp=game.run('state.hp');game.run('press();boss.chargeElapsedMs=boss.chargeDurationMs;enemyAttack(boss);enemyAttack(boss)');assert.equal(game.run('state.hp'),hp);assert.equal(game.run('boss.hp'),0);game.advance(1200);assert.equal(game.savedProgress().totalExperience,2850);assert.ok(game.savedProgress().clearedStages.includes('thorn_depths'));game.run('finishGame(true)');assert.equal(game.savedProgress().totalExperience,2850);
});
test('counter works against melee attacks and neither charges nor consumes the healing skill gauge',()=>{
 const game=battle('sword','grassland_path');game.run('state.specialGauge=60;press();incoming()');assert.equal(game.run('enemy.hp'),70);assert.equal(game.run('state.specialGauge'),60);assert.equal(game.run('state.specialInProgress'),false);
});
test('other weapons cannot counter and leaving or restarting clears all counter state',()=>{
 for(const weapon of ['branch','dualBlades','swordShield','greatsword'])assert.equal(battle(weapon).run('beginPlayerCounter()'),false);
 const game=battle();game.run('press();showStageSelect()');assert.equal(game.run('playerCounter.openedAt'),null);assert.equal(game.run('playerCounter.readyAt'),0);game.advance(1000);assert.equal(game.run('els.player.classList.contains("is-counter-hit")'),false);
});
