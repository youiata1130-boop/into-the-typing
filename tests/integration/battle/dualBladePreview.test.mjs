import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../../helpers/game.mjs';
function battle(weaponId='dualBlades',touch=false){
 const game=createGame({'into-the-typing.player.v2':JSON.stringify({version:2,totalExperience:1750,stats:{attack:3,agility:2},weaponId,introCompleted:true,equipmentTutorialCompleted:true,ironSwordObtained:true,greatswordObtained:true,dualBladesObtained:true,swordShieldObtained:true,skillTutorialCompleted:true,clearedStages:['forest_path','mist_road','sky_castle','storm_cove','grassland_path','flower_meadow','swarm_meadow']})},{touch});
 game.run('startGame("mushroom_forest");const enemy=getCurrentEnemy()');game.advance(850);return game;
}
for(const touch of [false,true])test((touch?'touch':'keyboard')+' dual preview stays stable and becomes the next word through cooldown',()=>{
 const game=battle('dualBlades',touch);
 game.run('const preview=getDualBladePreviewWord();const expectedInput=getWordInputs(preview)[0];const before=els.nextWordTarget.textContent;applyTypedValue(enemy,enemy.matchedWord[0])');
 assert.equal(game.run('els.nextWordPreview.hidden'),false);
 assert.equal(game.run('els.nextWordTarget.textContent === before'),true);
 if(touch)assert.equal(game.run('els.nextWordTarget.textContent'),game.run('window.JAPANESE_INPUT.parse(preview.text,preview.reading||"").reading'));
 else assert.equal(game.run('els.nextWordTarget.textContent'),game.run('expectedInput'));
 game.run('applyTypedValue(enemy,enemy.matchedWord)');game.advance(110);
 assert.equal(game.run('enemy.word===preview.text'),true);
 assert.equal(game.run('els.nextWordTranslation.textContent'),game.run('preview.translation'));
 game.advance(200);assert.equal(game.run('enemy.matchedWord===expectedInput'),true);
 assert.equal(game.run('enemy.typed'),'');
});
test('dual preview carries across a kill into the next spawned enemy',()=>{
 const game=battle();game.run('enemy.hp=1;updateHud();const next=getDualBladePreviewWord();applyTypedValue(enemy,enemy.matchedWord)');game.advance(1500);
 assert.equal(game.run('getCurrentEnemy().id===enemy.id'),false);
 assert.equal(game.run('getCurrentEnemy().word===next.text'),true);
});
test('a lethal hit previews the already spawned successor rather than rerolling it',()=>{
 const game=battle();game.run('addEnemyToWave(chooseEnemyWave(),1);const following=state.activeEnemies[1];enemy.hp=1;updateHud();const next=getDualBladePreviewWord();applyTypedValue(enemy,enemy.matchedWord)');game.advance(200);
 assert.equal(game.run('getCurrentEnemy()===following'),true);
 assert.equal(game.run('next.text===following.word'),true);
});
test('the last lethal hit has no preview and leaving or changing weapons hides it',()=>{
 const game=battle();game.run('state.cleared=state.roundLimit-1;enemy.hp=1;updateHud()');assert.equal(game.run('els.nextWordPreview.hidden'),true);
 game.run('showStageSelect()');assert.equal(game.run('els.nextWordPreview.hidden'),true);assert.equal(game.run('state.dualNextSpawnWord'),null);
 for(const weapon of ['branch','sword','swordShield','greatsword']){const other=battle(weapon);assert.equal(other.run('els.nextWordPreview.hidden'),true);assert.equal(other.run('getCurrentEnemy().nextWordPreview'),null);}
});
