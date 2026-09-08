import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

test("bosses use the normal word pool for every weapon, stage, and agility setting", () => {
  const game = createGame({
    "into-the-typing.player.v2": JSON.stringify({
      version: 2, totalExperience: 0, stats: { attack: 1, agility: 1 },
      weaponId: "sword", introCompleted: true,
    }),
  });
  game.run("startGame()");
  game.advance(850);
  game.run(`
    const originalChooseWord = chooseWord;
    let requestedRange;
    chooseWord = options => {
      requestedRange = { min: options.minLength, max: options.maxLength };
      return originalChooseWord(options);
    };
    Math.random = () => 0.5;
  `);
  for (const stage of ["forest_path", "mist_road", "sky_castle"]) {
    for (const [weapon, baseMin, baseMax] of [
      ["branch", 2, 3],
      ["sword", stage === "mist_road" ? 9 : 2, stage === "mist_road" ? 17 : 8],
      ["greatsword", 12, 20],
    ]) {
      for (const agility of [1, 4, 9]) {
        const reduction = agility - 1;
        const expected = { min: Math.max(2, baseMin - reduction), max: Math.max(weapon === "branch" ? 2 : 4, baseMax - reduction) };
        const selected = [];
        for (const boss of [false, true]) {
          game.run("state.stageId = " + JSON.stringify(stage) + "; state.stats.agility = " + agility
            + "; getCurrentEnemy().weaponId = " + JSON.stringify(weapon) + "; getCurrentEnemy().boss = " + boss
            + "; state.usedWords = []; setNextWord(getCurrentEnemy());");
          assert.deepEqual(game.snapshot("requestedRange"), expected, [stage, weapon, agility, boss].join("/"));
          selected.push(game.run("getCurrentEnemy().word"));
        }
        assert.equal(selected[0], selected[1]);
      }
    }
  }
});

test("the status panel shows one word-length range shared by normal and boss battles", () => {
  const game = createGame();
  for (const [weapon, text] of [["branch", "2〜3文字"], ["sword", "2〜8文字"], ["greatsword", "12〜20文字"]]) {
    game.run("state.weaponId = " + JSON.stringify(weapon) + "; updateStatusPanel()");
    assert.equal(game.run("els.statusWordLengthText.textContent"), text);
  }
});
