import assert from 'node:assert/strict';
import * as THREE from 'three';
import {specifications} from '../public/course-colliders.js';
import {markHazardGeometry,illuminateHazard} from '../public/obstacle-glow-v155.js';
import {finishSurface} from '../public/art-direction-v148.js';
for(let course=1;course<=6;course++){
 let n=0;
 for(const o of specifications(course,7500))for(const shape of o.solids){
  const g=shape.type==='box'?new THREE.BoxGeometry(shape.hx*2,shape.hy*2,shape.hz*2):shape.type==='sphere'?new THREE.SphereGeometry(shape.r,16,10):shape.type==='torus'?new THREE.TorusGeometry(shape.R,shape.tube,8,32):new THREE.ExtrudeGeometry(new THREE.Shape(shape.points.map(([x,y])=>new THREE.Vector2(x,y))),{depth:shape.hz*2,bevelEnabled:false});
  const positions=new Float32Array(g.attributes.position.array),index=g.index?new Uint32Array(g.index.array):null;g.computeBoundingBox();const bounds=g.boundingBox.clone();
  markHazardGeometry(g,shape);g.computeBoundingBox();
  assert.deepEqual(g.attributes.position.array,positions);assert.deepEqual(g.index?new Uint32Array(g.index.array):null,index);assert.ok(g.boundingBox.equals(bounds));
  assert.equal(g.attributes.hazardShape.count,g.attributes.position.count);for(const v of g.attributes.hazardShape.array)assert.ok(Number.isFinite(v));g.dispose();n++;
 }
 const m=new THREE.MeshStandardMaterial();finishSurface(m,'obstacle',course);illuminateHazard(m);const key=m.customProgramCacheKey();illuminateHazard(m);assert.equal(m.customProgramCacheKey(),key);
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};m.onBeforeCompile(shader);
 assert.ok(shader.vertexShader.includes('hazardPosition=position'));assert.ok(shader.fragmentShader.includes('hazardRim'));assert.ok(shader.fragmentShader.includes('adSeam'));assert.equal(shader.uniforms.hazardGlowStrength,m.userData.hazardGlowStrength);assert.equal(m.transparent,false);assert.equal(m.depthWrite,true);m.dispose();
 console.log('PASS V155 unchanged geometry/index/bounds and composed emissive shader',course,n);
}
