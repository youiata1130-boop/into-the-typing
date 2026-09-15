// Judge native text updates immediately while keeping IME events out of battle key handling.
const flickState = {
  enabled: false,
  battleGeneration: -1,
  composing: false,
  compositionKey: "",
  compositionConsumed: false,
  ignoreCommit: false,
  commitTimerId: 0,
  promptKey: "",
  lastValue: null,
  acceptedValue: "",
  lastPending: false,
  timerId: 0,
  resetTimerId: 0,
  inputVersion: 0,
  completedInput: null,
  carriedText: "",
  freshComposition: false,
  beforeInput: null,
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
  flickState.acceptedValue = "";
  flickState.lastPending = false;
  if (els.flickInput.value !== "") els.flickInput.value = "";
  els.flickInput.setSelectionRange?.(0, 0);
  els.flickInput.setAttribute("aria-invalid", "false");
  refreshGameFlickText();
}

function finishFlickInput(value, key) {
  const completed = {
    key,
    generation: state.battleGeneration,
    values: [...new Set([flickState.carriedText + value, value, getCurrentEnemy()?.translation, getFlickReading(getCurrentEnemy())?.reading].filter(Boolean))],
    composing: flickState.composing,
  };
  flickState.completedInput = completed;
  flickState.freshComposition = false;
  flickState.carriedText = "";
  renewFlickEditor();
  clearFlickInput();
  scheduleFlickReset(completed);
}

function renewFlickEditor(value = "") {
  const previous = els.flickInput;
  const focused = document.activeElement === previous;
  const next = previous.cloneNode(false);
  next.value = value;
  next.defaultValue = "";
  previous.removeAttribute("id");
  bindFlickEditor(next);
  // Switch the event owner before focus ends the old native composition.
  els.flickInput = next;
  flickState.composing = false;
  flickState.compositionKey = "";
  flickState.compositionConsumed = false;
  flickState.ignoreCommit = false;
  flickState.beforeInput = null;
  window.clearTimeout(flickState.commitTimerId);
  flickState.commitTimerId = 0;
  previous.insertAdjacentElement("afterend", next);
  // iOS can retain marked text after value = "". Transfer focus while the
  // old editor is still connected, then retire that native editing session.
  if (focused && state.running && !isStoryDialogueOpen() && !next.readOnly) {
    next.focus({ preventScroll: true });
  }
  previous.remove();
  previous.value = "";
  next.setSelectionRange?.(value.length, value.length);
}

