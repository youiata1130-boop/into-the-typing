import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function battle({ stage = "giant", mode = "roman", weapons = ["swordShield", "greatsword", "dualBlades", "sword"] } = {}) {
  const g = createGame();
  g.run(`const C=window.ONLINE_COOP,D=window.ONLINE_DUEL,N=window.COOP_NPC,W=window.ONLINE_PLAY.words;
    const m=C.create('a'.repeat(24),W.map((_,i)=>i),{id:'0'.repeat(24),name:'自分',mode:'${mode}'});
    for(let i=1;i<${weapons.length};i++)C.addPlayer(m,{id:String(i).repeat(24),name:'仲間'+i,mode:'${mode}'});
    ${JSON.stringify(weapons)}.forEach((w,i)=>C.chooseWeapon(m,i,w,m.settingsRevision));
    m.players.forEach((_,i)=>C.ready(m,i,true,m.settingsRevision));C.start(m,0,'${stage}',0,m.settingsRevision);C.tick(m,W,3000);
    function quiet(){[m.boss,...m.boss.tentacles||[]].forEach(e=>{e.attack=null;e.nextAttackAt=Infinity})}quiet();
    function cast(seat,now=m.clockNow){const p=m.players[seat];return C.useSkill(m,W,seat,{match:m.id,seq:p.skillSeq+1},now)}
    function input(seat,value,pending=false){const p=m.players[seat];return C.acceptInput(m,W,seat,{match:m.id,index:p.index,seq:p.seq+1,value,pending},m.clockNow)}
    function answer(seat){const p=m.players[seat],w=C.wordFor(m,W,p.index,seat),profile=C.attackProfile(w,p.mode);
      input(seat,D.targetFor(w,p.mode));C.tick(m,W,Math.max(m.clockNow,p.openedAt+profile.inputMs));C.tick(m,W,p.attackAt);return profile.damage;}
  `);
  return g;
}

test("skill gauge charges only unique correct input, caps at 100, and cannot be filled by erase or invalid packets", () => {
  for (const mode of ["roman", "kana"]) {
    const g = battle({mode});
    g.run("const p=m.players[0],word=C.wordFor(m,W,0),target=D.targetFor(word,p.mode);input(0,target[0]);input(0,'');input(0,target[0])");
    assert.equal(g.run("p.skillGauge"),2);
    assert.equal(g.run("input(0,'!')"),false);
    assert.equal(g.run("p.skillGauge"),2);
    g.run("input(0,'',true);input(0,target[0]);answer(0);const before=p.skillGauge;const next=D.targetFor(C.wordFor(m,W,p.index),p.mode);input(0,next[0])");
    assert.equal(g.run("p.skillGauge"),g.run("before+2"));
    g.run("p.skillGauge=99;answer(0)");assert.equal(g.run("p.skillGauge"),100);
    assert.equal(g.run("C.validSnapshot(C.snapshot(m),W)"),true);
  }
});

test("party agility keeps current prompts and partial input, shortens only the next two prompts, and keeps damage", () => {
  for (const mode of ["roman", "kana"]) {
    const g=battle({mode});
    g.run(`const p=m.players[1],current=C.wordFor(m,W,p.index,1),prefix=D.targetFor(current,p.mode)[0];input(1,prefix);
      m.players[0].skillGauge=100;cast(0);`);
    assert.equal(g.run("C.wordFor(m,W,p.index,1)===current"),true);
    assert.equal(g.run("p.value"),g.run("prefix"));
    assert.deepEqual(g.snapshot("m.players.map(p=>[p.agilityFrom,p.agilityUntil])"),[[1,3],[1,3],[1,3],[1,3]]);
    g.run("answer(1)");
    for (const index of [1,2]) {
      assert.equal(g.run("p.index"),index);
      g.run(`const normal${index}=D.wordFor(m,W,p.index,1),short${index}=C.wordFor(m,W,p.index,1)`);
      assert.equal(g.run(`D.targetFor(short${index},p.mode).length`),g.run(`D.targetFor(normal${index},p.mode).length-1`));
      assert.equal(g.run("C.validSnapshot(C.snapshot(m),W)"),true);
      assert.equal(g.run("answer(1)"),g.run(`D.attackProfile(normal${index},p.mode).damage`));
    }
    assert.equal(g.run("p.agilityUntil"),0);
    assert.equal(g.run("C.wordFor(m,W,p.index,1)===D.wordFor(m,W,p.index,1)"),true);
  }
});

