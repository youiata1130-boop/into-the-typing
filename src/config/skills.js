const skillGaugeSettings = { max: 100, gainPerCharacter: 4 };
const defaultSkillId = "power_strike";
const skillDefinitions = {
  power_strike: {
    id: "power_strike",
    name: "強撃",
    target: "allEnemies",
    effects: [{ type: "damage", multiplier: 3 }],
    durationMs: 420,
  },
};
