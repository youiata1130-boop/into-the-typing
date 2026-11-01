import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../../helpers/game.mjs';

function battle(touch = false) {
  const game = createGame({ 'into-the-typing.player.v2': JSON.stringify({
    version: 2, totalExperience: 255, stats: { attack: 2, agility: 1 }, weaponId: 'sword',
    introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true,
    greatswordObtained: true, skillTutorialCompleted: true,
    clearedStages: ['forest_path', 'mist_road', 'sky_castle', 'storm_cove'],
  }) }, { touch });
  game.run(`startGame("grassland_path"); const enemy = getCurrentEnemy();
    enemy.hp = enemy.maxHp = 1000; enemy.attackPower = { min: 10, max: 10 };
    enemy.word = enemy.matchedWord = "a".repeat(64); enemy.inputs = [enemy.word];
    const incoming = () => { setEnemyProgress(enemy, 1); enemyAttack(enemy); };`);
  game.advance(850);
  return game;
}

for (const touch of [false, true]) test(`mind eye replaces healing and activates at full HP through ${touch ? 'touch' : 'Enter'}`, () => {
  const game = battle(touch);
  game.run('applyTypedValue(enemy,"a".repeat(33))');
  assert.equal(game.run('state.specialGauge'), 99);
  game.run('applyTypedValue(enemy,"a".repeat(34)); const hp=state.hp; const typed=enemy.typed');
  assert.equal(game.run('els.specialButton.disabled'), false);
  if (touch) game.run('els.specialButton.dispatchEvent({type:"click"})');
  else game.run('handleTypingKeydown({key:"Enter",code:"Enter",preventDefault(){}})');
  assert.equal(game.run('state.specialGauge'), 0);
  assert.equal(game.run('state.specialInProgress'), false);
  assert.equal(game.run('els.skillName.textContent'), '心眼中');
  assert.equal(game.run('els.specialButton.dataset.active'), 'true');
  assert.equal(game.run('state.hp'), game.run('hp'));
  assert.equal(game.run('enemy.hp'), 1000);
  assert.equal(game.run('enemy.typed'), game.run('typed'));
  game.run('applyTypedValue(enemy,"a".repeat(35))');
  assert.equal(game.run('enemy.typed.length'), 35);
});

test('mind eye allows repeated zero-ki counters but keeps timing and rearm requirements', () => {
  const game = battle();
  game.run('state.specialGauge=100; useSpecialMove(); const hp=state.hp');
  assert.equal(game.run('playerCounter.energy'), 0);
  assert.equal(game.run('els.counterButton.disabled'), false);
  assert.equal(game.run('beginPlayerCounter()'), true);
  game.advance(400);
  game.run('incoming()');
  assert.equal(game.run('state.hp'), game.run('hp'));
  assert.equal(game.run('enemy.hp'), 990);
  assert.equal(game.run('playerCounter.energy'), 0);
  assert.equal(game.run('beginPlayerCounter()'), false);
  game.advance(420);
  assert.equal(game.run('beginPlayerCounter()'), true);
  game.advance(401);
  game.run('incoming()');
  assert.equal(game.run('state.hp'), game.run('hp') - 10);
  assert.equal(game.run('playerCounter.energy'), 0);
  game.advance(600);
  assert.equal(game.run('beginPlayerCounter()'), true);
  game.run('incoming()');
  assert.equal(game.run('enemy.hp'), 980);
});

test('success, failure, and hidden-page cancellation preserve existing ki during mind eye', () => {
  const game = battle();
  game.run('chargePlayerCounter(7); state.specialGauge=100; useSpecialMove(); beginPlayerCounter(); incoming()');
  assert.equal(game.run('playerCounter.energy'), 70);
  game.advance(700);
  game.run('beginPlayerCounter()');
  game.advance(401);
  assert.equal(game.run('playerCounter.energy'), 70);
  game.advance(199);
  game.run('beginPlayerCounter(); document.hidden=true; document.dispatchEvent({type:"visibilitychange"})');
  assert.equal(game.run('playerCounter.energy'), 70);
  game.run('document.hidden=false; applyTypedValue(enemy,enemy.matchedWord[0])');
  assert.equal(game.run('playerCounter.energy'), 80);
});

test('eight-second expiry restores the normal ki requirement without stacking or wasting a gauge', () => {
  const game = battle();
  game.run('chargePlayerCounter(4); state.specialGauge=100; useSpecialMove(); state.specialGauge=100; const deadline=mindEye.until');
  assert.equal(game.run('useSpecialMove()'), false);
  assert.equal(game.run('state.specialGauge'), 100);
  assert.equal(game.run('mindEye.until'), game.run('deadline'));
  game.advance(7999);
  assert.equal(game.run('isMindEyeActive()'), true);
  game.advance(1);
  assert.equal(game.run('isMindEyeActive()'), false);
  assert.equal(game.run('els.skillName.textContent'), '心眼');
  assert.equal(game.run('els.specialButton.dataset.active'), 'false');
  assert.equal(game.run('playerCounter.energy'), 40);
  assert.equal(game.run('beginPlayerCounter()'), false);
  game.run('chargePlayerCounter(6); beginPlayerCounter(); incoming()');
  assert.equal(game.run('playerCounter.energy'), 0);
});

for (const success of [false, true]) test(`a free counter opened before expiry stays free on ${success ? 'success' : 'failure'}`, () => {
  const game = battle();
  game.run('chargePlayerCounter(6); state.specialGauge=100; useSpecialMove()');
  game.advance(7900);
  game.run('beginPlayerCounter()');
  game.advance(success ? 300 : 401);
  if (success) game.run('incoming()');
  assert.equal(game.run('isMindEyeActive()'), false);
  assert.equal(game.run('playerCounter.energy'), 60);
  assert.equal(game.run('playerCounter.openedAt'), null);
});

test('activation covers an open counter; damage remains possible without countering and battle exit resets the buff', () => {
  const game = battle();
  game.run('chargePlayerCounter(10); beginPlayerCounter(); state.specialGauge=100; useSpecialMove(); incoming()');
  assert.equal(game.run('playerCounter.energy'), 100);
  game.advance(700);
  game.run('const hp=state.hp; incoming()');
  assert.equal(game.run('state.hp'), game.run('hp') - 10);
  game.run('startGame("grassland_path")');
  assert.equal(game.run('isMindEyeActive()'), false);
  assert.equal(game.run('playerCounter.energy'), 0);
  game.advance(850);
  game.run('state.specialGauge=100; useSpecialMove(); showStageSelect()');
  game.advance(9000);
  assert.equal(game.run('els.specialButton.dataset.active'), 'false');
  assert.equal(game.run('els.player.classList.contains("is-mind-eye")'), false);
});
