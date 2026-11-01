import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function battle({ count = 2, start = true } = {}) {
  const game = createGame();
  game.run(`const C = window.ONLINE_COOP, D = window.ONLINE_DUEL, W = window.ONLINE_PLAY.words;
    const match = C.create('a'.repeat(24), W.map((_, i) => i), {id:'0'.repeat(24),name:'ホスト',mode:'roman'});
    for(let i=1;i<${count};i++) C.addPlayer(match, {id:String(i).repeat(24),name:'仲間'+i,mode:'roman'});
    function readyAll() {match.players.forEach((_,i)=>C.ready(match,i,true,match.settingsRevision));}
    function answer(i, now=match.clockNow) {const p=match.players[i];return C.acceptInput(match,W,i,
      {match:match.id,index:p.index,seq:p.seq+1,value:D.targetFor(D.wordFor(match,W,p.index,i),p.mode)},now);}
  `);
  if (start) game.run('readyAll(); C.start(match,0,"giant",0,match.settingsRevision); C.tick(match,W,3000)');
  return game;
}

test('co-op requires 2–4 players, all ready, then a host stage selection; changes invalidate readiness', () => {
  const game = battle({ count: 1, start: false });
  game.run('readyAll()');
  assert.equal(game.run('C.canStart(match)'), false);
  assert.equal(game.run('C.start(match,0,"giant",0,match.settingsRevision)'), false);
  game.run(`for(let i=1;i<4;i++) C.addPlayer(match,{id:String(i).repeat(24),name:'仲間',mode:'roman'})`);
  assert.equal(game.run(`C.addPlayer(match,{id:'4'.repeat(24),name:'5人目',mode:'roman'})`), false);
  game.run('readyAll()');
  assert.equal(game.run('match.phase'), 'lobby');
  assert.equal(game.run('C.canStart(match)'), true);
  assert.equal(game.run('C.start(match,1,"giant",0,match.settingsRevision)'), false);
  assert.equal(game.run('C.start(match,0,"missing",0,match.settingsRevision)'), false);
  game.run('const oldRevision=match.settingsRevision; C.chooseWeapon(match,2,"greatsword",oldRevision)');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.ready)'), [false, false, false, false]);
  assert.equal(game.run('C.ready(match,0,true,oldRevision)'), false);
  assert.equal(game.run('C.chooseWeapon(match,0,"branch",match.settingsRevision)'), false);
  game.run('readyAll(); C.ready(match,3,false,match.settingsRevision)');
  assert.equal(game.run('C.canStart(match)'), false);
  game.run('readyAll(); C.removePlayer(match,match.players[3].id)');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.ready)'), [false, false, false]);
  game.run('readyAll(); C.start(match,0,"giant",100,match.settingsRevision)');
  assert.equal(game.run('answer(0,100)'), false);
  assert.equal(game.run('C.chooseWeapon(match,0,"dualBlades",match.settingsRevision)'), false);
  game.run('C.tick(match,W,3099)'); assert.equal(game.run('match.phase'), 'countdown');
  game.run('C.tick(match,W,3100)'); assert.equal(game.run('match.phase'), 'fighting');
});

test('difficulty changes require the host in the lobby and invalidate old readiness', () => {
  const game = battle({ start: false });
  game.run('readyAll();const revision=match.settingsRevision');
  for (const difficulty of ['unknown','__proto__','toString',null,1]) {
    assert.equal(game.run(`C.chooseDifficulty(match,0,${JSON.stringify(difficulty)},match.settingsRevision)`), false);
  }
  assert.equal(game.run('C.chooseDifficulty(match,1,"hard",revision)'), false);
  assert.equal(game.run('C.chooseDifficulty(match,0,"normal",revision)'), true);
  assert.equal(game.run('C.canStart(match)'), true);
  assert.equal(game.run('C.chooseDifficulty(match,0,"hard",revision)'), true);
  assert.deepEqual(game.snapshot('match.players.map(p=>p.ready)'), [false,false]);
  assert.equal(game.run('C.ready(match,0,true,revision)'), false);
  assert.equal(game.run('C.chooseDifficulty(match,0,"easy",revision)'), false);
  game.run('readyAll();C.start(match,0,"giant",0,match.settingsRevision)');
  assert.equal(game.run('C.chooseDifficulty(match,0,"easy",match.settingsRevision)'), false);
});

