import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createGame } from "../../helpers/game.mjs";

const cleared = ["forest_path", "mist_road", "sky_castle", "storm_cove", "grassland_path"];
const progress = extra => ({
  version: 2, totalExperience: 415, stats: { attack: 2, agility: 1 }, weaponId: "sword",
  introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true,
  greatswordObtained: true,
  skillTutorialCompleted: true, clearedStages: cleared, ...extra,
});
const saved = extra => ({ "into-the-typing.player.v2": JSON.stringify(progress(extra)) });
const battle = (extra, touch = false, stage = "flower_meadow") => {
  const game = createGame(saved(extra), { touch });
  game.run(`startGame("${stage}")`);
  return game;
};
const fillWave = game => game.advance(game.run("startNoticeMs + (chooseEnemyWave().maxActive - 1) * chooseEnemyWave().spawnIntervalMs"));

function reachLastBee(game) {
  for (let tick = 0; tick < 1000 && game.run("state.cleared < 11"); tick++) {
    game.run("{ const enemy = getInputEnemy(); if (enemy) applyTypedValue(enemy, enemy.matchedWord); }");
    game.advance(50);
  }
  assert.equal(game.run("state.cleared"), 11);
  game.advance(2000);
  assert.equal(game.run("state.currentWaveSpawned"), 12);
  assert.deepEqual(game.snapshot("state.activeEnemies.map(enemy => enemy.type)"), ["bee_level_1"]);
}

test("2-3 has twelve bees followed by one Queen, and only her defeat saves the clear and 240 EXP", () => {
  for (const touch of [false, true]) {
    const game = battle({ weaponId: "dualBlades", totalExperience: 515, clearedStages: [...cleared, "flower_meadow"] }, touch, "swarm_meadow");
    assert.equal(game.run("state.roundLimit"), 13);
    reachLastBee(game);
    assert.equal(game.run("state.running"), true);
    game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
    game.advance(110 + 619);
    assert.equal(game.run("state.cleared"), 12);
    assert.equal(game.run("state.currentWaveIndex"), 0);
    game.advance(1 + 259);
    assert.equal(game.run("state.activeEnemies.length"), 0);
    game.advance(1);
    assert.deepEqual(game.snapshot("state.activeEnemies.map(enemy => ({ type: enemy.type, boss: enemy.boss, hp: enemy.hp }))"), [{ type: "bee_boss", boss: true, hp: 12 }]);
    assert.equal(game.run("els.bossIntroTitle.textContent"), "蜂の女王");
    assert.equal(game.run("getCurrentEnemy().hpTrack.getAttribute('aria-label')"), "蜂の女王のHP");
    assert.equal(game.run("state.pendingExperience"), 120);
    assert.equal(game.savedProgress().totalExperience, 515);
    assert.equal(game.run("state.running"), true);
    game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
    assert.equal(game.run("getCurrentEnemy().hp"), 11);
    for (let tick = 0; tick < 200 && game.run("state.running"); tick++) {
      game.run("{ const enemy = getInputEnemy(); if (enemy) applyTypedValue(enemy, enemy.matchedWord); }");
      game.advance(50);
    }
    assert.equal(game.run("state.running"), false);
    assert.equal(game.run("state.cleared"), 13);
    assert.equal(game.run("state.battleExperience"), 240);
    assert.equal(game.savedProgress().totalExperience, 755);
    assert.deepEqual(game.savedProgress().clearedStages, [...cleared, "flower_meadow", "swarm_meadow"]);
    game.run("finishGame(true)");
    assert.equal(game.savedProgress().totalExperience, 755);
  }
});

test("leaving before the Queen appears cancels her spawn and does not award a clear", () => {
  const game = battle({ weaponId: "dualBlades", totalExperience: 515, clearedStages: [...cleared, "flower_meadow"] }, false, "swarm_meadow");
  reachLastBee(game);
  game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
  game.advance(110 + 620);
  game.run("showStageSelect()");
  game.advance(1000);
  assert.equal(game.run("state.activeEnemies.length"), 0);
  assert.equal(game.savedProgress().totalExperience, 515);
  assert.deepEqual(game.savedProgress().clearedStages, [...cleared, "flower_meadow"]);
});

