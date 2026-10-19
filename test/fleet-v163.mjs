import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {craft,disposeCraft} from '../public/race-craft.js';
import {fleetFinish} from '../public/fleet-designs-v162.js';
import {fleetEnvironment} from '../public/fleet-paint-v163.js';
import {GarageFlightPath,flightFrame,createGarageFlight,updateGarageFlight,disposeGarageFlight} from '../public/garage-flight-v163.js';

const baseline=JSON.parse(readFileSync(new URL('./fleet-shapes-v162.json',import.meta.url))),finishes=new Set();
for(let model=0;model<6;model++)for(let edition=0;edition<3;edition++){
 const scene=new THREE.Scene(),ship=craft(scene,0xffffff,model,true,{edition},{batchStatic:false}),hash=createHash('sha256');
 // Keep the approved V162 external airframe fingerprint unchanged while
 // testing the intentionally new V172/V173 continuous hood assembly separately.
 ship.traverse(o=>{if(!o.geometry||o.userData.pilotHood)return;hash.update(o.name);for(const k of['position','normal','uv']){const a=o.geometry.attributes[k]?.array;if(a)hash.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}if(o.geometry.index)hash.update(Buffer.from(o.geometry.index.array.buffer));});
 assert.equal(hash.digest('hex'),baseline[model*3+edition],'Approved geometry, normals and UVs stay identical');
 const factoryHoods=[];ship.traverse(o=>{if(o.userData.pilotHood)factoryHoods.push(o);});
 assert.equal(factoryHoods.length,4,'Two connected body panels and two long light rails');
 for(const hood of factoryHoods){
  hood.geometry.computeBoundingBox();
  const bounds=hood.geometry.boundingBox;
  assert.ok(bounds.max.z>.28,'Hood trim must continue behind the cockpit');
  assert.ok(bounds.min.y<-.32,'Rear canopy trim must be recessed beneath the dashboard');
 }

 const [body,,,,light,,wing]=ship.userData.sculptMaterials,finish=fleetFinish(model,{edition});finishes.add(finish);
 assert.equal(body.userData.fleetFinish,finish);assert.equal(wing.userData.fleetFinish,finish);assert.equal(body.color.getHex(),wing.color.getHex());assert.equal(body.transparent,false);assert.equal(wing.transparent,false);
 assert.ok(body.clearcoat>=.8&&body.clearcoatRoughness<=.1);assert.ok(light.emissiveIntensity>2,'Illuminated ship inlays');
 if(finish==='chrome')assert.ok(body.metalness===1&&body.roughness<.15);
 if(finish==='pearl')assert.ok(body.iridescence>.5&&body.iridescenceIOR>1.2);
 if(finish==='metallic')assert.ok(body.metalness>.7&&body.roughness>=.2&&body.userData.flake>.03);
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.physical.vertexShader,fragmentShader:THREE.ShaderLib.physical.fragmentShader};wing.onBeforeCompile(shader);assert.ok(shader.fragmentShader.includes('fleetPanelColor'));assert.ok(shader.fragmentShader.includes('fwidth(flakeCell)'));assert.ok(shader.uniforms.fleetFlake);
 disposeCraft(scene,ship);
}
assert.equal(finishes.size,3);
const environment=fleetEnvironment();assert.ok([...environment.image.data].every(Number.isFinite));assert.ok(Math.max(...environment.image.data.slice(0,10000))>THREE.DataUtils.toHalfFloat(2),'HDR reflections exceed display white');
const curve=new GarageFlightPath(),flight=createGarageFlight(environment),ship=craft(flight.scene,0xffffff,5,true,{edition:0}),camera=new THREE.PerspectiveCamera(48,1.33,.1,180);
assert.ok(curve.getPoint(0).distanceTo(curve.getPoint(1))<1e-10);assert.ok(curve.getPoint(0).distanceTo(curve.getPoint(.5))>12,'Figure-eight overpass has tunnel clearance');
const start=flightFrame(curve,0),end=flightFrame(curve,1);assert.ok(start.rotation.angleTo(end.rotation)<1e-7);
let previous=null,maxBank=0,maxStep=0;
for(let i=0;i<=2200;i++){
 const frame=updateGarageFlight(flight,ship,camera,i*.01);ship.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 assert.ok(new THREE.Vector3(0,0,-1).applyQuaternion(ship.quaternion).dot(frame.forward)>.99999,'Nose faces along the tunnel');
 assert.ok(camera.position.clone().sub(ship.position).dot(frame.forward)<-3.8,'Camera follows behind');
 assert.ok(new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).dot(frame.forward)>.94,'Camera looks forward');
 if(previous){assert.ok(ship.position.distanceTo(previous.position)<.2,'Constant travel speed without jumps');maxStep=Math.max(maxStep,ship.quaternion.angleTo(previous.rotation));}
 maxBank=Math.max(maxBank,Math.abs(flight.qa.bank));previous={position:ship.position.clone(),rotation:ship.quaternion.clone()};
}
assert.ok(maxBank>.2&&maxBank<=.38);assert.ok(maxStep<.04,'No orientation flips or loop seam');
let triangles=0,draws=0;flight.tunnel.traverse(o=>{if(o.geometry){draws++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.count||1);}});assert.ok(draws<=6&&triangles<50000,'Bounded tunnel geometry and instanced fixtures');
let disposal=0;flight.tunnel.traverse(o=>{o.geometry?.addEventListener('dispose',()=>disposal++);});disposeCraft(flight.scene,ship);disposeGarageFlight(flight);assert.ok(disposal>=6);assert.equal(flight.scene.children.length,0);environment.dispose();
console.log('PASS V173: legacy approved airframe geometry preserved, four new swept cockpit trims per ship, three reflective paint families, seamless figure eight and safe disposal.');
