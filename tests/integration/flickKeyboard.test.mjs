import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createGame } from "../helpers/game.mjs";

const readings = JSON.parse(readFileSync(new URL("../fixtures/japanese-readings.json", import.meta.url), "utf8"));

function battle(word = null) {
  const game = createGame({
    "into-the-typing.player.v2": JSON.stringify({
      version: 2, totalExperience: 0, stats: { attack: 1, agility: 1 },
      weaponId: "greatsword", introCompleted: true, equipmentTutorialCompleted: true,
    }),
  }, { touch: true });
  game.run('startGame("mist_road")');
  game.advance(850);
  if (word) game.run("const originalChooseWord = chooseWord; chooseWord = () => ("
    + JSON.stringify(word) + "); setNextWord(getCurrentEnemy()); chooseWord = originalChooseWord;"
    + "getCurrentEnemy().hp = getCurrentEnemy().maxHp = 20; renderWord();");
  return game;
}

function key(game, id, direction = 0) {
  return game.run("applyGameFlickKey(" + JSON.stringify(id) + ", " + direction + ")");
}

function typeKana(game, value) {
  for (const character of value) {
    const small = { ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お", っ: "つ", ゃ: "や", ゅ: "ゆ", ょ: "よ", ゎ: "わ" }[character];
    const [base, mark] = character.normalize("NFD");
    const plain = small || base;
    const mapping = game.snapshot("gameFlickKeys.filter(k => k.kana).map(k => ({ id: k.id, kana: k.kana }))");
    const row = mapping.find(row => row.kana.includes(plain));
    assert.ok(row, character);
    assert.equal(key(game, row.id, row.kana.indexOf(plain)), true);
    if (small || mark) {
      const taps = character === "づ" || character === "ゔ" || mark === "\u309a" ? 2 : 1;
      for (let i = 0; i < taps; i++) key(game, "modifier");
    }
  }
}

test("all 223 playable prompts can be entered on the game keyboard without a conversion or a miss", () => {
  const list = createGame().snapshot("wordSets.ja.concat(wordSets.branch, wordSets.unarmed)");
  for (const word of list) {
    const game = battle(word);
    typeKana(game, readings[word.translation]);
    assert.equal(game.run("getCurrentEnemy().typingMisses"), 0, word.translation);
    assert.equal(game.run("getCurrentEnemy().hp"), 16, word.translation);
    assert.equal(game.run("state.combo"), 1, word.translation);
    assert.equal(game.run("gameFlickUi.output.textContent"), "", word.translation);
    assert.equal(game.run("document.activeElement === els.typingStatus"), true);
    assert.equal(game.run("els.flickInput.hidden && els.flickInput.readOnly"), true);
  }
});

test("wrong kana leaves accepted text intact and the next correct key needs no deletion", () => {
  const game = battle({ text: "kibou", translation: "希望" });
  key(game, "ka", 1);
  key(game, "na", 2);
  assert.equal(game.run("els.flickInput.value"), "き");
  assert.equal(game.run("gameFlickUi.output.textContent"), "き");
  assert.equal(game.run("els.flickInput.getAttribute('aria-invalid')"), "true");
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 1);
  key(game, "na", 2);
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 2);
  typeKana(game, "ぼう");
  assert.equal(game.run("state.combo"), 1);
  assert.equal(game.run("getCurrentEnemy().hp"), 18);
  assert.equal(game.run("gameFlickUi.output.textContent"), "");
});

test("pending modifiers are visible and delete removes the pending or accepted kana", () => {
  const game = battle({ text: "gakkou", translation: "学校" });
  key(game, "ka");
  assert.equal(game.run("gameFlickUi.output.textContent"), "か");
  assert.equal(game.run("gameFlickUi.entry.classList.contains('is-pending')"), true);
  key(game, "delete");
  assert.equal(game.run("gameFlickUi.output.textContent"), "");
  typeKana(game, "が");
  key(game, "ta", 2);
  assert.equal(game.run("gameFlickUi.output.textContent"), "がつ");
  key(game, "modifier");
  assert.equal(game.run("gameFlickUi.output.textContent"), "がっ");
  key(game, "delete");
  assert.equal(game.run("gameFlickUi.output.textContent"), "が");
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 0);
  typeKana(game, "っこう");
  assert.equal(game.run("state.combo"), 1);
});

test("a fresh prompt and battle reject stale gesture keys and clear old letters", () => {
  const game = battle({ text: "kinyoubi", translation: "金曜日", reading: "きんようび" });
  game.run("const staleKey = flickPromptKey()");
  typeKana(game, "きんようび");
  assert.equal(key(game, "a"), false);
  game.advance(220);
  assert.equal(game.run('applyGameFlickKey("a", 0, staleKey)'), false);
  assert.equal(game.run("els.flickInput.value"), "");
  game.run('resetGame(); startGame("mist_road")');
  assert.equal(game.run('applyGameFlickKey("a", 0, staleKey)'), false);
});

