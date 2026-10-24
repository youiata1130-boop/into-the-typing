import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../../helpers/game.mjs';
function battle(weaponId='sword',touch=false){const game=createGame({'into-the-typing.player.v2':JSON.stringify({version:2,totalExperience:255,stats:{attack:2,agility:1},weaponId,introCompleted:true,equipmentTutorialCompleted:true,ironSwordObtained:true,greatswordObtained:true,skillTutorialCompleted:true,clearedStages:['forest_path','mist_road','sky_castle','storm_cove']})},{touch});game.run('startGame("grassland_path");const enemy=getCurrentEnemy();enemy.hp=enemy.maxHp=100;enemy.word=enemy.matchedWord="a".repeat(64);enemy.inputs=[enemy.word];state.hp=50');game.advance(850);return game;}
test('iron sword charges at half speed and heals thirty percent without hurting or resetting enemies',()=>{
 const game=battle();game.run('applyTypedValue(enemy,"a".repeat(25))');assert.equal(game.run('state.specialGauge'),50);
 const other=battle('greatsword');other.run('applyTypedValue(enemy,"a".repeat(25))');assert.equal(other.run('state.specialGauge'),100);
 game.run('applyTypedValue(enemy,"a".repeat(50));const before={hp:enemy.hp,word:enemy.word,typed:enemy.typed,charge:enemy.chargeElapsedMs,progress:enemy.progress};useSpecialMove()');
 assert.equal(game.run('state.hp'),89);assert.equal(game.run('state.specialGauge'),0);assert.equal(game.run('els.skillName.textContent'),'癒しの光');assert.equal(game.run('els.playerHealText.textContent'),'＋39');
 assert.deepEqual(game.snapshot('({hp:enemy.hp,word:enemy.word,typed:enemy.typed,charge:enemy.chargeElapsedMs,progress:enemy.progress})'),game.snapshot('before'));
 assert.equal(game.run('els.specialEffect.classList.contains("is-active")'),false);assert.equal(game.run('els.player.classList.contains("is-healing")'),true);
 assert.equal(game.run('useSpecialMove()'),false);game.advance(650);assert.equal(game.run('state.specialInProgress'),false);game.advance(250);assert.equal(game.run('els.player.classList.contains("is-healing")'),false);
});
for(const touch of [false,true])test('healing caps at max HP and '+(touch?'button':'Enter')+' works without wasting a full-health gauge',()=>{
 const game=battle('sword',touch);game.run('state.hp=getMaxHp();state.specialGauge=100;updateHud()');assert.equal(game.run('useSpecialMove()'),false);assert.equal(game.run('state.specialGauge'),100);assert.equal(game.run('els.specialButton.disabled'),true);
 game.run('state.hp=getMaxHp()-5;updateHud()');if(touch)game.run('els.specialButton.dispatchEvent({type:"click"})');else game.run('handleTypingKeydown({key:"Enter",code:"Enter",preventDefault(){}})');
 assert.equal(game.run('state.hp'),game.run('getMaxHp()'));assert.equal(game.run('els.playerHealText.textContent'),'＋5');assert.equal(game.run('state.specialGauge'),0);
});
test('healing gives no invulnerability and leaving battle cancels the light and callbacks',()=>{
 const game=battle();game.run('state.specialGauge=100;useSpecialMove();setEnemyProgress(enemy,1);enemy.attackPower={min:10,max:10};enemyAttack(enemy)');assert.equal(game.run('state.hp'),79);
 game.run('showStageSelect()');game.advance(1000);assert.equal(game.run('els.player.classList.contains("is-healing")'),false);assert.equal(game.run('els.playerHealText.textContent'),'');assert.equal(game.run('state.running'),false);
});
