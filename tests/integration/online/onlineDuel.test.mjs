import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function duel({ start = true, modes = ['roman', 'roman'] } = {}) {
  const game = createGame();
  game.run(`const D = window.ONLINE_DUEL, W = window.ONLINE_PLAY.words;
    const match = D.create('0123456789abcdef01234567', W.map((_, i) => i), ['甲', '乙'], ${JSON.stringify(modes)});
    function typeFor(seat, value) {
      const player = match.players[seat];
      return D.acceptInput(match, W, seat, { match: match.id, index: player.index, seq: player.seq + 1, value });
    }
    function answer(seat) { const player = match.players[seat]; return typeFor(seat, D.targetFor(D.wordFor(match, W, player.index), player.mode)); }
  `);
  if (start) game.run('D.ready(match, 0, 0); D.ready(match, 1, 0); D.tick(match, W, 3000)');
  return game;
}

test('online prompts have valid Japanese and roman input, and fixed rules do not use saved growth', () => {
  const game = duel();
  assert.ok(game.run('W.length') >= 30);
  assert.equal(game.run('D.wordPool(match,W).length'), game.run('W.length'));
  assert.equal(game.run('D.wordPool(match,W).every(i => W[i].reading && W[i].inputs.every(s=>s.length<=D.rules.maxInputLength))'), true);
  assert.deepEqual(game.snapshot('match.players.map(p => p.hp)'), [800, 800]);
  assert.equal(game.run('D.rules.damage'), 60);
  assert.equal(game.run('D.rules.attackMinMs'), 2000);
  assert.equal(game.run('D.signature(W) !== D.signature(W.slice(1))'), true);
  assert.deepEqual(game.snapshot('D.shuffledOrder(W.length).sort((a,b) => a-b)'), game.snapshot('W.map((_,i) => i)'));
});

test('both players must ready, countdown blocks input, and the full battle time starts afterward', () => {
  const game = duel({ start: false });
  game.run('D.ready(match, 0, 0); D.tick(match, W, 10000)');
  assert.equal(game.run('match.phase'), 'lobby');
  assert.equal(game.run('answer(0)'), false);
  game.run('D.ready(match, 1, 10000); D.tick(match, W, 12999)');
  assert.equal(game.run('match.phase'), 'countdown');
  assert.equal(game.run('match.countdown'), 1);
  assert.equal(game.run('answer(1)'), false);
  game.run('D.tick(match, W, 13000)');
  assert.equal(game.run('match.phase'), 'fighting');
  assert.equal(game.run('match.remainingMs'), 180000);
  assert.equal(game.run('D.ready(match, 0, 13000)'), false);
});

test('partial typing changes progress without damage; backspace and alternative spellings are accepted', () => {
  const game = duel();
  game.run('const target = D.wordFor(match,W,0).inputs[0]');
  assert.equal(game.run('typeFor(0, target.slice(0, 2))'), true);
  assert.equal(game.run('match.players[0].value.length'), 2);
  assert.equal(game.run('typeFor(0, target.slice(0, 1))'), true);
  assert.equal(game.run('typeFor(0, "!!!!!!!!")'), false);
  game.run('D.tick(match,W,6000)');
  assert.equal(game.run('match.players[1].hp'), 800);
  assert.equal(game.run('typeFor(0, D.wordFor(match,W,0).inputs.at(-1))'), true);
  game.run('D.tick(match,W,6001)');
  assert.equal(game.run('match.players[1].hp'), 740);
});

test('complete input waits for the minimum attack interval and deals damage only once', () => {
  const game = duel();
  game.run('answer(0); D.tick(match,W,4999)');
  assert.equal(game.run('match.players[1].hp'), 800);
  assert.equal(game.run('answer(0)'), false);
  game.run('D.tick(match,W,5000); D.tick(match,W,8000)');
  assert.equal(game.run('match.players[1].hp'), 740);
  assert.equal(game.run('match.players[0].index'), 1);
  assert.equal(game.run('match.players[0].value'), '');
});

test('at least 14 complete attacks and 28 seconds are needed to defeat a full-health opponent', () => {
  const game = duel();
  const saved = game.saved();
  game.run('for(let i=1;i<=13;i++){answer(0);D.tick(match,W,3000+i*2000)}');
  assert.equal(game.run('match.phase'), 'fighting');
  assert.equal(game.run('match.players[1].hp'), 20);
  game.run('answer(0); D.tick(match,W,30999)');
  assert.equal(game.run('match.phase'), 'fighting');
  game.run('D.tick(match,W,31000)');
  assert.equal(game.run('match.phase'), 'finished');
  assert.equal(game.run('match.winner'), 0);
  assert.equal(game.run('match.players[1].hp'), 0);
  assert.equal(game.run('answer(1)'), false);
  game.run('D.tick(match,W,999999)');
  assert.equal(game.run('match.winner'), 0);
  assert.deepEqual(game.saved(), saved);
});

