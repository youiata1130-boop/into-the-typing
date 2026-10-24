import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../../helpers/game.mjs";

function battle({ weaponId = "swordShield", stage = "mushroom_forest", touch = false } = {}) {
  const game = createGame({ "into-the-typing.player.v2": JSON.stringify({
    version: 2, totalExperience: 755, stats: { attack: 2, agility: 1 }, weaponId,
    introCompleted: true, equipmentTutorialCompleted: true, ironSwordObtained: true,
    greatswordObtained: true, dualBladesObtained: true, swordShieldObtained: true,
    skillTutorialCompleted: true,
    clearedStages: ["forest_path", "mist_road", "sky_castle", "storm_cove", "grassland_path", "flower_meadow", "swarm_meadow"],
  }) }, { touch });
  game.run(`startGame("${stage}")`);
  game.advance(850);
  game.run(`
    const enemy = getCurrentEnemy();
    const pressSpace = (shiftKey = false, repeat = false) => handleTypingKeydown({
      key: " ", code: "Space", shiftKey, repeat, preventDefault() {},
    });
    const pressEnter = () => handleTypingKeydown({key:"Enter",code:"Enter",preventDefault(){}});
    const releaseSpace = () => document.dispatchEvent({ type: "keyup", key: " ", code: "Space" });
    const attack = () => {
      if (enemy.attackStyle === "charge") enemy.chargeElapsedMs = enemy.chargeDurationMs;
      else setEnemyProgress(enemy, 1);
      enemyAttack(enemy);
    };
  `);
  return game;
}

for (const stage of ["mushroom_forest", "grassland_path"]) {
  test(`${stage}: a fresh Space guard quarters damage, counts as a hit and releases for full damage`, () => {
    const game = battle({ stage });
    game.run("enemy.attackPower = { min: 21, max: 21 }; state.combo = 4; state.successStreak = 3; state.specialGauge = 100; pressSpace(); attack()");
    assert.equal(game.run("state.hp"), game.run("getMaxHp()") - 6);
    assert.equal(game.run("state.combo"), 0);
    assert.equal(game.run("state.successStreak"), 0);
    assert.equal(game.run("state.perfect"), false);
    assert.equal(game.run("state.specialGauge"), 100);
    assert.equal(game.run('els.player.classList.contains("is-guarding")'), true);
    assert.equal(game.run('els.player.classList.contains("is-guard-hit")'), true);
    assert.equal(game.run('els.guardButton.getAttribute("aria-pressed")'), "true");
    assert.equal(game.run("els.specialButton.disabled"), true);
    if (stage === "mushroom_forest") {
      assert.equal(game.run("enemy.chargeElapsedMs"), 0);
      assert.equal(game.run("enemy.progress"), .15);
    }
    game.advance(360);
    game.run("releaseSpace(); attack()");
    assert.equal(game.run("state.guarding"), false);
    assert.equal(game.run("state.hp"), game.run("getMaxHp()") - 6 - 21);
    assert.equal(game.run("state.combo"), 0);
    assert.equal(game.run("state.perfect"), false);
  });
}

test("just guard rounds quarter damage up, always inflicts at least one HP and can be fatal", () => {
  for (const weaponId of ["swordShield", "greatsword"]) for (const [damage, received] of [[28, 7], [26, 7], [21, 6], [5, 2], [4, 1], [1, 1]]) {
    const game = battle({ weaponId });
    game.run(`enemy.attackPower = { min: ${damage}, max: ${damage} }; pressSpace(); attack()`);
    assert.equal(game.run("state.hp"), game.run("getMaxHp()") - received);
  }
  const game = battle();
  game.run("state.hp = 1; enemy.attackPower = { min: 1, max: 1 }; pressSpace(); attack()");
  assert.equal(game.run("state.hp"), 0);
  game.advance(320);
  assert.equal(game.run("state.running"), false);
  assert.equal(game.run("state.guarding"), false);
  assert.equal(game.run("els.gameNotice.dataset.kind"), "over");
});

