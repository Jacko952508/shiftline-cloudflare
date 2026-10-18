import assert from 'node:assert/strict';
import * as THREE from 'three';
import {kineticGateSolids,isKineticGate} from '../public/kinetic-gates-v159.js';
import {familySpecifications,familyState} from '../public/hazard-families-v156.js';
import {localDistance} from '../public/course-colliders.js';
import {planTarget,clearance} from '../public/race-obstacles.js';
import {hazardGeometry} from '../public/hazard-construction-v156.js';
import {markHazardGeometry} from '../public/obstacle-glow-v155.js';
const area=p=>Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-a[1]*b[0];},0))/2;
let samples=0;
for(const [course,families]of [[1,['dock-clamps','security-segments']],[2,['pressure-bulkhead']],[4,['discharge-gate']]]){
 for(const family of families)for(let variant=0;variant<3;variant++){
  const solids=kineticGateSolids(family,variant);assert.ok(isKineticGate(family));
  const moving=solids.filter(p=>p.drive),shutter=family.includes('clamps')||family.includes('bulkhead');
  const coverage=solids.filter(p=>p.points).reduce((s,p)=>s+area(p.points),0)/(Math.PI*7.3**2);
  assert.ok(coverage<.40,'Too much opaque plate area '+family+' '+coverage);
  for(const p of solids){
   const g=markHazardGeometry(hazardGeometry(p,course),p);
   assert.equal(g.attributes.hazardStyle.getX(0),shutter?1:2);assert.ok(g.attributes.position.count<18000);
   assert.ok([...g.attributes.hazardLight.array].some(x=>x>.9)||p.type==='sphere');g.dispose();
  }
  const o={...familySpecifications(course,4000).find(o=>o.family===family),variant,solids,forceDodge:false};
  let previousAngle=null;
  for(let t=0;t<20;t+=.125){
   const st=familyState(o,t);assert.equal(st.x,0);assert.equal(st.y,0);assert.equal(st.a,o.orientation);
   if(shutter){
    assert.ok(Math.abs(st.pieces[0]+st.pieces[12])<1e-9,'Jaws do not close symmetrically');
    // A fixed centred line must stay open throughout a complete stroke.
    assert.ok(localDistance(o,st,0,0,0)>2.3);
   }else{
    const angles=moving.map(p=>st.pieces[solids.indexOf(p)*6+3]);
    assert.ok(angles.every(a=>Math.abs(a-angles[0])<1e-10),'Rotor petals lost their mechanical registration');
    if(previousAngle!==null)assert.equal(Math.sign(angles[0]-previousAngle),variant===1?-1:1);
    previousAngle=angles[0];assert.ok(localDistance(o,st,0,0,0)<0,'Uninteresting straight-through core');
   }
   for(const forced of [false,true]){
    o.forceDodge=forced;const target=planTarget(o,t,0,0);assert.ok(target);
    for(const dt of[-.13,0,.13])assert.ok(clearance(o,familyState(o,t+dt),target.x,target.y)>=.29,'Passage closes during a crossing');
   }
   o.forceDodge=false;samples++;
  }
  console.log('PASS V159 '+family+' variant '+variant+' opaque plate coverage '+Math.round(coverage*100)+'%');
 }
}
console.log('PASS V159 '+samples+' mechanism samples: stable mounts, registered motion, readable silhouettes and safe crossing windows');
