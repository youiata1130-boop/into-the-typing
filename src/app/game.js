// Game data and settings are loaded by index.html before this script.
const progression = window.PLAYER_PROGRESSION;
const defaultPlayerStats = progression.defaultStats;
const progressionStorageKey = "into-the-typing.player.v2";
let progressionSaveAvailable = true;
const attackMs = 8200;
const repeatAttackMs = 2200;
const knockbackAmount = 0.14;
const startNoticeMs = 850;
const inputBufferRetryMs = 24;
const inputBufferRetentionMs = 1400;
const inputBufferMax = 32;
const playerAttackMs = 480;
const greatswordImpactDelayMs = 180;
const greatswordImpactMs = 820;
const specialGaugeMax = 100;
const specialDamage = 3;
const enemyAnimations = window.ENEMY_ANIMATIONS || {
  defaultEnemy: "goblin_level_1",
  frameMs: 140,
  enemies: {
    egg_level_1: {
      idle: [
        "src/assets/images/enemies/egg/level_1/idle/frame_01.png",
        "src/assets/images/enemies/egg/level_1/idle/frame_02.png",
        "src/assets/images/enemies/egg/level_1/idle/frame_03.png",
        "src/assets/images/enemies/egg/level_1/idle/frame_02.png",
      ],
      attack: ["src/assets/images/enemies/egg/level_1/attack/frame_02.png"],
      damage: ["src/assets/images/enemies/egg/level_1/damage/frame_02.png"],
      defeat: ["src/assets/images/enemies/egg/level_1/defeat/frame_02.png"],
    },
    chick_level_1: {
      idle: [
        "src/assets/images/enemies/chick/level_1/idle/frame_01.png",
        "src/assets/images/enemies/chick/level_1/idle/frame_01.png",
        "src/assets/images/enemies/chick/level_1/idle/frame_02.png",
        "src/assets/images/enemies/chick/level_1/idle/frame_02.png",
      ],
      attack: ["src/assets/images/enemies/chick/level_1/attack/frame_02.png"],
      damage: ["src/assets/images/enemies/chick/level_1/damage/frame_02.png"],
      defeat: ["src/assets/images/enemies/chick/level_1/defeat/frame_02.png"],
    },
    chicken_level_1: {
      idle: ["src/assets/images/enemies/chicken/level_1/idle/frame_02.png"],
      attack: ["src/assets/images/enemies/chicken/level_1/attack/frame_02.png"],
      damage: ["src/assets/images/enemies/chicken/level_1/damage/frame_02.png"],
      defeat: ["src/assets/images/enemies/chicken/level_1/defeat/frame_02.png"],
    },
    chicken_level_2: {
      idle: ["src/assets/images/enemies/chicken/level_2/idle/frame_02.png"],
      attack: ["src/assets/images/enemies/chicken/level_2/attack/frame_02.png"],
      damage: ["src/assets/images/enemies/chicken/level_2/damage/frame_02.png"],
      defeat: ["src/assets/images/enemies/chicken/level_2/defeat/frame_02.png"],
    },
    goblin_level_1: {
      idle: ["src/assets/images/enemies/goblin/level_1/idle/frame_02.png"],
      attack: ["src/assets/images/enemies/goblin/level_1/attack/frame_02.png"],
      damage: ["src/assets/images/enemies/goblin/level_1/damage/frame_02.png"],
      defeat: ["src/assets/images/enemies/goblin/level_1/defeat/frame_02.png"],
    },
    goblin_level_2: {
      idle: ["src/assets/images/enemies/goblin/level_2/idle/frame_02.png"],
      attack: ["src/assets/images/enemies/goblin/level_2/attack/frame_02.png"],
      damage: ["src/assets/images/enemies/goblin/level_2/damage/frame_02.png"],
      defeat: ["src/assets/images/enemies/goblin/level_2/defeat/frame_02.png"],
    },
    goblin_level_3: {
      idle: ["src/assets/images/enemies/goblin/level_3/idle/frame_02.png"],
      attack: ["src/assets/images/enemies/goblin/level_3/attack/frame_02.png"],
      damage: ["src/assets/images/enemies/goblin/level_3/damage/frame_02.png"],
      defeat: ["src/assets/images/enemies/goblin/level_3/defeat/frame_02.png"],
    },
  },
};

function hasEnemyVisuals(enemyType) {
  return Boolean(enemyAnimations.enemies?.[enemyType]?.idle?.length);
}

function getWaveEnemyTypes(wave) {
  const configuredTypes = wave.types?.length ? wave.types : [wave.type || enemyAnimations.defaultEnemy];
  const count = Math.max(0, wave.count || configuredTypes.length);

  return Array.from({ length: count }, (_, index) => configuredTypes[index % configuredTypes.length]).filter(hasEnemyVisuals);
}

function getStageDefinition(stageId) {
  return stageDefinitions[stageId] || stageDefinitions[defaultStageId];
}

function getWeaponDefinition(weaponId = defaultWeaponId) {
  if (weaponId === unarmedWeapon.id) return unarmedWeapon;
  return weaponDefinitions[weaponId] || weaponDefinitions[defaultWeaponId];
}

function getBattleWeaponId() {
  return isUnarmedStory() ? unarmedWeapon.id : state.weaponId;
}

function getActiveWeapon() {
  return getWeaponDefinition(getBattleWeaponId());
}

function getPlayerWeaponAssets(weaponId = defaultWeaponId) {
  return playerWeaponAssets[weaponId] || playerWeaponAssets[defaultWeaponId];
}

function buildPlayableEnemyWaves(waves) {
  return waves
    .map((wave) => {
      const types = getWaveEnemyTypes(wave);

      return { ...wave, types, count: types.length };
    })
    .filter((wave) => wave.count > 0);
}

function getRoundLimit(waves) {
  return waves.reduce((total, wave) => total + wave.count, 0);
}

function updateEnemyTypeDataset(waves) {
  document.documentElement.dataset.enemyTypes = [...new Set(waves.flatMap((wave) => wave.types))].join(",");
}

const initialPlayableEnemyWaves = buildPlayableEnemyWaves(getStageDefinition(defaultStageId).waves);
updateEnemyTypeDataset(initialPlayableEnemyWaves);

function loadPlayerProgress() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(progressionStorageKey) || "null");
    if (saved?.version === 2) {
      return {
        ...progression.restore(saved),
        weaponId: saved.introCompleted === true && Object.hasOwn(weaponDefinitions, saved.weaponId) ? saved.weaponId : defaultWeaponId,
        introCompleted: saved.introCompleted === true,
      };
    }
  } catch {
    progressionSaveAvailable = false;
  }
  return { ...progression.restore(), weaponId: defaultWeaponId, introCompleted: false };
}

function savePlayerProgress() {
  try {
    window.localStorage.setItem(progressionStorageKey, JSON.stringify({
      version: 2,
      totalExperience: state.totalExperience,
      stats: state.stats,
      weaponId: state.weaponId,
      introCompleted: state.introCompleted,
    }));
    progressionSaveAvailable = true;
  } catch {
    progressionSaveAvailable = false;
  }
}

function getMaxHp() {
  return progression.maxHp(state.level);
}

const state = {
  language: "ja",
  stageId: defaultStageId,
  pendingStageId: "",
  ...loadPlayerProgress(),
  running: false,
  storyPhase: "none",
  storyPunches: 0,
  hp: progression.rules.baseHp,
  pendingExperience: 0,
  battleExperience: 0,
  battleLevelsGained: 0,
  progressNotice: "",
  score: 0,
  combo: 0,
  successStreak: 0,
  specialGauge: 0,
  specialInProgress: false,
  cleared: 0,
  currentWaveIndex: 0,
  currentWaveSpawned: 0,
  playableEnemyWaves: initialPlayableEnemyWaves,
  roundLimit: getRoundLimit(initialPlayableEnemyWaves),
  activeEnemies: [],
  selectedEnemyId: "",
  nextEnemyId: 1,
  battleGeneration: 0,
  perfect: true,
  currentWord: "start",
  currentInputs: ["start"],
  currentMatchedWord: "start",
  currentTranslation: "はじめ",
  currentWordBestLength: 0,
  typed: "",
  roundStart: 0,
  rafId: 0,
  specialEffectTimerId: 0,
  bossIntroTimerId: 0,
  noticeTimerId: 0,
  startDelayTimerId: 0,
  inputBufferTimerId: 0,
  playerAttackTimerId: 0,
  greatswordImpactDelayTimerId: 0,
  greatswordImpactTimerId: 0,
  inputBuffer: [],
  usedWords: [],
};

function invalidateBattleGeneration() {
  state.battleGeneration += 1;
}

function scheduleBattleTimeout(callback, delay) {
  const battleGeneration = state.battleGeneration;

  return window.setTimeout(() => {
    if (state.battleGeneration !== battleGeneration) {
      return;
    }

    callback();
  }, delay);
}

