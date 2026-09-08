import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const context = { window: {} };
vm.runInNewContext(readFileSync(new URL("../../src/config/playerProgression.js", import.meta.url), "utf8"), context);
const growth = context.window.PLAYER_PROGRESSION;
const plain = (value) => JSON.parse(JSON.stringify(value));

test("a new player starts with no spendable points", () => {
  assert.deepEqual(plain(growth.restore()), {
    totalExperience: 0, level: 1, experience: 0, skillPoints: 0,
    stats: { attack: 1, agility: 1 },
  });
  assert.equal(growth.maxHp(1), 100);
  assert.equal(growth.upgrade(growth.restore(), "attack"), false);
});

test("required EXP strictly increases at every level before the cap", () => {
  assert.deepEqual([1, 2, 3, 4].map(growth.experienceToNextLevel), [40, 65, 100, 145]);
  for (let level = 2; level < growth.rules.maxLevel; level++) {
    assert(growth.experienceToNextLevel(level) > growth.experienceToNextLevel(level - 1));
  }
});

test("exact threshold grants HP and one point once", () => {
  const player = growth.restore();
  growth.gainExperience(player, 39);
  assert.equal(player.level, 1);
  assert.equal(player.skillPoints, 0);
  const result = growth.gainExperience(player, 1);
  assert.deepEqual(plain(result), { gained: 1, levels: 1, hpGained: 10 });
  assert.equal(player.level, 2);
  assert.equal(player.experience, 0);
  assert.equal(player.skillPoints, 1);
  assert.equal(growth.maxHp(player.level), 110);
});

test("overflow carries through multiple levels, including a full forest clear", () => {
  const player = growth.restore();
  const result = growth.gainExperience(player, 110);
  assert.equal(result.levels, 2);
  assert.equal(result.hpGained, 20);
  assert.equal(player.level, 3);
  assert.equal(player.experience, 5);
  assert.equal(player.skillPoints, 2);
  growth.gainExperience(player, 155);
  assert.equal(player.level, 4);
  assert.equal(player.experience, 60);
  assert.equal(player.totalExperience, 265);
});

test("each upgrade spends exactly one point and cannot overspend", () => {
  const player = growth.restore({ totalExperience: 110 });
  assert.equal(growth.upgrade(player, "attack"), true);
  assert.equal(growth.upgrade(player, "agility"), true);
  assert.deepEqual(plain(player.stats), { attack: 2, agility: 2 });
  assert.equal(player.skillPoints, 0);
  const snapshot = JSON.stringify(player);
  assert.equal(growth.upgrade(player, "attack"), false);
  assert.equal(JSON.stringify(player), snapshot);
});

test("new level rewards preserve previously allocated points", () => {
  const player = growth.restore({ totalExperience: 40 });
  growth.upgrade(player, "attack");
  growth.gainExperience(player, 65);
  assert.equal(player.stats.attack, 2);
  assert.equal(player.skillPoints, 1);
  assert.equal(player.level, 3);
});

test("save restoration reconstructs remaining points from earned and spent points", () => {
  const restored = growth.restore({
    totalExperience: 110, stats: { attack: 2, agility: 1 }, skillPoints: 99999, level: 99,
  });
  assert.equal(restored.level, 3);
  assert.equal(restored.skillPoints, 1);
  assert.equal(restored.experience, 5);
  assert.equal(restored.stats.attack, 2);
});

test("invalid save data cannot create negative values or free upgrades", () => {
  for (const data of [null, [], "bad", { totalExperience: -1 }, { totalExperience: "110" }]) {
    assert.equal(growth.restore(data).level, 1);
    assert.equal(growth.restore(data).skillPoints, 0);
  }
  const player = growth.restore({ totalExperience: 40, stats: { attack: 99, agility: 9 } });
  assert.equal(player.level, 2);
  assert.deepEqual(plain(player.stats), { attack: 1, agility: 1 });
  assert.equal(player.skillPoints, 1);
});

test("invalid rewards and unknown stats leave progression unchanged", () => {
  const player = growth.restore({ totalExperience: 110 });
  const snapshot = JSON.stringify(player);
  for (const reward of [-5, 0, NaN, Infinity, "40", 1.5]) {
    assert.equal(growth.gainExperience(player, reward).gained, 0);
  }
  for (const stat of ["hp", "__proto__", "constructor", ""]) {
    assert.equal(growth.upgrade(player, stat), false);
  }
  assert.equal(JSON.stringify(player), snapshot);
});

test("level cap stops EXP growth and repeated rewards do not grant extra points", () => {
  const player = growth.restore();
  growth.gainExperience(player, Number.MAX_SAFE_INTEGER);
  assert.equal(player.level, 99);
  assert.equal(player.experience, 0);
  assert.equal(player.skillPoints, 98);
  assert.equal(growth.experienceToNextLevel(99), 0);
  assert.equal(growth.maxHp(99), 1080);
  const snapshot = JSON.stringify(player);
  assert.deepEqual(plain(growth.gainExperience(player, 100)), { gained: 0, levels: 0, hpGained: 0 });
  assert.equal(JSON.stringify(player), snapshot);
});

test("stat caps do not consume points for ineffective upgrades", () => {
  const player = growth.restore({ totalExperience: Number.MAX_SAFE_INTEGER });
  for (let i = 0; i < 8; i++) assert.equal(growth.upgrade(player, "agility"), true);
  const remaining = player.skillPoints;
  assert.equal(growth.upgrade(player, "agility"), false);
  assert.equal(player.skillPoints, remaining);
  const attackPlayer = growth.restore({ totalExperience: Number.MAX_SAFE_INTEGER });
  for (let i = 0; i < 98; i++) assert.equal(growth.upgrade(attackPlayer, "attack"), true);
  assert.equal(attackPlayer.stats.attack, 99);
  assert.equal(growth.upgrade(attackPlayer, "attack"), false);
});
