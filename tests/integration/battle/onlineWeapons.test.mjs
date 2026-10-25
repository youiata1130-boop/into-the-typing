import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function battle(weapons = ['sword', 'swordShield'], modes = ['roman', 'roman'], start = true) {
  const game = createGame();
  game.run(`const D = window.ONLINE_DUEL, W = window.ONLINE_PLAY.words;
    const match = D.create('0123456789abcdef01234567', W.map((_, i) => i), ['甲', '乙'], ${JSON.stringify(modes)},
      {battleMode:'weapons', weapons:${JSON.stringify(weapons)}});
    function typeFor(seat, value, now = match.clockNow, pending = false) {
      const p = match.players[seat];
      return D.acceptInput(match,W,seat,{match:match.id,index:p.index,seq:p.seq+1,value,pending},now);
    }
    function answer(seat, now = match.clockNow) {
      const p = match.players[seat]; return typeFor(seat,D.targetFor(D.wordFor(match,W,p.index),p.mode),now);
    }
    function defend(seat, action, now) {
      return D.defense(match,W,seat,{match:match.id,seq:match.players[seat].defenseSeq+1,action},now);
    }
  `);
  if (start) game.run('D.ready(match,0,0);D.ready(match,1,0);D.tick(match,W,3000)');
  return game;
}

test('only four weapons are selectable, changes reset both ready states and lock at countdown', () => {
  const game = battle(undefined, undefined, false);
  assert.deepEqual(game.snapshot('Object.keys(D.weapons)'), ['sword', 'greatsword', 'dualBlades', 'swordShield']);
  for (const id of ['branch', 'bareHands', 'unarmed', '__proto__', 'constructor', '', null]) {
    assert.equal(game.run(`D.chooseWeapon(match,0,${JSON.stringify(id)})`), false);
    assert.throws(() => game.run(`D.create(match.id,match.order,['a','b'],['roman','roman'],{battleMode:'weapons',weapons:[${JSON.stringify(id)},'sword']})`));
  }
  game.run('D.ready(match,0,0);D.chooseWeapon(match,1,"dualBlades")');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.ready)'), [false, false]);
  game.run('D.ready(match,0,0);D.ready(match,1,0)');
  assert.equal(game.run('D.chooseWeapon(match,0,"greatsword")'), false);
  assert.equal(game.run('match.players[0].weaponId'), 'sword');
});

test('weapon attacks give both peers a 400 ms warning and cannot be submitted twice', () => {
  const game = battle();
  game.run('answer(0);D.tick(match,W,5000)');
  assert.equal(game.run('D.snapshot(match).players[0].attackWaitMs'), 400);
  assert.equal(game.run('answer(0)'), false);
  game.run('D.tick(match,W,5399)');
  assert.equal(game.run('match.players[1].hp'), 1000);
  game.run('D.tick(match,W,5400);D.tick(match,W,5500)');
  assert.equal(game.run('match.players[1].hp'), 960);
  assert.equal(game.run('match.players[0].attacks'), 1);
});

for (const [elapsed, hp, cost, effect] of [[201, 980, 20, 'guard'], [200, 990, 30, 'justGuard'], [1, 990, 30, 'justGuard']]) {
  test(`guard at ${elapsed} ms reduces damage and repays exactly the prevented amount`, () => {
    const game = battle();
    game.run(`answer(0);D.tick(match,W,5000);defend(1,'guard-start',${5400 - elapsed})`);
    assert.equal(game.run(`defend(1,'guard-start',5399)`), false, 'holding cannot refresh the just-guard window');
    assert.equal(game.run('typeFor(1,D.wordFor(match,W,0).inputs[0].slice(0,2),5399)'), false);
    game.run('D.tick(match,W,5400)');
    assert.equal(game.run('match.players[1].hp'), hp);
    assert.equal(game.run('match.players[1].defenseCost'), cost);
    assert.equal(game.run('match.players[1].feedback'), effect);
    assert.equal(game.run('match.players[1].guarding'), false);
    assert.equal(game.run('defend(1,"guard-start",5401)'), false);
    game.run('answer(1);D.tick(match,W,5401);D.tick(match,W,5801)');
    assert.equal(game.run('match.players[0].hp'), 1000 - (40 - cost));
    assert.equal(game.run('match.players[1].defenseCost'), 0);
    assert.equal(game.run('defend(1,"guard-start",5802)'), true);
  });
}

