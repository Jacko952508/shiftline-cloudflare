import * as THREE from 'three';
import assert from 'node:assert/strict';
import {createTrack} from '../public/race-track.js';
import {trackClearance} from '../public/scenery-clearance.js';
import {installBiomeFloor} from '../public/biome-floor-v140.js';
const reports=[];
for(const course of [3,4,5,6]){
 const track=createTrack(course),clearance=trackClearance(track);
 const root=new THREE.Group(),baseline=course===4?40:course===5?-85:course===6?-170:0;
 const ground=(x,z)=>baseline+12*Math.sin(x*.0021)*Math.cos(z*.0019);
 const result=installBiomeFloor(root,track,course,ground,clearance);
 assert.ok(result.clusters>30,'Scene has too little ground detail on '+course);
 assert.equal(result.version,140);
 assert.equal(result.mainParts,result.clusters*3);
 assert.equal(result.drawCalls,2);
 assert.equal(result.bounds.length,result.clusters);
 assert.equal(root.children.length,2);
 for(const m of result.meshes){
  assert.ok(m.isInstancedMesh);assert.equal(m.castShadow,false);assert.equal(m.receiveShadow,false);
  assert.equal(m.material.transparent,false);assert.ok(m.userData.nonCollidingEnvironment);
  assert.equal(m.material.side,THREE.FrontSide);
 }
 for(const b of result.bounds)assert.ok(clearance.boxClear(b),'New ground object inside another part of the tunnel');
 reports.push({course,clusters:result.clusters,parts:result.mainParts,failedClearance:result.rejected});
 for(const m of result.meshes){m.geometry.dispose();m.material.dispose()}
}
console.log('PASS V140 safe ground details '+JSON.stringify(reports));
