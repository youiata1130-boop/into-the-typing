const mountainCapture = {
  active: false, completed: false, prompt: null,
  deadline: 0, durationMs: 0, timerId: 0, escapeTimerId: 0,
};
const capturePassageStorageKey = "into-the-typing.capture-passages.v1";
const capturePassageCycle = loadCapturePassageCycle();

function loadCapturePassageCycle() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(capturePassageStorageKey));
    return {
      remaining: Array.isArray(saved?.remaining)
        ? [...new Set(saved.remaining)].filter(id => Object.hasOwn(capturePassages, id)) : [],
      lastId: typeof saved?.lastId === "string" ? saved.lastId : "",
    };
  } catch { return { remaining: [], lastId: "" }; }
}

function chooseCapturePassage(passageIds) {
  const ids = [...new Set(passageIds)].filter(id => Object.hasOwn(capturePassages, id));
  if (!ids.length) return null;
  capturePassageCycle.remaining = capturePassageCycle.remaining
    .filter(id => ids.includes(id) && id !== capturePassageCycle.lastId);
  if (!capturePassageCycle.remaining.length) {
    const shuffled = [...ids];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
    }
    if (shuffled.length > 1 && shuffled[0] === capturePassageCycle.lastId) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }
    capturePassageCycle.remaining = shuffled;
  }
  const id = capturePassageCycle.remaining.shift();
  capturePassageCycle.lastId = id;
  // Keep the cycle across retries and reloads, even when an attempt times out.
  try { window.localStorage.setItem(capturePassageStorageKey, JSON.stringify(capturePassageCycle)); } catch {}
  return { id, passage: capturePassages[id] };
}

const captureUi = {
  scene: document.querySelector("#captureScene"),
  bird: document.querySelector("#captureBird"),
  hero: document.querySelector("#captureHero"),
  hud: document.querySelector("#captureHud"),
  heading: document.querySelector("#captureHeading"),
  time: document.querySelector("#captureTime"),
  meter: document.querySelector("#captureMeter"),
  fill: document.querySelector("#captureTimeFill"),
  source: document.querySelector("#captureSource"),
};

function isMountainCaptureActive() {
  return mountainCapture.active;
}

function clearMountainCapture(resetProgress = true) {
  window.clearTimeout(mountainCapture.timerId);
  window.clearTimeout(mountainCapture.escapeTimerId);
  mountainCapture.timerId = mountainCapture.escapeTimerId = 0;
  mountainCapture.active = false;
  mountainCapture.prompt = null;
  mountainCapture.deadline = 0;
  if (resetProgress) mountainCapture.completed = false;
  captureUi.scene.hidden = captureUi.hud.hidden = captureUi.source.hidden = true;
  els.battleScreen.classList.remove("is-captured", "is-escaping");
}

function failMountainCapture() {
  if (!mountainCapture.active || mountainCapture.prompt.resolving) return;
  mountainCapture.prompt.resolving = true;
  state.hp = 0;
  finishGame(false, "時間切れ：大鳥から脱出できなかった");
}

function tickMountainCapture() {
  mountainCapture.timerId = 0;
  if (!mountainCapture.active || mountainCapture.prompt.resolving) return;
  const remaining = Math.max(0, mountainCapture.deadline - performance.now());
  captureUi.time.textContent = `残り${Math.ceil(remaining / 1000)}秒`;
  captureUi.meter.setAttribute("aria-valuenow", String(Math.ceil(remaining / 1000)));
  captureUi.fill.style.width = `${remaining / mountainCapture.durationMs * 100}%`;
  captureUi.hud.dataset.urgent = String(remaining <= 10000);
  if (!remaining) { failMountainCapture(); return; }
  mountainCapture.timerId = scheduleBattleTimeout(tickMountainCapture, Math.min(100, remaining));
}

function tryStartMountainCapture() {
  const config = getStageDefinition(state.stageId).capture;
  if (!state.running || !config || mountainCapture.completed || state.activeEnemies.length
      || state.cleared !== config.afterDefeats) return false;
  const selection = chooseCapturePassage(config.passageIds);
  if (!selection) return false;
  const { id: passageId, passage } = selection;
  clearInputBuffer();
  clearPlayerGuard();
  clearPlayerCounter();
  clearPlayerAttackAnimation();
  clearPlayerAttackCooldown();
  clearEnemyActionStop();
  clearNoticeTimer();
  hideGameNotice();
  mountainCapture.active = mountainCapture.completed = true;
  mountainCapture.durationMs = config.durationMs;
  mountainCapture.deadline = performance.now() + config.durationMs;
  const inputs = getWordInputs(passage);
  mountainCapture.prompt = {
    id: "mountain-capture", passageId, inputRevision: 1, weaponId: getBattleWeaponId(),
    word: passage.text, readingOverride: passage.reading, flickRoman: "",
    inputs, matchedWord: inputs[0], translation: passage.translation,
    typed: "", bestLength: 0, typingMisses: 0, chargeInputProgress: 0, resolving: false,
  };
  captureUi.bird.src = config.birdImage;
  captureUi.hero.src = getPlayerWeaponAssets(getBattleWeaponId()).idle;
  captureUi.scene.hidden = captureUi.hud.hidden = captureUi.source.hidden = false;
  captureUi.heading.textContent = "入力して脱出！";
  captureUi.meter.setAttribute("aria-valuemax", String(config.durationMs / 1000));
  captureUi.source.textContent = `${passage.author}『${passage.title}』`;
  captureUi.source.setAttribute("href", passage.source);
  els.battleScreen.classList.add("is-captured");
  window.GAME_SOUND.play("impact");
  tickMountainCapture();
  updateHud();
  renderWord();
  scheduleBattleLayout();
  focusGameSurface();
  return true;
}

function escapeMountainCapture() {
  mountainCapture.prompt.resolving = true;
  window.clearTimeout(mountainCapture.timerId);
  mountainCapture.timerId = 0;
  clearInputBuffer();
  captureUi.heading.textContent = "脱出！";
  captureUi.time.textContent = "";
  els.battleScreen.classList.add("is-escaping");
  window.GAME_SOUND.play("defeat");
  mountainCapture.escapeTimerId = scheduleBattleTimeout(() => {
    clearMountainCapture(false);
    clearInputBuffer();
    state.selectedEnemyId = "";
    queueNextEnemy();
    updateHud();
    renderWord();
    scheduleBattleLayout();
  }, 650);
}

function applyCaptureTypedValue(value) {
  const prompt = mountainCapture.prompt;
  if (!state.running || !mountainCapture.active || prompt.resolving) return;
  // An input event cannot beat an expired deadline when background timers are delayed.
  if (performance.now() >= mountainCapture.deadline) { failMountainCapture(); return; }
  const normalized = normalizeTypedValue(value);
  const match = prompt.inputs.find(input => input.startsWith(normalized));
  if (!match) { recordTypingMiss(prompt); return; }
  const advanced = normalized.length > prompt.typed.length;
  prompt.typed = normalized;
  prompt.matchedWord = match;
  renderWord();
  if (prompt.inputs.includes(normalized)) escapeMountainCapture();
  else if (advanced) window.GAME_SOUND.play("typing");
}