test("agility remains bounded with all weapons, romaji variants and slow sentences; minimum prompts do not get shorter", () => {
  for (const mode of ["roman","kana"]) {
    const g=battle({mode,stage:"octopus"});
    for (let seat=0;seat<4;seat++) for (const slow of [false,true]) {
      g.run(`const p${seat}_${slow}=m.players[${seat}];`);
      g.run(`for(let i=1;i<100;i++){
        const p=m.players[${seat}];p.index=i;p.agilityFrom=i;p.agilityUntil=i+2;p.slowFrom=${slow}?i:0;p.slowUntil=${slow}?i+2:0;
        const base=D.wordFor(m,W,i,${seat}),short=C.wordFor(m,W,i,${seat});
        if(short.inputs.some(s=>s.length>80)||short.reading.length<2)throw Error('invalid short prompt');
        if(${slow}&&(!short.slow||short.reading.length<=base.reading.length||short.inputs.some(s=>s.length<=Math.max(...base.inputs.map(s=>s.length)))))throw Error('slow became a normal word');
        if(!${slow}&&D.targetFor(base,p.mode).length===2&&short!==base)throw Error('minimum prompt shortened');
      }`);
    }
  }
});

test("skills reject stale or forged uses, dead players, guarding, cooldowns and party stacking", () => {
  for (const weapon of ["swordShield","dualBlades","greatsword"]) {
    const g=battle({weapons:[weapon,weapon]});
    assert.equal(g.run("cast(0)"),false);
    g.run("m.players.forEach(p=>p.skillGauge=100)");
    for(const packet of ["{match:'old',seq:1}","{match:m.id,seq:0}","{match:m.id,seq:1.5}"])assert.equal(g.run(`C.useSkill(m,W,0,${packet},m.clockNow)`),false);
    g.run("m.players[0].guarding=true");assert.equal(g.run("cast(0)"),false);g.run("m.players[0].guarding=false");
    assert.equal(g.run("cast(0)"),true);assert.equal(g.run("m.players[0].skillGauge"),0);
    g.run("m.players[0].skillGauge=100");assert.equal(g.run("cast(0)"),false);
    if(["swordShield","dualBlades"].includes(weapon)) {
      assert.equal(g.run("cast(1)"),false);assert.equal(g.run("m.players[1].skillGauge"),100);
    }
    assert.equal(g.run("C.useSkill(m,W,0,{match:m.id,seq:1},24000)"),false);
    g.run("m.players[0].hp=0");assert.equal(g.run("cast(0,24000)"),false);
    assert.equal(g.run("cast(1,m.endsAt)"),false);
  }
});

test("dual blades slow every enemy clock by 15 percent for six seconds without stopping regeneration", () => {
  const g=battle({stage:"octopus"});
  g.run(`m.players[2].skillGauge=100;cast(2);m.boss.nextAttackAt=12000;
    m.boss.tentacles.forEach(e=>e.nextAttackAt=12000);
    C.tick(m,W,6000);C.defense(m,W,0,{match:m.id,seq:1,action:'guard-start'},6100);C.tick(m,W,9000);`);
  assert.equal(g.run("m.boss.nextAttackAt"),12900);
  assert.deepEqual(g.snapshot("m.boss.tentacles.map(e=>e.nextAttackAt)"),[12900,12900]);
  g.run("C.tick(m,W,10000)");assert.equal(g.run("m.boss.nextAttackAt"),12900);
  assert.equal(g.run("C.snapshot(m).skills.slowMs"),0);
  const hit=battle({stage:"octopus"});
  hit.run(`m.players[2].skillGauge=100;cast(2);m.boss.tentacles[0].attack={kind:'single',targets:[m.players[0].id],hitsAt:4000};
    for(let t=3050;t<=4000;t+=50)C.tick(m,W,t);`);
  assert.equal(hit.run("m.players[0].hp"),1000);
  assert.equal(hit.run("C.validSnapshot(C.snapshot(m),W)"),true);
  hit.run("for(let t=4050;t<=4200;t+=50)C.tick(m,W,t)");assert.equal(hit.run("m.players[0].hp"),930);
  hit.run("m.players[1].skillGauge=100;m.boss.tentacles[1].hp=1;cast(1);const revive=m.boss.regrowth.revivesAt;C.tick(m,W,revive)");
  assert.equal(hit.run("m.boss.tentacles[1].hp"),hit.run("m.boss.tentacles[1].maxHp"));
});