test('each difficulty applies its HP, warnings, damage and interval for 2–4 players and validates snapshots', () => {
  for (const [difficulty,hp,interval,warning,single,area] of [
    ['easy',350,8000,3000,100,50], ['normal',500,6000,2500,160,80], ['hard',750,4500,1800,240,120],
  ]) for (const count of [2,3,4]) {
    const game = battle({ count, start: false });
    game.run(`C.chooseDifficulty(match,0,'${difficulty}',match.settingsRevision);readyAll();C.start(match,0,'giant',0,match.settingsRevision);C.tick(match,W,3000)`);
    assert.equal(game.run('match.boss.maxHp'), hp*count);
    assert.equal(game.run('match.boss.nextAttackAt'), 3000+interval-warning);
    game.run(`C.tick(match,W,${3000+interval-warning},()=>0)`);
    assert.equal(game.run('C.snapshot(match).boss.attack.remainingMs'), warning);
    assert.equal(game.run('C.validSnapshot(C.snapshot(match),W)'), true);
    for (const edit of ['copy.difficulty="__proto__"','delete copy.difficulty','copy.boss.maxHp++',`copy.boss.attack.remainingMs=${warning+1}`]) {
      assert.equal(game.run(`(()=>{const copy=C.snapshot(match);${edit};return C.validSnapshot(copy,W)})()`),false);
    }
    game.run(`C.tick(match,W,${3000+interval-1},()=>0)`);
    assert.equal(game.run('match.players[0].hp'),1000);
    game.run(`C.tick(match,W,${3000+interval},()=>0)`);
    assert.equal(game.run('match.players[0].hp'),1000-single);
    game.run(`C.tick(match,W,${3000+2*interval-warning},()=>.8);C.tick(match,W,${3000+2*interval},()=>.8)`);
    assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'),[1000-single-area,...Array(count-1).fill(1000-area)]);
  }
});

test('correct answers damage the one shared giant once, never allies, and honor each weapon and kana', () => {
  const game = battle({ count: 4, start: false }), saved = game.saved();
  game.run(`['sword','greatsword','dualBlades','swordShield'].forEach((w,i)=>C.chooseWeapon(match,i,w,match.settingsRevision));
    match.players[3].mode='kana';readyAll(); C.start(match,0,'giant',0,match.settingsRevision); C.tick(match,W,3000);
    const powers=match.players.map((p,i)=>D.attackProfile(D.wordFor(match,W,0,i),p.mode).damage);
    for(let i=0;i<4;i++) answer(i); C.tick(match,W,6500,()=>0);`);
  assert.equal(game.run('match.boss.hp'), 2000);
  game.run('C.tick(match,W,7500,()=>0)');
  assert.equal(game.run('match.boss.hp'), game.run('2000-powers.reduce((a,b)=>a+b,0)'));
  assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [1000, 1000, 1000, 1000]);
  assert.deepEqual(game.snapshot('match.players.map(p=>p.index)'), [1, 1, 1, 1]);
  game.run('C.tick(match,W,7600,()=>0)');
  assert.equal(game.run('match.boss.hp'), game.run('2000-powers.reduce((a,b)=>a+b,0)'));
  assert.equal(game.run(`C.acceptInput(match,W,0,{match:match.id,index:0,seq:999,value:'a',damage:99999},7600)`), false);
  assert.equal(game.run(`C.acceptInput(match,W,0,{match:'old',index:1,seq:999,value:'a'},7600)`), false);
  assert.equal(game.run(`C.acceptInput(match,W,0,{match:match.id,index:1,seq:0,value:''},7600)`), false);
  assert.deepEqual(game.saved(), saved);
});

