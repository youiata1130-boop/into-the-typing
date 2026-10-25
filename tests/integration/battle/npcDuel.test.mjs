import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function fixture(config = { weaponId: 'dualBlades', hp: 1000, speed: 3 }, mode = 'roman') {
  const game = createGame();
  game.run(`const O=window.ONLINE_PLAY,D=window.ONLINE_DUEL,N=window.ONLINE_NPC,W=O.words;
    const config=${JSON.stringify(config)};
    const order=W.map((_,i)=>i).sort((a,b)=>W[b].reading.length-W[a].reading.length);
    const match=N.createMatch('0123456789abcdef01234567',order,'あなた','${mode}','sword',config);
    const bot=N.create(match,config,()=>1);
    D.ready(match,0,0);D.ready(match,1,0);
    function frame(now){N.step(bot,match,W,now);D.tick(match,W,now)}
    function answer(){const p=match.players[0];return D.acceptInput(match,W,0,{match:match.id,index:p.index,seq:p.seq+1,value:D.targetFor(D.wordFor(match,W,p.index),p.mode)})}
  `);
  return game;
}

test('NPC settings accept four weapons, six HP choices and five speeds without adventure stats', () => {
  const game = fixture(), saved = game.saved();
  assert.deepEqual(game.snapshot('N.hpChoices'), [500,1000,1500,2000,2500,3000]);
  assert.deepEqual(game.snapshot('N.speeds'), [1,2,3,4,6]);
  game.run(`for(const weaponId of Object.keys(D.weapons)) for(const hp of N.hpChoices) for(const speed of N.speeds){
    const m=N.createMatch(match.id,order,'あなた','roman','greatsword',{weaponId,hp,speed});
    if(m.players[0].hp!==1000 || m.players[1].hp!==hp || m.players[1].maxHp!==hp || m.players[1].weaponId!==weaponId)throw Error('NPC setup mismatch');
  }`);
  for (const invalid of ['{weaponId:"branch"}', '{weaponId:"unarmed"}', '{weaponId:"__proto__"}', '{hp:0}', '{hp:750}', '{hp:3500}', '{hp:"500"}', '{speed:0}', '{speed:5}', '{speed:Infinity}', '{speed:"3"}']) {
    assert.equal(game.run(`N.validConfig({...config,...${invalid}})`), false, invalid);
    assert.throws(() => game.run(`N.createMatch(match.id,order,'あなた','roman','sword',{...config,...${invalid}})`));
  }
  assert.deepEqual(game.saved(), saved);
});

test('NPC types one character at a time at the selected rate in roman and kana modes', () => {
  for (const mode of ['roman','kana']) for (const speed of [1,2,3,4,6]) {
    const game = fixture({weaponId:'dualBlades',hp:1000,speed}, mode);
    game.run('for(let now=0;now<=4000;now+=50)frame(now)');
    assert.equal(game.run('match.players[1].value.length'), speed, `${mode} ${speed} chars/sec`);
    assert.equal(game.run('match.players[1].seq'), speed);
    assert.equal(game.run('match.players[0].hp'), 1000);
  }
});

test('NPC waits for countdown, completes the prompt and obeys attack timing and 40 damage', () => {
  const game = fixture({weaponId:'dualBlades',hp:500,speed:6});
  game.run('for(let now=0;now<3000;now+=50)frame(now)');
  assert.equal(game.run('match.players[1].value'), '');
  game.run('for(let now=3000;now<5400;now+=50)frame(now)');
  assert.equal(game.run('match.players[0].hp'), 1000);
  game.run('for(let now=5400;match.players[1].index===0&&now<9000;now+=50)frame(now)');
  assert.equal(game.run('match.players[1].index'), 1);
  assert.equal(game.run('match.players[0].hp'), 960);
  assert.equal(game.run('match.players[1].value'), '');
  game.run('frame(match.clockNow+50)');
  assert.equal(game.run('match.players[0].hp'), 960);
});

test('a stalled frame cannot burst-type a whole prompt or advance a finished battle', () => {
  const game = fixture({weaponId:'dualBlades',hp:1000,speed:6});
  game.run('frame(3000);frame(10000)');
  assert.equal(game.run('match.players[1].value.length'), 1);
  game.run('D.tick(match,W,match.endsAt);const seq=match.players[1].seq;N.step(bot,match,W,999999)');
  assert.equal(game.run('match.players[1].seq===seq'), true);
  assert.equal(game.run('match.phase'), 'finished');
});

