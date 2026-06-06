const wordSets = {
  en: [
    { text: "hi", translation: "こんにちは" },
    { text: "cat", translation: "ねこ" },
    { text: "sun", translation: "たいよう" },
    { text: "map", translation: "ちず" },
    { text: "tea", translation: "おちゃ" },
    { text: "star", translation: "ほし" },
    { text: "leaf", translation: "はっぱ" },
    { text: "milk", translation: "ミルク" },
    { text: "cake", translation: "ケーキ" },
    { text: "book", translation: "ほん" },
    { text: "rain", translation: "あめ" },
    { text: "home", translation: "いえ" },
    { text: "forest", translation: "森" },
    { text: "castle", translation: "城" },
    { text: "crystal", translation: "水晶" },
    { text: "guardian", translation: "守護者" },
    { text: "keyboard", translation: "キーボード" },
    { text: "treasure", translation: "宝物" },
    { text: "mountain", translation: "山" },
    { text: "sunlight", translation: "日光" },
    { text: "waterfall", translation: "滝" },
    { text: "spellbook", translation: "魔法書" },
    { text: "sanctuary", translation: "聖域" },
    { text: "adventure", translation: "冒険" },
  ],
  ja: [
    { text: "neko", translation: "ねこ" },
    { text: "sora", translation: "そら" },
    { text: "tsuki", translation: "月" },
    { text: "tsuchi", translation: "土" },
    { text: "mori", translation: "森" },
    { text: "hana", translation: "花" },
    { text: "kaze", translation: "風" },
    { text: "kutsu", translation: "くつ" },
    { text: "hoshi", translation: "星" },
    { text: "yama", translation: "山" },
    { text: "umi", translation: "海" },
    { text: "ame", translation: "雨" },
    { text: "yuki", translation: "雪" },
    { text: "honoo", translation: "炎" },
    { text: "hikari", translation: "光" },
    { text: "fune", translation: "船" },
    { text: "chikara", translation: "力" },
    { text: "shizuku", translation: "しずく" },
    { text: "kokoro", translation: "心" },
    { text: "yuusha", translation: "勇者" },
    { text: "mahou", translation: "魔法" },
    { text: "kenja", translation: "賢者" },
    { text: "kibou", translation: "希望" },
    { text: "kiseki", translation: "奇跡" },
    { text: "bouken", translation: "冒険" },
    { text: "mamoru", translation: "守る" },
    { text: "takara", translation: "宝" },
    { text: "shiro", translation: "城" },
    { text: "seirei", translation: "精霊" },
    { text: "densetsu", translation: "伝説" },
    { text: "asa", translation: "朝" },
    { text: "yoru", translation: "夜" },
    { text: "niji", translation: "虹" },
    { text: "kumo", translation: "雲" },
    { text: "tori", translation: "鳥" },
    { text: "inu", translation: "犬" },
    { text: "mizu", translation: "水" },
    { text: "ishi", translation: "石" },
    { text: "kagi", translation: "鍵" },
    { text: "michi", translation: "道" },
    { text: "kiri", translation: "霧" },
    { text: "oto", translation: "音" },
    { text: "uta", translation: "歌" },
    { text: "okane", translation: "お金" },
    { text: "tokei", translation: "時計" },
    { text: "tegami", translation: "手紙" },
    { text: "honya", translation: "本屋" },
    { text: "yakusou", translation: "薬草" },
    { text: "himitsu", translation: "秘密" },
    { text: "nakama", translation: "仲間" },
    { text: "inori", translation: "祈り" },
    { text: "tsubasa", translation: "翼" },
    { text: "chizu", translation: "地図" },
    { text: "shinden", translation: "神殿" },
    { text: "megami", translation: "女神" },
    { text: "yuugure", translation: "夕暮れ" },
    { text: "hayashi", translation: "林" },
    { text: "mahoroba", translation: "まほろば" },
    { text: "monogatari", translation: "物語" },
    { text: "hoshikuzu", translation: "星くず" },
    { text: "kagayaki", translation: "輝き" },
    { text: "yakusoku", translation: "約束" },
    { text: "tabidachi", translation: "旅立ち" },
    { text: "shukufuku", translation: "祝福" },
    { text: "mahoujin", translation: "魔法陣" },
    { text: "michishirube", translation: "道しるべ" },
  ],
};

