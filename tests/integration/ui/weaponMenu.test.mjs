import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../../helpers/game.mjs';
const progress={version:2,totalExperience:1750,stats:{attack:7,agility:3},weaponId:'sword',introCompleted:true,equipmentTutorialCompleted:true,ironSwordObtained:true,greatswordObtained:true,dualBladesObtained:true,swordShieldObtained:true,skillTutorialCompleted:true,clearedStages:['forest_path','mist_road','sky_castle','storm_cove','grassland_path','flower_meadow','swarm_meadow','mushroom_forest','spore_path','fairy_forest']};
const saved=extra=>({'into-the-typing.player.v2':JSON.stringify({...progress,...extra})});
test('browsing changes the image and features while only the equip button changes and saves equipment',()=>{
 const game=createGame(saved());game.run('showWeaponScreen()');const before=game.savedProgress();
 game.run('previewWeapon("dualBlades")');assert.equal(game.run('state.weaponId'),'sword');assert.deepEqual(game.savedProgress(),before);
 assert.equal(game.run('els.weaponPreviewName.textContent'),'双剣');assert.match(game.run('els.weaponPreviewImage.getAttribute("src")'),/dual_blades/);
 assert.ok(game.snapshot('weaponFeatures.dualBlades').some(text=>text.includes('次の単語を予告')));
 assert.equal(game.run('els.weaponEquipButton.disabled'),false);game.run('els.weaponEquipButton.dispatchEvent({type:"click"})');
 assert.equal(game.savedProgress().weaponId,'dualBlades');assert.equal(game.run('els.weaponEquipButton.textContent'),'装備中');assert.equal(game.run('els.weaponEquipButton.disabled'),true);
 game.run('previewWeapon("greatsword");showHomeScreen();showWeaponScreen()');assert.equal(game.run('weaponMenuState.selectedId'),'dualBlades');
});
test('reward guidance is not completed by previewing and advances only after equipping',()=>{
 const game=createGame(saved({weaponId:'greatsword',swordShieldEquipPending:true}));game.run('showWeaponScreen();previewWeapon("swordShield")');
 assert.equal(game.savedProgress().weaponId,'greatsword');assert.equal(game.savedProgress().swordShieldEquipPending,true);assert.equal(game.run('els.weaponEquipNext.disabled'),true);
 game.run('equipPreviewedWeapon()');assert.equal(game.savedProgress().swordShieldEquipPending,false);assert.equal(game.run('els.weaponEquipNext.disabled'),false);
});
test('unowned weapons cannot be previewed or equipped through stale selection',()=>{
 const game=createGame(saved({greatswordObtained:false,dualBladesObtained:false,swordShieldObtained:false,clearedStages:['forest_path']}));
 game.run('showWeaponScreen();previewWeapon("dualBlades")');assert.equal(game.run('weaponMenuState.selectedId'),'sword');
 game.run('weaponMenuState.selectedId="dualBlades";equipPreviewedWeapon()');assert.equal(game.savedProgress().weaponId,'sword');
});
function manualGame(){const game=createGame(saved(),{loadImages:false,preloadStages:false});game.run('window.testImages.forEach(image=>image.succeed())');game.run('activatePlayerSave(0,getSaveEntry(0));assetLoadingState.images.set(new URL("src/assets/images/backgrounds/status/base_interior.webp",document.baseURI).href,{});showWeaponScreen()');return game;}
test('slow earlier image downloads cannot replace the latest weapon preview',()=>{
 const game=manualGame();game.run('const old=window.testImages.at(-1);previewWeapon("greatsword");const latest=window.testImages.at(-1);latest.succeed()');
 assert.match(game.run('els.weaponPreviewImage.getAttribute("src")'),/greatsword/);game.run('old.succeed()');assert.match(game.run('els.weaponPreviewImage.getAttribute("src")'),/greatsword/);
});
test('preview image errors can retry without equipping the weapon',()=>{
 const game=manualGame();game.run('window.testImages.at(-1).fail()');assert.equal(game.run('els.weaponPreviewRetry.hidden'),false);
 game.run('els.weaponPreviewRetry.dispatchEvent({type:"click"});window.testImages.at(-1).succeed()');assert.equal(game.run('els.weaponPreviewImage.hidden'),false);assert.equal(game.run('els.weaponPreviewStatus.hidden'),true);assert.equal(game.savedProgress().weaponId,'sword');
});