const els = {
  scoreLabel: document.querySelector("#scoreLabel"),
  scoreText: document.querySelector("#scoreText"),
  comboLabel: document.querySelector("#comboLabel"),
  comboText: document.querySelector("#comboText"),
  player: document.querySelector(".player"),
  playerFrameIdle: document.querySelector("#playerFrameIdle"),
  playerFrameCharge: document.querySelector("#playerFrameCharge"),
  playerFrameWindup: document.querySelector("#playerFrameWindup"),
  playerFrameStrike: document.querySelector("#playerFrameStrike"),
  playerHpTrack: document.querySelector("#playerHpTrack"),
  playerHpFill: document.querySelector("#playerHpFill"),
  specialButton: document.querySelector("#specialButton"),
  specialEffect: document.querySelector("#specialEffect"),
  arena: document.querySelector(".arena"),
  greatswordImpact: document.querySelector("#greatswordImpact"),
  bossIntro: document.querySelector("#bossIntro"),
  bossIntroKicker: document.querySelector("#bossIntroKicker"),
  bossIntroTitle: document.querySelector("#bossIntroTitle"),
  bossIntroText: document.querySelector("#bossIntroText"),
  wordTranslation: document.querySelector("#wordTranslation"),
  typedWord: document.querySelector("#typedWord"),
  remainingWord: document.querySelector("#remainingWord"),
  typingLabel: document.querySelector("#typingLabel"),
  typingStatus: document.querySelector("#typingStatus"),
  flickInput: document.querySelector("#flickInput"),
  typingBox: document.querySelector(".typing-box"),
  storyDialog: document.querySelector("#storyDialog"),
  storyText: document.querySelector("#storyText"),
  storyItem: document.querySelector("#storyItem"),
  storyNextButton: document.querySelector("#storyNextButton"),
  battleWeaponName: document.querySelector("#battleWeaponName"),
  weaponCharge: document.querySelector("#weaponCharge"),
  weaponChargeText: document.querySelector("#weaponChargeText"),
  weaponDamagePreview: document.querySelector("#weaponDamagePreview"),
  weaponChargeMeter: document.querySelector("#weaponChargeMeter"),
  weaponChargeFill: document.querySelector("#weaponChargeFill"),
  startScreen: document.querySelector("#startScreen"),
  stageScreen: document.querySelector("#stageScreen"),
  statusScreen: document.querySelector("#statusScreen"),
  battleScreen: document.querySelector("#battleScreen"),
  introStartButton: document.querySelector("#introStartButton"),
  statusButton: document.querySelector("#statusButton"),
  stageSelectButton: document.querySelector("#stageSelectButton"),
  statusPanel: document.querySelector("#statusPanel"),
  levelText: document.querySelector("#levelText"),
  statusHpText: document.querySelector("#statusHpText"),
  experienceText: document.querySelector("#experienceText"),
  experienceRemainingText: document.querySelector("#experienceRemainingText"),
  experienceMeter: document.querySelector("#experienceMeter"),
  experienceFill: document.querySelector("#experienceFill"),
  skillPointsText: document.querySelector("#skillPointsText"),
  skillFeedback: document.querySelector("#skillFeedback"),
  progressSaveStatus: document.querySelector("#progressSaveStatus"),
  battleLevelText: document.querySelector("#battleLevelText"),
  battleExperienceText: document.querySelector("#battleExperienceText"),
  battleExperienceMeter: document.querySelector("#battleExperienceMeter"),
  battleExperienceFill: document.querySelector("#battleExperienceFill"),
  progressionNotice: document.querySelector("#progressionNotice"),
  statusAttackText: document.querySelector("#statusAttackText"),
  statusAgilityText: document.querySelector("#statusAgilityText"),
  statusWordLengthText: document.querySelector("#statusWordLengthText"),
  startButton: document.querySelector("#startButton"),
  resetButton: document.querySelector("#resetButton"),
  keyHint: document.querySelector("#keyHint"),
  gameNotice: document.querySelector("#gameNotice"),
  noticeKicker: document.querySelector("#noticeKicker"),
  noticeTitle: document.querySelector("#noticeTitle"),
  noticeText: document.querySelector("#noticeText"),
  noticeButton: document.querySelector("#noticeButton"),
  stageChoices: document.querySelector("#stageChoices"),
  stageConfirm: document.querySelector("#stageConfirm"),
  stageConfirmName: document.querySelector("#stageConfirmName"),
  stageConfirmMeta: document.querySelector("#stageConfirmMeta"),
  stageConfirmStart: document.querySelector("#stageConfirmStart"),
  stageConfirmCancel: document.querySelector("#stageConfirmCancel"),
  lane: document.querySelector("#lane"),
  enemyLayer: document.querySelector("#enemyLayer"),
};

function labels() {
  return languageLabels.ja;
}

function words() {
  return wordSets.ja;
}

function updateLanguageText() {
  const t = labels();
  document.documentElement.lang = "ja";
  els.scoreLabel.textContent = t.score;
  els.comboLabel.textContent = t.combo;
  els.typingLabel.textContent = t.input;
  els.introStartButton.textContent = t.start;
  els.startButton.textContent = state.running ? t.restart : t.start;
  els.specialButton.textContent = t.special;
  els.noticeButton.textContent = t.stageSelect;
  els.stageSelectButton.textContent = t.stageSelect;
  els.stageConfirmStart.textContent = t.confirmStart;
  els.stageConfirmCancel.textContent = t.confirmCancel;
  els.keyHint.textContent = t.specialKeyHint;
}

function getSpecialGaugeSettings() {
  return {
    ...defaultSpecialGaugeSettings,
    ...(getStageDefinition(state.stageId).specialGauge || {}),
  };
}

function getWordLengthSettings() {
  return {
    normalMin: 0,
    bossMin: 7,
    ...(getStageDefinition(state.stageId).wordLength || {}),
  };
}

function getStatValue(stat) {
  return state.stats?.[stat] ?? defaultPlayerStats[stat] ?? 1;
}

function getAdjustedWordLengthSettings(weaponId = state.weaponId) {
  const base = getWordLengthSettings();
  const reduction = getStatValue("agility") - defaultPlayerStats.agility;
  const normalBaseMax = base.normalMax ?? Math.max(base.normalMin + 8, 8);
  const bossBaseMax = base.bossMax ?? Math.max(base.bossMin + 8, normalBaseMax + 2);
  let normalMin = base.normalMin;
  let bossMin = base.bossMin;
  let normalMax = normalBaseMax;
  let bossMax = bossBaseMax;
  const weaponWordLength = getWeaponDefinition(weaponId).wordLength;

  if (weaponWordLength?.fixed) {
    return {
      normalMin: Math.max(2, weaponWordLength.normalMin - reduction),
      normalMax: Math.max(2, weaponWordLength.normalMax - reduction),
      bossMin: Math.max(2, weaponWordLength.bossMin - reduction),
      bossMax: Math.max(2, weaponWordLength.bossMax - reduction),
    };
  }

  if (weaponWordLength) {
    normalMin = Math.max(normalMin, weaponWordLength.normalMin || 0);
    bossMin = Math.max(bossMin, weaponWordLength.bossMin || normalMin);
    normalMax = Math.max(normalMax, normalMin + (weaponWordLength.maxSpan || 0));
    bossMax = Math.max(bossMax, bossMin + (weaponWordLength.maxSpan || 0));
  }

  return {
    normalMin: Math.max(2, normalMin - reduction),
    normalMax: Math.max(minimumWordMaxLength, normalMax - reduction),
    bossMin: Math.max(2, bossMin - reduction),
    bossMax: Math.max(minimumWordMaxLength, bossMax - reduction),
  };
}

function getWeaponDamageMultiplier(enemy = null) {
  const weapon = getWeaponDefinition(enemy?.weaponId || getBattleWeaponId());

  if (weapon.id !== "greatsword") {
    return weapon.damageMultiplier || 1;
  }

  const misses = Math.max(0, Math.round(enemy?.typingMisses || 0));
  return Math.max(
    weapon.minDamageMultiplier,
    weapon.maxDamageMultiplier - misses * weapon.missPenalty,
  );
}

function getPlayerAttackDamage(enemy = null) {
  const weaponId = enemy?.weaponId || getBattleWeaponId();
  if (weaponId === unarmedWeapon.id) return unarmedWeapon.damage;
  const damage = getStatValue("attack") * getWeaponDamageMultiplier(enemy);
  return weaponId === "branch" ? Math.round(damage * 10) / 10 : Math.max(1, Math.round(damage));
}

function getSpecialGain() {
  if (isUnarmedStory()) return 0;
  const settings = getSpecialGaugeSettings();

  if (state.successStreak < settings.chargeStartStreak) {
    return 0;
  }

  const chargedStreak = Math.min(state.successStreak, settings.streakCap) - settings.chargeStartStreak + 1;
  const streakBonus = chargedStreak * settings.gainPerStreak;

  return settings.baseGain + streakBonus;
}

function chargeSpecialGauge() {
  state.specialGauge = Math.min(specialGaugeMax, state.specialGauge + getSpecialGain());
}

function addSuccessfulCharacters(characterCount) {
  for (let i = 0; i < characterCount; i += 1) {
    state.successStreak += 1;
    chargeSpecialGauge();
  }
}

function resetSuccessStreak() {
  state.successStreak = 0;
}

function isSpecialReady() {
  return !isUnarmedStory() && !isStoryDialogueOpen() && state.specialGauge >= specialGaugeMax;
}

