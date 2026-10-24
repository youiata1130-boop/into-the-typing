import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createGame } from "../../helpers/game.mjs";

test("startup stays closed until every required image is loaded and decoded", () => {
  const game = createGame({}, { loadImages: false });
  assert.equal(game.run("assetLoadingState.ready"), false);
  assert.equal(game.run("loadingUi.screen.hidden"), false);
  assert.equal(game.run("loadingUi.game.hidden && loadingUi.game.inert"), true);
  game.run('startGame(); showStageSelect(); showStartScreen(); handleTypingKeydown({ key: " ", code: "Space", preventDefault() {} })');
  assert.equal(game.run("state.running"), false);
  assert.equal(game.run('document.documentElement.dataset.screen'), "loading");
  game.run("const lastImage = window.testImages.at(-1); lastImage.deferDecode(); window.testImages.forEach(image => image.succeed())");
  assert.equal(game.run("assetLoadingState.ready"), false);
  assert.equal(game.run("assetLoadingState.completed"), game.run("assetLoadingState.total - 1"));
  assert.equal(game.run("loadingUi.game.hidden"), true);
  game.run("lastImage.resolveDecode()");
  assert.equal(game.run("assetLoadingState.ready"), true);
  assert.equal(game.run("loadingUi.screen.hidden"), true);
  assert.equal(game.run("loadingUi.game.hidden || loadingUi.game.inert"), false);
  assert.equal(game.run("loadingUi.progress.value"), 100);
  assert.equal(game.run("state.running"), false);
  assert.equal(game.run('document.documentElement.dataset.screen'), "start");
});

test("an image failure blocks startup and Retry fetches only that image", () => {
  const game = createGame({}, { loadImages: false });
  const total = game.run("window.testImages.length");
  game.run("const brokenImage = window.testImages[0]; brokenImage.fail(); window.testImages.slice(1).forEach(image => image.succeed())");
  assert.equal(game.run("assetLoadingState.ready"), false);
  assert.equal(game.run("loadingUi.text.textContent"), "読み込みに失敗しました");
  assert.equal(game.run("loadingUi.retry.hidden || loadingUi.retry.disabled"), false);
  game.run("startGame()");
  assert.equal(game.run("state.running"), false);
  game.run("loadGameAssets(); loadGameAssets()");
  assert.equal(game.run("window.testImages.length"), total + 1);
  assert.equal(game.run("window.testImages.at(-1).src === brokenImage.src"), true);
  assert.equal(game.run("loadingUi.retry.hidden"), true);
  game.run("window.testImages.at(-1).succeed()");
  assert.equal(game.run("assetLoadingState.ready"), true);
  assert.equal(game.run("assetLoadingState.images.size"), total);
});

test("decode failure and empty images cannot unlock the game", () => {
  for (const failure of ["decode", "empty"]) {
    const game = createGame({}, { loadImages: false });
    game.run("const brokenImage = window.testImages[0]; window.testImages.slice(1).forEach(image => image.succeed())");
    if (failure === "decode") {
      game.run('brokenImage.deferDecode(); brokenImage.succeed(); brokenImage.rejectDecode(new Error("decode failed"))');
    } else {
      game.run("brokenImage.onload()");
    }
    assert.equal(game.run("assetLoadingState.ready"), false);
    assert.equal(game.run("assetLoadingState.failed.length"), 1);
    assert.equal(game.run("loadingUi.game.hidden"), true);
  }
});

test("a stalled image times out and its late result cannot bypass Retry", () => {
  const game = createGame({}, { loadImages: false });
  game.run("const stalledImage = window.testImages[0]; stalledImage.deferDecode(); window.testImages.forEach(image => image.succeed())");
  game.advance(45000);
  assert.equal(game.run("assetLoadingState.ready"), false);
  assert.equal(game.run("loadingUi.retry.hidden"), false);
  game.run("stalledImage.resolveDecode()");
  assert.equal(game.run("assetLoadingState.ready"), false);
  game.run("loadGameAssets(); window.testImages.at(-1).succeed()");
  assert.equal(game.run("assetLoadingState.ready"), true);
});


test("startup downloads only the shared background, without hidden page images or stage preloads", () => {
  const game = createGame({}, { preloadStages: false });
  const urls = game.snapshot("window.testImages.map(image => image.src)");
  assert.equal(urls.length, 1);
  assert.match(urls[0], /shared\/typing_rpg_background/);
  const html = readFileSync(new URL("../../../index.html", import.meta.url), "utf8");
  assert.equal([...html.matchAll(/<link rel="preload"/g)].length, 1);
  assert.doesNotMatch(html, /<img\b[^>]*\ssrc=/);
  assert.doesNotMatch(html, /<image\b[^>]*\shref=/);
});

