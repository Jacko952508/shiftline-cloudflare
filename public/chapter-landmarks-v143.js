import * as THREE from 'three';
import {finishSurface,skylineBlock,weatheredRock} from './art-direction-v148.js?v=148';
import {canopyGeometry} from './race-finish-v147.js?v=147';
import {actAt} from './race-track.js?v=58';

// V144: deliberately recognisable exterior set pieces instead of repeated
// skyline clutter. Nothing created here participates in track physics.
// All parts are opaque; every section has a strict visibility window.
const PROFILES={
 1:{name:'Orbital drydock',metal:0x587b98,detail:0x9bb6c6,glow:[0x5adfff,0xa3acff,0xffc580,0xff825c]},
 2:{name:'Abyssal reef arch',metal:0x37606e,detail:0x76aa9b,glow:[0x65e6d1,0x83d7af,0x74a6ef,0xb0e5c7]},
 3:{name:'Furnace refinery',metal:0x665354,detail:0xa7795d,glow:[0xaacbd8,0xffaf63,0xff774b,0xffb485]},
 4:{name:'Mountain observatory',metal:0x596c81,detail:0xced9df,glow:[0x83c8f0,0xc0b5ff,0x84daff,0xffd2a3]},
 5:{name:'Ancient forest giant',metal:0x46614b,detail:0x6f9855,glow:[0xb5ea94,0x8ce6c6,0xe1d89a,0xb2b5e7]},
 6:{name:'Fractured monolith',metal:0x505573,detail:0xa29bba,glow:[0xf0bb98,0x82b7fc,0xc8a9ff,0xffabdf]}
};
const UP=new THREE.Vector3(0,1,0);
function geos(course,low){
 const radial=low?6:10;
 switch(course){
  case 1:return [skylineBlock(),new THREE.TorusGeometry(1,.075,low?4:7,low?14:32),new THREE.BoxGeometry(1,1,1)];
  case 2:return [new THREE.CylinderGeometry(.45,.85,1,radial),weatheredRock(low?0:1),new THREE.OctahedronGeometry(1,0)];
  case 3:return [new THREE.CylinderGeometry(.65,.92,1,radial),new THREE.TorusGeometry(1,.18,low?4:6,low?12:24),new THREE.ConeGeometry(1,1,radial)];
  case 4:return [new THREE.ConeGeometry(1,1,low?6:18,low?1:5),new THREE.BoxGeometry(1,1,1),new THREE.IcosahedronGeometry(1,0)];
  case 5:return [new THREE.CylinderGeometry(.40,.85,1,radial),canopyGeometry(low?0:2),new THREE.OctahedronGeometry(1,0)];
  default:return [new THREE.OctahedronGeometry(1,0),new THREE.TetrahedronGeometry(1,0),new THREE.TorusGeometry(1,.12,low?4:6,low?14:28)];
 }
}
function recipe(course,chapter,base,w,h,seed){
 const parts=[[],[],[]];
 const add=(k,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0)=>{
  parts[k].push({x:base.x+x,y:base.y+y,z:base.z+z,sx,sy,sz,rx,ry,rz});
 };
 const turn=(seed*.61803398875)%6.28318530718;
 switch(course){
  case 1: // Orbital shipyard: drydock rings crossing heavy pylons.
   add(0,0,h*.39,0,w*.75,h*.78,w*.72,0,turn);
   add(0,w*.74,h*.39,0,w*.28,h*.72,w*.25);
   add(0,-w*.74,h*.39,0,w*.28,h*.72,w*.25);
   add(1,0,h*.9,0,w*1.8,w*1.8,w*.65,0,turn);
   add(1,0,h*.56,0,w*1.1,w*1.1,w*.48,.33,turn);
   add(2,0,h*1.02,0,w*.17,h*.21,w*.17);
   add(2,w*.74,h*.80,0,w*.08,h*.14,w*.08);break;
  case 2: // Undersea pressure gardens: reef arches, arms and spore pearls.
   add(0,-w*.5,h*.35,0,w*.32,h*.7,w*.32,0,0,-.13);
   add(0,w*.5,h*.35,0,w*.32,h*.7,w*.32,0,0,.13);
   add(1,0,h*.77,0,w*1.15,h*.35,w*.38);
   add(1,-w*.78,h*.47,w*.36,w*.47,h*.4,w*.4);
   add(1,w*.75,h*.59,-w*.27,w*.48,h*.39,w*.4);
   add(2,0,h*.94,0,w*.22,w*.24,w*.23);
   add(2,w*.75,h*.92,-w*.27,w*.16,w*.19,w*.16);break;
  case 3: // Giant foundry with flanged chimneys and hot forge vents.
   add(0,-w*.45,h*.44,0,w*.42,h*.87,w*.4);
   add(0,w*.50,h*.52,0,w*.37,h*1.02,w*.35);
   add(0,0,h*.24,0,w*.8,h*.48,w*.78);
   add(1,-w*.45,h*.84,0,w*.36,w*.36,w*.36,Math.PI/2);
   add(1,w*.50,h*1.04,0,w*.34,w*.34,w*.34,Math.PI/2);
   add(2,0,h*.51,0,w*.2,h*.2,w*.20);
   add(2,w*.50,h*1.08,0,w*.16,h*.22,w*.16);break;
  case 4: // Mountain observatory: low mountain mass, snow cap, lookout.
   add(0,0,h*.44,0,w*1.2,h*.92,w*1.22);
   add(0,w*.85,h*.29,w*.31,w*.68,h*.59,w*.70);
   add(1,-w*.18,h*.73,0,w*.65,h*.06,w*.67);
   add(1,0,h*.82,0,w*.14,h*.24,w*.14);
   add(1,0,h*.96,0,w*.52,h*.055,w*.12,0,turn);
   add(2,0,h*1.00,0,w*.10,w*.15,w*.11);break;
  case 5: // Colossal trees with separate canopy crowns, roots, fireflies.
   add(0,0,h*.40,0,w*.42,h*.82,w*.40);
   add(0,-w*.41,h*.21,w*.15,w*.26,h*.43,w*.24,0,0,-.45);
   add(0,w*.4,h*.19,-w*.24,w*.24,h*.38,w*.23,0,0,.48);
   add(1,0,h*.88,0,w*1.9,h*.35,w*1.78);
   add(1,w*.75,h*.69,w*.12,w*1.00,h*.26,w*.87);
   add(1,-w*.65,h*.70,-w*.3,w*.87,h*.26,w*.94);
   add(2,w*.9,h*.53,w*.4,w*.18,h*.15,w*.18);break;
  default: // Fracture: giant rift shard and vertical portal rings.
   add(0,0,h*.59,0,w*.63,h*.83,w*.71,0,turn,.17);
   add(0,-w*.68,h*.42,w*.36,w*.49,h*.51,w*.41,.2,turn);
   add(1,w*.83,h*.66,-w*.4,w*.57,h*.59,w*.47,.33,turn);
   add(1,-w*.28,h*1.05,0,w*.34,h*.39,w*.37,.4,turn);
   add(2,0,h*.78,0,w*1.25,w*1.25,w*.25,0,turn);
   add(2,0,h*1.03,0,w*.18,h*.12,w*.2);
 }
 return parts;
}
const matrix=new THREE.Matrix4(),dummy=new THREE.Object3D();
function fill(mesh,entries){
 for(let i=0;i<entries.length;i++){
  const a=entries[i];
  dummy.position.set(a.x,a.y,a.z);dummy.rotation.set(a.rx,a.ry,a.rz);
  dummy.scale.set(a.sx,a.sy,a.sz);dummy.updateMatrix();matrix.copy(dummy.matrix);
  mesh.setMatrixAt(i,matrix);
 }
 mesh.count=entries.length;
 mesh.instanceMatrix.needsUpdate=true;
}
export function attachChapterLandmarks(world,track,course,quality='auto'){
 const profile=PROFILES[course];if(!profile)throw Error('Unknown landmark world '+course);
 const check=world.farScenery?.checkClearance;
 if(typeof check!=='function')throw Error('Whole-track clearance index missing');
 const low=quality==='low',root=new THREE.Group();root.name='V143 / SIGNATURE CHAPTER LANDMARKS';world.root.add(root);
 const geometry=geos(course,low),materials=[
  new THREE.MeshLambertMaterial({color:profile.metal,flatShading:true}),
  new THREE.MeshLambertMaterial({color:profile.detail,flatShading:true}),
  new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false,depthWrite:true})
 ];
 if(course===5){materials[1].flatShading=false;materials[1].vertexColors=true;}
 if(course===4)materials[0].flatShading=false;
 for(let i=0;i<2;i++)finishSurface(materials[i],course===1?'city':course===5?(i===1?'canopy':'organic'):'landscape',course);
 const groupCount=3,sites=[],chapterCounts=[0,0,0,0];
 const v=new THREE.Vector3(),dir=new THREE.Vector3(),centre=new THREE.Vector3();
 let totalParts=0,skipped=0,minClearance=Infinity;
 for(let chapter=0;chapter<4;chapter++)for(let n=0;n<groupCount;n++){
  // Follow actual authored act spans: early courses do not have equal chapters.
  const act=actAt(track.length*(chapter+.5)/4,track.length,course);
  const s=track.length*(act.start+(act.end-act.start)*(n+.5)/groupCount),frame=track.frame(s);
  dir.copy(frame.r).setY(0);
  if(dir.lengthSq()<.025)dir.set(frame.f.z,0,-frame.f.x);
  if(dir.lengthSq()<.025)dir.set(1,0,0);
  dir.normalize().multiplyScalar((n%2===0)?1:-1);
  const height=(course===4?65:course===5?80:course===2?67:course===6?90:75)*(1+.12*n+.09*chapter);
  const width=(course===4?35:course===5?27:course===1?24:23)*(1+.12*n);
  // One bounding sphere encloses the entire set piece, including its
  // outer rings/branches and even the overhead floating components.
  const bound=Math.hypot(width*2.65,height*.84);
  let chosen=null,margin=-1;
  for(let attempt=0;attempt<6;attempt++){
   const offset=150+attempt*61+(chapter%2)*12+n*7;
   const x=frame.p.x+dir.x*offset,z=frame.p.z+dir.z*offset;
   let y=frame.p.y-height*.40-38;
   if(typeof world.ground==='function')y=world.ground(x,z);
   else if(typeof world.vista?.seabed?.heightAt==='function')y=world.vista.seabed.heightAt(x,z);
   if(course===1)y=frame.p.y-height*.52+((n+chapter)%2?28:-28);
   if(course===6)y=frame.p.y-height*.43+((n+chapter)%2?22:-22);
   if(!Number.isFinite(y))continue;
   v.set(x,y,z);centre.copy(v).addScaledVector(UP,height*.59);
   margin=check(centre,bound);
   if(margin>=24){chosen=v.clone();break}
  }
  if(!chosen){skipped++;continue}
  const parts=recipe(course,chapter,chosen,width,height,chapter*19+n*13);
  const g=new THREE.Group();g.name='V143 / '+profile.name+' / ACT '+(chapter+1);root.add(g);g.visible=false;
  const meshes=geometry.map((geo,k)=>{
   const mesh=new THREE.InstancedMesh(geo,materials[k],Math.max(1,parts[k].length));
   mesh.name='V143 / NON-COLLIDING GEOMETRY';mesh.frustumCulled=false;
   mesh.castShadow=mesh.receiveShadow=false;
   mesh.userData.nonCollidingEnvironment=true;g.add(mesh);fill(mesh,parts[k]);return mesh;
  });
  const tint=new THREE.Color(profile.glow[chapter]);for(let i=0;i<parts[2].length;i++)meshes[2].setColorAt(i,tint);
  if(meshes[2].instanceColor)meshes[2].instanceColor.needsUpdate=true;
  sites.push({s,chapter,actName:act.name,actStart:act.start,actEnd:act.end,g,meshes,counts:parts.map(p=>p.length)});
  chapterCounts[chapter]++;minClearance=Math.min(minClearance,margin);
  totalParts+=parts.reduce((a,b)=>a+b.length,0);
 }
 const detail={root,sites,course,quality,low,chapterCounts,minClearance,skipped,totalParts,
   materials,geometry,visible:0,lastS:-Infinity};
 world.chapterLandmarks=detail;
 setChapterLandmarkQuality(world,quality);
 if(typeof window!=='undefined'&&typeof location!=='undefined'&&location.search.includes('landmarkqa=1'))
  window.__shiftlineChapterLandmarkQA={course,version:144,actBoundaries:sites.map(s=>({chapter:s.chapter,position:s.s/track.length,start:s.actStart,end:s.actEnd,name:s.actName})),chapterCounts:[...chapterCounts],
   sites:sites.length,parts:totalParts,minClearance,skipped,drawCallsPerSite:3,
   transparent:0,shadowCasters:0,collisionObjects:0,low};
 return world;
}
export function setChapterLandmarkQuality(world,quality){
 const d=world?.chapterLandmarks;if(!d)return;
 const low=quality==='low';d.low=low;
 for(const site of d.sites){
  site.meshes[0].count=low?Math.min(2,site.counts[0]):site.counts[0];
  site.meshes[1].count=low?0:site.counts[1];
  site.meshes[2].count=low?0:site.counts[2];
 }
}
export function updateChapterLandmarks(world,s){
 const d=world?.chapterLandmarks;if(!d)return;
 if(Math.abs(s-d.lastS)<16)return;d.lastS=s;
 let visible=0;
 for(const site of d.sites){
  // Explorer free cameras can be further behind a scrub position.
  const show=site.s>s-330&&site.s<s+(world.renderAhead||700)+400;
  site.g.visible=show;
  if(show)visible++;
 }
 d.visible=visible;
}
export function disposeChapterLandmarks(world){
 const d=world?.chapterLandmarks;if(!d)return;
 d.root.parent?.remove(d.root);
 d.geometry.forEach(g=>g.dispose());d.materials.forEach(m=>m.dispose());
 world.chapterLandmarks=null;
}
