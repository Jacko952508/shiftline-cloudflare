import * as THREE from 'three';
import assert from 'node:assert/strict';
import {createTrack} from '../public/race-track.js';
import {attachFarScenery,updateFarScenery,disposeFarScenery} from '../public/far-scenery-v129.js';
for(let course=1;course<=6;course++){
 const scene=new THREE.Scene(),track=createTrack(course),world={renderAhead:680};
 attachFarScenery(scene,world,track,course,'low');const d=world.farScenery;
 assert.ok(d.chunks.length>=4);assert.ok(d.minDistance>40,'Too close to tunnel');assert.equal(d.root.parent,scene);
 assert.equal(d.total,d.chunks.length*4);
 for(const chunk of d.chunks)for(const mesh of chunk.group.children){assert.ok(mesh.isInstancedMesh);assert.equal(mesh.count,4);assert.equal(mesh.castShadow,false);assert.equal(mesh.material.transparent,false)}
 updateFarScenery(world,track.length*.55);
 assert.ok(d.chunks.some(c=>!c.group.visible));assert.ok(d.chunks.some(c=>c.group.visible));
 disposeFarScenery(world);assert.equal(scene.children.length,0);assert.equal(world.farScenery,null);
 console.log('PASS V129 '+course+' '+d.total+' silhouettes '+d.minDistance.toFixed(1)+'m clearance');
}
