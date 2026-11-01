import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createGame } from '../../helpers/game.mjs';

const cleared = ['forest_path','mist_road','sky_castle','storm_cove','grassland_path','flower_meadow',
  'swarm_meadow','mushroom_forest','spore_path','fairy_forest','thorn_depths','mountain_path'];
function battle({ touch = false, unlocked = true, weaponId = 'swordShield', wait = true } = {}) {
  const game = createGame({ 'into-the-typing.player.v2': JSON.stringify({ version: 2, totalExperience: 3310,
    stats: { attack: 7, agility: 3 }, weaponId, introCompleted: true, equipmentTutorialCompleted: true,
    ironSwordObtained: true, greatswordObtained: true, dualBladesObtained: true, swordShieldObtained: true,
    skillTutorialCompleted: true, clearedStages: unlocked ? cleared : cleared.slice(0, -1) }) }, { touch });
  game.run(`startGame('vine_pass');const shift=(extra={})=>handleTypingKeydown({key:'Shift',code:'ShiftLeft',preventDefault(){},...extra});`);
  if (wait) game.advance(game.run('startNoticeMs'));
  return game;
}

test('4-2 unlocks after 4-1 and starts with left tentacle, body, right tentacle selected from the left', () => {
  assert.equal(battle({ unlocked: false }).run('state.running'), false);
  const game = battle({ wait: false });
  assert.equal(game.run('getStageDefinition("mountain_path").nextStageId'), 'vine_pass');
  assert.deepEqual(game.snapshot('state.activeEnemies.map(e=>[e.type,e.hp,e.slot])'), [
    ['octopus_plant_left',30,0],['octopus_plant_body',60,1],['octopus_plant_right',30,2]]);
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  assert.equal(game.run('state.activeEnemies.filter(e=>e.element.classList.contains("is-targeted")).length'), 1);
  assert.equal(game.run('els.remainingWord.textContent'), '');
  game.run('shift();state.activeEnemies[2].selectButton.dispatchEvent({type:"click"})');
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  const images = game.snapshot('collectStageImageSources("vine_pass")');
  assert.ok(images.some(src=>src.includes('/octopus_plant/parts.webp')));
  for (const src of images) assert.ok(existsSync(new URL(src).pathname.slice(1)), src);
});

test('either Shift moves one step right, wraps, and ignores repeat and modified shortcuts', () => {
  const game = battle();
  game.run('shift();shift({repeat:true});shift({ctrlKey:true});shift({altKey:true});shift({metaKey:true})');
  assert.equal(game.run('getSelectedEnemy().slot'), 1);
  game.run('shift({code:"ShiftRight"})');
  assert.equal(game.run('getSelectedEnemy().slot'), 2);
  game.run('shift()');
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  assert.equal(game.run('getSelectedEnemy().selectButton.getAttribute("aria-pressed")'), 'true');
});

test('switching preserves each partial answer and never redirects an attack during recovery', () => {
  const game = battle();
  game.run(`const [left,body,right]=state.activeEnemies;applyTypedValue(left,left.matchedWord[0]);
    const partial=left.typed;shift();applyTypedValue(body,body.matchedWord[0]);shift();shift();`);
  assert.equal(game.run('getInputEnemy()===left'), true);
  assert.equal(game.run('els.typedWord.textContent'), game.run('partial'));
  assert.equal(game.run('body.typed.length'), 1);
  game.run('applyTypedValue(left,left.matchedWord);shift()');
  assert.equal(game.run('getSelectedEnemy()===body'), true);
  assert.equal(game.run('getInputEnemy()'), null);
  game.advance(2000);
  assert.equal(game.run('getInputEnemy()===body'), true);
  assert.equal(game.run('body.hp'), 60);
  assert.equal(game.run('right.hp'), 30);
  assert.equal(game.run('body.typed.length'), 1);
});

test('a resolving selected part cannot silently redirect typing to another part', () => {
  const game = battle();
  game.run('getSelectedEnemy().resolving=true');
  assert.equal(game.run('getInputEnemy()'), null);
  game.run('shift()');
  assert.equal(game.run('getInputEnemy().slot'), 1);
});

test('defeated parts are skipped; defeating the body alone does not clear the stage', () => {
  const game = battle();
  game.run('shift();const body=getSelectedEnemy();body.hp=0;defeatEnemy(body)');
  assert.equal(game.run('getSelectedEnemy().slot'), 2);
  assert.equal(game.run('state.running'), true);
  game.run('shift();shift()');
  assert.equal(game.run('getSelectedEnemy().slot'), 2);
  game.run('getSelectedEnemy().hp=0;defeatEnemy(getSelectedEnemy())');
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  game.run('shift()');
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  game.run('getSelectedEnemy().hp=0;defeatEnemy(getSelectedEnemy())');
  game.advance(1200);
  assert.equal(game.run('state.running'), false);
  assert.equal(game.run('state.cleared'), 3);
  assert.equal(game.savedProgress().totalExperience, 3750);
  assert.ok(game.savedProgress().clearedStages.includes('vine_pass'));
  game.run('finishGame(true)');
  assert.equal(game.savedProgress().totalExperience, 3750);
});

