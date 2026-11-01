import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function battle(weaponId = "swordShield", speed = 3, mode = "roman") {
  const game = createGame();
  game.run(`const C=window.ONLINE_COOP,D=window.ONLINE_DUEL,N=window.COOP_NPC,W=window.ONLINE_PLAY.words;
    const config=${JSON.stringify({weaponId, speed})};
    const match=C.create('a'.repeat(24),W.map((_,i)=>i).sort((a,b)=>W[b].reading.length-W[a].reading.length),
      {id:'0'.repeat(24),name:'あなた',mode:'${mode}'});
    C.addPlayer(match,{id:'1'.repeat(24),name:'NPC',mode:'${mode}'});
    C.chooseWeapon(match,1,config.weaponId,match.settingsRevision);
    match.players.forEach((p,i)=>C.ready(match,i,true,match.settingsRevision));
    C.start(match,0,'giant',0,match.settingsRevision);
    const bot=N.create(match,config,()=>1);
    function frame(now){N.step(bot,match,W,now);C.tick(match,W,now,()=>0)}
  `);
  return game;
}

test("NPC ally types at the selected speed in both input modes, after countdown only", () => {
  for (const mode of ["roman", "kana"]) for (const speed of [1, 3, 7, 20, 60]) {
    const game = battle("greatsword", speed, mode);
    game.run("for(let now=0;now<3000;now+=50)frame(now)");
    assert.equal(game.run("match.players[1].value"), "");
    const duration = speed >= 20 ? 100 : 1000;
    game.run(`for(let now=3000;now<=${3000 + duration};now+=50)frame(now)`);
    assert.equal(game.run("match.players[1].value.length"), speed * duration / 1000, `${mode}: ${speed}`);
    assert.deepEqual(game.snapshot("match.players.map(p=>p.hp)"), [1000, 1000]);
  }
});

test("all four NPC weapons attack the shared giant through normal input and attack timing", () => {
  for (const weapon of ["sword", "greatsword", "dualBlades", "swordShield"]) {
    const game = battle(weapon, 7), saved = game.saved();
    game.run(`frame(3000);const profile=D.attackProfile(D.wordFor(match,W,0,1),'roman');
      for(let now=3050;match.players[1].attacks===0&&now<9000;now+=50)frame(now)`);
    assert.equal(game.run("match.players[1].attacks"), 1, weapon);
    assert.ok(game.run("match.clockNow>=3000+profile.damage/4*(1000/7)+profile.windupMs"));
    assert.ok(game.run("match.clockNow<=3100+profile.damage/4*(1000/7)+profile.windupMs"));
    assert.equal(game.run("match.boss.hp"), game.run("1000-profile.damage"));
    assert.deepEqual(game.snapshot("match.players.map(p=>p.hp)"), [1000, 1000]);
    assert.equal(game.run("C.validSnapshot(C.snapshot(match),W)"), true);
    assert.deepEqual(game.saved(), saved);
  }
});

test("late frames never burst type, and dead or finished NPCs stop acting", () => {
  const game = battle("greatsword", 60);
  game.run("frame(3000);frame(8000)");
  assert.equal(game.run("match.players[1].value.length"), 3);
  game.run("match.players[1].hp=0;const seq=match.players[1].seq;frame(8500)");
  assert.equal(game.run("match.players[1].seq"), game.run("seq"));
  game.run("match.players[0].hp=0;frame(8600)");
  assert.equal(game.run("match.outcome"), "defeat");
  game.run("N.step(bot,match,W,10000)");
  assert.equal(game.run("match.players[1].seq"), game.run("seq"));
});