test("game keyboard hides during dialogue/results and is unavailable on desktop", () => {
  const game = createGame({}, { touch: true });
  game.run("startGame()");
  assert.equal(game.run("gameFlickUi.keyboard.hidden"), true);
  assert.equal(key(game, "a"), false);
  game.run("advanceStory()");
  assert.equal(game.run("gameFlickUi.keyboard.hidden"), false);
  game.run("finishGame(false)");
  assert.equal(game.run("gameFlickUi.keyboard.hidden"), true);
  assert.equal(key(game, "a"), false);
  const desktop = createGame();
  desktop.run("startGame(); advanceStory()");
  assert.equal(desktop.run("gameFlickUi.keyboard.hidden"), true);
  assert.equal(key(desktop, "a"), false);
});

test("direction thresholds distinguish taps, all four flicks, and canceled long drags", () => {
  const game = createGame();
  for (const [x, y, expected] of [[0, 0, 0], [8, 8, 0], [-30, 0, 1], [0, -30, 2], [30, 0, 3], [0, 30, 4], [170, 0, -1]]) {
    assert.equal(game.run("gameFlickDirection(" + x + ", " + y + ")"), expected);
  }
});

test("pointer release commits once; cancel, second touches and stale releases do not type", () => {
  const game = battle({ text: "kibou", translation: "希望" });
  game.run("const kaKey = gameFlickUi.buttons.find(item => item.definition.id === 'ka');"
    + "const pointer = (x, id = 1) => ({ pointerId: id, button: 0, clientX: x, clientY: 50, preventDefault() {} });"
    + "beginGameFlickGesture(pointer(50), kaKey.definition, kaKey.button);"
    + "beginGameFlickGesture(pointer(50, 2), kaKey.definition, kaKey.button);endGameFlickGesture(pointer(20, 2));");
  assert.equal(game.run("els.flickInput.value"), "");
  game.run("endGameFlickGesture(pointer(20)); kaKey.button.dispatchEvent({ type: 'click', detail: 1 })");
  assert.equal(game.run("els.flickInput.value"), "き");
  game.run("beginGameFlickGesture(pointer(50), kaKey.definition, kaKey.button); cancelGameFlickGesture(); endGameFlickGesture(pointer(20))");
  assert.equal(game.run("els.flickInput.value"), "き");
  game.run("beginGameFlickGesture(pointer(50), kaKey.definition, kaKey.button); getCurrentEnemy().inputRevision++; endGameFlickGesture(pointer(20))");
  assert.equal(game.run("els.flickInput.value"), "き");
});

test("one modifier key cycles small kana, voiced kana, and semi-voiced kana in order", () => {
  const game = createGame();
  for (const cycle of ["あぁ", "つっづ", "はばぱ", "ひびぴ", "かが", "やゃ", "うぅゔ"]) {
    for (let i = 0; i < cycle.length; i++) {
      assert.equal(game.run("getGameFlickModified(" + JSON.stringify(cycle[i]) + ", 'modifier')"), cycle[(i + 1) % cycle.length]);
    }
  }
  assert.equal(game.run("getGameFlickModified('ん', 'modifier')"), "");
  const voiced = battle({ text: "dukai", translation: "使い", reading: "づかい" });
  key(voiced, "ta", 2);
  key(voiced, "modifier");
  assert.equal(voiced.run("gameFlickUi.output.textContent"), "っ");
  assert.equal(voiced.run("getCurrentEnemy().typingMisses"), 0);
  key(voiced, "modifier");
  assert.equal(voiced.run("gameFlickUi.output.textContent"), "づ");
  typeKana(voiced, "かい");
  assert.equal(voiced.run("state.combo"), 1);
  assert.equal(voiced.run("getCurrentEnemy().typingMisses"), 0);
});

function pressKana(game) {
  game.run("const heldKey = gameFlickUi.buttons.find(item => item.definition.id === 'ka');"
    + "const heldPointer = (x = 50, y = 50) => ({ pointerId: 1, button: 0, clientX: x, clientY: y, preventDefault() {} });"
    + "beginGameFlickGesture(heldPointer(), heldKey.definition, heldKey.button)");
}

test("kana guide waits 300 ms for a stationary press but quick flicks enter without waiting", () => {
  const game = battle({ text: "kibou", translation: "希望" });
  pressKana(game);
  assert.equal(game.run("gameFlickUi.popup.hidden"), true);
  game.advance(299);
  assert.equal(game.run("gameFlickUi.popup.hidden"), true);
  game.advance(1);
  assert.equal(game.run("gameFlickUi.popup.hidden"), false);
  game.run("cancelGameFlickGesture(); beginGameFlickGesture(heldPointer(), heldKey.definition, heldKey.button);"
    + "moveGameFlickGesture(heldPointer(20))");
  assert.equal(game.run("gameFlickUi.popup.hidden"), false);
  assert.equal(game.run("gameFlickUi.choices[1].classList.contains('is-selected')"), true);
  game.run("endGameFlickGesture(heldPointer(20))");
  assert.equal(game.run("els.flickInput.value"), "き");
  assert.equal(game.run("gameFlickUi.popup.hidden"), true);
  game.advance(400);
  assert.equal(game.run("gameFlickUi.popup.hidden"), true);
});

