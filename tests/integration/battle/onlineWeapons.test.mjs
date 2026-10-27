import assert from "node:assert/strict";
import test from "node:test";
import { createGame } from "../../helpers/game.mjs";

function battle(weapons = ['sword', 'swordShield'], modes = ['roman', 'roman'], start = true) {
  const game = createGame();
  game.run(`const D=window.ONLINE_DUEL,W=window.ONLINE_PLAY.words;
    const order=W.map((_,i)=>i).sort((a,b)=>W[b].roman.length-W[a].roman.length);
    const match=D.create('0123456789abcdef01234567',order,['甲','乙'],${JSON.stringify(modes)},
      {battleMode:'weapons',weapons:${JSON.stringify(weapons)}});
    function word(seat){return D.wordFor(match,W,match.players[seat].index,seat)}
    function profile(seat){const p=match.players[seat];return D.attackProfile(word(seat),p.mode,p.value)}
    function typeFor(seat,value,now=match.clockNow,pending=false){const p=match.players[seat];
      return D.acceptInput(match,W,seat,{match:match.id,index:p.index,seq:p.seq+1,value,pending},now)}
    function answer(seat){const p=match.players[seat];return typeFor(seat,D.targetFor(word(seat),p.mode))}
    function defend(seat,action,now){return D.defense(match,W,seat,{match:match.id,seq:match.players[seat].defenseSeq+1,action},now)}
    function launch(seat){answer(seat);const p=match.players[seat];D.tick(match,W,Math.max(match.clockNow,p.openedAt+profile(seat).inputMs));return p.attackAt}
  `);
  if(start)game.run('D.ready(match,0,0);D.ready(match,1,0);D.tick(match,W,3000)');
  return game;
}

test('only four weapons are selectable; changes reset ready states and lock at countdown',()=>{
  const g=battle(undefined,undefined,false);
  assert.deepEqual(g.snapshot('Object.keys(D.weapons)'),['sword','greatsword','dualBlades','swordShield']);
  for(const id of ['branch','unarmed','__proto__','constructor','',null]){
    assert.equal(g.run(`D.chooseWeapon(match,0,${JSON.stringify(id)})`),false);
    assert.throws(()=>g.run(`D.create(match.id,order,['a','b'],['roman','roman'],{battleMode:'weapons',weapons:[${JSON.stringify(id)},'sword']})`));
  }
  g.run('D.ready(match,0,0);D.chooseWeapon(match,1,"dualBlades")');
  assert.deepEqual(g.snapshot('match.players.map(p=>p.ready)'),[false,false]);
  g.run('D.ready(match,0,0);D.ready(match,1,0)');
  assert.equal(g.run('D.chooseWeapon(match,0,"greatsword")'),false);
});

test('each seat gets its weapon range, with repeatable shuffled cycles and no stale pool after changing weapon',()=>{
  const g=battle(undefined,undefined,false);
  for(const [id,min,max] of [['sword',2,8],['swordShield',2,8],['dualBlades',2,4],['greatsword',12,20]]){
    g.run(`D.chooseWeapon(match,1,'${id}')`);
    const lengths=g.snapshot('D.wordPool(match,W,1).map(i=>Math.min(...W[i].inputs.map(s=>s.length)))');
    assert.ok(lengths.length>=12,id+' repertoire');
    assert.ok(lengths.every(n=>n>=min&&n<=max),id+' range');
    assert.equal(g.run('D.wordFor(match,W,0,1)===D.wordFor(match,W,D.wordPool(match,W,1).length,1)'),true);
    assert.equal(g.run('D.wordFor(match,W,0,1).text===D.wordFor(D.snapshot(match),W,0,1).text'),true);
  }
  g.run('D.chooseWeapon(match,0,"dualBlades");D.ready(match,0,0);D.ready(match,1,0);D.tick(match,W,3000)');
  assert.equal(g.run('typeFor(1,D.targetFor(word(0),"roman"))'),false,'cannot answer the opponent’s short prompt');
  assert.equal(g.run('answer(1)'),true);
  assert.equal(g.run('D.validSnapshot(D.snapshot(match),W)'),true);
});

test('damage and minimum attack duration scale equally with actual roman or kana input length',()=>{
  const g=battle();
  assert.equal(g.run(`W.every(w=>['roman','kana'].every(mode=>
    (mode==='roman'?w.inputs.filter(value=>D.targetFor(w,mode,value)===value):[w.reading]).every(value=>{const p=D.attackProfile(w,mode,value);
      return p.damage===value.length*4&&p.inputMs===value.length*200&&p.windupMs===value.length*40})))`),true);
  for(const id of ['dualBlades','sword','greatsword']){
    const b=battle([id,'swordShield']);
    b.run('const power=profile(0);answer(0);D.tick(match,W,3000+power.inputMs-1)');
    assert.equal(b.run('match.players[0].attackAt'),null);
    b.run('D.tick(match,W,3000+power.inputMs);const hitAt=match.players[0].attackAt');
    assert.equal(b.run('D.snapshot(match).players[0].attackWaitMs'),b.run('power.windupMs'));
    assert.equal(b.run('answer(0)'),false);
    b.run('D.tick(match,W,hitAt-1)');assert.equal(b.run('match.players[1].hp'),1000);
    b.run('D.tick(match,W,hitAt);D.tick(match,W,hitAt+1)');
    assert.equal(b.run('match.players[1].hp'),1000-b.run('power.damage'));
    assert.equal(b.run('match.players[0].attacks'),1);
  }
});

