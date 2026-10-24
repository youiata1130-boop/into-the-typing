const enemyActionStop = { until: 0, timerId: 0 };

function isEnemyActionStopped() {
  return enemyActionStop.until > 0;
}

function markStoppedEnemy(enemy) {
  if (!isEnemyActionStopped()) return;
  enemy.stoppedAttackRemaining = enemy.atBase ? Math.max(0, enemy.nextAttackAt - performance.now()) : null;
  enemy.element.classList.add("is-time-stopped");
}

function clearEnemyActionStop() {
  window.clearTimeout(enemyActionStop.timerId);
  const resumedAt = performance.now();
  state.activeEnemies.forEach(enemy => {
    if (enemy.element.classList.contains("is-time-stopped")) {
      enemy.lastTick = resumedAt;
      if (enemy.atBase && enemy.stoppedAttackRemaining !== null) {
        enemy.nextAttackAt = resumedAt + enemy.stoppedAttackRemaining;
      }
    }
    enemy.stoppedAttackRemaining = null;
    enemy.element.classList.remove("is-time-stopped");
  });
  enemyActionStop.until = 0;
  enemyActionStop.timerId = 0;
  els.enemyStopIndicator.hidden = true;
}

function useEnemyStopSkill(skill) {
  if (isEnemyActionStopped() || state.activeEnemies.some(enemy => isEnemyAlive(enemy) && enemy.resolving)) return false;
  state.specialGauge = 0;
  skill.effects.forEach(effect => skillEffectHandlers[effect.type](effect, []));
  window.GAME_SOUND.play("time_stop");
  updateHud();
  return true;
}

function startEnemyActionStop(durationMs) {
  enemyActionStop.until = performance.now() + durationMs;
  state.activeEnemies.forEach(markStoppedEnemy);
  els.enemyStopIndicator.hidden = false;
  enemyActionStop.timerId = scheduleBattleTimeout(() => {
    clearEnemyActionStop();
    updateHud();
  }, durationMs);
}
