import assert from 'node:assert/strict';
import * as THREE from 'three';
import {chaseProfile,attachSightlines} from '../public/race-sightlines-v158.js';
import {actuationPeriod,familySpecifications,familyState} from '../public/hazard-families-v156.js';
import {markHazardGeometry,illuminateHazard} from '../public/obstacle-glow-v155.js';
const saved={};assert.equal(chaseProfile(390/844,false,false,saved),saved);
assert.ok(saved.distance>5.9&&saved.distance<6.2,'Portrait camera must leave room for the larger sculpted ships');assert.ok(saved.height>1.3,'Camera must look over the hull');assert.ok(saved.lookAhead>14.5);
assert.deepEqual(chaseProfile(16/9),{distance:3.8,height:.8,lookAhead:12});
assert.equal(chaseProfile(.46,true,true).distance,chaseProfile(.46,false,true).distance);
let previous=Infinity;for(let aspect=.4;aspect<2;aspect+=.01){const p=chaseProfile(aspect);assert.ok(p.distance<=previous+1e-10);previous=p.distance;}
const source=new THREE.MeshBasicMaterial({color:0x6adfff,toneMapped:false}),root=new THREE.Group(),chunk=new THREE.Group(),geo=new THREE.TorusGeometry(7.5,.025,6,48),ring=new THREE.InstancedMesh(geo,source,4),beacon=new THREE.Mesh(new THREE.SphereGeometry(1),source),solid=new THREE.Mesh(new THREE.TorusGeometry(7.6,.2,6,48),source);chunk.add(ring,solid);root.add(chunk,beacon);const world={root,chunks:[{g:chunk}]};
const positions=geo.attributes.position.array.slice(),matrices=ring.instanceMatrix.array.slice();attachSightlines(world);
assert.equal(world.sightlines.guides,1);assert.equal(world.sightlines.addedDraws,0);assert.notEqual(ring.material,source);assert.equal(beacon.material,source);assert.equal(solid.material,source);assert.equal(source.userData.sightline158,undefined);
assert.equal(ring.material.color,source.color);source.color.setHex(0xffcc88);assert.equal(ring.material.color.getHex(),0xffcc88);assert.deepEqual(geo.attributes.position.array,positions);assert.deepEqual(ring.instanceMatrix.array,matrices);
const shader={vertexShader:THREE.ShaderLib.basic.vertexShader,fragmentShader:THREE.ShaderLib.basic.fragmentShader};ring.material.onBeforeCompile(shader);assert.ok(shader.vertexShader.includes('-mvPosition.z'));assert.ok(shader.fragmentShader.includes('routeGuideVisible'));assert.ok(shader.fragmentShader.includes('diffuseColor.rgb*='));
for(let course=1;course<=6;course++)for(const o of familySpecifications(course,1200))for(const p of o.solids){
 const g=markHazardGeometry(new THREE.BoxGeometry(1,1,1),p),flow=g.attributes.hazardFlow,phase=g.attributes.hazardPhase,d=p.drive||{};
 assert.equal(flow.itemSize,4);assert.equal(phase.count,g.attributes.position.count);
 assert.ok(Math.abs(flow.getX(0)-(d.x||0))<1e-6);assert.ok(Math.abs(flow.getY(0)-(d.y||0))<1e-6);assert.ok(Math.abs(flow.getZ(0)-(d.turn||0))<1e-6);assert.ok(Math.abs(flow.getW(0)-(d.rock||0))<1e-6);assert.ok(Math.abs(phase.getX(0)-(d.phase||0))<1e-6);
 const m=new THREE.MeshStandardMaterial();illuminateHazard(m,{period:actuationPeriod(o.family),driveScale:1.8+o.variant*.18});const s={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};m.onBeforeCompile(s);
 assert.equal(s.uniforms.hazardPeriod.value,actuationPeriod(o.family));assert.equal(s.uniforms.hazardDriveScale.value,1.8+o.variant*.18);assert.ok(s.fragmentShader.includes('hazardMotionPhase'));
 // Independent drive evaluation verifies the values supplied to the light
 // shader are the same motion clock and scale as the collision state.
 const time=3.7,clock=time+o.seed,v=.5-.5*Math.cos(clock*Math.PI*2/actuationPeriod(o.family)+(d.phase||0)),cycle=v*v*(3-2*v),angle=(p.a||0)+(d.turn||0)*clock*(1.8+o.variant*.18)+(d.rock||0)*(2*cycle-1),index=o.solids.indexOf(p)*6;
 assert.ok(Math.abs(familyState(o,time).pieces[index+3]-angle)<1e-10);g.dispose();m.dispose();
}
console.log('PASS V158 portrait sight lines, unchanged landscape framing, isolated guide materials and collision-synchronised light motion');
