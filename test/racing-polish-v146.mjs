import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createTrack} from '../public/race-track.js';
import {specifications,collisionAt} from '../public/race-obstacles.js';
import {recoveryPose,racerInView} from '../public/race-recovery.js';
import {createImpacts,burstImpact,updateImpacts,disposeImpacts} from '../public/race-impact.js';
let recoveries=0;
for(let course=1;course<=6;course++){
 const track=createTrack(course),specs=specifications(course,track.length);
 for(const o of specs)o.frame=track.frame(o.s);
 for(const hit of specs)for(const time of [0,17.2,43.7]){
  const pose=recoveryPose(track,specs,hit.s-1,time,hit);
  assert.ok(pose,`Course ${course} gate ${hit.id} has no clear recovery`);
  assert.equal(pose.x,0);assert.equal(pose.y,0);
  assert.ok(pose.s>=hit.s+9&&pose.s<=hit.s+27,'Recovery skipped too far');
  for(const d of [0,2,4])assert.equal(collisionAt(track,specs,pose.s+d,0,0,time+d/84),null,'Recovery intersects a moving hazard');
  recoveries++;
 }
}
for(const ahead of [405,585,780]){
 assert.equal(racerInView(1000-91,1000,ahead),false);
 assert.equal(racerInView(1000-90,1000,ahead),true);
 assert.equal(racerInView(1000+ahead,1000,ahead),true);
 assert.equal(racerInView(1001+ahead,1000,ahead),false);
}
const scene=new THREE.Scene(),pool=createImpacts(scene),arrays=pool.slots.map(s=>s.particles),vectors=pool.slots.map(s=>[...s.particles]);
const frame={r:new THREE.Vector3(1,0,0),u:new THREE.Vector3(0,1,0),f:new THREE.Vector3(0,0,-1)};
for(let i=0;i<96;i++){
 burstImpact(pool,new THREE.Vector3(i,0,-i),frame,i*.02,false,i%6+1);updateImpacts(pool,i*.02);
 for(let k=0;k<8;k++){
  assert.equal(pool.slots[k].particles,arrays[k]);
  for(let j=0;j<48;j++)assert.equal(pool.slots[k].particles[j],vectors[k][j]);
  assert.ok(pool.slots[k].p.every(Number.isFinite));
 }
}
updateImpacts(pool,10);assert.ok(pool.slots.every(s=>!s.sparks.visible&&!s.shards.visible));disposeImpacts(scene,pool);assert.equal(scene.children.length,0);
console.log(`PASS V146 ${recoveries} clear recoveries across six courses, rival visibility bounds and pooled impacts`);
