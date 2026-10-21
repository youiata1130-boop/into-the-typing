import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function battle(touch = false) {
  const game = createGame({ "into-the-typing.player.v2": JSON.stringify({
    version: 2, totalExperience: 255, stats: { attack: 2, agility: 1 }, weaponId: "greatsword",
    introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true,
    greatswordObtained: true, skillTutorialCompleted: true,
    clearedStages: ["forest_path", "mist_road", "sky_castle", "storm_cove"],
  }) }, { touch });
  game.run(`
    startGame("grassland_path");
    const target = getCurrentEnemy();
    target.hp = target.maxHp = 100;
    target.word = target.matchedWord = "kibounohikari".repeat(4);
    target.inputs = [target.word]; target.translation = "希望の光";
    target.readingOverride = ""; target.inputRevision++;
    renderWord();
    const type = key => handleTypingKeydown({ key, code: "", preventDefault() {} });
  `);
  game.advance(850);
  return game;
}

test("each letter of a long answer highlights and charges gauges before timers or frames run", () => {
  const game = battle();
  const word = game.run("target.word");
  for (let length = 1; length <= 30; length++) {
    game.run(`type(${JSON.stringify(word[length - 1])})`);
    assert.equal(game.run("els.typedWord.textContent"), word.slice(0, length));
    assert.equal(game.run("els.remainingWord.textContent"), word.slice(length));
    assert.equal(game.run("state.inputBuffer.length"), 0);
    assert.equal(game.run('els.skillGauge.getAttribute("aria-valuenow")'), String(Math.min(100, length * 4)));
    assert.equal(game.run('els.weaponChargeMeter.getAttribute("aria-valuenow")'), String(Math.round(length / word.length * 1000) / 10));
  }
  assert.equal(game.run("els.specialButton.disabled"), false);
  game.run('type("Backspace")');
  assert.equal(game.run("els.typedWord.textContent"), word.slice(0, 29));
  game.run('type("x")');
  assert.equal(game.run("els.typedWord.textContent"), word.slice(0, 29));
  game.run(`type(${JSON.stringify(word[29])})`);
  assert.equal(game.run("els.typedWord.textContent"), word.slice(0, 30));
  assert.equal(game.run("target.typingMisses"), 1);
  assert.equal(game.run("state.combo"), 0);
  assert.equal(game.run("performance.now()"), 850);
});

test("continuous input avoids forced enemy layout, unrelated panels and duplicate prompt renders", () => {
  const game = battle();
  game.run(`
    let promptRenders = 0;
    const originalRender = renderWord;
    renderWord = () => { promptRenders++; originalRender(); };
    updateStatusPanel = () => { throw new Error("Typing must not rebuild hidden status/equipment controls"); };
    scheduleBattleLayout = () => { throw new Error("Unchanged gauge size must not trigger character layout"); };
    Object.defineProperty(target.element, "offsetWidth", { get() { throw new Error("Typing must not force synchronous layout"); } });
    [...target.word.slice(0, 30)].forEach(type);
  `);
  assert.equal(game.run("promptRenders"), 30);
  assert.equal(game.run("target.element.classList.contains('typing-shake')"), true);
  game.advance(130);
  assert.equal(game.run("target.element.classList.contains('typing-shake')"), false);
  game.run("type(target.word[30])");
  assert.equal(game.run("els.typedWord.textContent"), game.run("target.word.slice(0, 31)"));
  assert.equal(game.run("target.element.classList.contains('typing-shake')"), true);
});

test("long flick input highlights each kana immediately, including voiced-kana completion", () => {
  const game = battle(true);
  let typed = "";
  for (let repeat = 0; repeat < 3; repeat++) {
    for (const [id, direction, kana] of [["ka",1,"き"],["ha",4,"ほ"],["modifier",0,"ぼ"],["a",2,"う"],["na",4,"の"],["ha",1,"ひ"],["ka",0,"か"],["ra",1,"り"]]) {
      game.run(`applyGameFlickKey(${JSON.stringify(id)}, ${direction})`);
      typed = id === "modifier" ? typed.slice(0, -1) + kana : typed + kana;
      assert.equal(game.run("gameFlickUi.output.textContent"), typed);
      const highlighted = kana === "ほ" ? typed.slice(0, -1) : typed;
      assert.equal(game.run("els.typedWord.textContent"), highlighted);
      assert.equal(game.run("getCurrentEnemy().typingMisses"), 0);
    }
  }
  assert.equal(game.run("performance.now()"), 850);
});