test('greatsword guards only before typing or after completion, including unconfirmed kana', () => {
  const game = battle(['greatsword', 'swordShield'], ['kana', 'roman']);
  game.run('typeFor(0,D.wordFor(match,W,0).reading.slice(0,1))');
  assert.equal(game.run('defend(0,"guard-start",3001)'), false);
  game.run('typeFor(0,"",3002,true)');
  assert.equal(game.run('defend(0,"guard-start",3003)'), false);
  game.run('typeFor(0,"",3004,false)');
  assert.equal(game.run('defend(0,"guard-start",3005)'), true);
  assert.equal(game.run('answer(0,3006)'), false);
  game.run('defend(0,"guard-end",3007);answer(0,3008)');
  assert.equal(game.run('defend(0,"guard-start",3009)'), true);
  game.run('typeFor(1,D.wordFor(match,W,0).inputs[0].slice(0,2),3010)');
  assert.equal(game.run('defend(1,"guard-start",3011)'), true);
  game.run('defend(1,"guard-end",3012)');
  assert.equal(game.run('match.players[1].value.length'), 2);
});

test('counter lasts 200 ms, reflects 20, borrows 60 power and cannot be held or chained freely', () => {
  const game = battle(['dualBlades', 'sword']);
  game.run('answer(0);D.tick(match,W,5000);defend(1,"counter",5200)');
  assert.equal(game.run('answer(1,5300)'), false);
  assert.equal(game.run('defend(1,"counter",5300)'), false);
  game.run('D.tick(match,W,5400)');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [980, 1000]);
  assert.equal(game.run('match.players[1].defenseCost'), 60);
  assert.equal(game.run('match.players[1].counterHits'), 1);
  assert.equal(game.run('defend(1,"counter",6000)'), false);
  game.run('answer(1);D.tick(match,W,6000);D.tick(match,W,6400)');
  assert.equal(game.run('match.players[0].hp'), 980);
  assert.equal(game.run('match.players[1].defenseCost'), 20);
  game.run('answer(1);D.tick(match,W,8400);D.tick(match,W,8800)');
  assert.equal(game.run('match.players[0].hp'), 960);
  assert.equal(game.run('match.players[1].defenseCost'), 0);
  assert.equal(game.run('defend(1,"counter",8801)'), true);
});

test('expired counter fails, and no weapon can invoke another weapon defense or skills', () => {
  const game = battle(['dualBlades', 'sword']);
  assert.equal(game.run('defend(0,"guard-start",3001)'), false);
  assert.equal(game.run('defend(0,"counter",3001)'), false);
  assert.equal(game.run('defend(1,"guard-start",3001)'), false);
  assert.equal(game.run('defend(1,"skill",3001)'), false);
  game.run('answer(0);D.tick(match,W,5000);defend(1,"counter",5199);D.tick(match,W,5400)');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [1000, 960]);
  assert.equal(game.run('defend(1,"counter",5798)'), false);
  assert.equal(game.run('defend(1,"counter",5799)'), true);
});

test('simultaneous counter and just guard retain both success effects despite reflected damage', () => {
  const game = battle(['sword', 'greatsword']);
  game.run('answer(0);answer(1);D.tick(match,W,5000);defend(0,"counter",5300);defend(1,"guard-start",5300);D.tick(match,W,5400)');
  assert.deepEqual(game.snapshot('match.players.map(p=>p.feedback)'), ['counter', 'justGuard']);
  assert.deepEqual(game.snapshot('match.players.map(p=>p.feedbackId)'), [1, 1]);
});

test('a swing spent on defense ends the opposing guard even when its damage is zero', () => {
  const game = battle(['sword', 'swordShield']);
  game.run('match.players[0].defenseCost=40;answer(0);D.tick(match,W,5000);defend(1,"guard-start",5300);D.tick(match,W,5400)');
  assert.equal(game.run('match.players[1].guarding'), false);
  assert.equal(game.run('match.players[1].hp'), 1000);
  assert.equal(game.run('answer(1)'), true);
});

test('late, replayed and foreign defense packets cannot change the state', () => {
  const game = battle();
  for (const change of ['{match:"old"}', '{seq:0}', '{seq:NaN}', '{seq:1.5}', '{action:"skill"}']) {
    assert.equal(game.run(`D.defense(match,W,1,{match:match.id,seq:1,action:'guard-start',...${change}},3000)`), false);
  }
  game.run('defend(1,"guard-start",3000)');
  assert.equal(game.run('D.defense(match,W,1,{match:match.id,seq:1,action:"guard-end"},3001)'), false);
  assert.equal(game.run('defend(1,"guard-end",match.endsAt)'), false);
  assert.equal(game.run('defend(1,"guard-end",NaN)'), false);
});

