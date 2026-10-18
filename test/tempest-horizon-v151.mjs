import * as THREE from 'three';
import assert from 'node:assert/strict';
import {createTrack} from '../public/race-track.js';
import {expansionGround} from '../public/expansion-world.js';
import {tempestHorizonGeometry,TEMPEST_HORIZON_PADDING,TEMPEST_HORIZON_RINGS} from '../public/tempest-horizon-v151.js';
const track=createTrack(4),bounds=new THREE.Box3().setFromPoints(track.frames.map(f=>f.p));
const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
const endZ=track.frames.at(-1).p.z,ground=(x,z)=>expansionGround(4,x,z,endZ);
const terrain=new THREE.PlaneGeometry(size.x+3200,size.z+2200,128,256);terrain.rotateX(-Math.PI/2);terrain.translate(center.x,0,center.z);
const p=terrain.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,ground(p.getX(i),p.getZ(i)));terrain.computeVertexNormals();
const before=new Float32Array(p.array),g=tempestHorizonGeometry(terrain,ground),info=g.userData.tempestHorizon151;
assert.deepEqual(p.array,before,'Playable terrain must not move or lose resolution');
assert.equal(info.triangles,2*info.seamVertices*(TEMPEST_HORIZON_RINGS.length-1));assert.ok(info.triangles<11000,'Horizon geometry budget');
const seam=new Map();for(let i=0;i<p.count;i++)seam.set([p.getX(i),p.getZ(i)].join(','),i);
for(let i=0;i<info.seamVertices;i++){
 const q=g.attributes.position,id=seam.get([q.getX(i),q.getZ(i)].join(','));assert.notEqual(id,undefined,'Apron does not meet original grid');
 assert.equal(q.getY(i),p.getY(id),'Visible gap between terrain and extension');
 for(const attr of['uv','normal'])for(let k=0;k<terrain.attributes[attr].itemSize;k++)assert.equal(g.attributes[attr].array[i*terrain.attributes[attr].itemSize+k],terrain.attributes[attr].array[id*terrain.attributes[attr].itemSize+k],'Lighting or texture seam');
}
for(const f of track.frames){
 const margin=Math.min(f.p.x-g.boundingBox.min.x,g.boundingBox.max.x-f.p.x,f.p.z-g.boundingBox.min.z,g.boundingBox.max.z-f.p.z);
 assert.ok(margin>20000+500,'Map perimeter visible within survey camera plus maximum orbit offset');
}
for(const a of[g.attributes.position,g.attributes.normal])assert.ok(Array.from(a.array).every(Number.isFinite));
// No back-facing sections in the extension's ground surface.
for(let i=0;i<g.attributes.normal.count;i++)assert.ok(g.attributes.normal.getY(i)>0,'Inverted horizon ground');
assert.equal(TEMPEST_HORIZON_PADDING,26000);console.log('PASS V151 seamless terrain and normals, unchanged course ground, perimeter beyond both cameras, '+info.triangles+' triangles');
terrain.dispose();g.dispose();
