import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame } from '../../helpers/game.mjs';

const onlinePrompts = ['onlineTarget', 'onlineTyped', 'onlineRemaining', 'onlineOpponentTarget',
  'onlineOpponentTyped', 'onlineOpponentRemaining', 'onlineOpponentCount', 'onlineNextTranslation', 'onlineNextTarget'];
function assertOnlineBlank(game) {
  for (const id of onlinePrompts) assert.equal(game.run(`document.querySelector('#${id}').textContent`), '', id);
  assert.equal(game.run('document.querySelector("#onlineNext").hidden'), true);
}

for (const battleMode of ['simple', 'weapons']) for (const mode of ['roman', 'kana']) {
  test(`${battleMode}/${mode}: neither player's words are displayed until the fighting snapshot, including rematches`, () => {
    const game = createGame({}, { touch: mode === 'kana' });
    game.run(`const O=window.ONLINE_PLAY,D=window.ONLINE_DUEL,W=O.words;
      O.open();O.session.host=false;O.session.seat=1;O.session.remote={name:'相手'};
      O.session.peer={destroy(){}};O.session.conn={open:true,send(){},close(){}};
      const match=D.create('0123456789abcdef01234567',W.map((_,i)=>i),['相手','あなた'],['roman','${mode}'],
        {battleMode:'${battleMode}',weapons:['greatsword','dualBlades']});
      O.receive({type:'state',match:D.snapshot(match)});`);
    assertOnlineBlank(game);
    game.run('D.ready(match,0,0);D.ready(match,1,0);O.receive({type:"state",match:D.snapshot(match)})');
    assertOnlineBlank(game);
    assert.equal(game.run('O.input(D.wordFor(match,W,0,1).inputs[0])'), false);
    assert.equal(game.run('O.applyKana(D.wordFor(match,W,0,1).reading)'), false);
    game.run('D.tick(match,W,2999);O.receive({type:"state",match:D.snapshot(match)})');
    assertOnlineBlank(game);
    game.run('D.tick(match,W,3000);O.receive({type:"state",match:D.snapshot(match)})');
    assert.equal(game.run('document.querySelector("#onlineTarget").textContent'), game.run('D.wordFor(match,W,0,1).text'));
    assert.equal(game.run('document.querySelector("#onlineRemaining").textContent'), game.run(`D.targetFor(D.wordFor(match,W,0,1),'${mode}')`));
    assert.equal(game.run('document.querySelector("#onlineOpponentTarget").textContent'), game.run('D.wordFor(match,W,0,0).text'));
    assert.equal(game.run('document.querySelector("#onlineTyped").textContent'), '');
    assert.equal(game.run('document.querySelector("#onlineNext").hidden'), battleMode === 'simple');
    game.run(`match.phase='finished';match.winner=-1;match.revision++;O.receive({type:'state',match:D.snapshot(match)});
      const next=D.create('abcdef0123456789abcdef01',[...match.order].reverse(),['相手','あなた'],['roman','${mode}'],
        {battleMode:'${battleMode}',weapons:['greatsword','dualBlades']});
      O.receive({type:'state',match:D.snapshot(next)});`);
    assertOnlineBlank(game);
  });
}

for (const touch of [false, true]) {
  test(`NPC ${touch ? 'flick' : 'keyboard'}: countdown hides both prompts and dual preview, then reveals them together`, () => {
    const game = createGame({}, { touch });
    game.run(`const O=window.ONLINE_PLAY,D=window.ONLINE_DUEL,W=O.words;
      let seed=10;window.crypto={getRandomValues(a){a.fill(seed++);return a}};
      O.open('npc');O.chooseWeapon('dualBlades');O.startNpc();`);
    assertOnlineBlank(game);
    game.advance(2999);assertOnlineBlank(game);
    game.advance(1);
    assert.equal(game.run('O.session.match.phase'), 'fighting');
    assert.equal(game.run('document.querySelector("#onlineTarget").textContent'), game.run('D.wordFor(O.session.match,W,0,0).text'));
    assert.equal(game.run('document.querySelector("#onlineOpponentTarget").textContent'), game.run('D.wordFor(O.session.match,W,0,1).text'));
    assert.equal(game.run('document.querySelector("#onlineNextTranslation").textContent'), game.run('D.wordFor(O.session.match,W,1,0).text'));
    game.run('O.session.match.players[1].hp=0');game.advance(50);game.run('O.ready()');
    assert.equal(game.run('O.session.match.phase'), 'countdown');assertOnlineBlank(game);
  });

  test(`adventure ${touch ? 'flick' : 'keyboard'}: start notice hides prompts and drops early input until its exact end`, () => {
    const game = createGame({ 'into-the-typing.player.v2': JSON.stringify({ version: 2, totalExperience: 415,
      stats: { attack: 2, agility: 1 }, weaponId: 'dualBlades', introCompleted: true, equipmentTutorialCompleted: true,
      ironSwordObtained: true, greatswordObtained: true, dualBladesObtained: true, swordShieldObtained: true,
      skillTutorialCompleted: true, clearedStages: ['forest_path', 'mist_road', 'sky_castle', 'storm_cove'] }) }, { touch });
    game.run(`startGame('grassland_path');const enemy=getCurrentEnemy();const hp=enemy.hp;
      for(const key of [enemy.matchedWord[0],'Backspace'])handleTypingKeydown({key,code:'',preventDefault(){}});
      applyTypedValue(enemy,enemy.matchedWord);damageEnemy(enemy);applyGameFlickKey('ka');`);
    const assertBlank = () => {
      for(const field of ['wordTranslation','typedWord','remainingWord','nextWordTranslation','nextWordTarget'])
        assert.equal(game.run(`els.${field}.textContent`), '', field);
      assert.equal(game.run('els.nextWordPreview.hidden'), true);
      assert.equal(game.run('getInputEnemy()'), null);
      assert.equal(game.run('canUseGameFlickKeyboard()'), false);
    };
    assertBlank();
    assert.equal(game.run('enemy.hp'), game.run('hp'));
    assert.equal(game.run('enemy.typed'), '');assert.equal(game.run('state.inputBuffer.length'), 0);
    game.advance(game.run('startNoticeMs')-1);assertBlank();game.advance(1);
    assert.equal(game.run('els.wordTranslation.textContent'), game.run('enemy.translation'));
    assert.ok(game.run('els.remainingWord.textContent.length')>0);
    assert.equal(game.run('els.typedWord.textContent'), '');
    assert.equal(game.run('getInputEnemy()===enemy'), true);
    assert.equal(game.run('els.nextWordPreview.hidden'), false);
    assert.equal(game.run('canUseGameFlickKeyboard()'), touch);
    game.run('startGame("grassland_path")');assertBlank();
  });
}