test("short taps, cancellation, next prompts and ending battle never leak delayed guides", () => {
  for (const finish of ["endGameFlickGesture(heldPointer())", "cancelGameFlickGesture()", "getCurrentEnemy().inputRevision++", "finishGame(false)"]) {
    const game = battle({ text: "kasa", translation: "傘" });
    pressKana(game);
    game.advance(100);
    game.run(finish);
    game.advance(300);
    assert.equal(game.run("gameFlickUi.popup.hidden"), true, finish);
  }
});

test("keyboard touch guards cover gaps, disabled keys, release and movement outside the panel", () => {
  const game = battle({ text: "kibou", translation: "希望" });
  game.run("let preventedTouches = 0; const finger = { identifier: 7, target: gameFlickUi.surface };"
    + "const touchEvent = (type, target, touches) => ({ type, target, touches, changedTouches: [finger], cancelable: true, preventDefault() { preventedTouches++; } });"
    + "guardGameFlickTouch(touchEvent('touchstart', gameFlickUi.surface, [finger]));"
    + "guardGameFlickTouch(touchEvent('touchmove', document.body, [finger]));"
    + "guardGameFlickTouch(touchEvent('touchend', document.body, []));");
  assert.equal(game.run("preventedTouches"), 3);
  assert.equal(game.run("gameFlickState.touchIds.size"), 0);
  game.run("guardGameFlickTouch({type:'touchstart',target:document.body,touches:[],changedTouches:[],cancelable:true,preventDefault(){preventedTouches++;}})");
  assert.equal(game.run("preventedTouches"), 3);
  game.run("guardGameFlickTouch({type:'touchmove',target:gameFlickUi.surface,touches:[],cancelable:false,preventDefault(){throw new Error('not cancelable');}})");
});

test("two fingers cancel the letter, block zoom, and allow a new single-finger gesture afterward", () => {
  const game = battle({ text: "kibou", translation: "希望" });
  pressKana(game);
  game.run("let blockedGestures = 0; const fingers = [1,2].map(identifier => ({identifier,target:gameFlickUi.keyboard}));"
    + "guardGameFlickTouch({type:'touchstart',target:gameFlickUi.keyboard,touches:fingers,cancelable:true,preventDefault(){}});"
    + "guardGameFlickBrowserGesture({type:'gesturestart',target:document.body,cancelable:true,preventDefault(){blockedGestures++;}});"
    + "guardGameFlickBrowserGesture({type:'gesturechange',target:document.body,cancelable:true,preventDefault(){blockedGestures++;}});"
    + "endGameFlickGesture(heldPointer(20));"
    + "beginGameFlickGesture(heldPointer(),heldKey.definition,heldKey.button);");
  assert.equal(game.run("gameFlickState.gesture"), null);
  assert.equal(game.run("els.flickInput.value"), "");
  assert.equal(game.run("blockedGestures"), 2);
  game.run("guardGameFlickTouch({type:'touchend',target:document.body,touches:[],cancelable:true,preventDefault(){}});"
    + "guardGameFlickBrowserGesture({type:'gestureend',target:gameFlickUi.keyboard,cancelable:true,preventDefault(){}});"
    + "beginGameFlickGesture(heldPointer(),heldKey.definition,heldKey.button);endGameFlickGesture(heldPointer(20));");
  assert.equal(game.run("els.flickInput.value"), "き");
  game.run("guardGameFlickBrowserGesture({type:'gesturestart',target:document.body,cancelable:true,preventDefault(){blockedGestures++;}})");
  assert.equal(game.run("blockedGestures"), 2);
});

test("keyboard blocks double-tap, selection, context menu and wheel defaults without affecting the rest of the page", () => {
  const game = battle();
  game.run("let blockedActions = 0");
  for (const type of ["dblclick", "selectstart", "contextmenu", "dragstart", "wheel"]) {
    game.run("guardGameFlickBrowserGesture({type:"+JSON.stringify(type)+",target:gameFlickUi.surface,cancelable:true,preventDefault(){blockedActions++;}})");
  }
  assert.equal(game.run("blockedActions"), 5);
  game.run("finishGame(false);guardGameFlickBrowserGesture({type:'dblclick',target:gameFlickUi.surface,cancelable:true,preventDefault(){blockedActions++;}})");
  assert.equal(game.run("blockedActions"), 5);
});
