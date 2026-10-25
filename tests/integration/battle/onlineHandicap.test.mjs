import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function fixture() {
  const game = createGame();
  game.run(`const D=window.ONLINE_DUEL, O=window.ONLINE_PLAY, W=O.words;
    function make(options={}) {return D.create('0123456789abcdef01234567',W.map((_,i)=>i),['甲','乙'],['roman','roman'],options)}
    const match=make();`);
  return game;
}

test('all requested handicap ratios apply exactly to either player in both modes', () => {
  const game = fixture();
  assert.deepEqual(game.snapshot('D.handicapRatios'), [1,1.1,1.2,1.3,1.4,1.5,2,2.5,3]);
  const cases = game.snapshot(`(() => {
    const cases=[];
    for(const battleMode of ['simple','weapons']) for(const ratio of D.handicapRatios) for(const seat of [0,1]) {
      const m=make({battleMode,handicapRatio:ratio,handicapSeat:seat});
      cases.push({ratio,seat,hp:m.players.map(p=>p.hp),max:m.players.map(p=>p.maxHp),valid:D.validSnapshot(D.snapshot(m),W)});
    }
    return cases;
  })()`);
  assert.equal(cases.length, 36);
  for (const result of cases) {
    const expected = [1000, 1000]; expected[result.seat] = Math.round(1000 * result.ratio);
    assert.deepEqual(result.hp, expected);
    assert.deepEqual(result.max, expected);
    assert.equal(result.valid, true);
  }
});

test('unsupported, fractional-step, non-numeric and out-of-range handicaps are rejected', () => {
  const game = fixture();
  for (const ratio of ['0', '-1', '1.01', '1.6', '1.9', '2.1', '3.5', 'NaN', 'Infinity', '"1.5"', 'null']) {
    assert.equal(game.run(`D.setHandicap(match,${ratio},1)`), false, ratio);
    if (ratio !== 'null') assert.throws(() => game.run(`make({handicapRatio:${ratio}})`));
  }
  for (const seat of ['-1', '2', '0.5', '"0"', 'NaN', 'null']) {
    assert.equal(game.run(`D.setHandicap(match,1.5,${seat})`), false, seat);
    if (seat !== 'null') assert.throws(() => game.run(`make({handicapRatio:1.5,handicapSeat:${seat}})`));
  }
  assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [1000,1000]);
});

test('changing handicap updates both HP bars, resets readiness and invalidates older ready messages', () => {
  const game = fixture();
  game.run('D.ready(match,0,0); const previous=match.settingsRevision; D.setHandicap(match,1.3,0)');
  assert.deepEqual(game.snapshot('match.players.map(p=>[p.hp,p.maxHp,p.ready])'), [[1300,1300,false],[1000,1000,false]]);
  assert.equal(game.run('D.ready(match,1,100,previous)'), false);
  assert.equal(game.run('match.phase'), 'lobby');
  game.run('D.ready(match,0,100);D.setHandicap(match,1.3,1)');
  assert.deepEqual(game.snapshot('match.players.map(p=>[p.hp,p.ready])'), [[1000,false],[1300,false]]);
  assert.equal(game.run('D.setHandicap(match,1.3,1)'), false);
  game.run('D.setHandicap(match,1,1)');
  assert.deepEqual(game.snapshot('match.players.map(p=>[p.hp,p.maxHp])'), [[1000,1000],[1000,1000]]);
});

test('handicap is locked throughout countdown, combat and results', () => {
  const game = fixture();
  game.run('D.setHandicap(match,3,1);D.ready(match,0,0);D.ready(match,1,0)');
  assert.equal(game.run('D.setHandicap(match,1.1,0)'), false);
  game.run('D.tick(match,W,3000)');
  assert.equal(game.run('D.setHandicap(match,1.1,0)'), false);
  game.run('D.tick(match,W,183000)');
  assert.equal(game.run('D.setHandicap(match,1.1,0)'), false);
  assert.deepEqual(game.snapshot('match.players.map(p=>p.maxHp)'), [1000,3000]);
  assert.equal(game.run('match.winner'), 1, 'timeout continues to compare remaining HP, not percentages');
});

test('handicap increases HP without scaling attack damage, and zero HP still ends the match', () => {
  const game = fixture();
  for (const mode of ['simple', 'weapons']) {
    game.run(`const m_${mode}=make({battleMode:'${mode}',handicapRatio:3,handicapSeat:1});
      D.ready(m_${mode},0,0);D.ready(m_${mode},1,0);D.tick(m_${mode},W,3000);
      for(let seat=0;seat<2;seat++)D.acceptInput(m_${mode},W,seat,{match:m_${mode}.id,index:0,seq:1,value:D.wordFor(m_${mode},W,0).inputs[0]});
      D.tick(m_${mode},W,5000);D.tick(m_${mode},W,5400);`);
    assert.deepEqual(game.snapshot(`m_${mode}.players.map(p=>p.hp)`), [960,2960]);
    game.run(`m_${mode}.players[1].hp=40;
      D.acceptInput(m_${mode},W,0,{match:m_${mode}.id,index:1,seq:2,value:D.wordFor(m_${mode},W,1).inputs[0]});
      D.tick(m_${mode},W,7400);D.tick(m_${mode},W,7800);`);
    assert.equal(game.run(`m_${mode}.phase`), 'finished');
    assert.equal(game.run(`m_${mode}.winner`), 0);
    assert.equal(game.run(`m_${mode}.players[1].hp`), 0);
    assert.equal(game.run(`D.validSnapshot(D.snapshot(m_${mode}),W)`), true);
  }
});

