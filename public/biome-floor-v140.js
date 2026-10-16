import * as THREE from 'three';

// V140: four biome-specific pieces of foreground ground texture, rendered as
// two STATIC InstancedMesh draws per world. No collision or extra lighting,
// no transparency, and no material/shader changes to the racing tunnel.
// On LOW graphics the world's existing exterior group hides these details.
const BIOMES={
 3:{name:'CINDER / cooled slag and basalt splinters',a:[0x302a31,0x3d3435,0x58403c,0x62463c],b:[0x985b3c,0xb26a43,0xb66c43,0xbd784a],count:155,min:46,range:120},
 4:{name:'TEMPEST / alpine scree and weathered stone',a:[0x697481,0x8998a6,0x9ca7aa,0xaab6bb],b:[0xc3cbd2,0xdbe3e4,0xaab8c4,0xd0d6dd],count:152,min:59,range:175},
 5:{name:'VERDANT / fern undergrowth and fallen branches',a:[0x335f43,0x497d4b,0x5d8b45,0x3c6a4c],b:[0x6a934f,0x9dad6a,0x6b9e79,0x6b9459],count:220,min:38,range:107},
 6:{name:'FRACTURE / crystalline debris and fissure stones',a:[0x494e65,0x68718b,0x666985,0x73708f],b:[0x8c85b5,0xa5a0c0,0xb49ad7,0x9b8cc2],count:170,min:46,range:145}
};
const hash=(n,m)=>{const a=Math.sin(n*127.1+m*311.7)*43758.5453;return a-Math.floor(a)};
const TAU=Math.PI*2;
export function installBiomeFloor(group,track,course,ground,clearance){
 const cfg=BIOMES[course];if(!cfg)return null;
 const primaryGeo=course===5?new THREE.TetrahedronGeometry(1):course===4?new THREE.IcosahedronGeometry(1,0):new THREE.TetrahedronGeometry(1);
 const secondaryGeo=course===5?new THREE.TetrahedronGeometry(1):course===3?new THREE.OctahedronGeometry(1,0):new THREE.IcosahedronGeometry(1,0);
 const primaryMat=new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true,side:THREE.FrontSide});
 const secondaryMat=new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true,side:THREE.FrontSide});
 const base=new THREE.InstancedMesh(primaryGeo,primaryMat,cfg.count*3);
 const highlights=new THREE.InstancedMesh(secondaryGeo,secondaryMat,cfg.count);
 base.name='V140 / '+cfg.name+' / low-poly ground clusters';
 highlights.name='V140 / '+cfg.name+' / accent debris';
 for(const mesh of [base,highlights]){
  mesh.castShadow=false;mesh.receiveShadow=false;mesh.frustumCulled=false;
  mesh.userData.nonCollidingEnvironment=true;group.add(mesh);
 }
 const proxy=new THREE.Object3D(),tint=new THREE.Color(),accepted=[];
 let primaryCount=0,accentCount=0,rejected=0;
 for(let i=0;i<cfg.count;i++){
  const s=track.length*(i+.5)/cfg.count;
  const f=track.frame(s),direction=TAU*hash(i+course*37,4);
  const offset=cfg.min+cfg.range*hash(i+course*3,7);
  const x=f.p.x+Math.cos(direction)*offset,z=f.p.z+Math.sin(direction)*offset,y=ground(x,z);
  if(!Number.isFinite(y))continue;
  const chapter=Math.min(3,Math.floor(s/track.length*4));
  const radius=course===4?5+7*hash(i,10):course===5?2.7+3.2*hash(i,10):3.5+5.6*hash(i,10);
  const height=course===5?3+5*hash(i,11):course===3?5+9*hash(i,11):course===4?2+7*hash(i,11):5+11*hash(i,11);
  const safety=clearance.bounds(x,y+height*.65,z,radius*2.2,height*1.6,radius*2.2);
  if(!clearance.boxClear(safety)){rejected++;continue}
  accepted.push(safety);
  // Scatter clustered rocks/ferns with deliberately different orientations.
  for(let k=0;k<3;k++){
   const a=TAU*(k/3)+hash(i,k+12)*.4;
   const r=radius*(k===0?0:.50+.17*hash(i,k+29));
   proxy.position.set(x+Math.cos(a)*r,y+height*(course===5?.38:.20),z+Math.sin(a)*r);
   proxy.rotation.set(.15*hash(i,k+9),a,course===5?(k===0?-.18:(k%2?.52:-.52)):.4*hash(i,k+7));
   const h=height*(k===0?1:.6+.3*hash(i,k+8)),w=radius*(course===5?.24:.62)*(k===0?1:.75);
   proxy.scale.set(w,h,w*(course===5?.43:.75));proxy.updateMatrix();
   base.setMatrixAt(primaryCount,proxy.matrix);
   tint.setHex(cfg.a[chapter]).multiplyScalar(.78+.3*hash(i,k+28));
   base.setColorAt(primaryCount++,tint);
  }
  proxy.position.set(x+radius*.16,y+height*(course===5?.20:.12),z-radius*.13);
  proxy.rotation.set(.23*hash(i,14),hash(i,15)*TAU,.2*hash(i,16));
  proxy.scale.set(radius*(course===5?.55:.75),height*(course===5?.42:.44),radius*(course===5?.32:.70));
  proxy.updateMatrix();highlights.setMatrixAt(accentCount,proxy.matrix);
  tint.setHex(cfg.b[chapter]).multiplyScalar(.75+.32*hash(i,17));
  highlights.setColorAt(accentCount++,tint);
 }
 base.count=primaryCount;highlights.count=accentCount;
 for(const mesh of [base,highlights]){
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 }
 const result={version:140,course,name:cfg.name,clusters:accentCount,mainParts:primaryCount,rejected,
  drawCalls:2,collisionObjects:0,transparentSurfaces:0,shadows:0,bounds:accepted,
  meshes:[base,highlights]};
 group.userData.biomeFloor=result;
 if(typeof window!=='undefined'&&typeof location!=='undefined'&&location.search.includes('groundqa=1'))
  window.__shiftlineGroundQA={version:140,course,name:cfg.name,clusters:accentCount,mainParts:primaryCount,
   rejected,drawCalls:2,collisionObjects:0,transparentSurfaces:0,shadows:0};
 return result;
}
