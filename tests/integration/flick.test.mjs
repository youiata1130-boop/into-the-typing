import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

function battle(weapon = "branch") {
  const game = createGame({
    "into-the-typing.player.v2": JSON.stringify({
      version: 2, totalExperience: 0, stats: { attack: 1, agility: 1 },
      weaponId: weapon, introCompleted: true, equipmentTutorialCompleted: true,
    }),
  }, { touch: true });
  game.run('startGame("mist_road")');
  game.advance(850);
  return game;
}

function prompt(game, text, translation, reading = "") {
  game.run("const target = getCurrentEnemy();");
  game.run("target.word = " + JSON.stringify(text) + "; target.translation = " + JSON.stringify(translation)
    + "; target.readingOverride = " + JSON.stringify(reading)
    + "; target.inputs = getWordInputs({ text: target.word }); target.matchedWord = target.inputs[0];"
    + " target.inputRevision += 1; target.hp = target.maxHp = 20; renderWord();");
}

function input(game, value) {
  game.run("els.flickInput.value = " + JSON.stringify(value) + "; handleFlickInput({ isComposing: false })");
  game.advance(0);
}

test("every Japanese prompt has a complete kana reading, including n, small kana, and long vowels", () => {
  const game = createGame();
  assert.deepEqual(game.snapshot("wordSets.ja.concat(wordSets.branch, wordSets.unarmed).filter(word => !window.JAPANESE_INPUT.parse(word.text, word.reading)).map(word => word.text)"), []);
  for (const [roman, expected, override] of [
    ["gakkou", "がっこう"], ["shindennohihou", "しんでんのひほう"],
    ["gyuunyuu", "ぎゅうにゅう"], ["ko-hi-", "こーひー"], ["honya", "ほんや", "ほんや"],
    ["mahoujinnokiseki", "まほうじんのきせき"], ["shinbun", "しんぶん"],
  ]) {
    assert.equal(game.run("window.JAPANESE_INPUT.parse(" + JSON.stringify(roman) + ", " + JSON.stringify(override || "") + ").reading"), expected);
  }
});

test("flick input completes all three punches and the branch handoff keeps the input focused", () => {
  const game = createGame({}, { touch: true });
  game.run("startGame(); advanceStory()");
  assert.equal(game.run("document.activeElement === els.flickInput"), true);
  for (let i = 1; i <= 3; i++) {
    assert.equal(game.run("getCurrentEnemy().translation"), ["あ", "木", "手"][i - 1]);
    assert.equal(game.run("getFlickReading(getCurrentEnemy()).reading"), ["あ", "き", "て"][i - 1]);
    input(game, ["あ", "き", "て"][i - 1]);
    assert.equal(game.run("(getCurrentEnemy()?.tutorial?.punches || 0)"), i);
    assert.equal(game.run("els.flickInput.value"), "");
    assert.equal(game.run("getCurrentEnemy().typingMisses"), 0);
    game.advance(480);
  }
  assert.equal(game.run("state.storyPhase"), "weapon-offer");
  input(game, "き");
  assert.equal(game.run("(getCurrentEnemy()?.tutorial?.punches || 0)"), 3);
  game.run("advanceStory()");
  assert.equal(game.run("getCurrentEnemy().weaponId"), "branch");
  assert.equal(game.run("document.activeElement === els.flickInput"), true);
  for (const remaining of [72.75, 48.5, 24.25, 0]) {
    const reading = game.run("getFlickReading(getCurrentEnemy()).reading");
    input(game, reading);
    assert.equal(game.run("Number(getCurrentEnemy().hpTrack.getAttribute('aria-valuenow'))"), remaining);
    assert.equal(game.run("els.flickInput.value"), "");
    assert.equal(game.run("document.activeElement === els.flickInput"), true);
    game.advance(220);
  }
  assert.equal(game.run("state.cleared"), 1);
});

test("IME composition does not penalize unfinished dakuten, and its final events attack only once", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run('handleFlickCompositionStart(); els.flickInput.value = "か"; handleFlickInput({ isComposing: true })');
  game.advance(0);
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 0);
  assert.equal(game.run("getCurrentEnemy().typed"), "");
  game.run('els.flickInput.value = "がっこう"; handleFlickInput({ isComposing: true }); handleFlickCompositionEnd(); handleFlickInput({ isComposing: false })');
  game.advance(0);
  assert.equal(game.run("getCurrentEnemy().hp"), 16);
  assert.equal(game.run("state.combo"), 1);
  game.run('handleFlickInput({ isComposing: false })');
  game.advance(0);
  assert.equal(game.run("getCurrentEnemy().hp"), 16);
});