for(const elapsed of [201,200,1])test(`guard at ${elapsed} ms borrows exactly the prevented variable damage`,()=>{
  const g=battle();g.run(`const power=profile(0).damage;const hitAt=launch(0);defend(1,'guard-start',hitAt-${elapsed})`);
  assert.equal(g.run('defend(1,"guard-start",hitAt-1)'),false);
  assert.equal(g.run('typeFor(1,D.targetFor(word(1),"roman").slice(0,1),hitAt-1)'),false);
  g.run('D.tick(match,W,hitAt)');
  const power=g.run('power'),taken=Math.ceil(power*(elapsed>200?.5:.25)),cost=power-taken;
  assert.equal(g.run('match.players[1].hp'),1000-taken);
  assert.equal(g.run('match.players[1].defenseCost'),cost);
  assert.equal(g.run('match.players[1].feedback'),elapsed>200?'guard':'justGuard');
  assert.equal(g.run('defend(1,"guard-start",hitAt+1)'),false);
  g.run('let repaid=0;while(match.players[1].defenseCost){const p=profile(1).damage;const at=launch(1);D.tick(match,W,at);repaid+=p}');
  assert.equal(g.run('match.players[0].hp'),1000-(g.run('repaid')-cost));
  assert.equal(g.run('defend(1,"guard-start",match.clockNow+1)'),true);
});

test('greatsword permits guard only before typing or after completion, including unfinished kana',()=>{
  const g=battle(['greatsword','swordShield'],['kana','roman']);
  g.run('typeFor(0,word(0).reading.slice(0,1))');assert.equal(g.run('defend(0,"guard-start",3001)'),false);
  g.run('typeFor(0,"",3002,true)');assert.equal(g.run('defend(0,"guard-start",3003)'),false);
  g.run('typeFor(0,"",3004,false)');assert.equal(g.run('defend(0,"guard-start",3005)'),true);
  assert.equal(g.run('answer(0)'),false);
  g.run('defend(0,"guard-end",3006);answer(0)');assert.equal(g.run('defend(0,"guard-start",3007)'),true);
  g.run('typeFor(1,word(1).inputs[0].slice(0,2),3008)');assert.equal(g.run('defend(1,"guard-start",3009)'),true);
});

test('counter reflects up to 20, repays all prevented/reflected power and cannot be chained',()=>{
  const g=battle(['dualBlades','sword']);g.run('const power=profile(0).damage;const hitAt=launch(0);defend(1,"counter",hitAt-100)');
  assert.equal(g.run('answer(1)'),false);
  g.run('D.tick(match,W,hitAt)');
  const reflected=Math.min(20,g.run('power')),cost=g.run('power')+reflected;
  assert.deepEqual(g.snapshot('match.players.map(p=>p.hp)'),[1000-reflected,1000]);
  assert.equal(g.run('match.players[1].defenseCost'),cost);
  assert.equal(g.run('defend(1,"counter",hitAt+1)'),false);
  g.run('let paid=0;while(match.players[1].defenseCost){const power=profile(1).damage;const at=launch(1);D.tick(match,W,at);paid+=power}');
  assert.equal(g.run('match.players[0].hp'),1000-reflected-(g.run('paid')-cost));
});

test('expired counter fails, forbidden defenses and skills cannot be invoked',()=>{
  const g=battle(['swordShield','sword']);g.run('const power=profile(0).damage;const hitAt=launch(0);defend(1,"counter",hitAt-201);D.tick(match,W,hitAt)');
  assert.deepEqual(g.snapshot('match.players.map(p=>p.hp)'),[1000,1000-g.run('power')]);
  assert.equal(g.run('defend(1,"counter",hitAt+398)'),false);
  assert.equal(g.run('defend(1,"counter",hitAt+399)'),true);
  const d=battle(['dualBlades','sword']);
  for(const [seat,action] of [[0,'guard-start'],[0,'counter'],[1,'guard-start'],[1,'skill']])assert.equal(d.run(`defend(${seat},'${action}',3001)`),false);
});

test('simultaneous counter and just guard preserve both effects, and empty swings release guard',()=>{
  const g=battle(['sword','swordShield']);g.run('answer(0);answer(1);D.tick(match,W,3000+profile(0).inputMs);const at=match.players[0].attackAt;defend(0,"counter",at-100);defend(1,"guard-start",at-100);D.tick(match,W,at)');
  assert.deepEqual(g.snapshot('match.players.map(p=>p.feedback)'),['counter','justGuard']);
  const e=battle();e.run('match.players[0].defenseCost=profile(0).damage;const at=launch(0);defend(1,"guard-start",at-100);D.tick(match,W,at)');
  assert.equal(e.run('match.players[1].guarding'),false);assert.equal(e.run('match.players[1].hp'),1000);
});

