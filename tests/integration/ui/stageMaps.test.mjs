import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../../helpers/game.mjs";

const progress = {
  version: 2, totalExperience: 255, stats: { attack: 2, agility: 1 },
  weaponId: "greatsword", introCompleted: true, equipmentTutorialCompleted: true,
  ironSwordObtained: true, greatswordObtained: true, skillTutorialCompleted: true,
  clearedStages: ["forest_path", "mist_road", "sky_castle", "storm_cove"],
};
function setup(saved = {}) {
  const game = createGame(saved);
  game.run(`
    const mapButtons = Object.keys(stageDefinitions).map(id => {
      const button = document.createElement("button");
      button.dataset.stage = id;
      return button;
    });
    const regionButtons = Object.keys(stageMapRegions).map(id => {
      const button = document.createElement("button");
      button.dataset.region = id;
      return button;
    });
    els.stageChoices.querySelectorAll = () => mapButtons;
    els.stageRegionSwitch.querySelectorAll = () => regionButtons;
    showStageSelect();
  `);
  return game;
}
const visibleStages = game => game.snapshot('mapButtons.filter(button => !button.hidden).map(button => button.dataset.stage)');

test("new players see the seaside and previewing grassland does not unlock its stage", () => {
  const game = setup();
  assert.equal(game.run('els.stageMapImage.getAttribute("src")'), "src/assets/images/backgrounds/stage_map/coast.jpg");
  assert.deepEqual(visibleStages(game), progress.clearedStages);
  game.run('showStageConfirm("forest_path"); switchStageMap("grassland")');
  assert.deepEqual(visibleStages(game), ["grassland_path", "flower_meadow", "swarm_meadow"]);
  assert.equal(game.run("els.stageConfirm.hidden"), true);
  assert.equal(game.run("state.pendingStageId"), "");
  assert.equal(game.run("mapButtons.at(-1).disabled"), true);
  assert.equal(game.run('regionButtons.find(button => button.dataset.region === "grassland").getAttribute("aria-pressed")'), "true");
  game.run('showStageConfirm("grassland_path"); startConfirmedStage()');
  assert.equal(game.run("state.running"), false);
  game.run('switchStageMap("coast"); switchStageMap("unknown")');
  assert.deepEqual(visibleStages(game), progress.clearedStages);
});

test("forest preview stays locked until 2-3 is cleared and old clears open 3-1", () => {
  const locked = setup();
  locked.run('switchStageMap("forest"); showStageConfirm("mushroom_forest"); startConfirmedStage()');
  assert.deepEqual(visibleStages(locked), ["mushroom_forest", "spore_path", "fairy_forest", "thorn_depths"]);
  assert.equal(locked.run("state.running"), false);
  assert.equal(locked.run('mapButtons.find(button => button.dataset.stage === "mushroom_forest").disabled'), true);
  const game = setup({ "into-the-typing.player.v2": JSON.stringify({
    ...progress, clearedStages: [...progress.clearedStages, "grassland_path", "flower_meadow", "swarm_meadow"],
  }) });
  assert.equal(game.run("state.stageMapRegionId"), "forest");
  assert.deepEqual(visibleStages(game), ["mushroom_forest", "spore_path", "fairy_forest", "thorn_depths"]);
  assert.equal(game.run("getHighestAvailableStageCode()"), "3-1");
  game.run('startGame("swarm_meadow"); state.cleared = state.roundLimit; finishGame(true)');
  assert.equal(game.run("els.noticeButton.textContent"), "ステージ3-1へ");
  game.run("continueAfterResult()");
  assert.equal(game.run("state.stageId"), "mushroom_forest");
});

