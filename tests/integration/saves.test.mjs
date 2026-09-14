import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../helpers/game.mjs";

const legacyKey = "into-the-typing.player.v2";
const slotKey = index => "into-the-typing.slot." + (index + 1) + ".v1";
const fresh = saved => createGame(saved || {}, { chooseSave: false, touch: true });

function newPlayer(game, index, name) {
  game.run("showSaveMenu('new'); selectSaveSlot(" + index + "); saveEls.name.value = " + JSON.stringify(name) + "; createPlayerSave()");
}

test("launch requires New or Continue and a named save before battle can start", () => {
  const game = fresh();
  assert.equal(game.run("activeSaveSlot"), null);
  assert.equal(game.run("els.introStartButton.textContent"), "初めから");
  assert.equal(game.run("saveEls.continueButton.disabled"), true);
  assert.deepEqual(game.saved(), {});
  game.run("startGame(); showStageSelect()");
  assert.equal(game.run("state.running"), false);
  assert.equal(game.run("document.documentElement.dataset.screen"), "start");
  newPlayer(game, 0, "  ");
  assert.equal(game.run("activeSaveSlot"), null);
  assert.equal(game.run("saveEls.error.textContent"), "名前を1〜20文字で入力してください");
  assert.deepEqual(game.saved(), {});
  game.run("saveEls.name.value='あいうえおかきくけこさしすせそたちつてとな'; createPlayerSave()");
  assert.equal(game.run("activeSaveSlot"), null);
  newPlayer(game, 0, "  あおい  ");
  assert.equal(game.run("state.playerName"), "あおい");
  assert.equal(game.run("document.documentElement.dataset.screen"), "stage");
  assert.equal(JSON.parse(game.saved()[slotKey(0)]).name, "あおい");
  assert.equal(game.run("state.level"), 1);
  assert.equal(game.run("state.ironSwordObtained"), false);
  game.run("showStartScreen()");
  assert.equal(game.run("saveEls.continueButton.disabled"), false);
});

test("three named saves keep progress, equipment and points separate through reload", () => {
  const game = fresh();
  for (const [index, name, xp] of [[0,"あおい",40],[1,"そら",110],[2,"ひかり",350]]) {
    newPlayer(game,index,name);
    assert.equal(game.run("state.totalExperience"),0);
    game.run("progression.gainExperience(state," + xp + "); state.introCompleted=true; state.equipmentTutorialCompleted=true; state.ironSwordObtained=true; state.weaponId='sword'; savePlayerProgress(); showStartScreen()");
  }
  const saved = game.saved();
  assert.equal(Object.keys(saved).length,3);
  const reloaded = fresh(saved);
  for (const [index, name, xp] of [[2,"ひかり",350],[0,"あおい",40],[1,"そら",110]]) {
    reloaded.run("showSaveMenu('continue'); selectSaveSlot(" + index + ")");
    assert.equal(reloaded.run("state.playerName"),name);
    assert.equal(reloaded.run("state.totalExperience"),xp);
    assert.equal(reloaded.run("state.weaponId"),"sword");
    assert.equal(reloaded.run("isStageAvailable('mist_road')"),true);
    reloaded.run("showStartScreen()");
  }
  assert.deepEqual(reloaded.saved(),saved);
});

test("choosing an occupied slot never erases it until named overwrite is submitted", () => {
  const game = fresh();
  newPlayer(game,0,"あおい");
  game.run("progression.gainExperience(state,350); savePlayerProgress(); showStartScreen()");
  newPlayer(game,1,"そら");
  const saved=game.saved();
  game.run("showStartScreen(); showSaveMenu('new'); selectSaveSlot(0)");
  assert.equal(game.run("saveEls.overwrite.hidden"),false);
  assert.equal(game.run("saveEls.submit.textContent"),"上書きしてはじめる");
  assert.deepEqual(game.saved(),saved);
  game.run("showSaveMenu('new'); showStartScreen()");
  assert.deepEqual(game.saved(),saved);
  newPlayer(game,0,"新しい冒険");
  assert.equal(game.run("state.totalExperience"),0);
  assert.equal(game.run("state.weaponId"),"branch");
  assert.equal(game.saved()[slotKey(1)],saved[slotKey(1)]);
  const reloaded=fresh(game.saved());
  reloaded.run("showSaveMenu('continue'); selectSaveSlot(0)");
  assert.equal(reloaded.run("state.playerName"),"新しい冒険");
  assert.equal(reloaded.run("state.totalExperience"),0);
});