function manualGame() {
  const game = createGame({}, { loadImages: false, preloadStages: false });
  game.run('window.testImages.forEach(image => image.succeed())');
  game.run('activatePlayerSave(0, getSaveEntry(0))');
  return game;
}

test("a stage waits for its own background, enemies and equipped weapon, then starts only after decoding", () => {
  const game = manualGame();
  game.run('startGame("forest_path")');
  assert.equal(game.run('state.running'), false);
  assert.equal(game.run('loadingUi.screen.hidden'), false);
  const urls = game.snapshot('window.testImages.slice(1).map(image => image.src)');
  assert.ok(urls.some(src => src.includes('/medaka/level_1/')));
  assert.ok(urls.some(src => src.includes('/player/branch/')));
  assert.ok(urls.some(src => src.includes('/story/raft_storm')));
  assert.ok(!urls.some(src => /mushroom|tree_fairy|greatsword|medaka\/boss/.test(src)));
  game.run('const last = window.testImages.at(-1); last.deferDecode(); window.testImages.slice(1).forEach(image => image.succeed())');
  assert.equal(game.run('state.running'), false);
  game.run('last.resolveDecode()');
  assert.equal(game.run('state.running'), true);
  assert.equal(game.run('loadingUi.screen.hidden'), true);
  const count = game.run('window.testImages.length');
  game.run('startGame("forest_path")');
  assert.equal(game.run('window.testImages.length'), count);
});

test("stage failure can retry only the failed image and cannot start combat early", () => {
  const game = manualGame();
  game.run('startGame(); const failed = window.testImages[1]; failed.fail(); window.testImages.slice(2).forEach(image => image.succeed())');
  assert.equal(game.run('state.running'), false);
  assert.equal(game.run('assetLoadingState.ready'), true);
  assert.equal(game.run('loadingUi.retry.hidden'), false);
  const count = game.run('window.testImages.length');
  game.run('loadGameAssets(); loadGameAssets()');
  assert.equal(game.run('window.testImages.length'), count + 1);
  assert.equal(game.run('window.testImages.at(-1).src === failed.src'), true);
  game.run('window.testImages.at(-1).succeed()');
  assert.equal(game.run('state.running'), true);
});

test("changing regions loads just that map and stage manifests include their bosses and wind-up frames", () => {
  const game = manualGame();
  game.run('showStageSelect()');
  assert.equal(game.run('state.running'), false);
  game.run('window.testImages.at(-1).succeed()');
  assert.equal(game.run('document.documentElement.dataset.screen'), 'stage');
  const count = game.run('window.testImages.length');
  game.run('switchStageMap("forest")');
  assert.equal(game.run('window.testImages.length'), count + 1);
  assert.match(game.run('window.testImages.at(-1).src'), /stage_map\/forest/);
  game.run('window.testImages.at(-1).succeed()');
  assert.equal(game.run('state.stageMapRegionId'), 'forest');
  const urls = game.snapshot('collectStageImageSources("fairy_forest")');
  assert.ok(urls.some(src => src.includes('/tree_fairy/boss/windup/')));
  assert.ok(!urls.some(src => /medaka|crab|raft_storm/.test(src)));
  assert.equal(urls.length, new Set(urls).size);
});

test("newly equipped weapons and reward art belong only to the stages that need them", () => {
  const game = createGame({}, { preloadStages: false });
  game.run('state.weaponId = "greatsword"; state.greatswordObtained = true');
  const urls = game.snapshot('collectStageImageSources("mushroom_forest")');
  assert.ok(urls.some(src => src.includes('/greatsword/guard/')));
  assert.ok(urls.some(src => src.includes('/items/weapons/sword_shield.')));
  assert.ok(!urls.some(src => src.includes('/player/sword_shield/')));
  assert.ok(!urls.some(src => src.includes('/items/weapons/dual_blades.')));
});

test("menu download preserves the equipment guide and restores its keyboard focus", () => {
  const game = manualGame();
  game.run('state.swordShieldObtained = true; state.swordShieldEquipPending = true; showWeaponScreen()');
  assert.equal(game.run('document.documentElement.dataset.screen'), 'loading');
  game.run('window.testImages.at(-1).succeed()');
  assert.equal(game.run('document.documentElement.dataset.screen'), 'weapons');
  assert.equal(game.run('state.weaponEquipGuideId'), 'swordShield');
  assert.equal(game.run('document.activeElement === els.weaponSwordShield'), true);
});
