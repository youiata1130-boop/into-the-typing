// Game-owned kana controls: no editable element is focused and no IME is opened.
const gameFlickKeys = [
  { id: "a", label: "あ", kana: ["あ", "い", "う", "え", "お"] },
  { id: "ka", label: "か", kana: ["か", "き", "く", "け", "こ"] },
  { id: "sa", label: "さ", kana: ["さ", "し", "す", "せ", "そ"] },
  { id: "ta", label: "た", kana: ["た", "ち", "つ", "て", "と"] },
  { id: "na", label: "な", kana: ["な", "に", "ぬ", "ね", "の"] },
  { id: "ha", label: "は", kana: ["は", "ひ", "ふ", "へ", "ほ"] },
  { id: "ma", label: "ま", kana: ["ま", "み", "む", "め", "も"] },
  { id: "ya", label: "や", kana: ["や", "", "ゆ", "", "よ"] },
  { id: "ra", label: "ら", kana: ["ら", "り", "る", "れ", "ろ"] },
  { id: "modifier", label: "小゛゜", action: "modifier", description: "小さい文字・濁点・半濁点" },
  { id: "wa", label: "わ", kana: ["わ", "を", "ん", "ー", ""] },
  { id: "long", label: "ー", kana: ["ー"], description: "長音" },
];
const gameFlickHoldMs = 300;
const gameFlickState = { gesture: null, popupTimerId: 0, touchIds: new Set(), multiTouch: false, nativeGesture: false };
const gameFlickUi = {
  surface: document.querySelector(".control-panel"),
  keyboard: document.querySelector("#flickKeyboard"),
  output: document.querySelector("#gameFlickText"),
  entry: document.querySelector("#gameFlickEntry"),
  popup: document.querySelector("#flickPopup"),
  buttons: [],
  choices: [],
};
// One bottom-left key cycles the same letter through its small/voiced forms.
const gameFlickModifierCycles = [
  "あぁ", "いぃ", "うぅゔ", "えぇ", "おぉ",
  "かが", "きぎ", "くぐ", "けげ", "こご",
  "さざ", "しじ", "すず", "せぜ", "そぞ",
  "ただ", "ちぢ", "つっづ", "てで", "とど",
  "はばぱ", "ひびぴ", "ふぶぷ", "へべぺ", "ほぼぽ",
  "やゃ", "ゆゅ", "よょ", "わゎ",
];

function getGameFlickModified(character, action) {
  if (action !== "modifier" || !character) return "";
  const cycle = gameFlickModifierCycles.find(item => item.includes(character));
  return cycle ? cycle[(cycle.indexOf(character) + 1) % cycle.length] : "";
}

function canUseGameFlickKeyboard() {
  return flickState.enabled && state.running && !isStoryDialogueOpen()
    && !state.specialInProgress && Boolean(getInputEnemy());
}

function refreshGameFlickText() {
  gameFlickUi.output.textContent = els.flickInput.value;
  gameFlickUi.entry.classList.toggle("is-pending", flickState.lastPending);
}

function syncGameFlickKeyboard() {
  const visible = flickState.enabled && state.running && !isStoryDialogueOpen();
  gameFlickUi.keyboard.hidden = !visible;
  const available = visible && canUseGameFlickKeyboard();
  const gesture = gameFlickState.gesture;
  if (gesture && (!available || gesture.key !== flickPromptKey())) cancelGameFlickGesture();
  const value = els.flickInput.value;
  for (const { button, definition } of gameFlickUi.buttons) {
    const actionAvailable = definition.action
      ? Boolean(getGameFlickModified(value.at(-1), definition.action)) : true;
    button.disabled = !available || !actionAvailable;
  }
  refreshGameFlickText();
}

function applyGameFlickKey(id, direction = 0, key = flickPromptKey()) {
  if (!canUseGameFlickKeyboard() || key !== flickPromptKey()) return false;
  const definition = gameFlickKeys.find(item => item.id === id);
  if (!definition) return false;
  let value = els.flickInput.value;
  let inputType = "insertText";
  if (definition.action) {
    const changed = getGameFlickModified(value.at(-1), definition.action);
    if (!changed) return false;
    value = value.slice(0, -1) + changed;
    inputType = "insertReplacementText";
  } else {
    const kana = definition.kana[direction];
    if (!kana) return false;
    value += kana;
  }
  // Invalidate delayed cleanup from a preceding answer before accepting this key.
  flickState.inputVersion += 1;
  els.flickInput.value = value;
  // A base kana may wait while the modifier key cycles to its voiced/small form.
  applyFlickValue(value, key, { composing: true, inputType });
  syncGameFlickKeyboard();
  return true;
}

