// Layout only: viewport changes never alter battle state or request keyboard focus.
const battleViewportState = { baselines: new Map(), frameId: 0 };

function calculateBattleLayout(width, height, backBottom, slots = 1, enemySize = 1, chargeHeight = 0, enemyChargeHeight = 0) {
  const enemyBaseWidth = 120 * enemySize;
  const enemyBaseHeight = 106 * enemySize;
  const padding = 8;
  const hpSpace = 18;
  const playerTop = Math.max(8, backBottom + 6);
  const playerHeadSpace = hpSpace + (chargeHeight > 0 ? chargeHeight + 6 : 0);
  const slotGap = Math.min(48, Math.max(0, (height - 150) / Math.max(1, slots)));
  const enemyTop = 8 + enemyChargeHeight + slotGap * Math.max(0, slots - 1);
  const horizontalScale = Math.min(1, Math.max(0, (width - padding * 2 - 20) / (129 + enemyBaseWidth)));
  // Use the normal floor first, then move down, and only then reduce image size.
  const playerBottom = Math.max(8, Math.min(32, height - playerTop - playerHeadSpace - 177 * horizontalScale));
  const enemyBottom = Math.max(8, Math.min(26, height - enemyTop - hpSpace - enemyBaseHeight * horizontalScale));
  const playerScale = Math.max(0, Math.min(horizontalScale, (height - playerTop - playerHeadSpace - playerBottom) / 177));
  const enemyScale = Math.max(0, Math.min(horizontalScale, (height - enemyTop - hpSpace - enemyBottom) / enemyBaseHeight));
  const playerWidth = 129 * playerScale;
  const enemyWidth = enemyBaseWidth * enemyScale;
  const enemyFar = Math.max(padding, width - padding - enemyWidth);
  const enemyNear = Math.min(enemyFar, padding + playerWidth + 20);
  return {
    playerWidth, playerHeight: 177 * playerScale, playerBottom,
    enemyWidth, enemyHeight: enemyBaseHeight * enemyScale, enemySpriteWidth: 96 * enemySize * enemyScale,
    enemyBottom, enemyFar, enemyTravel: enemyFar - enemyNear, slotGap,
  };
}

function fitBattleCharacters() {
  battleViewportState.frameId = 0;
  if (els.battleScreen.hidden) return;
  const arena = els.arena;
  if (!arena.clientWidth || !arena.clientHeight) return;
  const bounds = arena.getBoundingClientRect();
  const backBottom = els.resetButton.getBoundingClientRect().bottom - bounds.top;
  // Measure height, not viewport position: the meter now moves with the player.
  const chargeHeight = els.weaponCharge.hidden ? 0 : els.weaponCharge.getBoundingClientRect().height;
  arena.style.setProperty("--player-headroom", `${Math.max(8, backBottom + 6) + (chargeHeight > 0 ? chargeHeight + 24 : 0)}px`);
  if (!flickState.enabled) {
    fitSwarmCharacters(bounds);
    return;
  }
  const slots = Math.max(1, ...state.activeEnemies.map(enemy => (enemy.slot || 0) + 1));
  const enemySize = state.activeEnemies.some(enemy => ["medaka_boss", "crab_boss", "snake_boss"].includes(enemy.type)) ? 1.3 : 1;
  const enemyChargeHeight = state.activeEnemies.some(enemy => enemy.attackStyle === "charge") ? 38 : 0;
  const layout = calculateBattleLayout(arena.clientWidth, arena.clientHeight, backBottom, slots, enemySize, chargeHeight, enemyChargeHeight);
  for (const [name, value] of Object.entries(layout)) {
    const cssName = name.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase());
    arena.style.setProperty("--fit-" + cssName, value.toFixed(2) + "px");
  }
  fitSwarmCharacters(bounds);
}

function calculateSwarmLayout(arenaWidth, arenaHeight, player, backRight, slots, size = 1) {
  const near = Math.max(player.right + 20, backRight + 8);
  const maxWidth = Math.max(12, Math.min(96 * size, arenaWidth - near - 8));
  const compact = arenaHeight < 220;
  const hpHeight = compact ? 8 : 14;
  const gap = compact ? 2 : 4;
  const rowGap = compact ? 4 : 8;
  // All lanes end beside the player. Fit them around the player's height so
  // waiting bees remain distinct without attacking from the back of the arena.
  const availableHeight = arenaHeight - (compact ? 8 : Math.max(8, player.top - 32)) - 8;
  const height = Math.max(8, Math.min(maxWidth * 2 / 3, availableHeight / slots - hpHeight - gap - rowGap));
  const width = height * 1.5;
  const far = arenaWidth - 8 - width;
  return { width, height, far, travel: Math.max(0, far - near),
    "hp-height": hpHeight, gap, "row-step": height + hpHeight + gap + rowGap };
}

function fitSwarmCharacters(bounds) {
  const bees = state.activeEnemies.filter(enemy => ["bee_level_1", "bee_boss"].includes(enemy.type));
  if (!bees.length) return;
  const playerBounds = els.player.getBoundingClientRect();
  const player = { right: playerBounds.right - bounds.left, top: playerBounds.top - bounds.top };
  const backRight = els.resetButton.getBoundingClientRect().right - bounds.left;
  // Reserve the whole wave's lanes so later spawns never move existing bees.
  const slots = Math.max(1, chooseEnemyWave()?.maxActive || 1, ...state.activeEnemies.map(enemy => enemy.slot + 1));
  const size = bees.some(enemy => enemy.type === "bee_boss") ? 2 : 1;
  const layout = calculateSwarmLayout(bounds.width, bounds.height, player, backRight, slots, size);
  for (const [name, value] of Object.entries(layout)) {
    els.arena.style.setProperty("--swarm-" + name, `${value.toFixed(2)}px`);
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
    observer.observe(els.weaponCharge);
  }
  updateBattleViewport();
}