test("power strike damages each part once, preserves input, triggers wilt and regeneration, and can finish a fight", () => {
  const g=battle({stage:"octopus"});
  g.run("const p=m.players[1];input(1,D.targetFor(C.wordFor(m,W,0,1),p.mode)[0]);const value=p.value;p.skillGauge=100;m.boss.tentacles[0].hp=1;cast(1)");
  assert.equal(g.run("m.boss.hp"),1960);assert.equal(g.run("m.boss.tentacles[0].hp"),0);
  assert.equal(g.run("m.boss.tentacles[1].hp"),g.run("m.boss.tentacles[1].maxHp-40"));
  assert.equal(g.run("p.value"),g.run("value"));assert.equal(g.run("m.boss.regrowth.targetId"),"left");
  assert.equal(g.run("C.validSnapshot(C.snapshot(m),W)"),true);
  g.run("C.tick(m,W,23000);p.skillGauge=100;m.boss.hp=40;cast(1)");
  assert.equal(g.run("m.outcome"),"victory");assert.equal(g.run("C.validSnapshot(C.snapshot(m),W)"),true);
});

test("NPCs use the shortened prompt's windup", () => {
  for(const mode of ["roman","kana"]) {
    const g=battle({mode,weapons:["swordShield","greatsword"]});
    g.run(`m.players[0].skillGauge=100;cast(0);const p=m.players[1];p.index=1;
      const bot=N.create(m,{weaponId:'greatsword',speed:60},()=>1);
      const word=C.wordFor(m,W,1,1),profile=C.attackProfile(word,p.mode);
      for(let now=3000;!p.attacks&&now<6000;now+=50){N.step(bot,m,W,now);C.tick(m,W,now);if(!C.validSnapshot(C.snapshot(m),W))throw Error('invalid NPC windup')}`);
    assert.equal(g.run("p.attacks"),1);
    assert.equal(g.run("m.boss.hp"),g.run("1000-profile.damage"));
  }
});

test("skill snapshots expose relative clocks only and reject invalid skill states", () => {
  const g=battle();g.run("m.players[0].skillGauge=100;cast(0);const snap=C.snapshot(m)");
  assert.equal(g.run("'skillReadyAt' in snap.players[3] || 'mindEyeUntil' in snap.players[3] || 'slowUntil' in snap.skills"),false);
  for(const edit of ["s.skills=null","s.skills.slowMs=6001","s.skills.hasteWaitMs=-1","s.players[0].skillGauge=101",
    "s.players[0].skillBestLength=81","s.players[0].skillSeq=-1","s.players[3].skillGauge=1","s.players[3].skillsUsed=1",
    "s.players[0].agilityFrom=1;s.players[0].agilityUntil=4","s.players[0].countering=true","s.players[0].skillWaitMs=20001"]) {
    assert.equal(g.run(`(()=>{const s=C.snapshot(m);${edit};return C.validSnapshot(s,W)})()`),false,edit);
  }
});

test("NPCs use their equipped skills and pausing preserves effects, cooldowns and pending attack clocks", () => {
  for(const weapon of ["swordShield","dualBlades","greatsword"]) {
    const g=battle({weapons:["sword",weapon]});
    g.run(`const bot=N.create(m,{weaponId:'${weapon}',speed:1},()=>0);m.players[1].skillGauge=100;
      m.boss.attack={kind:'single',targets:[m.players[1].id],hitsAt:5000};N.step(bot,m,W,3000)`);
    assert.equal(g.run("m.players[1].skillsUsed"),1,weapon);
    g.run("const before=C.snapshot(m);N.resume(bot,m,3000,63000)");
    assert.deepEqual(g.snapshot("C.snapshot(m)"),g.snapshot("before"));
    assert.equal(g.run("C.validSnapshot(C.snapshot(m),W)"),true);
  }
});
