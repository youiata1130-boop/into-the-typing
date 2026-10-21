import { createGame } from './game.mjs';
export function simulate(stage, weaponId, interval, seed=1, touch=false) {
  const game = createGame({'into-the-typing.player.v2':JSON.stringify({version:2,totalExperience:515,stats:{attack:2,agility:2},weaponId,introCompleted:true,equipmentTutorialCompleted:true,ironSwordObtained:true,greatswordObtained:true,dualBladesObtained:true,skillTutorialCompleted:true,clearedStages:['forest_path','mist_road','sky_castle','storm_cove','grassland_path','flower_meadow']})},{touch});
  game.run(`let seed=${seed}; Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296); startGame('${stage}'); let nextKeyAt=performance.now()+850; let attacks=0;`);
  for(let time=0;time<120000&&game.run('state.running');time+=20) {
    game.advance(20);
    game.run(`{
      enemyLoop(performance.now());
      if(state.running && state.specialGauge>=100 && useSpecialMove()) attacks++;
      const e=getInputEnemy();
      if(e && performance.now()>=nextKeyAt) {
        ${touch ? `const reading=getFlickReading(e).reading; els.flickInput.value=reading.slice(0,els.flickInput.value.length+1); handleFlickInput({isComposing:false});` : `handleTypingKeydown({key:e.matchedWord[e.typed.length],code:'',preventDefault(){}});`}
        nextKeyAt=performance.now()+${interval};
      }
    }`);
  }
  return game.snapshot('({weapon:state.weaponId,clear:state.cleared===state.roundLimit,hp:state.hp,kills:state.cleared,total:state.roundLimit,specials:attacks,time:performance.now()})');
}
