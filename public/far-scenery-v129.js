import * as THREE from 'three';
import {finishSurface,skylineBlock,weatheredRock} from './art-direction-v148.js?v=148';
import {canopyGeometry} from './race-finish-v147.js?v=147';

// V133 / Phase 3 worldscapes: six independent distant silhouettes.
// Keep every scenic mesh opaque, unlit by shadow maps, and separate from
// glass, hitboxes, tunnel physics, WorldFinish and the game's save format.
const PROFILES={
 1:{name:'ORBITAL HARBOUR / city towers, transfer decks and antennae',kind:'city',
    primary:0x536c83,secondary:0x7896ad,accent:0x5db0d3,shade:0x324657,
    base:53,height:90,spread:14},
 2:{name:'ABYSSAL GARDENS / basalt reefs, coral branches and bioluminescence',kind:'reef',
    primary:0x295d64,secondary:0x6c9d86,accent:0x72cbbc,shade:0x173a49,
    base:55,height:70,spread:13},
 3:{name:'CINDER CALDERA / volcanic spires, chimneys and molten vents',kind:'forge',
    primary:0x514447,secondary:0x986451,accent:0xff8b52,shade:0x302b32,
    base:53,height:95,spread:13},
 4:{name:'TEMPEST / grounded mountain ridges and rare turbines',kind:'storm',
    primary:0x647788,secondary:0xc5d1d6,accent:0x83b6cc,shade:0x384e61,
    base:55,height:103,spread:54},
 5:{name:'ANCIENT CANOPY / giant trunks, boughs, crowns and glowing spores',kind:'forest',
    primary:0x42674e,secondary:0x578b58,accent:0x9edc8c,shade:0x2e4b39,
    base:45,height:94,spread:14},
 6:{name:'RIFT QUARRY / jagged basalt, suspended shards and violet rifts',kind:'rift',
    primary:0x5c6074,secondary:0x9692b9,accent:0xc09aff,shade:0x33364c,
    base:47,height:96,spread:12}
};
// Four independent chapter accents per world, applied through existing
// instance colours (no extra lights, shaders, render targets or textures).
const CHAPTER_LIGHT={
 1:[0x6aeaff,0x9aa8ff,0xffc481,0xff855c],
 2:[0x58ded1,0x94e9b2,0x719ce9,0x9fe9c6],
 3:[0x89c7d6,0xef9954,0xff6b43,0xffb26b],
 4:[0x88c8f5,0xb4a8ff,0x76d9ff,0xffd2a3],
 5:[0xa0e79e,0x7bdfcd,0xe8d28c,0x9bbaff],
 6:[0xf4bf97,0x83b1ff,0xc5a5ff,0xffa1d9]
};
// Chapter ambience colours only the far scenery. No additional passes,
// transparency, collision volumes, world fog or track lighting.
const CHAPTER_HAZE={
 1:[0x6c9fbc,0x8f91bc,0xc3a080,0xc6827d],
 2:[0x337987,0x4f8f85,0x4b668b,0x70a493],
 3:[0x87949c,0xbb7451,0xcf8049,0xa95b45],
 4:[0x7898ac,0x9197b7,0x8bb5ca,0xa9b7c2],
 5:[0x537b53,0x478f7e,0xa3a16c,0x7e8c9e],
 6:[0x9e8b8f,0x8297bb,0xa28fc3,0xce91bc]
};
export function atmosphereChapters(progress){
 const p=THREE.MathUtils.clamp(progress,0,.999999)*4,edge=Math.round(p);
 if(edge>=1&&edge<=3&&Math.abs(p-edge)<.18)
  return {from:edge-1,to:edge,t:THREE.MathUtils.smoothstep(p,edge-.18,edge+.18)};
 const chapter=Math.min(3,Math.floor(p));return {from:chapter,to:chapter,t:0};
}
const TAU=Math.PI*2;
const UP=new THREE.Vector3(0,1,0);
const hash=(a,b)=>{const t=Math.sin(a*127.1+b*311.7)*43758.5453;return t-Math.floor(t)};
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));

