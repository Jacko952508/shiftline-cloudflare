import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createTrack} from '../public/race-track.js';
import {specifications,obstacleState,clearance,planTarget} from '../public/race-obstacles.js';
import {hazardGeometry} from '../public/hazard-construction-v156.js';
import {markHazardGeometry,illuminateHazard} from '../public/obstacle-glow-v155.js';
import {atmosphereOutput,createStarfield} from '../public/sky-visibility-v157.js';
let cases=0;
for(let course=1;course<=6;course++){
 const track=createTrack(course),specs=specifications(course,track.length);let blocked=0,total=0,maxSteer=0;
 assert.equal(new Set(specs.map(o=>o.family)).size,3);
 const gaps=specs.slice(1).map((o,i)=>o.s-specs[i].s);assert.ok(Math.min(...gaps)>=114);assert.ok(Math.max(...gaps)>=200);assert.ok(new Set(gaps.map(v=>Math.round(v))).size>=8);
 // A player has time to move between safe crossing windows at normal speed.
 // Repeat with different arrival phases; an open snapshot alone is insufficient.
 for(const start of [0,2.7,6.1,11.4,20.3,37]){
  let previous={x:0,y:0},lastS=0;
  for(const o of specs){
   const at=start+o.s/84,p=planTarget(o,at,previous.x,previous.y);assert.ok(p,'No passage '+course+'/'+o.id);
   const margin=Math.min(...[-.13,0,.13].map(t=>clearance(o,obstacleState(o,at+t),p.x,p.y)));assert.ok(margin>=.29,'Moving aperture closes on ship');
   maxSteer=Math.max(maxSteer,Math.hypot(p.x-previous.x,p.y-previous.y)/((o.s-lastS)/84-.18));
   if(clearance(o,obstacleState(o,at),0,0)<.45)blocked++;total++;cases++;previous=p;lastS=o.s;
  }
 }
 assert.ok(maxSteer<5.8,'Unreasonable normal-speed lane change '+course+' '+maxSteer);
 assert.ok(blocked/total>.30&&blocked/total<.90,'Encounter sequence is trivial or relentlessly closed');
 for(const family of new Set(specs.map(o=>o.family))){
  const o=specs.find(o=>o.family===family);
  for(const p of o.solids){
   const g=hazardGeometry(p,course);markHazardGeometry(g,p);
   assert.equal(g.attributes.hazardLight.count,g.attributes.position.count);assert.ok(g.index.count/3<8500);
   if(p.type!=='sphere')assert.ok([...g.attributes.hazardLight.array].some(v=>v>.9),'Unlit silhouette '+family+'/'+p.type);
   assert.ok([...g.attributes.hazardFlow.array].every(Number.isFinite));g.dispose();
  }
 }
 console.log('PASS V157 course '+course+': '+specs.length+' encounters, '+Math.round(blocked/total*100)+'% require steering; maximum normal-speed transition '+maxSteer.toFixed(2)+'m/s');
}
const material=new THREE.MeshStandardMaterial();illuminateHazard(material);const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader);
assert.equal(shader.uniforms.hazardTime,material.userData.hazardTime);assert.ok(shader.fragmentShader.includes('hazardEnergy'));assert.ok(shader.fragmentShader.includes('hazardFaceColor*(.72'));
const sky=atmosphereOutput(new THREE.ShaderMaterial({fragmentShader:'void main(){gl_FragColor=vec4(.03,.05,.1,1.);}'}));const source=sky.fragmentShader;atmosphereOutput(sky);assert.equal(sky.fragmentShader,source);assert.ok(source.includes('colorspace_fragment'));assert.ok(source.includes('tonemapping_fragment'));
for(const course of [1,6]){const stars=createStarfield(course);assert.equal(stars.geometry.attributes.position.count,3600);assert.ok(Math.min(...stars.geometry.attributes.starSize.array)>=1.8-1e-6);stars.onBeforeRender({getPixelRatio:()=>2});assert.equal(stars.material.uniforms.pixelRatio.value,2);assert.ok(stars.material.fragmentShader.includes('colorspace_fragment'));stars.geometry.dispose();stars.material.dispose();}
console.log('PASS V157 '+cases+' timed crossings, luminous contours, stable face light and display-correct resolved stars');