test("2-2 unlocks from 2-1, but dual blades are only granted for a saved 2-2 clear", () => {
  const locked = createGame(saved({ clearedStages: cleared.slice(0, 4), daggerObtained: false, weaponId: "greatsword" }));
  locked.run('startGame("flower_meadow"); selectWeapon("dagger")');
  assert.equal(locked.run("state.running"), false);
  assert.equal(locked.run("state.weaponId"), "greatsword");
  const game = createGame(saved({ clearedStages: [...cleared, "flower_meadow"], weaponId: "greatsword" }));
  assert.equal(game.run('isWeaponAvailable("dualBlades")'), true);
  game.run("showWeaponScreen()");
  assert.equal(game.run("state.weaponEquipGuideId"), "dualBlades");
  assert.equal(game.run("document.activeElement === els.weaponDualBlades"), true);
  assert.equal(game.run("els.weaponEquipNext.textContent"), "ステージ2-3へ");
  game.run('selectWeapon("dualBlades"); continueAfterWeaponEquip()');
  assert.equal(game.run("state.stageId"), "swarm_meadow");
  assert.equal(game.savedProgress().dualBladesEquipPending, false);
  const reloaded = createGame(game.saved());
  assert.equal(reloaded.run("state.weaponId"), "dualBlades");
  assert.equal(reloaded.run("state.totalExperience"), 415);
  reloaded.run('activatePlayerSave(1, saveSlots.write(1, "新しい冒険", playerProgressSnapshot(loadPlayerProgress()), null))');
  assert.equal(reloaded.run('isWeaponAvailable("dualBlades")'), false);
});

test("2-2 bees arrive slowly, preserve the typed target, cap at two, and refill vacant slots", () => {
  const game = battle();
  game.run('const first = getCurrentEnemy(); applyTypedValue(first, first.matchedWord[0])');
  const prefix = game.run("first.typed");
  game.advance(850 + 2399);
  assert.equal(game.run("state.activeEnemies.length"), 1);
  game.advance(1);
  assert.equal(game.run("state.activeEnemies.length"), 2);
  assert.equal(game.run("getCurrentEnemy() === first"), true);
  assert.equal(game.run("first.typed"), prefix);
  game.advance(2400);
  assert.equal(game.run("state.activeEnemies.length"), 2);
  assert.deepEqual(game.snapshot("state.activeEnemies.map(enemy => enemy.slot)"), [0, 1]);
  game.run("applyTypedValue(first, first.matchedWord)");
  assert.equal(game.run("state.activeEnemies.filter(enemy => enemy.hp === 0).length"), 1);
  game.advance(220);
  assert.notEqual(game.run("getInputEnemy()?.id"), game.run("first.id"));
  game.advance(620 + 2400);
  assert.equal(game.run("state.activeEnemies.length"), 2);
  assert.equal(game.run("state.currentWaveSpawned"), 3);
  assert.deepEqual(game.snapshot("state.activeEnemies.map(enemy => enemy.slot)"), [1, 0]);
});