test('unpaid defense power is settled at timeout and knockout, with no last-second advantage', () => {
  for (const kind of ['sword', 'greatsword', 'swordShield']) {
    const game = battle(['dualBlades', kind]);
    game.run(`answer(0);answer(1);D.tick(match,W,5000);defend(1,${JSON.stringify(kind === 'sword' ? 'counter' : 'guard-start')},5300);D.tick(match,W,5400);D.tick(match,W,183000)`);
    assert.equal(game.run('match.winner'), -1, kind);
    assert.deepEqual(game.snapshot('match.players.map(p=>p.defenseCost)'), [0, 0]);
    assert.equal(game.run('D.validSnapshot(D.snapshot(match),W)'), true);
  }
  const game = battle(['dualBlades', 'sword']);
  game.run('match.players.forEach(p=>p.hp=40);answer(0);answer(1);D.tick(match,W,5000);defend(1,"counter",5300);D.tick(match,W,5400)');
  assert.equal(game.run('match.winner'), -1);
});

test('all 16 weapon pairings tie at equal typing speed, across seeds, speeds, input modes and defenses', () => {
  const game = battle();
  const results = game.snapshot(`(() => {
    const results = [];
    for (const a of Object.keys(D.weapons)) for (const b of Object.keys(D.weapons))
    for (const charsPerSecond of [2,5,10]) for (const mode of ['roman','kana']) for (const withDefense of [false,true])
    for (const seed of [13,89,431]) {
      let rng = seed;
      const order = D.shuffledOrder(W.length,()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296});
      const m = D.create(match.id,order,['A','B'],[mode,mode],{battleMode:'weapons',weapons:[a,b]});
      D.ready(m,0,0);D.ready(m,1,0);D.tick(m,W,3000);
      for(let now=3000; m.phase==='fighting' && now<=183000; now+=50) {
        for(let seat=0;seat<2;seat++) {
          const p=m.players[seat], other=m.players[1-seat], target=D.targetFor(D.wordFor(m,W,p.index),mode,p.value);
          const length=Math.min(target.length,Math.floor((now-p.openedAt)/1000*charsPerSecond));
          if(length>p.value.length) D.acceptInput(m,W,seat,{match:m.id,index:p.index,seq:p.seq+1,value:target.slice(0,length)},now);
          if(withDefense && other.attackAt!==null && other.attackAt-now<=100 && !p.defenseCost) {
            const kind=D.weapons[p.weaponId].defense;
            D.defense(m,W,seat,{match:m.id,seq:p.defenseSeq+1,action:kind==='counter'?'counter':'guard-start'},now);
          }
        }
        D.tick(m,W,now);
      }
      results.push({a,b,charsPerSecond,mode,withDefense,seed,winner:m.winner,valid:D.validSnapshot(D.snapshot(m),W)});
    }
    return results;
  })()`);
  assert.equal(results.length, 576);
  for (const result of results) {
    assert.equal(result.winner, -1, JSON.stringify(result));
    assert.equal(result.valid, true, JSON.stringify(result));
  }
});

test('weapon snapshots bound defense fields and send relative times, never browser clock origins', () => {
  const game = battle();
  game.run('answer(0);D.tick(match,W,5000);defend(1,"guard-start",5300)');
  assert.equal(game.run('D.validSnapshot(D.snapshot(match),W)'), true);
  assert.deepEqual(game.snapshot('Object.keys(D.snapshot(match).players[0]).filter(k=>/At$/.test(k))'), []);
  for (const change of ['s.battleMode="other"', 's.players[0].weaponId="branch"', 's.players[0].guarding=true',
    's.players[1].countering=true', 's.players[0].attackWaitMs=401', 's.players[0].counterWaitMs=601',
    's.players[0].defenseCost=61', 's.players[0].defenseCost=-1', 's.players[0].feedback="<script>"', 's.players[0].pendingInput="yes"']) {
    assert.equal(game.run(`(()=>{const s=D.snapshot(match);${change};return D.validSnapshot(s,W)})()`), false, change);
  }
});

