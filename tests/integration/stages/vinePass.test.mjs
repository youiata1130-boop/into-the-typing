import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createGame } from '../../helpers/game.mjs';

const cleared = ['forest_path','mist_road','sky_castle','storm_cove','grassland_path','flower_meadow',
  'swarm_meadow','mushroom_forest','spore_path','fairy_forest','thorn_depths'];
function battle({ touch = false, unlocked = true, weaponId = 'swordShield', wait = true, opening = false } = {}) {
  const game = createGame({ 'into-the-typing.player.v2': JSON.stringify({ version: 2, totalExperience: 3310,
    stats: { attack: 7, agility: 3 }, weaponId, introCompleted: true, equipmentTutorialCompleted: true,
    ironSwordObtained: true, greatswordObtained: true, dualBladesObtained: true, swordShieldObtained: true,
    skillTutorialCompleted: true, clearedStages: unlocked ? cleared : cleared.slice(0, -1) }) }, { touch });
  game.run(`startGame('vine_pass');const shift=(extra={})=>handleTypingKeydown({key:'Shift',code:'ShiftLeft',preventDefault(){},...extra});`);
  if (wait) game.advance(game.run('startNoticeMs'));
  if (unlocked && !opening) {
    if (!wait) game.advance(game.run('startNoticeMs'));
    game.run('shift();[...state.activeEnemies].reverse().forEach(enemy=>{enemy.hp=0;defeatEnemy(enemy)})');
    game.advance(1000);
  }
  return game;
}

test('4-1 unlocks after 3-4 and reaches two tentacles then the body after the opening pair', () => {
  assert.equal(battle({ unlocked: false }).run('state.running'), false);
  const game = battle();
  assert.equal(game.run('getStageDefinition("thorn_depths").nextStageId'), 'vine_pass');
  assert.deepEqual(game.snapshot('state.activeEnemies.map(e=>[e.type,e.hp,e.slot])'), [
    ['octopus_plant_left',8,0],['octopus_plant_right',8,1],['octopus_plant_body',60,2]]);
  assert.deepEqual(game.snapshot('state.activeEnemies.map(e=>e.name)'), ['左の触手','中央の触手','タコツル草の本体']);
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  assert.equal(game.run('state.activeEnemies.filter(e=>e.element.classList.contains("is-targeted")).length'), 1);
  assert.equal(game.run('state.cleared'), 2);
  assert.equal(game.run('targetTutorialUi.panel.hidden'), true);
  const images = game.snapshot('collectStageImageSources("vine_pass")');
  assert.ok(images.some(src=>src.includes('/octopus_plant/tentacle-left-v2.webp')));
  assert.ok(images.some(src=>src.includes('/octopus_plant/body-left-v2.webp')));
  for (const src of images) assert.ok(existsSync(new URL(src).pathname.slice(1)), src);
});

test('the opening explains Shift, shows the durable enemy on the left, and safely waits for selection', () => {
  const game = battle({ opening: true, wait: false });
  assert.deepEqual(game.snapshot('state.activeEnemies.map(e=>[e.type,e.hp,e.attackPower.min,e.slot])'),
    [['mountain_guard',96,6,0],['mountain_raider',24,34,1]]);
  assert.equal(game.run('state.roundLimit'), 5);
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  assert.match(game.run('targetTutorialUi.text.textContent'), /Shiftキー.*左は体力が多く、右は攻撃力が高い.*右の敵を選び/);
  game.run('shift()');
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  game.advance(60000);
  game.run(`enemyLoop(performance.now());handleTypingKeydown({key:'a',code:'KeyA',preventDefault(){}});
    applyTypedValue(getCurrentEnemy(),getCurrentEnemy().matchedWord);state.specialGauge=100;`);
  assert.equal(game.run('getInputEnemy()'), null);
  assert.equal(game.run('state.inputBuffer.length'), 0);
  assert.deepEqual(game.snapshot('state.activeEnemies.map(e=>[e.hp,e.progress,e.typed])'), [[96,0,''],[24,0,'']]);
  assert.equal(game.run('state.hp'), game.run('getMaxHp()'));
  assert.equal(game.run('beginPlayerGuard("keyboard")'), false);
  assert.equal(game.run('useSpecialMove()'), false);
  assert.equal(game.run('state.specialGauge'), 100);
});