test('simultaneous finishing attacks produce one shared draw', () => {
  const game = duel();
  game.run('for(let i=1;i<=14;i++){answer(0);answer(1);D.tick(match,W,3000+i*2000)}');
  assert.equal(game.run('match.phase'), 'finished');
  assert.equal(game.run('match.winner'), -1);
  assert.deepEqual(game.snapshot('match.players.map(p => p.hp)'), [0, 0]);
});

test('time limit compares HP and cannot accept an attack after the deadline', () => {
  for (const withAttack of [false, true]) {
    const game = duel();
    if (withAttack) game.run('answer(1);D.tick(match,W,5000)');
    game.run('answer(0);D.tick(match,W,183000)');
    assert.equal(game.run('match.phase'), 'finished');
    assert.equal(game.run('match.winner'), withAttack ? 1 : -1);
    assert.equal(game.run('match.players[1].hp'), 800);
  }
});

test('kana players share short, medium and long prompts and damage with roman players', () => {
  const game = duel({ modes: ['kana', 'roman'] });
  const indices = game.snapshot('D.wordPool(match,W).map((_,i)=>i).filter((i,_,pool)=>[3,4,8,12,16,19].some(n=>i===pool.find(j=>D.wordFor(match,W,j).roman.length===n)))');
  assert.equal(indices.length,6);
  for (const [turn, index] of indices.entries()) {
    game.run(`match.players.forEach(p=>{p.index=${index};p.hp=800});answer(0);answer(1);D.tick(match,W,${5000 + turn * 2000})`);
    assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [740, 740]);
    assert.equal(game.run('match.players[0].index === match.players[1].index'), true);
    assert.equal(game.run('D.validSnapshot(D.snapshot(match),W)'), true);
  }
});

test('simple mode mixes every prompt length in the same shuffled cycle for both seats and snapshots', () => {
  const game=duel({start:false});
  game.run(`let seed=19;match.order=D.shuffledOrder(W.length,()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296});
    const pool=D.wordPool(match,W),remote=D.snapshot(match);`);
  assert.deepEqual(game.snapshot('pool'),game.snapshot('match.order'));
  for(const condition of ['w.roman.length<=4','w.roman.length>=10&&w.roman.length<=16','w.roman.length>16']) {
    assert.equal(game.run(`pool.some(i=>{const w=W[i];return ${condition}})`),true);
  }
  assert.equal(game.run(`pool.every((_,i)=>D.wordFor(match,W,i,0)===D.wordFor(match,W,i,1)
    && D.wordFor(match,W,i,0)===D.wordFor(remote,W,i,1)
    && D.wordFor(match,W,i,0)===D.wordFor(match,W,i+pool.length,0))`),true);
});

test('old indices, repeated sequences, other matches, invalid text and supplied damage are rejected', () => {
  const game = duel();
  game.run('const packet = {match:match.id,index:0,seq:1,value:D.wordFor(match,W,0).inputs[0].slice(0,2)}');
  for (const change of ['{match:"old"}', '{index:-1}', '{index:1}', '{seq:NaN}', '{seq:0}', '{seq:1.5}', '{value:null}', '{value:"a".repeat(100)}', '{value:"<script>"}']) {
    assert.equal(game.run(`D.acceptInput(match,W,1,{...packet,...${change}})`), false);
  }
  assert.equal(game.run('D.acceptInput(match,W,1,{...packet,hp:0,damage:999999})'), true);
  assert.equal(game.run('D.acceptInput(match,W,1,packet)'), false);
  assert.deepEqual(game.snapshot('match.players.map(p=>p.hp)'), [800, 800]);
  game.run('answer(1);D.tick(match,W,5000)');
  assert.equal(game.run('D.acceptInput(match,W,1,{...packet,seq:999})'), false);
});

test('snapshot validation bounds all peer-controlled fields and excludes host clock internals', () => {
  const game = duel();
  assert.equal(game.run('D.validSnapshot(D.snapshot(match),W)'), true);
  assert.equal(game.run('"openedAt" in D.snapshot(match).players[0]'), false);
  assert.equal(game.run('"endsAt" in D.snapshot(match)'), false);
  for (const change of ['s.id="bad"', 's.phase="win"', 's.order[0]=-1', 's.order[0]=s.order[1]', 's.remainingMs=Infinity',
    's.players[0].hp=-1', 's.players[0].hp=801', 's.players[0].index=1e9', 's.players[0].value="<img>"',
    's.players[0].name="x".repeat(21)', 's.players[0].mode="html"', 's.players=null', 's.winner=12']) {
    assert.equal(game.run(`(()=>{const s=D.snapshot(match);${change};return D.validSnapshot(s,W)})()`), false, change);
  }
});

