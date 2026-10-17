import * as THREE from 'three';
import assert from 'node:assert/strict';
import {alpineRidgeGeometry,alpineSurface} from '../public/alpine-v150.js';
for(const low of [false,true])for(const grounded of[false,true]){
 const g=alpineRidgeGeometry(low,grounded),p=g.attributes.position,n=g.attributes.normal;
 assert.ok(g.index.count/3<2100,'Mountain triangle budget exceeded');
 let peaks=0;
 for(let i=0;i<p.count;i++){
  assert.ok(Math.abs(p.getX(i))<=1&&Math.abs(p.getZ(i))<=1,'Ridge footprint exceeds existing clearance volume');
  assert.ok(p.getY(i)>=(grounded?-.251:-1.251)&&p.getY(i)<=1.001,'Ridge height exceeds existing clearance volume');
  assert.ok(n.getY(i)>0&&Number.isFinite(n.getX(i)+n.getZ(i)),'Heightfield has an inverted or invalid face');
  if(p.getY(i)>.6)peaks++;
 }
 assert.ok(peaks>3,'Peaks absent');g.dispose();
}
for(const material of [new THREE.MeshStandardMaterial(),new THREE.MeshLambertMaterial()]){
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=vec3(.1);');};
 alpineSurface(material);const key=material.customProgramCacheKey();alpineSurface(material);assert.equal(key,material.customProgramCacheKey());
 const lib=material.isMeshLambertMaterial?THREE.ShaderLib.lambert:THREE.ShaderLib.physical;
 const shader={vertexShader:lib.vertexShader,fragmentShader:lib.fragmentShader,uniforms:{}};material.onBeforeCompile(shader,{});
 assert.ok(shader.vertexShader.includes('alpP=instanceMatrix*alpP'));
 assert.ok(shader.fragmentShader.indexOf('diffuseColor.rgb=mix(alpRock')>shader.fragmentShader.indexOf('diffuseColor.rgb=vec3(.1)'),'Snow must run after older maps');
 material.dispose();
}
console.log('PASS V150 ridge footprints, height envelopes, outward normals and snow shader composition');