test('single attacks telegraph a specific living target and all attacks damage every living player', () => {
  const game = battle({ count: 4 });
  game.run('C.tick(match,W,6500,()=>0)');
  assert.equal(game.run('match.boss.attack.kind'), 'single');
  assert.deepEqual(game.snapshot('match.boss.attack.targets'), ['0'.repeat(24)]);
  assert.equal(game.run('C.snapshot(match).boss.attack.remainingMs'), 2500);
  game.run('C.tick(match,W,8999,()=>0)');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [1000, 1000, 1000, 1000]);
  game.run('C.tick(match,W,9000,()=>0)');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [840, 1000, 1000, 1000]);
  game.run('match.players[0].hp=0; C.tick(match,W,12500,()=>.8)');
  assert.equal(game.run('match.boss.attack.kind'), 'all');
  assert.deepEqual(game.snapshot('match.boss.attack.targets'), ['1'.repeat(24), '2'.repeat(24), '3'.repeat(24)]);
  assert.equal(game.run('answer(0,12500)'), false);
  game.run('C.tick(match,W,15000,()=>.8); C.tick(match,W,18500,()=>0)');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [0, 920, 920, 920]);
  assert.deepEqual(game.snapshot('match.boss.attack.targets'), ['1'.repeat(24)]);
});

test('guard, just guard, and energy-based counter protect against the giant', () => {
  const game = battle({ count: 4, start: false });
  game.run(`['swordShield','greatsword','sword','dualBlades'].forEach((w,i)=>C.chooseWeapon(match,i,w,match.settingsRevision));
    readyAll();C.start(match,0,'giant',0,match.settingsRevision);C.tick(match,W,3000);
    C.tick(match,W,6500,()=>.9);
    function defend(i,action,now){return C.defense(match,W,i,{match:match.id,seq:match.players[i].defenseSeq+1,action},now)};
    defend(0,'guard-start',8000);defend(1,'guard-start',8900);`);
  assert.equal(game.run('defend(2,"counter",8900)'), false);
  assert.equal(game.run('defend(3,"guard-start",8900)'), false);
  game.run('match.players[2].counterEnergy=100;defend(2,"counter",8900);C.tick(match,W,9000)');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [960, 980, 1000, 920]);
  assert.equal(game.run('match.boss.hp'), 1980);
  assert.equal(game.run('match.players[2].counterEnergy'), 0);
  assert.equal(game.run('match.players.every(p=>!p.guarding && p.defenseCost===0)'), true);
  assert.equal(game.run('C.validSnapshot(C.snapshot(match),W)'), true);
});

test('shared victory, defeat, timeout, and disconnect stop further combat', () => {
  const win = battle();
  win.run('match.boss.hp=1;answer(0);C.tick(match,W,5500);C.tick(match,W,6500)');
  assert.equal(win.run('match.outcome'), 'victory');
  assert.equal(win.run('answer(1,6500)'), false);
  win.run('C.removePlayer(match,match.players[1].id);C.tick(match,W,999999)');
  assert.equal(win.run('match.outcome'), 'victory');
  const lose = battle();
  lose.run('match.players.forEach(p=>p.hp=1);C.tick(match,W,6500,()=>.8);C.tick(match,W,9000)');
  assert.equal(lose.run('match.outcome'), 'defeat');
  const timeout = battle();
  timeout.run('answer(0);C.tick(match,W,183000)');
  assert.equal(timeout.run('match.outcome'), 'defeat');
  assert.equal(timeout.run('match.boss.hp'), 1000);
  const dropped = battle(); dropped.run('C.removePlayer(match,match.players[1].id)');
  assert.equal(dropped.run('match.outcome'), 'aborted');
  assert.equal(dropped.run('C.validSnapshot(C.snapshot(match),W)'), true);
});

