import assert from 'node:assert/strict';
import * as THREE from 'three';
import {finishSurface,bevelBox,weatheredRock,skylineBlock,installShipFinish} from '../public/art-direction-v148.js';

for(const [w,h,d,b]of [[1,1,1,.055],[.12,1.45,5.2,.025],[.09,.13,.22,.02]]){
 const g=bevelBox(w,h,d,b),p=g.attributes.position,n=g.attributes.normal;
 for(let i=0;i<p.count;i++){
  assert.ok(Math.abs(p.getX(i))<=w/2+1e-6&&Math.abs(p.getY(i))<=h/2+1e-6&&Math.abs(p.getZ(i))<=d/2+1e-6,'Bevel escapes authored bounds');
  assert.ok(Number.isFinite(n.getX(i)+n.getY(i)+n.getZ(i)));
 }
 assert.ok(p.count<400,'Decorative hardware triangle budget');g.dispose();
}
for(const detail of [0,1]){
 const g=weatheredRock(detail),p=g.attributes.position;
 for(let i=0;i<p.count;i++)assert.ok(Math.hypot(p.getX(i),p.getY(i),p.getZ(i))<=1+1e-6,'Rock escapes clearance sphere');
 g.dispose();
}
const block=skylineBlock();block.computeBoundingBox();
assert.ok(block.boundingBox.min.x>=-.5&&block.boundingBox.max.x<=.5);
assert.equal(block.type,'BoxGeometry');block.dispose();
for(const role of ['ship','tunnel','obstacle','landscape','canopy','organic','city']){
 const programKeys=new Set();
 for(let course=1;course<=6;course++){
  const m=role==='city'||role==='canopy'?new THREE.MeshLambertMaterial():new THREE.MeshStandardMaterial();
  m.onBeforeCompile=shader=>{shader.fragmentShader='// retained-hook\n'+shader.fragmentShader;shader.uniforms.previous={value:1}};
  const lib=m.isMeshLambertMaterial?THREE.ShaderLib.lambert:THREE.ShaderLib.physical;
  finishSurface(m,role,course);const key=m.customProgramCacheKey();programKeys.add(key);
  const shader={vertexShader:lib.vertexShader,fragmentShader:lib.fragmentShader,uniforms:{}};
  m.onBeforeCompile(shader,{});
  assert.ok(shader.fragmentShader.includes('// retained-hook'));assert.equal(shader.uniforms.previous.value,1);
  assert.ok(shader.vertexShader.includes('adPosition=instanceMatrix*adPosition'),'Instanced coordinates lost');
  assert.ok(!shader.fragmentShader.includes('sampler2D ad'),'Unexpected texture allocation');
  finishSurface(m,role,course);assert.equal(m.customProgramCacheKey(),key,'Repeated decoration alters shader cache');
  m.dispose();
 }
 assert.equal(programKeys.size,6,'Course material programs alias each other');
}
for(let model=0;model<6;model++){
 const ship=new THREE.Group(),root=new THREE.Group(),hull=new THREE.MeshPhysicalMaterial(),glass=new THREE.MeshPhysicalMaterial({transparent:true,opacity:.88}),premium=model===5;
 root.add(new THREE.Mesh(new THREE.BoxGeometry(),hull),new THREE.Mesh(new THREE.BoxGeometry(),glass));
 if(premium){hull.metalness=1;hull.roughness=.095;}
 const before=new THREE.Box3().setFromObject(root),count=root.children.length;
 installShipFinish(ship,root,model,{finish:0},{hull,glass,premium},true);
 assert.equal(root.children.length,count);assert.ok(before.equals(new THREE.Box3().setFromObject(root)),'Ship silhouette altered');
 assert.equal(glass.userData.art148,undefined,'Windscreen opacity/shader changed');assert.equal(glass.opacity,.88);
 assert.equal(ship.userData.artFinish.version,148);assert.equal(ship.userData.artFinish.materials,1);
 if(premium){const shader={vertexShader:THREE.ShaderLib.physical.vertexShader,fragmentShader:THREE.ShaderLib.physical.fragmentShader,uniforms:{}};hull.onBeforeCompile(shader,{});assert.ok(shader.fragmentShader.includes(',.07,.96)'),'Chrome lost its mirror finish');}
 root.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});
}
console.log('PASS V148 hardware/rock bounds, shader composition, seven surface roles, six ship finishes and unchanged glass/silhouettes');
