import assert from 'node:assert/strict';
import * as THREE from 'three';
import {courseEnvironment,canopyGeometry,attachRaceFinish} from '../public/race-finish-v147.js';

const signatures=[];
for(let course=1;course<=6;course++){
 const environment=courseEnvironment(course),data=environment.image.data;
 const rgb=[];
 for(let i=0;i<data.length;i+=4)for(let c=0;c<3;c++)rgb.push(THREE.DataUtils.fromHalfFloat(data[i+c]));
 assert.ok(rgb.every(x=>Number.isFinite(x)&&x>.05&&x<2),'Bounded, non-black HDR reflections');
 assert.ok(Math.max(...rgb)<2,'Reflections must preserve highlight headroom');
 assert.equal(environment.colorSpace,THREE.LinearSRGBColorSpace);
 assert.ok(environment.image.width*environment.image.height<=32768,'Reflection texture workload');
 signatures.push(rgb.filter((_,i)=>i%97===0).join(','));
 const scene=new THREE.Scene(),root=new THREE.Group(),glass=new THREE.MeshPhysicalMaterial({transparent:true,opacity:.018,depthWrite:false});
 const steel=new THREE.MeshPhysicalMaterial({color:0x637080,metalness:.9,roughness:.65});
 steel.onBeforeCompile=shader=>{shader.fragmentShader='// existing-material-hook\n'+shader.fragmentShader};
 const w={root,materials:{steel,glass},key:new THREE.SpotLight(),kind:course>=4?'expansion':undefined};
 const count=root.children.length;
 attachRaceFinish(scene,w,course);
 assert.equal(root.children.length,count,'Material finish added world objects');
 assert.equal(glass.opacity,.018);assert.equal(glass.depthWrite,false,'Glass regression');
 const shader={fragmentShader:THREE.ShaderLib.physical.fragmentShader,uniforms:{}};
 steel.onBeforeCompile(shader,{});
 assert.ok(shader.fragmentShader.startsWith('// existing-material-hook'),'Previous shader hook lost');
 assert.ok(shader.fragmentShader.indexOf('roughnessmap_fragment')<shader.fragmentShader.indexOf('finishVariance'),'Roughness used before declaration');
 assert.equal(w.raceFinish.addedPasses,0);
 environment.dispose();steel.dispose();glass.dispose();
 console.log('PASS V147 reflection range, material composition and glass invariants course '+course);
}
assert.equal(new Set(signatures).size,6,'Six distinct reflection palettes');
for(const detail of [0,1]){
 const geometry=canopyGeometry(detail),p=geometry.attributes.position,n=geometry.attributes.normal;
 for(let i=0;i<p.count;i++){
  assert.ok(Math.hypot(p.getX(i),p.getY(i),p.getZ(i))<=1,'Canopy expanded outside authored clearance');
  assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-5,'Invalid canopy normal');
 }
 assert.ok(p.count<=240,'Canopy exceeds instanced foliage triangle budget');
 geometry.dispose();
}
console.log('PASS V147 rounded canopies within existing scenery bounds and triangle budget');
