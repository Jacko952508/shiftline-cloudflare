import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCoralShapes} from '../public/coral-v154.js';
import {createTrack} from '../public/race-track.js';
import {createSeabed,createOceanVista} from '../public/ocean-vista.js';
const shapes=createCoralShapes();
for(const g of shapes){
 assert.ok(g.attributes.color);assert.ok(g.index.count/3<1800);
 for(const x of [...g.attributes.position.array,...g.attributes.normal.array])assert.ok(Number.isFinite(x));
 assert.ok(g.boundingBox.min.y>-.01&&g.boundingBox.max.y<1.05);
 assert.ok(g.boundingBox.max.x-g.boundingBox.min.x>.85,'Colony has no spreading silhouette');
}
const root=new THREE.Group(),track=createTrack(2),stone=new THREE.MeshStandardMaterial(),coral=new THREE.MeshStandardMaterial({vertexColors:true});
const seabed=createSeabed(root,track),vista=createOceanVista(root,track,stone,coral,seabed,shapes);
root.updateMatrixWorld(true);
const matrix=new THREE.Matrix4(),world=new THREE.Matrix4(),p=new THREE.Vector3(),sphere=new THREE.Sphere();let colonies=0,early=0,late=0;
for(const c of vista.chunks){
 const batches=c.g.children.filter(m=>m.geometry?.userData.coral154);
 assert.ok(batches.length<=2,'Corals must remain in two instanced draws per chunk');
 for(const m of batches){assert.ok(m.isInstancedMesh);assert.equal(m.material.transparent,false);assert.ok(m.material.vertexColors);
  for(let i=0;i<m.count;i++){
   m.getMatrixAt(i,matrix);world.multiplyMatrices(m.matrixWorld,matrix);p.set(0,0,0).applyMatrix4(world);
   assert.ok(Math.abs(p.y-seabed.heightAt(p.x,p.z)+.08)<.002,'Colony is floating above the seabed');
   sphere.copy(m.geometry.boundingSphere).applyMatrix4(world);
   for(const f of track.frames)assert.ok(sphere.center.distanceTo(f.p)>sphere.radius+9.8,'Coral intersects a flight corridor');
   colonies++;if(c.s<track.length*.18)early++;if(c.s>track.length*.51)late++;
  }
 }
}
assert.ok(colonies>200&&early>40&&late>40,'Coral is absent from a large part of the level');
console.log('PASS V154 living coral geometry, seabed roots, whole-course clearance and two instanced draws',{colonies,early,late});