test("guard keeps partial input and prevents typing, buffered attacks, flick input and skills", () => {
  const game = battle({ touch: true });
  game.run(`
    applyTypedValue(enemy, enemy.matchedWord.slice(0, 1));
    const partial = enemy.typed;
    state.specialGauge = 100;
    pressSpace();
    handleTypingKeydown({ key: "a", code: "KeyA", preventDefault() {} });
    handleTypingKeydown({ key: "Backspace", preventDefault() {} });
    enqueueBufferedInput("letter", "a");
    applyTypedValue(enemy, enemy.matchedWord); damageEnemy(enemy);
    applyGameFlickKey("ka"); useSpecialMove();
  `);
  assert.equal(game.run("enemy.typed"), game.run("partial"));
  assert.equal(game.run("enemy.hp"), game.run("enemy.maxHp"));
  assert.equal(game.run("state.inputBuffer.length"), 0);
  assert.equal(game.run("state.specialGauge"), 100);
  assert.equal(game.run("state.specialInProgress"), false);
  assert.equal(game.run("canUseGameFlickKeyboard()"), false);
  game.run("releaseSpace()");
  assert.equal(game.run("canUseGameFlickKeyboard()"), true);
  game.run("applyTypedValue(enemy, enemy.matchedWord)");
  assert.ok(game.run("enemy.hp") < game.run("enemy.maxHp"));
});

test("guard cancels queued typing and attack animation without shortening the stage cooldown", () => {
  const game = battle();
  game.run(`applyTypedValue(enemy, enemy.matchedWord);
    const readyAt = state.playerAttackReadyAt;
    enqueueBufferedInput("letter", "a"); pressSpace();`);
  assert.equal(game.run("state.inputBuffer.length"), 0);
  assert.equal(game.run('els.player.classList.contains("is-attacking")'), false);
  game.advance(300);
  game.run("releaseSpace()");
  assert.equal(game.run("state.playerAttackReadyAt"), game.run("readyAt"));
  assert.equal(game.run("getInputEnemy()"), null);
  game.advance(400);
  assert.equal(game.run("getInputEnemy() === enemy"), true);
  assert.equal(game.run("state.combo"), 1);
});

test("sword and shield reserves Space for guard and Enter for the existing skill", () => {
  const game = battle();
  game.run("state.specialGauge = 100; pressSpace(); pressSpace(false, true)");
  assert.equal(game.run("state.specialInProgress"), false);
  assert.equal(game.run("state.guarding"), true);
  assert.equal(game.run("els.specialShortcut.textContent"), "Enter");
  game.run("releaseSpace(); pressEnter()");
  assert.equal(game.run("state.specialGauge"), 0);
  assert.equal(game.run("isPlayerAttackBoosted()"), true);
  assert.equal(game.run("state.specialInProgress"), false);
  assert.equal(game.run("state.guarding"), false);
  game.run("pressSpace()");
  assert.equal(game.run("state.guarding"), true);
  for (const weaponId of ["dualBlades"]) {
    const other = battle({ weaponId });
    other.run("state.specialGauge = 100; pressEnter()");
    assert.equal(other.run("isEnemyActionStopped()"), true);
    assert.equal(other.run("state.guarding"), false);
    assert.equal(other.run("els.guardButton.hidden"), true);
    assert.equal(other.run("els.specialShortcut.textContent"), "Enter");
  }
});

test("pointer hold survives a different pointer release and combines with keyboard hold", () => {
  const game = battle({ touch: true });
  game.run(`
    const pointer = (type, pointerId) => els.guardButton.dispatchEvent({ type, pointerId, button: 0, preventDefault() {} });
    pointer("pointerdown", 4); pointer("pointerup", 9);
  `);
  assert.equal(game.run("state.guarding"), true);
  game.run('pressSpace(); pointer("pointercancel", 4)');
  assert.equal(game.run("state.guarding"), true);
  game.run("releaseSpace()");
  assert.equal(game.run("state.guarding"), false);
  game.run('pointer("pointerdown", 5); pointer("lostpointercapture", 5)');
  assert.equal(game.run("state.guarding"), false);
});

test("hiding the page, leaving battle, restarting and losing clear the guard and its input latch", () => {
  for (const action of [
    'document.hidden = true; document.dispatchEvent({ type: "visibilitychange" })',
    "showStageSelect()", "showHomeScreen()", "resetGame()", 'startGame("mushroom_forest")', "finishGame(false)",
  ]) {
    const game = battle();
    game.run(`pressSpace(); attack(); ${action}`);
    assert.equal(game.run("state.guarding"), false, action);
    assert.equal(game.run("playerGuardInput.keys.size"), 0, action);
    assert.equal(game.run("playerGuardInput.pointerId"), null, action);
    assert.equal(game.run('els.player.classList.contains("is-guard-hit")'), false, action);
    game.advance(1000);
    assert.equal(game.run("state.guarding"), false, action);
  }
});

