import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function battle({ count = 2, start = true, stage = "giant" } = {}) {
  const game = createGame();
  game.run(`const C = window.ONLINE_COOP, D = window.ONLINE_DUEL, W = window.ONLINE_PLAY.words;
    const match = C.create('a'.repeat(24), W.map((_, i) => i), {id:'0'.repeat(24),name:'ホスト',mode:'roman'});
    for(let i=1;i<${count};i++) C.addPlayer(match, {id:String(i).repeat(24),name:'仲間'+i,mode:'roman'});
    function readyAll() {match.players.forEach((_,i)=>C.ready(match,i,true,match.settingsRevision));}
    function answer(i, now=match.clockNow) {const p=match.players[i];return C.acceptInput(match,W,i,
      {match:match.id,index:p.index,seq:p.seq+1,value:D.targetFor(C.wordFor(match,W,p.index,i),p.mode)},now);}
  `);
  if (start) game.run(`readyAll(); C.start(match,0,"${stage}",0,match.settingsRevision); C.tick(match,W,3000)`);
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
    ['easy',350,10000,3600,130,65], ['normal',500,7500,3000,200,100], ['hard',750,5500,2200,300,150],
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
    const powers=match.players.map((p,i)=>D.attackProfile(D.wordFor(match,W,0,i),p.mode,p.value,p.weaponId).damage);
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
  game.run('C.tick(match,W,7500,()=>0)');
  assert.equal(game.run('match.boss.attack.kind'), 'single');
  assert.deepEqual(game.snapshot('match.boss.attack.targets'), ['0'.repeat(24)]);
  assert.equal(game.run('C.snapshot(match).boss.attack.remainingMs'), 3000);
  game.run('C.tick(match,W,10499,()=>0)');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [1000, 1000, 1000, 1000]);
  game.run('C.tick(match,W,10500,()=>0)');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [800, 1000, 1000, 1000]);
  game.run('match.players[0].hp=0; C.tick(match,W,15000,()=>.8)');
  assert.equal(game.run('match.boss.attack.kind'), 'all');
  assert.deepEqual(game.snapshot('match.boss.attack.targets'), ['1'.repeat(24), '2'.repeat(24), '3'.repeat(24)]);
  assert.equal(game.run('answer(0,15000)'), false);
  game.run('C.tick(match,W,18000,()=>.8); C.tick(match,W,22500,()=>0)');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [0, 900, 900, 900]);
  assert.deepEqual(game.snapshot('match.boss.attack.targets'), ['1'.repeat(24)]);
});

test('guards protect against the giant while the plain sword takes full damage', () => {
  const game = battle({ count: 4, start: false });
  game.run(`['swordShield','greatsword','sword','dualBlades'].forEach((w,i)=>C.chooseWeapon(match,i,w,match.settingsRevision));
    readyAll();C.start(match,0,'giant',0,match.settingsRevision);C.tick(match,W,3000);
    C.tick(match,W,7500,()=>.9);
    function defend(i,action,now){return C.defense(match,W,i,{match:match.id,seq:match.players[i].defenseSeq+1,action},now)};
    defend(0,'guard-start',9500);defend(1,'guard-start',10400);`);
  assert.equal(game.run('defend(2,"counter",10400)'), false);
  assert.equal(game.run('defend(3,"guard-start",10400)'), false);
  game.run('defend(2,"counter",10400);C.tick(match,W,10500)');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [950, 975, 900, 900]);
  assert.equal(game.run('match.boss.hp'), 2000);
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
  lose.run('match.players.forEach(p=>p.hp=1);C.tick(match,W,7500,()=>.8);C.tick(match,W,10500)');
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
  game.run('C.tick(match,W,7500,()=>0); const snap=C.snapshot(match)');
  assert.equal(game.run('C.validSnapshot(snap,W)'), true);
  assert.equal(game.run('"hitsAt" in snap.boss.attack || "nextAttackAt" in snap.boss'), false);
  for (const edit of [
    'copy.boss.hp=-1', 'copy.boss.maxHp=99999', 'copy.boss.attack.targets=["missing"]',
    'copy.boss.attack.targets=[copy.players[0].id,copy.players[1].id]', 'copy.boss.attack.remainingMs=99999',
    'copy.players[1].id=copy.players[0].id', 'copy.players[0].weaponId="branch"', 'copy.players[0].hp=99999',
    'copy.players[0].defenseCost=10', 'copy.outcome="victory"', 'copy.phase="finished"', 'copy.order=[0]',
  ]) assert.equal(game.run(`(()=>{const copy=JSON.parse(JSON.stringify(snap));${edit};return C.validSnapshot(copy,W)})()`), false, edit);
});