test("committed prefixes charge the greatsword and a wrong kana resets its pose once", () => {
  const game = battle("greatsword");
  prompt(game, "kibounohikari", "希望の光");
  input(game, "きぼう");
  assert.equal(game.run("getCurrentEnemy().typed"), "kibou");
  assert.equal(game.run("els.player.dataset.chargePose"), "1");
  input(game, "きぼうぬ");
  input(game, "きぼうぬ");
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 1);
  assert.equal(game.run("els.player.dataset.chargePose"), "0");
  assert.equal(game.run('els.flickInput.getAttribute("aria-invalid")'), "true");
  input(game, "きぼうのひかり");
  assert.equal(game.run("getCurrentEnemy().hp"), 17);
  assert.equal(game.run('els.flickInput.getAttribute("aria-invalid")'), "false");
});

test("small kana prefixes and deletion preserve normal typed progress", () => {
  const game = battle();
  prompt(game, "gyuunyuu", "牛乳");
  input(game, "ぎ");
  assert.equal(game.run("getCurrentEnemy().typed"), "");
  assert.equal(game.run('els.flickInput.getAttribute("aria-invalid")'), "false");
  input(game, "ぎゅう");
  assert.equal(game.run("getCurrentEnemy().typed"), "gyuu");
  input(game, "ぎゅ");
  assert.equal(game.run("getCurrentEnemy().typed"), "gyu");
  input(game, "ぎゅうにゅう");
  assert.equal(game.run("getCurrentEnemy().hp"), 19.8);
});

test("hiragana, katakana, halfwidth kana, kanji conversion, and Latin text are accepted", () => {
  for (const value of ["がっこう", "ガッコウ", "ｶﾞｯｺｳ", "学校", "gakkou", "ＧＡＫＫＯＵ"]) {
    const game = battle();
    prompt(game, "gakkou", "学校");
    input(game, value);
    assert.equal(game.run("getCurrentEnemy().hp"), 19.8, value);
  }
  const game = battle();
  prompt(game, "honya", "本屋", "ほんや");
  input(game, "ほん");
  assert.equal(game.run("getCurrentEnemy().typed"), "hon");
  input(game, "ほんや");
  assert.equal(game.run("getCurrentEnemy().hp"), 19.8);
});

test("stale IME commits and scheduled input cannot attack a restarted encounter", () => {
  const game = createGame({}, { touch: true });
  game.run('startGame(); advanceStory(); handleFlickCompositionStart(); els.flickInput.value = "あ"; startGame(); advanceStory(); handleFlickCompositionEnd()');
  game.advance(0);
  assert.equal(game.run("(getCurrentEnemy()?.tutorial?.punches || 0)"), 0);
  game.run('els.flickInput.value = "あ"; handleFlickInput({ isComposing: false }); startGame(); advanceStory()');
  game.advance(0);
  assert.equal(game.run("(getCurrentEnemy()?.tutorial?.punches || 0)"), 0);
  input(game, "あ");
  assert.equal(game.run("(getCurrentEnemy()?.tutorial?.punches || 0)"), 1);
});

test("native Space, Backspace, Enter, and composing keydowns are left to the IME", () => {
  const game = battle();
  game.run("state.specialGauge = 100; let intercepted = false;");
  for (const key of [" ", "Backspace", "Enter", "a"]) {
    game.run("handleTypingKeydown({ target: els.flickInput, key: " + JSON.stringify(key) + ', code: "Space", preventDefault() { intercepted = true; } })');
  }
  game.run('handleTypingKeydown({ key: "a", code: "KeyA", isComposing: true, preventDefault() { intercepted = true; } })');
  assert.equal(game.run("intercepted"), false);
  assert.equal(game.run("state.specialGauge"), 100);
  assert.equal(game.run("getCurrentEnemy().typed"), "");
});

test("Return confirms consecutive words without another tap on the editor", () => {
  const game = createGame({}, { touch: true });
  game.run("startGame(); advanceStory(); let returns = 0;");
  for (let count = 1; count <= 2; count++) {
    game.run('els.flickInput.value = getFlickReading(getCurrentEnemy()).reading; handleFlickKeydown({ key: "Enter", preventDefault() { returns++; } })');
    game.advance(0);
    assert.equal(game.run("(getCurrentEnemy()?.tutorial?.punches || 0)"), count);
    assert.equal(game.run("document.activeElement === els.flickInput"), true);
    assert.equal(game.run("els.flickInput.value"), "");
    game.advance(480);
    assert.equal(game.run("document.activeElement === els.flickInput"), true);
  }
  assert.equal(game.run("returns"), 2);
});

