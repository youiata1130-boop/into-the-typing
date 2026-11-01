// Sample once per attack cycle; keep the configured base to avoid timing drift.
function randomizeEnemyAttackMs(baseMs) {
  return Math.round(baseMs * (0.9 + Math.random() * 0.2));
}

// Stationary enemies share the battle clock, including hit and attack recovery.
function isEnemyWindingUp(enemy) {
  return enemy.attackStyle === "charge" && isEnemyAlive(enemy)
    && enemy.chargeElapsedMs >= enemy.chargeDurationMs * 0.75;
}

function updateEnemyCharge(enemy) {
  if (enemy.attackStyle !== "charge") return;
  const alive = isEnemyAlive(enemy);
  const attacking = enemy.animation === "attack";
  const progress = attacking ? 1 : Math.max(0, Math.min(1, enemy.chargeElapsedMs / enemy.chargeDurationMs));
  const phase = !alive ? "defeated" : attacking ? "attack" : progress >= 0.75 ? "warning" : "charging";
  const phaseChanged = enemy.element.dataset.chargePhase !== phase;
  enemy.element.dataset.chargePhase = phase;
  if (phaseChanged && enemy.animation === "idle") updateEnemyFrame(enemy);
  enemy.element.style.setProperty("--enemy-charge", progress.toFixed(3));
  enemy.element.style.setProperty("--enemy-aura-color", `hsl(${Math.round(100 * (1 - progress))} 90% 64%)`);
  const label = !alive ? "撃破" : attacking ? enemy.chargeAttackLabel : phase === "warning" ? "攻撃準備" : "溜め中";
  enemy.element.setAttribute("aria-label", `${enemy.name || "敵"}、${label}`);
}

function advanceEnemyCharge(enemy, now) {
  if (isEnemyActionStopped()) { enemy.lastTick = now; return; }
  const elapsed = Math.max(0, now - enemy.lastTick);
  enemy.lastTick = now;
  enemy.chargeElapsedMs = Math.min(enemy.chargeDurationMs, enemy.chargeElapsedMs + elapsed);
  updateEnemyCharge(enemy);
  if (enemy.chargeElapsedMs >= enemy.chargeDurationMs) enemyAttack(enemy);
}

function resetEnemyCharge(enemy) {
  if (enemy.attackStyle !== "charge") return;
  enemy.chargeDurationMs = randomizeEnemyAttackMs(enemy.baseChargeDurationMs);
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