test('co-op snapshots reject invalid players, giant health, targets, phase and host clock data is omitted', () => {
  const game = battle({ count: 4 });
  game.run('C.tick(match,W,6500,()=>0); const snap=C.snapshot(match)');
  assert.equal(game.run('C.validSnapshot(snap,W)'), true);
  assert.equal(game.run('"hitsAt" in snap.boss.attack || "nextAttackAt" in snap.boss'), false);
  for (const edit of [
    'copy.boss.hp=-1', 'copy.boss.maxHp=99999', 'copy.boss.attack.targets=["missing"]',
    'copy.boss.attack.targets=[copy.players[0].id,copy.players[1].id]', 'copy.boss.attack.remainingMs=99999',
    'copy.players[1].id=copy.players[0].id', 'copy.players[0].weaponId="branch"', 'copy.players[0].hp=99999',
    'copy.players[0].defenseCost=10', 'copy.outcome="victory"', 'copy.phase="finished"', 'copy.order=[0]',
  ]) assert.equal(game.run(`(()=>{const copy=JSON.parse(JSON.stringify(snap));${edit};return C.validSnapshot(copy,W)})()`), false, edit);
});

function client({ host = true, touch = false } = {}) {
  const game = createGame({}, { touch });
  game.run(`let randomId=0; window.crypto={getRandomValues(a){a.fill(++randomId);return a}};
    const out=[];const connections={};
    function connection(id){const c={id,open:false,handlers:{},on(t,fn){this.handlers[t]=fn},
      send(packet){out.push({id,packet})},close(){this.open=false}};connections[id]=c;return c;}
    window.Peer=class {constructor(){this.handlers={};window.peer=this} on(t,fn){this.handlers[t]=fn} destroy(){}
      connect(){return connection('host')}};
    const P=window.COOP_PLAY,C=window.ONLINE_COOP,D=window.ONLINE_DUEL,W=window.ONLINE_PLAY.words;
    P.open();`);
  game.run(`document.querySelector('#coopRoomInput').value='12345678';P.connect(${host})`);
  game.run('window.peer.handlers.open()');
  return game;
}
function room(count = 2, options = {}) {
  const host = client(), guests = [];
  for (let i = 0; i < count - 1; i++) {
    const guest = client({ host: false, ...options }); guests.push(guest);
    host.run(`window.peer.handlers.connection(connection('guest${i}'));connections.guest${i}.open=true;connections.guest${i}.handlers.open()`);
    guest.run('connections.host.open=true;connections.host.handlers.open()');
  }
  function pump() {
    for (let pass = 0; pass < 30; pass++) {
      let delivered = 0;
      for (const { id, packet } of host.snapshot('out.splice(0)')) {
        const guest = guests[Number(id.replace('guest', ''))];
        guest.run(`connections.host.handlers.data(${JSON.stringify(packet)})`); delivered++;
      }
      for (const [i, guest] of guests.entries()) for (const { packet } of guest.snapshot('out.splice(0)')) {
        host.run(`connections.guest${i}.handlers.data(${JSON.stringify(packet)})`); delivered++;
      }
      if (!delivered) return;
    }
    throw new Error('network did not settle');
  }
  pump(); return { host, guests, pump };
}

test('four clients synchronize weapons, readiness, host-only stage, target markers, attacks, disconnect and fresh lobby', () => {
  const { host, guests, pump } = room(4), all = [host, ...guests], saved = all.map(g => g.saved());
  assert.equal(host.run('P.session.match.players.length'), 4);
  guests[0].run('P.chooseWeapon("greatsword")'); pump();
  assert.equal(host.run('P.session.match.players[1].weaponId'), 'greatsword');
  all.forEach(g => g.run('P.ready()')); pump();
  assert.equal(host.run('document.querySelector("#coopStages").hidden'), false);
  assert.equal(guests[0].run('document.querySelector("#coopStages").hidden'), true);
  assert.equal(guests[0].run('P.start()'), false);
  guests[0].run(`connections.host.send({type:'start',match:P.session.match.id,stageId:'giant'})`); pump();
  assert.equal(host.run('P.session.match.phase'), 'lobby');
  host.run('P.start()'); pump();
  all.forEach(g => assert.equal(g.run('document.querySelector("#coopWord").textContent'), ''));
  host.advance(3000); pump();
  all.forEach(g => assert.equal(g.run('P.session.match.phase'), 'fighting'));
  host.run('P.session.match.boss.nextAttackAt=performance.now();C.tick(P.session.match,W,performance.now(),()=>.3)');
  host.advance(100); pump();
  const targets = all.map(g => g.run('document.querySelector("#coopTarget").textContent'));
  targets.forEach(text => assert.match(text, /単体攻撃 → 2\./));
  assert.match(targets[1], /あなた/);
  guests[2].run('const i=P.session.match.players.findIndex(p=>p.id===P.session.selfId);P.input(D.targetFor(D.wordFor(P.session.match,W,0,i),"roman"))'); pump();
  host.advance(2500); pump();
  all.forEach(g => assert.equal(g.run('P.session.match.players[1].hp'), 840));
  assert.ok(host.run('P.session.match.boss.hp') < 2000);
  guests[0].run('P.leave()'); pump();
  [host, ...guests.slice(1)].forEach(g => assert.equal(g.run('P.session.match.outcome'), 'aborted'));
  host.run('P.again()'); pump();
  [host, ...guests.slice(1)].forEach(g => {
    assert.equal(g.run('P.session.match.phase'), 'lobby');
    assert.equal(g.run('P.session.match.players.length'), 3);
    assert.equal(g.run('P.session.match.players.every(p=>!p.ready&&p.hp===1000)'), true);
  });
  all.forEach((g, i) => { g.run('P.leave()'); assert.deepEqual(g.saved(), saved[i]); });
});