test('octopus body casts only slow with a longer interval and warning at every difficulty', () => {
  for (const [difficulty,interval,warning] of [['easy',16000,5000], ['normal',12000,4000], ['hard',9000,3000]]) for (const roll of [0,.5,.9]) {
    const game = battle({ count: 4, start: false });
    game.run(`C.chooseDifficulty(match,0,'${difficulty}',match.settingsRevision);readyAll();
      C.start(match,0,'octopus',0,match.settingsRevision);C.tick(match,W,3000);match.players[3].hp=0;
      match.boss.tentacles.forEach(part=>part.nextAttackAt=Infinity);`);
    assert.equal(game.run('match.boss.nextAttackAt'),3000+interval-warning);
    game.run(`C.tick(match,W,match.boss.nextAttackAt,()=>${roll})`);
    assert.equal(game.run('match.boss.attack.kind'), 'slow');
    assert.equal(game.run('match.boss.attack.targets.length'), 3);
    assert.equal(game.run('C.snapshot(match).boss.attack.remainingMs'),warning);
    assert.equal(game.run('C.validSnapshot(C.snapshot(match),W)'), true);
    game.run('C.tick(match,W,match.boss.attack.hitsAt)');
    assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [1000,1000,1000,0]);
    assert.deepEqual(game.snapshot('match.players.map(p=>p.slowUntil)'), [3,3,3,0]);
    assert.equal(game.run('match.boss.hp'), game.run('match.boss.maxHp'));
    assert.equal(game.run('match.boss.nextAttackAt'),3000+2*interval-warning);
    assert.equal(game.run('C.validSnapshot(C.snapshot(match),W)'), true);
  }
});

test('slow keeps current input stable, uses longer sentences for the next two prompts in all weapons and modes, then expires without bonus damage', () => {
  for (const mode of ['roman', 'kana']) for (const weapon of ['sword', 'greatsword', 'dualBlades', 'swordShield']) {
    const game = battle({ start: false });
    game.run(`C.chooseWeapon(match,0,'${weapon}',match.settingsRevision);match.players[0].mode='${mode}';
      readyAll();C.start(match,0,'octopus',0,match.settingsRevision);C.tick(match,W,3000);
      match.boss.tentacles.forEach(part=>part.nextAttackAt=Infinity);
      C.chooseTarget(match,0,{match:match.id,index:0,seq:1,targetId:'body'});
      const p=match.players[0], initial=C.wordFor(match,W,0), first=D.targetFor(initial,p.mode);
      C.acceptInput(match,W,0,{match:match.id,index:0,seq:1,value:first[0]},3000);
      C.tick(match,W,match.boss.nextAttackAt,()=>.9);C.tick(match,W,match.boss.attack.hitsAt);match.boss.nextAttackAt=Infinity;
      function complete(){const word=C.wordFor(match,W,p.index),profile=C.attackProfile(word,p.mode,p.value,p.weaponId);
        const hp=match.boss.hp;answer(0);C.tick(match,W,match.clockNow+profile.inputMs);
        C.tick(match,W,match.clockNow+profile.windupMs);return hp-match.boss.hp;}`);
    assert.equal(game.run('p.value'), game.run('first[0]'));
    assert.equal(game.run('C.wordFor(match,W,0)===initial'), true);
    game.run('complete()');
    for (const remaining of [2, 1]) {
      assert.equal(game.run('p.slowUntil-p.index'), remaining);
      assert.ok(game.run('D.targetFor(C.wordFor(match,W,p.index),p.mode).length>D.targetFor(D.wordFor(match,W,p.index),p.mode).length'));
      assert.equal(game.run('coopSlowSentences.some(s=>s.translation===C.wordFor(match,W,p.index).text)'), true);
      game.run(`const normal${remaining}=D.targetFor(D.wordFor(match,W,p.index),p.mode);
        C.acceptInput(match,W,0,{match:match.id,index:p.index,seq:p.seq+1,value:D.targetFor(C.wordFor(match,W,p.index),p.mode).slice(0,normal${remaining}.length)},match.clockNow);
        C.tick(match,W,match.clockNow+normal${remaining}.length*400);`);
      assert.equal(game.run('p.attackAt'), null, `${mode}/${weapon}: half the prompt cannot attack`);
      if (weapon === 'greatsword') assert.equal(game.run('C.defense(match,W,0,{match:match.id,seq:p.defenseSeq+1,action:"guard-start"},match.clockNow)'), false);
      const expected = game.run('D.attackProfile(D.wordFor(match,W,p.index),p.mode,"",p.weaponId).damage');
      assert.equal(game.run('complete()'), expected, `${mode}/${weapon}: no slow damage bonus`);
      assert.equal(game.run('C.validSnapshot(C.snapshot(match),W)'), true);
    }
    assert.equal(game.run('p.slowUntil'), 0);
    assert.equal(game.run('C.wordFor(match,W,p.index)===D.wordFor(match,W,p.index)'), true);
  }
});

