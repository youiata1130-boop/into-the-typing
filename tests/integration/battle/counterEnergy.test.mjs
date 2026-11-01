import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../../helpers/game.mjs';

function versus(mode='roman') {
  const g=createGame();
  g.run(`const O=window.ONLINE_PLAY,D=window.ONLINE_DUEL,W=O.words;
    const m=D.create('0123456789abcdef01234567',W.map((_,i)=>i),['A','B'],['${mode}','${mode}'],{battleMode:'weapons',weapons:['sword','swordShield']});
    D.ready(m,0,0);D.ready(m,1,0);D.tick(m,W,3000);
    const p=m.players[0];
    const target=(seat=0)=>{const q=m.players[seat];return D.targetFor(D.wordFor(m,W,q.index,seat),q.mode,q.value)};
    const input=(value,seat=0,now=m.clockNow)=>{const q=m.players[seat];return D.acceptInput(m,W,seat,{match:m.id,index:q.index,seq:q.seq+1,value},now)};
    const counter=(now=m.clockNow)=>D.defense(m,W,0,{match:m.id,seq:p.defenseSeq+1,action:'counter'},now);
    function answer(seat=0){input(target(seat),seat);const q=m.players[seat],profile=D.attackProfile(D.wordFor(m,W,q.index,seat),q.mode,q.value);
      D.tick(m,W,Math.max(m.clockNow,q.openedAt+profile.inputMs));D.tick(m,W,q.attackAt)}
  `);
  return g;
}

for(const mode of ['roman','kana']) test(`${mode}: versus energy comes only from new correct characters and resets on rematch`,()=>{
  const g=versus(mode);
  assert.equal(g.run('p.counterEnergy'),0);assert.equal(g.run('counter()'),false);
  g.run('input(target().slice(0,1))');assert.equal(g.run('p.counterEnergy'),10);
  g.run('input("");input(target().slice(0,1));input("!!!")');assert.equal(g.run('p.counterEnergy'),10);
  g.run('while(p.counterEnergy<100)answer()');assert.equal(g.run('p.counterEnergy'),100);
  assert.equal(g.run('counter()'),true);
  g.run('D.tick(m,W,m.clockNow+400)');assert.equal(g.run('p.counterEnergy'),100);
  g.run('D.tick(m,W,m.clockNow+1)');assert.equal(g.run('p.counterEnergy'),50);
  g.run('D.tick(m,W,m.clockNow+2000)');assert.equal(g.run('counter()'),false);
  g.run('input(target().slice(0,1));input("");input(target().slice(0,1))');assert.equal(g.run('p.counterEnergy'),60);
  assert.equal(g.run('D.validSnapshot(D.snapshot(m),W)'),true);
  assert.equal(g.run('D.create(m.id,m.order,["A","B"],["roman","roman"],{battleMode:"weapons"}).players[0].counterEnergy'),0);
});

test('versus counter succeeds through 400ms, spends all ki, and otherwise spends half once',()=>{
  for(const elapsed of [0,200,399,400,401]){
    const g=versus();
    g.run(`input(target(1),1);const q=m.players[1],profile=D.attackProfile(D.wordFor(m,W,0,1),q.mode,q.value);
      D.tick(m,W,q.openedAt+profile.inputMs);const hitAt=q.attackAt;p.counterEnergy=100;counter(hitAt-${elapsed});D.tick(m,W,hitAt)`);
    assert.equal(g.run('p.counterEnergy'),elapsed<=400?0:50);
    assert.equal(g.run('p.counterHits'),elapsed<=400?1:0);
    assert.equal(g.run('p.hp===1000'),elapsed<=400);
    g.run('D.tick(m,W,m.clockNow+2000)');assert.equal(g.run('p.counterEnergy'),elapsed<=400?0:50);
  }
});

