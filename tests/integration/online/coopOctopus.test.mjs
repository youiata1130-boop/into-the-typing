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
      const profile=C.attackProfile(C.wordFor(match,W,p.index,seat),p.mode,p.value,p.weaponId);
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

test("octopus physical attacks hit only one living ally while only slow targets the whole party", () => {
  for (const difficulty of ["easy", "normal", "hard"]) for (const count of [2, 4]) for (const roll of [0, .99]) {
    const g=battle({difficulty,count});
    g.run(`const fallen=match.players.at(-1);fallen.hp=0;
      const physicalSources=new Set();let spells=0;
      for(let now=3050;now<=40000;now+=50){
        const before=match.players.map(p=>p.hp),casts=boss.attacks;
        const hitting=C.attacksFor(match).filter(a=>a.kind==='single'&&a.hitsAt<=now);
        C.tick(match,W,now,()=>${roll});
        const damaged=match.players.filter((p,i)=>p.hp<before[i]);
        if(damaged.length>1)throw Error('physical attack hit multiple allies');
        if(damaged.length&&!hitting.some(a=>a.targets.length===1&&a.targets[0]===damaged[0].id))throw Error('wrong physical target');
        for(const a of C.attacksFor(match)){
          if(a.source==='body'){
            if(a.kind!=='slow'||a.targets.length!==${count}-1)throw Error('body must slow all living allies');
          }else{
            if(a.kind!=='single'||a.targets.length!==1)throw Error('tentacle must attack one ally');
            physicalSources.add(a.source);
          }
          if(a.targets.includes(fallen.id))throw Error('targeted a fallen ally');
        }
        if(boss.attacks>casts){
          spells++;
          if(!match.players.filter(p=>p.hp>0).every(p=>p.slowFrom===1&&p.slowUntil===3))throw Error('slow missed a living ally');
          if(fallen.slowUntil!==0)throw Error('slow affected a fallen ally');
        }
        if(!C.validSnapshot(C.snapshot(match),W))throw Error('invalid attack snapshot');
        match.players.filter(p=>p.hp>0).forEach(p=>p.hp=p.maxHp);
      }`);
    assert.deepEqual(g.snapshot('[...physicalSources].sort()'),['left','right']);
    assert.ok(g.run('spells')>=2);
  }
});

test("tentacles alternate without overlapping warnings at every difficulty and keep their damage", () => {
  for (const [difficulty, interval, warning, damage] of [
    ["easy",3333,1800,46], ["normal",2500,1500,70], ["hard",1833,1100,105],
  ]) {
    const g = battle({difficulty});
    assert.equal(g.run("boss.tentacles[1].nextAttackAt"),null);
    assert.equal(g.run("boss.tentacles[0].nextAttackAt"), 3000+interval-warning);
    g.run("C.tick(match,W,boss.tentacles[0].nextAttackAt,()=>0)");
    assert.equal(g.run("C.snapshot(match).boss.tentacles[0].attack.remainingMs"), warning);
    assert.equal(g.run("C.validSnapshot(C.snapshot(match),W)"), true);
    g.run(`C.tick(match,W,${3000+interval-1},()=>0)`);
    assert.equal(g.run("p.hp"), 1000);
    g.run(`C.tick(match,W,${3000+interval},()=>0)`);
    assert.equal(g.run("p.hp"), 1000-damage);
    assert.equal(g.run("boss.tentacles[0].nextAttackAt"),null);
    assert.equal(g.run("boss.tentacles[1].nextAttackAt"), 3000+2*interval-warning);
    for (let turn=1;turn<=4;turn++) {
      const id=turn%2?'right':'left';
      g.run(`C.tick(match,W,C.enemyFor(match,'${id}').nextAttackAt,()=>0)`);
      assert.deepEqual(g.snapshot("boss.tentacles.filter(t=>t.attack).map(t=>t.id)"),[id]);
      assert.equal(g.run("C.validSnapshot(C.snapshot(match),W)"),true);
      g.run(`C.tick(match,W,C.enemyFor(match,'${id}').attack.hitsAt,()=>0)`);
      assert.equal(g.run("p.hp"),1000-(turn+1)*damage);
    }
  }
});

