import test from "node:test";
import assert from "node:assert/strict";
import { simulate } from "../../helpers/swarmBalance.mjs";

test("2-2 remains clearable with the iron sword at a relaxed two keys per second", () => {
  for (const seed of [1, 2, 3]) assert.equal(simulate("flower_meadow", "sword", 500, seed).clear, true);
});

for (const touch of [false, true]) {
  test(`slower 2-3 bees remain manageable with dual blades at the same ${touch ? "kana" : "keyboard"} pace, including skills`, () => {
    // Five roman keys/s or about three kana/s, with automatic use of a full skill gauge.
    for (const seed of [1, 2, 3]) {
      const interval = touch ? 350 : 200;
      const iron = simulate("swarm_meadow", "sword", interval, seed, touch);
      const dual = simulate("swarm_meadow", "dualBlades", interval, seed, touch);
      assert.equal(dual.clear, true, JSON.stringify(dual));
      assert.equal(dual.kills, 13);
      assert.ok(dual.hp > 0);
      assert.ok(dual.hp >= iron.hp);
      if (iron.clear) assert.ok(dual.time < iron.time, JSON.stringify({ iron, dual }));
    }
  });
}
