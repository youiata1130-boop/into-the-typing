const saveSlots = window.createPlayerSaveSlots(() => window.localStorage);
let activeSaveSlot = null;
let activeSaveToken = null;
const saveMenuState = { mode: "new", selectedSlot: null, selectedRaw: null, nameComposing: false };
const saveEls = {
  screen: document.querySelector("#saveScreen"),
  title: document.querySelector("#saveTitle"),
  list: document.querySelector("#saveChoices"),
  slots: [1, 2, 3].map(number => document.querySelector("#saveSlot" + number)),
  back: document.querySelector("#saveBackButton"),
  continueButton: document.querySelector("#continueButton"),
  form: document.querySelector("#newPlayerForm"),
  name: document.querySelector("#playerNameInput"),
  overwrite: document.querySelector("#overwriteNotice"),
  submit: document.querySelector("#createPlayerButton"),
  cancel: document.querySelector("#cancelPlayerButton"),
  error: document.querySelector("#saveError"),
  playerName: document.querySelector("#currentPlayerName"),
  titleButton: document.querySelector("#titleButton"),
};

function getSaveEntry(index) {
  try { return saveSlots.read(index); }
  catch { return { raw: null, data: null, error: "セーブデータを読み込めません" }; }
}

function refreshSaveMenu() {
  let anySave = false;
  saveEls.slots.forEach((button, index) => {
    const entry = getSaveEntry(index);
    const saved = entry.data;
    anySave ||= Boolean(saved);
    button.querySelector("[data-save-name]").textContent = saved?.name || (entry.error ? "読み込めないデータ" : "空き");
    button.querySelector("[data-save-detail]").textContent = saved
      ? "Lv." + progression.restore(saved.progress).level + " ／ ステージ" + (saved.progress.equipmentTutorialCompleted ? "2" : "1")
      : "";
    button.disabled = saveMenuState.mode === "continue" && !saved;
  });
  saveEls.continueButton.disabled = !anySave;
}

function showSaveMenu(mode) {
  if (!assetLoadingState.ready) return;
  saveMenuState.mode = mode === "continue" ? "continue" : "new";
  saveMenuState.selectedSlot = null;
  saveEls.title.textContent = saveMenuState.mode === "new" ? "初めから" : "続きから";
  saveEls.list.hidden = false;
  saveEls.form.hidden = true;
  saveEls.error.textContent = "";
  refreshSaveMenu();
  showScreen("saves");
  (saveEls.slots.find(button => !button.disabled) || saveEls.back).focus({ preventScroll: true });
}

function activatePlayerSave(index, entry = saveSlots.read(index)) {
  if (!entry.data) return false;
  // Stop the previous player's callbacks before restoring the selected progression.
  resetGame();
  activeSaveSlot = index;
  activeSaveToken = entry.raw;
  Object.assign(state, loadPlayerProgress(entry.data.progress), { playerName: entry.data.name, stageId: defaultStageId });
  state.playableEnemyWaves = buildPlayableEnemyWaves(getStageDefinition(defaultStageId).waves);
  state.roundLimit = getRoundLimit(state.playableEnemyWaves);
  state.progressNotice = "";
  progressionSaveAvailable = true;
  saveEls.playerName.textContent = state.playerName;
  resetGame();
  return true;
}

function selectSaveSlot(index) {
  if (!Number.isInteger(index) || index < 0 || index > 2 || !assetLoadingState.ready) return;
  const entry = getSaveEntry(index);
  saveEls.error.textContent = "";
  if (saveMenuState.mode === "continue") {
    if (!entry.data) {
      saveEls.error.textContent = entry.error || "セーブデータがありません";
      return;
    }
    if (activatePlayerSave(index, entry)) {
      if (state.swordEquipPending) showWeaponScreen(); else showStageSelect();
    }
    return;
  }
  saveMenuState.selectedSlot = index;
  saveMenuState.selectedRaw = entry.raw;
  saveMenuState.nameComposing = false;
  saveEls.name.value = "";
  saveEls.overwrite.textContent = entry.raw !== null
    ? (entry.data?.name || "この枠のデータ") + "を上書きします" : "";
  saveEls.overwrite.hidden = entry.raw === null;
  saveEls.submit.textContent = entry.raw === null ? "はじめる" : "上書きしてはじめる";
  saveEls.list.hidden = true;
  saveEls.form.hidden = false;
  saveEls.name.focus({ preventScroll: true });
}

function createPlayerSave() {
  const index = saveMenuState.selectedSlot;
  if (saveMenuState.nameComposing || saveMenuState.mode !== "new" || index === null || !assetLoadingState.ready) return;
  const name = saveSlots.normalizeName(saveEls.name.value);
  if (!name || [...name].length > 20) {
    saveEls.error.textContent = "名前を1〜20文字で入力してください";
    saveEls.name.focus({ preventScroll: true });
    return;
  }
  try {
    const initial = loadPlayerProgress();
    const entry = saveSlots.write(index, name, playerProgressSnapshot(initial), saveMenuState.selectedRaw);
    activatePlayerSave(index, entry);
    saveMenuState.selectedSlot = null;
    showStageSelect();
  } catch (error) {
    saveEls.error.textContent = error.message.includes("選び直して") ? error.message : "保存できませんでした。もう一度お試しください";
  }
}

function initializeSaveMenu() {
  try { saveSlots.migrateLegacy(); } catch { progressionSaveAvailable = false; }
  refreshSaveMenu();
  els.introStartButton.addEventListener("click", () => showSaveMenu("new"));
  saveEls.continueButton.addEventListener("click", () => showSaveMenu("continue"));
  saveEls.slots.forEach((button, index) => button.addEventListener("click", () => selectSaveSlot(index)));
  saveEls.back.addEventListener("click", showStartScreen);
  saveEls.titleButton.addEventListener("click", showStartScreen);
  saveEls.cancel.addEventListener("click", () => showSaveMenu("new"));
  saveEls.form.addEventListener("submit", event => { event.preventDefault(); createPlayerSave(); });
  saveEls.name.addEventListener("compositionstart", () => { saveMenuState.nameComposing = true; });
  saveEls.name.addEventListener("compositionend", () => { saveMenuState.nameComposing = false; });
  saveEls.name.addEventListener("keydown", event => {
    if (event.key === "Enter" && (event.isComposing || event.keyCode === 229 || saveMenuState.nameComposing)) event.preventDefault();
  });
}