test('slow sentence readings are correct and every normal prompt gets a longer bounded sentence with stable snapshots', () => {
  const game = battle({ start: false });
  assert.equal(game.run(`coopSlowSentences.every(s=>window.JAPANESE_INPUT.parse(s.text,s.reading)?.reading===s.reading
    && createJapaneseInputVariants(s.text).every(input=>/^[a-z-]+$/.test(input)&&input.length<=C.rules.maxInputLength))`), true);
  for (const weapon of ['sword','greatsword','dualBlades','swordShield']) {
    game.run(`match.players[0].weaponId='${weapon}';const checked_${weapon}=new Set();
      for(let i=0;i<D.wordPool(match,W,0).length;i++){
        const p=match.players[0];p.index=i;p.slowFrom=i;p.slowUntil=i+2;
        const normal=D.wordFor(match,W,i),sentence=C.wordFor(match,W,i);
        if(!sentence||!coopSlowSentences.some(s=>s.translation===sentence.text)
          ||Math.min(...sentence.inputs.map(v=>v.length))<=Math.max(...normal.inputs.map(v=>v.length))
          ||sentence.reading.length<=normal.reading.length||sentence.inputs.some(v=>v.length>C.rules.maxInputLength)
          ||C.wordFor(C.snapshot(match),W,i).text!==sentence.text)throw new Error('Invalid sentence for '+normal.text);
        checked_${weapon}.add(sentence.text);
      }`);
    assert.ok(game.run(`checked_${weapon}.size`)>2, weapon+' sentence variety');
  }
});

test('slow accepts sentence romaji variants and refreshes without changing an active prompt', () => {
  const game = battle({ stage: 'octopus' });
  game.run(`match.order=[...match.order].sort((a,b)=>W[b].inputs.length-W[a].inputs.length);
    const p=match.players[0];p.slowFrom=0;p.slowUntil=2;
    while(C.wordFor(match,W,p.index).inputs.length<2){p.index++;p.slowUntil=p.index+2;}
    const word=C.wordFor(match,W,p.index),variant=word.inputs.at(-1),index=p.index;
    C.acceptInput(match,W,0,{match:match.id,index,seq:1,value:variant.slice(0,-1)},3000);
    C.tick(match,W,match.boss.nextAttackAt,()=>.9);C.tick(match,W,match.boss.attack.hitsAt);`);
  assert.ok(game.run('word.inputs.length') > 1);
  assert.equal(game.run('C.wordFor(match,W,index)===word'), true);
  assert.equal(game.run('p.value'), game.run('variant.slice(0,-1)'));
  assert.equal(game.run('p.slowUntil'), game.run('index+3'));
  assert.equal(game.run('C.acceptInput(match,W,0,{match:match.id,index,seq:2,value:variant},match.clockNow)'), true);
  assert.equal(game.run('C.validSnapshot(C.snapshot(match),W)'), true);
  for (const edit of ['copy.stageId="giant"', 'copy.players[0].slowFrom=-1', 'copy.players[0].slowUntil=999',
    'delete copy.players[0].slowFrom', 'copy.players[0].value+="!"']) {
    assert.equal(game.run(`(()=>{const copy=C.snapshot(match);${edit};return C.validSnapshot(copy,W)})()`), false, edit);
  }
});

