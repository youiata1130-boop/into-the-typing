import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

function swimmingGame(reducedMotion = false) {
  const game = createGame();
  game.run(`
    window.matchMedia = query => ({ matches: query === "(prefers-reduced-motion: reduce)" && ${reducedMotion} });
    window.swimIntervals = new Map();
    let swimTimer = 10000;
    window.setInterval = (callback, delay) => {
      const id = swimTimer++;
      window.swimIntervals.set(id, { callback, delay });
      return id;
    };
    window.clearInterval = id => window.swimIntervals.delete(id);
    startGame(); advanceStory();
  `);
  return game;
}

test("swimming loops through all 16 frames and does not restart while resting", () => {
  const game = swimmingGame();
  const timer = game.run("getCurrentEnemy().frameTimerId");
  assert.equal(game.run("window.swimIntervals.get(getCurrentEnemy().frameTimerId).delay"), 70);
  const first = game.run("getCurrentEnemy().image.src");
  const frames = new Set([first]);
  for (let step = 1; step <= 16; step++) {
    game.run("window.swimIntervals.get(getCurrentEnemy().frameTimerId).callback()");
    frames.add(game.run("getCurrentEnemy().image.src"));
    game.run("stopEnemyWalkingAnimation(getCurrentEnemy())");
    assert.equal(game.run("getCurrentEnemy().frameTimerId"), timer);
  }
  assert.equal(frames.size, 16);
  assert.equal(game.run("getCurrentEnemy().image.src"), first);
  assert.equal(game.run("window.swimIntervals.size"), 1);
});

test("damage and enemy attacks return to swimming without leaking frame timers", () => {
  const game = swimmingGame();
  game.run("damageEnemy(getCurrentEnemy())");
  assert.equal(game.run("getCurrentEnemy().animation"), "damage");
  assert.equal(game.run("window.swimIntervals.size"), 0);
  game.advance(220);
  assert.equal(game.run("getCurrentEnemy().animation"), "idle");
  assert.equal(game.run("window.swimIntervals.size"), 1);
  game.run("enemyAttack(getCurrentEnemy())");
  assert.equal(game.run("getCurrentEnemy().animation"), "attack");
  assert.equal(game.run("window.swimIntervals.size"), 0);
  game.advance(360);
  assert.equal(game.run("getCurrentEnemy().animation"), "idle");
  assert.equal(game.run("window.swimIntervals.size"), 1);
});

test("dialogue and ending a battle stop swimming; equipping the branch resumes it", () => {
  const game = swimmingGame();
  game.run('showStoryDialogue("weapon-offer")');
  assert.equal(game.run("window.swimIntervals.size"), 0);
  game.run("advanceStory()");
  assert.equal(game.run("window.swimIntervals.size"), 1);
  game.run("finishGame(false)");
  assert.equal(game.run("window.swimIntervals.size"), 0);
});

test("reduced motion keeps a still fish even when attacks finish", () => {
  const game = swimmingGame(true);
  assert.equal(game.run("window.swimIntervals.size"), 0);
  const frame = game.run("getCurrentEnemy().image.src");
  game.run("enemyAttack(getCurrentEnemy())");
  game.advance(360);
  game.run("stopEnemyWalkingAnimation(getCurrentEnemy())");
  assert.equal(game.run("window.swimIntervals.size"), 0);
  assert.equal(game.run("getCurrentEnemy().image.src"), frame);
});

test("walking enemies retain their original frame speed and stop at rest", () => {
  const game = swimmingGame();
  game.run('clearEnemyAnimationTimers(); getCurrentEnemy().type = "chick_level_1"; playEnemyAnimation(getCurrentEnemy(), "idle")');
  assert.equal(game.run("window.swimIntervals.get(getCurrentEnemy().frameTimerId).delay"), 140);
  game.run("stopEnemyWalkingAnimation(getCurrentEnemy())");
  assert.equal(game.run("window.swimIntervals.size"), 0);
  assert.equal(game.run("getCurrentEnemy().frameIndex"), 0);
});