function room() {
  const game = createGame();
  game.run(`let randomSeed=123;window.crypto={getRandomValues(a){a.fill(randomSeed++);return a}};
    window.Peer=class{constructor(){this.handlers={};window.fakePeer=this}on(t,f){this.handlers[t]=f}destroy(){}};
    const O=window.ONLINE_PLAY,D=window.ONLINE_DUEL,W=O.words;
    O.open();O.session.battleMode='weapons';O.chooseWeapon('greatsword');O.connect(true)`);
  game.run(`window.fakePeer.handlers.open();
    const conn={open:false,handlers:{},sent:[],on(t,f){this.handlers[t]=f},send(p){this.sent.push(p)},close(){this.open=false}};
    window.fakePeer.handlers.connection(conn);conn.open=true;conn.handlers.open();
    conn.handlers.data({type:'hello',protocol:D.signature(W),name:'相手',mode:'kana',weaponId:'swordShield'});
    O.ready();O.receive({type:'ready',match:O.session.match.id,settingsRevision:O.session.match.settingsRevision});`);
  game.advance(3000);
  return game;
}

test('live controller synchronizes loadouts, ignores skills and releases held guard when hidden', () => {
  const game = room();
  const saved = game.saved();
  assert.deepEqual(game.snapshot('O.session.match.players.map(p=>p.weaponId)'), ['greatsword', 'swordShield']);
  assert.equal(game.run('document.querySelector("#onlineDefense").hidden'), false);
  game.run('document.dispatchEvent({type:"keydown",key:" ",preventDefault(){}})');
  assert.equal(game.run('O.session.match.players[0].guarding'), true);
  game.run('document.hidden=true;document.dispatchEvent({type:"visibilitychange"})');
  assert.equal(game.run('O.session.match.players[0].guarding'), false);
  assert.equal(game.run('O.session.held.size'), 0);
  game.run(`O.receive({type:'skill',match:O.session.match.id,damage:99999});
    document.dispatchEvent({type:'keydown',key:'Enter',preventDefault(){}})`);
  assert.deepEqual(game.snapshot('O.session.match.players.map(p=>p.hp)'), [1000, 1000]);
  assert.deepEqual(game.saved(), saved);
});

test('guest can type immediately after releasing guard without waiting for a network round trip', () => {
  const game = createGame();
  game.run(`const O=window.ONLINE_PLAY,D=window.ONLINE_DUEL,W=O.words;
    O.open();O.session.host=false;O.session.seat=1;O.session.remote={name:'host',mode:'roman',weaponId:'sword'};
    const sent=[];O.session.conn={open:true,send(p){sent.push(p)},close(){}};
    const m=D.create('0123456789abcdef01234567',W.map((_,i)=>i),['host','guest'],['roman','roman'],{battleMode:'weapons',weapons:['sword','swordShield']});
    D.ready(m,0,0);D.ready(m,1,0);D.tick(m,W,3000);O.receive({type:'state',match:D.snapshot(m)});
    O.defense('guard-start');D.defense(m,W,1,{match:m.id,seq:1,action:'guard-start'},3001);
    O.receive({type:'state',match:D.snapshot(m)});O.receive({type:'defense-ack',match:m.id,seq:1});
    O.defense('guard-end');`);
  assert.equal(game.run('O.session.defensePending.action'), 'guard-end');
  assert.equal(game.run('O.input(D.wordFor(m,W,0).inputs[0].slice(0,1))'), true);
  assert.deepEqual(game.snapshot('sent.slice(-2).map(p=>p.type)'), ['defense', 'input']);
  game.run('D.defense(m,W,1,sent.at(-2),3002)');
  assert.equal(game.run('D.acceptInput(m,W,1,sent.at(-1),3003)'), true);
});

test('rematch preserves weapons but clears guard, defense cost, keys, progress and sequence state', () => {
  const game = room();
  game.run(`O.session.match.players[0].defenseCost=30;O.session.match.players[0].guarding=true;
    O.session.match.phase='finished';O.session.match.winner=-1;O.session.held.add(' ');
    O.ready();O.receive({type:'again',match:O.session.match.id});`);
  assert.deepEqual(game.snapshot('O.session.match.players.map(p=>p.weaponId)'), ['greatsword', 'swordShield']);
  assert.deepEqual(game.snapshot('O.session.match.players.map(p=>[p.hp,p.defenseCost,p.guarding,p.index,p.defenseSeq])'), [[1000,0,false,0,0],[1000,0,false,0,0]]);
  assert.equal(game.run('O.session.held.size'), 0);
  assert.equal(game.run('O.session.defensePending'), null);
  assert.equal(game.run('O.session.match.phase'), 'countdown');
});
