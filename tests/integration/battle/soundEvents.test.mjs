import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function battle(weaponId = "sword") {
  const game = createGame({ "into-the-typing.player.v2": JSON.stringify({
    version: 2, totalExperience: 255, stats: { attack: 2, agility: 1 }, weaponId,
    introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true,
    greatswordObtained: true, skillTutorialCompleted: true,
    clearedStages: ["forest_path", "mist_road", "sky_castle", "storm_cove"],
  }) });
  game.run(`
    const sounds = [];
    window.GAME_SOUND.play = name => sounds.push(name);
    startGame("grassland_path");
    const target = getCurrentEnemy();
    target.hp = target.maxHp = 100;
  `);
  game.advance(game.run("startNoticeMs"));
  return game;
}

test("completed words use slashes for swords and impacts for the branch", () => {
  for (const [weapon, sound] of [["sword", "attack"], ["greatsword", "heavy"], ["branch", "impact"]]) {
    const game = battle(weapon);
    game.run("applyTypedValue(target, target.matchedWord)");
    assert.deepEqual(game.snapshot("sounds"), [sound]);
    game.run("damageEnemy(target)");
    assert.deepEqual(game.snapshot("sounds"), [sound]);
  }
});

test("a mistype and incoming damage each trigger their own feedback once", () => {
  const game = battle();
  game.run('applyTypedValue(target, "x".repeat(50)); setEnemyProgress(target, 1); enemyAttack(target); enemyAttack(target)');
  assert.deepEqual(game.snapshot("sounds"), ["miss", "hurt"]);
});

test("defeat sound is played once after the killing slash", () => {
  const game = battle();
  game.run("target.hp = 1; applyTypedValue(target, target.matchedWord)");
  assert.deepEqual(game.snapshot("sounds"), ["attack"]);
  game.advance(220);
  assert.deepEqual(game.snapshot("sounds"), ["attack", "defeat"]);
  game.run("defeatEnemy(target)");
  assert.deepEqual(game.snapshot("sounds"), ["attack", "defeat"]);
});