for (const weapon of ['sword','greatsword','swordShield']) {
  test(`NPC ${weapon} reacts to the visible windup using legal defense and its usual cost`, () => {
    const game = fixture({weaponId:weapon,hp:1000,speed:1});
    game.run('frame(3000);answer();D.tick(match,W,5000);bot.random=()=>0;N.step(bot,match,W,5000);N.step(bot,match,W,5250)');
    assert.equal(game.run(weapon === 'sword' ? 'match.players[1].counterStartedAt!==null' : 'match.players[1].guarding'), true);
    game.run('D.tick(match,W,5400)');
    assert.equal(game.run('match.players[1].feedback'), weapon === 'sword' ? 'counter' : 'justGuard');
    assert.equal(game.run('match.players[1].defenseCost'), weapon === 'sword' ? 60 : 30);
    assert.equal(game.run('match.players[1].hp'), weapon === 'sword' ? 1000 : 990);
  });
}

test('NPC greatsword cannot guard midway through a word and defense is not guaranteed', () => {
  const game = fixture({weaponId:'greatsword',hp:1000,speed:3});
  game.run('frame(3000);answer();D.tick(match,W,5000);bot.random=()=>0;N.step(bot,match,W,5000);N.step(bot,match,W,5200);N.step(bot,match,W,5250)');
  assert.ok(game.run('match.players[1].value.length') > 0);
  assert.equal(game.run('match.players[1].guarding'), false);
  game.run('D.tick(match,W,5400)');
  assert.equal(game.run('match.players[1].hp'), 960);
  const noDefense = fixture({weaponId:'swordShield',hp:1000,speed:1});
  noDefense.run('frame(3000);answer();D.tick(match,W,5000);N.step(bot,match,W,5000);N.step(bot,match,W,5250);D.tick(match,W,5400)');
  assert.equal(noDefense.run('match.players[1].hp'), 960);
});

function localGame(touch = false) {
  const game = createGame({}, { touch });
  game.run(`const O=window.ONLINE_PLAY,D=window.ONLINE_DUEL,N=window.ONLINE_NPC,W=O.words;
    let seed=10;window.crypto={getRandomValues(a){a.fill(seed++);return a}};
    window.Peer=class{constructor(){throw Error('NPC must not connect to PeerJS')}};
    O.open('npc');`);
  return game;
}

test('NPC starts without a connection and keeps online handicaps out of local NPC health', () => {
  const game = localGame();
  game.run(`O.session.handicapRatio=3;O.session.handicapSeat=0;O.chooseWeapon('greatsword');
    O.setNpcConfig({weaponId:'swordShield',hp:500,speed:2});O.startNpc();O.connect(true);`);
  assert.equal(game.run('O.session.peer'), null);
  assert.equal(game.run('O.session.conn'), null);
  assert.equal(game.run('document.querySelector("#onlineTitle").textContent'), 'NPC戦');
  assert.equal(game.run('document.querySelector("#onlineLobby").hidden'), true);
  assert.deepEqual(game.snapshot('O.session.match.players.map(p=>[p.weaponId,p.hp,p.maxHp])'), [['greatsword',1000,1000],['swordShield',500,500]]);
  assert.equal(game.run('O.setNpcConfig({weaponId:"sword",hp:1000,speed:6})'), false);
  assert.equal(game.run('O.startNpc()'), false, 'cannot restart an active fight');
  game.advance(4000);
  assert.equal(game.run('O.session.match.players[1].value.length'), 2);
  assert.equal(game.run('document.querySelector("#onlineOpponentTyped").textContent.length'), 2);
  assert.equal(game.run('document.querySelector("#onlineOtherBar").max'), 500);
});

test('local roman and flick input, guarding and counter work without a fake connection', () => {
  for (const touch of [false, true]) {
    const game = localGame(touch);
    game.run('O.chooseWeapon("swordShield");O.startNpc()'); game.advance(3000);
    assert.equal(game.run('O.defense("guard-start")'), true);
    assert.equal(game.run('O.input("a")'), false);
    assert.equal(game.run('O.defense("guard-end")'), true);
    assert.equal(game.run('(()=>{const t=D.targetFor(D.wordFor(O.session.match,W,0),O.session.mode);return O.session.mode==="kana"?O.applyKana(t):O.input(t)})()'), true);
    game.advance(2450);
    assert.equal(game.run('O.session.match.players[0].index'), 1);
    assert.equal(game.run('document.querySelector("#onlineKeyboard").hidden'), !touch);
  }
  const game = localGame();game.run('O.startNpc()');game.advance(3000);
  assert.equal(game.run('O.defense("counter")'), true);
  assert.equal(game.run('O.session.match.players[0].counterStartedAt!==null'), true);
});

