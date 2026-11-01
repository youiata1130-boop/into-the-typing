const targetTutorial = { chosen: false, dismissed: false };
const targetTutorialUi = {
  panel: document.querySelector('#targetTutorial'),
  text: document.querySelector('#targetTutorialText'),
  dismiss: document.querySelector('#targetTutorialDismiss'),
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
  return !phase || (phase === 'select' && targetTutorial.dismissed && enemy.slot === 1);
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
  els.battleScreen.dataset.targetTutorial = phase;
  const text = flickState.enabled
      ? '敵をタップすると攻撃先を選べます。左は体力が多く、右は攻撃力が高い敵です。右の敵を選んで先に倒しましょう。'
      : 'Shiftキーで攻撃先を選べます。左は体力が多く、右は攻撃力が高い敵です。Shiftキーで右の敵を選び、先に倒しましょう。';
  if (targetTutorialUi.text.textContent !== text) targetTutorialUi.text.textContent = text;
  const visible = phase === 'select' && !targetTutorial.dismissed && !isBattleStartPending() && state.activeEnemies.length > 0;
  if (!visible) { hideTargetTutorialPopup(); return; }
  if (targetTutorialUi.panel.hidden) {
    targetTutorialUi.panel.hidden = false;
    targetTutorialUi.panel.showModal?.();
    targetTutorialUi.dismiss.focus({ preventScroll: true });
  }
}

function hideTargetTutorialPopup() {
  if (targetTutorialUi.panel.open) targetTutorialUi.panel.close();
  targetTutorialUi.panel.hidden = true;
}

function dismissTargetTutorial() {
  if (targetTutorialUi.panel.hidden || getTargetTutorialPhase() !== 'select') return false;
  targetTutorial.dismissed = true;
  updateHud();
  focusGameSurface({ userGesture: true });
  return true;
}

function clearTargetTutorial() {
  targetTutorial.chosen = false;
  targetTutorial.dismissed = false;
  hideTargetTutorialPopup();
  document.querySelector('#battleScreen').dataset.targetTutorial = '';
}

targetTutorialUi.dismiss.addEventListener('click', dismissTargetTutorial);
targetTutorialUi.panel.addEventListener('cancel', event => { event.preventDefault(); dismissTargetTutorial(); });
// Keep Enter, Space, Shift and letter keys inside the modal, away from battle input.
targetTutorialUi.panel.addEventListener('keydown', event => event.stopPropagation());
