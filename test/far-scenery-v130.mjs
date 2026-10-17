import * as THREE from 'three';
import assert from 'node:assert/strict';
import {createTrack} from '../public/race-track.js';
import {attachFarScenery,updateFarScenery,disposeFarScenery,atmosphereChapters} from '../public/far-scenery-v129.js';
const signatures=[];
for(let course=1;course<=6;course++){
 const track=createTrack(course),scene=new THREE.Scene(),world={renderAhead:700};
 attachFarScenery(scene,world,track,course,'low');const d=world.farScenery;
 assert.ok(d.chunks.length>8,'Chunked world absent');
 assert.ok(d.total>15,'Too few landmarks');
 assert.ok(d.minClearance>=24,'Scenery crosses another piece of the route: '+d.minClearance);
 assert.equal(d.root.parent,scene);
 assert.ok(d.geometries.length===5);
 assert.ok(d.chunks.every(c=>c.meshes.length===5&&c.count<=(course===4?2:4)&&c.meshes[4].count===0));
 for(const c of d.chunks)for(const mesh of c.meshes){
  assert.ok(mesh.isInstancedMesh);assert.equal(mesh.castShadow,false);
  assert.equal(mesh.material.transparent,false);assert.equal(mesh.material.depthWrite,true);
 }
 updateFarScenery(world,track.length*.45,42);
 assert.ok(d.chunks.some(c=>c.group.visible),'Nothing visible near flight');
 assert.ok(d.chunks.some(c=>!c.group.visible),'Distant sections not culled');
 assert.equal(d.total,d.chunks.reduce((n,c)=>n+c.count,0));
 assert.equal(d.chapterCounts.reduce((a,b)=>a+b,0),d.total);
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
 assert.ok(d.total>(course===4?12:25),'Auto detail unexpectedly sparse');
 if(course===4){assert.equal(d.geometries[0].type,'BufferGeometry');assert.equal(d.dynamicCount,0);
   const positions=d.geometries[0].getAttribute('position'),normals=d.geometries[0].getAttribute('normal');
   assert.ok(Array.from({length:normals.count},(_,i)=>normals.getY(i)).every(y=>y>0),'Mountain heightfield faces must point outward above the ground');assert.ok(d.total<150,'Storm skyline remains overcrowded');}
 assert.ok(d.chapterCounts.every(c=>c>0),'Not all four chapters have distinct scenery on course '+course);
 assert.ok(d.chunks.some(c=>c.meshes[4].count>0),'Course-specific form was not instanced');
 assert.ok(d.nearCount>(course===4?3:8),'Foreground band not visible on '+course+': '+d.nearCount);
 assert.ok(d.minClearance>=24);
 updateFarScenery(world,400,12.125);const before=d.motionStep;
 updateFarScenery(world,430,12.20);assert.equal(d.motionStep,before);
 updateFarScenery(world,430,12.37);
 if([2,6].includes(course)){assert.ok(d.dynamicCount>0);assert.ok(d.motionStep>before)}
 else assert.equal(d.dynamicCount,0);
 assert.ok(d.chunks.some(c=>c.group.visible));
 const seam=.25*track.length,originalFog=scene.fog,colors=[];
 for(const pos of[seam-70,seam-30,seam,seam+30,seam+70]){
  updateFarScenery(world,pos,22);colors.push(d.materials[0].color.clone());
  assert.equal(scene.fog,originalFog,'No fog is allowed across the flight path');
 }
 assert.ok(colors.every((color,i)=>i===0||Math.hypot(color.r-colors[i-1].r,color.g-colors[i-1].g,color.b-colors[i-1].b)<.07),
  'Chapter color jumps on course '+course);
 assert.ok(Math.hypot(colors[0].r-colors.at(-1).r,colors[0].g-colors.at(-1).g,colors[0].b-colors.at(-1).b)>.0008,'Missing chapter haze transition on '+course);
 disposeFarScenery(world);
 console.log('PASS V130 AUTO course '+course+' '+d.total+' '+d.dynamicCount+' animated parts');
}

import {setFarSceneryQuality} from '../public/far-scenery-v129.js';
for(const course of [2,4,6]){
 const track=createTrack(course),scene=new THREE.Scene(),world={renderAhead:700};
 attachFarScenery(scene,world,track,course,'auto');const d=world.farScenery;
 const first=d.chunks.find(c=>c.count>(course===4?1:4));
 assert.ok(first,'No populated high-detail chunk');
 const original=first.count;
 setFarSceneryQuality(world,'low');assert.equal(d.low,true);assert.equal(first.meshes[0].count,course===4?2:4);assert.equal(first.meshes[4].count,0);
 setFarSceneryQuality(world,'auto');assert.equal(d.low,false);assert.equal(first.meshes[0].count,original);assert.equal(first.meshes[4].count,original);
 disposeFarScenery(world);console.log('PASS V135 live LOD switch course '+course);
}
