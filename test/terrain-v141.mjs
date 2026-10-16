import * as THREE from 'three';
import assert from 'node:assert/strict';
import {expansionGround} from '../public/expansion-world.js';
import {createTrack} from '../public/race-track.js';
const baseline=(course,x,z,endZ)=>{
 if(course===4)return 55+220*Math.exp(-(((x-420*Math.sin(z*.0015))/380)**2))+100*Math.sin(z*.002)**2-550*THREE.MathUtils.smoothstep(-z,-endZ-950,-endZ-350);
 if(course===5){const cavern=THREE.MathUtils.smoothstep(-z,-endZ-950,-endZ-350);return -20+30*Math.sin(x*.002)*Math.sin(z*.003)-280*cavern;}
 const shaft=Math.exp(-((Math.hypot(x,z+1050)/430)**4));return 280-480*shaft-600*THREE.MathUtils.smoothstep(-z,650,1400)+30*Math.sin(x*.003)*Math.cos(z*.002)-250*THREE.MathUtils.smoothstep(-z,-endZ-1300,-endZ-600);
};
for(const course of [4,5,6]){
 const track=createTrack(course),endZ=track.frames.at(-1).p.z;
 let min=Infinity,max=0,changed=0;
 for(let i=0;i<450;i++){
  const s=track.length*(i+.5)/450,f=track.frame(s);
  const x=f.p.x+((i%7)-3)*65,z=f.p.z+((i%11)-5)*55;
  const original=baseline(course,x,z,endZ),next=expansionGround(course,x,z,endZ);
  assert.ok(Number.isFinite(next),'NaN terrain');
  assert.ok(next<=original+1e-8,'Landscape must NEVER raise terrain into an existing tunnel');
  const carved=original-next;
  min=Math.min(min,carved);max=Math.max(max,carved);
  if(carved>4)changed++;
 }
 assert.ok(changed>100,'Terrain pass too weak '+course);
 assert.ok(max>8,'Missing visible ravines '+course);
 console.log('PASS V141 safely carved terrain '+JSON.stringify({course,sections:changed,min,max}));
}
