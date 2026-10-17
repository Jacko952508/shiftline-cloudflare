import * as THREE from 'three';
import assert from 'node:assert/strict';
import {orbitalCityShapes} from '../public/orbital-city-v149.js';
import {createTrack} from '../public/race-track.js';
import {attachFarScenery,disposeFarScenery} from '../public/far-scenery-v129.js';
for(const quality of ['low','auto','high']){
 const shapes=orbitalCityShapes(quality==='low');
 for(const g of shapes){assert.ok(g.attributes.position.count>30);for(const x of g.attributes.position.array)assert.ok(Number.isFinite(x));g.dispose();}
 const track=createTrack(1),scene=new THREE.Scene(),world={renderAhead:700};attachFarScenery(scene,world,track,1,quality);
 const m=new THREE.Matrix4(),pos=new THREE.Vector3(),rot=new THREE.Quaternion(),scale=new THREE.Vector3(),v=new THREE.Vector3();
 for(const chunk of world.farScenery.chunks)for(let i=0;i<chunk.count;i++){
  chunk.meshes[0].getMatrixAt(i,m);m.decompose(pos,rot,scale);
  const h=scale.y/.88,w=scale.x/2.1,centre=pos.clone().add(new THREE.Vector3(0,h*.10,0)),bound=Math.hypot(w*2.5,h*.86);
  for(const mesh of chunk.meshes){mesh.getMatrixAt(i,m);const p=mesh.geometry.attributes.position;
   for(let j=0;j<p.count;j++){v.fromBufferAttribute(p,j).applyMatrix4(m);assert.ok(v.distanceTo(centre)<=bound+.001,'City engines exceed whole-route clearance envelope');}
  }
 }
 assert.ok(world.farScenery.minClearance>=24);disposeFarScenery(world);console.log('PASS orbital city actual geometry clearance '+quality);
}
