const skillGaugeSettings = { max: 100, gainPerCharacter: 4 };
const defaultSkillId = "power_strike";
const skillDefinitions = {
  healing_light: { id: "healing_light", name: "癒しの光", target: "self", gainPerCharacter: 2, effects: [{ type: "heal", fraction: 0.3 }], durationMs: 650 },
  power_strike: {
    id: "power_strike",
    name: "強撃",
    target: "allEnemies",
    effects: [{ type: "damage", multiplier: 3 }],
    durationMs: 420,
  },
};
