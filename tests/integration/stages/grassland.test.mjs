import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { createGame } from "../../helpers/game.mjs";

const previousStages = ["forest_path", "mist_road", "sky_castle", "storm_cove"];
const saved = (extra = {}) => ({ "into-the-typing.player.v2": JSON.stringify({
  version: 2, totalExperience: 255, stats: { attack: 2, agility: 1 },
  weaponId: "greatsword", introCompleted: true, equipmentTutorialCompleted: true,
  ironSwordObtained: true, greatswordObtained: true, greatswordEquipPending: false,
  skillTutorialCompleted: true, clearedStages: previousStages, ...extra,
}) });

test("grassland 2-1 unlocks only after stage 1-4, including existing saves", () => {
  for (const clearedStages of [[], previousStages.slice(0, 3), undefined]) {
    const game = createGame(saved({ totalExperience: 999, clearedStages }));
    game.run('showStageConfirm("grassland_path"); startGame("grassland_path")');
    assert.equal(game.run("state.running"), false);
    assert.equal(game.run("state.pendingStageId"), "");
  }
  const game = createGame(saved());
  assert.equal(game.run('isStageAvailable("grassland_path")'), true);
  assert.equal(game.run("getHighestAvailableStageCode()"), "2-1");
  game.run('showStageConfirm("grassland_path")');
  assert.equal(game.run("els.stageConfirmName.textContent"), "草原の入口");
  game.run("savePlayerProgress()");
  assert.equal(createGame(game.saved()).run('isStageAvailable("grassland_path")'), true);
  assert.equal(game.run("state.totalExperience"), 255);
});

test("three snakes lead to the Snake King and award 160 EXP once on desktop and touch", () => {
  for (const touch of [false, true]) {
    const game = createGame(saved(), { touch });
    game.run('startGame("grassland_path")');
    assert.equal(game.run("els.arena.dataset.stage"), "grassland_path");
    assert.equal(game.run("state.roundLimit"), 4);
    const seen = new Map();
    for (let tick = 0; tick < 2000 && game.run("state.running"); tick++) {
      const enemy = game.snapshot("getCurrentEnemy() ? {id:getCurrentEnemy().id,type:getCurrentEnemy().type,hp:getCurrentEnemy().maxHp,boss:getCurrentEnemy().boss} : null");
      if (enemy) {
        if (enemy.boss && !seen.has(enemy.id)) {
          assert.equal(game.run("els.bossIntroTitle.textContent"), "蛇の王様");
          assert.equal(game.run('getCurrentEnemy().hpTrack.getAttribute("aria-label")'), "蛇の王様のHP");
        }
        seen.set(enemy.id, enemy);
      }
      if (game.run("Boolean(getInputEnemy())")) {
        assert.equal(game.run("state.totalExperience"), 255);
        game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
      }
      game.advance(100);
    }
    assert.equal(game.run("state.running"), false);
    assert.deepEqual([...seen.values()].map(({ type, hp, boss }) => ({ type, hp, boss })), [
      ...Array.from({ length: 3 }, () => ({ type: "snake_level_1", hp: 14, boss: false })),
      { type: "snake_boss", hp: 32, boss: true },
    ]);
    assert.equal(game.run("state.battleExperience"), 160);
    assert.equal(game.run("state.totalExperience"), 415);
    assert.equal(game.run("els.treasureReward.hidden"), true);
    assert.equal(game.run('isWeaponAvailable("dagger")'), false);
    assert.equal(game.run('isWeaponAvailable("dualBlades")'), false);
    game.run("finishGame(true)");
    assert.equal(game.run("state.totalExperience"), 415);
    assert.deepEqual(game.savedProgress().clearedStages, [...previousStages, "grassland_path"]);
    assert.equal(createGame(game.saved()).run('state.clearedStages.includes("grassland_path")'), true);
    game.run("continueAfterResult()");
    assert.equal(game.run("state.stageId"), "flower_meadow");
    game.run("showStageSelect()");
    assert.equal(game.run("document.documentElement.dataset.screen"), "stage");
  }
});

test("failed or interrupted grassland battles do not save pending rewards", () => {
  for (const action of ["finishGame(false)", "resetGame()", 'startGame("grassland_path")']) {
    const game = createGame(saved());
    game.run('startGame("grassland_path")');
    for (let tick = 0; tick < 100 && game.run("state.cleared === 0"); tick++) {
      if (game.run("Boolean(getInputEnemy())")) game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
      game.advance(100);
    }
    assert.equal(game.run("state.pendingExperience"), 30);
    game.run(action);
    game.advance(1000);
    const reloaded = createGame(game.saved());
    assert.equal(reloaded.run("state.totalExperience"), 255);
    assert.deepEqual(reloaded.snapshot("state.clearedStages"), previousStages);
  }
});

test("snake sprites and grassland background preload and the beach returns on stage change", () => {
  const game = createGame(saved());
  const urls = game.snapshot("collectGameImageSources()");
  for (const type of ["snake_level_1", "snake_boss"]) {
    for (const animation of ["idle", "attack", "damage", "defeat"]) {
      for (const frame of game.snapshot(`getEnemyFrames("${type}", "${animation}")`)) {
        assert.ok(urls.includes(new URL(frame, "https://typing.test/").href));
        const file = new URL("../../../" + frame, import.meta.url);
        file.search = "";
        assert.ok(existsSync(file));
      }
    }
  }
  assert.ok(urls.some(url => url.endsWith("/stages/grassland.webp")));
  assert.ok(existsSync(new URL("../../../src/assets/images/backgrounds/stages/grassland.webp", import.meta.url)));
  game.run('const arenaStyles = {}; els.arena.style.setProperty = (name, value) => { arenaStyles[name] = value; }; startGame("grassland_path")');
  assert.match(game.run('arenaStyles["--stage-background"]'), /grassland\.webp/);
  game.run('startGame("storm_cove")');
  assert.match(game.run('arenaStyles["--stage-background"]'), /crab_shore\.webp/);
});
