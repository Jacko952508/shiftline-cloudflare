// Appended only by CI. Production does not expose simulation controls.
const realEncounterProfile176=encounterProfile;
encounterProfile=()=>location.search.includes('classicqa=1')?'classic':realEncounterProfile176();
window.__flow176={
 read(){return {variant,mode,practiceSector,along,raceEnd,time,paused,state,rivals:rivals.length,splitCount:sectorClock?.completed.length,sectors,specs:specs.map(o=>({id:o.id,s:o.s,choice:o.choice})),budget:world?.renderBudget,draws:effects?.sceneStats?.calls,triangles:effects?.sceneStats?.triangles,ratio:renderer.getPixelRatio(),shadow:world?.key?.shadow.mapSize.toArray(),clock:sectorClock};},
 tick(){paused=true;state='race';$('#count').classList.add('off');step(STEP);step(STEP);render(STEP);return this.read();},
 finish(impact=false){paused=true;state='race';if(impact){crashes++;sectorClock.clean=false;}const start=sectors[practiceSector].start,end=raceEnd;time=(end-start-2)/84;along=end-2;sectorClock.previousDistance=along;sectorClock.previousTime=time;dead=0;speed=84;for(let i=0;i<5&&state!=='finished';i++)step(STEP);return this.read();},
 practice(index){beginPractice(index);},
};