const languageLabels = {
  en: {
    languageName: "English",
    score: "Score",
    combo: "Combo",
    streak: "Streak",
    special: "Special",
    input: "Input",
    idle: "Waiting",
    inputHint: "Type letters",
    readyTitle: "Ready",
    readyText: "Press Start and type the enemy word.",
    chooseKicker: "DIFFICULTY",
    chooseTitle: "Choose Difficulty",
    chooseText: "Beginner is available. Intermediate and Advanced are locked for now.",
    start: "Start",
    restart: "Restart",
    again: "Again",
    interruptedTitle: "Paused",
    interruptedText: "Press Space to play again.",
    startTitle: "Start",
    startText: "Protect the forest.",
    startedTitle: "Start",
    startedText: (roundLimit) => `${roundLimit} cute enemies are coming.`,
    attackedTitle: "Attacked",
    attackedText: "The enemy is at your base. Defeat it to stop the attacks.",
    hitTitle: "Hit",
    hitText: (hp) => `${hp} more hit${hp === 1 ? "" : "s"} to defeat it.`,
    defeatedTitle: "Defeated",
    defeatedText: (remaining) => `${remaining} enemy${remaining === 1 ? "" : "ies"} left.`,
    gameOverTitle: "Game Over",
    gameOverText: (score) => `Score: ${score}. Protect the forest next time.`,
    perfectTitle: "Perfect",
    perfectText: (score) => `No damage clear. Score: ${score}.`,
    clearTitle: "Clear",
    clearText: (score) => `Score: ${score}.`,
    missTitle: "Typing Miss",
    missText: "Keep typing the correct letters in order.",
    specialTitle: "Special",
    specialText: (hp) => `${hp} hit${hp === 1 ? "" : "s"} left.`,
    specialAllText: (count) => `Hit ${count} enemies.`,
  },
  ja: {
    languageName: "日本語",
    score: "スコア",
    combo: "コンボ",
    streak: "連続成功",
    special: "必殺技",
    input: "入力",
    idle: "待機中",
    inputHint: "ローマ字で入力",
    readyTitle: "準備OK",
    readyText: "スタートを押して、敵の言葉をタイプしてください。",
    chooseKicker: "難易度",
    chooseTitle: "難易度を選択",
    chooseText: "初級のみプレイできます。中級と上級は準備中です。",
    start: "スタート",
    restart: "リスタート",
    again: "もう一度",
    interruptedTitle: "中断",
    interruptedText: "スペースキーでもう一度プレイできます。",
    startTitle: "開始",
    startText: "森を守りましょう。",
    startedTitle: "開始",
    startedText: (roundLimit) => `${roundLimit}体の可愛い敵がやってきます。`,
    attackedTitle: "攻撃された",
    attackedText: "敵が拠点前にとどまっています。倒すまで攻撃が続きます。",
    hitTitle: "ヒット",
    hitText: (hp) => `あと${hp}回で倒せます。`,
    defeatedTitle: "やっつけた",
    defeatedText: (remaining) => `あと${remaining}体です。`,
    gameOverTitle: "ゲームオーバー",
    gameOverText: (score) => `スコアは${score}点。次は森を守りきりましょう。`,
    perfectTitle: "パーフェクト",
    perfectText: (score) => `ノーダメージでクリア。スコアは${score}点です。`,
    clearTitle: "クリア",
    clearText: (score) => `スコアは${score}点です。`,
    missTitle: "タイプミス",
    missText: "正しい文字から続けて入力してください。",
    specialTitle: "必殺技",
    specialText: (hp) => `必殺技が命中。あと${hp}回で倒せます。`,
    specialAllText: (count) => `${count}体に命中。`,
  },
};

