const playerCounter = { openedAt: null, readyAt: 0, windowTimer: 0, rearmTimer: 0, effectTimer: 0 };
const counterWindowMs = 200;
const counterRearmMs = 600;

function canPlayerCounter() {
  return state.running && !isMountainCaptureActive() && state.hp > 0 && getBattleWeaponId() === "sword"
    && !state.specialInProgress && !isStoryDialogueOpen()
    && state.activeEnemies.some(enemy => isEnemyAlive(enemy) && !enemy.tutorial);
}

function updatePlayerCounterHud() {
  els.counterButton.hidden = !state.running || getBattleWeaponId() !== "sword" || isStoryDialogueOpen()
    || getStageDefinition(state.stageId).tutorial;
  els.counterButton.disabled = !canPlayerCounter() || performance.now() < playerCounter.readyAt;
}

function clearCounterWindow() {
  window.clearTimeout(playerCounter.windowTimer);
  playerCounter.windowTimer = 0;
  playerCounter.openedAt = null;
  els.player.classList.remove("is-counter-ready");
}

function clearPlayerCounter() {
  clearCounterWindow();
  window.clearTimeout(playerCounter.rearmTimer);
  window.clearTimeout(playerCounter.effectTimer);
  playerCounter.readyAt = 0;
  playerCounter.rearmTimer = playerCounter.effectTimer = 0;
  els.player.classList.remove("is-counter-hit");
  els.counterDamage.textContent = "";
  updatePlayerCounterHud();
}

function beginPlayerCounter() {
  if (!canPlayerCounter() || performance.now() < playerCounter.readyAt) return false;
  playerCounter.openedAt = performance.now();
  playerCounter.readyAt = performance.now() + counterRearmMs;
  els.player.classList.add("is-counter-ready");
  playerCounter.windowTimer = scheduleBattleTimeout(clearCounterWindow, counterWindowMs + 1);
  playerCounter.rearmTimer = scheduleBattleTimeout(() => {
    playerCounter.rearmTimer = 0;
    updatePlayerCounterHud();
  }, counterRearmMs);
  updatePlayerCounterHud();
  return true;
}

function tryPlayerCounter(enemy) {
  const elapsed = performance.now() - playerCounter.openedAt;
  if (!canPlayerCounter() || playerCounter.openedAt === null || elapsed < 0 || elapsed > counterWindowMs) return false;
  clearCounterWindow();
  clearInputBuffer();
  startPlayerAttackCooldown("sword");
  playPlayerAttackAnimation(enemy, false);
  window.GAME_SOUND.play("counter");
  const damage = getPlayerAttackDamage(enemy) * 5;
  els.counterDamage.textContent = `カウンター！ −${damage}`;
  els.player.classList.remove("is-counter-hit");
  void els.player.offsetWidth;
  els.player.classList.add("is-counter-hit");
  playerCounter.effectTimer = scheduleBattleTimeout(() => {
    els.player.classList.remove("is-counter-hit");
    playerCounter.effectTimer = 0;
  }, 650);
  state.score += 120;
  resolveWeaponHit(enemy, damage, 420);
  updateHud();
  return true;
}

function initializePlayerCounter() {
  els.counterButton.addEventListener("click", beginPlayerCounter);
  window.addEventListener("blur", clearPlayerCounter);
  window.addEventListener("pagehide", clearPlayerCounter);
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearPlayerCounter(); });
}
