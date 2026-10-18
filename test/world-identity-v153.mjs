import * as THREE from 'three';
import assert from 'node:assert/strict';
import {createTrack} from '../public/race-track.js';
import {attachFarScenery,disposeFarScenery} from '../public/far-scenery-v129.js';
import {servicePanel,forestCrown,ancientTrunk} from '../public/world-identity-v153.js';
const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3(),v=new THREE.Vector3();
for(const quality of ['low','auto','high'])for(let course=1;course<=6;course++){
 const track=createTrack(course),scene=new THREE.Scene(),world={renderAhead:700};attachFarScenery(scene,world,track,course,quality);
 const d=world.farScenery;
 for(const chunk of d.chunks)for(let i=0;i<chunk.count;i++){
  chunk.meshes[0].getMatrixAt(i,m);m.decompose(p,q,scale);
  let h,w,centre;
  if(course===1){h=scale.y/.88;w=scale.x/2.1;centre=p.clone().add(new THREE.Vector3(0,h*.10,0));}
  else if(course===4){h=scale.y;w=scale.x;centre=p.clone().add(new THREE.Vector3(0,h*.6,0));}
  else if(course===6){h=scale.y/.25;w=scale.x/1.8;centre=p.clone().add(new THREE.Vector3(0,h*.48,0));}
  else{const factors={2:[.45,1.15,.21],3:[.36,1.2,.17],5:[.8,.55,.39]}[course];h=scale.y/factors[0];w=scale.x/factors[1];centre=p.clone().add(new THREE.Vector3(0,h*(.6-factors[2]),0));}
  const bound=course===4?Math.hypot(w*1.45,h*.9):Math.hypot(w*2.5,h*(course===1?.86:.65));
  for(const mesh of chunk.meshes){mesh.getMatrixAt(i,m);const a=mesh.geometry.attributes.position;for(let j=0;j<a.count;j++){v.fromBufferAttribute(a,j).applyMatrix4(m);assert.ok(v.distanceTo(centre)<=bound+.01,'Course '+course+' exceeds approved clearance volume: '+mesh.geometry.name);}}
 }
 assert.ok(d.geometries.every(g=>g.attributes.position.count<2200),'Per-instance geometry budget exceeded');
 assert.equal(d.materials.some(m=>m.transparent),false);assert.ok(d.minClearance>=24);
 disposeFarScenery(world);console.log('PASS actual geometry envelopes, opaque five-draw budget '+course+' '+quality);
}
for(let course=1;course<=6;course++){
 const g=servicePanel(course);g.computeBoundingBox();assert.ok(g.boundingBox.min.x>=-.17);assert.ok(g.boundingBox.max.x<=.061);assert.ok(g.boundingBox.max.y<=.726);assert.ok(g.boundingBox.max.z<=2.601);g.dispose();
}
for(const g of [forestCrown(),ancientTrunk()]){const a=g.attributes.position;for(const x of a.array)assert.ok(Number.isFinite(x));g.dispose();}