test("line-break input submits once and never accumulates blank lines", () => {
  const game = createGame({}, { touch: true });
  game.run('startGame(); advanceStory(); let prevented = false; els.flickInput.value = "あ"; handleFlickBeforeInput({ inputType: "insertLineBreak", cancelable: true, preventDefault() { prevented = true; } }); handleFlickKeydown({ key: "Enter", preventDefault() {} })');
  game.advance(0);
  assert.equal(game.run("prevented"), true);
  assert.equal(game.run("(getCurrentEnemy()?.tutorial?.punches || 0)"), 1);
  game.advance(480);
  input(game, game.run("getFlickReading(getCurrentEnemy()).reading") + "\n");
  assert.equal(game.run("(getCurrentEnemy()?.tutorial?.punches || 0)"), 2);
  assert.equal(game.run("els.flickInput.value"), "");
  assert.equal(game.run("document.activeElement === els.flickInput"), true);
});

test("rendering and typing do not reapply the focused editor's editability", () => {
  const game = battle();
  game.run(`let editabilityWrites = 0;
    let editableState = els.flickInput.readOnly;
    Object.defineProperty(els.flickInput, "readOnly", {
      get: () => editableState,
      set(value) { editabilityWrites++; editableState = value; },
    });
    renderWord(); renderWord();
    applyTypedValue(getCurrentEnemy(), getCurrentEnemy().matchedWord.slice(0, 1));`);
  assert.equal(game.run("editabilityWrites"), 0);
  game.run("resetGame()");
  assert.equal(game.run("editabilityWrites"), 1);
});

test("keyboard dismissal and navigation are respected by renders and automatic callbacks", () => {
  const game = battle();
  for (const active of ["document.body", "els.resetButton"]) {
    game.run("document.activeElement = " + active + "; renderWord(); updateBattleViewport(); focusGameSurface()");
    game.advance(900);
    assert.equal(game.run("document.activeElement === " + active), true);
  }
  // A dismissal during attack resolution must survive the next prompt.
  game.run("focusGameSurface({ userGesture: true })");
  input(game, game.run("getFlickReading(getCurrentEnemy()).reading"));
  game.run("document.activeElement = document.body");
  game.advance(1000);
  assert.equal(game.run("document.activeElement === document.body"), true);
  game.run("focusGameSurface({ userGesture: true })");
  assert.equal(game.run("document.activeElement === els.flickInput"), true);
  game.run("resetGame(); showStageSelect(); focusGameSurface({ userGesture: true })");
  assert.equal(game.run("document.activeElement === els.flickInput"), false);
});

test("closing the keyboard immediately after Start is not undone by the start notice", () => {
  const game = battle();
  game.run("startGame(); document.activeElement = document.body");
  game.advance(900);
  assert.equal(game.run("document.activeElement === document.body"), true);
});

test("modifier edits stay valid and finished readings attack before composition is committed", () => {
  for (const [roman, translation, updates] of [
    ["pan", "パン", ["は", "ぱ", "ぱん"]],
    ["gyuunyuu", "牛乳", ["き", "ぎ", "ぎゆ", "ぎゅ", "ぎゅうにゅう"]],
  ]) {
    const game = battle("greatsword");
    prompt(game, roman, translation);
    game.run("handleFlickCompositionStart()");
    for (const value of updates) {
      game.run("els.flickInput.value = " + JSON.stringify(value) + "; handleFlickInput({ isComposing: true });");
      game.advance(0);
      assert.equal(game.run("getCurrentEnemy().typingMisses"), 0);
      assert.equal(game.run("getCurrentEnemy().hp"), value === updates.at(-1) ? 16 : 20);
    }
    game.run("handleFlickCompositionEnd(); handleFlickInput({ isComposing: false }); handleFlickKeydown({ key: 'Enter', preventDefault() {} })");
    game.advance(0);
    assert.equal(game.run("getCurrentEnemy().hp"), 16);
    assert.equal(game.run("state.combo"), 1);
  }
});

