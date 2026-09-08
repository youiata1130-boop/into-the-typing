import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

test("battle layout preserves full-size characters by using empty space first", () => {
  const game = createGame();
  const roomy = game.snapshot("calculateBattleLayout(318, 480, 54)");
  assert.equal(roomy.playerHeight, 177);
  assert.equal(roomy.playerBottom, 32);
  assert.equal(roomy.enemyHeight, 106);
  const tighter = game.snapshot("calculateBattleLayout(318, 270, 54)");
  assert.equal(tighter.playerHeight, 177);
  assert.equal(tighter.playerBottom, 15);
  assert.equal(tighter.enemyHeight, 106);
});

test("small visible battle areas fit both whole images and HP without reversing enemy travel", () => {
  const game = createGame();
  for (const width of [278, 318, 358, 388, 810]) {
    for (const height of [150, 190, 240, 400]) {
      const l = game.snapshot("calculateBattleLayout(" + width + ", " + height + ", 54)");
      assert.ok(height - l.playerBottom - l.playerHeight - 18 >= 60 - 0.01);
      assert.ok(height - l.enemyBottom - l.enemyHeight - 18 >= 8 - 0.01);
      assert.ok(l.playerBottom >= 8 && l.enemyBottom >= 8);
      assert.ok(l.playerWidth <= 129 && l.enemyHeight <= 106);
      assert.ok(l.enemyFar + l.enemyWidth <= width - 8 + 0.01);
      assert.ok(l.enemyFar - l.enemyTravel >= 8 + l.playerWidth + 20 - 0.01);
      assert.ok(l.enemyTravel >= 0);
    }
  }
});

test("viewport open, offset, rotation and close events update layout without focusing the input", () => {
  const game = createGame({}, { touch: true });
  game.run("document.activeElement = document.body; window.innerHeight = 740; window.innerWidth = 360; window.visualViewport = { width: 360, height: 740, offsetTop: 0, offsetLeft: 0, scale: 1 }; updateBattleViewport()");
  assert.equal(game.run("document.documentElement.dataset.compactBattle"), "false");
  game.run("window.visualViewport.height = 310; window.visualViewport.offsetTop = 20; updateBattleViewport()");
  assert.equal(game.run("document.documentElement.dataset.keyboardOpen"), "true");
  game.run("window.innerWidth = 740; window.innerHeight = 360; window.visualViewport.width = 740; window.visualViewport.height = 200; updateBattleViewport()");
  assert.equal(game.run("document.documentElement.dataset.compactBattle"), "true");
  game.run("window.innerWidth = 360; window.innerHeight = 740; window.visualViewport.width = 360; window.visualViewport.height = 740; updateBattleViewport()");
  assert.equal(game.run("document.documentElement.dataset.keyboardOpen"), "false");
  assert.equal(game.run("document.documentElement.dataset.compactBattle"), "false");
  assert.equal(game.run("document.activeElement === document.body"), true);
});