for (const touch of [false,true]) test(`${touch ? 'touch' : 'Shift'} selects the right enemy, defeats it first and releases the left enemy`, () => {
  const game = battle({ opening: true, touch });
  if (touch) assert.match(game.run('targetTutorialUi.text.textContent'), /タップ/);
  game.run(`const [guard,raider]=state.activeEnemies;const prompt=guard.word;
    ${touch ? 'raider.selectButton.dispatchEvent({type:"click"})' : 'shift()'};`);
  assert.equal(game.run('getSelectedEnemy()===raider'), true);
  assert.equal(game.run('raider.word'), game.run('prompt'));
  assert.equal(game.run('getTargetTutorialPhase()'), 'attack');
  assert.equal(game.run('getInputEnemy()===raider'), true);
  game.run('shift();guard.selectButton.dispatchEvent({type:"click"});damageEnemy(guard);applyTypedValue(guard,guard.matchedWord)');
  assert.equal(game.run('getSelectedEnemy()===raider'), true);
  assert.equal(game.run('guard.hp'), 96);
  const hp = game.run('state.hp');
  game.advance(16000);
  game.run('enemyLoop(performance.now())');
  assert.equal(game.run('guard.progress'), 0);
  assert.ok(game.run('state.hp') < hp);
  for (let hit=0;hit<10 && game.run('isEnemyAlive(raider)');hit++) {
    if (touch) game.run('els.flickInput.value=getFlickReading(raider).reading;handleFlickInput({isComposing:false})');
    else game.run('applyTypedValue(raider,raider.matchedWord)');
    game.advance(1000);
  }
  assert.equal(game.run('raider.experienceCounted'), true);
  assert.equal(game.run('getSelectedEnemy()===guard'), true);
  assert.equal(game.run('targetTutorialUi.panel.hidden'), true);
  assert.equal(game.run('state.cleared'), 1);
  assert.equal(game.run('state.pendingExperience'), 60);
  assert.equal(game.savedProgress().totalExperience, 3310);
  game.advance(1000);game.run('enemyLoop(performance.now())');
  assert.ok(game.run('guard.progress') > 0);
  game.run('guard.hp=0;defeatEnemy(guard)');game.advance(1000);
  assert.deepEqual(game.snapshot('state.activeEnemies.map(e=>e.type)'),
    ['octopus_plant_left','octopus_plant_right','octopus_plant_body']);
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  assert.equal(game.run('state.cleared'), 2);
  assert.equal(game.run('state.pendingExperience'), 140);
  assert.equal(game.run('targetTutorialUi.panel.hidden'), true);
});

