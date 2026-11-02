import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createGame } from "../../helpers/game.mjs";

for (const touch of [false, true]) test(`plain sword has stronger normal attacks and no legacy skill or defense (${touch ? "kana" : "roman"})`, () => {
  const g = createGame({ "into-the-typing.player.v2": JSON.stringify({ version: 2, totalExperience: 1750,
    stats: { attack: 6, agility: 3 }, weaponId: "sword", skillId: "mind_eye", introCompleted: true,
    equipmentTutorialCompleted: true, ironSwordObtained: true, skillTutorialCompleted: true,
    clearedStages: ["forest_path", "mist_road", "sky_castle", "storm_cove", "grassland_path", "flower_meadow"] }) }, { touch });
  g.run('startGame("grassland_path")'); g.advance(850);
  g.run('const enemy=getCurrentEnemy();enemy.hp=enemy.maxHp=100;const hp=state.hp;addSuccessfulCharacters(100);updateHud()');
  assert.equal(g.run('getActiveSkill()'), null);
  assert.equal(g.run('state.specialGauge'), 0);
  assert.equal(g.run('els.skillPanel.hidden'), true);
  assert.equal(g.run('getPlayerAttackDamage(enemy)'), 9);
  g.run(`state.specialGauge=100;handleTypingKeydown({key:'Enter',code:'Enter',preventDefault(){}});
    els.specialButton.dispatchEvent({type:'click'});
    handleTypingKeydown({key:' ',code:'Space',preventDefault(){}})`);
  assert.equal(g.run('useSpecialMove()'), false);
  assert.equal(g.run('state.guarding'), false);
  assert.equal(g.run('enemy.hp'), 100);
  g.run('enemy.attackPower={min:10,max:10};setEnemyProgress(enemy,1);enemyAttack(enemy)');
  assert.equal(g.run('state.hp'), g.run('hp-10'));
  assert.equal(g.run('enemy.hp'), 100, 'no reflected damage');
  g.run('applyTypedValue(enemy,enemy.matchedWord)');
  assert.equal(g.run('enemy.hp'), 91);
  assert.equal(g.run('enemy.attackCountdownEl'), undefined);
});

for (const mode of ['roman', 'kana']) for (const cooperative of [false, true]) {
  test(`${cooperative ? 'coop' : 'duel'} ${mode}: host applies 50% sword damage and rejects skills, counters and forged energy`, () => {
    const g=createGame();
    g.run(`const D=window.ONLINE_DUEL,C=window.ONLINE_COOP,W=window.ONLINE_PLAY.words;
      const id='a'.repeat(24),order=W.map((_,i)=>i),cooperative=${cooperative};
      const m=cooperative?C.create(id,order,{id:'0'.repeat(24),name:'A',mode:'${mode}'}):D.create(id,order,['A','B'],['${mode}','${mode}'],{battleMode:'weapons'});
      if(cooperative){C.addPlayer(m,{id:'1'.repeat(24),name:'B',mode:'${mode}'});m.players.forEach((_,i)=>C.ready(m,i,true,m.settingsRevision));C.start(m,0,'giant',0,m.settingsRevision)}
      else {D.ready(m,0,0);D.ready(m,1,0)}
      const R=cooperative?C:D;R.tick(m,W,3000);
      const p=m.players[0],w=R.wordFor(m,W,0),target=D.targetFor(w,p.mode),before=cooperative?m.boss.hp:m.players[1].hp;
      R.acceptInput(m,W,0,{match:id,index:0,seq:1,value:target},3000);
      const profile=R.attackProfile(w,p.mode,target,p.weaponId);
      R.tick(m,W,3000+profile.inputMs);R.tick(m,W,p.attackAt);`);
    assert.equal(g.run('before-(cooperative?m.boss.hp:m.players[1].hp)'),g.run('target.length*6'));
    assert.equal(g.run('p.counterEnergy'),0);
    assert.equal(g.run('R.defense(m,W,0,{match:id,seq:1,action:"counter"},m.clockNow)'),false);
    assert.equal(g.run('R.validSnapshot(R.snapshot(m),W)'),true);
    g.run('p.counterEnergy=100');
    assert.equal(g.run('R.defense(m,W,0,{match:id,seq:1,action:"counter"},m.clockNow)'),false);
    assert.equal(g.run('R.validSnapshot(R.snapshot(m),W)'),false);
    g.run('p.counterEnergy=0');
    if(cooperative) {
      assert.equal(g.run('p.skillGauge'),0);
      g.run('p.skillGauge=100');
      assert.equal(g.run('C.useSkill(m,W,0,{match:id,seq:1},m.clockNow)'),false);
      assert.equal(g.run('p.skillsUsed'),0);
    }
  });
}

test('sword keeps its damage bonus under allied agility and enemy slow without acquiring a skill', () => {
  const g=createGame();
  g.run(`const D=window.ONLINE_DUEL,C=window.ONLINE_COOP,W=window.ONLINE_PLAY.words;
    const m=C.create('a'.repeat(24),W.map((_,i)=>i),{id:'0'.repeat(24),name:'A',mode:'roman'});
    C.addPlayer(m,{id:'1'.repeat(24),name:'B',mode:'kana'});m.stageId='octopus';`);
  for (const mode of ['roman','kana']) for (const slow of [false,true]) {
    g.run(`var p=m.players[0];p.mode='${mode}';p.index=1;p.agilityFrom=1;p.agilityUntil=3;p.slowFrom=${slow}?1:0;p.slowUntil=${slow}?3:0;
      var normal=D.wordFor(m,W,1),word=C.wordFor(m,W,1);`);
    assert.equal(g.run('C.attackProfile(word,p.mode,"",p.weaponId).damage'),g.run('D.targetFor(normal,p.mode).length*6'));
    assert.equal(g.run('C.skills.sword'),undefined);
  }
});

test('removed solo controls and numeric enemy cues are absent from the page', () => {
  const html=readFileSync(new URL('../../../index.html', import.meta.url),'utf8');
  assert.doesNotMatch(html,/id="counterButton"|mindEye\.js|coop(?:Boss|Left|Right|Body)Countdown/);
});