function updateStatusPanel() {
  const activeWeapon = getActiveWeapon();
  els.levelText.textContent = state.level;
  els.statusHpText.textContent = `${Math.max(0, Math.round(state.hp))} / ${getMaxHp()}`;
  els.statusAttackText.textContent = getStatValue("attack");
  els.statusAgilityText.textContent = getStatValue("agility");
  const wordLength = getAdjustedWordLengthSettings();
  els.statusWordLengthText.textContent = `通常 ${wordLength.normalMin}〜${wordLength.normalMax}文字 / ボス ${wordLength.bossMin}〜${wordLength.bossMax}文字`;
  const required = progression.experienceToNextLevel(state.level);
  const atMaxLevel = required === 0;
  const experienceLabel = atMaxLevel ? "MAX" : `${state.experience} / ${required} EXP`;
  els.experienceText.textContent = experienceLabel;
  els.experienceRemainingText.textContent = atMaxLevel
    ? "最高レベルに到達しました"
    : `次のレベルまで ${required - state.experience} EXP ・ 最大HP +10 / スキルポイント +1`;
  els.skillPointsText.textContent = state.skillPoints;
  els.battleLevelText.textContent = `Lv. ${state.level}`;
  els.battleExperienceText.textContent = experienceLabel;
  for (const [meter, fill] of [
    [els.experienceMeter, els.experienceFill],
    [els.battleExperienceMeter, els.battleExperienceFill],
  ]) {
    meter.setAttribute("aria-valuemax", String(required || 1));
    meter.setAttribute("aria-valuenow", String(atMaxLevel ? 1 : state.experience));
    meter.setAttribute("aria-valuetext", experienceLabel);
    fill.style.width = `${atMaxLevel ? 100 : state.experience / required * 100}%`;
  }
  els.statusButton.textContent = state.skillPoints > 0 ? `ステータス（SP ${state.skillPoints}）` : "ステータス";
  els.progressSaveStatus.textContent = progressionSaveAvailable
    ? "育成状況はこのブラウザに自動保存されます。"
    : "保存できないため、育成状況はこのページを開いている間だけ保持されます。";
  els.progressionNotice.textContent = state.progressNotice;
  els.progressionNotice.hidden = !state.progressNotice;
  document.documentElement.dataset.weapon = activeWeapon.id;

  els.statusPanel.querySelectorAll("input[name='weapon']").forEach((input) => {
    input.checked = input.value === activeWeapon.id;
    input.disabled = state.running || (!state.introCompleted && input.value !== defaultWeaponId);
  });

  els.statusPanel.querySelectorAll("[data-stat][data-stat-delta]").forEach((button) => {
    const stat = button.dataset.stat;
    const capped = getStatValue(stat) >= progression.rules.statMax[stat];
    button.disabled = state.running || !progression.canUpgrade(state, stat);
    button.textContent = capped ? "MAX" : "＋1";
    button.title = capped ? "強化上限です" : state.skillPoints > 0 ? "スキルポイントを1使って強化" : "レベルアップでスキルポイントを獲得";
  });
}

function syncPlayerWeaponArt(weapon, chargePose = 0) {
  const assets = getPlayerWeaponAssets(weapon.id);
  const frames = [
    [els.playerFrameIdle, assets.idle],
    [els.playerFrameWindup, assets.windup],
    [els.playerFrameStrike, assets.strike],
  ];

  if (assets.charge) {
    frames.push([els.playerFrameCharge, assets.charge[chargePose]]);
  }

  frames.forEach(([frame, src]) => {
    if (frame.getAttribute("src") !== src) {
      frame.src = src;
    }
  });

  const playerLabel = weapon.id === "unarmed" ? "素手で構える主人公" : `${weapon.name}を装備した主人公`;
  els.playerFrameIdle.alt = playerLabel;
  els.player.setAttribute("aria-label", playerLabel);
}

function updateWeaponCharge() {
  const t = labels();
  const selectedEnemy = getCurrentEnemy();
  const weapon = getWeaponDefinition(selectedEnemy?.weaponId || getBattleWeaponId());
  const isGreatsword = weapon.id === "greatsword";
  const typedLength = selectedEnemy?.typed.length || 0;
  const totalLength = selectedEnemy?.matchedWord.length || 0;
  const misses = selectedEnemy?.typingMisses || 0;
  // Only characters entered since the last miss contribute to the current wind-up.
  const chargeStartLength = Math.min(typedLength, selectedEnemy?.chargeStartLength || 0);
  const chargedLength = Math.max(0, typedLength - chargeStartLength);
  const meterMaximum = Math.max(1, totalLength - chargeStartLength);
  const chargeProgress = Math.min(1, chargedLength / meterMaximum);
  const chargePercent = chargeProgress * 100;
  const chargeLevel = chargedLength > 0 ? Math.min(4, Math.ceil(chargeProgress * 4)) : 0;
  const poseCount = getPlayerWeaponAssets(weapon.id).charge?.length || 1;
  const chargePose = Math.min(poseCount - 1, Math.floor(chargeProgress * poseCount));
  const damage = getPlayerAttackDamage(
    selectedEnemy || { weaponId: weapon.id, typingMisses: 0 },
  );

  syncPlayerWeaponArt(weapon, chargePose);
  els.battleWeaponName.textContent = weapon.name;
  els.weaponCharge.hidden = !isGreatsword;
  els.typingStatus.dataset.weapon = weapon.id;
  els.player.dataset.weapon = weapon.id;
  els.player.dataset.chargeLevel = String(isGreatsword ? chargeLevel : 0);
  els.player.dataset.chargePose = String(isGreatsword ? chargePose : 0);
  els.player.style.setProperty("--greatsword-charge", chargeProgress.toFixed(3));
  els.player.style.setProperty("--greatsword-charge-scale", (0.7 + chargeProgress * 0.62).toFixed(3));
  els.player.style.setProperty("--greatsword-charge-opacity", (0.16 + chargeProgress * 0.84).toFixed(3));
  els.player.style.setProperty("--greatsword-charge-blur", `${Math.round(4 + chargeProgress * 18)}px`);
  els.player.style.setProperty("--greatsword-charge-speed", `${(1.05 - chargeProgress * 0.42).toFixed(2)}s`);
  els.player.classList.toggle(
    "is-charging",
    Boolean(
      isGreatsword
      && state.running
      && selectedEnemy
      && !selectedEnemy.resolving
      && !state.specialInProgress
      && chargedLength > 0
      && typedLength < totalLength
    ),
  );

  if (!isGreatsword) {
    return;
  }

  els.weaponChargeText.textContent = totalLength
    ? t.weaponChargeText(chargedLength, meterMaximum, misses)
    : t.weaponChargeReady;
  els.weaponDamagePreview.textContent = t.weaponDamagePreview(damage);
  els.weaponChargeFill.style.width = `${chargePercent}%`;
  els.weaponCharge.dataset.penalized = String(misses > 0);
  els.weaponChargeMeter.setAttribute("aria-valuemax", String(meterMaximum));
  els.weaponChargeMeter.setAttribute("aria-valuenow", String(chargedLength));
  els.weaponChargeMeter.setAttribute(
    "aria-valuetext",
    totalLength
      ? `ため${meterMaximum}文字中${chargedLength}文字、ミス${misses}回、予想${damage}ダメージ`
      : `入力待ち、予想${damage}ダメージ`,
  );
}

function updateHud() {
  const playerHp = Math.max(0, Math.min(state.hp, getMaxHp()));
  els.scoreText.textContent = state.score;
  els.comboText.textContent = state.combo;
  els.playerHpFill.style.width = `${(playerHp / getMaxHp()) * 100}%`;
  els.playerHpTrack.setAttribute("aria-valuemax", String(getMaxHp()));
  els.playerHpTrack.setAttribute("aria-valuenow", String(playerHp));
  const hasResolvingEnemy = state.activeEnemies.some((enemy) => enemy.hp > 0 && enemy.resolving);
  els.specialButton.disabled = (
    !state.running
    || state.specialInProgress
    || hasResolvingEnemy
    || !isSpecialReady()
    || !state.activeEnemies.some((enemy) => enemy.hp > 0)
  );
  updateWeaponCharge();
  updateStatusPanel();
}

function showScreen(screen) {
  els.startScreen.hidden = screen !== "start";
  els.stageScreen.hidden = screen !== "stage";
  els.statusScreen.hidden = screen !== "status";
  els.battleScreen.hidden = screen !== "battle";
  document.documentElement.dataset.screen = screen;
  updateBattleViewport();
}

function focusStartSurface() {
  els.introStartButton.focus({ preventScroll: true });
}

function focusGameSurface() {
  if (flickState.enabled && state.running && !isStoryDialogueOpen()) {
    els.flickInput.focus({ preventScroll: true });
    return;
  }
  document.body.tabIndex = -1;
  document.body.focus({ preventScroll: true });
}

function focusStageSurface() {
  const focusedStage = els.stageChoices.querySelector(".stage-choice.is-selected:not(:disabled)");
  const firstStage = els.stageChoices.querySelector(".stage-choice:not(:disabled)");
  (focusedStage || firstStage || els.statusButton).focus({ preventScroll: true });
}

function focusStatusSurface() {
  const selectedWeapon = els.statusPanel.querySelector("input[name='weapon']:checked");
  const attackButton = els.statusPanel.querySelector("[data-stat='attack'][data-stat-delta='1']");
  (selectedWeapon || attackButton || els.stageSelectButton).focus({ preventScroll: true });
}

function hideGameNotice() {
  els.gameNotice.classList.remove("is-visible", "is-actionable");
  els.gameNotice.setAttribute("aria-hidden", "true");
}

function clearNoticeTimer() {
  window.clearTimeout(state.noticeTimerId);
  state.noticeTimerId = 0;
}

function clearStartDelayTimer() {
  window.clearTimeout(state.startDelayTimerId);
  state.startDelayTimerId = 0;
}

function clearInputBufferTimer() {
  window.clearTimeout(state.inputBufferTimerId);
  state.inputBufferTimerId = 0;
}

function clearInputBuffer() {
  clearInputBufferTimer();
  state.inputBuffer = [];
}

function trimInputBuffer(now = performance.now()) {
  const oldestQueuedAt = now - inputBufferRetentionMs;

  while (state.inputBuffer.length && state.inputBuffer[0].queuedAt < oldestQueuedAt) {
    state.inputBuffer.shift();
  }
}

function scheduleBufferedInputFlush() {
  if (!state.running || !state.inputBuffer.length || state.inputBufferTimerId) {
    return;
  }

  state.inputBufferTimerId = scheduleBattleTimeout(() => {
    state.inputBufferTimerId = 0;
    flushBufferedInput();
  }, inputBufferRetryMs);
}