test("bees enter one at a time after START, with earlier bees already moving", () => {
  for (const [stage, interval, count, approach] of [["flower_meadow", 2400, 2, 10000], ["swarm_meadow", 600, 4, 10000]]) {
    const game = battle({ clearedStages: [...cleared, "flower_meadow"] }, false, stage);
    // Restart at a nonzero clock time to exercise the relative START deadline.
    game.advance(100);
    game.run(`startGame("${stage}")`);
    game.advance(849);
    game.run("enemyLoop(performance.now())");
    assert.deepEqual(game.snapshot("state.activeEnemies.map(enemy => enemy.progress)"), [0]);
    game.advance(1);
    for (let spawned = 1; spawned < count; spawned++) {
      game.advance(interval - 1);
      game.run("enemyLoop(performance.now())");
      assert.equal(game.run("state.activeEnemies.length"), spawned);
      game.advance(1);
      game.run("enemyLoop(performance.now())");
      assert.equal(game.run("state.activeEnemies.length"), spawned + 1);
      const positions = game.snapshot("state.activeEnemies.map(enemy => enemy.progress)");
      assert.equal(positions.at(-1), 0);
      assert.ok(positions.every((value, index) => index === 0 || value < positions[index - 1]));
      assert.ok(Math.abs(positions[0] - spawned * interval / approach) < .000001);
    }
    game.advance(interval);
    assert.equal(game.run("state.activeEnemies.length"), count);
  }
});

test("iron sword, greatsword and dual blades attack only one bee per word", () => {
  for (const weaponId of ["sword", "greatsword", "dualBlades"]) {
    const game = battle({ weaponId, clearedStages: [...cleared, "flower_meadow"] }, false, "swarm_meadow");
    fillWave(game);
    game.run("const first = getInputEnemy(); const second = state.activeEnemies[1]; const third = state.activeEnemies[2]");
    const length = game.run("first.matchedWord.length");
    assert.ok(weaponId === "greatsword" ? length >= 12 : length >= 2 && length <= (weaponId === "dualBlades" ? 4 : 8));
    game.run("applyTypedValue(first, first.matchedWord); applyTypedValue(second, second.matchedWord)");
    assert.equal(game.run("first.hp"), 0);
    assert.equal(game.run("second.hp"), 1);
    assert.equal(game.run("state.combo"), 1);
    assert.equal(game.run("state.activeEnemies.filter(enemy => enemy.hp === 0).length"), 1);
    assert.equal(game.run("getInputEnemy()"), null);
    game.advance(110);
    assert.equal(game.run("getInputEnemy()"), null);
    game.advance(game.run("getWeaponDefinition(first.weaponId).attackCooldownMs") - 110);
    assert.equal(game.run("getInputEnemy() === second"), true);
    assert.equal(game.run("third.hp"), 1);
    if (weaponId === "dualBlades") {
      game.run("applyTypedValue(second, second.matchedWord)");
      assert.equal(game.run("second.hp"), 0);
      assert.equal(game.run("third.hp"), 1);
      assert.equal(game.run("state.combo"), 2);
    }
  }
});

test("each bee attacks only after its own arrival, including the third and fourth bees", () => {
  for (const stage of ["flower_meadow", "swarm_meadow"]) {
    const game = battle({ clearedStages: [...cleared, "flower_meadow"] }, false, stage);
    fillWave(game);
    game.run(`
      const arrivals = [];
      const attack = enemyAttack;
      enemyAttack = enemy => {
        const hp = state.hp;
        attack(enemy);
        if (state.hp < hp) arrivals.push(enemy.slot);
      };
      state.activeEnemies.forEach((enemy, index) => {
        enemy.approachMs = 1000;
        enemy.attackPower = { min: 1, max: 1 };
        enemy.lastTick = performance.now();
        setEnemyProgress(enemy, 1 - (index + 1) / 5);
        enemyAttack(enemy);
      });
    `);
    assert.deepEqual(game.snapshot("arrivals"), []);
    const count = game.run("state.activeEnemies.length");
    for (let index = 0; index < count; index++) {
      game.advance(index === 0 ? 199 : 198);
      game.run("enemyLoop(performance.now())");
      assert.equal(game.run("arrivals.length"), index);
      game.advance(2);
      game.run("enemyLoop(performance.now())");
      assert.deepEqual(game.snapshot("arrivals"), Array.from({ length: index + 1 }, (_, slot) => slot));
      assert.ok(game.run("state.activeEnemies.filter(enemy => enemy.atBase).every(enemy => enemy.progress === 1)"));
    }
  }
});