test("wrong composing kana is penalized immediately and deleting it cannot restore a perfect attack", () => {
  const game = battle("greatsword");
  prompt(game, "kibounohikari", "希望の光");
  game.run('handleFlickCompositionStart(); els.flickInput.value = "きぼう"; handleFlickInput({ isComposing: true })');
  assert.equal(game.run("getCurrentEnemy().typed"), "kibou");
  game.run('els.flickInput.value = "きぼうぬ"; handleFlickInput({ isComposing: true })');
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 1);
  assert.equal(game.run("els.player.dataset.chargePose"), "0");
  assert.equal(game.run('els.flickInput.getAttribute("aria-invalid")'), "true");
  game.run('els.flickInput.value = "きぼう"; handleFlickInput({ isComposing: true, inputType: "deleteContentBackward" })');
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 1);
  game.run('els.flickInput.value = "きぼうのひかり"; handleFlickInput({ isComposing: true })');
  assert.equal(game.run("getCurrentEnemy().hp"), 17);
  assert.equal(game.run('els.player.classList.contains("is-perfect-release")'), false);
  game.run('handleFlickCompositionEnd(); els.flickInput.value = "きぼうのひかり"; handleFlickInput({ isComposing: false })');
  game.advance(0);
  assert.equal(game.run("getCurrentEnemy().hp"), 17);
  assert.equal(game.run("state.combo"), 1);
});

test("fast correction before timers run cannot hide a miss and backspacing an invalid suffix adds no penalty", () => {
  const game = battle("greatsword");
  prompt(game, "kibounohikari", "希望の光");
  game.run('handleFlickCompositionStart(); els.flickInput.value = "きぬあ"; handleFlickInput({ isComposing: true })');
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 1);
  game.run('els.flickInput.value = "きぬ"; handleFlickInput({ isComposing: true }); els.flickInput.value = "き"; handleFlickInput({ isComposing: true })');
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 1);
  game.run('els.flickInput.value = "きぬ"; handleFlickInput({ isComposing: true })');
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 2);
});

test("kana boundaries highlight immediately and pending modifiers must be fixed before the next kana", () => {
  const game = battle("greatsword");
  prompt(game, "gyuunyuu", "牛乳");
  game.run('handleFlickCompositionStart(); els.flickInput.value = "ぎ"; handleFlickInput({ isComposing: true })');
  assert.equal(game.run("els.typedWord.textContent"), "ぎ");
  game.run('els.flickInput.value = "ぎゆ"; handleFlickInput({ isComposing: true })');
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 0);
  assert.equal(game.run("els.typedWord.textContent"), "ぎ");
  game.run('els.flickInput.value = "ぎゆう"; handleFlickInput({ isComposing: true })');
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 1);
});

test("committing an unfinished modifier counts one miss", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run('handleFlickCompositionStart(); els.flickInput.value = "か"; handleFlickInput({ isComposing: true })');
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 0);
  game.run("handleFlickCompositionEnd()");
  game.advance(0);
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 1);
  game.run('handleFlickInput({ isComposing: false })');
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 1);
});

test("consecutive composing answers need no Enter and old commits cannot hit the next prompt", () => {
  const game = createGame({}, { touch: true });
  game.run("startGame(); advanceStory(); let answer");
  for (let hit = 1; hit <= 2; hit++) {
    game.run('answer = getFlickReading(getCurrentEnemy()).reading; handleFlickCompositionStart(); els.flickInput.value = answer; handleFlickInput({ isComposing: true })');
    assert.equal(game.run("getCurrentEnemy().tutorial.punches"), hit);
    game.advance(480);
    game.run('els.flickInput.value = answer; handleFlickCompositionEnd(); els.flickInput.value = answer; handleFlickInput({ isComposing: false })');
    game.advance(0);
    assert.equal(game.run("getCurrentEnemy().tutorial.punches"), hit);
    assert.equal(game.run("els.flickInput.value"), "");
    assert.equal(game.run("document.activeElement === els.flickInput"), true);
  }
  game.run('handleFlickCompositionStart(); els.flickInput.value = getFlickReading(getCurrentEnemy()).reading; handleFlickInput({ isComposing: true })');
  assert.equal(game.run("getCurrentEnemy().tutorial.punches"), 3);
});

test("Enter and line breaks are prevented even during composition without changing focus or editability", () => {
  const game = battle("greatsword");
  prompt(game, "kibounohikari", "希望の光");
  game.run('handleFlickCompositionStart(); els.flickInput.value = "きぼう"; handleFlickInput({ isComposing: true }); let prevented = 0; const editor = els.flickInput');
  for (const event of [
    '{ key: "Enter", isComposing: true, keyCode: 229, preventDefault() { prevented++; } }',
    '{ key: "Enter", isComposing: false, preventDefault() { prevented++; } }',
  ]) game.run("handleFlickKeydown(" + event + ")");
  for (const inputType of ["insertLineBreak", "insertParagraph"]) {
    game.run('handleFlickBeforeInput({ inputType: "' + inputType + '", isComposing: true, cancelable: true, preventDefault() { prevented++; } })');
  }
  assert.equal(game.run("prevented"), 4);
  assert.equal(game.run("getCurrentEnemy().typed"), "kibou");
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 0);
  assert.equal(game.run("editor === els.flickInput && document.activeElement === editor && !editor.readOnly"), true);
});