function enqueueBufferedInput(action, value = "") {
  if (!state.running || state.specialInProgress || isUnarmedStory() || isStoryDialogueOpen()) {
    return;
  }

  trimInputBuffer();
  state.inputBuffer.push({
    action,
    value,
    queuedAt: performance.now(),
  });

  if (state.inputBuffer.length > inputBufferMax) {
    state.inputBuffer.splice(0, state.inputBuffer.length - inputBufferMax);
  }

  scheduleBufferedInputFlush();
}

function applyBufferedInputEntry(enemy, entry) {
  setTargetEnemy(enemy);

  if (entry.action === "letter") {
    applyTypedValue(enemy, enemy.typed + entry.value);
    return;
  }

  if (entry.action === "backspace") {
    applyTypedValue(enemy, enemy.typed.slice(0, -1));
  }
}

function flushBufferedInput() {
  if (!state.running || isStoryDialogueOpen()) {
    clearInputBuffer();
    return;
  }

  clearInputBufferTimer();
  trimInputBuffer();

  while (state.inputBuffer.length) {
    const targetEnemy = getInputEnemy();

    if (!targetEnemy) {
      scheduleBufferedInputFlush();
      return;
    }

    const entry = state.inputBuffer.shift();
    applyBufferedInputEntry(targetEnemy, entry);

    if (!state.running || targetEnemy.resolving || !state.activeEnemies.includes(targetEnemy)) {
      break;
    }

    trimInputBuffer();
  }

  if (state.inputBuffer.length) {
    scheduleBufferedInputFlush();
  }
}

function showGameNotice(kind, kicker, title, text, options = {}) {
  const { persistent = false, duration = 900 } = options;

  clearNoticeTimer();
  els.gameNotice.dataset.kind = kind;
  els.noticeKicker.textContent = kicker;
  els.noticeTitle.textContent = title;
  els.noticeText.textContent = text;
  els.gameNotice.classList.toggle("is-actionable", persistent);
  els.gameNotice.classList.add("is-visible");
  els.gameNotice.setAttribute("aria-hidden", "false");

  if (!persistent) {
    state.noticeTimerId = scheduleBattleTimeout(() => {
      state.noticeTimerId = 0;
      if (state.running) {
        hideGameNotice();
        focusGameSurface();
      }
    }, duration);
  }
}

function isStoryDialogueOpen() {
  return state.storyPhase === "encounter" || state.storyPhase === "weapon-offer";
}

function isUnarmedStory() {
  return ["encounter", "unarmed", "weapon-offer"].includes(state.storyPhase);
}

function setStoryPhase(phase) {
  state.storyPhase = phase;
  const dialogueOpen = isStoryDialogueOpen();
  els.battleScreen.dataset.storyPhase = phase;
  els.storyDialog.hidden = !dialogueOpen;
  els.storyItem.hidden = phase !== "weapon-offer";
  els.typingBox.hidden = dialogueOpen;
  els.storyText.textContent = phase === "encounter" ? "敵が現れた！" : phase === "weapon-offer" ? "これを使って！" : "";
}

function showStoryDialogue(phase) {
  setStoryPhase(phase);
  cancelAnimationFrame(state.rafId);
  clearInputBuffer();
  clearEnemyAnimationTimers();
  updateHud();
  renderWord();
  els.storyNextButton.focus({ preventScroll: true });
}

function advanceStory() {
  if (!state.running || !isStoryDialogueOpen()) return;
  clearInputBuffer();

  if (state.storyPhase === "encounter") {
    setStoryPhase("unarmed");
    spawnNextEnemy();
  } else {
    setStoryPhase("armed");
    clearPlayerAttackAnimation();
    state.weaponId = getStageDefinition(state.stageId).storyIntro.weaponId;
    state.introCompleted = true;
    state.activeEnemies.forEach((enemy) => {
      enemy.weaponId = state.weaponId;
      enemy.resolving = false;
      enemy.nextAttackAt = performance.now() + repeatAttackMs;
      setNextWord(enemy);
      playEnemyAnimation(enemy, "idle");
    });
    setTargetEnemy(getCurrentEnemy());
    savePlayerProgress();
  }

  updateHud();
  startLoop();
  focusGameSurface();
}

function syncStageButtons() {
  els.stageChoices.querySelectorAll("[data-stage]").forEach((button) => {
    const stageId = button.dataset.stage;
    const stage = stageDefinitions[stageId];
    const isEnabled = Boolean(stage?.enabled);
    const isSelected = isEnabled && stageId === state.pendingStageId;
    const code = button.querySelector(".stage-code");
    const name = button.querySelector(".stage-name");
    const meta = button.querySelector(".stage-meta");

    button.disabled = !isEnabled;
    button.setAttribute("aria-disabled", String(!isEnabled));
    button.setAttribute("aria-controls", "stageConfirm");
    button.setAttribute("aria-expanded", String(isSelected));
    button.classList.toggle("is-selected", isSelected);

    if (!stage) {
      button.setAttribute("aria-label", "利用できないステージ");
      return;
    }

    button.setAttribute("aria-label", [stage.code, stage.name, isEnabled ? "" : stage.meta].filter(Boolean).join(" "));

    if (code) {
      code.textContent = stage.code;
    }

    if (name) {
      name.textContent = stage.name;
    }

    if (meta) {
      meta.textContent = stage.meta;
    }
  });
}

function hideStageConfirm() {
  state.pendingStageId = "";
  els.stageConfirm.hidden = true;
  syncStageButtons();
}

function cancelPendingStageSelection() {
  const selectedStageId = state.pendingStageId;
  const selectedStageButton = [...els.stageChoices.querySelectorAll(".stage-choice[data-stage]")].find(
    (button) => button.dataset.stage === selectedStageId && !button.disabled,
  );

  hideStageConfirm();
  (selectedStageButton || els.stageChoices.querySelector(".stage-choice:not(:disabled)") || els.statusButton).focus({
    preventScroll: true,
  });
}

function showStageConfirm(stageId) {
  const stage = stageDefinitions[stageId];

  if (!stage?.enabled) {
    return;
  }

  state.pendingStageId = stageId;
  els.stageConfirmName.textContent = stage.name;
  els.stageConfirmMeta.textContent = stage.meta;
  els.stageConfirm.hidden = false;
  syncStageButtons();
  els.stageConfirmStart.focus({ preventScroll: true });
}

function startConfirmedStage() {
  const stageId = state.pendingStageId;
  const stage = stageDefinitions[stageId];

  if (!stage?.enabled) {
    return;
  }

  hideStageConfirm();
  startGame(stageId);
}

function showStartScreen() {
  setStoryPhase("none");
  invalidateBattleGeneration();
  state.running = false;
  state.pendingStageId = "";
  cancelAnimationFrame(state.rafId);
  clearStartDelayTimer();
  clearInputBuffer();
  clearPlayerAttackAnimation();
  clearNoticeTimer();
  clearSpecialEffect();
  clearBossIntro();
  clearEnemies();
  hideGameNotice();
  updateLanguageText();
  updateHud();
  syncStageButtons();
  els.stageConfirm.hidden = true;
  showScreen("start");
  focusStartSurface();
}

function showStageSelect() {
  setStoryPhase("none");
  state.pendingExperience = 0;
  invalidateBattleGeneration();
  state.running = false;
  state.pendingStageId = "";
  state.hp = getMaxHp();
  cancelAnimationFrame(state.rafId);
  clearStartDelayTimer();
  clearInputBuffer();
  clearPlayerAttackAnimation();
  clearNoticeTimer();
  clearSpecialEffect();
  clearBossIntro();
  clearEnemies();
  hideGameNotice();
  updateLanguageText();
  updateHud();
  syncStageButtons();
  els.stageConfirm.hidden = true;
  showScreen("stage");
  focusStageSurface();
}

function showStatusScreen() {
  setStoryPhase("none");
  invalidateBattleGeneration();
  state.running = false;
  state.pendingStageId = "";
  cancelAnimationFrame(state.rafId);
  clearStartDelayTimer();
  clearInputBuffer();
  clearPlayerAttackAnimation();
  clearNoticeTimer();
  clearSpecialEffect();
  clearBossIntro();
  clearEnemies();
  hideGameNotice();
  updateLanguageText();
  updateStatusPanel();
  els.stageConfirm.hidden = true;
  syncStageButtons();
  showScreen("status");
  focusStatusSurface();
}

function changePlayerStat(stat, delta) {
  if (state.running || delta !== 1 || !progression.upgrade(state, stat)) return false;
  savePlayerProgress();
  els.skillFeedback.textContent = stat === "attack"
    ? `攻撃力が ${state.stats.attack} になりました。スキルポイントを1使いました。`
    : `俊敏性が ${state.stats.agility} になりました。入力文字数の範囲が短くなります。`;
  updateHud();
  return true;
}

function selectWeapon(weaponId) {
  if (state.running || (!state.introCompleted && weaponId !== defaultWeaponId) || !Object.hasOwn(weaponDefinitions, weaponId) || state.weaponId === weaponId) {
    updateStatusPanel();
    return;
  }

  state.weaponId = weaponId;
  savePlayerProgress();
  updateHud();
  renderWord();
}

function interruptGame() {
  if (!state.running) {
    return;
  }

  resetGame();
  showStageSelect();
}

function getEnemyFrames(enemyType, animationName) {
  const defaultEnemy = enemyAnimations.enemies[enemyAnimations.defaultEnemy] || {};
  const enemy = enemyAnimations.enemies[enemyType] || defaultEnemy;
  const frames = enemy[animationName]?.length ? enemy[animationName] : enemy.idle;
  const fallbackFrames = defaultEnemy.idle || [];

  return frames?.length ? frames : fallbackFrames;
}

