const playerCounter = { energy: 0, free: false, openedAt: null, readyAt: 0, windowTimer: 0, rearmTimer: 0, effectTimer: 0 };
const counterRules = window.COUNTER_RULES;
const counterWindowMs = counterRules.windowMs;
const counterRearmMs = counterRules.rearmMs;

function canPlayerCounter() {
  return state.running && !isTargetTutorialWaiting() && !isMountainCaptureActive() && state.hp > 0 && getBattleWeaponId() === "sword"
    && !isBattleStartPending() && !state.specialInProgress && !isStoryDialogueOpen()
    && state.activeEnemies.some(enemy => isEnemyAlive(enemy) && !enemy.tutorial);
}

function updatePlayerCounterHud() {
  els.counterButton.hidden = !state.running || getBattleWeaponId() !== "sword" || isStoryDialogueOpen()
    || getStageDefinition(state.stageId).tutorial;
  els.counterButton.disabled = !canPlayerCounter() || performance.now() < playerCounter.readyAt
    || (!isMindEyeActive() && playerCounter.energy < counterRules.maxEnergy);
  els.counterButton.dataset.ready = String(isMindEyeActive() || playerCounter.energy >= counterRules.maxEnergy);
  els.counterButton.dataset.free = String(isMindEyeActive());
  els.counterEnergyValue.textContent = `気 ${playerCounter.energy}％`;
  els.counterEnergy.setAttribute("aria-valuenow", String(playerCounter.energy));
  els.counterEnergyFill.style.width = `${playerCounter.energy}%`;
}

function chargePlayerCounter(characterCount) {
  if (!canPlayerCounter() || playerCounter.openedAt !== null) return;
  playerCounter.energy = Math.min(counterRules.maxEnergy, playerCounter.energy + characterCount * counterRules.energyPerCharacter);
  updatePlayerCounterHud();
}

function failPlayerCounter() {
  if (playerCounter.openedAt === null) return;
  if (!playerCounter.free) playerCounter.energy = Math.floor(playerCounter.energy / 2);
  clearCounterWindow();
  updatePlayerCounterHud();
}

function clearCounterWindow() {
  window.clearTimeout(playerCounter.windowTimer);
  playerCounter.windowTimer = 0;
  playerCounter.openedAt = null;
  playerCounter.free = false;
  els.player.classList.remove("is-counter-ready");
}

function clearPlayerCounter() {
  clearMindEye();
  clearCounterWindow();
  window.clearTimeout(playerCounter.rearmTimer);
  window.clearTimeout(playerCounter.effectTimer);
  playerCounter.readyAt = 0;
  playerCounter.energy = 0;
  playerCounter.rearmTimer = playerCounter.effectTimer = 0;
  els.player.classList.remove("is-counter-hit");
  els.counterDamage.textContent = "";
  updatePlayerCounterHud();
}

function beginPlayerCounter() {
  if (!canPlayerCounter() || performance.now() < playerCounter.readyAt
      || (!isMindEyeActive() && playerCounter.energy < counterRules.maxEnergy)) return false;
  // Keep the cost decided at activation, including when the buff expires mid-window.
  playerCounter.free = isMindEyeActive();
  playerCounter.openedAt = performance.now();
  playerCounter.readyAt = performance.now() + counterRearmMs;
  els.player.classList.add("is-counter-ready");
  playerCounter.windowTimer = scheduleBattleTimeout(failPlayerCounter, counterWindowMs + 1);
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
  if (!playerCounter.free) playerCounter.energy = 0;
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
  window.addEventListener("blur", failPlayerCounter);
  window.addEventListener("pagehide", failPlayerCounter);
  document.addEventListener("visibilitychange", () => { if (document.hidden) failPlayerCounter(); });
}
