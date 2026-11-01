const mindEye = { until: 0, timerId: 0 };

function isMindEyeActive() {
  return getBattleWeaponId() === "sword" && performance.now() < mindEye.until;
}

function clearMindEye() {
  window.clearTimeout(mindEye.timerId);
  mindEye.until = mindEye.timerId = 0;
  els.player.classList.remove("is-mind-eye");
}

function startMindEye(durationMs) {
  mindEye.until = performance.now() + durationMs;
  // An already-open counter also receives the newly activated benefit.
  if (playerCounter.openedAt !== null) playerCounter.free = true;
  els.player.classList.add("is-mind-eye");
  mindEye.timerId = scheduleBattleTimeout(() => {
    clearMindEye();
    updateHud();
  }, durationMs);
}

function useMindEyeSkill(skill) {
  if (isMindEyeActive() || isBattleStartPending()
      || state.activeEnemies.some(enemy => isEnemyAlive(enemy) && enemy.resolving)) return false;
  state.specialGauge = 0;
  skill.effects.forEach(effect => skillEffectHandlers[effect.type](effect, [state]));
  window.GAME_SOUND.play("mind_eye");
  updateHud();
  return true;
}