function updateEnemyFrame(enemy) {
  const frames = getEnemyFrames(enemy.type, enemy.animation);

  if (!frames.length) {
    return;
  }

  const nextSrc = frames[enemy.frameIndex % frames.length];

  if (enemy.image.getAttribute("src") !== nextSrc) {
    enemy.image.src = nextSrc;
  }
}

function clearEnemyAnimationTimers(enemy) {
  if (!enemy) {
    state.activeEnemies.forEach(clearEnemyAnimationTimers);
    return;
  }

  window.clearInterval(enemy.frameTimerId);
  window.clearTimeout(enemy.returnTimerId);
  window.clearTimeout(enemy.typingShakeTimerId);
  enemy.frameTimerId = 0;
  enemy.returnTimerId = 0;
  enemy.typingShakeTimerId = 0;
  enemy.element.classList.remove("typing-shake");
}

function playEnemyAnimation(enemy, animationName, options = {}) {
  const { duration = 0, loop = true, next = "idle" } = options;
  const frames = getEnemyFrames(enemy.type, animationName);

  clearEnemyAnimationTimers(enemy);
  enemy.animation = animationName;
  enemy.frameIndex = 0;
  enemy.sprite.dataset.animation = animationName;
  updateEnemyFrame(enemy);

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (frames.length > 1 && !prefersReducedMotion) {
    enemy.frameTimerId = window.setInterval(() => {
      if (!loop && enemy.frameIndex >= frames.length - 1) {
        window.clearInterval(enemy.frameTimerId);
        enemy.frameTimerId = 0;
        return;
      }

      enemy.frameIndex = (enemy.frameIndex + 1) % frames.length;
      updateEnemyFrame(enemy);
    }, enemyAnimations.frameMs);
  }

  if (duration > 0) {
    enemy.returnTimerId = scheduleBattleTimeout(() => {
      playEnemyAnimation(enemy, next);
    }, duration);
  }
}

function stopEnemyWalkingAnimation(enemy) {
  if (enemy.animation === "idle" && enemy.frameTimerId === 0 && enemy.frameIndex === 0) {
    return;
  }

  clearEnemyAnimationTimers(enemy);
  enemy.animation = "idle";
  enemy.frameIndex = 0;
  enemy.sprite.dataset.animation = "idle";
  updateEnemyFrame(enemy);
}

function playTypingShakeEffect(enemy) {
  window.clearTimeout(enemy.typingShakeTimerId);
  enemy.element.classList.remove("typing-shake");
  void enemy.element.offsetWidth;
  enemy.element.classList.add("typing-shake");
  enemy.typingShakeTimerId = scheduleBattleTimeout(() => {
    enemy.typingShakeTimerId = 0;
    enemy.element.classList.remove("typing-shake");
  }, 130);
}

function clearGreatswordImpact() {
  window.clearTimeout(state.greatswordImpactDelayTimerId);
  window.clearTimeout(state.greatswordImpactTimerId);
  state.greatswordImpactDelayTimerId = 0;
  state.greatswordImpactTimerId = 0;
  els.greatswordImpact.classList.remove("is-active");
  els.arena.classList.remove("is-greatsword-impact");
  els.player.classList.remove("is-perfect-release");
}

function positionGreatswordImpact(enemy) {
  const arenaRect = els.arena.getBoundingClientRect();
  const targetRect = (enemy.sprite || enemy.element).getBoundingClientRect();
  const impactX = Math.max(28, Math.min(arenaRect.width - 28, targetRect.left + targetRect.width * 0.5 - arenaRect.left));
  const impactY = Math.max(28, Math.min(arenaRect.height - 28, targetRect.top + targetRect.height * 0.58 - arenaRect.top));
  els.greatswordImpact.style.setProperty("--greatsword-impact-x", `${impactX}px`);
  els.greatswordImpact.style.setProperty("--greatsword-impact-y", `${impactY}px`);
}

function playGreatswordImpact(enemy) {
  state.greatswordImpactDelayTimerId = scheduleBattleTimeout(() => {
    state.greatswordImpactDelayTimerId = 0;

    if (!state.running || !enemy?.element?.isConnected) {
      return;
    }

    positionGreatswordImpact(enemy);
    els.greatswordImpact.classList.remove("is-active");
    els.arena.classList.remove("is-greatsword-impact");
    void els.greatswordImpact.offsetWidth;
    els.greatswordImpact.classList.add("is-active");
    els.arena.classList.add("is-greatsword-impact");
    state.greatswordImpactTimerId = scheduleBattleTimeout(() => {
      state.greatswordImpactTimerId = 0;
      els.greatswordImpact.classList.remove("is-active");
      els.arena.classList.remove("is-greatsword-impact");
    }, greatswordImpactMs);
  }, greatswordImpactDelayMs);
}

function playPlayerAttackAnimation(enemy, isPerfectGreatsword = false) {
  window.clearTimeout(state.playerAttackTimerId);
  clearGreatswordImpact();
  els.player.classList.remove("is-attacking");
  void els.player.offsetWidth;
  els.player.classList.add("is-attacking");
  els.player.classList.toggle("is-perfect-release", isPerfectGreatsword);

  if (isPerfectGreatsword) {
    playGreatswordImpact(enemy);
  }

  state.playerAttackTimerId = scheduleBattleTimeout(() => {
    state.playerAttackTimerId = 0;
    els.player.classList.remove("is-attacking", "is-perfect-release");
  }, playerAttackMs);
}

function clearPlayerAttackAnimation() {
  window.clearTimeout(state.playerAttackTimerId);
  state.playerAttackTimerId = 0;
  els.player.classList.remove("is-attacking", "is-perfect-release");
  clearGreatswordImpact();
}

function playSpecialEffect() {
  window.clearTimeout(state.specialEffectTimerId);
  els.specialEffect.classList.remove("is-active");
  void els.specialEffect.offsetWidth;
  els.specialEffect.classList.add("is-active");
  state.specialEffectTimerId = scheduleBattleTimeout(() => {
    state.specialEffectTimerId = 0;
    els.specialEffect.classList.remove("is-active");
  }, 680);
}

function clearSpecialEffect() {
  window.clearTimeout(state.specialEffectTimerId);
  state.specialEffectTimerId = 0;
  state.specialInProgress = false;
  els.specialEffect.classList.remove("is-active");
}

function playBossIntro(enemy) {
  const t = labels();

  window.clearTimeout(state.bossIntroTimerId);
  els.bossIntro.classList.remove("is-active");
  enemy.element.classList.remove("boss-entry");
  els.bossIntroKicker.textContent = t.bossKicker;
  els.bossIntroTitle.textContent = t.bossTitle;
  els.bossIntroText.textContent = t.bossText;
  void els.bossIntro.offsetWidth;
  els.bossIntro.classList.add("is-active");
  enemy.element.classList.add("boss-entry");

  state.bossIntroTimerId = scheduleBattleTimeout(() => {
    state.bossIntroTimerId = 0;
    els.bossIntro.classList.remove("is-active");
    enemy.element.classList.remove("boss-entry");
  }, 1500);
}

function clearBossIntro() {
  window.clearTimeout(state.bossIntroTimerId);
  state.bossIntroTimerId = 0;
  els.bossIntro.classList.remove("is-active");
  state.activeEnemies.forEach((enemy) => {
    enemy.element.classList.remove("boss-entry");
  });
}

function preloadEnemyFrames() {
  Object.values(enemyAnimations.enemies).forEach((enemy) => {
    Object.values(enemy).forEach((frames) => {
      frames.forEach((src) => {
        const image = new Image();
        image.src = src;
      });
    });
  });
}

function preloadPlayerFrames() {
  Object.values(playerWeaponAssets).forEach((weapon) => {
    Object.values(weapon).flat().forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  });
}

function renderWord() {
  syncFlickInput();
  const selectedEnemy = getCurrentEnemy();

  if (!selectedEnemy) {
    els.wordTranslation.textContent = state.running ? "" : state.currentTranslation;
    els.typedWord.textContent = "";
    els.remainingWord.textContent = state.running ? "" : state.currentMatchedWord;
    updateWeaponCharge();
    return;
  }

  els.wordTranslation.textContent = selectedEnemy.translation;
  els.typedWord.textContent = selectedEnemy.typed;
  els.remainingWord.textContent = selectedEnemy.matchedWord.slice(selectedEnemy.typed.length);
  if (flickState.enabled) renderFlickPrompt(selectedEnemy);
  updateWeaponCharge();
}

function toShortestJapaneseInput(input) {
  const replacements = [
    ["sha", "sya"],
    ["shu", "syu"],
    ["sho", "syo"],
    ["cha", "tya"],
    ["chu", "tyu"],
    ["cho", "tyo"],
    ["ja", "zya"],
    ["ju", "zyu"],
    ["jo", "zyo"],
    ["shi", "si"],
    ["chi", "ti"],
    ["tsu", "tu"],
    ["fu", "hu"],
    ["ji", "zi"],
  ];

  return replacements.reduce((value, [from, to]) => value.replaceAll(from, to), input);
}

function toExplicitJapaneseNInput(input) {
  return input.replace(/n(?=$|[bcdfghjklmnpqrstvwxyz])/g, "nn");
}

function createJapaneseInputVariants(input) {
  const preferredInput = toShortestJapaneseInput(input);
  const variants = [preferredInput, input];
  const replacements = [
    ["zi", "ji"],
    ["zya", "ja"],
    ["zyu", "ju"],
    ["zyo", "jo"],
  ];

  replacements.forEach(([pattern, alternative]) => {
    variants.push(...variants.map((variant) => variant.replaceAll(pattern, alternative)));
  });

  const explicitNVariants = variants.map(toExplicitJapaneseNInput);

  return [...new Set([...explicitNVariants, ...variants])];
}

