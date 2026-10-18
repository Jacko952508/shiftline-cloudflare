import assert from 'node:assert/strict';
import * as THREE from 'three';
import {HAZARD_FAMILIES,familySpecifications,familyState} from '../public/hazard-families-v156.js';
import {localDistance,solidDistance} from '../public/course-colliders.js';
import {planTarget,clearance} from '../public/race-obstacles.js';
import {createTrack} from '../public/race-track.js';
import {hazardGeometry} from '../public/hazard-construction-v156.js';
import {installObstacleBodywork,updateObstacleBodywork} from '../public/obstacle-bodywork-v126.js';
let checked=0;
for(let course=1;course<=6;course++){
 const track=createTrack(course),specs=familySpecifications(course,track.length);assert.equal(new Set(specs.map(o=>o.family)).size,3);assert.deepEqual(familySpecifications(course,track.length),specs);
 for(const family of HAZARD_FAMILIES[course])assert.ok(new Set(specs.filter(o=>o.family===family).map(o=>o.variant)).size>=2);
 for(const o of specs)for(let t=0;t<18;t+=.75){
  const st=familyState(o,t),target=planTarget(o,t,0,0);assert.ok(target,'No safe route '+course+'/'+o.family+' @'+t);assert.ok(clearance(o,st,target.x,target.y)>=.29,'Planner targets a blocked opening');
  // Independently transform probes into each moving piece and compare the
  // shared SDF with the same piece poses used by the scene graph.
  for(let k=0;k<3;k++){
   const x=Math.sin(t+k)*4.8,y=Math.cos(t*.7+k)*4.8,z=k-1,c=Math.cos(st.a),s=Math.sin(st.a),rx=(x-st.x)*c+(y-st.y)*s,ry=-(x-st.x)*s+(y-st.y)*c;let expected=Infinity;
   for(let pi=0;pi<o.solids.length;pi++){
    const p=o.solids[pi],j=pi*6,part=st.pieces,px=rx-part[j],py=ry-part[j+1];
    expected=Math.min(expected,solidDistance({...p,x:0,y:0,z:0,a:0},px*part[j+4]+py*part[j+5],-px*part[j+5]+py*part[j+4],z-part[j+2]));
   }
   assert.ok(Math.abs(localDistance(o,st,x,y,z)-expected)<1e-9);
  }
  checked++;
 }
 for(const family of HAZARD_FAMILIES[course]){
  const o=specs.find(o=>o.family===family);o.motion=new THREE.Group();o.trim=[];installObstacleBodywork(o);
  for(const p of o.solids){const g=hazardGeometry(p,course);assert.ok(g.attributes.color);assert.ok(g.attributes.position.count<18000);assert.ok(g.index.count/3<8500);for(const x of g.attributes.normal.array)assert.ok(Number.isFinite(x));g.dispose();}
  const st=familyState(o,4.3);updateObstacleBodywork(o,st);
  for(const mesh of o.bodywork.meshes){const batch=mesh.name.includes('forged')?0:1;for(let i=0;i<mesh.count;i++){const actual=new THREE.Matrix4();mesh.getMatrixAt(i,actual);const expected=new THREE.Matrix4().multiplyMatrices(o.bodywork.partDelta[o.bodywork.drivers[batch][i]],o.bodywork.bases[batch][i]);for(let k=0;k<16;k++)assert.ok(Math.abs(actual.elements[k]-expected.elements[k])<1e-5,'Equipment detached from moving part');}mesh.geometry.dispose();mesh.material.dispose();}
 }
 console.log('PASS V156 '+course+' '+HAZARD_FAMILIES[course].join(', '));
}
const root={type:'arc',x:0,y:0,R:5,tube:1,start:0,end:Math.PI/2};assert.ok(solidDistance(root,5.9,0,0)<0);assert.ok(solidDistance(root,-5,0,0)>5);assert.ok(solidDistance(root,5,0,.9)<0);assert.ok(solidDistance(root,5,0,1.1)>0);
console.log('PASS V156 '+checked+' moving encounters: valid routes, shared collision poses and attached hardware');