test('host and guest show distinct giant windups, one confirmed impact, and cancel them on victory and rematch', () => {
  const { host, guests: [guest], pump } = room();
  const all = [host, guest];
  all.forEach(g => g.run('P.ready()')); pump(); host.run('P.start()'); host.advance(3000); pump();
  for (const kind of ['single', 'all']) {
    host.run(`P.session.match.boss.nextAttackAt=performance.now();C.tick(P.session.match,W,performance.now(),()=>${kind === 'single' ? 0 : .8})`);
    host.advance(100); pump();
    all.forEach(g => {
      assert.equal(g.run('document.querySelector("#coopBoss").dataset.attack'), kind);
      assert.equal(g.run('document.querySelector("#coopBossImage").getAttribute("src")'), `src/assets/images/enemies/giant/windup-${kind}.webp`);
      assert.equal(g.run('document.querySelector("#coopBoss").dataset.strike'), '');
    });
    host.advance(2500); pump();
    all.forEach(g => {
      assert.equal(g.run('document.querySelector("#coopBoss").dataset.attack'), '');
      assert.equal(g.run('document.querySelector("#coopBoss").dataset.strike'), kind);
      assert.equal(g.run('document.querySelector("#coopBossImage").getAttribute("src")'), 'src/assets/images/enemies/giant/idle.webp');
      g.advance(700);
    });
    pump();
    all.forEach(g => assert.equal(g.run('document.querySelector("#coopBoss").dataset.strike'), ''));
  }
  host.run('P.session.match.boss.nextAttackAt=performance.now();C.tick(P.session.match,W,performance.now(),()=>.8)');
  host.advance(100); pump();
  host.run('P.session.match.boss.hp=0'); host.advance(100); pump();
  all.forEach(g => {
    assert.equal(g.run('document.querySelector("#coopBoss").dataset.attack'), '');
    assert.equal(g.run('document.querySelector("#coopBoss").dataset.strike'), '');
  });
  host.run('P.again()'); pump(); all.forEach(g => g.run('P.ready()')); pump(); host.run('P.start()'); pump();
  all.forEach(g => {
    assert.equal(g.run('document.querySelector("#coopBoss").dataset.strike'), '');
    assert.equal(g.run('document.querySelector("#coopBossImage").getAttribute("src")'), 'src/assets/images/enemies/giant/idle.webp');
  });
});

