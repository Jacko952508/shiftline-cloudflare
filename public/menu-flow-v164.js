export const GAME_MODES=[
 {id:'race',name:'RACE',tag:'THE FULL GRID',description:'Eight ships. One finish line. Find your way to the front.',icon:'flag'},
 {id:'trial',name:'TIME ATTACK',tag:'YOU AGAINST THE CLOCK',description:'Chase your best time and race your own ghost.',icon:'clock'},
 {id:'combat',name:'BATTLE MODE',tag:'RACE. AIM. SURVIVE.',description:'Pulse fire, homing missiles and mines. Make every pass count.',icon:'target'},
 {id:'tour',name:'CINEMATIC',tag:'DISPLAY RIDE',description:'Let the ship fly. Sit back and enjoy the circuit.',icon:'film'}
];
export function modeDetails(id){return GAME_MODES.find(m=>m.id===id)||GAME_MODES[0];}
export function createMenuFlow(){
 const state={screen:'home',mode:'race',course:1};
 return{state,home(){state.screen='home';return state;},solo(){state.screen='modes';return state;},mode(id){state.mode=modeDetails(id).id;state.screen='levels';return state;},level(id){if(!Number.isInteger(id)||id<1||id>6)return state;state.course=id;state.screen='demo';return state;},garage(){state.screen='garage';return state;},records(){state.screen='records';return state;},back(){state.screen={demo:'levels',levels:'modes',modes:'home',garage:'home',records:'home'}[state.screen]||'home';return state;}};
}
