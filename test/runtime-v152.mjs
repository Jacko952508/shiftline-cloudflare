import * as THREE from 'three';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createTrack} from '../public/race-track.js';
import {specifications,obstacleState,clearance,safeTarget,planTarget} from '../public/race-obstacles.js';
import {batchStaticAirframe} from '../public/fleet-batching-v152.js';
import {createImpacts,burstImpact,updateImpacts,impactPose,disposeImpacts} from '../public/race-impact.js';
const LINES=[];for(let r=0;r<=5.8;r+=.65)for(let k=0;k<24;k++){const a=k*Math.PI*2/24;LINES.push({x:Math.cos(a)*r,y:Math.sin(a)*r});}
// V151 exhaustive planner is the oracle: every candidate, penalty and tie order.
function reference(o,at,x=0,y=0,traffic=[],preference=0){const states=[-.13,0,.13].map(t=>obstacleState(o,at+t));let best=null,score=Infinity;for(const p of[{x,y},...LINES]){let d=clearance(o,states[1],p.x,p.y);if(d<.55)continue;d=Math.min(d,clearance(o,states[0],p.x,p.y),clearance(o,states[2],p.x,p.y));if(d<.5)continue;const crowd=traffic.reduce((n,r)=>n+Math.max(0,2.1-Math.hypot(r.x-p.x,r.y-p.y)),0),cost=Math.hypot(p.x-x,p.y-y)*.45+Math.max(0,1.4-d)*1.4+crowd*.55+Math.abs(p.x-preference)*.035;if(cost<score){score=cost;best={...p,clearance:d};}}return best||safeTarget(o,at,x,y);}
let cases=0,oldMS=0,newMS=0;
for(let course=1;course<=6;course++){
 const track=createTrack(course),specs=specifications(course,track.length);
 for(const o of specs)for(const t of[0,17.2,43.7]){
  const args=[o,t,Math.sin(o.id)*3,Math.cos(o.id)*2,[{x:-1.2,y:.7},{x:2.1,y:-1.1}],(o.id%3-1)*1.3];
  let start=performance.now();const expected=reference(...args);oldMS+=performance.now()-start;
  start=performance.now();const actual=planTarget(...args);newMS+=performance.now()-start;
  assert.deepEqual(actual,expected,'AI line or clearance changed on course '+course+' gate '+o.id);cases++;
 }
}
console.log('PASS V152 exact AI decisions '+cases+'; reference '+oldMS.toFixed(1)+' ms, pruned '+newMS.toFixed(1)+' ms');
const root=new THREE.Group(),mat=new THREE.MeshStandardMaterial(),glass=new THREE.MeshPhysicalMaterial({transparent:true,opacity:.8});root.rotation.y=.43;root.scale.set(.93,1,1);root.position.set(7,3,-2);
for(let i=0;i<5;i++){const m=new THREE.Mesh(i%2?new THREE.TorusGeometry(.4,.07,5,12):new THREE.BoxGeometry(.6,.2,.4),mat);m.position.set(i*.3,.1,-i*.2);m.rotation.set(i*.13,-i*.2,.1);if(i%2)m.scale.x=-1;root.add(m);}
const canopy=new THREE.Mesh(new THREE.SphereGeometry(.3,8,5),glass);root.add(canopy);
const before=new THREE.Box3().setFromObject(root,true);let triangles=0;root.traverse(o=>{if(o.material===mat)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});
// Compare actual transformed triangles (including mirrored winding), not only envelopes.
function trianglesAt(){root.updateMatrixWorld(true);const result=[],v=new THREE.Vector3();root.traverse(o=>{if(o.material!==mat)return;const g=o.geometry,p=g.attributes.position,ix=g.index,flip=o.matrixWorld.determinant()<0;for(let i=0;i<(ix?.count||p.count);i+=3)for(const k of[0,flip?2:1,flip?1:2]){const j=ix?ix.getX(i+k):i+k;v.fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld);result.push(...v.toArray());}});return result;}
const original=trianglesAt(),stats=batchStaticAirframe(root);assert.equal(stats.saved,4);assert.equal(stats.triangles,triangles);const batched=trianglesAt();assert.equal(batched.length,original.length);for(let i=0;i<batched.length;i++)assert.ok(Math.abs(batched[i]-original[i])<2e-6,'Batching changed or reversed visible triangles');assert.equal(canopy.parent,root,'Transparent canopy must stay independent');const after=new THREE.Box3().setFromObject(root,true);assert.ok(before.min.distanceTo(after.min)<1e-5&&before.max.distanceTo(after.max)<1e-5);
const ship=new THREE.Group();ship.scale.setScalar(.83);impactPose(ship,.2,0);assert.equal(ship.scale.x,.83,'Crash must not resize the racing airframe');ship.scale.setScalar(.83);impactPose(ship,.9,0);assert.ok(ship.scale.x<.83);
const scene=new THREE.Scene(),pool=createImpacts(scene),frame={r:new THREE.Vector3(1,0,0),u:new THREE.Vector3(0,1,0),f:new THREE.Vector3(0,0,-1)};
for(let i=0;i<100;i++){burstImpact(pool,frame.r,frame,i/60,false,i%6+1);updateImpacts(pool,i/60);}
assert.equal(pool.slots.length,8);assert.ok(pool.slots.every(s=>s.p.every(Number.isFinite)));disposeImpacts(scene,pool);
root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});console.log('PASS V152 identical batched triangles/bounds, independent glass and fixed collision scale');
