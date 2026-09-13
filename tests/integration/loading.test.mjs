import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createGame } from "../helpers/game.mjs";

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

test("all weapons and both playable stages are preloaded without duplicate URLs", () => {
  const game = createGame();
  assert.equal(game.run("assetLoadingState.ready"), true);
  const urls = game.snapshot("window.testImages.map(image => image.src)");
  assert.equal(urls.length, new Set(urls).size);
  for (const type of ["egg", "chick"]) {
    for (const animation of ["idle", "attack", "damage", "defeat"]) {
      assert.ok(urls.some(url => url.includes("/enemies/" + type + "/level_1/" + animation + "/")));
    }
  }
  for (const weapon of ["unarmed", "branch", "sword", "greatsword"]) {
    assert.ok(urls.some(url => url.includes("/player/" + weapon + "/")));
  }
  assert.ok(!urls.some(url => url.includes("/goblin/") || url.includes("/chicken/")));
});

test("the page preload declarations cover every CSS background and both map orientations", () => {
  const game = createGame();
  const base = new URL("../../index.html", import.meta.url);
  const html = readFileSync(base, "utf8");
  const css = readFileSync(new URL("src/styles/main.css", base), "utf8");
  const attrs = tag => Object.fromEntries([...tag.matchAll(/([a-z]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]));
  const pageAssets = [...html.matchAll(/<(img|source|link)\b[^>]*>/g)].map(([tag, type]) => ({ type, ...attrs(tag) }));
  game.run(`
    const pageAssets = ${JSON.stringify(pageAssets)};
    document.querySelectorAll = selector => pageAssets.filter(item =>
      selector === "img[src]" ? item.type === "img" && item.src
      : selector.includes("srcset") ? item.srcset : item.rel === "preload" && item.as === "image"
    ).map(item => ({ getAttribute: name => item[name] }));
  `);
  const urls = game.snapshot("collectGameImageSources()");
  for (const [, path] of css.matchAll(/url\("([^"]+)"\)/g)) {
    assert.ok(urls.includes(new URL(path, "https://typing.test/src/styles/main.css").href), path);
  }
  for (const name of ["desk_portrait.jpg", "desk_landscape.jpg", "branch.png?v=branch-intro-v1"]) {
    assert.ok(urls.some(url => url.endsWith("/" + name)), name);
  }
  assert.equal(urls.length, new Set(urls).size);
});

test("startup also repairs a failed DOM image before unlocking", () => {
  const game = createGame({}, { loadImages: false });
  game.run(`
    const pageImage = new Image();
    pageImage.src = window.testImages[0].src;
    pageImage.getAttribute = () => pageImage.src;
    document.querySelectorAll = selector => selector === "img[src]" ? [pageImage] : [];
    window.testImages.filter(image => image !== pageImage).forEach(image => image.succeed());
  `);
  assert.equal(game.run("assetLoadingState.ready"), false);
  assert.equal(game.run("loadingUi.game.hidden"), true);
  game.run("pageImage.fail()");
  assert.equal(game.run("loadingUi.retry.hidden"), false);
  game.run("loadGameAssets()");
  assert.equal(game.run("assetLoadingState.ready"), false);
  game.run("pageImage.succeed()");
  assert.equal(game.run("assetLoadingState.ready"), true);
  assert.equal(game.run("pageImage.naturalWidth > 0"), true);
});
