const playerAttackBoost = { multiplier: 1, timerId: 0 };

function isPlayerAttackBoosted() {
  return playerAttackBoost.multiplier > 1;
}

function clearPlayerAttackBoost() {
  window.clearTimeout(playerAttackBoost.timerId);
  playerAttackBoost.timerId = 0;
  playerAttackBoost.multiplier = 1;
  els.player.classList.remove("is-attack-boosted");
  els.attackBoostIndicator.hidden = true;
}

function startPlayerAttackBoost(effect) {
  playerAttackBoost.multiplier = effect.multiplier;
  els.player.classList.add("is-attack-boosted");
  els.attackBoostIndicator.textContent = `攻撃力${effect.multiplier}倍`;
  els.attackBoostIndicator.hidden = false;
  playerAttackBoost.timerId = scheduleBattleTimeout(() => {
    clearPlayerAttackBoost();
    updateHud();
  }, effect.durationMs);
}

function useAttackBoostSkill(skill) {
  if (isPlayerAttackBoosted() || state.activeEnemies.some(enemy => isEnemyAlive(enemy) && enemy.resolving)) return false;
  state.specialGauge = 0;
  skill.effects.forEach(effect => skillEffectHandlers[effect.type](effect, [state]));
  window.GAME_SOUND.play("attack_boost");
  updateHud();
  return true;
}
