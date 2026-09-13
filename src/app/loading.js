// Keep the game closed until every image it can show is loaded and decoded.
const assetLoadingState = {
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

function collectGameImageSources() {
  const sources = new Set();
  const add = (src, base = document.baseURI) => {
    if (src && !/^(data|blob):/.test(src)) sources.add(new URL(src, base).href);
  };
  Object.values(playerWeaponAssets).forEach(weapon => Object.values(weapon).flat().forEach(src => add(src)));
  const types = new Set(Object.values(stageDefinitions).filter(stage => stage.enabled)
    .flatMap(stage => stage.waves.flatMap(getWaveEnemyTypes)));
  types.forEach(type => Object.values(enemyAnimations.enemies[type]).flat().forEach(src => add(src)));
  document.querySelectorAll("img[src]").forEach(img => add(img.getAttribute("src")));
  document.querySelectorAll("img[srcset], source[srcset]").forEach(source => {
    source.getAttribute("srcset").split(",").forEach(candidate => add(candidate.trim().split(/\s+/)[0]));
  });
  document.querySelectorAll('link[rel="preload"][as="image"]').forEach(link => add(link.getAttribute("href")));
  return [...sources];
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
  if (assetLoadingState.loading || assetLoadingState.ready) return;
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
    const sources = collectGameImageSources();
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
    // A previously failed DOM image does not recover when a separate Image loads.
    const pageImages = await Promise.allSettled([...document.querySelectorAll("img[src]")].map(image => loadGameImage(image.src, image)));
    if (pageImages.some(result => result.status === "rejected")) throw new Error("Page images are not ready");
    assetLoadingState.ready = true;
    loadingUi.progress.value = 100;
    loadingUi.percent.textContent = "100%";
    loadingUi.screen.hidden = true;
    loadingUi.game.hidden = false;
    loadingUi.game.inert = false;
    showStartScreen();
  } catch {
    assetLoadingState.ready = false;
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
