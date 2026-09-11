// Judge native text updates immediately while keeping IME events out of battle key handling.
const flickState = {
  enabled: false,
  composing: false,
  compositionKey: "",
  compositionConsumed: false,
  ignoreCommit: false,
  commitTimerId: 0,
  promptKey: "",
  lastValue: null,
  lastPending: false,
  timerId: 0,
  resetTimerId: 0,
  inputVersion: 0,
  completedInput: null,
  carriedText: "",
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
  flickState.lastPending = false;
  if (els.flickInput.value !== "") els.flickInput.value = "";
  els.flickInput.setSelectionRange?.(0, 0);
  els.flickInput.setAttribute("aria-invalid", "false");
}

function finishFlickInput(value, key) {
  const completed = {
    key,
    generation: state.battleGeneration,
    values: [...new Set([flickState.carriedText + value, value])],
  };
  flickState.completedInput = completed;
  flickState.carriedText = "";
  clearFlickInput();
  scheduleFlickReset(completed);
}

function scheduleFlickReset(completed = flickState.completedInput) {
  if (!completed || completed.generation !== state.battleGeneration) return;
  const version = flickState.inputVersion;
  window.clearTimeout(flickState.resetTimerId);
  // The IME may restore its marked text after our input handler has returned.
  flickState.resetTimerId = window.setTimeout(() => {
    flickState.resetTimerId = 0;
    if (flickState.inputVersion !== version || flickState.completedInput !== completed
        || completed.generation !== state.battleGeneration) return;
    clearFlickInput();
    flickState.composing = false;
    flickState.compositionKey = "";
    flickState.compositionConsumed = false;
  }, 0);
}

function removeRestoredFlickText() {
  const completed = flickState.completedInput;
  if (!completed || completed.generation !== state.battleGeneration
      || completed.key === flickPromptKey() || flickState.lastValue !== null) return;
  const restored = completed.values.find(value => value && value === els.flickInput.value);
  if (!restored) return;
  flickState.carriedText = restored;
  clearFlickInput();
}

function syncFlickInput() {
  const key = flickPromptKey();
  if (flickState.completedInput?.generation !== state.battleGeneration) {
    flickState.completedInput = null;
    flickState.carriedText = "";
    window.clearTimeout(flickState.resetTimerId);
    flickState.resetTimerId = 0;
  }
  if (flickState.promptKey !== key) {
    flickState.promptKey = key;
    clearFlickInput();
  }
  const readOnly = !state.running || isStoryDialogueOpen();
  // Reapplying editability on every render can disrupt a mobile keyboard session.
  if (els.flickInput.readOnly !== readOnly) els.flickInput.readOnly = readOnly;
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
  const nativeReading = window.JAPANESE_INPUT.normalize(els.flickInput.value);
  const pending = flickState.lastPending ? window.JAPANESE_INPUT.pendingPrefix(nativeReading, parsed) : null;
  const visibleReading = nativeReading && parsed.reading.startsWith(nativeReading) ? nativeReading : pending ?? typedReading;
  const confirmed = parsed.reading.startsWith(visibleReading) ? visibleReading.length : 0;
  els.typedWord.textContent = parsed.reading.slice(0, confirmed);
  els.remainingWord.textContent = parsed.reading.slice(confirmed);
  scheduleBattleLayout();
}

function applyFlickValue(value, key = flickPromptKey(), { composing = false, inputType = "" } = {}) {
  const enemy = getCurrentEnemy();
  if (!key || key !== flickPromptKey()) return;
  if (!enemy || enemy.resolving || state.specialInProgress) {
    if (flickState.composing) flickState.compositionConsumed = true;
    clearFlickInput();
    return;
  }
  if (flickState.lastValue === value && !(flickState.lastPending && !composing)) return;
  const previousValue = flickState.lastValue;
  flickState.lastValue = value;
  const normalized = window.JAPANESE_INPUT.normalize(value);
  const parsed = getFlickReading(enemy);
  let roman = /^[a-z-]*$/.test(normalized)
    ? normalized
    : window.JAPANESE_INPUT.match(value, enemy.word, enemy.translation, parsed);
  const pendingPrefix = composing && roman === null ? window.JAPANESE_INPUT.pendingPrefix(value, parsed) : null;
  flickState.lastPending = pendingPrefix !== null;
  if (flickState.lastPending) {
    roman = window.JAPANESE_INPUT.match(pendingPrefix, enemy.word, enemy.translation, parsed);
  }
  const valid = roman !== null && enemy.inputs.some(input => input.startsWith(roman));
  els.flickInput.setAttribute("aria-invalid", String(!valid));
  if (!valid) {
    const previous = previousValue === null ? "" : window.JAPANESE_INPUT.normalize(previousValue);
    const deleting = inputType.startsWith("delete") || (normalized.length < previous.length && previous.startsWith(normalized));
    // Erasing an error never removes its penalty or counts the same error again.
    if (!deleting) recordTypingMiss(enemy);
    return;
  }
  // Clear the native composition only after a full answer, without blurring the editor.
  if (flickState.composing && enemy.inputs.includes(roman)) flickState.compositionConsumed = true;
  applyTypedValue(enemy, roman);
  if (enemy.resolving) finishFlickInput(value, key);
}