test('restarting selects the left part again and cancels old spawns and rewards', () => {
  const game = battle();
  game.run('getSelectedEnemy().hp=0;defeatEnemy(getSelectedEnemy());startGame("vine_pass")');
  game.advance(3000);
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  assert.equal(game.run('state.activeEnemies.length'), 3);
  assert.equal(game.run('state.pendingExperience'), 0);
  assert.equal(game.savedProgress().totalExperience, 3310);
});

test('touch selection restores pending kana and rejects a gesture belonging to the old target', () => {
  const game = battle({ touch: true });
  game.run(`const [left,body,right]=state.activeEnemies;
    left.word=left.matchedWord='gakkou';left.inputs=['gakkou'];left.translation='学校';left.readingOverride='がっこう';left.inputRevision++;
    renderWord();const oldKey=flickPromptKey();applyGameFlickKey('ka');body.selectButton.dispatchEvent({type:'click'});`);
  assert.equal(game.run('getSelectedEnemy()===body'), true);
  assert.equal(game.run('applyGameFlickKey("ka",0,oldKey)'), false);
  game.run('left.selectButton.dispatchEvent({type:"click"})');
  assert.equal(game.run('els.flickInput.value'), 'か');
  assert.equal(game.run('flickState.lastPending'), true);
  game.run('applyGameFlickKey("modifier")');
  assert.equal(game.run('els.flickInput.value'), 'が');
  assert.equal(game.run('left.typed'), 'ga');
  assert.equal(game.run('body.typed'), '');
});

test('selection is disabled during guard, skill, after exit and in earlier stages', () => {
  const game = battle();
  game.run('beginPlayerGuard("keyboard");shift()');
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  game.run('state.guarding=false;state.specialInProgress=true;shift()');
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  game.run('state.specialInProgress=false;showStageSelect();shift()');
  assert.equal(game.run('state.running'), false);
  game.run('startGame("mountain_path")');game.advance(850);
  assert.equal(game.run('allowsEnemySelection()'), false);
  assert.equal(game.run('getCurrentEnemy().selectButton.hidden'), true);
});

test('finishing a flick attack does not erase the partial kana of the next selected part', () => {
  const game = battle({ touch: true });
  game.run(`const [left,body]=state.activeEnemies;
    left.word=left.matchedWord='a';left.inputs=['a'];left.translation='あ';left.readingOverride='あ';left.hp=1;left.inputRevision++;
    body.word=body.matchedWord='gakkou';body.inputs=['gakkou'];body.translation='学校';body.readingOverride='がっこう';body.inputRevision++;
    renderWord();selectBattleEnemy(body);applyGameFlickKey('ka');selectBattleEnemy(left);applyGameFlickKey('a');`);
  game.advance(2000);
  assert.equal(game.run('getSelectedEnemy()===body'), true);
  assert.equal(game.run('els.flickInput.value'), 'か');
  assert.equal(game.run('flickState.lastPending'), true);
  game.run('applyGameFlickKey("modifier")');
  assert.equal(game.run('body.typed'), 'ga');
});

test('dual blade preview follows the rightward target order after a lethal hit', () => {
  const game = battle({ weaponId: 'dualBlades' });
  game.run('shift();getSelectedEnemy().hp=1;renderWord()');
  assert.equal(game.run('getDualBladePreviewWord().text'), game.run('state.activeEnemies[2].word'));
  game.run('applyTypedValue(getInputEnemy(),getInputEnemy().matchedWord)');
  game.advance(500);
  assert.equal(game.run('getSelectedEnemy().slot'), 2);
});

test('all three plant parts approach and attack, and all-target skills can clear them together', () => {
  const game = battle({ weaponId: 'greatsword' });
  game.advance(25000);game.run('enemyLoop(performance.now())');
  assert.ok(game.run('state.activeEnemies.every(e=>e.atBase)'));
  assert.ok(game.run('state.hp<getMaxHp()'));
  game.advance(1000);game.run('state.activeEnemies.forEach(e=>{e.hp=1;e.resolving=false});state.specialGauge=100;useSpecialMove()');
  game.advance(1500);
  assert.equal(game.run('state.cleared'), 3);
  assert.equal(game.savedProgress().totalExperience, 3750);
});