test("NPC guards only when targeted, for both single and party attacks, and can miss the warning", () => {
  for (const kind of ["single", "all"]) {
    const game = battle();
    game.run(`frame(3000);bot.random=()=>0;
      match.boss.attack={kind:'${kind}',targets:${kind === "all" ? "match.players.map(p=>p.id)" : "[match.players[1].id]"},hitsAt:6000};
      frame(3500);frame(5650)`);
    assert.equal(game.run("match.players[1].guarding"), true);
    game.run("frame(6000)");
    assert.deepEqual(game.snapshot("match.players.map(p=>p.hp)"), kind === "all" ? [920, 960] : [1000, 920]);
    assert.equal(game.run("match.players[1].feedback"), "guard");
    assert.equal(game.run("match.players[1].defenseCost"), 0);
  }
  for (const target of [0, 1]) {
    const game = battle();
    game.run(`frame(3000);bot.random=()=>${target ? 1 : 0};
      match.boss.attack={kind:'single',targets:[match.players[${target}].id],hitsAt:6000};frame(3500);frame(5650)`);
    assert.equal(game.run("match.players[1].guarding"), false);
  }
});

test("NPC sword needs counter energy, greatsword cannot guard mid-word, and dual blades cannot guard", () => {
  for (const energy of [0, 100]) {
    const game = battle("sword");
    game.run(`frame(3000);bot.random=()=>0;match.players[1].counterEnergy=${energy};
      match.boss.attack={kind:'single',targets:[match.players[1].id],hitsAt:6000};frame(3500);frame(5800);frame(6000)`);
    assert.equal(game.run("match.players[1].hp"), energy ? 1000 : 840);
    assert.equal(game.run("match.players[1].counterHits"), energy ? 1 : 0);
    if (energy) assert.equal(game.run("match.boss.hp"), 980);
  }
  for (const weapon of ["greatsword", "dualBlades"]) {
    const game = battle(weapon);
    game.run(`frame(3000);bot.random=()=>0;
      const p=match.players[1],target=D.targetFor(D.wordFor(match,W,0,1),'roman');
      C.acceptInput(match,W,1,{match:match.id,index:0,seq:1,value:target[0]},3000);
      match.boss.attack={kind:'single',targets:[p.id],hitsAt:6000};frame(3500);frame(5650)`);
    assert.equal(game.run("match.players[1].guarding"), false, weapon);
  }
});

test("a surviving NPC can finish the giant after the human falls; timeouts still fail the party", () => {
  const game = battle("dualBlades", 7);
  game.run(`frame(3000);match.players[0].hp=0;match.boss.hp=1;
    for(let now=3050;match.phase!=='finished'&&now<9000;now+=50)frame(now)`);
  assert.equal(game.run("match.outcome"), "victory");
  const timeout = battle();
  timeout.run("frame(3000);frame(match.endsAt)");
  assert.equal(timeout.run("match.outcome"), "defeat");
});

function localGame(touch = false) {
  const game = createGame({}, { touch });
  game.run(`const P=window.COOP_PLAY,C=window.ONLINE_COOP,D=window.ONLINE_DUEL,N=window.COOP_NPC,W=window.ONLINE_PLAY.words;
    let seed=100;window.crypto={getRandomValues(a){a.fill(seed++);return a}};
    window.Peer=class{constructor(){throw Error('NPC co-op must not connect')}};
    document.querySelector('#coopNpcButton').dispatchEvent({type:'click'});`);
  return game;
}

test("NPC co-op keeps enemy difficulty separate from ally strength and preserves both on rematch", () => {
  const game=localGame();
  game.run('P.setNpcConfig({weaponId:"greatsword",speed:60});P.ready();P.chooseDifficulty("hard")');
  assert.deepEqual(game.snapshot('P.session.match.players.map(p=>p.ready)'),[false,true]);
  game.run('P.ready();P.start()');game.advance(3000);
  assert.equal(game.run('P.session.match.boss.maxHp'),1500);
  assert.equal(game.run('P.session.npcBot.speed'),60);
  assert.equal(game.run('P.chooseDifficulty("easy")'),false);
  game.run('P.session.match.boss.hp=0');game.advance(100);game.run('P.again()');
  assert.equal(game.run('P.session.match.difficulty'),'hard');
  assert.equal(game.run('P.session.npcConfig.speed'),60);
  assert.equal(game.run('document.querySelector("#coopDifficulty").value'),'hard');
});

