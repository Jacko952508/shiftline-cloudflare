// CI-only inspection and bounded state setup. Never appended in production.
window.__world177={
 read(){return{state,mode,variant,course,raceShip,handling,along,time,raceEnd,roomHost,roomFinal,pending:roomSession.pending,session:sessionStandings(roomSession),moments:world?.raceMoments?.sites.map(m=>({s:m.s,name:m.name,clearance:m.clearance,visible:m.root.visible,angle:m.rotor.rotation.z})),draws:effects?.sceneStats?.calls,ratio:renderer.getPixelRatio(),clock:sectorClock};},
 moment(index=0){paused=true;state='race';time=20;countdown=0;$('#count').classList.add('off');const m=world.raceMoments.sites[index];along=m.s-85;x=y=vx=vy=bank=0;visualPrevious=null;cameraFollow={x:0,y:.8};const F=track.frame(along);camera.position.copy(track.pose(along-3.8,0,.8));camera.up.copy(F.u);camera.lookAt(track.pose(along+12));render(1/60);renderer.getContext().finish();return this.read();},
 finishMastery(){paused=true;state='race';sectorClock.completed=sectors.map((s,index)=>({index,name:s.name,ms:12000,clean:true}));sectorClock.index=4;tightThreads=3;boostedPasses=6;crashes=0;time=60;along=raceEnd;finishRace();return this.read();},
 finishOnline(){paused=true;state='race';time=80;along=raceEnd;finishRace();return this.read();},
};
