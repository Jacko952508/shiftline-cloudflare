import * as THREE from 'three';
import assert from 'node:assert/strict';
import {createTrack} from '../public/race-track.js';
import {attachFarScenery,updateFarScenery,disposeFarScenery} from '../public/far-scenery-v129.js';
const signatures=[];
for(let course=1;course<=6;course++){
 const track=createTrack(course),scene=new THREE.Scene(),world={renderAhead:700};
 attachFarScenery(scene,world,track,course,'low');const d=world.farScenery;
 assert.ok(d.chunks.length>8,'Chunked world absent');
 assert.ok(d.total>15,'Too few landmarks');
 assert.ok(d.minClearance>=24,'Scenery crosses another piece of the route: '+d.minClearance);
 assert.equal(d.root.parent,scene);
 assert.ok(d.geometries.length===4);
 assert.ok(d.chunks.every(c=>c.meshes.length===4&&c.count<=4));
 for(const c of d.chunks)for(const mesh of c.meshes){
  assert.ok(mesh.isInstancedMesh);assert.equal(mesh.castShadow,false);
  assert.equal(mesh.material.transparent,false);assert.equal(mesh.material.depthWrite,true);
 }
 updateFarScenery(world,track.length*.45,42);
 assert.ok(d.chunks.some(c=>c.group.visible),'Nothing visible near flight');
 assert.ok(d.chunks.some(c=>!c.group.visible),'Distant sections not culled');
 assert.equal(d.total,d.chunks.reduce((n,c)=>n+c.count,0));
 const data=[course,d.name,d.total,d.minClearance,d.chunks.length,d.geometries[0].type];
 signatures.push(data);
 disposeFarScenery(world);
 assert.equal(world.farScenery,null);assert.equal(scene.children.length,0);
 console.log('PASS V130 LOW '+JSON.stringify(data));
}
assert.equal(new Set(signatures.map(s=>s[1])).size,6);
assert.ok(new Set(signatures.map(s=>s[5])).size>=3,'Biomes insufficiently unique');
for(let course=1;course<=6;course++){
 const track=createTrack(course),scene=new THREE.Scene(),world={renderAhead:700};
 attachFarScenery(scene,world,track,course,'auto');const d=world.farScenery;
 assert.ok(d.total>25,'Auto detail unexpectedly sparse');
 assert.ok(d.minClearance>=24);
 updateFarScenery(world,400,12.125);const before=d.motionStep;
 updateFarScenery(world,430,12.20);assert.equal(d.motionStep,before);
 updateFarScenery(world,430,12.37);
 if([2,4,6].includes(course)){assert.ok(d.dynamicCount>0);assert.ok(d.motionStep>before)}
 else assert.equal(d.dynamicCount,0);
 assert.ok(d.chunks.some(c=>c.group.visible));disposeFarScenery(world);
 console.log('PASS V130 AUTO course '+course+' '+d.total+' '+d.dynamicCount+' animated parts');
}
