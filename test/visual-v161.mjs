import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installFleetIdentity} from '../public/fleet-identity-v161.js';
import {specifications,obstacleState} from '../public/course-colliders.js';
import {cueEnvelope} from '../public/obstacle-lighting-v160.js';
import {readFile} from 'node:fs/promises';
const names=new Set();
for(let index=0;index<6;index++){
 const root=new THREE.Group(),ship=new THREE.Group(),owned=[];
 const id=installFleetIdentity(ship,root,index,owned,true);
 assert.equal(id.version,161);assert.equal(id.index,index);
 assert.ok(id.lights>=6&&id.vents>=3);
 assert.ok(root.children.length===2,'Instanced identification requires two extra draw calls');
 assert.ok(root.children.every(m=>m.isInstancedMesh&&m.count>=3));
 const boxes=new THREE.Box3().setFromObject(root);
 assert.ok(boxes.min.x>=-1.04&&boxes.max.x<=1.04,'Decorative markings cannot change equal ship wingspan');
 assert.ok(boxes.min.z>=-1.9&&boxes.max.z<1.1,'New panels protrude past original airframe');
 names.add(id.name);
 for(const m of root.children){m.geometry.dispose();}for(const m of owned)m.dispose();
}
assert.equal(names.size,6,'All craft must have visually distinct geometry');
for(let course=1;course<=6;course++){
 const specs=specifications(course,7200),before=JSON.stringify(specs.map(o=>o.solids));
 for(const o of specs){
  const ring=cueEnvelope(Math.max(0,o.s-200),2.5,o.seed);
  assert.ok(ring.energy>=0&&ring.energy<=1);
  assert.ok(obstacleState(o,2.5),'Collider motion remains intact');
 }
 assert.equal(JSON.stringify(specs.map(o=>o.solids)),before,'V161 must never change collision solids');
}
const shader=await readFile(new URL('../public/obstacle-glow-v155.js',import.meta.url),'utf8');
assert.ok(shader.includes('uniform float hazardAlert'),'Hazard shader needs independent active alarm');
assert.ok(shader.includes('warningAmber*danger'),'Amber warning material is not connected to the shader');
const world=await readFile(new URL('../public/garage-scene.js',import.meta.url),'utf8');
assert.ok(world.includes('installShowroomArchitecture(scene)'));
console.log('PASS V161 six unique physical ships, safe 2-draw-call identity kits, six original collision courses, bright hazard shader and new hangar');