test("a completed word restored by the IME after its input event is cleared before the next prompt", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run('handleFlickCompositionStart(); els.flickInput.value = "がっこう"; handleFlickInput({ isComposing: true }); els.flickInput.value = "がっこう"');
  game.advance(0);
  assert.equal(game.run("els.flickInput.value"), "");
  assert.equal(game.run("flickState.composing"), false);
  game.advance(220);
  game.run('handleFlickCompositionStart(); els.flickInput.value = getFlickReading(getCurrentEnemy()).reading; handleFlickInput({ isComposing: true })');
  assert.equal(game.run("state.combo"), 2);
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 0);
  assert.equal(game.run("els.flickInput.value"), "");
});

test("a delayed insertFromComposition never restores or judges the previous answer", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run('handleFlickCompositionStart(); els.flickInput.value = "がっこう"; handleFlickInput({ isComposing: true }); handleFlickCompositionEnd()');
  game.advance(220);
  game.run('els.flickInput.value = "がっこう"; handleFlickInput({ isComposing: false, inputType: "insertFromComposition", data: "がっこう" })');
  assert.equal(game.run("els.flickInput.value"), "");
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 0);
  assert.equal(game.run("state.combo"), 1);
});

test("an old answer reinserted before the next edit is removed without eating the new kana", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run('handleFlickCompositionStart(); els.flickInput.value = "がっこう"; handleFlickInput({ isComposing: true })');
  game.advance(220);
  game.run('target.word = target.matchedWord = "kibounohikari"; target.inputs = ["kibounohikari"]; target.translation = "希望の光"; target.inputRevision++; renderWord()');
  game.run('els.flickInput.value = "がっこう"; handleFlickCompositionStart(); handleFlickBeforeInput({ inputType: "insertCompositionText", isComposing: true, data: "がっこうき" }); els.flickInput.value = "がっこうき"; handleFlickInput({ isComposing: true, inputType: "insertCompositionText", data: "がっこうき" })');
  assert.equal(game.run("els.flickInput.value"), "き");
  assert.equal(game.run("target.typed"), "ki");
  assert.equal(game.run("target.typingMisses"), 0);
});

test("repeated answers still count after a complete input reset", () => {
  const game = createGame({}, { touch: true });
  game.run("wordSets.unarmed.splice(1)");
  game.run('startGame(); advanceStory(); handleFlickCompositionStart(); els.flickInput.value = "あ"; handleFlickInput({ isComposing: true })');
  game.advance(480);
  game.run('handleFlickCompositionStart(); els.flickInput.value = "あ"; handleFlickInput({ isComposing: true })');
  game.advance(0);
  assert.equal(game.run("getCurrentEnemy().tutorial.punches"), 2);
  assert.equal(game.run("els.flickInput.value"), "");
  assert.equal(game.run("document.activeElement === els.flickInput"), true);
});

test("a new composition cancels old deferred cleanup without losing its prefix", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run('handleFlickCompositionStart(); els.flickInput.value = "がっこう"; handleFlickInput({ isComposing: true }); target.resolving = false; target.word = target.matchedWord = "kibounohikari"; target.inputs = ["kibounohikari"]; target.translation = "希望の光"; target.typed = ""; target.inputRevision++; renderWord(); handleFlickCompositionStart(); els.flickInput.value = "き"; handleFlickInput({ isComposing: true })');
  game.advance(0);
  assert.equal(game.run("els.flickInput.value"), "き");
  assert.equal(game.run("target.typed"), "ki");
  assert.equal(game.run("flickState.composing"), true);
});

test("a late old commit preserves the prefix already entered for the new prompt", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run('handleFlickCompositionStart(); els.flickInput.value = "がっこう"; handleFlickInput({ isComposing: true })');
  game.advance(220);
  game.run('target.word = target.matchedWord = "kibounohikari"; target.inputs = ["kibounohikari"]; target.translation = "希望の光"; target.inputRevision++; renderWord(); els.flickInput.value = "き"; handleFlickInput({ isComposing: false }); els.flickInput.value = "がっこう"; handleFlickInput({ inputType: "insertFromComposition", isComposing: false })');
  assert.equal(game.run("els.flickInput.value"), "き");
  assert.equal(game.run("target.typed"), "ki");
  assert.equal(game.run("target.typingMisses"), 0);
});

