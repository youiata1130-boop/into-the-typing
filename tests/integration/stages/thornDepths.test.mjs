import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createGame } from "../../helpers/game.mjs";
const cleared = ["forest_path", "mist_road", "sky_castle", "storm_cove", "grassland_path", "flower_meadow", "swarm_meadow", "mushroom_forest", "spore_path", "fairy_forest"];
function battle({ touch = false, attack = 7, agility = 3, seed = 1, unlocked = true } = {}) {
 const game = createGame({"into-the-typing.player.v2":JSON.stringify({version:2,totalExperience:1750,stats:{attack,agility},weaponId:"swordShield",introCompleted:true,equipmentTutorialCompleted:true,ironSwordObtained:true,greatswordObtained:true,dualBladesObtained:true,swordShieldObtained:true,skillTutorialCompleted:true,clearedStages:unlocked?cleared:cleared.slice(0,-1)})},{touch});
 game.run(`let seed=${seed};Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);startGame('thorn_depths')`);return game;
}
function simulate(game, pace, touch) {
 game.run('let nextKey=850;let guards=0;let skills=0;const seen=new Set()');
 for(let time=0;time<180000&&game.run('state.running');time+=20){game.advance(20);game.run(`{
 enemyLoop(performance.now());const e=getCurrentEnemy();if(e)seen.add(e.type);
 if(state.guarding&&(!e||e.chargeElapsedMs===0))endPlayerGuard('keyboard');
 if(e&&!e.resolving&&e.chargeDurationMs-e.chargeElapsedMs<=180&&!state.guarding&&beginPlayerGuard('keyboard'))guards++;
 if(state.specialGauge===100&&useSpecialMove())skills++;
 const input=getInputEnemy();if(input&&performance.now()>=nextKey){${touch?"const reading=getFlickReading(input).reading;els.flickInput.value=reading.slice(0,els.flickInput.value.length+1);handleFlickInput({isComposing:false});":"handleTypingKeydown({key:input.matchedWord[input.typed.length],code:'',preventDefault(){}});"}nextKey=performance.now()+${pace};}
 }`)}
}
test("3-4 unlocks only after 3-3 and keeps boss art scoped to its stage",()=>{
 const locked=battle({unlocked:false});assert.equal(locked.run('state.running'),false);
 const game=battle();assert.equal(game.run('state.stageId'),'thorn_depths');assert.equal(game.run('state.roundLimit'),5);
 assert.equal(game.run('getStageDefinition("fairy_forest").nextStageId'),'thorn_depths');
 const urls=game.snapshot('collectStageImageSources("thorn_depths")');
 for(const pose of ['idle','windup']){const path='src/assets/images/enemies/thorn_stag/boss/'+pose+'/frame_01.webp';assert.ok(existsSync(path));assert.ok(urls.some(src=>src.includes(path)));}
 assert.ok(!game.snapshot('collectStageImageSources("fairy_forest")').some(src=>src.includes('/thorn_stag/')));
});
test("the stag telegraphs its randomized attack and guarding still deals quarter damage",()=>{
 const game=battle();game.run('clearEnemies();state.currentWaveIndex=2;state.currentWaveSpawned=0;spawnNextEnemy();const stag=getCurrentEnemy()');game.advance(1600);
 assert.equal(game.run('els.bossIntroTitle.textContent'),'荊冠の魔鹿');assert.equal(game.run('stag.hp'),144);
 assert.ok(game.run('stag.chargeDurationMs>=1980&&stag.chargeDurationMs<=2420'));
 game.run('stag.chargeElapsedMs=stag.chargeDurationMs*.75;updateEnemyCharge(stag)');assert.match(game.run('stag.image.src'),/windup/);
 const hp=game.run('state.hp');game.run('stag.attackPower={min:70,max:70};beginPlayerGuard("keyboard");stag.chargeElapsedMs=stag.chargeDurationMs;enemyAttack(stag)');assert.equal(game.run('state.hp'),hp-18);
 assert.equal(game.run('stag.element.dataset.chargePhase'),'attack');assert.equal(game.run('stag.chargeElapsedMs'),0);
});
for(const touch of [false,true])test('expert '+(touch?'touch':'keyboard')+' play can clear 3-4 and save 1100 EXP once',()=>{
 for(const seed of [1,12,33]){const game=battle({touch,seed});simulate(game,touch?200:120,touch);
 assert.equal(game.run('state.cleared'),5);assert.ok(game.run('state.hp')>0);assert.ok(game.run('guards')>0);assert.ok(game.run('skills')>0);
 assert.deepEqual(game.snapshot('[...seen]'),['mushroom_level_1','tree_fairy_boss','thorn_stag_boss']);assert.equal(game.savedProgress().totalExperience,2850);
 game.run('finishGame(true);continueAfterResult()');assert.equal(game.savedProgress().totalExperience,2850);assert.equal(game.run('document.documentElement.dataset.screen'),'battle');assert.equal(game.run('state.stageId'),'mountain_path');
 assert.ok(createGame(game.saved()).savedProgress().clearedStages.includes('thorn_depths'));}
});
test("slower play with unspent upgrades loses without saving partial rewards",()=>{
 const game=battle({attack:3,agility:2});simulate(game,400,false);assert.equal(game.run('state.hp'),0);assert.ok(game.run('state.cleared')<5);assert.equal(game.savedProgress().totalExperience,1750);assert.ok(!game.savedProgress().clearedStages.includes('thorn_depths'));
});
