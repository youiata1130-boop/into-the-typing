import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../../helpers/game.mjs';
function battle(){const game=createGame({'into-the-typing.player.v2':JSON.stringify({version:2,totalExperience:1750,stats:{attack:6,agility:3},weaponId:'swordShield',introCompleted:true,equipmentTutorialCompleted:true,ironSwordObtained:true,greatswordObtained:true,swordShieldObtained:true,skillTutorialCompleted:true,clearedStages:['forest_path','mist_road','sky_castle','storm_cove','grassland_path','flower_meadow','swarm_meadow']})});game.run('startGame("mushroom_forest");const enemy=getCurrentEnemy()');game.advance(850);return game;}
test('sword and shield gains fifty percent damage for eight seconds without immediate enemy damage or input reset',()=>{
 const game=battle();const hp=game.run('enemy.hp');game.run('const damage=getPlayerAttackDamage(enemy);const stat=getStatValue("attack");applyTypedValue(enemy,enemy.matchedWord[0]);const prefix=enemy.typed;state.specialGauge=100;useSpecialMove()');
 assert.equal(game.run('state.specialGauge'),0);assert.equal(game.run('state.specialInProgress'),false);assert.equal(game.run('enemy.hp'),hp);assert.equal(game.run('enemy.typed'),game.run('prefix'));assert.equal(game.run('getStatValue("attack")'),game.run('stat'));assert.equal(game.run('getPlayerAttackDamage(enemy)'),9);
 assert.equal(game.run('els.skillName.textContent'),'戦意高揚');assert.equal(game.run('els.attackBoostIndicator.hidden'),false);game.advance(7999);assert.equal(game.run('getPlayerAttackDamage(enemy)'),9);game.advance(1);assert.equal(game.run('getPlayerAttackDamage(enemy)'),6);assert.equal(game.run('els.attackBoostIndicator.hidden'),true);
});
test('normal attacks consume boosted damage and guarding retains quarter damage during the buff',()=>{
 const game=battle();game.run('enemy.hp=100;state.specialGauge=100;useSpecialMove();applyTypedValue(enemy,enemy.matchedWord)');assert.equal(game.run('enemy.hp'),91);game.advance(1000);
 const hp=game.run('state.hp');game.run('beginPlayerGuard("keyboard");enemy.attackPower={min:40,max:40};enemy.chargeElapsedMs=enemy.chargeDurationMs;enemyAttack(enemy)');assert.equal(game.run('state.hp'),hp-10);assert.equal(game.run('isPlayerAttackBoosted()'),true);
});
test('the buff follows the player across enemies, does not stack, and is cleared by leaving or retrying',()=>{
 const game=battle();game.run('enemy.hp=1;state.specialGauge=100;useSpecialMove();state.specialGauge=100');assert.equal(game.run('useSpecialMove()'),false);assert.equal(game.run('state.specialGauge'),100);game.run('applyTypedValue(enemy,enemy.matchedWord)');game.advance(1500);assert.equal(game.run('getCurrentEnemy().id===enemy.id'),false);assert.equal(game.run('getPlayerAttackDamage(getCurrentEnemy())'),9);
 game.run('startGame("mushroom_forest")');assert.equal(game.run('isPlayerAttackBoosted()'),false);game.advance(850);game.run('state.specialGauge=100;useSpecialMove();showStageSelect()');game.advance(9000);assert.equal(game.run('isPlayerAttackBoosted()'),false);assert.equal(game.run('els.attackBoostIndicator.hidden'),true);
});