test('a delayed input settles an expired counter before adding new ki; forged meters are rejected',()=>{
  const g=versus();g.run('p.counterEnergy=100;counter();input(target().slice(0,1),0,m.clockNow+401)');
  assert.equal(g.run('p.counterEnergy'),60);
  for(const change of ['s.players[0].counterEnergy=-1','s.players[0].counterEnergy=101','s.players[0].counterEnergy=NaN',
    's.players[0].counterBestLength=41','s.players[0].counterBestLength=-1','s.players[1].counterEnergy=10',
    's.players[0].counterEnergy=50;s.players[0].countering=true']){
    assert.equal(g.run(`(()=>{const s=D.snapshot(m);${change};return D.validSnapshot(s,W)})()`),false,change);
  }
});

test('guest meters reflect both players and a guest cannot send an uncharged counter',()=>{
  const g=versus();g.run(`O.open();O.session.host=false;O.session.seat=0;O.session.remote={name:'B',mode:'roman',weaponId:'swordShield'};O.session.peer={destroy(){}};
    O.session.conn={open:true,send(){},close(){}};O.receive({type:'state',match:D.snapshot(m)});`);
  assert.equal(g.run('O.defense("counter")'),false);
  assert.equal(g.run('document.querySelector("#onlineSelfEnergyValue").textContent'),'気 0％');
  g.run('while(p.counterEnergy<100)answer();O.receive({type:"state",match:D.snapshot(m)})');
  assert.equal(g.run('document.querySelector("#onlineSelfEnergyValue").textContent'),'気 100％');
  assert.equal(g.run('document.querySelector("#onlineDefense").disabled'),false);
  g.run('counter();D.tick(m,W,m.clockNow+401);O.receive({type:"state",match:D.snapshot(m)})');
  assert.equal(g.run('document.querySelector("#onlineSelfEnergyValue").textContent'),'気 50％');
  assert.equal(g.run('document.querySelector("#onlineDefense").disabled'),true);
  assert.equal(g.run('document.querySelector("#onlineOtherEnergy").hidden'),true);
});

test('NPC sword builds ki by normal typing and cannot counter before it is full',()=>{
  const g=versus();g.run(`const N=window.ONLINE_NPC,config={weaponId:'sword',hp:1000,speed:3};
    const npcMatch=N.createMatch(m.id,m.order,'A','roman','swordShield',config),bot=N.create(npcMatch,config,()=>1);
    D.ready(npcMatch,0,0);D.ready(npcMatch,1,0);D.tick(npcMatch,W,3000);
    const npcCounter=()=>D.defense(npcMatch,W,1,{match:npcMatch.id,seq:1,action:'counter'},npcMatch.clockNow);`);
  assert.equal(g.run('npcCounter()'),false);
  g.run('for(let now=3000;now<10000;now+=50){N.step(bot,npcMatch,W,now);D.tick(npcMatch,W,now)}');
  assert.equal(g.run('npcMatch.players[1].counterEnergy'),100);
  assert.equal(g.run('npcCounter()'),true);
});

test('adventure flick counts confirmed kana, including pending voiced kana, without double charging',()=>{
  const g=createGame({'into-the-typing.player.v2':JSON.stringify({version:2,totalExperience:255,stats:{attack:2,agility:1},weaponId:'sword',introCompleted:true,equipmentTutorialCompleted:true,ironSwordObtained:true,skillTutorialCompleted:true,clearedStages:['forest_path','mist_road','sky_castle','storm_cove']})},{touch:true});
  g.run(`startGame('grassland_path')`);g.advance(850);
  g.run(`const e=getCurrentEnemy();e.word=e.matchedWord='ga'.repeat(20);e.inputs=[e.word];e.readingOverride=e.translation='が'.repeat(20);e.inputRevision++;renderWord();
    applyGameFlickKey('ka');`);
  assert.equal(g.run('playerCounter.energy'),0);
  g.run(`applyGameFlickKey('modifier');`);assert.equal(g.run('playerCounter.energy'),10);
  g.run(`for(let i=0;i<4;i++){applyGameFlickKey('ka');applyGameFlickKey('modifier')}`);
  assert.equal(g.run('playerCounter.energy'),50);
  g.run(`for(let i=0;i<5;i++){applyGameFlickKey('ka');applyGameFlickKey('modifier')}`);
  assert.equal(g.run('playerCounter.energy'),100);
  assert.equal(g.run('els.counterButton.disabled'),false);
});