test("staggered spawns keep separate arrival and repeat attack times", () => {
  const game = battle();
  game.advance(850);
  game.run("enemyLoop(performance.now())");
  game.advance(2400);
  game.run("state.activeEnemies.forEach(enemy => { enemy.attackPower = { min: 1, max: 1 }; }); enemyLoop(performance.now())");
  for (const [time, hits] of [[10849, 0], [10851, 1], [13249, 1], [13251, 2], [13410, 2], [13412, 3], [15810, 3], [15812, 4]]) {
    game.advance(time - game.run("performance.now()"));
    game.run("enemyLoop(performance.now())");
    assert.equal(game.run("getMaxHp() - state.hp"), hits, `at ${time}ms`);
  }
});

test("a knocked-back bee must arrive again before dealing more damage", () => {
  const game = battle();
  game.advance(850);
  game.run(`
    const target = getCurrentEnemy();
    target.hp = target.maxHp = 100;
    target.attackPower = { min: 1, max: 1 };
    setEnemyProgress(target, 1);
    enemyAttack(target);
    damageEnemy(target);
  `);
  game.advance(220);
  game.run("enemyAttack(target)");
  assert.equal(game.run("getMaxHp() - state.hp"), 1);
  assert.equal(game.run("target.atBase"), false);
  game.advance(1399);
  game.run("enemyLoop(performance.now())");
  assert.equal(game.run("getMaxHp() - state.hp"), 1);
  game.advance(2);
  game.run("enemyLoop(performance.now())");
  assert.equal(game.run("getMaxHp() - state.hp"), 2);
  assert.equal(game.run("target.progress"), 1);
});

test("all five bees clear once, awarding 100 EXP and dual blades on desktop and touch", () => {
  for (const touch of [false, true]) {
    const game = battle({}, touch);
    const seen = new Set();
    for (let tick = 0; tick < 500 && game.run("state.running"); tick++) {
      for (const id of game.snapshot("state.activeEnemies.map(enemy => enemy.id)")) seen.add(id);
      assert.ok(game.run("state.activeEnemies.length") <= 2);
      assert.equal(game.run("state.dualBladesObtained"), false);
      if (game.run("Boolean(getInputEnemy())")) game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
      game.advance(100);
    }
    assert.equal(seen.size, 5);
    assert.equal(game.run("state.running"), false);
    assert.equal(game.run("state.cleared"), 5);
    assert.equal(game.run("state.totalExperience"), 515);
    assert.equal(game.run("els.treasureText.textContent"), "双剣を手に入れた！");
    assert.equal(game.savedProgress().dualBladesObtained, true);
    assert.deepEqual(game.savedProgress().clearedStages, [...cleared, "flower_meadow"]);
    game.run("finishGame(true)");
    assert.equal(game.run("state.totalExperience"), 515);
    game.run("continueAfterResult()");
    assert.equal(game.run("state.weaponEquipGuideId"), "dualBlades");
    game.run('selectWeapon("dualBlades"); continueAfterWeaponEquip()');
    assert.equal(game.run("state.stageId"), "swarm_meadow");
  }
});

test("a skill clears four bees together without duplicating the spawn queue or rewards", () => {
  const game = battle({ clearedStages: [...cleared, "flower_meadow"] }, false, "swarm_meadow");
  fillWave(game);
  game.run("state.specialGauge = 100; useSpecialMove()");
  game.advance(420);
  assert.equal(game.run("state.cleared"), 4);
  assert.equal(game.run("state.pendingExperience"), 40);
  game.advance(620);
  for (let count = 0; count < 4; count++) {
    game.advance(599);
    assert.equal(game.run("state.activeEnemies.length"), count);
    game.advance(1);
    assert.equal(game.run("state.activeEnemies.length"), count + 1);
  }
  assert.equal(game.run("state.currentWaveSpawned"), 8);
  assert.equal(game.run("state.cleared"), 4);
});

