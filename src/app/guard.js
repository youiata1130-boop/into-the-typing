const playerGuardInput = { keys: new Set(), pointerId: null, hitTimerId: 0 };

function hasGuardWeapon() {
  return typeof getActiveWeapon().guardDamageMultiplier === "number";
}

function canPlayerGuard() {
  return state.running && state.hp > 0 && hasGuardWeapon()
    && !state.specialInProgress && !isStoryDialogueOpen();
}

function beginPlayerGuard(source, pointerId = null) {
  if (!canPlayerGuard()) return false;
  if (source === "pointer") playerGuardInput.pointerId = pointerId;
  else playerGuardInput.keys.add(source);
  if (state.guarding) return true;
  state.guarding = true;
  clearInputBuffer();
  clearPlayerAttackAnimation();
  updateHud();
  return true;
}

function endPlayerGuard(source, pointerId = null) {
  if (source === "pointer") {
    if (playerGuardInput.pointerId !== pointerId) return;
    playerGuardInput.pointerId = null;
  } else if (!playerGuardInput.keys.delete(source)) return;
  state.guarding = canPlayerGuard()
    && (playerGuardInput.keys.size > 0 || playerGuardInput.pointerId !== null);
  updateHud();
}

function clearPlayerGuard() {
  playerGuardInput.keys.clear();
  playerGuardInput.pointerId = null;
  window.clearTimeout(playerGuardInput.hitTimerId);
  playerGuardInput.hitTimerId = 0;
  state.guarding = false;
  els.player.classList.remove("is-guarding", "is-guard-hit");
  updateGuardHud();
}

function updateGuardHud() {
  els.guardButton.hidden = !state.running || !hasGuardWeapon() || isStoryDialogueOpen();
  els.guardButton.disabled = !canPlayerGuard();
  els.guardButton.setAttribute("aria-pressed", String(state.guarding));
  els.guardButtonText.textContent = state.guarding ? "ガード中" : "ガード";
  els.player.classList.toggle("is-guarding", state.guarding);
  els.player.setAttribute("aria-label", state.guarding ? "盾でガードする主人公" : "主人公");
}

function playGuardImpact() {
  window.GAME_SOUND?.play("guard");
  window.clearTimeout(playerGuardInput.hitTimerId);
  els.player.classList.remove("is-guard-hit");
  void els.player.offsetWidth;
  els.player.classList.add("is-guard-hit");
  playerGuardInput.hitTimerId = scheduleBattleTimeout(() => {
    els.player.classList.remove("is-guard-hit");
    playerGuardInput.hitTimerId = 0;
  }, 300);
}

function initializePlayerGuard() {
  document.addEventListener("keyup", event => {
    if (event.code === "Space" || event.key === " " || event.key === "Spacebar") endPlayerGuard("keyboard");
  });
  const releaseOnBlur = () => { clearPlayerGuard(); updateHud(); };
  window.addEventListener("blur", releaseOnBlur);
  window.addEventListener("pagehide", releaseOnBlur);
  document.addEventListener("visibilitychange", () => { if (document.hidden) releaseOnBlur(); });
  els.guardButton.addEventListener("pointerdown", event => {
    if (event.button !== 0 || playerGuardInput.pointerId !== null) return;
    event.preventDefault();
    if (beginPlayerGuard("pointer", event.pointerId)) {
      try { els.guardButton.setPointerCapture(event.pointerId); } catch {}
    }
  });
  const releasePointer = event => endPlayerGuard("pointer", event.pointerId);
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    els.guardButton.addEventListener(type, releasePointer);
  }
  window.addEventListener("pointerup", releasePointer);
  window.addEventListener("pointercancel", releasePointer);
  els.guardButton.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!event.repeat) beginPlayerGuard("enter");
  });
  document.addEventListener("keyup", event => {
    if (event.key === "Enter") endPlayerGuard("enter");
  });
  els.guardButton.addEventListener("click", event => event.preventDefault());
}
