import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function startGreatswordBattle(touch = false) {
  const game = createGame({
    "into-the-typing.player.v2": JSON.stringify({
      version: 2, totalExperience: 0, stats: { attack: 1, agility: 1 },
      weaponId: "greatsword", introCompleted: true, equipmentTutorialCompleted: true,
    }),
  }, { touch });
  game.run('startGame("mist_road")');
  game.advance(850);
  game.run(`
    const chargeEnemy = getCurrentEnemy();
    chargeEnemy.hp = chargeEnemy.maxHp = 20;
    chargeEnemy.word = chargeEnemy.matchedWord = "kibounohikari";
    chargeEnemy.inputs = ["kibounohikari"];
    chargeEnemy.translation = "希望の光";
    renderWord();`);
  return game;
}
const type = (game, text) => game.run("applyTypedValue(getCurrentEnemy(), " + JSON.stringify(text) + ")");
const percent = game => game.run('Number(els.weaponChargeMeter.getAttribute("aria-valuenow"))');
const approx = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.06, `${actual} != ${expected}`);

test("each correct letter raises the visible charge, pose and damage up to a full-power release", () => {
  const game = startGreatswordBattle();
  assert.equal(game.run("els.weaponCharge.hidden"), false);
  assert.equal(percent(game), 0);
  assert.equal(game.run('els.weaponChargeMeter.getAttribute("aria-valuetext")'), "溜め0％、攻撃力1");
  for (let length = 1; length <= 13; length++) {
    type(game, "kibounohikari".slice(0, length));
    approx(percent(game), length / 13 * 100);
    assert.equal(game.run('els.weaponChargeMeter.getAttribute("aria-valuemax")'), "100");
    const expectedPose = length < 6 ? "0" : length < 11 ? "1" : "2";
    assert.equal(game.run("els.player.dataset.chargePose"), expectedPose);
    assert.equal(game.run("getPlayerAttackDamage(getCurrentEnemy())"), Math.round(Math.max(1, length / 13 * 4) * 10) / 10);
    assert.equal(game.run("els.weaponCharge.dataset.full"), String(length === 13));
  }
  assert.match(game.run("els.playerFrameWindup.src"), /greatsword\/attack\/frame_01.png/);
  assert.equal(game.run("getCurrentEnemy().hp"), 16);
  assert.equal(game.run('els.player.classList.contains("is-perfect-release")'), true);
});

test("every miss reduces charge by one quarter and prevents full charge for the same word", () => {
  const game = startGreatswordBattle();
  type(game, "kibounohikar");
  let previous = percent(game);
  for (let miss = 1; miss <= 3; miss++) {
    type(game, "kibounohikarx");
    approx(percent(game), 12 / 13 * Math.pow(.75, miss) * 100);
    assert.ok(percent(game) < previous);
    assert.equal(game.run("getCurrentEnemy().typed"), "kibounohikar");
    assert.equal(game.run("els.player.dataset.chargePose"), miss === 3 ? "0" : "1");
    previous = percent(game);
  }
  type(game, "kibounohikari");
  approx(percent(game), 42.1875);
  assert.equal(game.run("getCurrentEnemy().hp"), 18.3);
  assert.match(game.run('els.weaponChargeMeter.getAttribute("aria-valuetext")'), /攻撃力1\.7$/);
  assert.equal(game.run('els.player.classList.contains("is-perfect-release")'), false);
  assert.match(game.run("els.playerFrameWindup.src"), /greatsword\/idle\/frame_01.png/);
  game.advance(220);
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 0);
  assert.equal(game.run("getCurrentEnemy().chargeInputProgress"), 0);
  assert.equal(percent(game), 0);
  assert.equal(game.run("els.player.dataset.chargePose"), "0");
});