test('long sentences use the co-op input bound without relaxing normal duel validation', () => {
  const game = battle({ start: false });
  game.run(`const longWords=[{text:'長い語',roman:'a'.repeat(20),inputs:['a'.repeat(20),'b'.repeat(40)],reading:'あ'.repeat(20)}];
    match.order=[0];C.chooseWeapon(match,0,'greatsword',match.settingsRevision);C.chooseWeapon(match,1,'greatsword',match.settingsRevision);
    readyAll();C.start(match,0,'octopus',0,match.settingsRevision);C.tick(match,longWords,3000);
    const p=match.players[0];p.slowFrom=0;p.slowUntil=2;
    const packet={match:match.id,index:0,seq:1,value:D.targetFor(C.wordFor(match,longWords,0),'roman')};`);
  assert.ok(game.run('packet.value.length')>40);
  assert.equal(game.run('D.acceptInput(match,longWords,0,packet,3000)'), false);
  assert.equal(game.run('C.acceptInput(match,longWords,0,packet,3000)'), true);
  assert.equal(game.run('C.validSnapshot(C.snapshot(match),longWords)'), true);
  assert.equal(game.run('C.acceptInput(match,longWords,0,{...packet,seq:2,value:"b".repeat(81)},3000)'), false);
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

test('four clients synchronize skills, reject party stacking and spoofed actors, and keep the plain sword skill-free', () => {
  const {host,guests,pump}=room(4),all=[host,...guests];
  ['swordShield','dualBlades','swordShield','sword'].forEach((w,i)=>{all[i].run(`P.chooseWeapon('${w}')`);pump()});
  all.forEach(g=>g.run('P.ready()'));pump();host.run('P.start("octopus")');host.advance(3000);pump();
  host.run(`const m=P.session.match;m.players.forEach(p=>p.skillGauge=C.skills[p.weaponId]?100:0);
    [m.boss,...m.boss.tentacles].forEach(e=>{e.attack=null;e.nextAttackAt=Infinity});P.defense('guard-end');
    const prefix=D.targetFor(C.wordFor(m,W,0),m.players[0].mode)[0];P.input(prefix)`);pump();
  const word=host.run('document.querySelector("#coopWord").textContent');
  host.run('document.dispatchEvent({type:"keydown",key:"Enter",preventDefault(){}});document.dispatchEvent({type:"keydown",key:"Enter",repeat:true,preventDefault(){}})');
  guests[0].run('document.querySelector("#coopSkill").dispatchEvent({type:"click"})');
  guests[1].run('P.useSkill()');pump();
  for(const g of all) {
    assert.deepEqual(g.snapshot('P.session.match.players.map(p=>p.skillsUsed)'),[1,1,0,0]);
    assert.deepEqual(g.snapshot('P.session.match.players.map(p=>p.skillGauge)'),[0,0,100,0]);
    assert.equal(g.run('P.session.skillPending'),null);
    assert.equal(g.run('C.validSnapshot(P.session.host?C.snapshot(P.session.match):P.session.match,W)'),true);
  }
  assert.equal(host.run('P.session.localValue'),host.run('prefix'));
  assert.equal(host.run('document.querySelector("#coopWord").textContent'),word);
  guests[0].run('connections.host.send({type:"skill",match:P.session.match.id,seq:999,seat:3,weaponId:"greatsword",damage:999999})');pump();
  assert.equal(host.run('m.boss.hp'),2000);
  assert.equal(host.run('m.players[3].skillsUsed'),0);
  guests[2].run('P.useSkill()');pump();
  host.run(`m.boss.attack={kind:'slow',targets:m.players.map(p=>p.id),hitsAt:performance.now()+2000};P.defense('guard-end')`);pump();
  assert.equal(guests[2].run('document.querySelector("#coopSkill").hidden'),true);
  assert.equal(guests[2].run('P.useSkill()'),false);
  for(let i=0;i<4;i++){all.forEach(g=>g.advance(1000));pump()}
  all.forEach(g=>assert.equal(g.run('P.session.match.players[3].skillsUsed'),0));
  host.run('m.boss.hp=0');host.advance(50);pump();
  all.forEach(g=>assert.equal(g.run('P.useSkill()'),false));
  host.run('P.again()');pump();
  all.forEach(g=>assert.equal(g.run('P.session.match.players.every(p=>!p.skillGauge&&!p.skillsUsed&&!p.agilityUntil)'),true));
});

test('four clients choose independent octopus targets, preserve prompts, lock partial input and synchronize wilt and one-by-one revival', () => {
  const {host,guests,pump}=room(4,{touch:true}),all=[host,...guests],guest=guests[0];
  const advance=ms=>{for(let elapsed=0;elapsed<ms;elapsed+=1000){all.forEach(g=>g.advance(Math.min(1000,ms-elapsed)));pump()}};
  all.forEach(g=>g.run('P.ready()'));pump();host.run('P.start("octopus")');advance(3000);
  all.forEach(g=>g.run('const beforeWord=document.querySelector("#coopWord").textContent;const beforePrompt=document.querySelector("#coopRemaining").textContent'));
  host.run('document.dispatchEvent({type:"keydown",key:"Shift",preventDefault(){}})');
  guest.run('document.querySelector("#coopPartRight").dispatchEvent({type:"click"})');
  guests[1].run('P.chooseTarget("body")');pump();
  assert.deepEqual(host.snapshot('P.session.match.players.map(p=>p.targetId)'),['right','right','body','left']);
  for(const g of all){
    assert.equal(g.run('document.querySelector("#coopWord").textContent'),g.run('beforeWord'));
    assert.equal(g.run('document.querySelector("#coopRemaining").textContent'),g.run('beforePrompt'));
  }
  assert.equal(guest.run('document.querySelector("#coopPartRight").getAttribute("aria-pressed")'),'true');
  guest.run(`const me=P.session.match.players.find(p=>p.id===P.session.selfId);
    const prefix=D.targetFor(C.wordFor(P.session.match,W,me.index,1),me.mode)[0];P.applyKana(prefix);P.applyKana('');`);
  assert.equal(guest.run('P.chooseTarget("body")'),false);pump();
  // Host also rejects a forged switch after a guest has erased its first input.
  guest.run(`connections.host.send({type:'target',match:P.session.match.id,index:me.index,seq:999,targetId:'body'})`);pump();
  assert.equal(host.run('P.session.match.players[1].targetId'),'right');
  guest.run('P.applyKana(prefix)');pump();
  host.run(`const m=P.session.match; m.boss.tentacles[1].hp=1;
    P.input(D.targetFor(C.wordFor(m,W,0),m.players[0].mode))`);advance(2500);
  assert.equal(host.run('m.boss.tentacles[1].hp'),0);
  for(const g of all){
    assert.equal(g.run('P.session.match.players[1].targetId'),'body');
    assert.equal(g.run('document.querySelector("#coopPartRight").classList.contains("is-wilted")'),true);
    assert.equal(g.run('document.querySelector("#coopRightBar").value'),0);
    assert.equal(g.run('document.querySelector("#coopRegrowth").hidden'),false);
  }
  assert.equal(guest.run('P.session.localValue'),guest.run('prefix'));
  assert.equal(guest.run('document.querySelector("#coopWord").textContent'),guest.run('beforeWord'));
  host.run(`m.boss.tentacles[0].hp=1;P.chooseTarget('left');P.input(D.targetFor(C.wordFor(m,W,m.players[0].index),m.players[0].mode))`);advance(2000);
  assert.deepEqual(host.snapshot('m.boss.wiltedQueue'),['right','left']);
  advance(4000);
  for(const g of all){
    assert.equal(g.run('C.enemyFor(P.session.match,"right").hp'),g.run('C.enemyFor(P.session.match,"right").maxHp'));
    assert.equal(g.run('C.enemyFor(P.session.match,"left").hp'),0);
    assert.equal(g.run('document.querySelector("#coopPartRight").classList.contains("is-wilted")'),false);
    assert.equal(g.run('P.session.match.boss.regrowth.targetId'),'left');
  }
  advance(6000);
  all.forEach(g=>assert.equal(g.run('P.session.match.boss.regrowth'),null));
  host.run('m.boss.hp=0');advance(100);host.run('P.again()');pump();
  all.forEach(g=>assert.deepEqual(g.snapshot('P.session.match.players.map(p=>[p.targetId,p.targetSeq,p.targetLocked])'),Array.from({length:4},()=>['body',0,false])));
});

test('four clients see one alternating tentacle warning and the slower body spell on the same timeline', () => {
  const {host,guests,pump}=room(4),all=[host,...guests];
  const advance=ms=>{for(let elapsed=0;elapsed<ms;elapsed+=500){all.forEach(g=>g.advance(Math.min(500,ms-elapsed)));pump()}};
  all.forEach(g=>g.run('P.ready()'));pump();host.run('P.start("octopus")');advance(3000);
  for(const id of ['left','right','left','right']) {
    advance(1000);
    for(const g of all) {
      assert.deepEqual(g.snapshot('P.session.match.boss.tentacles.filter(t=>t.attack).map(t=>t.id)'),[id]);
      assert.equal(g.run(`document.querySelector('#coopPart${id==='left'?'Left':'Right'}').dataset.attack`),'single');
      assert.equal(g.run(`document.querySelector('#coopPart${id==='left'?'Right':'Left'}').dataset.attack`),'');
    }
    advance(1500);
  }
  all.forEach(g=>assert.equal(g.run('P.session.match.boss.attack.kind'),'slow'));
  advance(2000);
  for(const g of all) {
    assert.equal(g.run('P.session.match.boss.attacks'),1);
    assert.equal(g.run('P.session.match.players.every(p=>p.slowUntil===3)'),true);
    assert.equal(g.run('C.validSnapshot(P.session.host?C.snapshot(P.session.match):P.session.match,W)'),true);
  }
});

test('four clients synchronize octopus selection, slow casting and longer prompts with in-flight roman/kana input and clean rematches', () => {
  const { host, guests, pump } = room(4, { touch: true }), all = [host, ...guests];
  function advance(ms) { for (let elapsed = 0; elapsed < ms; elapsed += 1000) { all.forEach(g => g.advance(Math.min(1000, ms - elapsed))); pump(); } }
  all.forEach(g => g.run('P.ready()')); pump();
  assert.equal(guests[0].run('P.start("octopus")'), false);
  for (const id of ['__proto__', 'toString', 'missing']) assert.equal(host.run(`P.start('${id}')`), false);
  host.run('P.start("octopus")'); host.advance(3000); pump();
  all.forEach(g => {
    assert.equal(g.run('P.session.match.stageId'), 'octopus');
    assert.equal(g.run('document.querySelector("#coopTentacleLeft").hidden'), false);
    assert.equal(g.run('document.querySelector("#coopBossImage").alt'), 'タコツル草');
    assert.equal(g.run('document.querySelector("#coopBossBar").getAttribute("aria-label")'), 'タコツル草の体力');
  });
  host.run('P.session.match.boss.nextAttackAt=performance.now();C.tick(P.session.match,W,performance.now(),()=>.9)');
  host.advance(100); pump();
  all.forEach(g => {
    assert.equal(g.run('document.querySelector("#coopBoss").dataset.attack'), 'slow');
    assert.equal(g.run('document.querySelector("#coopTarget").textContent'), 'スローの呪文 → 全員');
  });
  guests[0].run(`const p=P.session.match.players[1], original=C.wordFor(P.session.match,W,0,1);
    P.applyKana(original.reading[0])`);
  host.advance(4000); pump(); // Deliver the input after the spell, without replacing its prompt.
  assert.equal(host.run('P.session.match.players[1].value'), guests[0].run('original.reading[0]'));
  all.forEach(g => assert.equal(g.run('document.querySelector("#coopSlow").textContent'), 'スロー（次から2回）'));
  host.run('P.session.match.boss.nextAttackAt=Infinity');
  all.forEach(g => g.run(`const seat=P.session.match.players.findIndex(p=>p.id===P.session.selfId),
    target=D.targetFor(C.wordFor(P.session.match,W,0,seat),P.session.mode);
    if(P.session.mode==='kana') P.applyKana(target);else P.input(target);`));
  pump();advance(6000);
  all.forEach(g => {
    assert.equal(g.run('P.session.match.players.every(p=>p.index===1)'), true);
    assert.equal(g.run('document.querySelector("#coopSlow").textContent'), 'スロー（あと2回）');
    assert.ok(g.run('document.querySelector("#coopRemaining").textContent.length>D.targetFor(D.wordFor(P.session.match,W,1,seat),P.session.mode).length'));
    assert.equal(g.run('coopSlowSentences.some(s=>s.translation===document.querySelector("#coopWord").textContent)'),true);
    assert.equal(g.run('C.validSnapshot(P.session.host?C.snapshot(P.session.match):P.session.match,W)'), true);
  });
  all.forEach(g => g.run(`const longer=D.targetFor(C.wordFor(P.session.match,W,1,seat),P.session.mode);
    if(P.session.mode==='kana') P.applyKana(longer);else P.input(longer);`));
  pump();advance(8000);
  all.forEach(g => assert.equal(g.run('P.session.match.players.every(p=>p.index===2)'), true));
  host.run('P.session.match.boss.hp=0');host.advance(100);pump();
  all.forEach(g => assert.equal(g.run('document.querySelector("#coopBanner").textContent'), 'タコの滝 成功！'));
  host.run('P.again()');pump();
  all.forEach(g => { assert.equal(g.run('P.session.match.players.every(p=>p.slowUntil===0)'), true);g.run('P.ready()'); });
  pump();host.run('P.start("giant")');pump();
  all.forEach(g => {
    assert.equal(g.run('document.querySelector("#coopTentacleLeft").hidden'), true);
    assert.equal(g.run('document.querySelector("#coopBoss").dataset.stage'), 'giant');
    assert.equal(g.run('document.querySelector("#coopSlow").hidden'), true);
  });
});

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
  host.advance(3000); pump();
  all.forEach(g => assert.equal(g.run('P.session.match.players[1].hp'), 800));
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

test('host and guest start the giant swing before damage, recover on impact, and cancel on victory and rematch', () => {
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
      assert.equal(g.run('document.querySelector("#coopBoss").dataset.swing'), '');
    });
    const hp = host.snapshot('P.session.match.players.map(p=>p.hp)');
    host.advance(2050); pump(); // 850 ms remain: still holding the windup pose.
    all.forEach(g => assert.equal(g.run('document.querySelector("#coopBoss").dataset.swing'), ''));
    host.advance(50); pump(); // The swing begins 800 ms before damage.
    all.forEach(g => assert.equal(g.run('document.querySelector("#coopBoss").dataset.swing'), kind));
    host.advance(750); pump();
    all.forEach(g => {
      assert.deepEqual(g.snapshot('P.session.match.players.map(p=>p.hp)'), hp);
      assert.equal(g.run('document.querySelector("#coopBoss").dataset.strike'), '');
      assert.equal(g.run('document.querySelector("#coopBoss").dataset.swing'), kind);
    });
    host.advance(50); pump();
    all.forEach(g => {
      assert.equal(g.run('document.querySelector("#coopBoss").dataset.attack'), '');
      assert.equal(g.run('document.querySelector("#coopBoss").dataset.swing'), '');
      assert.equal(g.run('document.querySelector("#coopBoss").dataset.strike'), kind);
      assert.equal(g.run('document.querySelector("#coopBossImage").getAttribute("src")'), 'src/assets/images/enemies/giant/idle.webp');
      g.advance(700);
    });
    pump();
    all.forEach(g => assert.equal(g.run('document.querySelector("#coopBoss").dataset.strike'), ''));
  }
  host.run('P.session.match.boss.nextAttackAt=performance.now();C.tick(P.session.match,W,performance.now(),()=>.8)');
  host.advance(100); pump();
  host.advance(2200); pump();
  all.forEach(g => assert.equal(g.run('document.querySelector("#coopBoss").dataset.swing'), 'all'));
  host.run('P.session.match.boss.hp=0'); host.advance(100); pump();
  all.forEach(g => {
    assert.equal(g.run('document.querySelector("#coopBoss").dataset.attack'), '');
    assert.equal(g.run('document.querySelector("#coopBoss").dataset.strike'), '');
    assert.equal(g.run('document.querySelector("#coopBoss").dataset.swing'), '');
  });
  host.run('P.again()'); pump(); all.forEach(g => g.run('P.ready()')); pump(); host.run('P.start()'); pump();
  all.forEach(g => {
    assert.equal(g.run('document.querySelector("#coopBoss").dataset.strike'), '');
    assert.equal(g.run('document.querySelector("#coopBossImage").getAttribute("src")'), 'src/assets/images/enemies/giant/idle.webp');
  });
});

test('difficulty is shared with guests, rejects guest changes, controls the warning aura, and survives rematch', () => {
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
    assert.equal(g.run('document.querySelector("#coopBoss").dataset.chargePhase'),'charging');
    assert.equal(g.run('document.querySelector("#coopDifficulty").disabled'),true);
  }
  host.advance(2800);pump();
  for(const g of [host,guest])assert.equal(g.run('document.querySelector("#coopBoss").dataset.chargePhase'),'warning');
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
