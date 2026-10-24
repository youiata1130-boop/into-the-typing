// Game data and settings are loaded by index.html before this script.
const progression = window.PLAYER_PROGRESSION;
const defaultPlayerStats = progression.defaultStats;
let progressionSaveAvailable = true;
const attackMs = 8200;
const repeatAttackMs = 2200;
const enemyAttackRecoveryMs = 360;
const knockbackAmount = 0.14;
const startNoticeMs = 850;
const inputBufferRetryMs = 24;
const inputBufferRetentionMs = 1400;
const inputBufferMax = 32;
const playerAttackMs = 480;
const greatswordImpactDelayMs = 180;
const greatswordImpactMs = 820;
const specialGaugeMax = skillGaugeSettings.max;
const prologueScenes = [
  {
    title: "海への出発",
    image: "src/assets/images/story/raft_departure.webp",
    alt: "いかだに乗り、青い海へこぎ出す少年",
    text: "海の向こうの世界にあこがれた少年は、\n小さないかだに乗り、冒険へと出発した。",
  },
  {
    title: "突然の嵐",
    image: "src/assets/images/story/raft_storm.webp",
    alt: "激しい雨と大波の中、いかだにつかまる少年",
    text: "ところが、旅の途中で空が暗くなり、激しい嵐に。\n少年のいかだは、大波にのまれてしまった。",
  },
  {
    title: "見知らぬ浜辺",
    image: "src/assets/images/backgrounds/stages/crab_shore.webp",
    alt: "無人島の白い浜辺と青い海",
    text: "目を覚ますと、そこは見知らぬ無人島。\n少年の新たな冒険が、この浜辺から始まる。",
  },
];
const enemyAnimations = window.ENEMY_ANIMATIONS || {
  defaultEnemy: "goblin_level_1",
  frameMs: 140,
  settings: {
    medaka_level_1: { frameMs: 70, idleWhileStopped: true },
    medaka_boss: { frameMs: 70, idleWhileStopped: true },
  },
  enemies: {
    medaka_level_1: {
      idle: Array.from({ length: 16 }, (_, index) =>
        `src/assets/images/enemies/medaka/level_1/swim/frame_${String(index + 1).padStart(2, "0")}.webp`),
      attack: ["src/assets/images/enemies/medaka/level_1/idle/frame_01.webp"],
      damage: ["src/assets/images/enemies/medaka/level_1/idle/frame_01.webp"],
      defeat: ["src/assets/images/enemies/medaka/level_1/idle/frame_01.webp"],
    },
    medaka_boss: {
      idle: Array.from({ length: 16 }, (_, index) =>
        `src/assets/images/enemies/medaka/boss/swim/frame_${String(index + 1).padStart(2, "0")}.webp`),
      attack: ["src/assets/images/enemies/medaka/boss/idle/frame_01.webp"],
      damage: ["src/assets/images/enemies/medaka/boss/idle/frame_01.webp"],
      defeat: ["src/assets/images/enemies/medaka/boss/idle/frame_01.webp"],
    },
    crab_level_1: {
      idle: ["src/assets/images/enemies/crab/level_1/idle/frame_01.webp"],
      attack: ["src/assets/images/enemies/crab/level_1/idle/frame_01.webp"],
      damage: ["src/assets/images/enemies/crab/level_1/idle/frame_01.webp"],
      defeat: ["src/assets/images/enemies/crab/level_1/idle/frame_01.webp"],
    },
    crab_boss: {
      idle: ["src/assets/images/enemies/crab/boss/idle/frame_01.webp"],
      attack: ["src/assets/images/enemies/crab/boss/idle/frame_01.webp"],
      damage: ["src/assets/images/enemies/crab/boss/idle/frame_01.webp"],
      defeat: ["src/assets/images/enemies/crab/boss/idle/frame_01.webp"],
    },
    egg_level_1: {
      idle: [
        "src/assets/images/enemies/egg/level_1/idle/frame_01.webp",
        "src/assets/images/enemies/egg/level_1/idle/frame_02.webp",
        "src/assets/images/enemies/egg/level_1/idle/frame_03.webp",
        "src/assets/images/enemies/egg/level_1/idle/frame_02.webp",
      ],
      attack: ["src/assets/images/enemies/egg/level_1/attack/frame_02.webp"],
      damage: ["src/assets/images/enemies/egg/level_1/damage/frame_02.webp"],
      defeat: ["src/assets/images/enemies/egg/level_1/defeat/frame_02.webp"],
    },
    chick_level_1: {
      idle: [
        "src/assets/images/enemies/chick/level_1/idle/frame_01.webp",
        "src/assets/images/enemies/chick/level_1/idle/frame_01.webp",
        "src/assets/images/enemies/chick/level_1/idle/frame_02.webp",
        "src/assets/images/enemies/chick/level_1/idle/frame_02.webp",
      ],
      attack: ["src/assets/images/enemies/chick/level_1/attack/frame_02.webp"],
      damage: ["src/assets/images/enemies/chick/level_1/damage/frame_02.webp"],
      defeat: ["src/assets/images/enemies/chick/level_1/defeat/frame_02.webp"],
    },
    chicken_level_1: {
      idle: ["src/assets/images/enemies/chicken/level_1/idle/frame_02.webp"],
      attack: ["src/assets/images/enemies/chicken/level_1/attack/frame_02.webp"],
      damage: ["src/assets/images/enemies/chicken/level_1/damage/frame_02.webp"],
      defeat: ["src/assets/images/enemies/chicken/level_1/defeat/frame_02.webp"],
    },
    chicken_level_2: {
      idle: ["src/assets/images/enemies/chicken/level_2/idle/frame_02.webp"],
      attack: ["src/assets/images/enemies/chicken/level_2/attack/frame_02.webp"],
      damage: ["src/assets/images/enemies/chicken/level_2/damage/frame_02.webp"],
      defeat: ["src/assets/images/enemies/chicken/level_2/defeat/frame_02.webp"],
    },
    goblin_level_1: {
      idle: ["src/assets/images/enemies/goblin/level_1/idle/frame_02.webp"],
      attack: ["src/assets/images/enemies/goblin/level_1/attack/frame_02.webp"],
      damage: ["src/assets/images/enemies/goblin/level_1/damage/frame_02.webp"],
      defeat: ["src/assets/images/enemies/goblin/level_1/defeat/frame_02.webp"],
    },
    goblin_level_2: {
      idle: ["src/assets/images/enemies/goblin/level_2/idle/frame_02.webp"],
      attack: ["src/assets/images/enemies/goblin/level_2/attack/frame_02.webp"],
      damage: ["src/assets/images/enemies/goblin/level_2/damage/frame_02.webp"],
      defeat: ["src/assets/images/enemies/goblin/level_2/defeat/frame_02.webp"],
    },
    goblin_level_3: {
      idle: ["src/assets/images/enemies/goblin/level_3/idle/frame_02.webp"],
      attack: ["src/assets/images/enemies/goblin/level_3/attack/frame_02.webp"],
      damage: ["src/assets/images/enemies/goblin/level_3/damage/frame_02.webp"],
      defeat: ["src/assets/images/enemies/goblin/level_3/defeat/frame_02.webp"],
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

function isWeaponAvailable(weaponId) {
  if (!Object.hasOwn(weaponDefinitions, weaponId)) return false;
  if (weaponId === "sword") return state.introCompleted && state.ironSwordObtained;
  if (weaponId === "greatsword") return state.introCompleted && state.greatswordObtained;
  if (weaponId === "dualBlades") return state.introCompleted && state.dualBladesObtained;
  if (weaponId === "swordShield") return state.introCompleted && state.swordShieldObtained;
  return weaponId === defaultWeaponId;
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

function loadPlayerProgress(saved = null) {
  if (saved?.version === 2) {
    const restored = progression.restore(saved);
    const equipmentTutorialCompleted = saved.introCompleted === true && saved.equipmentTutorialCompleted === true;
    // Older saves predate clear records. Stage 1 gave no EXP; a completed
    // stage 2 awarded 40 EXP. Infer its clear once, only for those old saves.
    const clearedStages = Object.hasOwn(saved, "clearedStages")
      ? [...new Set((Array.isArray(saved.clearedStages) ? saved.clearedStages : [])
        .filter(id => typeof id === "string" && Object.hasOwn(stageDefinitions, id)))]
      : equipmentTutorialCompleted
        ? (restored.totalExperience >= 40 ? ["forest_path", "mist_road"] : ["forest_path"])
        : [];
    const skillTutorialCompleted = saved.skillTutorialCompleted === true;
    // Preserve legacy iron-sword access and previously equipped greatswords.
    const ironSwordObtained = saved.introCompleted === true
      && (saved.ironSwordObtained === true || !Object.hasOwn(saved, "ironSwordObtained"));
    const previouslyOwnedGreatsword = saved.introCompleted === true
      && (saved.greatswordObtained === true
        || (!Object.hasOwn(saved, "greatswordObtained") && saved.weaponId === "greatsword"));
    // Award the new reward to players whose stage 3 clear was already saved.
    const missingGreatswordReward = saved.introCompleted === true
      && clearedStages.includes("sky_castle") && !previouslyOwnedGreatsword;
    const greatswordObtained = previouslyOwnedGreatsword || missingGreatswordReward;
    const missingDualBladesReward = saved.introCompleted === true
      && clearedStages.includes("flower_meadow") && saved.dualBladesObtained !== true;
    const dualBladesObtained = saved.introCompleted === true && (saved.dualBladesObtained === true || missingDualBladesReward);
    const missingSwordShieldReward = saved.introCompleted === true
      && clearedStages.includes("mushroom_forest") && saved.swordShieldObtained !== true;
    const swordShieldObtained = saved.introCompleted === true && (saved.swordShieldObtained === true || missingSwordShieldReward);
    // The mistakenly introduced dagger is retired; keep the player's iron sword.
    const restoredWeaponId = saved.weaponId === "dagger" && ironSwordObtained ? "sword" : saved.weaponId;
    return {
      ...restored,
      clearedStages,
      skillTutorialCompleted,
      skillTutorialPending: !skillTutorialCompleted && saved.skillTutorialPending === true && restored.skillPoints > 0,
      weaponId: saved.introCompleted === true && Object.hasOwn(weaponDefinitions, restoredWeaponId)
        && (restoredWeaponId !== "sword" || ironSwordObtained)
        && (restoredWeaponId !== "greatsword" || greatswordObtained)
        && (restoredWeaponId !== "dualBlades" || dualBladesObtained)
        && (restoredWeaponId !== "swordShield" || swordShieldObtained) ? restoredWeaponId : defaultWeaponId,
      ironSwordObtained,
      greatswordObtained,
      dualBladesObtained,
      swordShieldObtained,
      swordShieldEquipPending: swordShieldObtained && saved.weaponId !== "swordShield"
        && (saved.swordShieldEquipPending === true || missingSwordShieldReward),
      dualBladesEquipPending: dualBladesObtained && saved.weaponId !== "dualBlades"
        && (saved.dualBladesEquipPending === true || missingDualBladesReward),
      greatswordEquipPending: greatswordObtained && saved.weaponId !== "greatsword"
        && (saved.greatswordEquipPending === true || missingGreatswordReward),
      swordEquipPending: ironSwordObtained && saved.swordEquipPending === true && saved.weaponId !== "sword",
      prologueCompleted: saved.prologueCompleted === true || saved.introCompleted === true || restored.totalExperience > 0,
      introCompleted: saved.introCompleted === true,
      equipmentTutorialCompleted,
    };
  }
  return { ...progression.restore(), clearedStages: [], weaponId: defaultWeaponId, prologueCompleted: false, introCompleted: false, equipmentTutorialCompleted: false, ironSwordObtained: false, greatswordObtained: false, greatswordEquipPending: false, dualBladesObtained: false, dualBladesEquipPending: false, swordShieldObtained: false, swordShieldEquipPending: false, swordEquipPending: false, skillTutorialPending: false, skillTutorialCompleted: false };
}

function playerProgressSnapshot(player = state) {
  return {
    version: 2, totalExperience: player.totalExperience, stats: player.stats,
    clearedStages: [...player.clearedStages],
    weaponId: player.weaponId, prologueCompleted: player.prologueCompleted, introCompleted: player.introCompleted,
    equipmentTutorialCompleted: player.equipmentTutorialCompleted, ironSwordObtained: player.ironSwordObtained,
    swordEquipPending: player.swordEquipPending, greatswordObtained: player.greatswordObtained,
    greatswordEquipPending: player.greatswordEquipPending,
    dualBladesObtained: player.dualBladesObtained, dualBladesEquipPending: player.dualBladesEquipPending,
    swordShieldObtained: player.swordShieldObtained, swordShieldEquipPending: player.swordShieldEquipPending,
    skillTutorialPending: player.skillTutorialPending, skillTutorialCompleted: player.skillTutorialCompleted,
  };
}

function savePlayerProgress() {
  if (activeSaveSlot === null) return;
  try {
    const saved = saveSlots.write(activeSaveSlot, state.playerName, playerProgressSnapshot(), activeSaveToken);
    activeSaveToken = saved.raw;
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
  stageMapRegionId: "coast",
  pendingStageId: "",
  playerName: "",
  weaponEquipGuideId: "",
  skillGuideActive: false,
  ...loadPlayerProgress(),
  running: false,
  storyPhase: "none",
  prologueSceneIndex: 0,
  hp: progression.rules.baseHp,
  pendingExperience: 0,
  battleExperience: 0,
  battleLevelsGained: 0,
  progressNotice: "",
  score: 0,
  combo: 0,
  successStreak: 0,
  specialGauge: 0,
  skillId: defaultSkillId,
  specialInProgress: false,
  guarding: false,
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
  typingMissTimerId: 0,
  typingMissShakeTimerId: 0,
  startDelayTimerId: 0,
  battleStartsAt: 0,
  inputBufferTimerId: 0,
  playerAttackTimerId: 0,
  playerAttackReadyAt: 0,
  playerAttackCooldownMs: 0,
  stageAttackCooldowns: {},
  playerAttackCooldownTimerId: 0,
  enemySpawnTimerId: 0,
  greatswordImpactDelayTimerId: 0,
  greatswordImpactTimerId: 0,
  inputBuffer: [],
  usedWords: [],
  dualNextSpawnWord: null,
};

function invalidateBattleGeneration() {
  clearEnemyActionStop();
  clearPlayerDamageEffect();
  clearHealingEffect();
  clearPlayerGuard();
  window.clearTimeout(state.enemySpawnTimerId);
  state.enemySpawnTimerId = 0;
  clearPlayerAttackCooldown();
  clearTypingMissEffect();
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
  playerFrameGuard: document.querySelector("#playerFrameGuard"),
  playerHpTrack: document.querySelector("#playerHpTrack"),
  playerHpFill: document.querySelector("#playerHpFill"),
  specialButton: document.querySelector("#specialButton"),
  specialShortcut: document.querySelector("#specialShortcut"),
  guardButton: document.querySelector("#guardButton"),
  guardButtonText: document.querySelector("#guardButtonText"),
  skillPanel: document.querySelector("#skillPanel"),
  skillName: document.querySelector("#skillName"),
  skillGauge: document.querySelector("#skillGauge"),
  skillGaugeFill: document.querySelector("#skillGaugeFill"),
  skillGaugeValue: document.querySelector("#skillGaugeValue"),
  specialEffect: document.querySelector("#specialEffect"),
  arena: document.querySelector(".arena"),
  typingMissEffect: document.querySelector("#typingMissEffect"),
  playerDamageEffect: document.querySelector("#playerDamageEffect"),
  playerDamageText: document.querySelector("#playerDamageText"),
  playerHealText: document.querySelector("#playerHealText"),
  enemyStopIndicator: document.querySelector("#enemyStopIndicator"),
  greatswordImpact: document.querySelector("#greatswordImpact"),
  bossIntro: document.querySelector("#bossIntro"),
  bossIntroKicker: document.querySelector("#bossIntroKicker"),
  bossIntroTitle: document.querySelector("#bossIntroTitle"),
  bossIntroText: document.querySelector("#bossIntroText"),
  wordTranslation: document.querySelector("#wordTranslation"),
  typedWord: document.querySelector("#typedWord"),
  nextWordPreview: document.querySelector("#nextWordPreview"),
  remainingWord: document.querySelector("#remainingWord"),
  typingLabel: document.querySelector("#typingLabel"),
  typingStatus: document.querySelector("#typingStatus"),
  attackCooldown: document.querySelector("#attackCooldown"),
  attackCooldownFill: document.querySelector("#attackCooldownFill"),
  flickInput: document.querySelector("#flickInput"),
  typingBox: document.querySelector(".typing-box"),
  storyDialog: document.querySelector("#storyDialog"),
  storyText: document.querySelector("#storyText"),
  prologueImage: document.querySelector("#prologueImage"),
  prologueTitle: document.querySelector("#prologueTitle"),
  storyItem: document.querySelector("#storyItem"),
  storyNextButton: document.querySelector("#storyNextButton"),
  battleWeaponName: document.querySelector("#battleWeaponName"),
  weaponCharge: document.querySelector("#weaponCharge"),
  weaponChargeMeter: document.querySelector("#weaponChargeMeter"),
  weaponChargeFill: document.querySelector("#weaponChargeFill"),
  startScreen: document.querySelector("#startScreen"),
  stageScreen: document.querySelector("#stageScreen"),
  stageMapPanel: document.querySelector("#stageMapPanel"),
  stageMapImage: document.querySelector("#stageMapImage"),
  stageRegionSwitch: document.querySelector("#stageRegionSwitch"),
  homeScreen: document.querySelector("#homeScreen"),
  weaponScreen: document.querySelector("#weaponScreen"),
  statusScreen: document.querySelector("#statusScreen"),
  homeWeaponsButton: document.querySelector("#homeWeaponsButton"),
  homeStatusButton: document.querySelector("#homeStatusButton"),
  weaponHomeButton: document.querySelector("#weaponHomeButton"),
  statusHomeButton: document.querySelector("#statusHomeButton"),
  weaponPanel: document.querySelector("#weaponPanel"),
  weaponSword: document.querySelector("#weaponSword"),
  weaponSwordOption: document.querySelector("#weaponSwordOption"),
  weaponGreatsword: document.querySelector("#weaponGreatsword"),
  weaponGreatswordOption: document.querySelector("#weaponGreatswordOption"),
  weaponDualBlades: document.querySelector("#weaponDualBlades"),
  weaponDualBladesOption: document.querySelector("#weaponDualBladesOption"),
  weaponSwordShield: document.querySelector("#weaponSwordShield"),
  weaponSwordShieldOption: document.querySelector("#weaponSwordShieldOption"),
  weaponEquipGuide: document.querySelector("#weaponEquipGuide"),
  weaponEquipNext: document.querySelector("#weaponEquipNext"),
  weaponPreviewName: document.querySelector("#weaponPreviewName"),
  weaponPreviewImage: document.querySelector("#weaponPreviewImage"),
  weaponPreviewFeatures: document.querySelector("#weaponPreviewFeatures"),
  weaponPreviewStatus: document.querySelector("#weaponPreviewStatus"),
  weaponPreviewRetry: document.querySelector("#weaponPreviewRetry"),
  weaponEquipButton: document.querySelector("#weaponEquipButton"),
  battleScreen: document.querySelector("#battleScreen"),
  introStartButton: document.querySelector("#introStartButton"),
  homeButton: document.querySelector("#homeButton"),
  stageSelectButton: document.querySelector("#stageSelectButton"),
  statusPanel: document.querySelector("#statusPanel"),
  skillTutorialGuide: document.querySelector("#skillTutorialGuide"),
  skillTutorialText: document.querySelector("#skillTutorialText"),
  skillTutorialDetails: document.querySelector("#skillTutorialDetails"),
  skillTutorialNext: document.querySelector("#skillTutorialNext"),
  levelText: document.querySelector("#levelText"),
  statusHpText: document.querySelector("#statusHpText"),
  experienceText: document.querySelector("#experienceText"),
  experienceMeter: document.querySelector("#experienceMeter"),
  experienceFill: document.querySelector("#experienceFill"),
  skillPointsText: document.querySelector("#skillPointsText"),
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
  levelUpReward: document.querySelector("#levelUpReward"),
  levelUpBefore: document.querySelector("#levelUpBefore"),
  levelUpAfter: document.querySelector("#levelUpAfter"),
  levelUpHp: document.querySelector("#levelUpHp"),
  levelUpPoints: document.querySelector("#levelUpPoints"),
  treasureReward: document.querySelector("#treasureReward"),
  treasureText: document.querySelector("#treasureText"),
  treasureArt: document.querySelector("#treasureArt"),
  treasureBlade: document.querySelector("#treasureBlade"),
  treasureSingleSword: document.querySelector("#treasureSingleSword"),
  treasureDualBlades: document.querySelector("#treasureDualBlades"),
  treasureSwordShield: document.querySelector("#treasureSwordShield"),
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
  els.introStartButton.textContent = "初めから";
  els.startButton.textContent = state.running ? t.restart : t.start;
  els.noticeButton.textContent = t.stageSelect;
  els.stageSelectButton.textContent = t.stageSelect;
  els.stageConfirmStart.textContent = t.confirmStart;
  els.stageConfirmCancel.textContent = t.confirmCancel;
  els.keyHint.textContent = t.specialKeyHint;
}

function getWordLengthSettings() {
  return {
    normalMin: 0,
    ...(getStageDefinition(state.stageId).wordLength || {}),
  };
}

function getStatValue(stat) {
  return state.stats?.[stat] ?? defaultPlayerStats[stat] ?? 1;
}

function getAdjustedWordLengthSettings(weaponId = state.weaponId, agility = getStatValue("agility")) {
  const base = getWordLengthSettings();
  const reduction = agility - defaultPlayerStats.agility;
  const normalBaseMax = base.normalMax ?? Math.max(base.normalMin + 8, 8);
  let normalMin = base.normalMin;
  let normalMax = normalBaseMax;
  const weaponWordLength = getWeaponDefinition(weaponId).wordLength;

  if (weaponWordLength?.fixed) {
    return {
      normalMin: Math.max(2, weaponWordLength.normalMin - reduction),
      normalMax: Math.max(2, weaponWordLength.normalMax - reduction),
    };
  }

  if (weaponWordLength) {
    normalMin = Math.max(normalMin, weaponWordLength.normalMin || 0);
    normalMax = Math.max(normalMax, normalMin + (weaponWordLength.maxSpan || 0));
  }

  return {
    normalMin: Math.max(2, normalMin - reduction),
    normalMax: Math.max(minimumWordMaxLength, normalMax - reduction),
  };
}

function getGreatswordCharge(enemy) {
  const weapon = getWeaponDefinition("greatsword");
  const progress = Math.max(0, Math.min(1, enemy?.chargeInputProgress || 0));
  const misses = Math.max(0, enemy?.typingMisses || 0);
  // Every miss reduces both the current charge and this word's attainable charge.
  return progress * Math.pow(1 - weapon.chargeMissPenalty, misses);
}

function getWeaponDamageMultiplier(enemy = null) {
  const weapon = getWeaponDefinition(enemy?.weaponId || getBattleWeaponId());

  if (weapon.id !== "greatsword") {
    return weapon.damageMultiplier || 1;
  }

  return Math.max(weapon.minDamageMultiplier, weapon.maxDamageMultiplier * getGreatswordCharge(enemy));
}

function getPlayerAttackDamage(enemy = null) {
  const weaponId = enemy?.weaponId || getBattleWeaponId();
  if (weaponId === unarmedWeapon.id) return unarmedWeapon.damage;
  const damage = getStatValue("attack") * getWeaponDamageMultiplier(enemy);
  return weaponId === "branch" || weaponId === "greatsword"
    ? Math.round(damage * 10) / 10 : Math.max(1, Math.round(damage));
}

function getSpecialGain() {
  return canChargeSkill() ? (getActiveSkill().gainPerCharacter ?? skillGaugeSettings.gainPerCharacter) : 0;
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
  return canChargeSkill() && !isUnarmedStory()
    && !state.activeEnemies.some(enemy => enemy.tutorial && isEnemyAlive(enemy))
    && (getActiveSkill().target !== "self" || state.hp < getMaxHp())
    && (getActiveSkill().target !== "battle" || !isEnemyActionStopped())
    && state.specialGauge >= specialGaugeMax;
}

function updateStatusPanel() {
  const activeWeapon = getActiveWeapon();
  els.levelText.textContent = state.level;
  els.statusHpText.textContent = `${Math.max(0, Math.round(state.hp))} / ${getMaxHp()}`;
  els.statusAttackText.textContent = getStatValue("attack");
  els.statusAgilityText.textContent = getStatValue("agility");
  const wordLength = getAdjustedWordLengthSettings();
  els.statusWordLengthText.textContent = `${wordLength.normalMin}〜${wordLength.normalMax}文字`;
  const required = progression.experienceToNextLevel(state.level);
  const atMaxLevel = required === 0;
  const experienceLabel = atMaxLevel ? "MAX" : `${state.experience} / ${required} EXP`;
  els.experienceText.textContent = experienceLabel;
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
  els.homeButton.textContent = "ホーム";
  els.progressSaveStatus.hidden = progressionSaveAvailable;
  els.progressSaveStatus.textContent = progressionSaveAvailable ? "" : "保存できませんでした。";
  els.progressionNotice.textContent = state.progressNotice;
  els.progressionNotice.hidden = !state.progressNotice;
  document.documentElement.dataset.weapon = activeWeapon.id;

  els.weaponPanel.querySelectorAll("input[name='weapon']").forEach((input) => {
    const available = isWeaponAvailable(input.value);
    input.checked = input.value === (!els.weaponScreen.hidden ? weaponMenuState.selectedId : activeWeapon.id);
    input.disabled = state.running || !available;
    input.closest(".weapon-option").hidden = !available;
  });

  updateWeaponEquipGuide();
  updateWeaponDetails();

  els.statusPanel.querySelectorAll("[data-stat][data-stat-delta]").forEach((button) => {
    const stat = button.dataset.stat;
    const capped = getStatValue(stat) >= progression.rules.statMax[stat];
    button.disabled = state.running || !progression.canUpgrade(state, stat);
    button.textContent = capped ? "MAX" : "＋1";
    button.title = capped ? "強化上限です" : state.skillPoints > 0 ? "スキルポイントを1使って強化" : "レベルアップでスキルポイントを獲得";
  });
  updateSkillTutorial();
}

function syncPlayerWeaponArt(weapon, chargePose = 0) {
  if (els.battleScreen.hidden) return;
  const assets = getPlayerWeaponAssets(weapon.id);
  const frames = [
    [els.playerFrameIdle, assets.idle],
    [els.playerFrameGuard, assets.guard || assets.idle],
    [els.playerFrameWindup, assets.charge?.[chargePose] || assets.windup],
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

  const playerLabel = state.guarding ? getPlayerGuardLabel()
    : weapon.id === "unarmed" ? "素手で構える主人公" : `${weapon.name}を装備した主人公`;
  els.playerFrameIdle.alt = playerLabel;
  els.player.setAttribute("aria-label", playerLabel);
}

function updateWeaponCharge() {
  const selectedEnemy = getCurrentEnemy();
  const weapon = getWeaponDefinition(selectedEnemy?.weaponId || getBattleWeaponId());
  const isGreatsword = weapon.id === "greatsword";
  const chargeProgress = isGreatsword ? getGreatswordCharge(selectedEnemy) : 0;
  const chargePercent = Math.round(chargeProgress * 1000) / 10;
  const chargeLevel = chargeProgress > 0 ? Math.min(4, Math.ceil(chargeProgress * 4)) : 0;
  const chargePose = isGreatsword
    ? weapon.chargePoseThresholds.filter(threshold => chargeProgress >= threshold).length : 0;
  const damage = getPlayerAttackDamage(selectedEnemy || { weaponId: weapon.id });

  syncPlayerWeaponArt(weapon, chargePose);
  els.battleWeaponName.textContent = weapon.name;
  const chargeHidden = !isGreatsword || !state.running || isStoryDialogueOpen();
  if (els.weaponCharge.hidden !== chargeHidden) {
    els.weaponCharge.hidden = chargeHidden;
    scheduleBattleLayout();
  }
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
      && chargeProgress > 0
    ),
  );

  if (!isGreatsword) {
    return;
  }

  els.weaponChargeFill.style.width = `${chargePercent}%`;
  els.weaponCharge.dataset.penalized = String((selectedEnemy?.typingMisses || 0) > 0);
  els.weaponCharge.dataset.full = String(chargeProgress === 1);
  els.weaponChargeMeter.setAttribute("aria-valuemax", "100");
  els.weaponChargeMeter.setAttribute("aria-valuenow", String(chargePercent));
  els.weaponChargeMeter.setAttribute("aria-valuetext", `溜め${chargePercent}％、攻撃力${damage}`);
}

function clearPlayerAttackCooldown() {
  window.clearTimeout(state.playerAttackCooldownTimerId);
  state.playerAttackCooldownTimerId = 0;
  state.playerAttackReadyAt = 0;
  state.playerAttackCooldownMs = 0;
  updateAttackCooldown();
}

function updateAttackCooldown() {
  const remaining = Math.max(0, state.playerAttackReadyAt - performance.now());
  els.attackCooldown.hidden = !state.running || state.hp <= 0 || remaining === 0;
  const percent = state.playerAttackCooldownMs > 0
    ? Math.ceil(remaining / state.playerAttackCooldownMs * 100) : 0;
  els.attackCooldown.setAttribute("aria-valuenow", String(percent));
}

function snapshotAttackCooldowns() {
  // Use configured word lengths, never the randomly selected word's length.
  state.stageAttackCooldowns = Object.fromEntries(
    [...Object.values(weaponDefinitions), unarmedWeapon].map(weapon => {
      const base = getAdjustedWordLengthSettings(weapon.id, defaultPlayerStats.agility);
      const adjusted = getAdjustedWordLengthSettings(weapon.id);
      const unarmedLength = wordSets.unarmed.reduce((sum, word) => sum + word.text.length, 0)
        / wordSets.unarmed.length;
      const ratio = weapon.id === "unarmed"
        ? Math.max(1, unarmedLength - (getStatValue("agility") - defaultPlayerStats.agility)) / unarmedLength
        : (adjusted.normalMin + adjusted.normalMax) / (base.normalMin + base.normalMax);
      return [weapon.id, Math.max(1, Math.round((weapon.attackCooldownMs ?? 220) * ratio))];
    }),
  );
}

function startPlayerAttackCooldown(weaponId) {
  clearInputBuffer();
  clearTypingMissEffect();
  clearPlayerAttackCooldown();
  const duration = state.stageAttackCooldowns[weaponId];
  state.playerAttackCooldownMs = duration;
  state.playerAttackReadyAt = performance.now() + duration;
  els.attackCooldown.style.setProperty("--attack-cooldown-duration", `${duration}ms`);
  els.attackCooldownFill.style.animation = "none";
  void els.attackCooldownFill.offsetWidth;
  els.attackCooldownFill.style.animation = "";
  updateAttackCooldown();
  renderWord();
  state.playerAttackCooldownTimerId = scheduleBattleTimeout(() => {
    state.playerAttackCooldownTimerId = 0;
    state.playerAttackReadyAt = 0;
    // The newly visible prompt starts with fresh input.
    renderWord();
    updateHud();
    flushBufferedInput();
  }, duration);
}

function updateHud() {
  updateDualBladePreview();
  updateGuardHud();
  syncGameFlickKeyboard();
  updateAttackCooldown();
  const playerHp = Math.max(0, Math.min(state.hp, getMaxHp()));
  els.scoreText.textContent = state.score;
  els.comboText.textContent = state.combo;
  els.playerHpFill.style.width = `${(playerHp / getMaxHp()) * 100}%`;
  els.playerHpTrack.setAttribute("aria-valuemax", String(getMaxHp()));
  els.playerHpTrack.setAttribute("aria-valuenow", String(playerHp));
  updateSkillHud();
  updateWeaponCharge();
  updateStatusPanel();
}

function showScreen(screen) {
  if (screen !== "weapons") state.weaponEquipGuideId = "";
  if (screen !== "status") state.skillGuideActive = false;
  updateWeaponEquipGuide();
  updateSkillTutorial();
  saveEls.screen.hidden = screen !== "saves";
  els.startScreen.hidden = screen !== "start";
  els.stageScreen.hidden = screen !== "stage";
  els.homeScreen.hidden = screen !== "home";
  els.weaponScreen.hidden = screen !== "weapons";
  els.statusScreen.hidden = screen !== "status";
  els.battleScreen.hidden = screen !== "battle";
  document.documentElement.dataset.screen = screen;
  updateBattleViewport();
}

function focusStartSurface() {
  els.introStartButton.focus({ preventScroll: true });
}

function focusGameSurface({ userGesture = false } = {}) {
  if (flickState.enabled) {
    // Focus the non-editable prompt; the system keyboard must stay closed.
    if (userGesture && state.running && !isStoryDialogueOpen()) {
      els.typingStatus.focus({ preventScroll: true });
    }
    return;
  }
  document.body.tabIndex = -1;
  document.body.focus({ preventScroll: true });
}

function focusStageSurface() {
  const focusedStage = els.stageChoices.querySelector(".stage-choice.is-selected:not([hidden]):not(:disabled)");
  const firstStage = els.stageChoices.querySelector(".stage-choice:not([hidden]):not(:disabled)");
  (focusedStage || firstStage || els.homeButton).focus({ preventScroll: true });
}

function hideGameNotice() {
  els.gameNotice.classList.remove("is-visible", "is-actionable", "has-treasure", "has-level-up");
  els.levelUpReward.hidden = true;
  els.treasureReward.hidden = true;
  els.treasureText.hidden = true;
  els.gameNotice.setAttribute("aria-hidden", "true");
}

function clearNoticeTimer() {
  window.clearTimeout(state.noticeTimerId);
  state.noticeTimerId = 0;
}

function clearStartDelayTimer() {
  window.clearTimeout(state.startDelayTimerId);
  state.startDelayTimerId = 0;
  state.battleStartsAt = 0;
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
  const retentionMs = Math.max(inputBufferRetentionMs, state.playerAttackCooldownMs + 250);
  const oldestQueuedAt = now - retentionMs;

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
  if (!state.running || state.guarding || state.specialInProgress || isUnarmedStory() || isStoryDialogueOpen()) {
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
  updateGuardHud();
}

function applyBufferedInputEntry(enemy, entry) {
  if (state.selectedEnemyId !== enemy.id) setTargetEnemy(enemy);

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
  updateGuardHud();

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
  const { persistent = false, duration = 900, treasure = "", levelUp = null } = options;

  clearNoticeTimer();
  els.gameNotice.dataset.kind = kind;
  els.levelUpReward.hidden = !levelUp;
  els.gameNotice.classList.toggle("has-level-up", Boolean(levelUp));
  if (levelUp) {
    els.levelUpBefore.textContent = `Lv.${levelUp.from}`;
    els.levelUpAfter.textContent = `Lv.${levelUp.to}`;
    els.levelUpHp.textContent = `+${levelUp.hp}`;
    els.levelUpPoints.textContent = `+${levelUp.points}`;
  }
  els.treasureReward.hidden = !treasure;
  els.treasureText.hidden = !treasure;
  els.gameNotice.classList.toggle("has-treasure", Boolean(treasure));
  if (treasure) {
    const weaponName = getWeaponDefinition(treasure).name;
    if (treasure === "dualBlades") els.treasureDualBlades.setAttribute("href", weaponDefinitions.dualBlades.itemImage);
    if (treasure === "swordShield") els.treasureSwordShield.setAttribute("href", weaponDefinitions.swordShield.itemImage);
    els.treasureText.textContent = `${weaponName}を手に入れた！`;
    els.treasureArt.setAttribute("aria-label", `宝箱から現れた${weaponName}`);
    els.treasureSingleSword.style.display = ["dualBlades", "swordShield"].includes(treasure) ? "none" : "";
    els.treasureDualBlades.style.display = treasure === "dualBlades" ? "" : "none";
    els.treasureSwordShield.style.display = treasure === "swordShield" ? "" : "none";
    els.treasureBlade.setAttribute("d", treasure === "greatsword"
      ? "M140 10L166 31V110L140 122L114 110V31Z"
      : "M140 10L151 31V110L140 122L129 110V31Z");
  }
  els.noticeKicker.textContent = kicker;
  els.noticeTitle.textContent = title;
  els.noticeText.textContent = text;
  els.noticeButton.textContent = labels().stageSelect;
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
  const isPrologue = phase === "encounter" && !state.prologueCompleted;
  const scene = isPrologue ? prologueScenes[state.prologueSceneIndex] : null;
  els.battleScreen.dataset.storyPhase = phase;
  els.battleScreen.classList.toggle("is-prologue", isPrologue);
  els.storyDialog.classList.toggle("is-prologue", isPrologue);
  els.storyDialog.setAttribute("aria-label", isPrologue ? "物語のはじまり" : "会話");
  els.storyDialog.hidden = !dialogueOpen;
  els.storyItem.hidden = phase !== "weapon-offer";
  if (phase === "weapon-offer") document.querySelector("#storyItemImage").src = "src/assets/images/items/weapons/branch.webp?v=branch-intro-v1";
  els.prologueImage.hidden = !isPrologue;
  els.prologueTitle.hidden = !isPrologue;
  if (scene) {
    els.prologueImage.src = scene.image;
    els.prologueImage.alt = scene.alt;
    els.prologueTitle.textContent = scene.title;
  }
  els.storyNextButton.textContent = isPrologue
    ? state.prologueSceneIndex === prologueScenes.length - 1 ? "浜辺へ" : "次へ"
    : phase === "weapon-offer" ? "装備する" : "次へ";
  els.typingBox.hidden = dialogueOpen;
  els.storyText.textContent = isPrologue
    ? scene.text
    : phase === "encounter" ? "敵が現れた！"
      : phase === "weapon-offer" ? "木の枝を拾った！" : "";
}

function showStoryDialogue(phase) {
  clearTypingMissEffect();
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
    if (!state.prologueCompleted) {
      if (state.prologueSceneIndex < prologueScenes.length - 1) {
        state.prologueSceneIndex += 1;
        setStoryPhase("encounter");
        return;
      }
      state.prologueCompleted = true;
      savePlayerProgress();
    }
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
      enemy.nextAttackAt = performance.now() + randomizeEnemyAttackMs(enemy.repeatAttackMs);
      setNextWord(enemy);
      playEnemyAnimation(enemy, "idle");
    });
    setTargetEnemy(getCurrentEnemy());
    savePlayerProgress();
  }

  updateHud();
  startLoop();
  focusGameSurface({ userGesture: true });
}

function isStageAvailable(stageId, player = state) {
  const stage = stageDefinitions[stageId];
  return Boolean(stage?.enabled
    && (!stage.requiresTutorial || player.equipmentTutorialCompleted)
    && (!stage.requiresStage || player.clearedStages.includes(stage.requiresStage)));
}

function getHighestAvailableStageCode(player = state) {
  return Object.entries(stageDefinitions)
    .filter(([id]) => isStageAvailable(id, player)).at(-1)?.[1].code || stageDefinitions[defaultStageId].code;
}

function continueAfterResult() {
  if (state.running) return;
  const nextStageId = getStageDefinition(state.stageId).nextStageId;
  if (els.gameNotice.dataset.kind === "clear" && getPendingWeaponEquipId()
      && getStageDefinition(state.stageId).rewardWeaponId === getPendingWeaponEquipId()) {
    showWeaponScreen();
  } else if (els.gameNotice.dataset.kind === "clear" && state.skillTutorialPending
      && getStageDefinition(state.stageId).skillPointTutorial) {
    showStatusScreen();
  } else if (els.gameNotice.dataset.kind === "clear" && isStageAvailable(nextStageId)) {
    startGame(nextStageId);
  } else {
    showStageSelect();
  }
}

function switchStageMap(regionId) {
  if (!Object.hasOwn(stageMapRegions, regionId)) return;
  if (ensureGameAssets(imageSources([stageMapRegions[regionId].image]), () => switchStageMap(regionId))) return;
  state.stageMapRegionId = regionId;
  hideStageConfirm();
}

function syncStageButtons() {
  const region = stageMapRegions[state.stageMapRegionId];
  if (!els.stageScreen.hidden) els.stageScreen.style.setProperty("--map-background", `url("${new URL(region.image, document.baseURI).href}")`);
  els.stageMapPanel.dataset.region = state.stageMapRegionId;
  els.stageMapPanel.setAttribute("aria-label", `${region.name}の地図`);
  if (!els.stageScreen.hidden && els.stageMapImage.getAttribute("src") !== region.image) els.stageMapImage.setAttribute("src", region.image);
  els.stageRegionSwitch.querySelectorAll("[data-region]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.region === state.stageMapRegionId));
  });
  els.stageChoices.querySelectorAll("[data-stage]").forEach((button) => {
    const stageId = button.dataset.stage;
    const stage = stageDefinitions[stageId];
    const isEnabled = isStageAvailable(stageId);
    const isSelected = isEnabled && stageId === state.pendingStageId;
    const code = button.querySelector(".stage-code");
    const name = button.querySelector(".stage-name");
    const meta = button.querySelector(".stage-meta");

    button.hidden = stage?.regionId !== state.stageMapRegionId;
    button.disabled = !isEnabled;
    button.setAttribute("aria-disabled", String(!isEnabled));
    button.setAttribute("aria-controls", "stageConfirm");
    button.setAttribute("aria-expanded", String(isSelected));
    button.classList.toggle("is-selected", isSelected);

    if (!stage) {
      button.setAttribute("aria-label", "利用できないステージ");
      return;
    }

    const lockedReason = stage.requiresStage
      ? `ステージ${getStageDefinition(stage.requiresStage).code}未クリア`
      : stage.requiresTutorial ? "チュートリアル未クリア" : stage.meta;
    button.setAttribute("aria-label", [stage.code, stage.name, isEnabled ? "" : lockedReason].filter(Boolean).join(" "));

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
    (button) => button.dataset.stage === selectedStageId && !button.disabled && !button.hidden,
  );

  hideStageConfirm();
  (selectedStageButton || els.stageChoices.querySelector(".stage-choice:not([hidden]):not(:disabled)") || els.homeButton).focus({
    preventScroll: true,
  });
}

function showStageConfirm(stageId) {
  const stage = stageDefinitions[stageId];

  if (!isStageAvailable(stageId)) {
    return;
  }

  state.pendingStageId = stageId;
  state.stageMapRegionId = stage.regionId;
  els.stageConfirmName.textContent = stage.name;
  els.stageConfirmMeta.textContent = stage.meta;
  els.stageConfirmMeta.hidden = !stage.meta;
  els.stageConfirm.hidden = false;
  syncStageButtons();
  els.stageConfirmStart.focus({ preventScroll: true });
}

function startConfirmedStage() {
  const stageId = state.pendingStageId;
  if (!isStageAvailable(stageId)) {
    return;
  }

  hideStageConfirm();
  startGame(stageId);
}

function showStartScreen() {
  if (!assetLoadingState.ready) return;
  activeSaveSlot = null;
  activeSaveToken = null;
  refreshSaveMenu();
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
  if (!assetLoadingState.ready || activeSaveSlot === null) return;
  if (ensureGameAssets(imageSources([stageMapRegions[state.stageMapRegionId].image]), showStageSelect)) return;
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
  syncStageButtons();
  focusStageSurface();
}

function showMenuScreen(screen) {
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
  showScreen(screen);
}

function showHomeScreen() {
  if (ensureGameAssets(imageSources(["src/assets/images/backgrounds/status/base_interior.webp"]), showHomeScreen)) return;
  const fromStatus = !els.statusScreen.hidden;
  showMenuScreen("home");
  (fromStatus ? els.homeStatusButton : els.homeWeaponsButton).focus({ preventScroll: true });
}

function getPendingWeaponEquipId() {
  if (state.swordShieldEquipPending) return "swordShield";
  if (state.dualBladesEquipPending) return "dualBlades";
  if (state.greatswordEquipPending) return "greatsword";
  return state.swordEquipPending ? "sword" : "";
}

function getEquipmentNextStageId() {
  const rewardStage = Object.values(stageDefinitions).find(stage => stage.rewardWeaponId === state.weaponEquipGuideId);
  return isStageAvailable(rewardStage?.nextStageId) ? rewardStage.nextStageId : "";
}

function updateWeaponEquipGuide() {
  const weaponId = state.weaponEquipGuideId;
  const active = Boolean(weaponId);
  const equipped = active && state.weaponId === weaponId;
  const weaponName = getWeaponDefinition(weaponId).name;
  els.weaponEquipGuide.hidden = !active;
  els.weaponEquipGuide.textContent = equipped
    ? `${weaponName}を装備しました` : `${weaponName}を選んで装備しよう`;
  els.weaponSwordOption.classList.toggle("is-recommended", weaponId === "sword" && !equipped);
  els.weaponGreatswordOption.classList.toggle("is-recommended", weaponId === "greatsword" && !equipped);
  els.weaponDualBladesOption.classList.toggle("is-recommended", weaponId === "dualBlades" && !equipped);
  els.weaponSwordShieldOption.classList.toggle("is-recommended", weaponId === "swordShield" && !equipped);
  els.weaponEquipNext.hidden = !active;
  els.weaponEquipNext.disabled = !active || !equipped;
  const nextStageId = getEquipmentNextStageId();
  els.weaponEquipNext.textContent = nextStageId ? `ステージ${stageDefinitions[nextStageId].code}へ` : labels().stageSelect;
}

function showWeaponScreen() {
  if (ensureGameAssets(imageSources(["src/assets/images/backgrounds/status/base_interior.webp"]), showWeaponScreen)) return;
  state.weaponEquipGuideId = getPendingWeaponEquipId();
  weaponMenuState.selectedId = state.weaponEquipGuideId || state.weaponId;
  weaponMenuState.loadingSrc = "";
  showMenuScreen("weapons");
  updateWeaponDetails();
  const selected = els.weaponPanel.querySelector("input[name='weapon']:checked:not(:disabled)");
  const recommended = state.weaponEquipGuideId === "swordShield" ? els.weaponSwordShield
    : state.weaponEquipGuideId === "dualBlades" ? els.weaponDualBlades
    : state.weaponEquipGuideId === "greatsword" ? els.weaponGreatsword : els.weaponSword;
  const focusTarget = state.weaponEquipGuideId ? recommended : selected || els.weaponHomeButton;
  focusTarget.focus({ preventScroll: true });
}

function continueAfterWeaponEquip() {
  if (state.running || !state.weaponEquipGuideId || state.weaponId !== state.weaponEquipGuideId) return;
  const nextStageId = getEquipmentNextStageId();
  if (nextStageId) startGame(nextStageId);
  else showStageSelect();
}

function updateSkillTutorial() {
  const active = state.skillGuideActive;
  const pending = state.skillTutorialPending;
  els.skillTutorialGuide.hidden = !active;
  els.skillTutorialText.textContent = pending ? "「＋1」を押して、ポイントを1振り分けよう。" : "振り分け完了！";
  els.skillTutorialDetails.hidden = !pending;
  els.skillTutorialNext.hidden = !active;
  els.skillTutorialNext.disabled = !active || pending;
  els.statusPanel.dataset.skillTutorial = String(active && pending);
}

function showStatusScreen() {
  if (ensureGameAssets(imageSources(["src/assets/images/backgrounds/status/base_interior.webp"]), showStatusScreen)) return;
  state.skillGuideActive = state.skillTutorialPending;
  showMenuScreen("status");
  els.statusPanel.scrollTop = 0;
  (state.skillGuideActive ? els.skillTutorialText : els.statusHomeButton).focus({ preventScroll: true });
}

function continueAfterSkillTutorial() {
  if (state.running || !state.skillGuideActive || state.skillTutorialPending || !state.skillTutorialCompleted) return;
  showStageSelect();
}

function changePlayerStat(stat, delta) {
  if (state.running || delta !== 1 || !progression.upgrade(state, stat)) return false;
  if (state.skillTutorialPending) {
    state.skillTutorialPending = false;
    state.skillTutorialCompleted = true;
  }
  savePlayerProgress();
  updateHud();
  return true;
}

function selectWeapon(weaponId) {
  if (state.running || !isWeaponAvailable(weaponId) || state.weaponId === weaponId) {
    updateStatusPanel();
    return;
  }

  state.weaponId = weaponId;
  weaponMenuState.selectedId = weaponId;
  if (weaponId === "sword") state.swordEquipPending = false;
  if (weaponId === "greatsword") state.greatswordEquipPending = false;
  if (weaponId === "dualBlades") state.dualBladesEquipPending = false;
  if (weaponId === "swordShield") state.swordShieldEquipPending = false;
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
  const visualAnimation = enemy.animation === "idle" && isEnemyWindingUp(enemy) ? "windup" : enemy.animation;
  const frames = getEnemyFrames(enemy.type, visualAnimation);

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
  enemy.element.classList.remove("attack", "typing-shake");
}

function playEnemyAnimation(enemy, animationName, options = {}) {
  const { duration = 0, loop = true, next = "idle" } = options;
  const frames = getEnemyFrames(enemy.type, animationName);

  clearEnemyAnimationTimers(enemy);
  enemy.animation = animationName;
  enemy.frameIndex = 0;
  enemy.sprite.dataset.animation = animationName;
  updateEnemyFrame(enemy);
  updateEnemyCharge(enemy);

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (frames.length > 1 && !prefersReducedMotion) {
    enemy.frameTimerId = window.setInterval(() => {
      if (!loop && enemy.frameIndex >= frames.length - 1) {
        window.clearInterval(enemy.frameTimerId);
        enemy.frameTimerId = 0;
        return;
      }

      if (isEnemyActionStopped() && ["idle", "attack"].includes(enemy.animation)) return;
      enemy.frameIndex = (enemy.frameIndex + 1) % frames.length;
      updateEnemyFrame(enemy);
    }, enemyAnimations.settings?.[enemy.type]?.frameMs ?? enemyAnimations.frameMs);
  }

  if (duration > 0) {
    enemy.returnTimerId = scheduleBattleTimeout(() => {
      playEnemyAnimation(enemy, next);
    }, duration);
  }
}

function stopEnemyWalkingAnimation(enemy) {
  // Fish keep moving their fins between attacks, even after reaching the player.
  if (enemyAnimations.settings?.[enemy.type]?.idleWhileStopped
      && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    if (enemy.animation !== "idle" || !enemy.frameTimerId) playEnemyAnimation(enemy, "idle");
    return;
  }

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
  // Let the short pulse finish during rapid typing instead of forcing layout
  // to restart the animation on every key, which delays the text's next paint.
  if (enemy.typingShakeTimerId) return;
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
  const duration = getWeaponDefinition(enemy.weaponId).attackAnimationMs || playerAttackMs;
  els.player.style.setProperty("--player-attack-duration", `${duration}ms`);
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
  }, duration);
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
  els.bossIntroTitle.textContent = enemy.name || t.bossTitle;
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

function renderWord() {
  updateDualBladePreview();
  syncFlickInput();
  updateGuardHud();
  const selectedEnemy = performance.now() < state.playerAttackReadyAt ? null : getCurrentEnemy();

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

  return selectedEnemy || state.activeEnemies.find((enemy) => isEnemyAlive(enemy)) || null;
}

function getInputEnemy() {
  if (isStoryDialogueOpen() || state.hp <= 0 || state.specialInProgress || state.guarding
      || performance.now() < state.playerAttackReadyAt) return null;
  const selectedEnemy = getSelectedEnemy();

  if (selectedEnemy && isEnemyAlive(selectedEnemy) && !selectedEnemy.resolving) {
    return selectedEnemy;
  }

  return state.activeEnemies.find((enemy) => isEnemyAlive(enemy) && !enemy.resolving) || null;
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
  element.dataset.attackStyle = enemy.attackStyle;
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
      <span class="enemy-time-stop-mark" aria-hidden="true">Ⅱ</span>
    </div>
  `;

  enemy.element = element;
  enemy.sprite = element.querySelector(".enemy-sprite");
  enemy.image = element.querySelector(".enemy-image");
  enemy.hpFill = element.querySelector(".character-hp-track i");
  enemy.hpTrack = element.querySelector(".character-hp-track");
  if (enemy.attackStyle === "charge") {
    element.setAttribute("role", "group");
  }
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

function isEnemyAlive(enemy) {
  return enemy.tutorial
    ? enemy.tutorial.branchHits < enemy.tutorial.requiredBranchHits
    : enemy.hp > 0;
}

function getTutorialGaugePercent(enemy) {
  const tutorial = enemy.tutorial;
  const afterPunches = 100 - tutorial.punches;
  return Math.round(afterPunches * (1 - tutorial.branchHits / tutorial.requiredBranchHits) * 100) / 100;
}

function recordTutorialHit(enemy) {
  const tutorial = enemy.tutorial;
  if (state.storyPhase === "unarmed" && enemy.weaponId === "unarmed" && tutorial.punches < tutorial.requiredPunches) {
    tutorial.punches += 1;
    return true;
  }
  if (state.storyPhase === "armed" && enemy.weaponId === "branch"
      && tutorial.punches === tutorial.requiredPunches && tutorial.branchHits < tutorial.requiredBranchHits) {
    tutorial.branchHits += 1;
    return true;
  }
  return false;
}

function updateEnemyHud(enemy) {
  const value = enemy.tutorial ? getTutorialGaugePercent(enemy) : Math.max(0, enemy.hp);
  const maximum = enemy.tutorial ? 100 : enemy.maxHp;
  enemy.hpFill.style.width = `${(value / maximum) * 100}%`;
  enemy.hpTrack.setAttribute("aria-label", enemy.tutorial ? "敵のゲージ" : enemy.name ? `${enemy.name}のHP` : "敵の体力");
  enemy.hpTrack.setAttribute("aria-valuemax", String(maximum));
  enemy.hpTrack.setAttribute("aria-valuenow", String(value));
}

function updateEnemyWordLabel(enemy) {
  enemy.wordTranslationEl.textContent = enemy.translation;
  enemy.wordTypedEl.textContent = enemy.typed;
  enemy.wordRemainingEl.textContent = enemy.matchedWord.slice(enemy.typed.length);
}

function setEnemyProgress(enemy, progress) {
  if (enemy.attackStyle === "charge") progress = enemy.fixedProgress;
  enemy.progress = Math.max(0, Math.min(progress, 1));
  if (enemy.progress < 1) enemy.atBase = false;
  enemy.element.style.setProperty("--enemy-progress", enemy.progress.toFixed(3));
}

function setTargetEnemy(enemy) {
  state.selectedEnemyId = enemy?.id || "";
  state.activeEnemies.forEach((activeEnemy) => {
    activeEnemy.element.classList.toggle("is-targeted", activeEnemy.id === state.selectedEnemyId);
  });
  renderWord();
}

function chooseEnemyWord(enemy) {
  const weapon = getWeaponDefinition(enemy.weaponId);
  const wordLength = getAdjustedWordLengthSettings(weapon.id);
  return weapon.id === "unarmed"
    ? wordSets.unarmed[enemy.tutorial.punches % wordSets.unarmed.length]
    : chooseWord({
      minLength: wordLength.normalMin,
      maxLength: wordLength.normalMax,
      useShortestInputLength: Boolean(weapon.useShortestInputLength),
      wordList: weapon.words,
    });
}

function setNextWord(enemy) {
  const reserved = enemy.weaponId === "dualBlades"
    ? enemy.nextWordPreview || (!enemy.word ? state.dualNextSpawnWord : null) : null;
  const next = reserved || chooseEnemyWord(enemy);
  if (reserved === state.dualNextSpawnWord) state.dualNextSpawnWord = null;
  enemy.nextWordPreview = null;
  enemy.word = next.text;
  enemy.readingOverride = next.reading || "";
  enemy.inputRevision = (enemy.inputRevision || 0) + 1;
  enemy.flickRoman = "";
  enemy.inputs = getWordInputs(next);
  enemy.matchedWord = enemy.inputs[0] || next.text;
  enemy.translation = next.translation;
  enemy.bestLength = 0;
  enemy.typingMisses = 0;
  enemy.chargeInputProgress = 0;
  enemy.typed = "";
  updateEnemyWordLabel(enemy);
}

function createEnemy(wave, index) {
  const usedSlots = new Set(state.activeEnemies.map(enemy => enemy.slot));
  let slot = 0;
  while (usedSlots.has(slot)) slot++;
  const enemy = {
    id: `enemy-${state.nextEnemyId}`,
    type: getEnemyTypeForWave(wave, index),
    name: wave.name || "",
    slot,
    attackPower: normalizeAttackPower(wave.attackPower),
    approachMs: randomizeEnemyAttackMs(wave.approachMs ?? attackMs),
    repeatAttackMs: wave.repeatAttackMs ?? repeatAttackMs,
    attackStyle: wave.attackStyle || "melee",
    chargeAttackLabel: wave.chargeAttackLabel || "胞子攻撃！",
    baseChargeDurationMs: Math.max(1000, wave.chargeMs ?? 6000),
    chargeDurationMs: randomizeEnemyAttackMs(Math.max(1000, wave.chargeMs ?? 6000)),
    chargeElapsedMs: 0,
    fixedProgress: wave.fixedProgress ?? 0.15,
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
    chargeInputProgress: 0,
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

  const intro = getStageDefinition(state.stageId).storyIntro;
  if (intro && state.storyPhase === "unarmed" && state.currentWaveIndex === 0 && index === 0) {
    enemy.tutorial = { punches: 0, branchHits: 0, requiredPunches: intro.punches, requiredBranchHits: intro.branchHits };
  } else {
    enemy.maxHp = wave.hp;
    enemy.hp = wave.hp;
  }

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
  state.dualNextSpawnWord = null;
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
  markStoppedEnemy(enemy);
  els.enemyLayer.appendChild(enemy.element);
  scheduleBattleLayout();
  playEnemyAnimation(enemy, "idle");
  if (!getSelectedEnemy()) setTargetEnemy(getCurrentEnemy() || enemy);

  if (enemy.boss) {
    playBossIntro(enemy);
  }

  updateHud();
  flushBufferedInput();
}

function spawnNextEnemy() {
  const wave = chooseEnemyWave();

  if (!state.running || state.hp <= 0 || isStoryDialogueOpen() || !wave) {
    return;
  }

  const index = state.currentWaveSpawned;

  if (index >= wave.count || state.activeEnemies.length >= (wave.maxActive || 1)) {
    return;
  }

  state.currentWaveSpawned += 1;
  addEnemyToWave(wave, index);
  if (wave.spawnIntervalMs && state.currentWaveSpawned < wave.count) queueEnemySpawn(wave.spawnIntervalMs);
}

function queueEnemySpawn(delay) {
  if (!state.running || state.enemySpawnTimerId) return;
  // Give the first enemy time to move after START before revealing the next one.
  const startWait = Math.max(0, state.battleStartsAt - performance.now());
  state.enemySpawnTimerId = scheduleBattleTimeout(() => {
    state.enemySpawnTimerId = 0;
    spawnNextEnemy();
  }, startWait + delay);
}

function queueNextEnemy() {
  const wave = chooseEnemyWave();

  if (!wave) {
    return;
  }

  if (state.currentWaveSpawned >= wave.count) {
    if (state.activeEnemies.length) return;
    state.currentWaveIndex += 1;
    state.currentWaveSpawned = 0;
    queueEnemySpawn(260);
  } else {
    queueEnemySpawn(wave.spawnIntervalMs || 260);
  }
}

function removeEnemy(enemy) {
  clearEnemyAnimationTimers(enemy);
  enemy.element.remove();
  state.activeEnemies = state.activeEnemies.filter((activeEnemy) => activeEnemy.id !== enemy.id);
  scheduleBattleLayout();

  if (state.selectedEnemyId === enemy.id) {
    setTargetEnemy(null);
  }
}

function enemyLoop(now) {
  if (!state.running || state.hp <= 0 || isStoryDialogueOpen() || now < state.battleStartsAt) {
    return;
  }

  updateAttackCooldown();

  state.activeEnemies.forEach((enemy) => {
    if (isEnemyActionStopped()) { enemy.lastTick = now; return; }
    if (enemy.resolving || enemy.animation === "attack") {
      enemy.lastTick = now;
      return;
    }

    if (enemy.attackStyle === "charge") {
      advanceEnemyCharge(enemy, now);
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
    setEnemyProgress(enemy, enemy.progress + elapsed / enemy.approachMs);

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
  if (isEnemyActionStopped()) return;
  if (!state.running || state.hp <= 0 || isStoryDialogueOpen() || enemy.resolving
      || enemy.animation === "attack" || !isEnemyAlive(enemy) || !state.activeEnemies.includes(enemy)) return;
  if (enemy.attackStyle === "charge") {
    if (performance.now() < state.battleStartsAt || enemy.chargeElapsedMs < enemy.chargeDurationMs) return;
    resetEnemyCharge(enemy);
    aimEnemySpores(enemy);
  } else if (enemy.progress < 1) return;
  enemy.atBase = enemy.attackStyle !== "charge";
  enemy.nextAttackAt = performance.now() + enemyAttackRecoveryMs + randomizeEnemyAttackMs(enemy.repeatAttackMs);
  const damage = rollAttackDamage(enemy.attackPower);
  const guarded = state.guarding && canPlayerGuard();
  const receivedDamage = guarded ? Math.ceil(damage * getActiveWeapon().guardDamageMultiplier) : damage;
  state.hp = Math.max(0, state.hp - receivedDamage);
  if (guarded) playGuardImpact();
  if (receivedDamage > 0) {
    if (!guarded) window.GAME_SOUND.play("hurt");
    playPlayerDamageEffect(receivedDamage, guarded);
    state.combo = 0;
    resetSuccessStreak();
    state.perfect = false;
  }
  playEnemyAnimation(enemy, "attack", { loop: false });
  enemy.element.classList.add("attack");
  // Only a fatal hit locks input; the incoming attack animation does not.
  enemy.resolving = state.hp <= 0;
  updateHud();

  if (state.hp <= 0) {
    scheduleBattleTimeout(() => finishGame(false), 320);
    return;
  }

  // A counterattack replaces this animation and cancels its recovery callback.
  enemy.returnTimerId = scheduleBattleTimeout(() => {
    if (state.running) {
      stopEnemyWalkingAnimation(enemy);
      enemy.lastTick = performance.now();
      updateEnemyCharge(enemy);
      updateHud();
    }
  }, enemyAttackRecoveryMs);
}

function damageEnemy(enemy) {
  if (!state.running || state.hp <= 0 || state.guarding || isStoryDialogueOpen() || !isEnemyAlive(enemy) || enemy.resolving
      || performance.now() < state.playerAttackReadyAt) return;
  const weapon = getWeaponDefinition(enemy.weaponId);
  const recoveryMs = Math.min(weapon.attackRecoveryMs ?? 220, state.stageAttackCooldowns[weapon.id]);
  if (enemy.tutorial) {
    if (!recordTutorialHit(enemy)) return;
  }
  const targets = [enemy, ...state.activeEnemies.filter(other => other !== enemy
    && isEnemyAlive(other) && !other.resolving && !other.tutorial)
    .sort((a, b) => b.progress - a.progress).slice(0, (weapon.attackTargets ?? 1) - 1)];
  const damage = getPlayerAttackDamage(enemy);
  startPlayerAttackCooldown(enemy.weaponId);
  const isPerfectGreatsword = enemy.weaponId === "greatsword" && getGreatswordCharge(enemy) === 1;
  window.GAME_SOUND.play(enemy.weaponId === "greatsword" ? "heavy"
    : ["sword", "dualBlades", "swordShield"].includes(enemy.weaponId) ? "attack" : "impact");
  playPlayerAttackAnimation(enemy, isPerfectGreatsword);
  state.combo += 1;
  state.score += 35 + state.combo * 10;
  targets.forEach(target => resolveWeaponHit(target, damage, recoveryMs));
  updateHud();
}

function resolveWeaponHit(enemy, damage, recoveryMs) {
  if (!enemy.tutorial) enemy.hp = Math.max(0, Math.round((enemy.hp - damage) * 10) / 10);
  enemy.resolving = true;
  enemy.atBase = false;
  enemy.element.classList.add("hit");
  enemy.element.classList.remove("defeating", "typing-shake");
  setEnemyProgress(enemy, enemy.progress - knockbackAmount);
  playEnemyAnimation(enemy, "damage", { duration: recoveryMs, loop: false });
  updateEnemyHud(enemy);

  if (enemy.weaponId === "unarmed") {
    clearInputBuffer();
    scheduleBattleTimeout(() => {
      if (!state.running || state.storyPhase !== "unarmed") return;
      enemy.element.classList.remove("hit");
      playEnemyAnimation(enemy, "idle");
      if (enemy.tutorial.punches >= enemy.tutorial.requiredPunches) {
        showStoryDialogue("weapon-offer");
      } else {
        enemy.resolving = false;
        enemy.lastTick = performance.now();
        setNextWord(enemy);
        setTargetEnemy(enemy);
        updateHud();
      }
    }, Math.min(playerAttackMs, state.stageAttackCooldowns.unarmed));
    return;
  }

  if (!isEnemyAlive(enemy)) {
    scheduleBattleTimeout(() => {
      if (state.running) {
        defeatEnemy(enemy);
      }
    }, recoveryMs);
    return;
  }

  scheduleBattleTimeout(() => {
    if (state.running) {
      enemy.element.classList.remove("hit");
      enemy.resolving = false;
      setNextWord(enemy);
      const selected = getSelectedEnemy();
      if (!selected || selected === enemy || !isEnemyAlive(selected)) setTargetEnemy(enemy);
      enemy.lastTick = performance.now();
      playEnemyAnimation(enemy, "idle");
      updateHud();
      flushBufferedInput();
    }
  }, recoveryMs);
}

function useSpecialMove() {
  if (!state.running || state.guarding || state.specialInProgress || !isSpecialReady() || !state.activeEnemies.length) {
    return false;
  }

  const skill = getActiveSkill();
  if (!skill.effects.length || skill.effects.some(effect => !skillEffectHandlers[effect.type])) return false;
  if (skill.target === "self") return useHealingSkill(skill);
  if (skill.target === "battle") return useEnemyStopSkill(skill);
  const targets = getSkillTargets(skill);
  if (!targets.length || targets.some((enemy) => enemy.resolving)) {
    updateHud();
    return false;
  }
  clearInputBuffer();
  state.specialInProgress = true;
  state.specialGauge = 0;
  state.score += targets.length * 120 + Math.min(state.successStreak, 16) * 20;
  setTargetEnemy(null);
  playSpecialEffect();
  window.GAME_SOUND.play("special");
  skill.effects.forEach(effect => skillEffectHandlers[effect.type](effect, targets));
  targets.forEach((enemy) => {
    enemy.resolving = true;
    enemy.atBase = false;
    enemy.nextAttackAt = 0;
    resetEnemyCharge(enemy);
    enemy.element.classList.remove("hit", "attack", "defeating", "typing-shake");
    enemy.element.classList.add("special");
    setEnemyProgress(enemy, enemy.progress - knockbackAmount * 2.2);
    playEnemyAnimation(enemy, "damage", { loop: false });
    updateEnemyHud(enemy);
  });
  updateHud();

  const remainingEnemies = targets.filter((enemy) => isEnemyAlive(enemy));
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
    }, skill.durationMs);
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
      targets.filter((enemy) => !isEnemyAlive(enemy)).forEach((enemy) => {
        enemy.element.classList.remove("special");
        defeatEnemy(enemy);
      });
    }
  }, skill.durationMs);

  return true;
}

function defeatEnemy(enemy) {
  if (!state.running || !state.activeEnemies.includes(enemy) || isEnemyAlive(enemy) || enemy.experienceCounted) {
    return;
  }

  enemy.resolving = true;
  if (state.selectedEnemyId === enemy.id) {
    setTargetEnemy(state.activeEnemies.find(other => other !== enemy && isEnemyAlive(other)) || null);
  }
  enemy.experienceCounted = true;
  window.GAME_SOUND.play("defeat");
  if (enemy.tutorial) {
    state.equipmentTutorialCompleted = true;
    setStoryPhase("none");
    savePlayerProgress();
  }
  state.pendingExperience += enemy.experience;
  state.cleared += 1;
  state.score += 120 + state.combo * 20;
  enemy.element.classList.remove("hit", "special", "typing-shake");
  enemy.element.classList.add("defeating");
  playEnemyAnimation(enemy, "defeat", { loop: false });
  updateHud();
  flushBufferedInput();

  if (state.cleared >= state.roundLimit) {
    scheduleBattleTimeout(() => finishGame(true), 620);
    return;
  }

  scheduleBattleTimeout(() => {
    if (state.running) {
      removeEnemy(enemy);
      updateHud();
      queueNextEnemy();
      if (state.activeEnemies.length) {
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
  window.GAME_SOUND.play(cleared ? "clear" : "over");
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

  const rewardWeaponId = getStageDefinition(state.stageId).rewardWeaponId;
  const treasure = cleared && (
    (rewardWeaponId === "sword" && !state.ironSwordObtained)
    || (rewardWeaponId === "greatsword" && !state.greatswordObtained)
    || (rewardWeaponId === "dualBlades" && !state.dualBladesObtained)
    || (rewardWeaponId === "swordShield" && !state.swordShieldObtained)
  ) ? rewardWeaponId : "";
  let resultText = "獲得経験値 0 EXP";
  let levelUp = null;
  if (cleared) {
    if (!state.clearedStages.includes(state.stageId)) state.clearedStages.push(state.stageId);
    if (treasure === "sword") {
      state.swordEquipPending = true;
      state.ironSwordObtained = true;
    } else if (treasure === "greatsword") {
      state.greatswordEquipPending = state.weaponId !== "greatsword";
      state.greatswordObtained = true;
    } else if (treasure === "dualBlades") {
      state.dualBladesEquipPending = state.weaponId !== "dualBlades";
      state.dualBladesObtained = true;
    } else if (treasure === "swordShield") {
      state.swordShieldEquipPending = state.weaponId !== "swordShield";
      state.swordShieldObtained = true;
    }
    const previousLevel = state.level;
    const reward = progression.gainExperience(state, state.pendingExperience);
    if (getStageDefinition(state.stageId).skillPointTutorial && reward.levels > 0 && !state.skillTutorialCompleted) {
      state.skillTutorialPending = true;
    }
    state.battleExperience = reward.gained;
    state.battleLevelsGained = reward.levels;
    state.hp = Math.min(getMaxHp(), state.hp + reward.hpGained);
    resultText = `獲得経験値 ${reward.gained} EXP`;
    if (reward.levels > 0) {
      levelUp = {
        from: previousLevel, to: state.level, hp: reward.hpGained,
        points: reward.levels * progression.rules.pointsPerLevel,
      };
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
      getStageDefinition(state.stageId).tutorial ? "チュートリアル完了" : noDamageClear ? t.perfectTitle : t.clearTitle,
      resultText,
      { persistent: true, treasure, levelUp },
    );
    const nextStageId = getStageDefinition(state.stageId).nextStageId;
    if (getPendingWeaponEquipId() && getPendingWeaponEquipId() === rewardWeaponId) {
      els.noticeButton.textContent = "装備画面へ";
    } else if (state.skillTutorialPending && getStageDefinition(state.stageId).skillPointTutorial) {
      els.noticeButton.textContent = "ステータスへ";
    } else if (isStageAvailable(nextStageId)) {
      els.noticeButton.textContent = `ステージ${stageDefinitions[nextStageId].code}へ`;
    }
    if (treasure || levelUp || state.skillTutorialPending) els.noticeButton.focus({ preventScroll: true });
  }
}

function resetGame() {
  state.weaponEquipGuideId = "";
  state.skillGuideActive = false;
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
  if (!assetLoadingState.ready || activeSaveSlot === null) return;
  const resolvedStageId = stageDefinitions[stageId] ? stageId : defaultStageId;
  const stage = getStageDefinition(resolvedStageId);

  if (!isStageAvailable(resolvedStageId)) {
    return;
  }

  if (ensureGameAssets(collectStageImageSources(resolvedStageId), () => startGame(resolvedStageId))) return;

  invalidateBattleGeneration();
  const needsIntroduction = Boolean(stage.storyIntro && (stage.tutorial || !state.equipmentTutorialCompleted));
  state.prologueSceneIndex = 0;
  setStoryPhase(needsIntroduction ? "encounter" : "none");
  state.language = "ja";
  state.stageId = resolvedStageId;
  snapshotAttackCooldowns();
  state.stageMapRegionId = stage.regionId;
  els.arena.dataset.stage = resolvedStageId;
  const backgroundUrl = new URL(stage.background || "src/assets/images/backgrounds/stages/crab_shore.webp", document.baseURI);
  els.arena.style.setProperty("--stage-background", `url("${backgroundUrl.href}")`);
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
  state.battleStartsAt = performance.now() + startNoticeMs;
  showGameNotice("start", "START", t.startTitle, t.startText(stage.name), { duration: startNoticeMs });
  spawnNextEnemy();
  if (flickState.enabled) focusGameSurface({ userGesture: true });
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


function clearTypingMissEffect() {
  window.clearTimeout(state.typingMissTimerId);
  window.clearTimeout(state.typingMissShakeTimerId);
  state.typingMissTimerId = 0;
  state.typingMissShakeTimerId = 0;
  els.typingMissEffect.classList.remove("is-active");
  els.typingStatus.classList.remove("typing-miss-shake");
}

function playTypingMissEffect() {
  if (!state.running || isStoryDialogueOpen()) return;
  clearTypingMissEffect();
  // Restart the feedback for a fresh miss, without moving the input controls.
  void els.typingMissEffect.offsetWidth;
  els.typingMissEffect.classList.add("is-active");
  els.typingStatus.classList.add("typing-miss-shake");
  state.typingMissShakeTimerId = scheduleBattleTimeout(() => {
    state.typingMissShakeTimerId = 0;
    els.typingStatus.classList.remove("typing-miss-shake");
  }, 240);
  state.typingMissTimerId = scheduleBattleTimeout(() => {
    state.typingMissTimerId = 0;
    els.typingMissEffect.classList.remove("is-active");
  }, 550);
}

function recordTypingMiss(enemy) {
  window.GAME_SOUND.play("miss");
  playTypingMissEffect();
  state.combo = 0;
  resetSuccessStreak();
  if (enemy.weaponId === "greatsword") {
    enemy.typingMisses += 1;
  }
  updateHud();
}

function applyTypedValue(enemy, value, { readingProgress } = {}) {
  if (!state.running || state.guarding || isStoryDialogueOpen() || !enemy || enemy.resolving
      || state.specialInProgress || state.hp <= 0 || performance.now() < state.playerAttackReadyAt) {
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
  enemy.chargeInputProgress = readingProgress ?? nextValue.length / Math.max(1, matchedWord.length);
  enemy.typed = nextValue;
  enemy.matchedWord = matchedWord;
  updateEnemyWordLabel(enemy);
  renderWord();

  if (newSuccessfulCharacterCount > 0) {
    enemy.bestLength = nextValue.length;
    addSuccessfulCharacters(newSuccessfulCharacterCount);
    updateSkillHud();
  }

  if (enemy.inputs.includes(enemy.typed)) {
    damageEnemy(enemy);
  } else if (typedMoreCharacters) {
    window.GAME_SOUND.play("typing");
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
  if (!assetLoadingState.ready) return;
  if (event.target === els.flickInput || event.target?.closest?.("input, textarea, [contenteditable='true']")
      || event.isComposing || event.keyCode === 229 || flickState.composing) return;
  if (event.code === "Escape") {
    if (!saveEls.screen.hidden) {
      event.preventDefault();
      if (!saveEls.form.hidden) showSaveMenu("new"); else showStartScreen();
    } else if (!els.stageScreen.hidden && !els.stageConfirm.hidden) {
      event.preventDefault();
      cancelPendingStageSelection();
    } else if (!els.weaponScreen.hidden || !els.statusScreen.hidden) {
      event.preventDefault();
      showHomeScreen();
    } else if (!els.homeScreen.hidden) {
      event.preventDefault();
      showStageSelect();
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
      if (event.target?.closest?.("button")) return;
      event.preventDefault();
      showSaveMenu(saveEls.continueButton.disabled ? "new" : "continue");
      return;
    }

    if (state.running) {
      event.preventDefault();
      if (!event.repeat) {
        if (hasGuardWeapon()) beginPlayerGuard("keyboard");
      }
      return;
    }

    return;
  }

  if (!state.running) {
    return;
  }

  if ((event.key === "Enter" || event.code === "Enter" || event.code === "NumpadEnter")
      && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    if (!event.repeat) useSpecialMove();
    return;
  }

  const letter = getTypingCharacterFromKey(event);
  // A hidden prompt cannot own input. In particular, a held final key must
  // not repeat into the next word after the cooldown finishes.
  if ((letter || event.key === "Backspace") && (performance.now() < state.playerAttackReadyAt
      || (letter && event.repeat))) {
    event.preventDefault();
    return;
  }
  if (state.guarding) {
    if (letter || event.key === "Backspace") event.preventDefault();
    return;
  }

  if (letter) {
    event.preventDefault();
    if (state.inputBuffer.length) {
      flushBufferedInput();
    }

    const targetEnemy = getInputEnemy();

    if (targetEnemy && !state.inputBuffer.length) {
      if (state.selectedEnemyId !== targetEnemy.id) setTargetEnemy(targetEnemy);
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
els.homeButton.addEventListener("click", showHomeScreen);
els.homeWeaponsButton.addEventListener("click", showWeaponScreen);
els.homeStatusButton.addEventListener("click", showStatusScreen);
els.weaponHomeButton.addEventListener("click", showHomeScreen);
els.weaponEquipNext.addEventListener("click", continueAfterWeaponEquip);
els.statusHomeButton.addEventListener("click", showHomeScreen);
els.skillTutorialNext.addEventListener("click", continueAfterSkillTutorial);
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
els.weaponEquipButton.addEventListener("click", equipPreviewedWeapon);
els.weaponPreviewRetry.addEventListener("click", loadWeaponPreviewImage);
els.weaponPanel.addEventListener("change", (event) => {
  const input = event.target.closest("input[name='weapon']");

  if (!input) {
    return;
  }

  previewWeapon(input.value);
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
els.noticeButton.addEventListener("click", continueAfterResult);
els.stageRegionSwitch.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-region]");
  if (button) switchStageMap(button.dataset.region);
});
els.stageChoices.addEventListener("click", (event) => {
  if (event.target.closest("#stageConfirm")) {
    return;
  }

  const button = event.target.closest(".stage-choice[data-stage]");
  if (!button || button.hidden || button.disabled || !isStageAvailable(button.dataset.stage)) {
    return;
  }

  showStageConfirm(button.dataset.stage);
});
document.addEventListener("keydown", handleTypingKeydown);
initializePlayerGuard();

initializeFlickInput();
initializeSaveMenu();
resetGame();
loadGameAssets();
