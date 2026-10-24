// Load only the images required by the next screen or battle.
const assetLoadingState = {
  request: null,
  ready: false,
  loading: false,
  total: 0,
  completed: 0,
  images: new Map(),
  failed: [],
};
const loadingUi = {
  screen: document.querySelector("#loadingScreen"),
  text: document.querySelector("#loadingText"),
  percent: document.querySelector("#loadingPercent"),
  progress: document.querySelector("#loadingProgress"),
  retry: document.querySelector("#loadingRetry"),
  game: document.querySelector(".game-shell"),
};

function imageSources(values) {
  return [...new Set(values.flat(Infinity).filter(Boolean).map(src => new URL(src, document.baseURI).href))];
}

function collectStartupImageSources() {
  return imageSources(["src/assets/images/backgrounds/shared/typing_rpg_background.webp"]);
}

function collectStageImageSources(stageId) {
  const stage = getStageDefinition(stageId);
  const weapons = new Set([getActiveWeapon().id]);
  const introduction = stage.storyIntro && (stage.tutorial || !state.equipmentTutorialCompleted);
  if (introduction) { weapons.add("unarmed"); weapons.add(stage.storyIntro.weaponId); }
  const types = new Set(stage.waves.flatMap(getWaveEnemyTypes));
  return imageSources([
    stage.background || "src/assets/images/backgrounds/stages/crab_shore.webp",
    weaponDefinitions[stage.rewardWeaponId]?.itemImage,
    [...weapons].map(id => Object.values(getPlayerWeaponAssets(id))),
    [...types].map(type => Object.values(enemyAnimations.enemies[type] || {})),
    introduction ? "src/assets/images/items/weapons/branch.webp?v=branch-intro-v1" : null,
    introduction && !state.prologueCompleted ? prologueScenes.map(scene => scene.image) : [],
  ]);
}

// Complete registry for asset checks; this does not start any downloads.
function collectGameImageSources() {
  return imageSources([
    collectStartupImageSources(), "src/assets/images/backgrounds/status/base_interior.webp",
    "src/assets/images/backgrounds/stages/crab_shore.webp", prologueScenes.map(scene => scene.image),
    "src/assets/images/items/weapons/branch.webp?v=branch-intro-v1",
    Object.values(playerWeaponAssets).map(weapon => Object.values(weapon)),
    Object.values(weaponDefinitions).map(weapon => weapon.itemImage),
    Object.values(stageDefinitions).filter(stage => stage.enabled).map(stage => stage.background),
    Object.values(stageMapRegions).map(region => region.image),
    Object.values(stageDefinitions).filter(stage => stage.enabled).flatMap(stage => stage.waves.flatMap(getWaveEnemyTypes))
      .map(type => Object.values(enemyAnimations.enemies[type] || {})),
  ]);
}

function ensureGameAssets(sources, onReady) {
  if (assetLoadingState.loading) return true;
  if (sources.every(src => assetLoadingState.images.has(src))) return false;
  assetLoadingState.request = { sources, onReady, screen: document.documentElement.dataset.screen };
  state.running = false;
  invalidateBattleGeneration();
  cancelAnimationFrame(state.rafId);
  clearInputBuffer();
  loadGameAssets();
  return true;
}

function loadGameImage(src, element = null) {
  if (!element && assetLoadingState.images.has(src)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const image = element || new Image();
    let settled = false;
    const finish = error => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      if (error) {
        reject(error);
      } else {
        if (!element) assetLoadingState.images.set(src, image);
        resolve();
      }
    };
    const timeout = window.setTimeout(() => finish(new Error("Image loading timed out")), 45000);
    image.onerror = () => finish(new Error("Image loading failed"));
    image.onload = async () => {
      try {
        if (!image.naturalWidth || !image.naturalHeight) throw new Error("Empty image");
        if (typeof image.decode === "function") await image.decode();
        finish();
      } catch (error) {
        finish(error);
      }
    };
    if (element && image.complete && image.naturalWidth) {
      image.onload();
    } else {
      image.src = src;
    }
  });
}

function updateLoadingProgress() {
  const percent = assetLoadingState.total ? Math.floor(assetLoadingState.completed / assetLoadingState.total * 100) : 0;
  loadingUi.progress.value = percent;
  loadingUi.percent.textContent = percent + "%";
}

async function loadGameAssets() {
  if (assetLoadingState.loading || (assetLoadingState.ready && !assetLoadingState.request)) return;
  const request = assetLoadingState.request;
  assetLoadingState.loading = true;
  assetLoadingState.failed = [];
  assetLoadingState.completed = 0;
  loadingUi.game.hidden = true;
  loadingUi.game.inert = true;
  loadingUi.screen.hidden = false;
  loadingUi.screen.setAttribute("aria-busy", "true");
  loadingUi.text.textContent = "読み込み中…";
  loadingUi.retry.hidden = true;
  loadingUi.retry.disabled = true;
  document.documentElement.dataset.screen = "loading";
  try {
    const sources = request ? request.sources : collectStartupImageSources();
    assetLoadingState.total = sources.length;
    updateLoadingProgress();
    await Promise.all(sources.map(async src => {
      try {
        await loadGameImage(src);
        assetLoadingState.completed++;
        updateLoadingProgress();
      } catch {
        assetLoadingState.failed.push(src);
      }
    }));
    if (assetLoadingState.failed.length) throw new Error("Images are not ready");
    assetLoadingState.ready = true;
    loadingUi.progress.value = 100;
    loadingUi.percent.textContent = "100%";
    loadingUi.screen.hidden = true;
    loadingUi.game.hidden = false;
    loadingUi.game.inert = false;
    assetLoadingState.request = null;
    assetLoadingState.loading = false;
    if (request) {
      document.documentElement.dataset.screen = request.screen;
      request.onReady();
    } else showStartScreen();
  } catch {
    if (!request) assetLoadingState.ready = false;
    loadingUi.game.hidden = true;
    loadingUi.game.inert = true;
    loadingUi.screen.hidden = false;
    loadingUi.text.textContent = "読み込みに失敗しました";
    loadingUi.retry.hidden = false;
    loadingUi.retry.disabled = false;
  } finally {
    assetLoadingState.loading = false;
    loadingUi.screen.setAttribute("aria-busy", "false");
  }
}

loadingUi.retry.addEventListener("click", loadGameAssets);
