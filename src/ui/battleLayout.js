// Layout only: viewport changes never alter battle state or request keyboard focus.
const battleViewportState = { baselines: new Map(), frameId: 0 };

function calculateBattleLayout(width, height, backBottom, slots = 1) {
  const padding = 8;
  const hpSpace = 18;
  const playerTop = Math.max(8, backBottom + 6);
  const slotGap = Math.min(48, Math.max(0, (height - 150) / Math.max(1, slots)));
  const enemyTop = 8 + slotGap * Math.max(0, slots - 1);
  const horizontalScale = Math.min(1, Math.max(0, (width - padding * 2 - 20) / (129 + 120)));
  // Use the normal floor first, then move down, and only then reduce image size.
  const playerBottom = Math.max(8, Math.min(32, height - playerTop - hpSpace - 177 * horizontalScale));
  const enemyBottom = Math.max(8, Math.min(26, height - enemyTop - hpSpace - 106 * horizontalScale));
  const playerScale = Math.max(0, Math.min(horizontalScale, (height - playerTop - hpSpace - playerBottom) / 177));
  const enemyScale = Math.max(0, Math.min(horizontalScale, (height - enemyTop - hpSpace - enemyBottom) / 106));
  const playerWidth = 129 * playerScale;
  const enemyWidth = 120 * enemyScale;
  const enemyFar = Math.max(padding, width - padding - enemyWidth);
  const enemyNear = Math.min(enemyFar, padding + playerWidth + 20);
  return {
    playerWidth, playerHeight: 177 * playerScale, playerBottom,
    enemyWidth, enemyHeight: 106 * enemyScale, enemySpriteWidth: 96 * enemyScale,
    enemyBottom, enemyFar, enemyTravel: enemyFar - enemyNear, slotGap,
  };
}

function fitBattleCharacters() {
  battleViewportState.frameId = 0;
  if (!flickState.enabled || els.battleScreen.hidden) return;
  const arena = els.arena;
  if (!arena.clientWidth || !arena.clientHeight) return;
  const bounds = arena.getBoundingClientRect();
  const backBottom = els.resetButton.getBoundingClientRect().bottom - bounds.top;
  const slots = Math.max(1, ...state.activeEnemies.map(enemy => (enemy.slot || 0) + 1));
  const layout = calculateBattleLayout(arena.clientWidth, arena.clientHeight, backBottom, slots);
  for (const [name, value] of Object.entries(layout)) {
    const cssName = name.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase());
    arena.style.setProperty("--fit-" + cssName, value.toFixed(2) + "px");
  }
}

function scheduleBattleLayout() {
  if (battleViewportState.frameId) return;
  battleViewportState.frameId = requestAnimationFrame(fitBattleCharacters);
}

function updateBattleViewport() {
  const viewport = window.visualViewport;
  // Let pinch zoom keep its native pan/zoom behavior.
  if (viewport && viewport.scale !== 1) return;
  const width = viewport?.width || window.innerWidth || 390;
  const height = viewport?.height || window.innerHeight || 800;
  const root = document.documentElement;
  root.style.setProperty("--battle-viewport-width", width + "px");
  root.style.setProperty("--battle-viewport-height", height + "px");
  root.style.setProperty("--battle-viewport-top", (viewport?.offsetTop || 0) + "px");
  root.style.setProperty("--battle-viewport-left", (viewport?.offsetLeft || 0) + "px");
  // Keep a separate baseline for each orientation/width. This also supports
  // browsers that resize both the layout and visual viewport for the keyboard.
  const widthKey = Math.round(width / 10) * 10;
  const baseline = Math.max(height, window.innerHeight || 0, battleViewportState.baselines.get(widthKey) || 0);
  battleViewportState.baselines.set(widthKey, baseline);
  const keyboardOpen = baseline - height > Math.max(100, baseline * 0.2);
  root.dataset.keyboardOpen = String(keyboardOpen);
  root.dataset.compactBattle = String(keyboardOpen || height < 500);
  scheduleBattleLayout();
}

function initializeBattleLayout() {
  window.visualViewport?.addEventListener("resize", updateBattleViewport);
  window.visualViewport?.addEventListener("scroll", updateBattleViewport);
  window.addEventListener("resize", updateBattleViewport);
  window.addEventListener("orientationchange", updateBattleViewport);
  if (window.ResizeObserver) {
    const observer = new window.ResizeObserver(scheduleBattleLayout);
    observer.observe(els.arena);
    observer.observe(els.resetButton);
  }
  updateBattleViewport();
}
