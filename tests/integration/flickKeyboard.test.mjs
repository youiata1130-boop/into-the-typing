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
    if (small) key(game, "small");
    else if (mark) key(game, mark === "\u3099" ? "dakuten" : "handakuten");
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
  assert.equal(game.run("gameFlickUi.feedback.textContent"), "ミス");
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
  key(game, "small");
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