function queueFlickInput(key = flickPromptKey()) {
  window.clearTimeout(flickState.timerId);
  const value = els.flickInput.value;
  flickState.timerId = window.setTimeout(() => {
    flickState.timerId = 0;
    if (!flickState.composing) applyFlickValue(value, key);
  }, 0);
}

function handleFlickCompositionStart() {
  flickState.inputVersion += 1;
  removeRestoredFlickText();
  window.clearTimeout(flickState.timerId);
  window.clearTimeout(flickState.commitTimerId);
  flickState.timerId = 0;
  flickState.commitTimerId = 0;
  flickState.ignoreCommit = false;
  flickState.composing = true;
  flickState.compositionConsumed = false;
  flickState.compositionKey = flickPromptKey();
}

function handleFlickCompositionEnd() {
  const key = flickState.compositionKey;
  const consumed = flickState.compositionConsumed;
  flickState.composing = false;
  flickState.compositionKey = "";
  flickState.compositionConsumed = false;
  if (!key || key !== flickPromptKey() || consumed) {
    clearFlickInput();
    scheduleFlickReset();
    // Some keyboards send one more input event for the already answered composition.
    flickState.ignoreCommit = true;
    window.clearTimeout(flickState.commitTimerId);
    flickState.commitTimerId = window.setTimeout(() => {
      flickState.commitTimerId = 0;
      flickState.ignoreCommit = false;
    }, 0);
    return;
  }
  stripFlickLineBreaks();
  queueFlickInput(key);
}

function stripFlickLineBreaks() {
  const value = els.flickInput.value.replace(/[\r\n]/g, "");
  if (value !== els.flickInput.value) els.flickInput.value = value;
}

function readFlickInput({ commit = false, inputType = "" } = {}) {
  flickState.inputVersion += 1;
  window.clearTimeout(flickState.timerId);
  flickState.timerId = 0;
  if (flickState.ignoreCommit || (flickState.composing
      && (flickState.compositionConsumed || flickState.compositionKey !== flickPromptKey()))) {
    clearFlickInput();
    scheduleFlickReset();
    return;
  }
  stripFlickLineBreaks();
  if (flickState.carriedText) {
    const value = els.flickInput.value;
    if (value.startsWith(flickState.carriedText)) {
      els.flickInput.value = value.slice(flickState.carriedText.length);
      els.flickInput.setSelectionRange?.(els.flickInput.value.length, els.flickInput.value.length);
    } else {
      flickState.carriedText = "";
    }
  }
  applyFlickValue(els.flickInput.value,
    flickState.composing ? flickState.compositionKey : flickPromptKey(),
    { composing: flickState.composing && !commit, inputType });
}

function handleFlickInput(event) {
  const completed = flickState.completedInput;
  if (event.inputType === "insertFromComposition" && completed?.generation === state.battleGeneration
      && completed.values.includes(els.flickInput.value)
      && (!flickState.composing || flickState.compositionConsumed || flickState.compositionKey === completed.key)) {
    // A late commit belongs to the completed word, even after the next prompt opened.
    const currentValue = flickState.lastValue || "";
    els.flickInput.value = currentValue;
    els.flickInput.setSelectionRange?.(currentValue.length, currentValue.length);
    return;
  }
  if (event.isComposing && !flickState.composing) handleFlickCompositionStart();
  readFlickInput({ inputType: event.inputType || "" });
}

function handleFlickKeydown(event) {
  if (event.key !== "Enter") return;
  // Prevent the keyboard action even during composition; input already drives combat.
  event.preventDefault();
  event.stopPropagation?.();
  readFlickInput({ commit: true });
}

function handleFlickBeforeInput(event) {
  removeRestoredFlickText();
  if (!["insertLineBreak", "insertParagraph"].includes(event.inputType)) return;
  if (event.cancelable) event.preventDefault();
  readFlickInput({ commit: true, inputType: event.inputType });
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
    updateBattleViewport();
  });
  els.flickInput.addEventListener("keydown", handleFlickKeydown);
  els.flickInput.addEventListener("beforeinput", handleFlickBeforeInput);
  els.typingStatus.addEventListener("click", () => {
    if (flickState.enabled && state.running && !isStoryDialogueOpen()) focusGameSurface({ userGesture: true });
  });
  initializeBattleLayout();
}