test('opening and leaving online mode preserves solo saves and removes online keyboard ownership', () => {
  const game = createGame();
  const saved = game.saved();
  game.run('window.ONLINE_PLAY.open()');
  assert.equal(game.run('document.documentElement.dataset.screen'), 'online');
  assert.equal(game.run('state.running'), false);
  game.run('showScreen("start")');
  assert.equal(game.run('window.ONLINE_PLAY.active'), false);
  assert.deepEqual(game.saved(), saved);
});

test('canceling a connection invalidates later callbacks and permits a fresh attempt', () => {
  const game = createGame();
  game.run('window.crypto={getRandomValues(array){array.fill(123);return array}}; window.Peer=class{constructor(){this.handlers={};window.fakePeer=this}on(type,fn){this.handlers[type]=fn}destroy(){this.destroyed=true}}');
  game.run('window.ONLINE_PLAY.open();window.ONLINE_PLAY.connect(true)');
  game.run('const oldPeer=window.fakePeer;window.ONLINE_PLAY.leave();oldPeer.handlers.open()');
  assert.equal(game.run('window.ONLINE_PLAY.session.peer'), null);
  assert.equal(game.run('window.ONLINE_PLAY.session.room'), '');
  assert.equal(game.run('oldPeer.destroyed'), true);
  game.advance(30000);
  assert.equal(game.run('document.documentElement.dataset.screen'), 'start');
});

test('leaving a live match resets room visibility before a new room is created', () => {
  const game = createGame();
  game.run(`window.crypto={getRandomValues(array){array.fill(123);return array}};
    window.Peer=class{constructor(){this.handlers={};window.fakePeer=this}on(type,fn){this.handlers[type]=fn}destroy(){}};
    window.ONLINE_PLAY.open(); document.querySelector('#onlineScreen').dataset.phase='fighting';
    window.ONLINE_PLAY.leave(); window.ONLINE_PLAY.open(); window.ONLINE_PLAY.connect(true)`);
  game.run('window.fakePeer.open=true;window.fakePeer.handlers.open()');
  assert.equal(game.run('document.querySelector("#onlineScreen").dataset.phase'), 'room');
  assert.equal(game.run('document.querySelector("#onlineRoom").hidden'), false);
  assert.match(game.run('document.querySelector("#onlineCode").textContent'), /^\d{4} \d{4}$/);
  game.run('window.ONLINE_PLAY.leave()');
});

test('silent connections time out without awarding a win and late packets cannot revive a room', () => {
  const game = createGame();
  const saved = game.saved();
  game.run(`window.crypto={getRandomValues(array){array.fill(123);return array}};
    window.Peer=class{constructor(){this.handlers={};window.fakePeer=this}on(type,fn){this.handlers[type]=fn}destroy(){}};
    window.ONLINE_PLAY.open();window.ONLINE_PLAY.connect(true)`);
  game.run(`window.fakePeer.handlers.open();
    const conn={open:false,handlers:{},on(type,fn){this.handlers[type]=fn},send(){},close(){this.open=false}};
    window.fakePeer.handlers.connection(conn);conn.open=true;conn.handlers.open();
    conn.handlers.data({type:'hello',protocol:window.ONLINE_DUEL.signature(window.ONLINE_PLAY.words),name:'相手',mode:'roman'})`);
  assert.equal(game.run('window.ONLINE_PLAY.session.match.phase'), 'lobby');
  game.advance(12100);
  assert.equal(game.run('window.ONLINE_PLAY.session.match'), null);
  assert.equal(game.run('window.ONLINE_PLAY.session.peer'), null);
  assert.match(game.run('document.querySelector("#onlineStatus").textContent'), /通信が途切れ/);
  game.run(`conn.handlers.data({type:'hello',protocol:window.ONLINE_DUEL.signature(window.ONLINE_PLAY.words),name:'遅延',mode:'roman'})`);
  assert.equal(game.run('window.ONLINE_PLAY.session.remote'), null);
  assert.deepEqual(game.saved(), saved);
});

test('missing room errors restore join controls so the player can retry', () => {
  const game = createGame();
  game.run(`window.Peer=class{constructor(){this.handlers={};window.fakePeer=this}on(type,fn){this.handlers[type]=fn}destroy(){}};
    window.ONLINE_PLAY.open();document.querySelector('#onlineRoomInput').value='12345678';window.ONLINE_PLAY.connect(false)`);
  game.run('window.fakePeer.handlers.error({type:"peer-unavailable"})');
  assert.equal(game.run('document.querySelector("#onlineJoin").disabled'), false);
  assert.equal(game.run('document.querySelector("#onlineLobby").hidden'), false);
  assert.match(game.run('document.querySelector("#onlineStatus").textContent'), /部屋が見つかりません/);
  game.advance(30000);
  assert.match(game.run('document.querySelector("#onlineStatus").textContent'), /部屋が見つかりません/);
});
