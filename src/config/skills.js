const skillGaugeSettings = { max: 100, gainPerCharacter: 4 };
const defaultSkillId = "power_strike";
const skillDefinitions = {
  battle_spirit: { id: "battle_spirit", name: "戦意高揚", target: "playerBuff", effects: [{ type: "attackBoost", multiplier: 1.5, durationMs: 8000 }], durationMs: 0 },
  time_stop: { id: "time_stop", name: "時止め", target: "battle", effects: [{ type: "stopActions", durationMs: 5000 }], durationMs: 0 },
  mind_eye: { id: "mind_eye", name: "心眼", target: "counterBuff", gainPerCharacter: 3, effects: [{ type: "freeCounter", durationMs: 8000 }], durationMs: 0 },
  power_strike: {
    id: "power_strike",
    name: "強撃",
    target: "allEnemies",
    effects: [{ type: "damage", multiplier: 3 }],
    durationMs: 420,
  },
};