test("NPC ally strength affects actual attack timing beyond the normal input wait", () => {
  const times=[];
  for(const speed of [1,3,7,20,60]) {
    const game=battle('greatsword',speed);
    game.run('for(let now=0;match.players[1].attacks===0&&now<40000;now+=50)frame(now)');
    times.push(game.run('match.clockNow-3000'));
    assert.equal(game.run('match.players[1].attacks'),1);
  }
  for(let i=1;i<times.length;i++)assert.ok(times[i]<times[i-1],JSON.stringify(times));
  assert.ok(times[4]<times[3]*.75,JSON.stringify(times));
});

test("NPC lobby needs no connection, exposes loadouts and strength, and resets human readiness on changes", () => {
  const game = localGame(), saved = game.saved();
  assert.deepEqual(game.snapshot("P.session.match.players.map(p=>[p.name,p.hp,p.ready])"), [[game.run("state.playerName"),1000,false],["NPC",1000,true]]);
  assert.equal(game.run("P.session.peer"), null);
  assert.equal(game.run("P.session.links.size"), 0);
  assert.equal(game.run('document.querySelector("#coopTitle").textContent'), "NPC協力");
  assert.equal(game.run('document.querySelector("#coopRoom").hidden'), true);
  assert.equal(game.run('document.querySelector("#coopNpcSetup").hidden'), false);
  assert.equal(game.run("P.start()"), false);
  game.run("P.ready();P.chooseWeapon('greatsword')");
  assert.deepEqual(game.snapshot("P.session.match.players.map(p=>p.ready)"), [false,true]);
  game.run("P.ready();P.setNpcConfig({weaponId:'dualBlades',speed:7})");
  assert.deepEqual(game.snapshot("P.session.match.players.map(p=>p.ready)"), [false,true]);
  for (const config of ["{weaponId:'branch',speed:3}", "{weaponId:'__proto__',speed:3}", "{weaponId:'sword',speed:5}", "{weaponId:'sword',speed:'3'}", "null"]) {
    assert.equal(game.run(`P.setNpcConfig(${config})`), false);
  }
  game.run("P.ready();P.setNpcConfig({weaponId:'dualBlades',speed:7})");
  assert.equal(game.run("C.canStart(P.session.match)"), true);
  assert.equal(game.run("P.start()"), true);
  assert.equal(game.run("P.setNpcConfig({weaponId:'sword',speed:1})"), false);
  game.advance(3000);
  assert.equal(game.run("P.session.match.phase"), "fighting");
  assert.equal(game.run("P.session.match.boss.hp"), 1000);
  assert.deepEqual(game.saved(), saved);
});

test("human roman and flick input join NPC attacks without changing adventure saves", () => {
  for (const touch of [false, true]) {
    const game = localGame(touch), saved = game.saved();
    game.run("P.chooseWeapon('swordShield');P.setNpcConfig({weaponId:'dualBlades',speed:7});P.ready();P.start()");
    game.advance(3000);
    assert.equal(game.run('document.querySelector("#coopControls").hidden'), !touch);
    assert.equal(game.run(`P.${touch ? "applyKana" : "input"}(D.targetFor(D.wordFor(P.session.match,W,0,0),P.session.mode))`), true);
    game.advance(5000);
    assert.ok(game.run("P.session.match.players.every(p=>p.attacks>0)"));
    assert.ok(game.run("P.session.match.boss.hp<1000"));
    assert.deepEqual(game.snapshot("P.session.match.players.map(p=>p.hp)"), [1000,1000]);
    assert.equal(game.run("P.defense('guard-start')"), true);
    assert.equal(game.run("P.defense('guard-end')"), true);
    assert.deepEqual(game.saved(), saved);
  }
});

