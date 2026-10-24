import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../../helpers/game.mjs';
function battle() {
 const game=createGame({'into-the-typing.player.v2':JSON.stringify({version:2,totalExperience:1750,stats:{attack:7,agility:3},weaponId:'swordShield',introCompleted:true,equipmentTutorialCompleted:true,ironSwordObtained:true,greatswordObtained:true,swordShieldObtained:true,skillTutorialCompleted:true,clearedStages:['forest_path','mist_road','sky_castle','storm_cove','grassland_path','flower_meadow','swarm_meadow']})});
 game.run('startGame("mushroom_forest");const enemy=getCurrentEnemy();enemy.attackPower={min:32,max:32};const incoming=()=>{enemy.chargeElapsedMs=enemy.chargeDurationMs;enemyAttack(enemy)}');game.advance(850);return game;
}
test('unguarded damage shows a red impact and its actual amount without a typing error',()=>{
 const game=battle();const hp=game.run('state.hp');game.run('incoming()');
 assert.equal(game.run('state.hp'),hp-32);
 assert.equal(game.run('els.player.classList.contains("is-damaged")'),true);
 assert.equal(game.run('els.playerDamageEffect.classList.contains("is-active")'),true);
 assert.equal(game.run('els.playerDamageText.textContent'),'−32');
 assert.equal(game.run('els.typingMissEffect.classList.contains("is-active")'),false);
 assert.equal(game.run('els.player.classList.contains("is-guard-hit")'),false);
 game.advance(650);assert.equal(game.run('els.playerDamageText.textContent'),'');assert.equal(game.run('els.playerDamageEffect.classList.contains("is-active")'),false);
});
test('just guard keeps its burst visible for 720ms and uses a blue damage amount without a red flash',()=>{
 const game=battle();const hp=game.run('state.hp');game.run('beginPlayerGuard("keyboard")');assert.equal(game.run('els.player.classList.contains("is-guard-hit")'),false);
 game.run('incoming()');assert.equal(game.run('state.hp'),hp-8);
 assert.equal(game.run('els.player.classList.contains("is-guard-hit")'),true);
 assert.equal(game.run('els.player.classList.contains("is-chip-hit")'),true);
 assert.equal(game.run('els.playerDamageText.textContent'),'−8');
 assert.equal(game.run('els.playerDamageEffect.classList.contains("is-active")'),false);
 assert.equal(game.run('els.typingMissEffect.classList.contains("is-active")'),false);
 assert.equal(game.run('els.player.classList.contains("is-just-guard-hit")'),true);
 game.advance(719);assert.equal(game.run('els.player.classList.contains("is-guard-hit")'),true);
 game.advance(1);assert.equal(game.run('els.player.classList.contains("is-guard-hit")'),false);
 assert.equal(game.run('els.player.classList.contains("is-just-guard-hit")'),false);
 game.run('incoming()');assert.equal(game.run('els.player.classList.contains("is-just-guard-hit")'),false);
 game.advance(479);assert.equal(game.run('els.player.classList.contains("is-guard-hit")'),true);
 game.advance(1);assert.equal(game.run('els.player.classList.contains("is-guard-hit")'),false);
});
test('typing errors shake only the input area and never show damage or change HP',()=>{
 const game=battle();const hp=game.run('state.hp');game.run('enemy.word=enemy.matchedWord="neko";enemy.inputs=["neko"];applyTypedValue(enemy,"z")');
 assert.equal(game.run('state.hp'),hp);assert.equal(game.run('els.typingStatus.classList.contains("typing-miss-shake")'),true);
 assert.equal(game.run('els.arena.classList.contains("typing-miss-shake")'),false);
 assert.equal(game.run('els.typingMissEffect.classList.contains("is-active")'),true);
 assert.equal(game.run('els.playerDamageEffect.classList.contains("is-active")'),false);
 assert.equal(game.run('els.playerDamageText.textContent'),'');
});
test('repeated impacts restart feedback and leaving battle cancels all old effects',()=>{
 const game=battle();game.run('incoming()');game.advance(360);game.run('incoming()');game.advance(290);
 assert.equal(game.run('els.playerDamageText.textContent'),'−32');
 game.run('showStageSelect()');game.advance(1000);
 assert.equal(game.run('els.playerDamageText.textContent'),'');
 assert.equal(game.run('els.playerDamageEffect.classList.contains("is-active")'),false);
 assert.equal(game.run('els.player.classList.contains("is-damaged")'),false);
});