test("the legacy save is imported once into slot 1 while its original is kept", () => {
  const legacy = JSON.stringify({version:2,totalExperience:350,stats:{attack:3,agility:2},weaponId:"greatsword",introCompleted:true,equipmentTutorialCompleted:true});
  const game = fresh({[legacyKey]:legacy});
  assert.equal(game.saved()[legacyKey],legacy);
  game.run("showSaveMenu('continue'); selectSaveSlot(0)");
  assert.equal(game.run("state.playerName"),"プレイヤー1");
  assert.equal(game.run("state.totalExperience"),350);
  assert.equal(game.run("state.weaponId"),"greatsword");
  assert.deepEqual(game.snapshot("state.stats"),{attack:3,agility:2});
  newPlayer(game,0,"やり直し");
  const reloaded=fresh(game.saved());
  reloaded.run("showSaveMenu('continue'); selectSaveSlot(0)");
  assert.equal(reloaded.run("state.totalExperience"),0);
  assert.equal(reloaded.run("state.playerName"),"やり直し");
  assert.equal(reloaded.saved()[legacyKey],legacy);
});

test("failed storage writes cannot erase an occupied slot or start an unsaved player", () => {
  const game=fresh();
  newPlayer(game,0,"あおい");
  const before=game.saved();
  game.run("showStartScreen(); window.localStorage.setItem=()=>{throw new Error('full')}");
  newPlayer(game,0,"上書き");
  assert.equal(game.run("activeSaveSlot"),null);
  assert.equal(game.run("document.documentElement.dataset.screen"),"saves");
  assert.equal(game.run("saveEls.error.textContent"),"保存できませんでした。もう一度お試しください");
  assert.deepEqual(game.saved(),before);
});

test("corrupt slots cannot continue and stay untouched until an explicit overwrite", () => {
  const corrupt='not valid json';
  const game=fresh({[slotKey(0)]:corrupt});
  game.run("showSaveMenu('continue'); selectSaveSlot(0)");
  assert.equal(game.run("activeSaveSlot"),null);
  assert.equal(game.saved()[slotKey(0)],corrupt);
  game.run("showSaveMenu('new'); selectSaveSlot(0)");
  assert.equal(game.run("saveEls.overwrite.hidden"),false);
  assert.equal(game.saved()[slotKey(0)],corrupt);
  game.run("saveEls.name.value='復帰'; createPlayerSave()");
  assert.equal(game.run("state.playerName"),"復帰");
});

test("switching players cancels pending tutorial attacks and native input from the previous player", () => {
  const game=fresh();
  newPlayer(game,0,"あおい");
  game.run("startGame(); advanceStory(); handleFlickCompositionStart(); els.flickInput.value='あ'; handleFlickInput({isComposing:true})");
  newPlayer(game,1,"そら");
  game.run("startGame(); advanceStory(); handleFlickCompositionEnd()");
  game.advance(1000);
  assert.equal(game.run("getCurrentEnemy().tutorial.punches"),0);
  assert.equal(game.run("state.playerName"),"そら");
  assert.equal(game.run("state.totalExperience"),0);
  assert.equal(game.run("flickState.completedInput"),null);
});

test("a concurrently updated slot is not overwritten by stale selection or autosave", () => {
  const game=fresh();
  newPlayer(game,0,"あおい");
  game.run("showStartScreen(); showSaveMenu('new'); selectSaveSlot(0); saveSlots.write(0,'別の画面',playerProgressSnapshot(loadPlayerProgress())); saveEls.name.value='上書き'; createPlayerSave()");
  assert.equal(game.run("activeSaveSlot"),null);
  assert.match(game.run("saveEls.error.textContent"),/選び直して/);
  game.run("showSaveMenu('continue'); selectSaveSlot(0); saveSlots.write(0,'さらに更新',playerProgressSnapshot(loadPlayerProgress())); savePlayerProgress()");
  assert.equal(game.run("progressionSaveAvailable"),false);
  assert.equal(JSON.parse(game.saved()[slotKey(0)]).name,"さらに更新");
});

test("names wait for composition to finish and typing in the form cannot start a battle", () => {
  const game=fresh();
  game.run("showSaveMenu('new'); selectSaveSlot(0); saveEls.name.value='あおい'; saveMenuState.nameComposing=true; createPlayerSave()");
  assert.equal(game.run("activeSaveSlot"),null);
  game.run("let prevented=false; handleTypingKeydown({target:{closest:()=>saveEls.name},key:' ',code:'Space',preventDefault(){prevented=true}})");
  assert.equal(game.run("prevented"),false);
  assert.equal(game.run("document.documentElement.dataset.screen"),"saves");
  game.run("saveMenuState.nameComposing=false; createPlayerSave()");
  assert.equal(game.run("state.playerName"),"あおい");
});

test("an unfinished composition from another player cannot block the newly selected save", () => {
  const game=fresh();
  newPlayer(game,0,"あおい");
  game.run("state.introCompleted=true; state.equipmentTutorialCompleted=true; state.ironSwordObtained=true; state.weaponId='sword'; savePlayerProgress(); startGame('mist_road')");
  game.advance(850);
  game.run("handleFlickCompositionStart()");
  assert.equal(game.run("flickState.composing"),true);
  newPlayer(game,1,"そら");
  assert.equal(game.run("flickState.composing"),false);
  game.run("startGame(); advanceStory(); els.flickInput.value='あ'; handleFlickInput({isComposing:false,inputType:'insertText',data:'あ'})");
  assert.equal(game.run("getCurrentEnemy().tutorial.punches"),1);
});
