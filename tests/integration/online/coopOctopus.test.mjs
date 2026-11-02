import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function battle({ difficulty = "normal", count = 2, mode = "roman" } = {}) {
  const game = createGame();
  game.run(`const C=window.ONLINE_COOP,D=window.ONLINE_DUEL,N=window.COOP_NPC,W=window.ONLINE_PLAY.words;
    const match=C.create('a'.repeat(24),W.map((_,i)=>i),{id:'0'.repeat(24),name:'ホスト',mode:'${mode}'},'${difficulty}');
    for(let i=1;i<${count};i++)C.addPlayer(match,{id:String(i).repeat(24),name:'仲間',mode:'${mode}'});
    match.players.forEach((p,i)=>C.ready(match,i,true,match.settingsRevision));
    C.start(match,0,'octopus',0,match.settingsRevision);C.tick(match,W,3000);
    const boss=match.boss,p=match.players[0];
    function select(id,seat=0,changes={}){const p=match.players[seat];return C.chooseTarget(match,seat,
      {match:match.id,index:p.index,seq:p.targetSeq+1,targetId:id,...changes})}
    function input(value,seat=0,pending=false){const p=match.players[seat];return C.acceptInput(match,W,seat,
      {match:match.id,index:p.index,seq:p.seq+1,value,pending},match.clockNow)}
    function hit(id,seat=0){const p=match.players[seat];select(id,seat);
      input(D.targetFor(C.wordFor(match,W,p.index,seat),p.mode),seat);
      const profile=C.attackProfile(C.wordFor(match,W,p.index,seat),p.mode);
      C.tick(match,W,Math.max(match.clockNow,p.openedAt+profile.inputMs));C.tick(match,W,p.attackAt);return profile.damage;}
    function quiet(){[boss,...boss.tentacles].forEach(e=>{e.attack=null;e.nextAttackAt=Infinity})}
  `);
  return game;
}

test("octopus parts scale independently, target selection preserves prompts and locks after the first input including erase", () => {
  for (const difficulty of ["easy", "normal", "hard"]) for (const count of [2,4]) {
    const g=battle({difficulty,count});
    assert.equal(g.run("boss.tentacles.every(t=>t.maxHp===Math.ceil(boss.maxHp*8/60)&&t.hp===t.maxHp)"),true);
    g.run("const word=C.wordFor(match,W,0);select('right');select('body')");
    assert.equal(g.run("C.wordFor(match,W,0)===word"),true);
    for(const packet of ["{match:'b'.repeat(24)}","{index:1}","{seq:p.targetSeq}","{seq:1.2}","{targetId:'__proto__'}"]) {
      assert.equal(g.run(`select('left',0,${packet})`),false,packet);
    }
    g.run("input(D.targetFor(word,p.mode)[0]);input('')");
    assert.equal(g.run("p.value"),"");
    assert.equal(g.run("select('left')"),false);
    assert.equal(g.run("p.targetId"),"body");
    assert.equal(g.run("C.validSnapshot(C.snapshot(match),W)"),true);
    g.run("quiet();hit('body')");
    assert.equal(g.run("select('left')"),true);
    g.run("p.hp=0");assert.equal(g.run("select('right')"),false);
  }
  const kana=battle({mode:"kana"});
  kana.run("input('',0,true)");
  assert.equal(kana.run("select('right')"),false);
});

test("different players damage only their chosen part; an ally's wilt preserves in-flight typing and retargets", () => {
  const g=battle();
  g.run(`quiet();const hp=boss.maxHp;const left=boss.tentacles[0],right=boss.tentacles[1];
    const damage=hit('right');const leftDamage=hit('left',1);`);
  assert.equal(g.run("boss.hp"),g.run("hp"));
  assert.equal(g.run("right.hp"),g.run("right.maxHp-damage"));
  assert.equal(g.run("left.hp"),g.run("left.maxHp-leftDamage"));
  g.run(`select('left');const word=C.wordFor(match,W,p.index),prefix=D.targetFor(word,p.mode)[0];input(prefix);
    left.hp=1;hit('left',1);`);
  assert.equal(g.run("left.hp"),0);
  assert.equal(g.run("p.targetId"),"right");
  assert.equal(g.run("p.value"),g.run("prefix"));
  assert.equal(g.run("C.wordFor(match,W,p.index)===word"),true);
  assert.equal(g.run("select('body')"),false);
  assert.equal(g.run("select('left',1)"),false);
  g.run("const before=right.hp;const redirected=hit('body')");
  assert.equal(g.run("right.hp"),g.run("before-redirected"));
  assert.equal(g.run("boss.hp"),g.run("hp"));
});