test("leaving, retrying and losing cancel old spawns and discard partial rewards", () => {
  for (const action of ["showStageSelect()", "finishGame(false)", 'startGame("grassland_path")', 'startGame("flower_meadow")']) {
    const game = battle();
    game.run("applyTypedValue(getInputEnemy(), getInputEnemy().matchedWord)");
    game.advance(220);
    assert.equal(game.run("state.pendingExperience"), 20);
    game.run(action);
    game.advance(5500);
    const active = game.snapshot("state.activeEnemies.map(enemy => ({ type: enemy.type, slot: enemy.slot }))");
    if (action.includes('startGame("grassland_path")')) assert.deepEqual(active, [{ type: "snake_level_1", slot: 0 }]);
    if (action.includes('startGame("flower_meadow")')) {
      assert.equal(active.length, 2);
      assert.equal(game.run("state.currentWaveSpawned"), 2);
      assert.equal(game.run("state.cleared"), 0);
    }
    if (action === "showStageSelect()") assert.equal(active.length, 0);
    assert.equal(game.savedProgress().totalExperience, 415);
    assert.notEqual(game.savedProgress().dualBladesObtained, true);
    assert.deepEqual(game.savedProgress().clearedStages, cleared);
  }
});

test("bee and dual-blade illustrations exist and preload before play", () => {
  const game = createGame();
  const urls = game.snapshot("collectGameImageSources()");
  for (const path of ["enemies/bee/level_1/idle/frame_01.png", "enemies/bee/boss/idle/frame_01.png", "items/weapons/dual_blades.png", "player/dual_blades/idle/frame_01.png", "player/dual_blades/attack/frame_01.png"]) {
    assert.ok(urls.some(url => url.includes(path)));
    assert.ok(existsSync(new URL("../../../src/assets/images/" + path, import.meta.url)));
  }
});

test("retired dagger saves equip the iron sword; only existing 2-2 clears receive dual blades", () => {
  for (const alreadyCleared of [false, true]) {
    const game = createGame(saved({ weaponId: "dagger", daggerObtained: true, daggerEquipPending: true,
      totalExperience: 595, clearedStages: alreadyCleared ? [...cleared, "flower_meadow"] : cleared }));
    assert.equal(game.run("state.weaponId"), "sword");
    assert.equal(game.run('isWeaponAvailable("dagger")'), false);
    assert.equal(game.run("state.dualBladesObtained"), alreadyCleared);
    assert.equal(game.run("state.dualBladesEquipPending"), alreadyCleared);
    assert.equal(game.run('isStageAvailable("swarm_meadow")'), alreadyCleared);
    assert.equal(game.run("state.totalExperience"), 595);
    game.run("savePlayerProgress()");
    assert.equal(game.savedProgress().daggerObtained, undefined);
    const reloaded = createGame(game.saved());
    assert.equal(reloaded.run("state.weaponId"), "sword");
    assert.equal(reloaded.run("state.totalExperience"), 595);
    assert.equal(reloaded.run("state.dualBladesObtained"), alreadyCleared);
  }
});

test("dual blades only damage the selected enemy, even when another enemy is closer", () => {
  const game = battle({ weaponId: "dualBlades", clearedStages: [...cleared, "flower_meadow"] }, false, "swarm_meadow");
  fillWave(game);
  game.run(`
    const primary = getInputEnemy();
    const closest = state.activeEnemies[3];
    state.activeEnemies.forEach(enemy => { enemy.hp = enemy.maxHp = 20; });
    setEnemyProgress(closest, .9);
    applyTypedValue(primary, primary.matchedWord);
  `);
  assert.ok(game.run("primary.hp < 20"));
  assert.deepEqual(game.snapshot("state.activeEnemies.slice(1).map(enemy => enemy.hp)"), [20,20,20]);
  game.advance(200);
  assert.equal(game.run("getInputEnemy() === primary"), true);
  assert.equal(game.run("state.combo"), 1);
  game.run("showStageSelect()");
  game.advance(2000);
  assert.equal(game.run("state.activeEnemies.length"), 0);
});
