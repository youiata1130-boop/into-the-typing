// Stationary enemies share the battle clock, including hit and attack recovery.
function updateEnemyCharge(enemy) {
  if (enemy.attackStyle !== "charge" || !enemy.chargeMeter) return;
  const attacking = enemy.animation === "attack";
  const remaining = Math.max(0, enemy.chargeDurationMs - enemy.chargeElapsedMs);
  const progress = Math.min(1, enemy.chargeElapsedMs / enemy.chargeDurationMs);
  const phase = attacking ? "attack" : progress >= 0.75 ? "warning" : "charging";
  enemy.element.dataset.chargePhase = phase;
  enemy.element.style.setProperty("--enemy-charge", progress.toFixed(3));
  enemy.chargeFill.style.width = `${progress * 100}%`;
  const percent = Math.floor(progress * 100);
  if (enemy.chargeMeter.getAttribute("aria-valuenow") !== String(percent)) {
    enemy.chargeMeter.setAttribute("aria-valuenow", String(percent));
  }
  const seconds = (Math.ceil(remaining / 100) / 10).toFixed(1);
  const label = attacking ? "胞子攻撃！" : `攻撃まで ${seconds}秒`;
  if (enemy.chargeLabel.textContent !== label) {
    enemy.chargeLabel.textContent = label;
    enemy.chargeMeter.setAttribute("aria-valuetext", label);
  }
  enemy.chargeMeter.hidden = !isEnemyAlive(enemy);
}

function advanceEnemyCharge(enemy, now) {
  const elapsed = Math.max(0, now - enemy.lastTick);
  enemy.lastTick = now;
  enemy.chargeElapsedMs = Math.min(enemy.chargeDurationMs, enemy.chargeElapsedMs + elapsed);
  updateEnemyCharge(enemy);
  if (enemy.chargeElapsedMs >= enemy.chargeDurationMs) enemyAttack(enemy);
}

function resetEnemyCharge(enemy) {
  if (enemy.attackStyle !== "charge") return;
  enemy.chargeElapsedMs = 0;
  enemy.lastTick = performance.now();
  updateEnemyCharge(enemy);
}

function aimEnemySpores(enemy) {
  const source = enemy.sprite.getBoundingClientRect();
  const target = els.player.getBoundingClientRect();
  const distance = Math.max(0, source.left + source.width / 2 - (target.left + target.width / 2));
  enemy.element.style.setProperty("--spore-distance", `${distance}px`);
}