test("duplicate input after an answer still resets the composition session", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run('handleFlickCompositionStart(); els.flickInput.value = "がっこう"; handleFlickInput({ isComposing: true }); els.flickInput.value = "がっこう"; handleFlickInput({ isComposing: true }); els.flickInput.value = "がっこう"');
  game.advance(0);
  assert.equal(game.run("els.flickInput.value"), "");
  assert.equal(game.run("flickState.composing"), false);
  assert.equal(game.run("state.combo"), 1);
});

function nextFlickPrompt(game, roman, translation) {
  game.advance(220);
  game.run("target.word = target.matchedWord = " + JSON.stringify(roman)
    + "; target.inputs = [" + JSON.stringify(roman) + "]; target.translation = " + JSON.stringify(translation)
    + "; target.readingOverride = ''; target.inputRevision++; renderWord()");
}

test("Safari can restore the previous composition together with the first new kana", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run('handleFlickCompositionStart(); els.flickInput.value = "がっこう"; handleFlickInput({ isComposing: true, inputType: "insertCompositionText", data: "がっこう" })');
  nextFlickPrompt(game, "kibounohikari", "希望の光");
  game.run('handleFlickBeforeInput({ inputType: "insertCompositionText", isComposing: true, data: "がっこうき" }); els.flickInput.value = "がっこうき"; handleFlickInput({ isComposing: true, inputType: "insertCompositionText", data: "がっこうき" })');
  assert.equal(game.run("els.flickInput.value"), "き");
  assert.equal(game.run("target.typed"), "ki");
  assert.equal(game.run("target.typingMisses"), 0);
  assert.equal(game.run("document.activeElement === els.flickInput"), true);
  game.run('els.flickInput.value = "がっこうきぼうのひかり"; handleFlickInput({ isComposing: true, inputType: "insertCompositionText", data: "がっこうきぼうのひかり" })');
  assert.equal(game.run("state.combo"), 2);
  assert.equal(game.run("els.flickInput.value"), "");
  nextFlickPrompt(game, "neko", "猫");
  game.run('els.flickInput.value = "がっこうきぼうのひかりね"; handleFlickInput({ isComposing: true, inputType: "insertCompositionText", data: "がっこうきぼうのひかりね" })');
  assert.equal(game.run("els.flickInput.value"), "ね");
  assert.equal(game.run("target.typed"), "ne");
  assert.equal(game.run("target.typingMisses"), 0);
});

test("a retained prefix in a plain input event is removed while its new character is kept", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  input(game, "がっこう");
  nextFlickPrompt(game, "kibounohikari", "希望の光");
  game.run('handleFlickBeforeInput({inputType:"insertText", data:"き"}); els.flickInput.value="がっこうき"; handleFlickInput({inputType:"insertText", data:"き"})');
  assert.equal(game.run("els.flickInput.value"), "き");
  assert.equal(game.run("target.typed"), "ki");
  assert.equal(game.run("target.typingMisses"), 0);
});

test("late plain and converted commits restore neither the old word nor a typing penalty", () => {
  for (const [inputType, value] of [["insertText", "がっこう"], ["insertReplacementText", "学校"], ["insertCompositionText", "がっこう"]]) {
    const game = battle("greatsword");
    prompt(game, "gakkou", "学校");
    input(game, "がっこう");
    nextFlickPrompt(game, "kibounohikari", "希望の光");
    input(game, "き");
    game.run("els.flickInput.value = " + JSON.stringify(value) + "; handleFlickInput({ inputType:" + JSON.stringify(inputType) + ", data:" + JSON.stringify(value) + " })");
    assert.equal(game.run("els.flickInput.value"), "き");
    assert.equal(game.run("target.typed"), "ki");
    assert.equal(game.run("target.typingMisses"), 0);
  }
});

test("a late old compositionend does not erase letters already entered for the next word", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run('handleFlickCompositionStart(); els.flickInput.value="がっこう"; handleFlickInput({isComposing:true})');
  nextFlickPrompt(game, "kibounohikari", "希望の光");
  input(game, "き");
  game.run('els.flickInput.value="がっこう"; handleFlickCompositionEnd({data:"がっこう"})');
  game.advance(0);
  assert.equal(game.run("els.flickInput.value"), "き");
  assert.equal(game.run("target.typingMisses"), 0);
});