function gameFlickDirection(dx, dy, threshold = 18) {
  if (Math.hypot(dx, dy) > 160) return -1;
  if (Math.hypot(dx, dy) < threshold) return 0;
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 3) : (dy < 0 ? 2 : 4);
}

function showGameFlickChoices(gesture) {
  const { definition, button, direction } = gesture;
  if (!definition.kana || definition.kana.length < 2) return;
  const bounds = button.getBoundingClientRect();
  const viewport = window.visualViewport;
  const left = viewport?.offsetLeft || 0;
  const top = viewport?.offsetTop || 0;
  const width = viewport?.width || window.innerWidth || 390;
  const height = viewport?.height || window.innerHeight || 800;
  const cellWidth = Math.min(64, bounds.width);
  const cellHeight = Math.min(58, bounds.height);
  const popupWidth = cellWidth * 3;
  const popupHeight = cellHeight * 3;
  gameFlickUi.popup.style.setProperty("--flick-choice-width", cellWidth + "px");
  gameFlickUi.popup.style.setProperty("--flick-choice-height", cellHeight + "px");
  gameFlickUi.popup.style.left = Math.max(left + 8, Math.min(left + width - popupWidth - 8,
    bounds.left + bounds.width / 2 - popupWidth / 2)) + "px";
  gameFlickUi.popup.style.top = Math.max(top + 8, Math.min(top + height - popupHeight - 8,
    bounds.top + bounds.height / 2 - popupHeight / 2)) + "px";
  gameFlickUi.popup.hidden = false;
  gameFlickUi.choices.forEach((choice, index) => {
    choice.textContent = definition.kana[index] || "";
    choice.hidden = !definition.kana[index];
    choice.classList.toggle("is-selected", direction === index);
  });
}

function beginGameFlickGesture(event, definition, button) {
  if (event.isPrimary === false || event.button > 0 || gameFlickState.gesture
      || gameFlickState.multiTouch || button.disabled || !canUseGameFlickKeyboard()) return;
  event.preventDefault();
  const bounds = button.getBoundingClientRect();
  const gesture = {
    pointerId: event.pointerId, definition, button, key: flickPromptKey(),
    x: event.clientX, y: event.clientY, direction: 0, choicesVisible: false,
    threshold: Math.min(18, bounds.width * 0.24),
  };
  gameFlickState.gesture = gesture;
  button.classList.add("is-pressed");
  button.setPointerCapture?.(event.pointerId);
  if (definition.kana?.length > 1) {
    gameFlickState.popupTimerId = window.setTimeout(() => {
      gameFlickState.popupTimerId = 0;
      if (gameFlickState.gesture !== gesture || gesture.key !== flickPromptKey() || !canUseGameFlickKeyboard()) return;
      gesture.choicesVisible = true;
      showGameFlickChoices(gesture);
    }, gameFlickHoldMs);
  }
}

function moveGameFlickGesture(event) {
  const gesture = gameFlickState.gesture;
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  event.preventDefault();
  gesture.direction = gameFlickDirection(event.clientX - gesture.x, event.clientY - gesture.y, gesture.threshold);
  if (gesture.definition.kana?.length === 1 && gesture.direction >= 0) gesture.direction = 0;
  // Fast flicks never wait for the long-press guide.
  if (gesture.direction > 0) gesture.choicesVisible = true;
  if (gesture.choicesVisible) showGameFlickChoices(gesture);
}

function cancelGameFlickGesture() {
  window.clearTimeout(gameFlickState.popupTimerId);
  gameFlickState.popupTimerId = 0;
  const gesture = gameFlickState.gesture;
  gameFlickState.gesture = null;
  gameFlickUi.popup.hidden = true;
  if (!gesture) return;
  gesture.button.classList.remove("is-pressed");
  if (gesture.button.hasPointerCapture?.(gesture.pointerId)) {
    gesture.button.releasePointerCapture(gesture.pointerId);
  }
}

function endGameFlickGesture(event) {
  const gesture = gameFlickState.gesture;
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  moveGameFlickGesture(event);
  const { definition, direction, key } = gesture;
  cancelGameFlickGesture();
  if (direction < 0 || (definition.action && direction !== 0)) return;
  applyGameFlickKey(definition.id, direction, key);
}

// Pointer prevention alone does not cancel Safari's native touch/gesture defaults.
// Keep the whole panel, including gaps and disabled keys, inside the input surface.
function isGameFlickSurface(target) {
  return target === gameFlickUi.surface || target === gameFlickUi.keyboard
    || target === gameFlickUi.entry || Boolean(target?.closest?.(".control-panel"));
}