test("Enter does not latch guard on the guard button", () => {
  const game = battle();
  game.run('pressSpace(); els.guardButton.dispatchEvent({type:"keydown",key:"Enter",preventDefault(){}}); releaseSpace()');
  assert.equal(game.run("state.guarding"), false);
});

test("greatsword just guard blocks quarter damage with its blade while its word is empty", () => {
  const game = battle({ weaponId: "greatsword" });
  game.run("enemy.attackPower = { min: 21, max: 21 }; pressSpace(); attack()");
  assert.equal(game.run("state.hp"), game.run("getMaxHp()") - 6);
  assert.equal(game.run("state.guarding"), true);
  assert.equal(game.run("els.guardButton.hidden"), false);
  assert.equal(game.run("els.specialShortcut.textContent"), "Enter");
  assert.equal(game.run('els.player.getAttribute("aria-label")'), "大剣でガードする主人公");
  assert.match(game.run("els.playerFrameGuard.src"), /greatsword\/guard\//);
  assert.equal(game.run("canUseGameFlickKeyboard()"), false);
  game.run("releaseSpace()"); game.advance(360);
  game.run("state.specialGauge = 100; pressEnter()");
  assert.equal(game.run("state.specialInProgress"), true);
  assert.equal(game.run("state.guarding"), false);
});

test("greatsword cannot guard after a letter, but can immediately after completing the word", () => {
  const game = battle({ weaponId: "greatsword" });
  game.run('enemy.hp = enemy.maxHp = 100; applyTypedValue(enemy, enemy.matchedWord.slice(0, 1)); const prefix = enemy.typed; pressSpace()');
  assert.equal(game.run("state.guarding"), false);
  assert.equal(game.run("els.guardButton.disabled"), true);
  assert.equal(game.run("enemy.typed"), game.run("prefix"));
  assert.equal(game.run('beginPlayerGuard("pointer", 4)'), false);
  game.run('els.guardButton.dispatchEvent({ type: "keydown", key: "Enter", preventDefault() {} })');
  assert.equal(game.run("state.guarding"), false);
  assert.equal(game.run("playerGuardInput.keys.size"), 0);
  game.run("releaseSpace(); applyTypedValue(enemy, enemy.matchedWord); const readyAt = state.playerAttackReadyAt; pressSpace()");
  assert.equal(game.run("state.guarding"), true);
  assert.equal(game.run("state.playerAttackReadyAt"), game.run("readyAt"));
  game.advance(1500);
  assert.equal(game.run("state.guarding"), true);
  game.run("releaseSpace()");
  assert.equal(game.run("getInputEnemy() === enemy"), true);
});

test("erasing every greatsword letter enables guard without resetting typing penalties", () => {
  const game = battle({ weaponId: "greatsword" });
  game.run('applyTypedValue(enemy, enemy.matchedWord.slice(0, 2)); enemy.typingMisses = 2; applyTypedValue(enemy, "")');
  assert.equal(game.run("els.guardButton.disabled"), false);
  game.run("pressSpace()");
  assert.equal(game.run("state.guarding"), true);
  assert.equal(game.run("enemy.typingMisses"), 2);
});

test("greatsword guard respects accepted and pending mobile kana, including modifier input", () => {
  const game = battle({ weaponId: "greatsword", touch: true });
  game.run(`
    enemy.word = enemy.matchedWord = "panda"; enemy.inputs = ["panda"];
    enemy.translation = "パンダ"; enemy.readingOverride = "ぱんだ"; enemy.inputRevision++; renderWord();
    els.flickInput.value = "は"; applyFlickValue("は", flickPromptKey(), { composing: true });
  `);
  assert.equal(game.run("enemy.typed"), "");
  assert.equal(game.run("flickState.lastPending"), true);
  assert.equal(game.run("els.guardButton.disabled"), true);
  game.run("pressSpace()");
  assert.equal(game.run("state.guarding"), false);
  game.run('els.flickInput.value = "ぱ"; applyFlickValue("ぱ", flickPromptKey(), { composing: true })');
  assert.ok(game.run("enemy.typed.length") > 0);
  assert.equal(game.run('beginPlayerGuard("pointer", 4)'), false);
  game.run('els.flickInput.value = ""; applyFlickValue("", flickPromptKey()); pressSpace()');
  assert.equal(game.run("state.guarding"), true);
});

test("queued greatsword input prevents guard and cannot be silently discarded", () => {
  const game = battle({ weaponId: "greatsword" });
  game.run('enemy.hp = 100; applyTypedValue(enemy, enemy.matchedWord); enqueueBufferedInput("letter", "a"); pressSpace()');
  assert.equal(game.run("state.guarding"), false);
  assert.equal(game.run("els.guardButton.disabled"), true);
  assert.equal(game.run("state.inputBuffer.length"), 1);
  game.run('enqueueBufferedInput("backspace"); pressSpace()');
  assert.equal(game.run("state.guarding"), true);
  assert.equal(game.run("state.inputBuffer.length"), 0);
});

test("switching greatsword targets cannot hide a partially typed word from the guard restriction", () => {
  const game = battle({ weaponId: "greatsword", stage: "flower_meadow" });
  game.advance(2400);
  assert.equal(game.run("state.activeEnemies.length"), 2);
  game.run('applyTypedValue(enemy, enemy.matchedWord.slice(0, 1)); setTargetEnemy(state.activeEnemies[1]); pressSpace()');
  assert.equal(game.run("state.guarding"), false);
  assert.equal(game.run("els.guardButton.disabled"), true);
});

for (const weaponId of ["swordShield", "greatsword"]) test(weaponId + ': ArrowDown holds guard independently of Space', () => {
  const game = battle({ weaponId });
  game.run('const down = () => handleTypingKeydown({key:"ArrowDown",code:"ArrowDown",preventDefault(){}}); const up = () => document.dispatchEvent({type:"keyup",key:"ArrowDown",code:"ArrowDown"}); down()');
  assert.equal(game.run('state.guarding'), true);
  game.run('pressSpace();up()'); assert.equal(game.run('state.guarding'), true);
  game.run('down();releaseSpace()'); assert.equal(game.run('state.guarding'), true);
  game.run('up()'); assert.equal(game.run('state.guarding'), false);
  game.run('down();showStageSelect()'); assert.equal(game.run('state.guarding'), false);
});
test('ArrowDown respects greatsword partial input and cannot guard with an unsupported weapon', () => {
  const game = battle({ weaponId: 'greatsword' });
  game.run('applyTypedValue(enemy,enemy.matchedWord[0]);handleTypingKeydown({key:"ArrowDown",code:"ArrowDown",preventDefault(){}})');
  assert.equal(game.run('state.guarding'), false);
  const other = battle({weaponId:'dualBlades'});
  other.run('handleTypingKeydown({key:"ArrowDown",code:"ArrowDown",preventDefault(){}})');
  assert.equal(other.run('state.guarding'), false);
});

for (const weaponId of ["swordShield", "greatsword"]) test(weaponId + ': just guard includes 200ms, ordinary guard halves damage after it', () => {
  for (const [elapsed, expected] of [[0,10],[199,10],[200,10],[201,20],[1000,20]]) {
    const game = battle({weaponId});
    const hp=game.run('state.hp');game.run('enemy.attackPower={min:40,max:40};pressSpace()');game.advance(elapsed);game.run('attack()');
    assert.equal(game.run('state.hp'),hp-expected);
    assert.equal(game.run('els.player.classList.contains("is-just-guard-hit")'),elapsed<=200);
    assert.equal(game.run('els.guardSuccessLabel.textContent'),elapsed<=200?'ジャストガード':'ガード成功');
  }
});
test('adding another held key or pointer cannot renew the just-guard window; releasing and guarding again can',()=>{
 const game=battle();const hp=game.run('state.hp');game.run('enemy.attackPower={min:40,max:40};pressSpace()');game.advance(250);
 game.run('beginPlayerGuard("arrowDown");beginPlayerGuard("pointer",8);pressSpace(false,true);attack()');assert.equal(game.run('state.hp'),hp-20);
 game.run('releaseSpace();endPlayerGuard("arrowDown");endPlayerGuard("pointer",8)');assert.equal(game.run('playerGuardInput.startedAt'),null);game.advance(360);
 game.run('beginPlayerGuard("arrowDown");attack()');assert.equal(game.run('state.hp'),hp-30);
 game.run('showStageSelect()');assert.equal(game.run('playerGuardInput.startedAt'),null);assert.equal(game.run('els.player.classList.contains("is-just-guard-hit")'),false);
});
