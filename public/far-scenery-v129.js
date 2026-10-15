import * as THREE from 'three';

// V130 / Phase 3 worldscapes: six independent distant silhouettes.
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
 4:{name:'STORM FRONT / suspended platforms, wind turbines and beacons',kind:'storm',
    primary:0x62778d,secondary:0x9bafbd,accent:0x8bbfec,shade:0x394e64,
    base:55,height:110,spread:13},
 5:{name:'ANCIENT CANOPY / giant trunks, boughs, crowns and glowing spores',kind:'forest',
    primary:0x42674e,secondary:0x578b58,accent:0x9edc8c,shade:0x2e4b39,
    base:45,height:94,spread:14},
 6:{name:'RIFT QUARRY / jagged basalt, suspended shards and violet rifts',kind:'rift',
    primary:0x5c6074,secondary:0x9692b9,accent:0xc09aff,shade:0x33364c,
    base:47,height:96,spread:12}
};
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
function shapes(kind,quality){
 const low=quality==='low';
 const cylinder=(a,b,s=8)=>new THREE.CylinderGeometry(a,b,1,low?5:s,1);
 // Four separately batched types: silhouette, distinctive crown/structure,
 // supporting hardware, and a subtle distant signal.
 switch(kind){
 case 'city':return [
  new THREE.BoxGeometry(1,1,1),
  cylinder(.83,1,8),new THREE.BoxGeometry(1,1,1),
  new THREE.BoxGeometry(1,1,1)];
 case 'reef':return [
  new THREE.IcosahedronGeometry(1,low?0:1),
  cylinder(.32,1,7),new THREE.IcosahedronGeometry(1,low?0:1),
  new THREE.IcosahedronGeometry(1,0)];
 case 'forge':return [
  new THREE.IcosahedronGeometry(1,0),
  cylinder(.12,1,7),cylinder(.65,.83,8),
  new THREE.OctahedronGeometry(1,0)];
 case 'storm':return [
  new THREE.BoxGeometry(1,1,1),
  cylinder(.14,.62,7),new THREE.TorusGeometry(1,.16,low?4:6,low?12:20),
  new THREE.BoxGeometry(1,1,1)];
 case 'forest':return [
  cylinder(.34,.72,7),
  new THREE.IcosahedronGeometry(1,low?0:1),
  cylinder(.45,.6,6),new THREE.IcosahedronGeometry(1,0)];
 default:return [
  new THREE.IcosahedronGeometry(1,0),
  new THREE.OctahedronGeometry(1,0),new THREE.TetrahedronGeometry(1,0),
  new THREE.OctahedronGeometry(1,0)];
 }
}
function recipes(profile,anchor,width,height,seed,root){
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
  parts=[
   a(0,height*.12,0,width*1.7,height*.24,width*1.7),
   a(0,height*.55,0,width*.48,height*.95,width*.48),
   a(0,height*.87,0,width*.73,width*.73,width*.73,Math.PI/2),
   a(0,height*1.05,0,width*.18,height*.33,width*.18)];
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
 return {parts,variations:[color(0,1),color(1,2),color(2,3),color(3,4)]};
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
 const low=quality==='low',high=quality==='high',stride=low?265:high?165:205,perChunk=low?4:high?11:8;
 const root=new THREE.Group();root.name='V130 / WORLD-SPECIFIC FARSCAPE';scene.add(root);
 const geometries=shapes(profile.kind,quality);
 const materials=[
  new THREE.MeshLambertMaterial({color:profile.primary,flatShading:true}),
  new THREE.MeshLambertMaterial({color:profile.secondary,flatShading:true}),
  new THREE.MeshLambertMaterial({color:profile.shade,flatShading:true}),
  new THREE.MeshBasicMaterial({color:profile.accent,toneMapped:false,depthWrite:true})
 ];
 const candidates=trackIndex(track),dummy=new THREE.Object3D(),chunks=[];
 const horizontal=new THREE.Vector3(),normal=new THREE.Vector3(),point=new THREE.Vector3(),centre=new THREE.Vector3();
 const tint=new THREE.Color();let total=0,skipped=0,minClearance=Infinity,dynamicCount=0;
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
   const s=clamp(start+(end-start)*(.12+.76*hash(seed,1)),2,track.length-2),f=track.frame(s);
   const angle=TAU*((j+.34*hash(seed,2))/perChunk);
   horizontal.copy(f.r).multiplyScalar(Math.cos(angle)).addScaledVector(f.u,Math.sin(angle));
   // Terrain lives in a world-upright frame even when the track does a loop.
   horizontal.y=0;if(horizontal.lengthSq()<.06)horizontal.set(Math.cos(angle),0,Math.sin(angle));horizontal.normalize();
   const distance=(j%3===0?210:135)+85*hash(seed,3);
   point.copy(f.p).addScaledVector(horizontal,distance);
   const width=profile.spread*(.57+.55*hash(seed,4)),hero=(Math.floor(start/stride)%9===5&&j===1);
   const height=profile.height*(.53+.75*hash(seed,5))*(hero?1.36:1);
   let floor=f.p.y-(course===6?30:course===1?65:course===4?105:80)+35*(hash(seed,6)-.5);
   if(course>=4&&course!==6&&typeof world.ground==='function'){
    const grounded=world.ground(point.x,point.z);
    if(Number.isFinite(grounded)&&Math.abs(grounded-f.p.y)<330)floor=grounded-2;
   }
   if(course===6)floor=f.p.y-height*.32+65*(hash(seed,7)-.5);
   point.y=floor;
   const candidate=recipes(profile,point,width,height,seed);
   // Conservative bounding sphere around all four visible parts. The
   // spatial test also checks *other* course branches and bridge loops.
   const boundsRadius=Math.hypot(width*2.5,height*.65);
   centre.copy(point).addScaledVector(UP,height*.6);
   const margin=candidates(centre,boundsRadius);
   if(!Number.isFinite(margin)||margin<24){skipped++;continue}
   minClearance=Math.min(minClearance,margin);
   for(let k=0;k<4;k++){
    const mesh=meshes[k],part=candidate.parts[k];
    mesh.setMatrixAt(count,makeMatrix(dummy,part));
    tint.setRGB(candidate.variations[k],candidate.variations[k],candidate.variations[k]);
    mesh.setColorAt(count,tint);
   }
   if(!low&&(course===4||course===6||course===2)&&j%2===0){
    const target=course===4?2:course===6?1:3;
    motions.push({index:count,target,part:candidate.parts[target],phase:seed*.34});
    dynamicCount++;
   }
   count++;
  }
  for(const mesh of meshes){
   mesh.count=count;
   mesh.instanceMatrix.needsUpdate=true;
   if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  }
  chunks.push({start,end,group,meshes,motions,count});
  total+=count;
 }
 world.farScenery={root,chunks,course,name:profile.name,total,minClearance,skipped,dynamicCount,low,quality,activeLow:low,
   materials,geometries,stride,first:-1,last:-1,motionStep:-1,dummy:new THREE.Object3D(),transform:new THREE.Matrix4()};
 if(typeof window!=='undefined'&&typeof location!=='undefined'&&location.search.includes('sceneryqa=1'))
  window.__shiftlineSceneryQA={course,name:profile.name,landmarks:total,skipped,chunks:chunks.length,minClearance,
   dynamicCount,low,collisionObjects:0,glassSurfaces:0,shadows:0,version:130};
 return world;
}
export function setFarSceneryQuality(world,quality){
 const d=world?.farScenery;if(!d)return;
 const low=quality==='low';if(d.activeLow===low)return;
 d.activeLow=d.low=low;
 const limit=d.quality==='low'?4:low?4:Infinity;
 for(const chunk of d.chunks)for(const mesh of chunk.meshes)mesh.count=Math.min(chunk.count,limit);
 d.motionStep=-1;
}
export function updateFarScenery(world,along,time=0){
 const d=world?.farScenery;if(!d)return;
 const first=Math.max(0,Math.floor((along-240)/d.stride)),last=Math.min(d.chunks.length,Math.ceil((along+(world.renderAhead||700)+250)/d.stride));
 if(first!==d.first||last!==d.last){
  for(let i=0;i<d.chunks.length;i++)d.chunks[i].group.visible=i>=first&&i<last;
  d.first=first;d.last=last;
 }
 // 8 Hz distant mechanics: subtle rotor, coral and floating crystal motion.
 // Only currently visible instances are re-uploaded; no mesh allocation.
 if(d.low||!(d.course===2||d.course===4||d.course===6))return;
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
 d.geometries.forEach(g=>g.dispose());d.materials.forEach(m=>m.dispose());
 world.farScenery=null;
}