function getWordInputs(word) {
  if (word.inputs?.length) {
    return [...new Set(word.inputs.flatMap(createJapaneseInputVariants))];
  }

  return createJapaneseInputVariants(word.text);
}

function getShortestWordInputLength(word) {
  return getWordInputs(word).reduce(
    (shortestLength, input) => Math.min(shortestLength, input.length),
    word.text.length,
  );
}

function chooseWord(options = {}) {
  const { minLength = 0, maxLength = Infinity, useShortestInputLength = false } = options;
  const normalizedMinLength = Math.max(0, Math.round(minLength));
  const normalizedMaxLength = Number.isFinite(maxLength)
    ? Math.max(normalizedMinLength, Math.round(maxLength))
    : Infinity;
  const wordList = options.wordList || words();
  const getSelectionLength = useShortestInputLength
    ? getShortestWordInputLength
    : (word) => word.text.length;
  const measuredWords = wordList.map((word) => ({ word, length: getSelectionLength(word) }));
  const eligibleWords = measuredWords
    .filter(({ length }) => length >= normalizedMinLength && length <= normalizedMaxLength)
    .map(({ word }) => word);
  const minimumOnlyWords = measuredWords
    .filter(({ length }) => length >= normalizedMinLength)
    .map(({ word }) => word);
  const longestLength = Math.max(...measuredWords.map(({ length }) => length));
  const longestWords = measuredWords
    .filter(({ length }) => length === longestLength)
    .map(({ word }) => word);
  const fallbackWords = useShortestInputLength ? longestWords : wordList;
  const poolBase = eligibleWords.length
    ? eligibleWords
    : minimumOnlyWords.length
      ? minimumOnlyWords
      : fallbackWords;
  const unusedWords = poolBase.filter((word) => !state.usedWords.includes(word.text));
  const pool = unusedWords.length ? unusedWords : poolBase;
  const next = pool[Math.floor(Math.random() * pool.length)];
  state.usedWords.push(next.text);

  if (state.usedWords.length > wordList.length) {
    state.usedWords = state.usedWords.slice(-wordList.length);
  }

  return next;
}

function chooseEnemyWave() {
  return state.playableEnemyWaves[state.currentWaveIndex] || null;
}

function getSelectedEnemy() {
  return state.activeEnemies.find((enemy) => enemy.id === state.selectedEnemyId) || null;
}

function getCurrentEnemy() {
  const selectedEnemy = getSelectedEnemy();

  return selectedEnemy || state.activeEnemies.find((enemy) => enemy.hp > 0) || null;
}

function getInputEnemy() {
  if (isStoryDialogueOpen()) return null;
  const selectedEnemy = getSelectedEnemy();

  if (selectedEnemy && selectedEnemy.hp > 0 && !selectedEnemy.resolving) {
    return selectedEnemy;
  }

  return state.activeEnemies.find((enemy) => enemy.hp > 0 && !enemy.resolving) || null;
}

function normalizeAttackPower(attackPower = defaultEnemyAttackPower) {
  if (typeof attackPower === "number") {
    const max = Math.max(1, Math.round(attackPower));

    return { min: 1, max };
  }

  const min = Math.max(1, Math.round(attackPower.min ?? defaultEnemyAttackPower.min));
  const max = Math.max(min, Math.round(attackPower.max ?? defaultEnemyAttackPower.max));

  return { min, max };
}

function rollAttackDamage(attackPower) {
  const { min, max } = normalizeAttackPower(attackPower);

  return min + Math.floor(Math.random() * (max - min + 1));
}

function getEnemyTypeForWave(wave, index) {
  return wave.types[index] || "";
}

function createEnemyElement(enemy) {
  const element = document.createElement("div");
  element.className = "enemy";
  element.dataset.enemyId = enemy.id;
  element.dataset.enemyType = enemy.type;
  element.style.setProperty("--enemy-slot", String(enemy.slot));

  element.innerHTML = `
    <div class="word-card enemy-word-card">
      <span class="enemy-word-translation"></span>
      <span class="enemy-word-target"><span class="enemy-word-typed"></span><span class="enemy-word-remaining"></span></span>
    </div>
    <div class="character-hp enemy-hp">
      <span>ENEMY</span>
      <div class="character-hp-track" role="meter" aria-label="Enemy HP" aria-valuemin="0">
        <i></i>
      </div>
    </div>
    <div class="enemy-sprite" data-animation="idle" aria-hidden="true">
      <img class="enemy-image" alt="">
    </div>
  `;

  enemy.element = element;
  enemy.sprite = element.querySelector(".enemy-sprite");
  enemy.image = element.querySelector(".enemy-image");
  enemy.hpFill = element.querySelector(".character-hp-track i");
  enemy.hpTrack = element.querySelector(".character-hp-track");
  enemy.wordTranslationEl = element.querySelector(".enemy-word-translation");
  enemy.wordTypedEl = element.querySelector(".enemy-word-typed");
  enemy.wordRemainingEl = element.querySelector(".enemy-word-remaining");
  enemy.image.addEventListener("error", () => {
    const fallbackFrames = getEnemyFrames(enemyAnimations.defaultEnemy, "idle");
    if (fallbackFrames[0] && !enemy.image.src.endsWith(fallbackFrames[0])) {
      enemy.image.src = fallbackFrames[0];
    }
  });

  return element;
}

function updateEnemyHud(enemy) {
  const enemyHp = Math.max(0, enemy.hp);
  enemy.hpFill.style.width = `${(enemyHp / enemy.maxHp) * 100}%`;
  enemy.hpTrack.setAttribute("aria-valuemax", String(enemy.maxHp));
  enemy.hpTrack.setAttribute("aria-valuenow", String(enemyHp));
}

function updateEnemyWordLabel(enemy) {
  enemy.wordTranslationEl.textContent = enemy.translation;
  enemy.wordTypedEl.textContent = enemy.typed;
  enemy.wordRemainingEl.textContent = enemy.matchedWord.slice(enemy.typed.length);
}

function setEnemyProgress(enemy, progress) {
  enemy.progress = Math.max(0, Math.min(progress, 1));
  enemy.element.style.setProperty("--enemy-progress", enemy.progress.toFixed(3));
}

function setTargetEnemy(enemy) {
  state.selectedEnemyId = enemy?.id || "";
  state.activeEnemies.forEach((activeEnemy) => {
    activeEnemy.element.classList.toggle("is-targeted", activeEnemy.id === state.selectedEnemyId);
  });
  renderWord();
}

function setNextWord(enemy) {
  const weapon = getWeaponDefinition(enemy.weaponId);
  const wordLength = getAdjustedWordLengthSettings(weapon.id);
  const next = weapon.id === "unarmed"
    ? { text: "a", translation: "あ" }
    : chooseWord({
      minLength: enemy.boss ? wordLength.bossMin : wordLength.normalMin,
      maxLength: enemy.boss ? wordLength.bossMax : wordLength.normalMax,
      useShortestInputLength: Boolean(weapon.useShortestInputLength),
      wordList: weapon.words,
    });
  enemy.word = next.text;
  enemy.readingOverride = next.reading || "";
  enemy.inputRevision = (enemy.inputRevision || 0) + 1;
  enemy.flickRoman = "";
  enemy.inputs = getWordInputs(next);
  enemy.matchedWord = enemy.inputs[0] || next.text;
  enemy.translation = next.translation;
  enemy.bestLength = 0;
  enemy.typingMisses = 0;
  enemy.chargeStartLength = 0;
  enemy.typed = "";
  updateEnemyWordLabel(enemy);
}

function createEnemy(wave, index) {
  const enemy = {
    id: `enemy-${state.nextEnemyId}`,
    type: getEnemyTypeForWave(wave, index),
    slot: 0,
    maxHp: wave.hp,
    hp: wave.hp,
    attackPower: normalizeAttackPower(wave.attackPower),
    boss: Boolean(wave.boss),
    experience: wave.experience ?? Math.max(1, Math.round(wave.hp * (wave.boss ? 10 : 5))),
    experienceCounted: false,
    weaponId: getBattleWeaponId(),
    word: "",
    inputs: [],
    matchedWord: "",
    translation: "",
    typed: "",
    bestLength: 0,
    typingMisses: 0,
    chargeStartLength: 0,
    progress: 0,
    atBase: false,
    resolving: false,
    animation: "idle",
    frameIndex: 0,
    frameTimerId: 0,
    returnTimerId: 0,
    typingShakeTimerId: 0,
    nextAttackAt: 0,
    lastTick: performance.now(),
  };

  state.nextEnemyId += 1;
  createEnemyElement(enemy);
  setNextWord(enemy);
  updateEnemyHud(enemy);
  enemy.sprite.dataset.enemyType = enemy.type;
  enemy.sprite.dataset.enemyKind = enemy.boss ? "boss" : "normal";
  setEnemyProgress(enemy, 0);

  return enemy;
}

function clearEnemies() {
  clearBossIntro();
  clearEnemyAnimationTimers();
  state.activeEnemies = [];
  state.selectedEnemyId = "";
  els.enemyLayer.replaceChildren();
}

function addEnemyToWave(wave, index) {
  if (!state.running) {
    return;
  }

  const now = performance.now();
  const enemy = createEnemy(wave, index);
  enemy.lastTick = now;
  state.activeEnemies.push(enemy);
  els.enemyLayer.appendChild(enemy.element);
  playEnemyAnimation(enemy, "idle");
  setTargetEnemy(enemy);

  if (enemy.boss) {
    playBossIntro(enemy);
  }

  updateHud();
  flushBufferedInput();
}