test("new compositions sharing the previous answer's prefix keep every new character", () => {
  const game = battle("greatsword");
  prompt(game, "ka", "蚊");
  game.run('handleFlickCompositionStart(); els.flickInput.value="か"; handleFlickInput({isComposing:true})');
  nextFlickPrompt(game, "kani", "蟹");
  game.run('handleFlickCompositionStart(); handleFlickBeforeInput({inputType:"insertCompositionText", isComposing:true, data:"か"}); els.flickInput.value="か"; handleFlickInput({inputType:"insertCompositionText", isComposing:true, data:"か"})');
  assert.equal(game.run("els.flickInput.value"), "か");
  assert.equal(game.run("target.typed"), "ka");
  game.run('els.flickInput.value="かに"; handleFlickInput({inputType:"insertCompositionText", isComposing:true, data:"かに"})');
  assert.equal(game.run("state.combo"), 2);
});

test("a genuinely wrong kana after a restored prefix is still counted and deletion cannot undo it", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run('handleFlickCompositionStart(); els.flickInput.value="がっこう"; handleFlickInput({isComposing:true})');
  nextFlickPrompt(game, "kibounohikari", "希望の光");
  game.run('els.flickInput.value="がっこうぬ"; handleFlickInput({inputType:"insertCompositionText", isComposing:true, data:"がっこうぬ"})');
  assert.equal(game.run("els.flickInput.value"), "ぬ");
  assert.equal(game.run("target.typingMisses"), 1);
  game.run('let assertRemoved; els.flickInput.value="がっこう"; handleFlickInput({inputType:"deleteContentBackward", isComposing:true}); assertRemoved = els.flickInput.value; els.flickInput.value="がっこうき"; handleFlickInput({inputType:"insertCompositionText", isComposing:true})');
  assert.equal(game.run("assertRemoved"), "");
  assert.equal(game.run("target.typingMisses"), 1);
  assert.equal(game.run("target.typed"), "ki");
});

test("a Safari composition restart can still carry the old text in its first update", () => {
  const game=battle("greatsword");
  prompt(game,"gakkou","学校");
  input(game,"がっこう");
  nextFlickPrompt(game,"kibounohikari","希望の光");
  game.run('handleFlickCompositionStart(); handleFlickBeforeInput({inputType:"insertCompositionText",data:"がっこうき"}); els.flickInput.value="がっこうき"; handleFlickInput({isComposing:true,inputType:"insertCompositionText",data:"がっこうき"})');
  assert.equal(game.run("els.flickInput.value"),"き");
  assert.equal(game.run("target.typingMisses"),0);
});

test("late plain commits cannot erase an active new composition but real fresh mistakes are kept", () => {
  const game=battle("greatsword");
  prompt(game,"gakkou","学校");
  input(game,"がっこう");
  nextFlickPrompt(game,"kibounohikari","希望の光");
  game.run('handleFlickCompositionStart(); els.flickInput.value="き"; handleFlickInput({isComposing:true,inputType:"insertCompositionText",data:"き"}); els.flickInput.value="がっこう"; handleFlickInput({isComposing:false,inputType:"insertText",data:"がっこう"})');
  assert.equal(game.run("els.flickInput.value"),"き");
  assert.equal(game.run("target.typingMisses"),0);
  game.run('handleFlickBeforeInput({inputType:"insertText",data:"ぬ"}); els.flickInput.value="きぬ"; handleFlickInput({inputType:"insertText",data:"ぬ"})');
  assert.equal(game.run("target.typingMisses"),1);
});

test("successive identical prompts accept new kana from a continuing native composition", () => {
  const game=createGame({}, {touch:true});
  game.run("wordSets.unarmed.splice(1)");
  game.run("startGame(); advanceStory()");
  for(let hit=1;hit<=3;hit++) {
    const raw="あ".repeat(hit);
    game.run("handleFlickBeforeInput({inputType:'insertCompositionText',isComposing:true,data:"+JSON.stringify(raw)+"}); els.flickInput.value="+JSON.stringify(raw)+"; handleFlickInput({inputType:'insertCompositionText',isComposing:true,data:"+JSON.stringify(raw)+"})");
    assert.equal(game.run("getCurrentEnemy().tutorial.punches"),hit);
    assert.equal(game.run("els.flickInput.value"),"");
    assert.equal(game.run("document.activeElement === els.flickInput"),true);
    game.advance(480);
  }
});

