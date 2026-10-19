import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createTrack} from '../public/race-track.js';
import {courseSectors,createSectorClock,advanceSectorClock,ghostTimeAt,saveSectorRun,sectorKey,archiveLegacyRecord,currentGhost} from '../public/race-sectors-v176.js';
import {specifications} from '../public/course-colliders.js';
import {familySpecifications} from '../public/hazard-families-v156.js';
import {planTarget,clearance,obstacleState} from '../public/race-obstacles.js';
import {optimiseTunnel} from '../public/race-render-budget-v176.js';
import {steeringBank} from '../public/race-craft.js';
import {createTrackDemo,advanceTrackDemo} from '../public/track-demo-v164.js';
import {awardRace} from '../public/progress.js';
import {collisionAt} from '../public/race-obstacles.js';
import {flightPressure,flightShake} from '../public/flight-feedback-v176.js';
let gates=0,paths=0;
for(let course=1;course<=6;course++){
 const track=createTrack(course),sectors=courseSectors(course,track.length);assert.equal(sectors.length,4);assert.equal(sectors[0].start,8);assert.equal(sectors[3].end,track.length);
 assert.deepEqual(specifications(course,track.length),familySpecifications(course,track.length),'Online default layout changed');
 const flow=specifications(course,track.length,'flow176');assert.ok(flow.length>=20);assert.ok(flow.some(o=>o.choice));assert.equal(new Set(flow.map(o=>o.id)).size,flow.length);
 for(let i=0;i<flow.length;i++){const o=flow[i];gates++;if(i)assert.ok(o.s-flow[i-1].s>=132);const sector=sectors[o.theme-1];assert.ok(o.s-sector.start>=140&&sector.end-o.s>=140);
  for(const time of [0,7,23,51]){const p=planTarget(o,time+o.s/123);assert.ok(p,'No safe line '+JSON.stringify({course,id:o.id,time}));assert.ok(clearance(o,obstacleState(o,time+o.s/123),p.x,p.y)>.28);paths++;}
 }
 // Follow the actual acceleration, damping and bank model through entire courses.
 for(const speed of [84,123])for(const phase of [0,17]){let distance=8,px=0,py=0,vx=0,vy=0,bank=0,t=phase,next=phase,target={x:0,y:0};while(distance<track.length){const dt=1/120;if(t>=next){next=t+.08;const gate=flow.find(o=>o.s>distance-2&&o.s<distance+255);target=gate?planTarget(gate,t+Math.max(0,gate.s-distance)/speed,px,py)||target:{x:0,y:0};}vx+=(target.x-px)*70*dt;vy+=(target.y-py)*70*dt;vx*=Math.exp(-14*dt);vy*=Math.exp(-14*dt);px+=vx*dt;py+=vy*dt;bank=steeringBank(bank,vx,dt);distance+=speed*dt;t+=dt;assert.equal(collisionAt(track,flow,distance,px,py,t,bank),null,'Authored sequence lacks a continuously flyable line '+JSON.stringify({course,speed,phase,distance}));}}
 const demo=createTrackDemo(track,flow);while(demo.laps===0){advanceTrackDemo(demo,.1);assert.equal(collisionAt(track,flow,demo.distance,demo.x,demo.y,demo.time),null,'New demo contacts a hazard');}
 const clock=createSectorClock(sectors);for(let t=0;t<track.length/100+1;t+=1/120)advanceSectorClock(clock,8+t*100,t);assert.equal(clock.completed.length,4);for(const c of clock.completed){assert.ok(c.clean);assert.ok(Math.abs(c.ms-(sectors[c.index].end-sectors[c.index].start)*10)<1);}
 const practice=createSectorClock(sectors,2);advanceSectorClock(practice,sectors[2].end+1,15,true);const p={xp:42,records:{1:1000},ghosts:{},medals:{}};assert.equal(saveSectorRun(p,course,practice,{practice:true}),false);assert.equal(p.xp,42);assert.equal(p.records[1],1000);practice.completed[0].clean=true;assert.ok(saveSectorRun(p,course,practice,{practice:true,ghost:[[0,sectors[2].start,0,0],[15,sectors[2].end,0,0]]}));assert.equal(p.sectorBests[sectorKey(course,true)][2].ms,practice.completed[0].ms);assert.equal(p.sectorBests[sectorKey(course)],undefined);
}
assert.equal(ghostTimeAt([[0,8],[2,208],[5,508]],308),3);assert.equal(ghostTimeAt([[0,8]],7),null);assert.equal(ghostTimeAt([],8),null);
const legacy={records:{1:100},ghosts:{1:[[0,8]]},medals:{1:'GOLD'},xp:123};assert.deepEqual(currentGhost(legacy,1),[]);archiveLegacyRecord(legacy,1);assert.equal(legacy.courseArchive['1v175'].record,100);assert.equal(legacy.xp,123);assert.equal(legacy.records[1],undefined);legacy.records[1]=200;archiveLegacyRecord(legacy,1);assert.equal(legacy.records[1],200);
globalThis.localStorage={setItem(){}};const p={xp:100,races:3,craft:0,color:0,custom:{},records:{1:112000},ghosts:{1:[[0,8]]},medals:{1:'GOLD'}};const reward=awardRace(p,{course:1,time:120000,place:1,crashes:0,passes:10,maxCombo:10,ghost:[[0,8],[120,9000]],revision:176});assert.ok(reward.best&&reward.saved);assert.equal(p.records[1],120000);assert.equal(p.courseArchive['1v175'].record,112000);assert.equal(p.recordVersions[1],176);
// Compare complete transformed vertex/normal/UV arrays before and after batching.
const root=new THREE.Group(),chunk=new THREE.Group(),mat=new THREE.MeshStandardMaterial();root.add(chunk);chunk.position.set(8,4,-7);const a=new THREE.Mesh(new THREE.BoxGeometry(1,2,3),mat),b=new THREE.Mesh(new THREE.BoxGeometry(2,1,3),mat);a.position.set(2,1,-4);b.position.set(-2,3,1);b.rotation.y=.4;chunk.add(a,b);root.updateMatrixWorld(true);const inverse=chunk.matrixWorld.clone().invert(),expected=[a,b].map(o=>o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld)));const w={chunks:[{g:chunk}]};optimiseTunnel(w);assert.equal(w.renderBudget.saved,1);const merged=chunk.children.find(o=>o.isMesh);for(const name of ['position','normal','uv']){const want=expected.flatMap(g=>Array.from(g.attributes[name].array));assert.deepEqual(Array.from(merged.geometry.attributes[name].array),want);}assert.equal(merged.geometry.index.count,72);assert.equal(merged.material,mat);
for(let v=0;v<180;v++){assert.ok(flightPressure(v)>=0&&flightPressure(v)<=1);assert.equal(flightShake(v,true),0);assert.equal(flightShake(v,false,true),0);}assert.equal(flightPressure(84),0);assert.equal(flightPressure(123),1);
console.log('PASS V176: six courses, '+gates+' authored gates, '+paths+' safe paths; exact batching, sector interpolation, isolated practice and legacy records.');