test("wilt cancels the tentacle and body attacks; remaining tentacles keep attacking; regeneration revives one at a time", () => {
  const g=battle();
  g.run(`quiet();const left=boss.tentacles[0],right=boss.tentacles[1];left.hp=right.hp=1;
    const victim=match.players[1];
    left.attack={kind:'single',targets:[victim.id],hitsAt:8000};
    boss.attack={kind:'slow',targets:match.players.map(p=>p.id),hitsAt:8000};
    hit('left');const firstRevival=boss.regrowth.revivesAt;`);
  assert.equal(g.run("left.attack"),null);assert.equal(g.run("boss.attack"),null);
  assert.deepEqual(g.snapshot("boss.wiltedQueue"),["left"]);
  g.run(`right.attack={kind:'single',targets:[victim.id],hitsAt:match.clockNow+100};C.tick(match,W,match.clockNow+100)`);
  assert.equal(g.run("victim.hp"),930);
  assert.equal(g.run("victim.slowUntil"),0);
  g.run("hit('right')");
  assert.deepEqual(g.snapshot("boss.wiltedQueue"),["left","right"]);
  assert.equal(g.run("boss.regrowth.revivesAt"),g.run("firstRevival"));
  assert.equal(g.run("C.validSnapshot(C.snapshot(match),W)"),true);
  g.run("C.tick(match,W,firstRevival-1)");assert.equal(g.run("left.hp"),0);
  g.run("C.tick(match,W,firstRevival+10000)");
  assert.equal(g.run("left.hp"),g.run("left.maxHp"));assert.equal(g.run("right.hp"),0);
  assert.equal(g.run("boss.attack"),null);assert.equal(g.run("boss.nextAttackAt"),null);
  assert.equal(g.run("boss.regrowth.revivesAt"),g.run("match.clockNow+6000"));
  g.run("C.tick(match,W,boss.regrowth.revivesAt)");
  assert.equal(g.run("right.hp"),g.run("right.maxHp"));assert.equal(g.run("boss.regrowth"),null);
  assert.ok(g.run("boss.nextAttackAt>match.clockNow"));
  assert.equal(g.run("C.validSnapshot(C.snapshot(match),W)"),true);
});

test("every difficulty gives tentacles longer intervals and warnings with higher physical damage", () => {
  for (const [difficulty, interval, warning, damage] of [
    ["easy",3333,1800,46], ["normal",2500,1500,70], ["hard",1833,1100,105],
  ]) {
    const g = battle({difficulty});
    assert.equal(g.run("boss.tentacles[0].nextAttackAt"), 3000+interval-warning);
    g.run("C.tick(match,W,boss.tentacles[0].nextAttackAt,()=>0)");
    assert.equal(g.run("C.snapshot(match).boss.tentacles[0].attack.remainingMs"), warning);
    assert.equal(g.run("C.validSnapshot(C.snapshot(match),W)"), true);
    g.run(`C.tick(match,W,${3000+interval-1},()=>0)`);
    assert.equal(g.run("p.hp"), 1000);
    g.run(`C.tick(match,W,${3000+interval},()=>0)`);
    assert.equal(g.run("p.hp"), 1000-2*damage);
    assert.equal(g.run("boss.tentacles[0].nextAttackAt"), 3000+2*interval-warning);
  }
});

