const targetTutorial = { chosen: false };
const targetTutorialUi = {
  panel: document.querySelector('#targetTutorial'),
  text: document.querySelector('#targetTutorialText'),
};

function getTargetTutorialPhase() {
  if (!state.running || !chooseEnemyWave()?.targetTutorial) return '';
  if (!targetTutorial.chosen) return 'select';
  return state.activeEnemies.some(enemy => enemy.slot === 1 && isEnemyAlive(enemy)) ? 'attack' : '';
}

function isTargetTutorialWaiting() {
  return getTargetTutorialPhase() === 'select';
}

function canSelectTutorialEnemy(enemy) {
  const phase = getTargetTutorialPhase();
  return !phase || (phase === 'select' && enemy.slot === 1);
}

function canTypeTutorialEnemy(enemy) {
  const phase = getTargetTutorialPhase();
  return !phase || (phase === 'attack' && enemy?.slot === 1);
}

function isTargetTutorialEnemyPaused(enemy) {
  return Boolean(getTargetTutorialPhase()) && (isTargetTutorialWaiting() || enemy.slot === 0);
}

function selectTutorialEnemy(enemy) {
  if (!isTargetTutorialWaiting() || enemy.slot !== 1) return;
  targetTutorial.chosen = true;
  state.activeEnemies.forEach(part => { part.lastTick = performance.now(); });
}

function updateTargetTutorial() {
  const phase = getTargetTutorialPhase();
  targetTutorialUi.panel.hidden = !phase;
  els.battleScreen.dataset.targetTutorial = phase;
  if (!phase) return;
  const text = phase === 'select'
    ? flickState.enabled
      ? '敵をタップすると攻撃先を選べます。左は体力が多く、右は攻撃力が高い敵です。右の敵を選んで先に倒しましょう。'
      : 'Shiftキーで攻撃先を選べます。左は体力が多く、右は攻撃力が高い敵です。Shiftキーで右の敵を選び、先に倒しましょう。'
    : '右の敵を先に倒しましょう。';
  if (targetTutorialUi.text.textContent !== text) targetTutorialUi.text.textContent = text;
}

function clearTargetTutorial() {
  targetTutorial.chosen = false;
  targetTutorialUi.panel.hidden = true;
  document.querySelector('#battleScreen').dataset.targetTutorial = '';
}