function preventGameFlickDefault(event) {
  if (event.cancelable) event.preventDefault();
}

function guardGameFlickTouch(event) {
  const touches = Array.from(event.touches || []);
  const changed = Array.from(event.changedTouches || []);
  const visible = flickState.enabled && !gameFlickUi.keyboard.hidden;
  const onSurface = visible && (isGameFlickSurface(event.target)
    || touches.some(touch => isGameFlickSurface(touch.target))
    || changed.some(touch => isGameFlickSurface(touch.target)));
  if (!onSurface && !gameFlickState.touchIds.size) return;
  preventGameFlickDefault(event);
  gameFlickState.touchIds = new Set(touches.map(touch => touch.identifier));
  if (touches.length > 1) {
    gameFlickState.multiTouch = true;
    cancelGameFlickGesture();
  }
  if (!touches.length) {
    gameFlickState.multiTouch = false;
    gameFlickState.nativeGesture = false;
  }
  if (event.type === "touchcancel") cancelGameFlickGesture();
}

function guardGameFlickBrowserGesture(event) {
  const protectedTarget = flickState.enabled && !gameFlickUi.keyboard.hidden && isGameFlickSurface(event.target);
  if (!protectedTarget && !gameFlickState.touchIds.size && !gameFlickState.nativeGesture) return;
  preventGameFlickDefault(event);
  if (event.type.startsWith("gesture")) {
    gameFlickState.nativeGesture = event.type !== "gestureend";
    if (gameFlickState.touchIds.size) gameFlickState.multiTouch = true;
    cancelGameFlickGesture();
  }
}

function resetGameFlickInteraction() {
  cancelGameFlickGesture();
  gameFlickState.touchIds.clear();
  gameFlickState.multiTouch = false;
  gameFlickState.nativeGesture = false;
}

function initializeGameFlickKeyboard() {
  gameFlickUi.popup.hidden = true;
  for (let index = 0; index < 5; index++) {
    const choice = document.createElement("span");
    choice.className = "game-flick-choice";
    choice.dataset.direction = String(index);
    gameFlickUi.choices.push(choice);
    gameFlickUi.popup.appendChild(choice);
  }
  for (const definition of gameFlickKeys) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "game-flick-key";
    button.dataset.flickKey = definition.id;
    button.style.gridArea = definition.id;
    button.draggable = false;
    button.textContent = definition.label;
    button.setAttribute("aria-label", definition.description
      || definition.label + "行 " + definition.kana.filter(Boolean).join(" "));
    button.addEventListener("pointerdown", event => beginGameFlickGesture(event, definition, button));
    button.addEventListener("pointermove", moveGameFlickGesture);
    button.addEventListener("pointerup", endGameFlickGesture);
    for (const type of ["pointercancel", "lostpointercapture"]) {
      button.addEventListener(type, event => {
        if (gameFlickState.gesture?.pointerId === event.pointerId) cancelGameFlickGesture();
      });
    }
    button.addEventListener("contextmenu", event => event.preventDefault());
    button.addEventListener("click", event => {
      // Pointer input commits on release. Clicks with no pointer cover keyboard/AT activation.
      if (event.detail === 0 && !gameFlickState.gesture) {
        event.preventDefault();
        applyGameFlickKey(definition.id);
      }
    });
    button.addEventListener("keydown", event => {
      if (event.key === " " || event.key === "Enter") event.stopPropagation();
      const direction = { ArrowLeft: 1, ArrowUp: 2, ArrowRight: 3, ArrowDown: 4 }[event.key];
      if (direction && definition.kana) {
        event.preventDefault();
        event.stopPropagation();
        applyGameFlickKey(definition.id, direction);
      }
    });
    gameFlickUi.buttons.push({ button, definition });
    gameFlickUi.keyboard.appendChild(button);
  }
  for (const type of ["touchstart", "touchmove", "touchend", "touchcancel"]) {
    document.addEventListener(type, guardGameFlickTouch, { capture: true, passive: false });
  }
  for (const type of ["gesturestart", "gesturechange", "gestureend", "dblclick", "contextmenu", "selectstart", "dragstart", "wheel"]) {
    document.addEventListener(type, guardGameFlickBrowserGesture, { capture: true, passive: false });
  }
  for (const type of ["blur", "pagehide", "resize", "orientationchange"]) {
    window.addEventListener(type, resetGameFlickInteraction);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetGameFlickInteraction();
  });
}