test("3-2 remains locked until 3-1 is cleared and opens for existing forest clears", () => {
  const stages = [...progress.clearedStages, "grassland_path", "flower_meadow", "swarm_meadow"];
  const locked = setup({ "into-the-typing.player.v2": JSON.stringify({ ...progress, clearedStages: stages }) });
  locked.run('showStageConfirm("spore_path"); startConfirmedStage(); startGame("spore_path")');
  assert.equal(locked.run("state.running"), false);
  assert.equal(locked.run('mapButtons.find(button => button.dataset.stage === "spore_path").disabled'), true);
  assert.match(locked.run('mapButtons.find(button => button.dataset.stage === "spore_path").getAttribute("aria-label")'), /3-1未クリア/);
  const game = setup({ "into-the-typing.player.v2": JSON.stringify({ ...progress, clearedStages: [...stages, "mushroom_forest"] }) });
  assert.equal(game.run("state.stageMapRegionId"), "forest");
  assert.equal(game.run("getHighestAvailableStageCode()"), "3-2");
  assert.equal(game.run('mapButtons.find(button => button.dataset.stage === "spore_path").disabled'), false);
  game.run('showStageConfirm("spore_path"); startConfirmedStage()');
  assert.equal(game.run("state.stageId"), "spore_path");
  assert.equal(game.run("state.running"), true);
  game.run("showStageSelect()");
  assert.equal(game.run("state.stageMapRegionId"), "forest");
});

test("entering grassland selects its map and replaying a coastal stage returns to the seaside", () => {
  const game = setup({ "into-the-typing.player.v2": JSON.stringify(progress) });
  assert.equal(game.run("state.stageMapRegionId"), "grassland");
  game.run('startGame("storm_cove"); state.cleared = state.roundLimit; finishGame(true); continueAfterResult()');
  assert.equal(game.run("state.stageId"), "grassland_path");
  game.run("showStageSelect()");
  assert.equal(game.run("els.stageMapPanel.dataset.region"), "grassland");
  assert.deepEqual(visibleStages(game), ["grassland_path", "flower_meadow", "swarm_meadow"]);
  game.run('switchStageMap("coast"); showStageConfirm("mist_road"); startConfirmedStage(); showStageSelect()');
  assert.equal(game.run("els.stageMapPanel.dataset.region"), "coast");
  assert.deepEqual(visibleStages(game), progress.clearedStages);
});

test("3-3 requires 3-2, opens for older saved clears, and is reachable from the result", () => {
  const stages = [...progress.clearedStages, "grassland_path", "flower_meadow", "swarm_meadow", "mushroom_forest"];
  const game = setup({ "into-the-typing.player.v2": JSON.stringify({ ...progress, swordShieldObtained: true, clearedStages: stages }) });
  game.run('showStageConfirm("fairy_forest"); startConfirmedStage(); startGame("fairy_forest")');
  assert.equal(game.run("state.running"), false);
  assert.equal(game.run('mapButtons.find(button => button.dataset.stage === "fairy_forest").disabled'), true);
  game.run('startGame("spore_path"); state.cleared = state.roundLimit; finishGame(true)');
  assert.equal(game.run("els.noticeButton.textContent"), "ステージ3-3へ");
  game.run("continueAfterResult()");
  assert.equal(game.run("state.stageId"), "fairy_forest");
  const reloaded = setup(game.saved());
  assert.equal(reloaded.run("getHighestAvailableStageCode()"), "3-3");
  assert.equal(reloaded.run('mapButtons.find(button => button.dataset.stage === "fairy_forest").disabled'), false);
  reloaded.run('showStageConfirm("fairy_forest"); startConfirmedStage()');
  assert.equal(reloaded.run("state.running"), true);
});

test("map selection is restored from each save's progression without leaking between players", () => {
  const game = setup({ "into-the-typing.player.v2": JSON.stringify(progress) });
  game.run('switchStageMap("coast"); showHomeScreen(); showStageSelect()');
  assert.equal(game.run("state.stageMapRegionId"), "coast");
  game.run('activatePlayerSave(1, saveSlots.write(1, "新しい冒険", playerProgressSnapshot(loadPlayerProgress()), null)); showStageSelect()');
  assert.equal(game.run("state.stageMapRegionId"), "coast");
  game.run('activatePlayerSave(0); showStageSelect()');
  assert.equal(game.run("state.stageMapRegionId"), "grassland");
  assert.deepEqual(visibleStages(game), ["grassland_path", "flower_meadow", "swarm_meadow"]);
});
