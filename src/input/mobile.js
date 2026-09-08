// Native text input keeps Japanese IME composition separate from battle key events.
const flickState = {
  enabled: false,
  composing: false,
  compositionKey: "",
  promptKey: "",
  lastValue: null,
  timerId: 0,
  keepFocus: false,
};

function flickPromptKey() {
  const enemy = getCurrentEnemy();
  return state.running && !isStoryDialogueOpen() && enemy
    ? state.battleGeneration + ":" + enemy.id + ":" + enemy.inputRevision
    : "";
}

function clearFlickInput() {
  window.clearTimeout(flickState.timerId);
  flickState.timerId = 0;
  flickState.lastValue = null;
  els.flickInput.value = "";
  els.flickInput.setAttribute("aria-invalid", "false");
}

function retainFlickFocus() {
  if (!flickState.enabled || !flickState.keepFocus || flickState.composing
      || !state.running || isStoryDialogueOpen() || els.battleScreen.hidden
      || document.visibilityState === "hidden") return;
  const active = document.activeElement;
  // Do not steal focus from Back, dialogue controls, or another deliberate target.
  if (active && active !== document.body && active !== els.flickInput) return;
  if (active !== els.flickInput) focusGameSurface();
}

function syncFlickInput() {
  const key = flickPromptKey();
  if (flickState.promptKey !== key) {
    flickState.promptKey = key;
    clearFlickInput();
  }
  const readOnly = !state.running || isStoryDialogueOpen();
  // Reapplying editability on every render can disrupt a mobile keyboard session.
  if (els.flickInput.readOnly !== readOnly) els.flickInput.readOnly = readOnly;
  if (readOnly) flickState.keepFocus = false;
  else retainFlickFocus();
}

function getFlickReading(enemy) {
  // The parser is cached per prompt; explicit readings disambiguate words such as 本屋.
  if (enemy.flickRoman !== enemy.word) {
    enemy.flickRoman = enemy.word;
    enemy.flickReading = window.JAPANESE_INPUT.parse(enemy.word, enemy.readingOverride);
  }
  return enemy.flickReading;
}

function renderFlickPrompt(enemy) {
  const parsed = getFlickReading(enemy);
  if (!parsed) return;
  const typedReading = window.JAPANESE_INPUT.parse(enemy.typed, enemy.readingOverride)?.reading || "";
  const confirmed = parsed.reading.startsWith(typedReading) ? typedReading.length : 0;
  els.typedWord.textContent = parsed.reading.slice(0, confirmed);
  els.remainingWord.textContent = parsed.reading.slice(confirmed);
}

function applyFlickValue(value, key = flickPromptKey()) {
  const enemy = getCurrentEnemy();
  if (!key || key !== flickPromptKey() || !enemy || enemy.resolving || state.specialInProgress) {
    clearFlickInput();
    return;
  }
  if (flickState.lastValue === value) return;
  flickState.lastValue = value;
  const normalized = window.JAPANESE_INPUT.normalize(value);
  const roman = /^[a-z-]*$/.test(normalized)
    ? normalized
    : window.JAPANESE_INPUT.match(value, enemy.word, enemy.translation, getFlickReading(enemy));
  const valid = roman !== null && enemy.inputs.some(input => input.startsWith(roman));
  els.flickInput.setAttribute("aria-invalid", String(!valid));
  if (!valid) {
    recordTypingMiss(enemy);
    return;
  }
  applyTypedValue(enemy, roman);
  if (enemy.resolving) clearFlickInput();
  retainFlickFocus();
}

function queueFlickInput(key = flickPromptKey()) {
  window.clearTimeout(flickState.timerId);
  const value = els.flickInput.value;
  // Browsers may send a final input event after compositionend. Coalesce both.
  flickState.timerId = window.setTimeout(() => {
    flickState.timerId = 0;
    if (!flickState.composing) applyFlickValue(value, key);
  }, 0);
}

function handleFlickCompositionStart() {
  window.clearTimeout(flickState.timerId);
  flickState.timerId = 0;
  flickState.composing = true;
  flickState.compositionKey = flickPromptKey();
}

function handleFlickCompositionEnd() {
  flickState.composing = false;
  if (!flickState.compositionKey || flickState.compositionKey !== flickPromptKey()) {
    clearFlickInput();
    return;
  }
  stripFlickLineBreaks();
  queueFlickInput(flickState.compositionKey);
  retainFlickFocus();
}

function stripFlickLineBreaks() {
  const value = els.flickInput.value.replace(/[\r\n]/g, "");
  if (value !== els.flickInput.value) els.flickInput.value = value;
}

function handleFlickInput(event) {
  if (event.isComposing || flickState.composing) return;
  stripFlickLineBreaks();
  queueFlickInput();
  retainFlickFocus();
}

function handleFlickKeydown(event) {
  if (event.key !== "Enter" || event.isComposing || flickState.composing || event.keyCode === 229) return;
  event.preventDefault();
  queueFlickInput();
  retainFlickFocus();
}

function handleFlickBeforeInput(event) {
  if (!["insertLineBreak", "insertParagraph"].includes(event.inputType)
      || event.isComposing || flickState.composing) return;
  if (event.cancelable) event.preventDefault();
  queueFlickInput();
  retainFlickFocus();
}

function updateBattleViewport() {
  const viewport = window.visualViewport;
  if (viewport && viewport.scale !== 1) return;
  document.documentElement.style.setProperty("--battle-viewport-height", (viewport?.height || window.innerHeight || 800) + "px");
  document.documentElement.style.setProperty("--battle-viewport-top", (viewport?.offsetTop || 0) + "px");
}

function initializeFlickInput() {
  const touchInput = window.matchMedia("(pointer: coarse)");
  const updateMode = () => {
    flickState.enabled = touchInput.matches;
    document.documentElement.dataset.flickInput = String(flickState.enabled);
    updateBattleViewport();
    renderWord();
  };
  flickState.enabled = touchInput.matches;
  document.documentElement.dataset.flickInput = String(flickState.enabled);
  touchInput.addEventListener?.("change", updateMode);
  els.flickInput.addEventListener("compositionstart", handleFlickCompositionStart);
  els.flickInput.addEventListener("compositionend", handleFlickCompositionEnd);
  els.flickInput.addEventListener("input", handleFlickInput);
  els.flickInput.addEventListener("focus", () => {
    flickState.keepFocus = true;
    updateBattleViewport();
  });
  els.flickInput.addEventListener("keydown", handleFlickKeydown);
  els.flickInput.addEventListener("beforeinput", handleFlickBeforeInput);
  els.typingStatus.addEventListener("click", () => {
    if (flickState.enabled && state.running && !isStoryDialogueOpen()) focusGameSurface();
  });
  window.visualViewport?.addEventListener("resize", updateBattleViewport);
  window.visualViewport?.addEventListener("scroll", updateBattleViewport);
  window.addEventListener("resize", updateBattleViewport);
  updateBattleViewport();
}