test("a completed native composition retires its editor before the keyboard can restore marked text", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run(`
    const oldEditor = els.flickInput;
    let connectedDuringFocus = false;
    oldEditor.isConnected = true;
    oldEditor.addEventListener("blur", () => {
      connectedDuringFocus = oldEditor.isConnected;
      oldEditor.value = "学校";
      oldEditor.dispatchEvent({ type: "compositionend", data: "学校" });
      oldEditor.dispatchEvent({ type: "input", inputType: "insertFromComposition", data: "学校" });
    });
    oldEditor.dispatchEvent({ type: "compositionstart" });
    oldEditor.value = "か";
    oldEditor.dispatchEvent({ type: "input", isComposing: true, inputType: "insertCompositionText" });
  `);
  assert.equal(game.run("els.flickInput === oldEditor"), true);
  assert.equal(game.run("target.typingMisses"), 0);
  game.run(`
    oldEditor.value = "がっこう";
    oldEditor.dispatchEvent({ type: "input", isComposing: true, inputType: "insertCompositionText" });
    // Simulate a native keyboard restoring text after the input callback returns.
    oldEditor.value = "がっこう";
  `);
  assert.equal(game.run("els.flickInput === oldEditor"), false);
  assert.equal(game.run("connectedDuringFocus"), true);
  assert.equal(game.run("oldEditor.isConnected"), false);
  assert.equal(game.run("document.activeElement === els.flickInput"), true);
  assert.equal(game.run("els.flickInput.value"), "");
  assert.equal(game.run("flickState.composing"), false);
  assert.equal(game.run("state.combo"), 1);
  game.advance(220);
  assert.equal(game.run("els.flickInput.value"), "");
  assert.equal(game.run("target.typingMisses"), 0);
});

test("events from a retired editor cannot change the next word or erase a new prefix", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run("const oldEditor = els.flickInput");
  input(game, "がっこう");
  nextFlickPrompt(game, "kibounohikari", "希望の光");
  game.run(`
    els.flickInput.dispatchEvent({ type: "compositionstart" });
    els.flickInput.value = "き";
    els.flickInput.dispatchEvent({ type: "input", isComposing: true, inputType: "insertCompositionText" });
    const version = flickState.inputVersion;
    oldEditor.value = "無関係な古い変換候補";
    for (const type of ["compositionstart", "beforeinput", "input", "compositionend", "keydown"]) {
      oldEditor.dispatchEvent({ type, inputType: "insertText", data: oldEditor.value, key: "Enter",
        preventDefault() { throw new Error("A retired editor handled Enter"); } });
    }
  `);
  game.advance(0);
  assert.equal(game.run("flickState.inputVersion === version"), true);
  assert.equal(game.run("flickState.composing"), true);
  assert.equal(game.run("els.flickInput.value"), "き");
  assert.equal(game.run("target.typed"), "ki");
  assert.equal(game.run("target.typingMisses"), 0);
  game.run(`
    els.flickInput.value = "きぼうのひかり";
    els.flickInput.dispatchEvent({ type: "input", isComposing: true, inputType: "insertCompositionText" });
  `);
  assert.equal(game.run("state.combo"), 2);
  assert.equal(game.run("els.flickInput.value"), "");
});

test("fresh editors accept identical consecutive answers through native event listeners", () => {
  const game = createGame({}, { touch: true });
  game.run("wordSets.unarmed.splice(1); startGame(); advanceStory(); const editors = new Set()");
  for (let hit = 1; hit <= 3; hit++) {
    game.run(`
      editors.add(els.flickInput);
      els.flickInput.dispatchEvent({ type: "compositionstart" });
      els.flickInput.value = "あ";
      els.flickInput.dispatchEvent({ type: "input", isComposing: true, inputType: "insertCompositionText" });
    `);
    assert.equal(game.run("getCurrentEnemy().tutorial.punches"), hit);
    assert.equal(game.run("els.flickInput.value"), "");
    assert.equal(game.run("document.activeElement === els.flickInput"), true);
    game.advance(480);
  }
  assert.equal(game.run("editors.size"), 3);
});

test("finishing queued input does not take focus back after the player dismisses the keyboard", () => {
  const game = battle("greatsword");
  prompt(game, "gakkou", "学校");
  game.run(`
    els.flickInput.dispatchEvent({ type: "compositionstart" });
    els.flickInput.value = "学校";
    els.flickInput.dispatchEvent({ type: "compositionend", data: "学校" });
    document.body.focus();
  `);
  game.advance(220);
  assert.equal(game.run("state.combo"), 1);
  assert.equal(game.run("els.flickInput.value"), "");
  assert.equal(game.run("document.activeElement === document.body"), true);
});