test('late and replayed defense cannot change state; debt is settled at timeout and knockout',()=>{
  const g=battle();
  for(const change of ['{match:"old"}','{seq:0}','{seq:NaN}','{seq:1.5}','{action:"skill"}'])assert.equal(g.run(`D.defense(match,W,1,{match:match.id,seq:1,action:'guard-start',...${change}},3000)`),false);
  g.run('defend(1,"guard-start",3000)');
  assert.equal(g.run('D.defense(match,W,1,{match:match.id,seq:1,action:"guard-end"},3001)'),false);
  assert.equal(g.run('defend(1,"guard-end",match.endsAt)'),false);
  assert.equal(g.run('defend(1,"guard-end",NaN)'),false);
  for(const kind of ['sword','greatsword','swordShield'])for(const finish of ['timeout','knockout']){
    const b=battle(['dualBlades',kind]);
    b.run(`const damage=profile(0).damage;const at=launch(0);defend(1,'${kind==='sword'?'counter':'guard-start'}',at-100);D.tick(match,W,at);
      const hp=match.players[1].hp, debt=match.players[1].defenseCost;
      ${finish==='timeout'?'D.tick(match,W,match.endsAt)':'match.players[0].hp=0;D.tick(match,W,at+1)'}`);
    assert.equal(b.run('match.players[1].hp'),b.run('hp-debt'));
    assert.deepEqual(b.snapshot('match.players.map(p=>p.defenseCost)'),[0,0]);
    assert.equal(b.run('D.validSnapshot(D.snapshot(match),W)'),true);
  }
});

test('equal-speed weapons stay within one heavy hit over complete matches, across orders and input modes',()=>{
  const g=battle();
  const results=g.snapshot(`(()=>{const out=[];
    for(const a of Object.keys(D.weapons))for(const b of Object.keys(D.weapons))for(const speed of [2,5,10])for(const mode of ['roman','kana'])for(const withDefense of [false,true])for(const seed of [13,89,431]){
      let rng=seed;const order=D.shuffledOrder(W.length,()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296});
      const m=D.create(match.id,order,['A','B'],[mode,mode],{battleMode:'weapons',weapons:[a,b]});D.ready(m,0,0);D.ready(m,1,0);D.tick(m,W,3000);
      for(let now=3000;m.phase==='fighting'&&now<=183000;now+=50){for(let seat=0;seat<2;seat++){
        const p=m.players[seat],target=D.targetFor(D.wordFor(m,W,p.index,seat),mode,p.value),n=Math.min(target.length,Math.floor((now-p.openedAt)/1000*speed));
        if(n>p.value.length)D.acceptInput(m,W,seat,{match:m.id,index:p.index,seq:p.seq+1,value:target.slice(0,n)},now);
        const other=m.players[1-seat],kind=D.weapons[p.weaponId].defense;
        if(withDefense&&other.attackAt!==null&&other.attackAt-now<=100&&!p.defenseCost&&kind!=='none')
          D.defense(m,W,seat,{match:m.id,seq:p.defenseSeq+1,action:kind==='counter'?'counter':'guard-start'},now);
      }D.tick(m,W,now)}
      out.push({a,b,speed,mode,withDefense,seed,winner:m.winner,gap:Math.abs(m.players[0].hp-m.players[1].hp),valid:D.validSnapshot(D.snapshot(m),W)});
    }return out})()`);
  assert.equal(results.length,576);
  for(const r of results){assert.ok(r.gap<=80,JSON.stringify(r));assert.equal(r.valid,true,JSON.stringify(r));if(r.a===r.b)assert.equal(r.winner,-1,JSON.stringify(r));}
});

test('snapshots validate each seat’s prompt, bounded defense fields and relative attack timing',()=>{
  const g=battle(['greatsword','dualBlades']);g.run('const at=launch(0)');
  assert.equal(g.run('D.validSnapshot(D.snapshot(match),W)'),true);
  assert.deepEqual(g.snapshot('Object.keys(D.snapshot(match).players[0]).filter(k=>/At$/.test(k))'),[]);
  for(const change of ['s.battleMode="other"','s.players[0].weaponId="branch"','s.players[1].guarding=true','s.players[0].countering=true','s.players[0].attackWaitMs=1601','s.players[0].counterWaitMs=601','s.players[0].defenseCost=181','s.players[0].defenseCost=-1','s.players[0].feedback="<script>"','s.players[0].pendingInput="yes"','s.players[1].value=s.players[0].value']){
    assert.equal(g.run(`(()=>{const s=D.snapshot(match);${change};return D.validSnapshot(s,W)})()`),false,change);
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
