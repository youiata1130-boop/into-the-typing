// Game-owned kana controls: no editable element is focused and no IME is opened.
const gameFlickKeys = [
  { id: "a", label: "あ", kana: ["あ", "い", "う", "え", "お"] },
  { id: "ka", label: "か", kana: ["か", "き", "く", "け", "こ"] },
  { id: "sa", label: "さ", kana: ["さ", "し", "す", "せ", "そ"] },
  { id: "delete", label: "⌫", action: "delete", description: "1文字削除" },
  { id: "ta", label: "た", kana: ["た", "ち", "つ", "て", "と"] },
  { id: "na", label: "な", kana: ["な", "に", "ぬ", "ね", "の"] },
  { id: "ha", label: "は", kana: ["は", "ひ", "ふ", "へ", "ほ"] },
  { id: "dakuten", label: "゛", action: "dakuten", description: "濁点" },
  { id: "ma", label: "ま", kana: ["ま", "み", "む", "め", "も"] },
  { id: "ya", label: "や", kana: ["や", "", "ゆ", "", "よ"] },
  { id: "ra", label: "ら", kana: ["ら", "り", "る", "れ", "ろ"] },
  { id: "handakuten", label: "゜", action: "handakuten", description: "半濁点" },
  { id: "small", label: "小", action: "small", description: "小さい文字" },
  { id: "wa", label: "わ", kana: ["わ", "を", "ん", "ー", ""] },
  { id: "long", label: "ー", kana: ["ー"], description: "長音" },
];
const gameFlickState = { gesture: null };
const gameFlickUi = {
  keyboard: document.querySelector("#flickKeyboard"),
  output: document.querySelector("#gameFlickText"),
  feedback: document.querySelector("#gameFlickFeedback"),
  entry: document.querySelector("#gameFlickEntry"),
  popup: document.querySelector("#flickPopup"),
  buttons: [],
  choices: [],
};
const gameFlickModifiers = {
  dakuten: ["かきくけこさしすせそたちつてとはひふへほう", "がぎぐげござじずぜぞだぢづでどばびぶべぼゔ"],
  handakuten: ["はひふへほばびぶべぼ", "ぱぴぷぺぽぱぴぷぺぽ"],
  small: ["あいうえおつやゆよわ", "ぁぃぅぇぉっゃゅょゎ"],
};

function getGameFlickModified(character, action) {
  const pair = gameFlickModifiers[action];
  if (!pair || !character) return "";
  const index = pair[0].indexOf(character);
  if (index >= 0) return pair[1][index];
  const reverse = pair[1].indexOf(character);
  return reverse >= 0 ? pair[0][reverse] : "";
}

function canUseGameFlickKeyboard() {
  return flickState.enabled && state.running && !isStoryDialogueOpen()
    && !state.specialInProgress && Boolean(getInputEnemy());
}

function refreshGameFlickText() {
  gameFlickUi.output.textContent = els.flickInput.value;
  const invalid = els.flickInput.getAttribute("aria-invalid") === "true";
  gameFlickUi.entry.classList.toggle("is-error", invalid);
  gameFlickUi.entry.classList.toggle("is-pending", flickState.lastPending);
  gameFlickUi.feedback.textContent = invalid ? "ミス" : "";
}

function syncGameFlickKeyboard() {
  const visible = flickState.enabled && state.running && !isStoryDialogueOpen();
  gameFlickUi.keyboard.hidden = !visible;
  const available = visible && canUseGameFlickKeyboard();
  const gesture = gameFlickState.gesture;
  if (gesture && (!available || gesture.key !== flickPromptKey())) cancelGameFlickGesture();
  const value = els.flickInput.value;
  for (const { button, definition } of gameFlickUi.buttons) {
    const actionAvailable = definition.action === "delete" ? Boolean(value)
      : definition.action ? Boolean(getGameFlickModified(value.at(-1), definition.action)) : true;
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
  if (definition.action === "delete") {
    if (!value) return false;
    value = value.slice(0, -1);
    inputType = "deleteContentBackward";
  } else if (definition.action) {
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
  // A base kana may wait for its explicit dakuten/small-kana button.
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
  const size = 126;
  gameFlickUi.popup.style.left = Math.max(left + 8, Math.min(left + width - size - 8,
    bounds.left + bounds.width / 2 - size / 2)) + "px";
  gameFlickUi.popup.style.top = Math.max(top + 8, Math.min(top + height - size - 8,
    bounds.top - size - 8)) + "px";
  gameFlickUi.popup.hidden = false;
  gameFlickUi.choices.forEach((choice, index) => {
    choice.textContent = definition.kana[index] || "";
    choice.hidden = !definition.kana[index];
    choice.classList.toggle("is-selected", direction === index);
  });
}

function beginGameFlickGesture(event, definition, button) {
  if (event.isPrimary === false || event.button > 0 || gameFlickState.gesture
      || button.disabled || !canUseGameFlickKeyboard()) return;
  event.preventDefault();
  const bounds = button.getBoundingClientRect();
  const gesture = {
    pointerId: event.pointerId, definition, button, key: flickPromptKey(),
    x: event.clientX, y: event.clientY, direction: 0,
    threshold: Math.min(18, bounds.width * 0.24),
  };
  gameFlickState.gesture = gesture;
  button.classList.add("is-pressed");
  button.setPointerCapture?.(event.pointerId);
  showGameFlickChoices(gesture);
}

function moveGameFlickGesture(event) {
  const gesture = gameFlickState.gesture;
  if (!gesture || gesture.pointerId !== event.pointerId) return;
  event.preventDefault();
  gesture.direction = gameFlickDirection(event.clientX - gesture.x, event.clientY - gesture.y, gesture.threshold);
  if (gesture.definition.kana?.length === 1 && gesture.direction >= 0) gesture.direction = 0;
  showGameFlickChoices(gesture);
}

function cancelGameFlickGesture() {
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

function initializeGameFlickKeyboard() {
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
  for (const type of ["blur", "pagehide", "resize", "orientationchange"]) {
    window.addEventListener(type, cancelGameFlickGesture);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelGameFlickGesture();
  });
}