test("tentacles attack faster than the body, sword attacks wilt them, and a body kill ends regeneration", () => {
  const g=battle();
  g.run("C.tick(match,W,boss.tentacles[0].nextAttackAt,()=>0)");
  assert.equal(g.run("boss.attack"),null);
  assert.equal(g.run("boss.tentacles[0].attack.kind"),'single');
  assert.equal(g.run("boss.tentacles[1].attack"),null);
  g.run(`quiet();const left=boss.tentacles[0];left.hp=1;hit('left');select('body')`);
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

test("a wilt hands the turn to the surviving tentacle; revival does not reset or overlap its pending attack", () => {
  const g=battle();
  g.run(`const left=boss.tentacles[0],right=boss.tentacles[1];C.tick(match,W,left.nextAttackAt,()=>0);
    boss.attack={kind:'slow',targets:match.players.map(p=>p.id),hitsAt:match.clockNow+3000};
    left.hp=1;p.weaponId='greatsword';p.skillGauge=100;
    C.useSkill(match,W,0,{match:match.id,seq:1},match.clockNow);`);
  assert.equal(g.run("left.attack"),null);
  assert.equal(g.run("boss.attack"),null);
  assert.equal(g.run("right.nextAttackAt"),g.run("match.clockNow+1000"));
  for(let turn=0;turn<2;turn++) {
    g.run("C.tick(match,W,right.nextAttackAt,()=>0)");
    assert.deepEqual(g.snapshot("boss.tentacles.filter(t=>t.attack).map(t=>t.id)"),["right"]);
    g.run("C.tick(match,W,right.attack.hitsAt,()=>0)");
  }
  g.run("const scheduled=right.nextAttackAt;C.tick(match,W,boss.regrowth.revivesAt,()=>0)");
  assert.equal(g.run("left.hp"),g.run("left.maxHp"));
  assert.equal(g.run("left.nextAttackAt"),null);
  assert.equal(g.run("right.attack.hitsAt"),g.run("scheduled+1500"));
  assert.equal(g.run("boss.nextAttackAt"),g.run("match.clockNow+8000"));
  g.run("C.tick(match,W,right.attack.hitsAt,()=>0);C.tick(match,W,left.nextAttackAt,()=>0)");
  assert.deepEqual(g.snapshot("boss.tentacles.filter(t=>t.attack).map(t=>t.id)"),["left"]);
  assert.equal(g.run("C.validSnapshot(C.snapshot(match),W)"),true);
});

test("wilting the waiting tentacle preserves the other arm's windup; late frames never produce two attacks", () => {
  const g=battle();
  g.run(`const left=boss.tentacles[0],right=boss.tentacles[1];
    C.tick(match,W,left.nextAttackAt,()=>0);C.tick(match,W,left.attack.hitsAt,()=>0);C.tick(match,W,right.nextAttackAt,()=>0);
    const hitAt=right.attack.hitsAt;left.hp=1;p.weaponId='greatsword';p.skillGauge=100;
    C.useSkill(match,W,0,{match:match.id,seq:1},match.clockNow);`);
  assert.equal(g.run("right.attack.hitsAt"),g.run("hitAt"));
  assert.equal(g.run("left.nextAttackAt"),null);
  g.run("C.tick(match,W,60000,()=>0)");
  assert.ok(g.run("boss.tentacles.filter(t=>t.attack).length")<=1);
  assert.equal(g.run("C.validSnapshot(C.snapshot(match),W)"),true);
});

test("slowing and pausing retain the alternating order, while snapshots reject simultaneous tentacle attacks and physical body attacks", () => {
  const g=battle();
  g.run(`p.weaponId='dualBlades';p.skillGauge=100;const turns=[];let previous=0;
    for(let now=3050;now<=26000;now+=50){
      if(now===4500)C.useSkill(match,W,0,{match:match.id,seq:1},now);
      match.players.forEach(p=>p.hp=p.maxHp);C.tick(match,W,now,()=>0);
      if(boss.tentacles.filter(t=>t.attack).length>1)throw Error('overlapping windups');
      const total=boss.tentacles.reduce((sum,t)=>sum+t.attacks,0);
      if(total>previous){turns.push(boss.tentacles.find(t=>t.attacks>(turns.filter(id=>id===t.id).length)).id);previous=total;}
      if(!C.validSnapshot(C.snapshot(match),W))throw Error('invalid alternating state');
    }`);
  assert.ok(g.run("turns.length")>=8);
  assert.equal(g.run("turns.every((id,i)=>id===(i%2?'right':'left'))"),true);
  g.run("const bot=N.create(match,{weaponId:'sword',speed:1});const before=C.snapshot(match);const paused=match.clockNow;N.resume(bot,match,paused,paused+60000)");
  assert.deepEqual(g.snapshot("C.snapshot(match)"),g.snapshot("before"));
  for(const edit of [
    "s.boss.tentacles.forEach(t=>t.attack={kind:'single',targets:[s.players[0].id],remainingMs:500})",
    "s.boss.attack={kind:'single',targets:[s.players[0].id],remainingMs:500}",
    "s.boss.attack={kind:'all',targets:s.players.map(p=>p.id),remainingMs:500}",
    "s.boss.attack={kind:'slow',targets:s.players.map(p=>p.id),remainingMs:4001}",
  ])assert.equal(g.run(`(()=>{const s=C.snapshot(match);${edit};return C.validSnapshot(s,W)})()`),false,edit);
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