function scheduleFlickReset(completed = flickState.completedInput) {
  if (!completed || completed.generation !== state.battleGeneration) return;
  const version = flickState.inputVersion;
  const editor = els.flickInput;
  window.clearTimeout(flickState.resetTimerId);
  // The IME may restore its marked text after our input handler has returned.
  flickState.resetTimerId = window.setTimeout(() => {
    flickState.resetTimerId = 0;
    if (els.flickInput !== editor || flickState.inputVersion !== version || flickState.completedInput !== completed
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
  if (flickState.battleGeneration !== state.battleGeneration) {
    flickState.battleGeneration = state.battleGeneration;
    flickState.composing = false;
    flickState.compositionKey = "";
    flickState.compositionConsumed = false;
    flickState.ignoreCommit = false;
    window.clearTimeout(flickState.commitTimerId);
    flickState.commitTimerId = 0;
    flickState.completedInput = null;
    flickState.carriedText = "";
    flickState.freshComposition = false;
    flickState.beforeInput = null;
    window.clearTimeout(flickState.resetTimerId);
    flickState.resetTimerId = 0;
  }
  if (flickState.promptKey !== key) {
    flickState.promptKey = key;
    clearFlickInput();
  }
  // This is an internal buffer; the visible keyboard and output are not editable.
  if (!els.flickInput.readOnly) els.flickInput.readOnly = true;
  els.flickInput.hidden = true;
  syncGameFlickKeyboard();
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
  refreshGameFlickText();
  scheduleBattleLayout();
}

function getFlickRoman(value, enemy, parsed = getFlickReading(enemy)) {
  const normalized = window.JAPANESE_INPUT.normalize(value);
  return /^[a-z-]*$/.test(normalized) ? normalized
    : window.JAPANESE_INPUT.match(value, enemy.word, enemy.translation, parsed);
}

function rejectFlickValue(value, enemy, key, inputType) {
  const parsed = getFlickReading(enemy);
  const normalized = window.JAPANESE_INPUT.normalize(value);
  const maximum = Math.max(parsed?.reading.length || 0, enemy.translation.length,
    ...enemy.inputs.map(input => input.length));
  let accepted = "";
  // Keep correct letters delivered together, stopping at the first wrong one.
  for (let length = Math.min(normalized.length, maximum); length > 0; length--) {
    const prefix = normalized.slice(0, length);
    const roman = getFlickRoman(prefix, enemy, parsed);
    if (roman !== null && enemy.inputs.some(input => input.startsWith(roman))) {
      accepted = prefix;
      break;
    }
  }
  // An invalid replacement must not erase letters already accepted.
  if (!accepted.startsWith(flickState.acceptedValue)) accepted = flickState.acceptedValue;
  const roman = getFlickRoman(accepted, enemy, parsed);
  const complete = enemy.inputs.includes(roman);
  const miss = !inputType.startsWith("delete");
  flickState.lastValue = accepted;
  flickState.acceptedValue = accepted;
  flickState.lastPending = false;
  flickState.freshComposition = false;
  flickState.carriedText = "";
  // End the rejected native composition as well as removing its visible text.
  // Late events stay attached to the retired editor and cannot restore the typo.
  renewFlickEditor(accepted);
  if (complete && miss) recordTypingMiss(enemy);
  applyTypedValue(enemy, roman);
  if (!complete && miss) recordTypingMiss(enemy);
  els.flickInput.setAttribute("aria-invalid", "true");
  if (enemy.resolving) finishFlickInput(accepted, key);
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
  flickState.lastValue = value;
  const parsed = getFlickReading(enemy);
  let roman = getFlickRoman(value, enemy, parsed);
  const pendingPrefix = composing && roman === null ? window.JAPANESE_INPUT.pendingPrefix(value, parsed) : null;
  flickState.lastPending = pendingPrefix !== null;
  if (flickState.lastPending) {
    roman = window.JAPANESE_INPUT.match(pendingPrefix, enemy.word, enemy.translation, parsed);
  }
  const valid = roman !== null && enemy.inputs.some(input => input.startsWith(roman));
  els.flickInput.setAttribute("aria-invalid", String(!valid));
  if (!valid) {
    rejectFlickValue(value, enemy, key, inputType);
    return;
  }
  flickState.acceptedValue = pendingPrefix ?? window.JAPANESE_INPUT.normalize(value);
  // Keep valid partial kana in the same editor; a full answer ends its session.
  if (flickState.composing && enemy.inputs.includes(roman)) flickState.compositionConsumed = true;
  applyTypedValue(enemy, roman);
  if (enemy.resolving) finishFlickInput(value, key);
}

function queueFlickInput(key = flickPromptKey()) {
  window.clearTimeout(flickState.timerId);
  const editor = els.flickInput;
  const value = editor.value;
  flickState.timerId = window.setTimeout(() => {
    flickState.timerId = 0;
    if (els.flickInput === editor && !flickState.composing) applyFlickValue(value, key);
  }, 0);
}

function handleFlickCompositionStart({ fromInput = false } = {}) {
  flickState.freshComposition = !fromInput;
  flickState.inputVersion += 1;
  if (!fromInput) removeRestoredFlickText();
  window.clearTimeout(flickState.timerId);
  window.clearTimeout(flickState.commitTimerId);
  flickState.timerId = 0;
  flickState.commitTimerId = 0;
  flickState.ignoreCommit = false;
  flickState.composing = true;
  flickState.compositionConsumed = false;
  flickState.compositionKey = flickPromptKey();
}

function handleFlickCompositionEnd(event = {}) {
  const completed = flickState.completedInput;
  if (completed?.generation === state.battleGeneration && completed.key !== flickPromptKey()
      && completed.values.includes(event.data) && flickState.lastValue !== null) {
    restoreCurrentFlickText();
    return;
  }
  flickState.freshComposition = false;
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
  applyFlickValue(els.flickInput.value,
    flickState.composing ? flickState.compositionKey : flickPromptKey(),
    { composing: flickState.composing && !commit, inputType });
}


function isCurrentFlickPrefix(value, composing = false) {
  const enemy = getCurrentEnemy();
  if (!enemy) return false;
  const parsed = getFlickReading(enemy);
  const roman = getFlickRoman(value, enemy, parsed);
  return (roman !== null && enemy.inputs.some(input => input.startsWith(roman)))
    || (composing && window.JAPANESE_INPUT.pendingPrefix(value, parsed) !== null);
}

function restoreCurrentFlickText() {
  const value = flickState.lastValue || "";
  els.flickInput.value = value;
  els.flickInput.setSelectionRange?.(value.length, value.length);
}

// An IME can send completed text again, including the next word's first letters.
function reconcileFlickInput(event, before) {
  const completed = flickState.completedInput;
  if (!completed || completed.generation !== state.battleGeneration) return false;
  const value = els.flickInput.value;
  const differentPrompt = completed.key !== flickPromptKey();
  const freshPlainInput = before && event.inputType === "insertText"
    && typeof event.data === "string" && before.value + event.data === value;
  const fresh = flickState.freshComposition || freshPlainInput || event.inputType === "insertFromPaste";
  const matchesCurrent = differentPrompt && isCurrentFlickPrefix(value, event.isComposing);
  const continuedComposition = completed.composing && !fresh && event.isComposing;
  const restartedWithOldText = event.isComposing && flickState.lastValue === null && !matchesCurrent;
  const staleCommit = ["insertText", "insertReplacementText", "insertFromComposition"].includes(event.inputType)
    && !freshPlainInput && !matchesCurrent;
  if (!event.inputType?.startsWith("delete") && completed.values.includes(value) && (!differentPrompt || staleCommit || event.inputType === "insertFromComposition"
      || (!fresh && (!matchesCurrent || continuedComposition)))) {
    restoreCurrentFlickText();
    return true;
  }
  const prefix = [flickState.carriedText, ...completed.values].filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .find(text => value.startsWith(text) && (text === flickState.carriedText
      || (differentPrompt && (!fresh || restartedWithOldText) && (!matchesCurrent || continuedComposition))));
  if (prefix) {
    flickState.carriedText = prefix;
    els.flickInput.value = value.slice(prefix.length);
    els.flickInput.setSelectionRange?.(els.flickInput.value.length, els.flickInput.value.length);
  } else if (flickState.carriedText) {
    flickState.carriedText = "";
  }
  return false;
}

function handleFlickInput(event) {
  const before = flickState.beforeInput;
  flickState.beforeInput = null;
  flickState.inputVersion += 1;
  if (reconcileFlickInput(event, before)) {
    if (flickState.lastValue === null) scheduleFlickReset();
    return;
  }
  if (event.isComposing && !flickState.composing) handleFlickCompositionStart({ fromInput: true });
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
  flickState.beforeInput = { value: els.flickInput.value };
  removeRestoredFlickText();
  if (!["insertLineBreak", "insertParagraph"].includes(event.inputType)) return;
  if (event.cancelable) event.preventDefault();
  readFlickInput({ commit: true, inputType: event.inputType });
}

function bindFlickEditor(editor) {
  for (const [type, handler] of [
    ["compositionstart", handleFlickCompositionStart],
    ["compositionend", handleFlickCompositionEnd],
    ["input", handleFlickInput],
    ["focus", updateBattleViewport],
    ["keydown", handleFlickKeydown],
    ["beforeinput", handleFlickBeforeInput],
  ]) {
    editor.addEventListener(type, event => {
      // Blur/commit events from a retired editor must not touch the next word.
      if (editor === els.flickInput) handler(event);
    });
  }
}

function initializeFlickInput() {
  initializeGameFlickKeyboard();
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
  bindFlickEditor(els.flickInput);
  els.typingStatus.addEventListener("click", () => {
    if (flickState.enabled && state.running && !isStoryDialogueOpen()) focusGameSurface({ userGesture: true });
  });
  initializeBattleLayout();
}