// Grid of the *entire* course, including crossover loops and parallel runs.
// Sampling at <=22m along the polyline with an extra 14m safety pad avoids
// allocating a full 3D bounding volume per object.
function trackIndex(track){
 const cell=105,map=new Map(),points=track.frames,step=Math.max(1,Math.floor(20/track.step));
 const key=(x,y,z)=>x+':'+y+':'+z;
 for(let i=0;i<points.length;i+=step){
  const p=points[i].p,x=Math.floor(p.x/cell),y=Math.floor(p.y/cell),z=Math.floor(p.z/cell),k=key(x,y,z);
  if(!map.has(k))map.set(k,[]);map.get(k).push(p);
 }
 const p=points.at(-1).p,k=key(Math.floor(p.x/cell),Math.floor(p.y/cell),Math.floor(p.z/cell));
 if(!map.has(k))map.set(k,[]);map.get(k).push(p);
 return (position,bound)=>{
  const x=Math.floor(position.x/cell),y=Math.floor(position.y/cell),z=Math.floor(position.z/cell),r=Math.max(1,Math.ceil((bound+22)/cell));
  let nearest=Infinity;
  for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)for(let dz=-r;dz<=r;dz++)
   for(const p of map.get(key(x+dx,y+dy,z+dz))||[])nearest=Math.min(nearest,position.distanceTo(p));
  return (nearest===Infinity?9999:nearest-bound-14);
 };
}
// Ground-rooted jagged landscape volume, with irregular ridges; no towers.
function mountainGeometry(){
 const sides=11,rings=[[0,1.16],[.30,.88],[.62,.53],[.84,.25],[1,.015]];
 const vertices=[],index=[];
 for(let r=0;r<rings.length;r++)for(let i=0;i<sides;i++){
  const a=i*Math.PI*2/sides,noise=1+.15*Math.sin(i*2.83+r*1.67)+.08*Math.cos(i*4.12-r*.9);
  vertices.push(Math.cos(a)*rings[r][1]*noise,rings[r][0]+.025*Math.sin(i*1.3+r),Math.sin(a)*rings[r][1]*noise);
 }
 for(let r=0;r<rings.length-1;r++)for(let i=0;i<sides;i++){
  const a=r*sides+i,b=r*sides+(i+1)%sides,c=(r+1)*sides+i,d=(r+1)*sides+(i+1)%sides;
  index.push(a,c,b,b,c,d);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geo.setIndex(index);geo.computeVertexNormals();return geo;
}

function shapes(kind,quality){
 const low=quality==='low';
 const cylinder=(a,b,s=8)=>new THREE.CylinderGeometry(a,b,1,low?5:s,1);
 // Five optional instanced forms: silhouette, crown, support, a chapter-coloured
 // beacon and a distinct biome accent (disabled on Low quality).
 switch(kind){
 case 'city':return [
  skylineBlock(),
  cylinder(.83,1,8),new THREE.BoxGeometry(1,1,1),
  new THREE.BoxGeometry(1,1,1),
  new THREE.TorusGeometry(1,.12,low?4:6,low?12:20)];
 case 'reef':return [
  new THREE.IcosahedronGeometry(1,low?0:1),
  cylinder(.32,1,7),new THREE.IcosahedronGeometry(1,low?0:1),
  new THREE.IcosahedronGeometry(1,0),
  cylinder(.12,.32,6)];
 case 'forge':return [
  weatheredRock(low?0:1),
  cylinder(.12,1,7),cylinder(.65,.83,8),
  new THREE.OctahedronGeometry(1,0),
  cylinder(.38,.44,7)];
 case 'storm':return [
  mountainGeometry(),new THREE.IcosahedronGeometry(1,0),
  new THREE.IcosahedronGeometry(1,0),new THREE.OctahedronGeometry(1,0),
  new THREE.IcosahedronGeometry(1,0)];
 case 'forest':return [
  cylinder(.34,.72,7),
  canopyGeometry(low?0:1),
  cylinder(.45,.6,6),new THREE.IcosahedronGeometry(1,0),
  cylinder(.24,.40,6)];
 default:return [
  new THREE.IcosahedronGeometry(1,0),
  new THREE.OctahedronGeometry(1,0),new THREE.TetrahedronGeometry(1,0),
  new THREE.OctahedronGeometry(1,0),
  new THREE.TetrahedronGeometry(1,0)];
 }
}
function recipes(profile,anchor,width,height,seed,chapter){
 const kind=profile.kind,rot=hash(seed,67)*TAU;
 // scale and position are defined explicitly for each structure so the
 // silhouettes cannot collapse into the same pole-and-cap construction.
 const a=(x,y,z,sx,sy,sz,rz=0)=>({position:new THREE.Vector3(anchor.x+x,anchor.y+y,anchor.z+z),scale:new THREE.Vector3(sx,sy,sz),ry:rot,rz});
 const color=(i,j)=>Math.min(1.4,Math.max(.6,.78+hash(seed+i,j)*.40));
 let parts;
 if(kind==='city'){
  parts=[
   a(0,height*.47,0,width*.9,height*.94,width*.85),
   a(0,height*.98,0,width*1.26,height*.1,width*1.26),
   a(width*.25,height*.53,0,width*.12,height*.75,width*.14),
   a(0,height*1.12,0,width*.24,height*.18,width*.24)];
 }else if(kind==='reef'){
  parts=[
   a(0,height*.21,0,width*1.15,height*.45,width*1.2),
   a(0,height*.56,0,width*.67,height*.66,width*.65),
   a(width*.45,height*.78,0,width*.88,height*.45,width*.78),
   a(-width*.62,height*.57,width*.25,width*.23,height*.13,width*.23)];
 }else if(kind==='forge'){
  parts=[
   a(0,height*.17,0,width*1.2,height*.36,width*1.13),
   a(0,height*.62,0,width*.62,height*.96,width*.62),
   a(0,height*.87,0,width*.77,height*.15,width*.77),
   a(0,height*1.00,0,width*.36,height*.16,width*.36)];
 }else if(kind==='storm'){
  // Irregular Alpine rock mass; its lowest ring follows terrain height.
  parts=[
   a(0,0,0,width,height,width),
   a(-width*.09,height*.83,0,width*.28,height*.23,width*.28),
   a(width*.64,height*.18,-width*.1,width*.52,height*.32,width*.60,-.16),
   a(width*.15,height*.56,width*.48,width*.16,height*.14,width*.17)];
 }else if(kind==='forest'){
  parts=[
   a(0,height*.39,0,width*.55,height*.8,width*.55),
   a(0,height*.83,0,width*1.90,height*.57,width*1.65),
   a(width*.54,height*.67,0,width*.39,height*.55,width*.39,-.32),
   a(-width*.78,height*.93,width*.30,width*.24,height*.18,width*.24)];
 }else{
  parts=[
   a(0,height*.18,0,width*1.2,height*.36,width*1.2),
   a(0,height*.66,0,width*.87,height*.91,width*.86),
   a(width*.76,height*.58,width*.3,width*.42,height*.50,width*.44,.35),
   a(-width*.45,height*.97,0,width*.26,height*.25,width*.26)];
 }
 // Unique fifth silhouette attached to each structure; it is not a second
 // free-floating skyline layer and uses the same verified clearance.
 if(kind==='city')parts.push(a(0,height*(chapter===2?.62:.90),width*.12,width*(chapter===2?1.45:.82),width*(chapter===2?1.45:.85),width*.55,Math.PI/2));
 else if(kind==='reef')parts.push(a(-width*.53,height*.66,width*.25,width*.20,height*.62,width*.20,chapter===2?.55:.37));
 else if(kind==='forge')parts.push(a(width*.25,height*.90,0,width*.22,height*.45,width*.22,.16));
 else if(kind==='storm')parts.push(a(-width*.54,height*.14,width*.36,width*.40,height*.26,width*.42,-.28));
 else if(kind==='forest')parts.push(a(-width*.72,height*.65,width*.15,width*.22,height*.78,width*.22,-.68));
 else parts.push(a(width*.92,height*(chapter===2?.92:.74),width*.16,width*.33,height*.52,width*.35,.36));
 return {parts,variations:[color(0,1),color(1,2),color(2,3),color(3,4),color(4,5)]};
}
function makeMatrix(dummy,part,out=new THREE.Matrix4()){
 dummy.position.copy(part.position);
 dummy.rotation.set(part.rz||0,part.ry||0,0);
 dummy.scale.copy(part.scale);
 dummy.updateMatrix();
 return out.copy(dummy.matrix);
}
export function attachFarScenery(scene,world,track,course,quality='auto'){
 const profile=PROFILES[course];if(!profile)throw Error('Unknown scenery course '+course);
 const low=quality==='low',high=quality==='high',stride=course===4?(low?280:245):low?265:high?165:205,perChunk=course===4?(low?2:3):low?4:high?11:8;
 const root=new THREE.Group();root.name='V130 / WORLD-SPECIFIC FARSCAPE';scene.add(root);
 const geometries=shapes(profile.kind,quality);
 const materials=[
  new THREE.MeshLambertMaterial({color:profile.primary,flatShading:true}),
  new THREE.MeshLambertMaterial({color:profile.secondary,flatShading:true}),
  new THREE.MeshLambertMaterial({color:profile.shade,flatShading:true}),
  new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false,depthWrite:true}),
  new THREE.MeshLambertMaterial({color:profile.accent,flatShading:true})
 ];
 if(course===5){materials[1].flatShading=false;materials[1].vertexColors=true;finishSurface(materials[1],'canopy',course);}
 for(const i of [0,1,2,4])if(!(course===5&&i===1))finishSurface(materials[i],course===1?'city':course===5?'organic':'landscape',course);
 const candidates=trackIndex(track),dummy=new THREE.Object3D(),chunks=[];
 const horizontal=new THREE.Vector3(),normal=new THREE.Vector3(),point=new THREE.Vector3(),centre=new THREE.Vector3();
 const tint=new THREE.Color();const chapterCounts=[0,0,0,0];let total=0,skipped=0,minClearance=Infinity,dynamicCount=0,nearCount=0;
 for(let start=0;start<track.length;start+=stride){
  const end=Math.min(track.length,start+stride);
  const group=new THREE.Group();group.name='V130 / FARSCAPE SECTION '+Math.round(start);
  group.visible=false;root.add(group);
  const meshes=geometries.map((geometry,i)=>new THREE.InstancedMesh(geometry,materials[i],perChunk));
  for(const mesh of meshes){mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;group.add(mesh);}
  const motions=[];
  let count=0;
  for(let j=0;j<perChunk;j++){
   const seed=start*1.97+j*19.23+course*403;
   const chapter=Math.min(3,Math.floor((start+(end-start)*hash(seed,1))/track.length*4));
   const s=clamp(start+(end-start)*(.12+.76*hash(seed,1)),2,track.length-2),f=track.frame(s);
   const angle=TAU*((j+.34*hash(seed,2))/perChunk);
   horizontal.copy(f.r).multiplyScalar(Math.cos(angle)).addScaledVector(f.u,Math.sin(angle));
   // Terrain lives in a world-upright frame even when the track does a loop.
   horizontal.y=0;if(horizontal.lengthSq()<.06)horizontal.set(Math.cos(angle),0,Math.sin(angle));horizontal.normalize();
   // A close foreground band, a middle skyline, and occasional distant
   // silhouettes. Rejected close placements move outward instead of being
   // silently dropped; nearby crossing tracks remain absolutely protected.
   const baseDistance=course===4?(130+80*hash(seed,3)):(j%4===0?82:j%3===0?215:115)+67*hash(seed,3);
   const width=profile.spread*(course===4?.8+.45*hash(seed,4):.57+.55*hash(seed,4)),hero=(Math.floor(start/stride)%9===5&&j===1);
   const chapterHeight=[1,.83,1.22,.94][chapter];
   const height=profile.height*chapterHeight*(.53+.75*hash(seed,5))*(hero?1.36:1);
   const boundsRadius=course===4?Math.hypot(width*1.45,height*.58):Math.hypot(width*2.5,height*.65);
   let margin=-Infinity,distance=baseDistance,candidate=null;
   for(let attempt=0;attempt<3;attempt++){
    distance=baseDistance+attempt*82;
    point.copy(f.p).addScaledVector(horizontal,distance);
    let floor=f.p.y-(course===6?30:course===1?65:course===4?105:80)+35*(hash(seed,6)-.5);
    if(course>=4&&course!==6&&typeof world.ground==='function'){
     const grounded=world.ground(point.x,point.z);
     if(course===4&&Number.isFinite(grounded))floor=grounded-5;
     else if(Number.isFinite(grounded)&&Math.abs(grounded-f.p.y)<330)floor=grounded-2;
    }
    if(course===6)floor=f.p.y-height*.32+65*(hash(seed,7)-.5);
    point.y=floor;
    centre.copy(point).addScaledVector(UP,height*.6);
    margin=candidates(centre,boundsRadius);
    if(margin>=24){candidate=recipes(profile,point,width,height,seed,chapter);break}
   }
   if(!candidate){skipped++;continue}
   if(distance<190)nearCount++;
   minClearance=Math.min(minClearance,margin);
   chapterCounts[chapter]++;
   for(let k=0;k<5;k++){
    const mesh=meshes[k],part=candidate.parts[k];
    mesh.setMatrixAt(count,makeMatrix(dummy,part));
    if(k===3)tint.setHex(CHAPTER_LIGHT[course][chapter]).multiplyScalar(.72+.22*hash(seed,38));
    else tint.setRGB(candidate.variations[k],candidate.variations[k],candidate.variations[k]);
    mesh.setColorAt(count,tint);
   }
   if(!low&&(course===6||course===2)&&j%2===0){
    const target=course===6?1:3;
    motions.push({index:count,target,part:candidate.parts[target],phase:seed*.34});
    dynamicCount++;
   }
   count++;
  }
  for(const mesh of meshes){
   mesh.count=(meshes.indexOf(mesh)===4&&low)?0:count;
   mesh.instanceMatrix.needsUpdate=true;
   if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  }
  chunks.push({start,end,group,meshes,motions,count});
  total+=count;
 }
 world.farScenery={root,chunks,course,name:profile.name,total,minClearance,skipped,dynamicCount,nearCount,chapterCounts,low,quality,activeLow:low,
   materials,geometries,checkClearance:candidates,stride,first:-1,last:-1,motionStep:-1,dummy:new THREE.Object3D(),transform:new THREE.Matrix4(),
   length:track.length,lastAtmos:-Infinity,chapterBlend:{from:0,to:0,t:0},
   baseColors:materials.map(m=>m.color.clone()),chapterHaze:CHAPTER_HAZE[course].map(hex=>new THREE.Color(hex)),
   blendedHaze:new THREE.Color(),baseSky:world.kind==='expansion'&&world.skyMat?.uniforms.base?world.skyMat.uniforms.base.value.clone():null};
 if(typeof window!=='undefined'&&typeof location!=='undefined'&&location.search.includes('sceneryqa=1'))
  window.__shiftlineSceneryQA={course,name:profile.name,landmarks:total,nearCount,skipped,chunks:chunks.length,minClearance,chapterCounts,
   dynamicCount,stormMountainCount:course===4?total:0,stormPoleCount:0,low,collisionObjects:0,glassSurfaces:0,shadows:0,version:136};
 return world;
}
export function setFarSceneryQuality(world,quality){
 const d=world?.farScenery;if(!d)return;
 const low=quality==='low';if(d.activeLow===low)return;
 d.activeLow=d.low=low;
 const limit=d.quality==='low'?(d.course===4?2:4):low?(d.course===4?2:4):Infinity;
 for(const chunk of d.chunks)for(let k=0;k<chunk.meshes.length;k++)chunk.meshes[k].count=(k===4&&low)?0:Math.min(chunk.count,limit);
 d.motionStep=-1;
}
export function updateFarScenery(world,along,time=0){
 const d=world?.farScenery;if(!d)return;
 if(Math.abs(along-d.lastAtmos)>=10){
  d.lastAtmos=along;
  const blend=atmosphereChapters(along/d.length);d.chapterBlend=blend;
  d.blendedHaze.copy(d.chapterHaze[blend.from]).lerp(d.chapterHaze[blend.to],blend.t);
  for(const i of [0,1,2,4])d.materials[i].color.copy(d.baseColors[i]).lerp(d.blendedHaze,i===1?.095:i===2?.10:i===4?.10:.155);
  if(d.baseSky&&world.skyMat?.uniforms.base)world.skyMat.uniforms.base.value.copy(d.baseSky).lerp(d.blendedHaze,.095);
  if(typeof window!=='undefined'&&window.__shiftlineSceneryQA?.course===d.course)
   window.__shiftlineSceneryQA.chapterBlend={...blend};
 }
 const first=Math.max(0,Math.floor((along-240)/d.stride)),last=Math.min(d.chunks.length,Math.ceil((along+(world.renderAhead||700)+250)/d.stride));
 if(first!==d.first||last!==d.last){
  for(let i=0;i<d.chunks.length;i++)d.chunks[i].group.visible=i>=first&&i<last;
  d.first=first;d.last=last;
 }
 // 8 Hz distant mechanics: subtle rotor, coral and floating crystal motion.
 // Only currently visible instances are re-uploaded; no mesh allocation.
 if(d.low||!(d.course===2||d.course===6))return;
 const step=Math.floor(time*8);
 if(step===d.motionStep)return;d.motionStep=step;
 const dummy=d.dummy;
 for(let k=first;k<last;k++){
  const chunk=d.chunks[k];if(!chunk?.motions.length)continue;
  const changed=new Set();
  for(const m of chunk.motions){
   const p=m.part,t=time+m.phase;
   dummy.position.copy(p.position);
   if(d.course===6)dummy.position.y+=Math.sin(t*.42)*3;
   if(d.course===2)dummy.position.y+=Math.sin(t*.26)*.5;
   dummy.rotation.set(p.rz||0,(p.ry||0)+(d.course===4?time*.42:d.course===6?time*.11:Math.sin(t*.35)*.13),0);
   dummy.scale.copy(p.scale);dummy.updateMatrix();
   chunk.meshes[m.target].setMatrixAt(m.index,dummy.matrix);changed.add(m.target);
  }
  for(const type of changed)chunk.meshes[type].instanceMatrix.needsUpdate=true;
 }
}
export function disposeFarScenery(world){
 const d=world?.farScenery;if(!d)return;
 d.root.parent?.remove(d.root);
 if(d.baseSky&&world.skyMat?.uniforms.base)world.skyMat.uniforms.base.value.copy(d.baseSky);
 d.geometries.forEach(g=>g.dispose());d.materials.forEach(m=>m.dispose());
 world.farScenery=null;
}
