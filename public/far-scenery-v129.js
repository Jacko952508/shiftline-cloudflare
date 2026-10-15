import * as THREE from 'three';
// Phase 3: distant opaque silhouettes only. No physics, transparent glass or postprocessing.
const THEMES={
 1:{name:'orbital docks',a:0x53697b,b:0x7893a6,c:0x3a8d9d,form:'tower'},
 2:{name:'abyssal rock gardens',a:0x183d4a,b:0x286b71,c:0x247b80,form:'reef'},
 3:{name:'volcanic caldera',a:0x382a2b,b:0x6b3c30,c:0x9b4826,form:'spire'},
 4:{name:'storm sky platforms',a:0x465f78,b:0x738ba1,c:0x7299c1,form:'tower'},
 5:{name:'overgrown forest canopy',a:0x284e39,b:0x427c50,c:0x5b9e67,form:'canopy'},
 6:{name:'fractured lunar quarry',a:0x42465c,b:0x69748b,c:0x7b79b1,form:'crystal'}
};
const random=(a,b)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v)};
const UP=new THREE.Vector3(0,1,0);
export function attachFarScenery(scene,world,track,course,quality='auto'){
 const theme=THEMES[course],low=quality==='low',root=new THREE.Group(),chunks=[],stride=low?240:175;
 root.name='V129 / NONCOLLIDING DISTANT SCENERY';scene.add(root);
 const mats=[new THREE.MeshLambertMaterial({color:theme.a,flatShading:true}),new THREE.MeshLambertMaterial({color:theme.b,flatShading:true}),new THREE.MeshBasicMaterial({color:theme.c,toneMapped:false})];
 const geos=[new THREE.CylinderGeometry(.55,.95,1,low?5:7,1),theme.form==='crystal'?new THREE.OctahedronGeometry(1):theme.form==='canopy'?new THREE.IcosahedronGeometry(1):new THREE.CylinderGeometry(.55,.9,1,6,1),new THREE.BoxGeometry(1,1,1)];
 const dummy=new THREE.Object3D(),p=new THREE.Vector3(),radialVector=new THREE.Vector3();
 let total=0,minDistance=Infinity;
 for(let start=0;start<track.length;start+=stride){
  const end=Math.min(track.length,start+stride),count=low?4:9,group=new THREE.Group();
  const meshes=geos.map((g,i)=>new THREE.InstancedMesh(g,mats[i],count));
  group.add(...meshes);root.add(group);
  for(const m of meshes){m.frustumCulled=false;m.castShadow=false;m.receiveShadow=false}
  for(let i=0;i<count;i++){
   const span=Math.max(0,end-start-30),s=Math.min(track.length-2,start+15+span*random(i+3,start+9)),f=track.frame(s);
   const angle=(i+.25*random(i+13,start+2))*Math.PI*2/count,radius=95+85*random(i+17,start+5);
   const height=(theme.form==='tower'?18:theme.form==='canopy'?22:28)+58*random(i+7,start+11);
   const width=(theme.form==='canopy'?7:4)+9*random(i+29,start);
   radialVector.copy(f.r).multiplyScalar(Math.cos(angle)).addScaledVector(f.u,Math.sin(angle));
   p.copy(f.p).addScaledVector(radialVector,radius);
   minDistance=Math.min(minDistance,radius-width*1.8);
   dummy.position.copy(p).addScaledVector(radialVector,height*.32);
   dummy.quaternion.setFromUnitVectors(UP,radialVector);dummy.scale.set(width,height,width);dummy.updateMatrix();meshes[0].setMatrixAt(i,dummy.matrix);
   dummy.position.copy(p).addScaledVector(radialVector,height*.74);
   dummy.scale.set(width*(theme.form==='canopy'?1.7:.8),height*(theme.form==='canopy'?.48:.35),width*(theme.form==='canopy'?1.7:.8));dummy.updateMatrix();meshes[1].setMatrixAt(i,dummy.matrix);
   dummy.position.copy(p).addScaledVector(radialVector,height*.88);
   dummy.scale.set(width*.34,.65,width*.34);dummy.updateMatrix();meshes[2].setMatrixAt(i,dummy.matrix);
  }
  meshes.forEach(m=>m.instanceMatrix.needsUpdate=true);
  chunks.push({start,end,group});total+=count;
 }
 world.farScenery={root,chunks,course,name:theme.name,total,minDistance,low,materials:mats,geometries:geos,first:-1,last:-1,stride};
 if(typeof window!=='undefined'&&typeof location!=='undefined'&&location.search.includes('sceneryqa=1'))
  window.__shiftlineSceneryQA={course,name:theme.name,landmarks:total,chunks:chunks.length,minDistance,low,collisionObjects:0,glassSurfaces:0,version:129};
 return world;
}
export function updateFarScenery(world,along){
 const d=world?.farScenery;if(!d)return;
 const first=Math.max(0,Math.floor((along-220)/d.stride)),last=Math.min(d.chunks.length,Math.ceil((along+(world.renderAhead||700)+220)/d.stride));
 if(first===d.first&&last===d.last)return;
 for(let i=0;i<d.chunks.length;i++)d.chunks[i].group.visible=i>=first&&i<last;
 d.first=first;d.last=last;
}
export function disposeFarScenery(world){
 const d=world?.farScenery;if(!d)return;
 d.root.parent?.remove(d.root);d.geometries.forEach(g=>g.dispose());d.materials.forEach(m=>m.dispose());world.farScenery=null;
}