function spawnNextEnemy() {
  const wave = chooseEnemyWave();

  if (!state.running || isStoryDialogueOpen() || !wave) {
    return;
  }

  const index = state.currentWaveSpawned;

  if (index >= wave.count) {
    return;
  }

  state.currentWaveSpawned += 1;
  addEnemyToWave(wave, index);
}

function queueNextEnemy() {
  const wave = chooseEnemyWave();

  if (!wave) {
    return;
  }

  if (state.currentWaveSpawned >= wave.count) {
    state.currentWaveIndex += 1;
    state.currentWaveSpawned = 0;
  }

  scheduleBattleTimeout(() => {
    if (state.running) {
      spawnNextEnemy();
    }
  }, 260);
}

function removeEnemy(enemy) {
  clearEnemyAnimationTimers(enemy);
  enemy.element.remove();
  state.activeEnemies = state.activeEnemies.filter((activeEnemy) => activeEnemy.id !== enemy.id);

  if (state.selectedEnemyId === enemy.id) {
    setTargetEnemy(null);
  }
}

function enemyLoop(now) {
  if (!state.running || isStoryDialogueOpen()) {
    return;
  }

  state.activeEnemies.forEach((enemy) => {
    if (enemy.resolving) {
      enemy.lastTick = now;
      return;
    }

    if (enemy.atBase) {
      setEnemyProgress(enemy, 1);

      if (!enemy.resolving && now >= enemy.nextAttackAt) {
        enemyAttack(enemy);
        return;
      }

      if (!enemy.resolving) {
        stopEnemyWalkingAnimation(enemy);
      }

      return;
    }

    const elapsed = Math.max(0, now - enemy.lastTick);
    enemy.lastTick = now;
    setEnemyProgress(enemy, enemy.progress + elapsed / attackMs);

    if (enemy.progress >= 1) {
      enemy.atBase = true;
      enemy.nextAttackAt = now;
      enemyAttack(enemy);
    }
  });

  state.rafId = requestAnimationFrame(enemyLoop);
}

function startLoop() {
  cancelAnimationFrame(state.rafId);
  const now = performance.now();
  state.activeEnemies.forEach((enemy) => {
    enemy.lastTick = now;
  });
  state.rafId = requestAnimationFrame(enemyLoop);
}

function enemyAttack(enemy) {
  if (!state.running || isStoryDialogueOpen()) return;
  enemy.resolving = true;
  enemy.atBase = true;
  const damage = rollAttackDamage(enemy.attackPower);
  state.hp = Math.max(0, state.hp - damage);
  state.combo = 0;
  resetSuccessStreak();
  state.perfect = false;
  enemy.element.classList.add("attack");
  playEnemyAnimation(enemy, "attack", { loop: false });
  updateHud();

  if (state.hp <= 0) {
    scheduleBattleTimeout(() => finishGame(false), 320);
    return;
  }

  scheduleBattleTimeout(() => {
    if (state.running) {
      enemy.resolving = false;
      enemy.nextAttackAt = performance.now() + repeatAttackMs;
      enemy.element.classList.remove("attack");
      stopEnemyWalkingAnimation(enemy);
      updateHud();
      flushBufferedInput();
    }
  }, 360);
}

function damageEnemy(enemy) {
  if (!state.running || isStoryDialogueOpen() || enemy.resolving) return;
  const damage = getPlayerAttackDamage(enemy);
  const isPerfectGreatsword = enemy.weaponId === "greatsword" && enemy.typingMisses === 0;
  playPlayerAttackAnimation(enemy, isPerfectGreatsword);
  enemy.resolving = true;
  enemy.atBase = false;
  enemy.hp = Math.max(0, Math.round((enemy.hp - damage) * 10) / 10);
  state.combo += 1;
  state.score += 35 + state.combo * 10;
  enemy.element.classList.add("hit");
  enemy.element.classList.remove("defeating", "typing-shake");
  setEnemyProgress(enemy, enemy.progress - knockbackAmount);
  playEnemyAnimation(enemy, "damage", { duration: 220, loop: false });
  updateEnemyHud(enemy);
  updateHud();

  if (enemy.weaponId === "unarmed") {
    state.storyPunches += 1;
    clearInputBuffer();
    scheduleBattleTimeout(() => {
      if (!state.running || state.storyPhase !== "unarmed") return;
      enemy.element.classList.remove("hit");
      playEnemyAnimation(enemy, "idle");
      if (state.storyPunches >= getStageDefinition(state.stageId).storyIntro.punches) {
        showStoryDialogue("weapon-offer");
      } else {
        enemy.resolving = false;
        enemy.lastTick = performance.now();
        setNextWord(enemy);
        setTargetEnemy(enemy);
        updateHud();
      }
    }, playerAttackMs);
    return;
  }

  if (enemy.hp <= 0) {
    scheduleBattleTimeout(() => {
      if (state.running) {
        defeatEnemy(enemy);
      }
    }, 220);
    return;
  }

  scheduleBattleTimeout(() => {
    if (state.running) {
      enemy.element.classList.remove("hit");
      enemy.resolving = false;
      setNextWord(enemy);
      setTargetEnemy(enemy);
      enemy.lastTick = performance.now();
      playEnemyAnimation(enemy, "idle");
      updateHud();
      flushBufferedInput();
    }
  }, 220);
}

function useSpecialMove() {
  if (!state.running || state.specialInProgress || !isSpecialReady() || !state.activeEnemies.length) {
    return false;
  }

  const targets = state.activeEnemies.filter((enemy) => enemy.hp > 0);
  if (!targets.length || targets.some((enemy) => enemy.resolving)) {
    updateHud();
    return false;
  }
  clearInputBuffer();
  state.specialInProgress = true;
  const { streakCap } = getSpecialGaugeSettings();
  state.specialGauge = 0;
  state.score += targets.length * 120 + Math.min(state.successStreak, streakCap) * 20;
  setTargetEnemy(null);
  playSpecialEffect();
  targets.forEach((enemy) => {
    enemy.resolving = true;
    enemy.atBase = false;
    enemy.nextAttackAt = 0;
    enemy.hp = Math.max(0, enemy.hp - specialDamage);
    enemy.element.classList.remove("hit", "attack", "defeating", "typing-shake");
    enemy.element.classList.add("special");
    setEnemyProgress(enemy, enemy.progress - knockbackAmount * 2.2);
    playEnemyAnimation(enemy, "damage", { loop: false });
    updateEnemyHud(enemy);
  });
  updateHud();

  const remainingEnemies = targets.filter((enemy) => enemy.hp > 0);
  if (!remainingEnemies.length) {
    scheduleBattleTimeout(() => {
      if (state.running) {
        clearInputBuffer();
        state.specialInProgress = false;
        targets.forEach((enemy) => {
          enemy.element.classList.remove("special");
          defeatEnemy(enemy);
        });
      }
    }, 420);
    return true;
  }

  scheduleBattleTimeout(() => {
    if (state.running) {
      clearInputBuffer();
      state.specialInProgress = false;
      remainingEnemies.forEach((enemy) => {
        enemy.element.classList.remove("special");
        enemy.resolving = false;
        setNextWord(enemy);
        enemy.lastTick = performance.now();
        playEnemyAnimation(enemy, "idle");
      });
      setTargetEnemy(remainingEnemies[0]);
      updateHud();
      flushBufferedInput();
      targets.filter((enemy) => enemy.hp <= 0).forEach((enemy) => {
        enemy.element.classList.remove("special");
        defeatEnemy(enemy);
      });
    }
  }, 420);

  return true;
}

function defeatEnemy(enemy) {
  if (!state.running || !state.activeEnemies.includes(enemy) || enemy.hp > 0 || enemy.experienceCounted) {
    return;
  }

  enemy.resolving = true;
  if (state.selectedEnemyId === enemy.id) {
    setTargetEnemy(null);
  }
  enemy.experienceCounted = true;
  state.pendingExperience += enemy.experience;
  state.cleared += 1;
  state.score += 120 + state.combo * 20;
  enemy.element.classList.remove("hit", "special", "typing-shake");
  enemy.element.classList.add("defeating");
  playEnemyAnimation(enemy, "defeat", { loop: false });
  updateHud();

  if (state.cleared >= state.roundLimit) {
    scheduleBattleTimeout(() => finishGame(true), 620);
    return;
  }

  scheduleBattleTimeout(() => {
    if (state.running) {
      removeEnemy(enemy);
      updateHud();
      if (!state.activeEnemies.length) {
        queueNextEnemy();
      } else {
        renderWord();
        flushBufferedInput();
      }
    }
  }, 620);
}

function finishGame(cleared) {
  if (!state.running || (cleared && state.cleared < state.roundLimit)) {
    return;
  }

  setStoryPhase("none");
  const t = labels();
  const noDamageClear = state.perfect && state.hp === getMaxHp();
  invalidateBattleGeneration();
  state.running = false;
  cancelAnimationFrame(state.rafId);
  clearStartDelayTimer();
  clearInputBuffer();
  clearPlayerAttackAnimation();
  clearEnemyAnimationTimers();
  clearSpecialEffect();
  clearBossIntro();
  els.startButton.textContent = t.start;

  let resultText = "獲得経験値 0 EXP";
  if (cleared) {
    const previousLevel = state.level;
    const reward = progression.gainExperience(state, state.pendingExperience);
    state.battleExperience = reward.gained;
    state.battleLevelsGained = reward.levels;
    state.hp = Math.min(getMaxHp(), state.hp + reward.hpGained);
    resultText = `獲得経験値 ${reward.gained} EXP`;
    if (reward.levels > 0) {
      resultText += `\nレベルアップ！ Lv.${previousLevel} → Lv.${state.level}`;
      resultText += `\n最大HP +${reward.hpGained} ／ スキルポイント +${reward.levels * progression.rules.pointsPerLevel}`;
    }
    savePlayerProgress();
  }
  state.pendingExperience = 0;
  updateHud();

  if (!cleared) {
    showGameNotice("over", "GAME OVER", t.gameOverTitle, resultText, { persistent: true });
  } else {
    showGameNotice(
      "clear",
      noDamageClear ? "PERFECT" : "CLEAR",
      noDamageClear ? t.perfectTitle : t.clearTitle,
      resultText,
      { persistent: true },
    );
  }
}