test('hidden NPC battle pauses typing, attacks and time, then resumes without catch-up', () => {
  const game = localGame();
  game.run('O.startNpc()');game.advance(3500);
  const before = game.snapshot('({hp:O.session.match.players.map(p=>p.hp),value:O.session.match.players[1].value,remaining:O.session.match.remainingMs})');
  game.run('document.hidden=true;document.dispatchEvent({type:"visibilitychange"})');
  game.advance(200000);
  assert.deepEqual(game.snapshot('({hp:O.session.match.players.map(p=>p.hp),value:O.session.match.players[1].value,remaining:O.session.match.remainingMs})'), before);
  assert.equal(game.run('O.input("a")'), false);
  game.run('document.hidden=false;document.dispatchEvent({type:"visibilitychange"})');
  assert.equal(game.run('O.session.match.phase'), 'fighting');
  assert.equal(game.run('O.session.match.remainingMs'), before.remaining);
  game.advance(1000);
  assert.equal(game.run('O.session.match.players[1].value.length'), before.value.length + 3);
});

test('NPC countdown resumes after returning from a hidden tab', () => {
  const game = localGame();game.run('O.startNpc()');game.advance(1000);
  game.run('document.hidden=true;document.dispatchEvent({type:"visibilitychange"})');game.advance(60000);
  game.run('document.hidden=false;document.dispatchEvent({type:"visibilitychange"})');game.advance(1999);
  assert.equal(game.run('O.session.match.phase'), 'countdown');game.advance(1);
  assert.equal(game.run('O.session.match.phase'), 'fighting');
  assert.equal(game.run('O.session.match.remainingMs'), 180000);
});

test('NPC rematch restores chosen HP and settings; setup can be changed after a result', () => {
  const game = localGame(), saved = game.saved();
  game.run('O.setNpcConfig({weaponId:"dualBlades",hp:2500,speed:4});O.startNpc()');game.advance(3000);
  game.run('const oldId=O.session.match.id;O.session.match.players[1].hp=0');game.advance(50);
  assert.equal(game.run('document.querySelector("#onlineBanner").textContent'), '勝利！');
  assert.equal(game.run('document.querySelector("#npcSettings").hidden'), false);
  game.run('O.ready()');
  assert.equal(game.run('O.session.match.id!==oldId'), true);
  assert.deepEqual(game.snapshot('O.session.match.players.map(p=>p.hp)'), [1000,2500]);
  assert.equal(game.run('O.session.npcBot.speed'), 4);
  game.advance(3000);game.run('O.session.match.players[0].hp=0');game.advance(50);
  assert.equal(game.run('document.querySelector("#onlineBanner").textContent'), '敗北');
  game.run('O.npcSettings();O.setNpcConfig({weaponId:"greatsword",hp:500,speed:1})');
  assert.equal(game.run('O.session.match'), null);
  assert.equal(game.run('document.querySelector("#npcStart").hidden'), false);
  assert.deepEqual(game.snapshot('O.session.npcConfig'), {weaponId:'greatsword',hp:500,speed:1});
  assert.deepEqual(game.saved(), saved);
});

test('leaving NPC mode stops its timer and restores the online setup and its settings', () => {
  const game = localGame();game.run('O.session.handicapRatio=1.5;O.startNpc()');game.advance(5000);
  game.run('const previous=O.session.match;const value=previous.players[1].value;O.leave()');game.advance(180000);
  assert.equal(game.run('previous.players[1].value'), game.run('value'));
  assert.equal(game.run('O.session.timer'), 0);
  assert.equal(game.run('O.session.npcBot'), null);
  game.run('O.open()');
  assert.equal(game.run('document.querySelector("#onlineTitle").textContent'), 'オンライン対戦');
  assert.equal(game.run('document.querySelector("#npcStart").hidden'), true);
  assert.equal(game.run('document.querySelector("#onlineLobby").hidden'), false);
  assert.equal(game.run('document.querySelector("#onlineHandicapRatio").value'), '1.5');
});