test('snapshots require HP limits to agree with the selected ratio and recipient', () => {
  const game = fixture();
  game.run('D.setHandicap(match,2.5,0)');
  assert.equal(game.run('D.validSnapshot(D.snapshot(match),W)'), true);
  for (const change of ['s.handicapRatio=1.6', 's.handicapSeat=2', 's.handicapSeat="0"', 's.settingsRevision=-1',
    's.players[0].maxHp=3000', 's.players[0].hp=2501', 's.players[1].hp=1001', 's.players[1].maxHp=2500',
    'delete s.handicapRatio', 'delete s.players[0].maxHp']) {
    assert.equal(game.run(`(()=>{const s=D.snapshot(match);${change};return D.validSnapshot(s,W)})()`), false, change);
  }
});

function hostRoom() {
  const game = fixture();
  game.run(`let seed=123;window.crypto={getRandomValues(a){a.fill(seed++);return a}};
    window.Peer=class{constructor(){this.handlers={};window.fakePeer=this}on(t,f){this.handlers[t]=f}destroy(){}};
    O.open();O.setHandicap(1.5,1);O.connect(true);`);
  game.run(`window.fakePeer.handlers.open();
    const conn={open:false,sent:[],handlers:{},on(t,f){this.handlers[t]=f},send(p){this.sent.push(p)},close(){this.open=false}};
    window.fakePeer.handlers.connection(conn);conn.open=true;conn.handlers.open();
    conn.handlers.data({type:'hello',protocol:D.signature(W),name:'相手',mode:'roman',weaponId:'sword'});`);
  return game;
}

test('host publishes handicap changes, rejects stale ready packets and ignores guest handicap edits', () => {
  const game = hostRoom();
  assert.deepEqual(game.snapshot('O.session.match.players.map(p=>p.hp)'), [1000,1500]);
  game.run(`O.ready();const previousSettings=O.session.match.settingsRevision;O.setHandicap(3,0);
    O.receive({type:'ready',match:O.session.match.id,settingsRevision:previousSettings});
    O.receive({type:'handicap',match:O.session.match.id,handicapRatio:3,handicapSeat:1});`);
  assert.deepEqual(game.snapshot('O.session.match.players.map(p=>[p.hp,p.ready])'), [[3000,false],[1000,false]]);
  assert.equal(game.run('O.session.readyPending'), false);
  assert.equal(game.run('document.querySelector("#onlineSelfHp").textContent'), '3000 / 3000');
  assert.equal(game.run('document.querySelector("#onlineSelfBar").max'), 3000);
  assert.deepEqual(game.snapshot('conn.sent.filter(p=>p.type==="state").at(-1).match.players.map(p=>p.maxHp)'), [3000,1000]);
});

test('guest sees shared settings, cannot edit them and must ready again after a change', () => {
  const game = fixture();
  game.run(`O.open();O.session.host=false;O.session.seat=1;O.session.peer={destroy(){}};
    O.session.remote={name:'甲'};const sent=[];O.session.conn={open:true,send(p){sent.push(p)},close(){}};
    O.receive({type:'state',match:D.snapshot(match)});O.ready();`);
  assert.equal(game.run('sent.at(-1).settingsRevision'), 0);
  assert.equal(game.run('O.session.readyPending'), true);
  game.run('D.setHandicap(match,2,1);O.receive({type:"state",match:D.snapshot(match)})');
  assert.equal(game.run('O.session.readyPending'), false);
  assert.equal(game.run('document.querySelector("#onlineHandicapRatio").value'), '2');
  assert.equal(game.run('document.querySelector("#onlineHandicapRatio").disabled'), true);
  assert.equal(game.run('document.querySelector("#onlineSelfHp").textContent'), '2000 / 2000');
  assert.equal(game.run('document.querySelector("#onlineOtherHp").textContent'), '1000 / 1000');
  assert.equal(game.run('document.querySelector("#onlineHandicapGuest").textContent'), 'あなた：乙');
  assert.equal(game.run('O.setHandicap(3,0)'), false);
  assert.equal(game.run('O.session.match.handicapRatio'), 2);
  game.run('O.ready()');
  assert.equal(game.run('sent.at(-1).settingsRevision'), 1);
});

test('rematch restores each chosen maximum HP and preserves handicap without changing adventure saves', () => {
  const game = hostRoom(), saved = game.saved();
  game.run(`O.setHandicap(2.5,1);O.ready();O.receive({type:'ready',match:O.session.match.id,settingsRevision:O.session.match.settingsRevision});`);
  game.advance(3000);
  game.run(`const oldId=O.session.match.id;O.session.match.players[0].hp=0;D.tick(O.session.match,W,performance.now());
    O.ready();O.receive({type:'again',match:O.session.match.id});`);
  assert.equal(game.run('O.session.match.id !== oldId'), true);
  assert.equal(game.run('O.session.match.phase'), 'countdown');
  assert.deepEqual(game.snapshot('O.session.match.players.map(p=>[p.hp,p.maxHp])'), [[1000,1000],[2500,2500]]);
  assert.equal(game.run('O.session.match.handicapRatio'), 2.5);
  assert.equal(game.run('O.session.match.handicapSeat'), 1);
  assert.deepEqual(game.saved(), saved);
});