const maxHp = 5;
const defaultSpecialGaugeSettings = {
  chargeStartStreak: 5,
  baseGain: 0.25,
  gainPerStreak: 0.03,
  streakCap: 16,
};
const defaultDifficulty = "beginner";
const difficultyModes = {
  beginner: {
    label: "初級",
    enabled: true,
    specialGauge: {
      chargeStartStreak: 2,
      baseGain: 2.2,
      gainPerStreak: 0.18,
      streakCap: 16,
    },
    waves: [
      { types: ["goblin_level_1"], hp: 2, count: 3 },
      { types: ["goblin_level_1"], hp: 3, count: 3 },
      { types: ["goblin_level_2"], hp: 4, count: 1, boss: true },
    ],
  },
  intermediate: {
    label: "中級",
    enabled: false,
    waves: [],
  },
  advanced: {
    label: "上級",
    enabled: false,
    waves: [],
  },
};
const attackMs = 8200;
const repeatAttackMs = 2200;
const knockbackAmount = 0.14;
const startNoticeMs = 850;
const specialGaugeMax = 100;
const specialDamage = 3;
const enemyAnimations = window.ENEMY_ANIMATIONS || {
  defaultEnemy: "goblin_level_1",
  frameMs: 140,
  enemies: {
    goblin_level_1: {
      idle: ["src/assets/images/enemies/goblin/level_1/idle/frame_01.png"],
      attack: ["src/assets/images/enemies/goblin/level_1/attack/frame_01.png"],
      damage: ["src/assets/images/enemies/goblin/level_1/damage/frame_01.png"],
      defeat: ["src/assets/images/enemies/goblin/level_1/defeat/frame_01.png"],
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

function getDifficultyMode(difficulty) {
  return difficultyModes[difficulty] || difficultyModes[defaultDifficulty];
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

const initialPlayableEnemyWaves = buildPlayableEnemyWaves(getDifficultyMode(defaultDifficulty).waves);
updateEnemyTypeDataset(initialPlayableEnemyWaves);

const state = {
  language: "ja",
  difficulty: defaultDifficulty,
  running: false,
  hp: maxHp,
  score: 0,
  combo: 0,
  successStreak: 0,
  specialGauge: 0,
  cleared: 0,
  currentWaveIndex: 0,
  currentWaveSpawned: 0,
  playableEnemyWaves: initialPlayableEnemyWaves,
  roundLimit: getRoundLimit(initialPlayableEnemyWaves),
  activeEnemies: [],
  selectedEnemyId: "",
  nextEnemyId: 1,
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
  noticeTimerId: 0,
  startDelayTimerId: 0,
  usedWords: [],
};

const els = {
  scoreLabel: document.querySelector("#scoreLabel"),
  scoreText: document.querySelector("#scoreText"),
  comboLabel: document.querySelector("#comboLabel"),
  comboText: document.querySelector("#comboText"),
  streakLabel: document.querySelector("#streakLabel"),
  streakText: document.querySelector("#streakText"),
  streakFill: document.querySelector("#streakFill"),
  specialLabel: document.querySelector("#specialLabel"),
  specialGaugeText: document.querySelector("#specialGaugeText"),
  specialGaugeFill: document.querySelector("#specialGaugeFill"),
  specialButton: document.querySelector("#specialButton"),
  specialEffect: document.querySelector("#specialEffect"),
  wordTranslation: document.querySelector("#wordTranslation"),
  typedWord: document.querySelector("#typedWord"),
  remainingWord: document.querySelector("#remainingWord"),
  typingLabel: document.querySelector("#typingLabel"),
  typingStatusText: document.querySelector("#typingStatusText"),
  startButton: document.querySelector("#startButton"),
  resetButton: document.querySelector("#resetButton"),
  gameNotice: document.querySelector("#gameNotice"),
  noticeKicker: document.querySelector("#noticeKicker"),
  noticeTitle: document.querySelector("#noticeTitle"),
  noticeText: document.querySelector("#noticeText"),
  noticeButton: document.querySelector("#noticeButton"),
  difficultyChoices: document.querySelector("#difficultyChoices"),
  messageTitle: document.querySelector("#messageTitle"),
  messageText: document.querySelector("#messageText"),
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
  els.streakLabel.textContent = t.streak;
  els.specialLabel.textContent = t.special;
  els.typingLabel.textContent = t.input;
  els.startButton.textContent = state.running ? t.restart : t.start;
  els.specialButton.textContent = t.special;
  els.noticeButton.textContent = t.again;
}

function getSpecialGaugeSettings() {
  return {
    ...defaultSpecialGaugeSettings,
    ...(getDifficultyMode(state.difficulty).specialGauge || {}),
  };
}

function getSpecialGain() {
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
  return state.specialGauge >= specialGaugeMax;
}

function updateHud() {
  const { streakCap } = getSpecialGaugeSettings();
  const streakProgress = (Math.min(state.successStreak, streakCap) / streakCap) * 100;
  const specialGauge = Math.max(0, Math.min(state.specialGauge, specialGaugeMax));
  els.scoreText.textContent = state.score;
  els.comboText.textContent = state.combo;
  els.streakText.textContent = state.successStreak;
  els.streakFill.style.width = `${streakProgress}%`;
  els.specialGaugeText.textContent = `${Math.round(specialGauge)}%`;
  els.specialGaugeFill.style.width = `${specialGauge}%`;
  els.streakFill.parentElement.setAttribute("aria-valuemax", String(streakCap));
  els.streakFill.parentElement.setAttribute("aria-valuenow", String(Math.min(state.successStreak, streakCap)));
  els.specialGaugeFill.parentElement.setAttribute("aria-valuenow", String(Math.round(specialGauge)));
  els.specialButton.disabled = !state.running || !isSpecialReady() || !state.activeEnemies.some((enemy) => enemy.hp > 0);
}

function setMessage(title, text) {
  els.messageTitle.textContent = title;
  els.messageText.textContent = text;
}

function focusGameSurface() {
  document.body.tabIndex = -1;
  document.body.focus({ preventScroll: true });
}

function updateTypingStatus() {
  const t = labels();
  const selectedEnemy = getCurrentEnemy();
  els.typingStatusText.textContent = state.running ? selectedEnemy?.typed || t.inputHint : t.idle;
}

function hideGameNotice() {
  els.gameNotice.classList.remove("is-visible", "is-actionable");
  els.gameNotice.setAttribute("aria-hidden", "true");
  els.difficultyChoices.hidden = true;
}

function clearNoticeTimer() {
  window.clearTimeout(state.noticeTimerId);
  state.noticeTimerId = 0;
}

function clearStartDelayTimer() {
  window.clearTimeout(state.startDelayTimerId);
  state.startDelayTimerId = 0;
}

function showGameNotice(kind, kicker, title, text, options = {}) {
  const { persistent = false, duration = 900, choices = false } = options;

  clearNoticeTimer();
  els.gameNotice.dataset.kind = kind;
  els.noticeKicker.textContent = kicker;
  els.noticeTitle.textContent = title;
  els.noticeText.textContent = text;
  els.difficultyChoices.hidden = !choices;
  els.gameNotice.classList.toggle("is-actionable", persistent || choices);
  els.gameNotice.classList.add("is-visible");
  els.gameNotice.setAttribute("aria-hidden", "false");

  if (!persistent && !choices) {
    state.noticeTimerId = window.setTimeout(() => {
      state.noticeTimerId = 0;
      if (state.running) {
        hideGameNotice();
        focusGameSurface();
      }
    }, duration);
  }
}

function syncDifficultyButtons() {
  els.difficultyChoices.querySelectorAll("[data-difficulty]").forEach((button) => {
    const mode = getDifficultyMode(button.dataset.difficulty);
    button.disabled = !mode.enabled;
    button.setAttribute("aria-disabled", String(!mode.enabled));
    button.classList.toggle("is-selected", mode.enabled && button.dataset.difficulty === state.difficulty);
  });
}

function showDifficultySelect() {
  const t = labels();
  state.running = false;
  cancelAnimationFrame(state.rafId);
  clearStartDelayTimer();
  clearNoticeTimer();
  clearSpecialEffect();
  clearEnemies();
  updateLanguageText();
  updateHud();
  updateTypingStatus();
  syncDifficultyButtons();
  showGameNotice("difficulty", t.chooseKicker, t.chooseTitle, t.chooseText, { choices: true });
}

function interruptGame() {
  if (!state.running) {
    return;
  }

  resetGame();
  const t = labels();
  setMessage(t.interruptedTitle, t.interruptedText);
  showDifficultySelect();
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

  if (frames.length > 1) {
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
    enemy.returnTimerId = window.setTimeout(() => {
      playEnemyAnimation(enemy, next);
    }, duration);
  }
}

function playTypingShakeEffect(enemy) {
  window.clearTimeout(enemy.typingShakeTimerId);
  enemy.element.classList.remove("typing-shake");
  void enemy.element.offsetWidth;
  enemy.element.classList.add("typing-shake");
  enemy.typingShakeTimerId = window.setTimeout(() => {
    enemy.typingShakeTimerId = 0;
    enemy.element.classList.remove("typing-shake");
  }, 130);
}

function playSpecialEffect() {
  window.clearTimeout(state.specialEffectTimerId);
  els.specialEffect.classList.remove("is-active");
  void els.specialEffect.offsetWidth;
  els.specialEffect.classList.add("is-active");
  state.specialEffectTimerId = window.setTimeout(() => {
    state.specialEffectTimerId = 0;
    els.specialEffect.classList.remove("is-active");
  }, 680);
}

function clearSpecialEffect() {
  window.clearTimeout(state.specialEffectTimerId);
  state.specialEffectTimerId = 0;
  els.specialEffect.classList.remove("is-active");
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

function renderWord() {
  const selectedEnemy = getCurrentEnemy();

  if (!selectedEnemy) {
    els.wordTranslation.textContent = state.running ? "" : state.currentTranslation;
    els.typedWord.textContent = "";
    els.remainingWord.textContent = state.running ? "" : state.currentMatchedWord;
    updateTypingStatus();
    return;
  }

  els.wordTranslation.textContent = selectedEnemy.translation;
  els.typedWord.textContent = selectedEnemy.typed;
  els.remainingWord.textContent = selectedEnemy.matchedWord.slice(selectedEnemy.typed.length);
  updateTypingStatus();
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

function createJapaneseInputVariants(input) {
  const preferredInput = toShortestJapaneseInput(input);
  const variants = [preferredInput];
  const replacements = [
    ["zi", "ji"],
    ["zya", "ja"],
    ["zyu", "ju"],
    ["zyo", "jo"],
  ];

  replacements.forEach(([pattern, alternative]) => {
    variants.push(...variants.map((variant) => variant.replaceAll(pattern, alternative)));
  });

  const doubledNVariants = variants.map((variant) => variant.replace(/n(?=$|[bcdfghjklmpqrstvwxyz])/g, "nn"));

  return [...new Set([...variants, ...doubledNVariants].filter((variant) => !variant.endsWith("n") || variant.endsWith("nn")))];
}

function getWordInputs(word) {
  if (word.inputs?.length) {
    return [...new Set(word.inputs.flatMap(createJapaneseInputVariants))];
  }

  return createJapaneseInputVariants(word.text);
}

function chooseWord(options = {}) {
  const { preferLong = false } = options;
  const wordList = words();
  const eligibleWords = preferLong ? wordList.filter((word) => word.text.length >= 7) : wordList;
  const poolBase = eligibleWords.length ? eligibleWords : wordList;
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
  const selectedEnemy = getSelectedEnemy();

  if (selectedEnemy && selectedEnemy.hp > 0 && !selectedEnemy.resolving) {
    return selectedEnemy;
  }

  return state.activeEnemies.find((enemy) => enemy.hp > 0 && !enemy.resolving) || null;
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
  const next = chooseWord({ preferLong: enemy.boss });
  enemy.word = next.text;
  enemy.inputs = getWordInputs(next);
  enemy.matchedWord = enemy.inputs[0] || next.text;
  enemy.translation = next.translation;
  enemy.bestLength = 0;
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
    boss: Boolean(wave.boss),
    word: "",
    inputs: [],
    matchedWord: "",
    translation: "",
    typed: "",
    bestLength: 0,
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
  updateHud();
}

function spawnNextEnemy() {
  const wave = chooseEnemyWave();

  if (!state.running || !wave) {
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

  window.setTimeout(() => {
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
  if (!state.running) {
    return;
  }

  state.activeEnemies.forEach((enemy) => {
    if (enemy.resolving) {
      enemy.lastTick = now;
      return;
    }

    if (enemy.atBase) {
      setEnemyProgress(enemy, 1);

      if (now >= enemy.nextAttackAt) {
        enemyAttack(enemy);
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
  const t = labels();
  enemy.resolving = true;
  enemy.atBase = true;
  state.hp -= 1;
  state.combo = 0;
  resetSuccessStreak();
  state.perfect = false;
  enemy.element.classList.add("attack");
  playEnemyAnimation(enemy, "attack", { duration: 360, loop: false });
  updateHud();

  if (state.hp <= 0) {
    window.setTimeout(() => finishGame(false), 320);
    return;
  }

  setMessage(t.attackedTitle, t.attackedText);
  window.setTimeout(() => {
    if (state.running) {
      enemy.resolving = false;
      enemy.nextAttackAt = performance.now() + repeatAttackMs;
      enemy.element.classList.remove("attack");
    }
  }, 360);
}

function damageEnemy(enemy) {
  const t = labels();
  enemy.resolving = true;
  enemy.atBase = false;
  enemy.hp -= 1;
  state.combo += 1;
  state.score += 35 + state.combo * 10;
  enemy.element.classList.add("hit");
  enemy.element.classList.remove("defeating", "typing-shake");
  setEnemyProgress(enemy, enemy.progress - knockbackAmount);
  playEnemyAnimation(enemy, "damage", { duration: 220, loop: false });
  updateEnemyHud(enemy);
  updateHud();

  if (enemy.hp <= 0) {
    window.setTimeout(() => {
      if (state.running) {
        defeatEnemy(enemy);
      }
    }, 220);
    return;
  }

  setMessage(t.hitTitle, t.hitText(enemy.hp));
  window.setTimeout(() => {
    if (state.running) {
      enemy.element.classList.remove("hit");
      enemy.resolving = false;
      setNextWord(enemy);
      setTargetEnemy(enemy);
      enemy.lastTick = performance.now();
      playEnemyAnimation(enemy, "idle");
    }
  }, 220);
}

function useSpecialMove() {
  if (!state.running || !isSpecialReady() || !state.activeEnemies.length) {
    return false;
  }

  const t = labels();
  const targets = state.activeEnemies.filter((enemy) => enemy.hp > 0);
  if (!targets.length) {
    updateHud();
    return false;
  }
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
    window.setTimeout(() => {
      if (state.running) {
        targets.forEach((enemy) => {
          enemy.element.classList.remove("special");
          defeatEnemy(enemy);
        });
      }
    }, 420);
    return true;
  }

  setMessage(t.specialTitle, t.specialAllText(targets.length));
  window.setTimeout(() => {
    if (state.running) {
      remainingEnemies.forEach((enemy) => {
        enemy.element.classList.remove("special");
        enemy.resolving = false;
        setNextWord(enemy);
        enemy.lastTick = performance.now();
        playEnemyAnimation(enemy, "idle");
      });
      setTargetEnemy(remainingEnemies[0]);
      targets.filter((enemy) => enemy.hp <= 0).forEach((enemy) => {
        enemy.element.classList.remove("special");
        defeatEnemy(enemy);
      });
    }
  }, 420);

  return true;
}

function defeatEnemy(enemy) {
  const t = labels();
  if (!state.activeEnemies.includes(enemy)) {
    return;
  }

  enemy.resolving = true;
  if (state.selectedEnemyId === enemy.id) {
    setTargetEnemy(null);
  }
  state.cleared += 1;
  state.score += 120 + state.combo * 20;
  enemy.element.classList.remove("hit", "special", "typing-shake");
  enemy.element.classList.add("defeating");
  playEnemyAnimation(enemy, "defeat", { duration: 520, loop: false });
  updateHud();

  if (state.cleared >= state.roundLimit) {
    window.setTimeout(() => finishGame(true), 620);
    return;
  }

  setMessage(t.defeatedTitle, t.defeatedText(state.roundLimit - state.cleared));
  window.setTimeout(() => {
    if (state.running) {
      removeEnemy(enemy);
      if (!state.activeEnemies.length) {
        queueNextEnemy();
      } else {
        renderWord();
      }
    }
  }, 620);
}

function finishGame(cleared) {
  const t = labels();
  state.running = false;
  cancelAnimationFrame(state.rafId);
  clearStartDelayTimer();
  clearEnemyAnimationTimers();
  clearSpecialEffect();
  els.startButton.textContent = t.start;
  updateHud();

  if (!cleared) {
    setMessage(t.gameOverTitle, t.gameOverText(state.score));
    showGameNotice("over", "GAME OVER", t.gameOverTitle, `${t.score} ${state.score}`, { persistent: true });
    return;
  }

  const noDamageClear = state.perfect && state.hp === maxHp;

  if (noDamageClear) {
    setMessage(t.perfectTitle, t.perfectText(state.score));
    showGameNotice("clear", "PERFECT", t.perfectTitle, t.perfectText(state.score), { persistent: true });
  } else {
    setMessage(t.clearTitle, t.clearText(state.score));
    showGameNotice("clear", "CLEAR", t.clearTitle, `${t.score} ${state.score}`, { persistent: true });
  }
}

function resetGame() {
  const t = labels();
  state.running = false;
  state.language = "ja";
  state.hp = maxHp;
  state.score = 0;
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
  clearNoticeTimer();
  clearSpecialEffect();
  clearEnemies();
  hideGameNotice();
  updateLanguageText();
  updateHud();
  renderWord();
  setMessage(t.readyTitle, t.readyText);
}

function startGame(difficulty = state.difficulty) {
  const mode = getDifficultyMode(difficulty);

  if (!mode.enabled) {
    return;
  }

  state.language = "ja";
  state.difficulty = difficulty;
  state.playableEnemyWaves = buildPlayableEnemyWaves(mode.waves);
  state.roundLimit = getRoundLimit(state.playableEnemyWaves);
  updateEnemyTypeDataset(state.playableEnemyWaves);

  const t = labels();
  cancelAnimationFrame(state.rafId);
  clearStartDelayTimer();
  clearNoticeTimer();
  clearSpecialEffect();
  state.running = true;
  state.hp = maxHp;
  state.score = 0;
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
  setMessage(t.startedTitle, t.startedText(state.roundLimit));
  showGameNotice("start", "START", t.startTitle, t.startText, { duration: startNoticeMs });
  spawnNextEnemy();
  state.startDelayTimerId = window.setTimeout(() => {
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
    .replace(/[^a-z]/g, "");
}

function applyTypedValue(enemy, value) {
  if (!state.running || !enemy || enemy.resolving) {
    return;
  }

  const t = labels();
  const nextValue = normalizeTypedValue(value);
  const matchedWord = enemy.inputs.find((input) => input.startsWith(nextValue));

  if (!matchedWord) {
    state.combo = 0;
    resetSuccessStreak();
    updateHud();
    setMessage(t.missTitle, t.missText);
    return;
  }

  const typedMoreCharacters = nextValue.length > enemy.typed.length;
  const newSuccessfulCharacterCount = Math.max(0, nextValue.length - enemy.bestLength);
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

function getAsciiLetterFromKey(event) {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return "";
  }

  if (/^Key[A-Z]$/.test(event.code)) {
    return event.code.slice(3).toLowerCase();
  }

  if (event.key.length === 1) {
    const normalizedKey = normalizeTypedValue(event.key);
    return /^[a-z]$/.test(normalizedKey) ? normalizedKey : "";
  }

  return "";
}

function isSpaceStartKey(event) {
  return !event.altKey && !event.ctrlKey && !event.metaKey && (event.code === "Space" || event.key === " ");
}

function getFocusedDifficulty() {
  const focusedButton = document.activeElement?.closest?.("[data-difficulty]");
  const focusedMode = focusedButton ? getDifficultyMode(focusedButton.dataset.difficulty) : null;

  if (focusedMode?.enabled) {
    return focusedButton.dataset.difficulty;
  }

  return state.difficulty;
}

function handleTypingKeydown(event) {
  if (event.code === "Escape") {
    if (state.running) {
      event.preventDefault();
      interruptGame();
    }
    return;
  }

  if (isSpaceStartKey(event)) {
    event.preventDefault();
    if (state.running) {
      useSpecialMove();
    } else {
      startGame(getFocusedDifficulty());
    }
    return;
  }

  if (!state.running) {
    return;
  }

  const letter = getAsciiLetterFromKey(event);

  if (letter) {
    event.preventDefault();
    const targetEnemy = getInputEnemy();

    if (targetEnemy) {
      setTargetEnemy(targetEnemy);
      applyTypedValue(targetEnemy, targetEnemy.typed + letter);
    } else {
      state.combo = 0;
      resetSuccessStreak();
      updateHud();
      setMessage(labels().missTitle, labels().missText);
    }
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    const targetEnemy = getInputEnemy();
    if (targetEnemy) {
      applyTypedValue(targetEnemy, targetEnemy.typed.slice(0, -1));
    }
  }
}

els.specialButton.addEventListener("click", useSpecialMove);
els.startButton.addEventListener("click", showDifficultySelect);
els.resetButton.addEventListener("click", () => {
  resetGame();
  showDifficultySelect();
});
els.noticeButton.addEventListener("click", showDifficultySelect);
els.difficultyChoices.addEventListener("click", (event) => {
  const button = event.target.closest("[data-difficulty]");

  if (!button || button.disabled) {
    return;
  }

  startGame(button.dataset.difficulty);
});
document.addEventListener("keydown", handleTypingKeydown);

preloadEnemyFrames();
resetGame();
showDifficultySelect();
