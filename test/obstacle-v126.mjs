import * as THREE from 'three';
import assert from 'node:assert/strict';
import {specifications as colliders, obstacleState, localDistance} from '../public/course-colliders.js';
import {installObstacleBodywork} from '../public/obstacle-bodywork-v126.js';
import {readFile} from 'node:fs/promises';
const unchanged=await readFile(new URL('../public/course-colliders.js',import.meta.url),'utf8');
assert.ok(unchanged.includes('polygonDistance'),'The shared collider source must remain intact');
const signatures=[];
for(let course=1;course<=6;course++){
 const length=7500,reference=colliders(course,length);
 assert.ok(reference.length>=20,'Missing obstacles on course '+course);
 const before=JSON.stringify(reference.map(({id,s,kind,course,theme,solids})=>({id,s,kind,course,theme,solids})));
 let lights=0,metal=0,decorations=0;const materials=new Set(),geometries=new Set();
 for(const obstacle of reference){
  const motion=new THREE.Group(),parent=new THREE.Group();
  obstacle.motion=motion;obstacle.rig=parent;parent.add(motion);obstacle.trim=[];
  const collisionBefore=JSON.stringify(obstacle.solids);
  const shapeAt={x:0,y:0,z:0};
  const t=obstacleState(obstacle,2.3);
  const d=localDistance(obstacle,t,shapeAt.x,shapeAt.y,shapeAt.z);
  const kit=installObstacleBodywork(obstacle,'auto');
  assert.ok(kit.meshes.length>0,'Obstacle lacks machine detailing '+course+'/'+obstacle.kind);
  assert.ok(kit.indicatorMaterial||kit.lit===0,'Course hazards retain their indicator material');
  assert.equal(JSON.stringify(obstacle.solids),collisionBefore,'Decoration changed a collider '+course+'/'+obstacle.kind);
  assert.equal(localDistance(obstacle,t,0,0,0),d,'Decoration changed collision distance');
  metal+=kit.metal;lights+=kit.lit;decorations+=kit.meshes.length;
  for(const m of kit.meshes){
   assert.equal(m.userData.obstacleDecoration,true);
   assert.equal(m.castShadow,false);
   assert.equal(m.receiveShadow,false);
   assert.equal(m.material.transparent,false,'No translucent overlays allowed');
   assert.equal(m.material.depthWrite,true,'Must not alter transparent rendering');
   assert.equal(m.count,m.name.includes('forged')?kit.metal:kit.lit);
   assert.ok(m.count>0,'Empty decoration draw call');
   for(let i=0;i<m.count;i++){
    const mat=new THREE.Matrix4();m.getMatrixAt(i,mat);
    const pos=new THREE.Vector3(),quat=new THREE.Quaternion(),scale=new THREE.Vector3();mat.decompose(pos,quat,scale);
    assert.ok(Math.hypot(pos.x,pos.y)+Math.hypot(scale.x,scale.y)*.5<6.91,'Extraneous geometry too close to tunnel wall');
   }
   materials.add(m.material);geometries.add(m.geometry);
  }
 }
 assert.equal(JSON.stringify(reference.map(({id,s,kind,course,theme,solids})=>({id,s,kind,course,theme,solids}))),before,'Obstacle specifications changed');
 assert.ok(metal>reference.length*.75,'Too few visual fittings for '+course);
 assert.ok(lights>reference.length*.3,'Too few visible highlights for '+course);
 for(const m of materials)m.dispose();for(const g of geometries)g.dispose();
 signatures.push([course,reference.length,decorations,metal,lights]);
}
const styles=new Set(signatures.map(s=>s.slice(2).join(':')));
assert.ok(styles.size>=5,'Course hardware must differ meaningfully');
console.log('PASS V126 collision-preserving obstacle detail for all six courses '+JSON.stringify(signatures));