function resetGame() {
  state.storyPunches = 0;
  setStoryPhase("none");
  invalidateBattleGeneration();
  state.running = false;
  state.pendingStageId = "";
  state.language = "ja";
  state.hp = getMaxHp();
  state.score = 0;
  state.pendingExperience = 0;
  state.battleExperience = 0;
  state.battleLevelsGained = 0;
  state.progressNotice = "";
  state.combo = 0;
  resetSuccessStreak();
  state.specialGauge = 0;
  state.cleared = 0;
  state.currentWaveIndex = 0;
  state.currentWaveSpawned = 0;
  state.nextEnemyId = 1;
  state.perfect = true;
  state.currentWord = "hajime";
  state.currentInputs = createJapaneseInputVariants("hajime");
  state.currentMatchedWord = state.currentWord;
  state.currentTranslation = "はじめ";
  state.currentWordBestLength = 0;
  state.usedWords = [];
  cancelAnimationFrame(state.rafId);
  clearStartDelayTimer();
  clearInputBuffer();
  clearPlayerAttackAnimation();
  clearNoticeTimer();
  clearSpecialEffect();
  clearBossIntro();
  clearEnemies();
  hideGameNotice();
  updateLanguageText();
  updateHud();
  renderWord();
}

function startGame(stageId = state.stageId) {
  const resolvedStageId = stageDefinitions[stageId] ? stageId : defaultStageId;
  const stage = getStageDefinition(resolvedStageId);

  if (!stage.enabled) {
    return;
  }

  invalidateBattleGeneration();
  const needsIntroduction = Boolean(stage.storyIntro && !state.introCompleted);
  state.storyPunches = 0;
  setStoryPhase(needsIntroduction ? "encounter" : "none");
  state.language = "ja";
  state.stageId = resolvedStageId;
  state.pendingStageId = "";
  state.playableEnemyWaves = buildPlayableEnemyWaves(stage.waves);
  state.roundLimit = getRoundLimit(state.playableEnemyWaves);
  updateEnemyTypeDataset(state.playableEnemyWaves);
  showScreen("battle");

  const t = labels();
  cancelAnimationFrame(state.rafId);
  clearStartDelayTimer();
  clearInputBuffer();
  clearPlayerAttackAnimation();
  clearNoticeTimer();
  clearSpecialEffect();
  clearBossIntro();
  state.running = true;
  state.hp = getMaxHp();
  state.score = 0;
  state.pendingExperience = 0;
  state.battleExperience = 0;
  state.battleLevelsGained = 0;
  state.progressNotice = "";
  state.combo = 0;
  resetSuccessStreak();
  state.specialGauge = 0;
  state.cleared = 0;
  state.currentWaveIndex = 0;
  state.currentWaveSpawned = 0;
  state.nextEnemyId = 1;
  state.perfect = true;
  state.usedWords = [];
  clearEnemies();
  hideGameNotice();
  updateLanguageText();
  els.startButton.textContent = t.restart;
  updateHud();
  if (needsIntroduction) {
    showStoryDialogue("encounter");
    return;
  }
  showGameNotice("start", "START", t.startTitle, t.startText(stage.name), { duration: startNoticeMs });
  spawnNextEnemy();
  if (flickState.enabled) focusGameSurface();
  state.startDelayTimerId = scheduleBattleTimeout(() => {
    state.startDelayTimerId = 0;
    if (!state.running) {
      return;
    }

    startLoop();
    focusGameSurface();
  }, startNoticeMs);
}

function normalizeTypedValue(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z-]/g, "");
}

function recordTypingMiss(enemy) {
  state.combo = 0;
  resetSuccessStreak();
  if (enemy.weaponId === "greatsword") {
    enemy.typingMisses += 1;
    enemy.chargeStartLength = enemy.typed.length;
  }
  updateHud();
}

function applyTypedValue(enemy, value) {
  if (!state.running || isStoryDialogueOpen() || !enemy || enemy.resolving) {
    return;
  }

  const nextValue = normalizeTypedValue(value);
  const matchedWord = enemy.inputs.find((input) => input.startsWith(nextValue));

  if (!matchedWord) {
    recordTypingMiss(enemy);
    return;
  }

  const typedMoreCharacters = nextValue.length > enemy.typed.length;
  const newSuccessfulCharacterCount = Math.max(0, nextValue.length - enemy.bestLength);
  enemy.chargeStartLength = Math.min(enemy.chargeStartLength, nextValue.length);
  enemy.typed = nextValue;
  enemy.matchedWord = matchedWord;
  updateEnemyWordLabel(enemy);
  renderWord();

  if (newSuccessfulCharacterCount > 0) {
    enemy.bestLength = nextValue.length;
    addSuccessfulCharacters(newSuccessfulCharacterCount);
    updateHud();
  }

  if (enemy.inputs.includes(enemy.typed)) {
    damageEnemy(enemy);
  } else if (typedMoreCharacters) {
    playTypingShakeEffect(enemy);
  }
}

function getTypingCharacterFromKey(event) {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return "";
  }

  if (/^Key[A-Z]$/.test(event.code)) {
    return event.code.slice(3).toLowerCase();
  }

  if (event.key.length === 1) {
    const normalizedKey = normalizeTypedValue(event.key);
    return /^[a-z-]$/.test(normalizedKey) ? normalizedKey : "";
  }

  return "";
}

function isSpaceStartKey(event) {
  return !event.altKey && !event.ctrlKey && !event.metaKey && (event.code === "Space" || event.key === " ");
}

function isStartScreenVisible() {
  return document.documentElement.dataset.screen === "start";
}

function handleTypingKeydown(event) {
  if (event.target === els.flickInput || event.isComposing || event.keyCode === 229 || flickState.composing) return;
  if (event.code === "Escape") {
    if (!els.stageScreen.hidden && !els.stageConfirm.hidden) {
      event.preventDefault();
      cancelPendingStageSelection();
    } else if (state.running) {
      event.preventDefault();
      interruptGame();
    }
    return;
  }

  if (isStoryDialogueOpen()) {
    if (event.repeat && (isSpaceStartKey(event) || event.key === "Enter")) event.preventDefault();
    return;
  }

  if (isSpaceStartKey(event)) {
    if (isStartScreenVisible()) {
      event.preventDefault();
      showStageSelect();
      return;
    }

    if (state.running) {
      event.preventDefault();
      useSpecialMove();
      return;
    }

    return;
  }

  if (!state.running) {
    return;
  }

  const letter = getTypingCharacterFromKey(event);

  if (letter) {
    event.preventDefault();
    if (state.inputBuffer.length) {
      flushBufferedInput();
    }

    const targetEnemy = getInputEnemy();

    if (targetEnemy && !state.inputBuffer.length) {
      setTargetEnemy(targetEnemy);
      applyTypedValue(targetEnemy, targetEnemy.typed + letter);
    } else {
      enqueueBufferedInput("letter", letter);
    }
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    if (state.inputBuffer.length) {
      flushBufferedInput();
    }

    const targetEnemy = getInputEnemy();
    if (targetEnemy && !state.inputBuffer.length) {
      applyTypedValue(targetEnemy, targetEnemy.typed.slice(0, -1));
    } else {
      enqueueBufferedInput("backspace");
    }
  }
}

els.storyNextButton.addEventListener("click", advanceStory);
els.specialButton.addEventListener("click", useSpecialMove);
els.introStartButton.addEventListener("click", showStageSelect);
els.statusButton.addEventListener("click", showStatusScreen);
els.stageSelectButton.addEventListener("click", showStageSelect);
els.stageConfirmStart.addEventListener("click", startConfirmedStage);
els.stageConfirmCancel.addEventListener("click", cancelPendingStageSelection);
els.statusPanel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-stat][data-stat-delta]");

  if (!button || button.disabled) {
    return;
  }

  changePlayerStat(button.dataset.stat, Number(button.dataset.statDelta || 0));
});
els.statusPanel.addEventListener("change", (event) => {
  const input = event.target.closest("input[name='weapon']");

  if (!input) {
    return;
  }

  selectWeapon(input.value);
});
els.startButton.addEventListener("click", () => {
  if (state.running) {
    startGame(state.stageId);
    return;
  }

  showStageSelect();
});
els.resetButton.addEventListener("click", () => {
  resetGame();
  showStageSelect();
});
els.noticeButton.addEventListener("click", showStageSelect);
els.stageChoices.addEventListener("click", (event) => {
  if (event.target.closest("#stageConfirm")) {
    return;
  }

  const button = event.target.closest(".stage-choice[data-stage]");
  const stage = stageDefinitions[button?.dataset.stage];

  if (!button || button.disabled || !stage?.enabled) {
    return;
  }

  showStageConfirm(button.dataset.stage);
});
document.addEventListener("keydown", handleTypingKeydown);

initializeFlickInput();
preloadEnemyFrames();
preloadPlayerFrames();
resetGame();
showStartScreen();
