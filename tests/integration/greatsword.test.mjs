import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

function startGreatswordBattle() {
  const game = createGame({
    "into-the-typing.player.v2": JSON.stringify({
      version: 2, totalExperience: 0, stats: { attack: 1, agility: 1 },
      weaponId: "greatsword", introCompleted: true, equipmentTutorialCompleted: true,
    }),
  });
  game.run("startGame()");
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

test("correct letters advance the greatsword through low, raised, and overhead poses", () => {
  const game = startGreatswordBattle();
  assert.equal(game.run("els.player.dataset.chargePose"), "0");
  for (let length = 1; length < 13; length++) {
    game.run('applyTypedValue(getCurrentEnemy(), "kibounohikari".slice(0, ' + length + "))");
    assert.equal(game.run('Number(els.weaponChargeMeter.getAttribute("aria-valuenow"))'), length);
    const expectedPose = length < 5 ? "0" : length < 9 ? "1" : "2";
    assert.equal(game.run("els.player.dataset.chargePose"), expectedPose);
  }
  assert.match(game.run("els.playerFrameCharge.src"), /greatsword\/attack\/frame_01.png/);
  game.run('applyTypedValue(getCurrentEnemy(), "kibounohikari")');
  assert.equal(game.run("getCurrentEnemy().hp"), 16);
  assert.equal(game.run('els.player.classList.contains("is-perfect-release")'), true);
});

test("a miss resets the pose and aura without erasing correct text, then remaining letters rebuild", () => {
  const game = startGreatswordBattle();
  game.run('applyTypedValue(getCurrentEnemy(), "kibounoh"); applyTypedValue(getCurrentEnemy(), "kibounohx")');
  assert.deepEqual(game.snapshot('({ typed: getCurrentEnemy().typed, pose: els.player.dataset.chargePose, level: els.player.dataset.chargeLevel, charging: els.player.classList.contains("is-charging"), charge: Number(els.weaponChargeMeter.getAttribute("aria-valuenow")) })'),
    { typed: "kibounoh", pose: "0", level: "0", charging: false, charge: 0 });
  assert.match(game.run("els.playerFrameCharge.src"), /greatsword\/charge\/frame_01.png/);
  game.run('applyTypedValue(getCurrentEnemy(), "kibounohika")');
  assert.equal(game.run("els.player.dataset.chargePose"), "1");
  game.run('applyTypedValue(getCurrentEnemy(), "kibounohikar")');
  assert.equal(game.run("els.player.dataset.chargePose"), "2");
  game.run('applyTypedValue(getCurrentEnemy(), "kibounohikari")');
  assert.equal(game.run("getCurrentEnemy().hp"), 17);
  assert.equal(game.run('els.player.classList.contains("is-perfect-release")'), false);
  game.advance(220);
  assert.equal(game.run("getCurrentEnemy().chargeStartLength"), 0);
  assert.equal(game.run("els.player.dataset.chargePose"), "0");
});

test("backspace rewinds charge and repeated mistakes never restore old charge", () => {
  const game = startGreatswordBattle();
  game.run('applyTypedValue(getCurrentEnemy(), "kibo"); applyTypedValue(getCurrentEnemy(), "kibox"); applyTypedValue(getCurrentEnemy(), "kibounoh")');
  assert.equal(game.run("els.player.dataset.chargePose"), "1");
  game.run('applyTypedValue(getCurrentEnemy(), "kib")');
  assert.equal(game.run("getCurrentEnemy().chargeStartLength"), 3);
  assert.equal(game.run('Number(els.weaponChargeMeter.getAttribute("aria-valuenow"))'), 0);
  game.run('applyTypedValue(getCurrentEnemy(), "kibo"); applyTypedValue(getCurrentEnemy(), "kibox"); applyTypedValue(getCurrentEnemy(), "kibox"); updateHud()');
  assert.equal(game.run("getCurrentEnemy().typed"), "kibo");
  assert.equal(game.run("els.player.dataset.chargeLevel"), "0");
  assert.equal(game.run("els.player.dataset.chargePose"), "0");
});