test("a miss before typing still limits the final charge and every later letter increases it", () => {
  const game = startGreatswordBattle();
  type(game, "x");
  let previous = percent(game);
  for (let length = 1; length <= 13; length++) {
    type(game, "kibounohikari".slice(0, length));
    assert.ok(percent(game) > previous);
    previous = percent(game);
  }
  assert.equal(percent(game), 75);
  assert.equal(game.run("getCurrentEnemy().hp"), 17);
  assert.equal(game.run("els.player.dataset.chargePose"), "1");
});

test("deleting and retyping cannot recover the miss penalty or farm extra charge", () => {
  const game = startGreatswordBattle();
  type(game, "kibounoh"); type(game, "kibounohx");
  const previous = percent(game);
  type(game, "kibo");
  assert.ok(percent(game) < previous);
  type(game, "kibounoh");
  assert.equal(percent(game), previous);
  type(game, "kibounoh");
  assert.equal(percent(game), previous);
  assert.equal(game.run("getCurrentEnemy().typingMisses"), 1);
  type(game, "kibounohikari");
  assert.equal(percent(game), 75);
  assert.equal(game.run("getCurrentEnemy().hp"), 17);
});

test("flick charge counts kana evenly and waits for the correct dakuten or small kana", () => {
  const game = startGreatswordBattle(true);
  game.run('chargeEnemy.word = chargeEnemy.matchedWord = "gakkou"; chargeEnemy.inputs = ["gakkou"]; chargeEnemy.translation = "学校"; chargeEnemy.inputRevision++; renderWord()');
  const key = (id, direction = 0) => game.run("applyGameFlickKey(" + JSON.stringify(id) + "," + direction + ")");
  key("ka"); assert.equal(percent(game), 0);
  key("modifier"); assert.equal(percent(game), 25);
  key("ta", 2); assert.equal(percent(game), 25);
  key("modifier"); assert.equal(percent(game), 50);
  key("ka", 4); assert.equal(percent(game), 75);
  key("a", 2); assert.equal(percent(game), 100);
  assert.equal(game.run("chargeEnemy.typingMisses"), 0);
  assert.equal(game.run("chargeEnemy.hp"), 16);
  assert.equal(game.run("els.flickInput.value"), "");
  assert.equal(percent(game), 100, "clearing the editor cannot erase the released charge");
});

test("a valid first kana of a compound sound raises charge even before its roman token completes", () => {
  const game = startGreatswordBattle(true);
  game.run('chargeEnemy.word = chargeEnemy.matchedWord = "kyaku"; chargeEnemy.inputs = ["kyaku"]; chargeEnemy.translation = "客"; chargeEnemy.inputRevision++; renderWord()');
  game.run('applyGameFlickKey("ka", 1)');
  approx(percent(game), 100 / 3);
  game.run('applyGameFlickKey("ya", 0)');
  approx(percent(game), 100 / 3);
  game.run('applyGameFlickKey("modifier")');
  approx(percent(game), 200 / 3);
  game.run('applyGameFlickKey("ka", 2)');
  assert.equal(percent(game), 100);
  assert.equal(game.run("chargeEnemy.typingMisses"), 0);
  assert.equal(game.run("chargeEnemy.hp"), 16);
});

test("many mistakes have a damage floor, and restart or a different weapon clears the meter", () => {
  const game = startGreatswordBattle();
  for (let i = 0; i < 20; i++) type(game, "x");
  type(game, "kibounohikari");
  assert.equal(game.run("chargeEnemy.hp"), 19);
  assert.ok(percent(game) >= 0 && percent(game) < 1);
  game.run('startGame("mist_road")');
  assert.equal(percent(game), 0);
  assert.equal(game.run("els.weaponCharge.dataset.penalized"), "false");
  game.run('getCurrentEnemy().weaponId = "sword"; updateHud()');
  assert.equal(game.run("els.weaponCharge.hidden"), true);
  assert.equal(game.run("getPlayerAttackDamage(getCurrentEnemy())"), 1);
  game.run('finishGame(false)');
  assert.equal(game.run("els.weaponCharge.hidden"), true);
});
