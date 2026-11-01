function getEnemyAttackRemainingMs(enemy, now) {
  if (enemy.attackStyle === "charge") return enemy.chargeDurationMs - enemy.chargeElapsedMs;
  if (enemy.atBase) {
    return isEnemyActionStopped() ? enemy.stoppedAttackRemaining : enemy.nextAttackAt - now;
  }
  return (1 - enemy.progress) * enemy.approachMs;
}

function updateEnemyAttackCountdown(enemy, now = performance.now()) {
  const impact = now < (enemy.attackCountdownUntil || 0);
  // Remove sub-millisecond floating-point noise from movement-based timing.
  const remaining = Math.round(getEnemyAttackRemainingMs(enemy, now));
  const visible = state.running && isMindEyeActive() && !isBattleStartPending() && !isStoryDialogueOpen()
    && !isMountainCaptureActive() && !isTargetTutorialEnemyPaused(enemy) && !isPlantRegrowing(enemy) && !enemy.tutorial && isEnemyAlive(enemy)
    && (impact || (!enemy.resolving && enemy.animation !== "attack" && remaining <= 3000));
  enemy.attackCountdownEl.hidden = !visible;
  if (!visible) return;
  // Zero is shown by the attack itself, never by a rounded-down estimate.
  const count = impact ? 0 : Math.max(1, Math.ceil(remaining / 1000));
  if (enemy.attackCountdownEl.textContent !== String(count)) {
    enemy.attackCountdownEl.textContent = String(count);
    enemy.attackCountdownEl.dataset.count = String(count);
    enemy.attackCountdownEl.setAttribute("aria-label", `${enemy.name || "敵"}、${count === 0 ? "攻撃" : `攻撃まで${count}秒`}`);
  }
}

function showEnemyAttackCountdownImpact(enemy) {
  enemy.attackCountdownUntil = performance.now() + 220;
  updateEnemyAttackCountdown(enemy);
}