test("tentacles attack faster than the body, counters damage the attacker, and a body kill ends regeneration", () => {
  const g=battle();
  g.run("C.tick(match,W,boss.tentacles[0].nextAttackAt,()=>0)");
  assert.equal(g.run("boss.attack"),null);
  assert.equal(g.run("boss.tentacles.every(t=>t.attack.kind==='single')"),true);
  g.run(`quiet();select('body');p.counterEnergy=100;const left=boss.tentacles[0];left.hp=1;
    left.attack={kind:'single',targets:[p.id],hitsAt:4000};
    C.defense(match,W,0,{match:match.id,seq:1,action:'counter'},3900);C.tick(match,W,4000)`);
  assert.equal(g.run("left.hp"),0);assert.equal(g.run("p.hp"),1000);
  assert.equal(g.run("boss.hp"),1000);assert.equal(g.run("boss.regrowth.targetId"),"left");
  g.run("boss.hp=1;hit('body');const end=C.snapshot(match);C.tick(match,W,match.clockNow+10000)");
  assert.equal(g.run("match.outcome"),"victory");assert.equal(g.run("boss.regrowth"),null);
  assert.deepEqual(g.snapshot("boss.tentacles.map(t=>[t.hp,t.attack])"),[[0,null],[0,null]]);
  assert.equal(g.run("C.validSnapshot(C.snapshot(match),W)"),true);
  assert.deepEqual(g.snapshot("C.snapshot(match).boss"),g.snapshot("end.boss"));
});

test("snapshots reject malformed parts, targeting and regeneration, and expose only relative times", () => {
  const g=battle();
  g.run("quiet();boss.tentacles[1].hp=1;hit('right');const snap=C.snapshot(match)");
  assert.equal(g.run("C.validSnapshot(snap,W)"),true);
  assert.equal(g.run("JSON.stringify(snap).includes('revivesAt')||JSON.stringify(snap).includes('nextAttackAt')"),false);
  for (const edit of [
    "delete s.boss.tentacles", "s.boss.tentacles.reverse()", "s.boss.tentacles[0].hp=-1", "s.boss.tentacles[0].maxHp++",
    "s.boss.tentacles[1].attack={kind:'single',targets:[s.players[0].id],remainingMs:100}",
    "s.boss.tentacles[0].attack={kind:'all',targets:s.players.map(p=>p.id),remainingMs:100}",
    "s.boss.wiltedQueue=['left']", "s.boss.wiltedQueue=['right','right']", "s.boss.regrowth=null",
    "s.boss.regrowth.targetId='left'", "s.boss.regrowth.remainingMs=6001", "s.boss.regrowth.remainingMs=-1",
    "s.boss.attack={kind:'slow',targets:s.players.map(p=>p.id),remainingMs:100}",
    "s.players[0].targetId='right'", "s.players[0].targetSeq=-1", "s.players[0].targetLocked='false'",
  ]) assert.equal(g.run(`(()=>{const s=JSON.parse(JSON.stringify(snap));${edit};return C.validSnapshot(s,W)})()`),false,edit);
});

test("NPC selects vulnerable tentacles, guards their attacks and pauses all part and regeneration clocks", () => {
  const g=battle();
  g.run(`const npc=match.players[1];npc.weaponId='swordShield';const bot=N.create(match,{weaponId:'swordShield',speed:7},()=>0);
    boss.tentacles[1].hp=50;N.step(bot,match,W,3000);`);
  assert.equal(g.run("npc.targetId"),"right");
  g.run(`quiet();boss.tentacles[0].attack={kind:'single',targets:[npc.id],hitsAt:5000};
    N.step(bot,match,W,3500);N.step(bot,match,W,4650);C.tick(match,W,5000)`);
  assert.equal(g.run("npc.feedback"),"guard");assert.equal(g.run("npc.hp"),965);
  g.run("boss.tentacles[1].hp=1;hit('right');const before=C.snapshot(match);const paused=match.clockNow;N.resume(bot,match,paused,paused+60000)");
  assert.deepEqual(g.snapshot("C.snapshot(match).boss"),g.snapshot("before.boss"));
  g.run("C.tick(match,W,boss.regrowth.revivesAt-1)");assert.equal(g.run("boss.tentacles[1].hp"),0);
  g.run("C.tick(match,W,boss.regrowth.revivesAt)");assert.ok(g.run("boss.tentacles[1].hp>0"));
});