test('restarting or leaving the lesson discards its selection, inputs and pending rewards', () => {
  const game = battle({ opening: true });
  game.run('shift();applyTypedValue(getInputEnemy(),getInputEnemy().matchedWord);startGame("vine_pass")');
  game.advance(2000);
  assert.equal(game.run('getTargetTutorialPhase()'), 'select');
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  assert.deepEqual(game.snapshot('state.activeEnemies.map(e=>e.hp)'), [96,24]);
  assert.equal(game.run('state.pendingExperience'), 0);
  game.run('shift();getSelectedEnemy().hp=0;defeatEnemy(getSelectedEnemy());showStageSelect()');
  game.advance(2000);
  assert.equal(game.run('targetTutorialUi.panel.hidden'), true);
  assert.equal(game.run('getTargetTutorialPhase()'), '');
  assert.equal(game.run('state.activeEnemies.length'), 0);
  assert.equal(game.savedProgress().totalExperience, 3310);
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

for (const weaponId of ['sword','swordShield','greatsword','dualBlades']) {
  for (const touch of [false,true]) test(`${weaponId}/${touch ? 'touch' : 'keyboard'}: target changes preserve the prompt without choosing new words`, () => {
    const game = battle({ weaponId, touch });
    const prompt = () => game.snapshot(`({word:getCurrentEnemy().word,inputs:getCurrentEnemy().inputs,
      reading:getCurrentEnemy().readingOverride,translation:els.wordTranslation.textContent,
      typed:els.typedWord.textContent,remaining:els.remainingWord.textContent})`);
    const before = prompt();
    const used = game.snapshot('state.usedWords');
    for (const [action, slot] of [['shift()',1], ['shift({code:"ShiftRight"})',2],
      ['shift()',0], ['state.activeEnemies[2].selectButton.dispatchEvent({type:"click"})',2]]) {
      game.run(action);
      assert.equal(game.run('getSelectedEnemy().slot'), slot);
      assert.deepEqual(prompt(), before);
      assert.deepEqual(game.snapshot('state.usedWords'), used);
    }
    assert.deepEqual(game.snapshot('state.activeEnemies.map(e=>e.hp)'), [8,8,60]);
  });

  test(`${weaponId}: input locks every selection method until the attack produces a fresh prompt`, () => {
    const game = battle({ weaponId });
    game.run(`const [left,middle,body]=state.activeEnemies;left.hp=999;
      applyTypedValue(left,left.matchedWord[0]);const partial=left.typed;
      shift();shift({code:'ShiftRight'});body.selectButton.dispatchEvent({type:'click'});`);
    assert.equal(game.run('getSelectedEnemy()===left'), true);
    assert.equal(game.run('els.typedWord.textContent'), game.run('partial'));
    assert.equal(game.run('selectBattleEnemy(middle)'), false);
    assert.equal(game.run('state.activeEnemies.every(e=>e.selectButton.disabled)'), true);
    game.run('applyTypedValue(left,"");shift()');
    assert.equal(game.run('getSelectedEnemy()===left'), true);
    game.run('applyTypedValue(left,left.matchedWord);shift()');
    assert.equal(game.run('getSelectedEnemy()===left'), true);
    assert.equal(game.run('getInputEnemy()'), null);
    assert.ok(game.run('left.hp < 999'));
    game.advance(2000);
    assert.equal(game.run('left.inputStarted'), false);
    assert.equal(game.run('state.activeEnemies.some(e=>e.selectButton.disabled)'), false);
    const next = game.run('els.remainingWord.textContent');
    game.run('shift()');
    assert.equal(game.run('getSelectedEnemy()===middle'), true);
    assert.equal(game.run('els.remainingWord.textContent'), next);
    assert.equal(game.run('body.hp'), 60);
    assert.equal(game.run('middle.hp'), 8);
    assert.equal(game.run('middle.typed'), '');
  });
}

test('even an initial typo locks the selected target until that prompt is answered', () => {
  const game = battle();
  game.run(`const first=getSelectedEnemy();const wrong='abcdefghijklmnopqrstuvwxyz'.split('').find(letter=>
    !first.inputs.some(input=>input.startsWith(letter)));applyTypedValue(first,wrong);shift();`);
  assert.equal(game.run('getSelectedEnemy()===first'), true);
  assert.equal(game.run('first.typed'), '');
  assert.equal(game.run('first.inputStarted'), true);
});

test('a resolving selected part cannot silently redirect typing to another part', () => {
  const game = battle();
  game.run('getSelectedEnemy().resolving=true');
  assert.equal(game.run('getInputEnemy()'), null);
  game.run('shift()');
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  assert.equal(game.run('getInputEnemy()'), null);
});

test('defeating the body stops all tentacles and awards the stage only once', () => {
  const game = battle();
  game.run('shift();shift();const body=getSelectedEnemy();body.hp=0;defeatEnemy(body)');
  assert.equal(game.run('getSelectedEnemy()'), null);
  assert.equal(game.run('state.running'), true);
  assert.equal(game.run('state.activeEnemies.every(e=>e.hp===0 && e.experienceCounted)'), true);
  game.run('shift();state.activeEnemies.forEach(defeatEnemy)');
  game.advance(1200);
  assert.equal(game.run('state.running'), false);
  assert.equal(game.run('state.cleared'), 5);
  assert.equal(game.savedProgress().totalExperience, 3890);
  assert.ok(game.savedProgress().clearedStages.includes('vine_pass'));
  game.run('finishGame(true)');
  assert.equal(game.savedProgress().totalExperience, 3890);
});

test('restarting selects the left part again and cancels old spawns and rewards', () => {
  const game = battle();
  game.run('getSelectedEnemy().hp=0;defeatEnemy(getSelectedEnemy());startGame("vine_pass")');
  game.advance(3000);
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  assert.equal(game.run('state.activeEnemies.length'), 2);
  assert.equal(game.run('getTargetTutorialPhase()'), 'select');
  assert.equal(game.run('state.pendingExperience'), 0);
  assert.equal(game.savedProgress().totalExperience, 3310);
});

test('pending kana locks target selection before any roman letters are confirmed', () => {
  const game = battle({ touch: true });
  game.run(`const [left,middle,body]=state.activeEnemies;
    left.word=left.matchedWord='gakkou';left.inputs=['gakkou'];left.translation='学校';left.readingOverride='がっこう';left.inputRevision++;
    renderWord();applyGameFlickKey('ka');body.selectButton.dispatchEvent({type:'click'});shift();`);
  assert.equal(game.run('getSelectedEnemy()===left'), true);
  assert.equal(game.run('left.typed'), '');
  assert.equal(game.run('left.inputStarted'), true);
  assert.equal(game.run('els.flickInput.value'), 'か');
  assert.equal(game.run('flickState.lastPending'), true);
  game.run('applyGameFlickKey("modifier")');
  assert.equal(game.run('els.flickInput.value'), 'が');
  assert.equal(game.run('left.typed'), 'ga');
  assert.equal(game.run('body.typed'), '');
});

test('touch target changes invalidate old gestures while preserving the new target prompt', () => {
  const game = battle({ touch: true });
  game.run('const oldKey=flickPromptKey();const before=els.remainingWord.textContent;shift()');
  assert.equal(game.run('getSelectedEnemy().slot'), 1);
  assert.equal(game.run('els.remainingWord.textContent'), game.run('before'));
  assert.equal(game.run('applyGameFlickKey("ka",0,oldKey)'), false);
  assert.equal(game.run('getSelectedEnemy().inputStarted'), false);
  assert.equal(game.run('getSelectedEnemy().typed'), '');
});

test('an incorrect first kana also locks selection after the rejected text disappears', () => {
  const game = battle({ touch: true });
  game.run(`const first=getSelectedEnemy();first.word=first.matchedWord='gakkou';first.inputs=['gakkou'];
    first.translation='学校';first.readingOverride='がっこう';first.inputRevision++;renderWord();
    applyGameFlickKey('ma');shift();`);
  assert.equal(game.run('getSelectedEnemy()===first'), true);
  assert.equal(game.run('els.flickInput.value'), '');
  assert.equal(game.run('first.inputStarted'), true);
});

test('selection is disabled during guard, skill, after exit and in earlier stages', () => {
  const game = battle();
  game.run('beginPlayerGuard("keyboard");shift()');
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  game.run('state.guarding=false;state.specialInProgress=true;shift()');
  assert.equal(game.run('getSelectedEnemy().slot'), 0);
  game.run('state.specialInProgress=false;showStageSelect();shift()');
  assert.equal(game.run('state.running'), false);
  game.run('startGame("thorn_depths")');game.advance(850);
  assert.equal(game.run('allowsEnemySelection()'), false);
  assert.equal(game.run('getCurrentEnemy().selectButton.hidden'), true);
});

test('finishing a lethal flick attack unlocks selection on the next prompt', () => {
  const game = battle({ touch: true });
  game.run(`const [left,middle]=state.activeEnemies;
    left.word=left.matchedWord='a';left.inputs=['a'];left.translation='あ';left.readingOverride='あ';left.hp=1;left.inputRevision++;
    middle.word=middle.matchedWord='gakkou';middle.inputs=['gakkou'];middle.translation='学校';middle.readingOverride='がっこう';middle.inputRevision++;
    renderWord();applyGameFlickKey('a');shift();`);
  assert.equal(game.run('getSelectedEnemy()===left'), true);
  game.advance(2000);
  assert.equal(game.run('getSelectedEnemy()===middle'), true);
  assert.equal(game.run('els.flickInput.value'), '');
  assert.equal(game.run('getSelectedEnemy().inputStarted'), false);
  game.run('shift()');
  assert.equal(game.run('getSelectedEnemy().slot'), 2);
  assert.equal(game.run('els.remainingWord.textContent'), 'がっこう');
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
  assert.equal(game.run('state.cleared'), 5);
  assert.equal(game.savedProgress().totalExperience, 3890);
});

function advancePlant(game, ms) {
  game.advance(ms);
  game.run('enemyLoop(performance.now())');
}

test('fragile tentacles approach and repeat attacks faster than the body', () => {
  const game = battle();
  game.run('const [left,middle,body]=state.activeEnemies');
  assert.ok(game.run('left.hp <= body.hp / 5 && middle.hp === left.hp'));
  assert.ok(game.run('left.approachMs < body.approachMs / 2'));
  assert.equal(game.run('left.repeatAttackMs'), 2000);
  advancePlant(game, 10000);
  assert.equal(game.run('left.atBase && middle.atBase && !body.atBase'), true);
  const hp = game.run('state.hp');
  advancePlant(game, 3000);
  assert.ok(game.run('state.hp') < hp);
});

test('lethal typing wilts a tentacle in place without rewards, attacks or selection', () => {
  const game = battle();
  game.run('const [left,middle,body]=state.activeEnemies;applyTypedValue(left,left.matchedWord)');
  game.advance(1000);
  if (game.run('left.hp > 0')) {
    game.run('applyTypedValue(left,left.matchedWord)');game.advance(1000);
  }
  assert.equal(game.run('left.wilted && left.hp === 0 && left.resolving'), true);
  assert.equal(game.run('left.element.classList.contains("is-wilted")'), true);
  assert.equal(game.run('state.activeEnemies.includes(left)'), true);
  assert.equal(game.run('getSelectedEnemy()===middle'), true);
  assert.equal(game.run('left.selectButton.disabled'), true);
  assert.equal(game.run('selectBattleEnemy(left)'), false);
  assert.equal(game.run('state.cleared'), 2);
  assert.equal(game.run('state.pendingExperience'), 140);
  const hp = game.run('state.hp');
  game.run('enemyAttack(left);damageEnemy(left);applyTypedValue(left,left.matchedWord);defeatEnemy(left)');
  assert.equal(game.run('state.hp'), hp);
  assert.equal(game.run('body.wiltedTentacles.length'), 1);
  assert.equal(game.run('body.regrowthEl.hidden'), false);
  assert.equal(game.run('left.attackCountdownEl.hidden'), true);
});

test('regrowth follows knockdown order and needs a separate full charge for each tentacle', () => {
  const game = battle();
  game.run(`const [left,middle,body]=state.activeEnemies;
    middle.hp=0;defeatEnemy(middle);`);
  advancePlant(game, 2000);
  game.run('left.hp=0;defeatEnemy(left);defeatEnemy(middle)');
  assert.deepEqual(game.snapshot('body.wiltedTentacles.map(e=>e.slot)'), [1,0]);
  assert.equal(game.run('body.tentacleReviveElapsedMs'), 2000);
  advancePlant(game, 3999);
  assert.equal(game.run('left.wilted && middle.wilted'), true);
  advancePlant(game, 1);
  assert.equal(game.run('middle.hp'), 8);
  assert.equal(game.run('left.wilted && !middle.wilted'), true);
  assert.equal(game.run('body.tentacleReviveElapsedMs'), 0);
  advancePlant(game, 5999);
  assert.equal(game.run('left.wilted'), true);
  advancePlant(game, 1);
  assert.equal(game.run('left.hp'), 8);
  assert.equal(game.run('body.regrowthEl.hidden'), true);
  assert.equal(game.run('state.cleared'), 2);
  assert.equal(game.run('state.pendingExperience'), 140);
});

test('a delayed frame revives only one tentacle and does not retain excess charge', () => {
  const game = battle();
  game.run('const [left,middle,body]=state.activeEnemies;[left,middle].forEach(e=>{e.hp=0;defeatEnemy(e)})');
  advancePlant(game, 20000);
  assert.equal(game.run('!left.wilted && middle.wilted'), true);
  assert.equal(game.run('body.tentacleReviveElapsedMs'), 0);
  advancePlant(game, 5999);
  assert.equal(game.run('middle.wilted'), true);
  advancePlant(game, 1);
  assert.equal(game.run('middle.wilted'), false);
});

for (const touch of [false,true]) test(`regrowth preserves ${touch ? 'kana' : 'keyboard'} input and its target lock`, () => {
  const game = battle({ touch });
  game.run(`const [left,middle,body]=state.activeEnemies;left.hp=0;defeatEnemy(left);
    selectBattleEnemy(body);body.word=body.matchedWord='gakkou';body.inputs=['gakkou'];
    body.translation='学校';body.readingOverride='がっこう';body.inputRevision++;renderWord();
    ${touch ? "applyGameFlickKey('ka')" : "applyTypedValue(body,'g')"};
    const beforeWord=body.word,beforeInput=body.typed,beforeFlick=els.flickInput.value;`);
  advancePlant(game, 6000);
  assert.equal(game.run('left.wilted'), false);
  assert.equal(game.run('getSelectedEnemy()===body'), true);
  assert.equal(game.run('body.word===beforeWord && body.typed===beforeInput && els.flickInput.value===beforeFlick'), true);
  assert.equal(game.run('selectBattleEnemy(left)'), false);
  assert.equal(game.run('left.typed'), '');
  assert.equal(game.run('left.inputStarted'), false);
});

test('the body holds attacks while charging, and a revived tentacle cannot attack immediately', () => {
  const game = battle();
  game.run(`const [left,middle,body]=state.activeEnemies;
    [left,middle,body].forEach(e=>{setEnemyProgress(e,1);e.atBase=true;e.nextAttackAt=performance.now()});
    [left,middle].forEach(e=>{e.hp=0;defeatEnemy(e)});const before=state.hp;enemyAttack(body);`);
  advancePlant(game, 6000);
  game.run('enemyLoop(performance.now())');
  assert.equal(game.run('state.hp'), game.run('before'));
  assert.equal(game.run('left.atBase && left.nextAttackAt > performance.now()'), true);
  advancePlant(game, 3000);
  assert.ok(game.run('state.hp < before'));
});

test('time stop freezes regrowth without catching up, even with no animation frames during the stop', () => {
  const game = battle({ weaponId: 'dualBlades' });
  game.run('const [left,middle,body]=state.activeEnemies;left.hp=0;defeatEnemy(left)');
  advancePlant(game, 2000);
  game.run('state.specialGauge=100');
  assert.equal(game.run('useSpecialMove()'), true);
  advancePlant(game, 4999);
  assert.equal(game.run('body.tentacleReviveElapsedMs'), 2000);
  advancePlant(game, 1);
  assert.equal(game.run('body.tentacleReviveElapsedMs'), 2000);
  advancePlant(game, 3999);
  assert.equal(game.run('left.wilted'), true);
  advancePlant(game, 1);
  assert.equal(game.run('left.wilted'), false);
});

test('damaging the body pauses its charge during recovery and then resumes without resetting it', () => {
  const game = battle();
  game.run('const [left,middle,body]=state.activeEnemies;left.hp=0;defeatEnemy(left)');
  advancePlant(game, 2000);
  game.run('selectBattleEnemy(body);applyTypedValue(body,body.matchedWord)');
  advancePlant(game, 100);
  assert.equal(game.run('body.tentacleReviveElapsedMs'), 2000);
  game.advance(900);game.run('enemyLoop(performance.now())');
  assert.ok(game.run('body.tentacleReviveElapsedMs > 2000 && body.tentacleReviveElapsedMs < 3000'));
  advancePlant(game, 4000);
  assert.equal(game.run('left.wilted'), false);
});

test('counterattacks wilt tentacles and charging never shows an attack countdown even with Mind Eye', () => {
  const game = battle({ weaponId: 'sword' });
  game.run(`const [left,middle,body]=state.activeEnemies;state.specialGauge=100;useSpecialMove();
    beginPlayerCounter();setEnemyProgress(left,1);enemyAttack(left);`);
  game.advance(420);
  assert.equal(game.run('left.wilted'), true);
  game.run('setEnemyProgress(body,1);body.atBase=true;body.nextAttackAt=performance.now()+1000;updateEnemyAttackCountdown(body)');
  assert.equal(game.run('body.attackCountdownEl.hidden'), true);
  assert.equal(game.run('body.regrowthEl.hidden'), false);
});

test('an all-target skill wilts both tentacles without killing the healthy body', () => {
  const game = battle({ weaponId: 'greatsword' });
  game.run('const [left,middle,body]=state.activeEnemies;state.stats.attack=3;state.specialGauge=100;useSpecialMove()');
  game.advance(500);
  assert.equal(game.run('left.wilted && middle.wilted && body.hp > 0'), true);
  assert.equal(game.run('getSelectedEnemy()===body'), true);
  assert.equal(game.run('state.cleared'), 2);
  assert.equal(game.run('body.wiltedTentacles.length'), 2);
});

test('body death during a skill defeats surviving tentacles without a later recovery resurrecting them', () => {
  const game = battle({ weaponId: 'greatsword' });
  game.run(`const [left,middle,body]=state.activeEnemies;
    left.hp=0;defeatEnemy(left);middle.hp=999;body.hp=1;state.specialGauge=100;useSpecialMove();`);
  game.advance(500);
  assert.equal(game.run('state.activeEnemies.every(e=>e.hp===0 && e.experienceCounted && e.resolving)'), true);
  assert.equal(game.run('body.regrowthEl.hidden'), true);
  assert.equal(game.run('state.pendingExperience'), 580);
  advancePlant(game, 15000);
  assert.equal(game.run('state.running'), false);
  assert.equal(game.savedProgress().totalExperience, 3890);
});

test('repeated knockdowns add no rewards and pending hit recovery cannot revive a defeated plant', () => {
  const game = battle();
  game.run('const [left,middle,body]=state.activeEnemies;left.hp=0;defeatEnemy(left)');
  advancePlant(game, 6000);
  game.run('left.hp=0;defeatEnemy(left)');
  advancePlant(game, 6000);
  assert.equal(game.run('state.pendingExperience'), 140);
  game.run('resolveWeaponHit(middle,1,220);body.hp=0;defeatEnemy(body)');
  game.advance(220);
  assert.equal(game.run('middle.hp===0 && middle.resolving'), true);
  game.advance(1000);
  assert.equal(game.savedProgress().totalExperience, 3890);
});

for (const exit of ['startGame("vine_pass")','showStageSelect()','finishGame(false)']) {
  test(`${exit} cancels pending regrowth and does not award a knockdown`, () => {
    const game = battle();
    game.run('const [left,middle,body]=state.activeEnemies;left.hp=0;defeatEnemy(left)');
    advancePlant(game, 5999);
    game.run(exit);
    advancePlant(game, 12000);
    assert.equal(game.run('left.hp'), 0);
    assert.equal(game.run('body.wiltedTentacles.length'), 0);
    assert.equal(game.run('body.regrowthEl.hidden'), true);
    assert.equal(game.savedProgress().totalExperience, 3310);
  });
}