test('difficulty is shared with guests, rejects guest changes, controls the warning meter, and survives rematch', () => {
  const { host, guests: [guest], pump } = room();
  assert.equal(guest.run('P.chooseDifficulty("hard")'),false);
  host.run('P.chooseDifficulty("easy")');pump();
  assert.equal(guest.run('document.querySelector("#coopDifficulty").value'),'easy');
  assert.equal(guest.run('document.querySelector("#coopDifficulty").disabled'),true);
  guest.run('connections.host.send({type:"difficulty",match:P.session.match.id,difficulty:"hard",settingsRevision:P.session.match.settingsRevision})');pump();
  assert.equal(host.run('P.session.match.difficulty'),'easy');
  host.run('P.ready()');guest.run('P.ready()');pump();host.run('P.start()');host.advance(3000);pump();
  host.run('P.session.match.boss.nextAttackAt=performance.now()');host.advance(100);pump();
  for(const g of [host,guest]) {
    assert.equal(g.run('P.session.match.boss.maxHp'),700);
    assert.equal(g.run('document.querySelector("#coopAttackBar").max'),3000);
    assert.equal(g.run('document.querySelector("#coopDifficulty").disabled'),true);
  }
  host.run('P.session.match.boss.hp=0');host.advance(100);pump();host.run('P.again()');pump();
  for(const g of [host,guest])assert.equal(g.run('P.session.match.difficulty'),'easy');
});

test('kana guests type with the shared Japanese matcher and reset partial input on the next word', () => {
  const { host, guests: [guest], pump } = room(2, { touch: true });
  host.run('P.ready()'); guest.run('P.chooseWeapon("dualBlades")'); pump();
  host.run('P.ready()'); guest.run('P.ready()'); pump(); host.run('P.start()'); host.advance(3000); pump();
  assert.equal(guest.run('document.querySelector("#coopControls").hidden'), false);
  guest.run('const p=P.session.match.players[1];P.applyKana(D.wordFor(P.session.match,W,p.index,1).reading)'); pump();
  assert.ok(host.run('P.session.match.players[1].value.length') > 0);
  host.advance(2000); pump();
  assert.equal(guest.run('P.session.localValue'), '');
  assert.equal(guest.run('P.session.kanaValue'), '');
  assert.equal(guest.run('P.session.match.players[1].index'), 1);
  host.run('P.leave()'); pump();
  assert.equal(guest.run('P.session.match'), null);
  assert.equal(guest.run('document.querySelector("#coopLobby").hidden'), false);
});

test('waiting clients time out, full rooms reject extra connections, and leaving cancels pending connections', () => {
  const host = client();
  host.run(`window.peer.handlers.connection(connection('silent'));connections.silent.open=true;connections.silent.handlers.open()`);
  host.advance(15100);
  assert.equal(host.run('P.session.links.size'), 0);
  assert.equal(host.run('P.session.match.players.length'), 1);
  host.run('P.leave();P.open();P.connect(true);P.leave()');
  host.run('window.peer.handlers.open()');
  assert.equal(host.run('P.session.match'), null);
  const { host: full } = room(4);
  full.run(`window.peer.handlers.connection(connection('extra'));connections.extra.open=true;connections.extra.handlers.open()`);
  assert.equal(full.run('out.at(-1).packet.type'), 'busy');
  assert.equal(full.run('P.session.match.players.length'), 4);
  const guest = client({ host: false });
  guest.run('window.peer.handlers.error({type:"peer-unavailable"})');
  assert.equal(guest.run('document.querySelector("#coopJoin").disabled'), false);
  assert.match(guest.run('document.querySelector("#coopStatus").textContent'), /部屋が見つかりません/);
});

test('a guest can release guard after a delayed next-word state crosses the guard request', () => {
  const { host, guests: [guest], pump } = room();
  guest.run('P.chooseWeapon("swordShield")'); pump();
  host.run('P.ready()'); guest.run('P.ready()'); pump(); host.run('P.start()'); host.advance(3000); pump();
  guest.run('P.input(D.targetFor(D.wordFor(P.session.match,W,0,1),"roman"))'); pump();
  // Leave next-word states in transit while the guest starts a guard.
  host.advance(5000);
  guest.run('P.defense("guard-start")'); pump();
  assert.equal(guest.run('P.session.match.players[1].index'), 1);
  assert.equal(host.run('P.session.match.players[1].guarding'), true);
  guest.run('P.defense("guard-end")'); pump();
  assert.equal(host.run('P.session.match.players[1].guarding'), false);
  assert.equal(guest.run('P.session.match.players[1].guarding'), false);
});