test("hiding local co-op pauses NPC input, boss warning and deadline without catch-up", () => {
  const game = localGame();
  game.run("P.ready();P.start()");game.advance(7000);
  game.run(`const m=P.session.match;const before=C.snapshot(m);const deadline=m.endsAt;const hitAt=m.boss.attack.hitsAt;
    document.hidden=true;document.dispatchEvent({type:'visibilitychange'})`);
  game.advance(60000);
  assert.deepEqual(game.snapshot("C.snapshot(m)"), game.snapshot("before"));
  assert.equal(game.run("P.input('a')"), false);
  game.run("document.hidden=false;document.dispatchEvent({type:'visibilitychange'})");
  assert.equal(game.run("m.endsAt-deadline"), 60000);
  assert.equal(game.run("m.boss.attack.hitsAt-hitAt"), 60000);
  assert.equal(game.run("m.players[1].value"), game.run("before.players[1].value"));
  game.advance(2000);
  assert.equal(game.run("m.boss.attacks"), 1);
});

test("NPC co-op pauses the giant impact motion and resumes its remaining display time", () => {
  const game = localGame();
  game.run("P.ready();P.start()"); game.advance(3000);
  game.run("P.session.match.boss.nextAttackAt=performance.now();C.tick(P.session.match,W,performance.now(),()=>.8)");
  game.advance(100);
  assert.equal(game.run('document.querySelector("#coopBoss").dataset.attack'), "all");
  game.advance(2500);
  assert.equal(game.run('document.querySelector("#coopBoss").dataset.strike'), "all");
  game.run("document.hidden=true;document.dispatchEvent({type:'visibilitychange'})"); game.advance(60000);
  assert.equal(game.run('document.querySelector("#coopBoss").dataset.paused'), "true");
  game.run("document.hidden=false;document.dispatchEvent({type:'visibilitychange'})");
  assert.equal(game.run('document.querySelector("#coopBoss").dataset.paused'), "false");
  assert.equal(game.run('document.querySelector("#coopBoss").dataset.strike'), "all");
  game.advance(700);
  assert.equal(game.run('document.querySelector("#coopBoss").dataset.strike'), "");
  game.run("P.leave()");
  assert.equal(game.run('document.querySelector("#coopBoss").dataset.strike'), "");
});

test("hidden countdown resumes, rematch restores the NPC and settings, and exit cancels its work", () => {
  const game = localGame();
  game.run("P.chooseWeapon('greatsword');P.setNpcConfig({weaponId:'dualBlades',speed:7});P.ready();document.hidden=true;P.start()");
  game.advance(10000);
  assert.equal(game.run("P.session.match.phase"), "countdown");
  game.run("document.hidden=false;document.dispatchEvent({type:'visibilitychange'})");game.advance(3000);
  assert.equal(game.run("P.session.match.phase"), "fighting");
  game.run("const old=P.session.match;old.boss.hp=0");game.advance(50);
  assert.equal(game.run("old.outcome"), "victory");
  game.run("P.again()");
  assert.notEqual(game.run("P.session.match.id"), game.run("old.id"));
  assert.deepEqual(game.snapshot("P.session.match.players.map(p=>[p.weaponId,p.hp,p.ready])"), [["greatsword",1000,false],["dualBlades",1000,true]]);
  assert.deepEqual(game.snapshot("P.session.npcConfig"), {weaponId:"dualBlades",speed:7});
  assert.equal(game.run("P.session.npcBot"), null);
  game.run("P.ready();P.start()");game.advance(5000);
  game.run("const previous=P.session.match;const seq=previous.players[1].seq;P.leave()");game.advance(180000);
  assert.equal(game.run("previous.players[1].seq"), game.run("seq"));
  assert.equal(game.run("P.session.timer"), 0);
  assert.equal(game.run("P.session.npcBot"), null);
  game.run("P.open()");
  assert.equal(game.run('document.querySelector("#coopTitle").textContent'), "オンライン協力");
  assert.equal(game.run('document.querySelector("#coopLobby").hidden'), false);
  assert.equal(game.run('document.querySelector("#coopNpcSetup").hidden'), true);
  assert.equal(game.run("P.session.match"), null);
});
