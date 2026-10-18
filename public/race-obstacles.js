import {hazardGeometry} from './hazard-construction-v156.js?v=159';
import {upcomingHazard,cueEnvelope,idleHazardGlow} from './obstacle-lighting-v160.js?v=160';
import {updateObstacleBodywork} from './obstacle-bodywork-v126.js?v=156';
import {markHazardGeometry} from './obstacle-glow-v155.js?v=161';
import{EXPANSIONS,expansionShift}from'./expansion-courses.js?v=67';
import{polygonSector,specifications as sharedSpecifications,obstacleState as sharedObstacleState,solidDistance as sharedSolidDistance,localDistance as sharedLocalDistance}from'./course-colliders.js?v=159';
export function specifications(course,length){return sharedSpecifications(course,length)}
export function obstacleState(o,time){return sharedObstacleState(o,time)}
export function solidDistance(p,x,y,z){return sharedSolidDistance(p,x,y,z)}
export function localDistance(o,state,x,y,z){return sharedLocalDistance(o,state,x,y,z)}
import{cinderSpecifications,cinderState,CINDER_ACTS,cinderShift}from'./cinder-colliders.js?v=67';
const RACING_LINES=[];for(let r=0;r<=5.8;r+=.65)for(let k=0;k<24;k++){const a=k*Math.PI*2/24;RACING_LINES.push({x:Math.cos(a)*r,y:Math.sin(a)*r})}
import{makeObstacleMaterial,releaseObstacleSurface,detailObstacleSolid,makeInstancedRingClamps}from'./obstacle-surfaces.js?v=161';
import{installObstacleBodywork}from'./obstacle-bodywork-v126.js?v=156';
import{seaSpecifications,seaState,seaDetail,seaObstacleColor}from'./sea-obstacles.js?v=159';
import{SHIP_SCALE}from'./ship-catalog.js?v=107';
import * as THREE from 'three';import{poseObject}from'./race-track.js?v=58';import{section,PALETTES,shiftState,themeColor}from'./race-theme.js';
const TAU=Math.PI*2;
// Keep obstacle hitboxes proportionate to the actual ship, using the original .9-scale envelope as the baseline.
const collisionScale=SHIP_SCALE/.9;
export const BODY=[{x:0,y:0,z:-1.12,r:.3},{x:0,y:0,z:0,r:.47},{x:-.76,y:0,z:.35,r:.2},{x:.76,y:0,z:.35,r:.2},{x:0,y:0,z:1.0,r:.3}].map(b=>({x:b.x*collisionScale,y:b.y*collisionScale,z:b.z*collisionScale,r:b.r*collisionScale}));
let ringHaloTexture=null,ringHaloUsers=0;
function smallRingGlow(o,mesh,p){
 if(!ringHaloTexture){const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d'),g=c.createRadialGradient(128,128,0,128,128,128);for(const [at,alpha]of [[0,0],[.72,0],[.8,.06],[.88,.36],[.94,.12],[1,0]])g.addColorStop(at,'rgba(255,255,255,'+alpha+')');c.fillStyle=g;c.fillRect(0,0,256,256);ringHaloTexture=new THREE.CanvasTexture(canvas);ringHaloTexture.colorSpace=THREE.SRGBColorSpace;}
 const extent=p.R+p.tube+.23,material=new THREE.MeshBasicMaterial({map:ringHaloTexture,color:0x9defff,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});material.userData.smallRing=true;
 const halo=new THREE.Mesh(new THREE.PlaneGeometry(extent*2,extent*2),material);halo.name='small-ring-halo';halo.position.z=p.tube*1.16;mesh.add(halo);ringHaloUsers++;(o.ringHalos??=[]).push(halo);o.trim.push(material);
}

export function clearance(o,state,x,y){return Math.min(localDistance(o,state,x+BODY[1].x,y+BODY[1].y,0)-BODY[1].r,localDistance(o,state,x+BODY[2].x,y+BODY[2].y,0)-BODY[2].r,localDistance(o,state,x+BODY[3].x,y+BODY[3].y,0)-BODY[3].r);}
export function collisionAt(track,specs,s,x,y,time,bank=0,onClearance=null){let first=0,last=specs.length;while(first<last){const mid=(first+last)>>>1;if(specs[mid].s<s-10)first=mid+1;else last=mid}if(first===specs.length||specs[first].s>s+10)return null;const F=track.frame(s),cx=F.p.x+F.r.x*x+F.u.x*y,cy=F.p.y+F.r.y*x+F.u.y*y,cz=F.p.z+F.r.z*x+F.u.z*y,c=Math.cos(bank),si=Math.sin(bank);for(let i=first;i<specs.length;i++){const o=specs[i];if(o.s>s+10)break;const O=o.frame||track.frame(o.s),state=obstacleState(o,time);let gap=Infinity;for(const b of BODY){const bx=b.x*c-b.y*si,by=b.x*si+b.y*c,px=cx+F.r.x*bx+F.u.x*by-F.f.x*b.z-O.p.x,py=cy+F.r.y*bx+F.u.y*by-F.f.y*b.z-O.p.y,pz=cz+F.r.z*bx+F.u.z*by-F.f.z*b.z-O.p.z;const d=localDistance(o,state,px*O.r.x+py*O.r.y+pz*O.r.z,px*O.u.x+py*O.u.y+pz*O.u.z,-(px*O.f.x+py*O.f.y+pz*O.f.z))-b.r;if(d<0)return o;gap=Math.min(gap,d);}if(onClearance&&gap<=.55)onClearance(o,gap);}return null;}
export function safeTarget(o,time,x=0,y=0){const state=obstacleState(o,time);let best=null,score=Infinity;for(let r=0;r<6.25;r+=.65)for(let k=0;k<24;k++){const a=k*TAU/24,nx=Math.cos(a)*r,ny=Math.sin(a)*r,d=clearance(o,state,nx,ny);if(d<.3)continue;const cost=Math.hypot(nx-x,ny-y)+r*.015;if(cost<score){score=cost;best={x:nx,y:ny,clearance:d}}}return best;}
// Predict the complete crossing window, then choose a line with margin for wings and motion.
export function planTarget(o,at,x=0,y=0,traffic=[],preference=0){
 const states=[-.13,0,.13].map(t=>obstacleState(o,at+t));let best=null,score=Infinity;
 // All score penalties are nonnegative. Reject candidates whose cheap lower
 // bound already loses, before evaluating nine signed-distance envelopes.
 // Candidate order and the exact crossing/safety tests remain unchanged.
 const candidates=[{x,y},...RACING_LINES];
 for(const p of candidates){
  const travel=Math.hypot(p.x-x,p.y-y)*.45;
  const crowd=traffic.reduce((n,r)=>n+Math.max(0,2.1-Math.hypot(r.x-p.x,r.y-p.y)),0);
  const preferred=Math.abs(p.x-preference)*.035;
  if(travel+crowd*.55+preferred>score+1.e-10)continue;
  let d=clearance(o,states[1],p.x,p.y);if(d<.55)continue;
  d=Math.min(d,clearance(o,states[0],p.x,p.y),clearance(o,states[2],p.x,p.y));if(d<.5)continue;
  const cost=travel+Math.max(0,1.4-d)*1.4+crowd*.55+preferred;
  if(cost<score){score=cost;best={...p,clearance:d};}
 }
 return best||safeTarget(o,at,x,y);
}

function shapeGeometry(p){if(p.type==='torus')return new THREE.TorusGeometry(p.R,p.tube,20,96);if(p.type==='box')return new THREE.BoxGeometry(p.hx*2,p.hy*2,p.hz*2);if(p.type==='sphere')return new THREE.SphereGeometry(p.r,32,20);const sh=new THREE.Shape();p.points.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));sh.closePath();const g=new THREE.ExtrudeGeometry(sh,{depth:p.hz*2,bevelEnabled:false,steps:1});g.translate(0,0,-p.hz);return g;}
function trimToTunnel(material,frame){if(material.userData.tunnelTrim)return;material.userData.tunnelTrim=true;const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
 material.onBeforeCompile=shader=>{previous?.call(material,shader);shader.uniforms.obstacleCentre={value:frame.p};shader.uniforms.obstacleRight={value:frame.r};shader.uniforms.obstacleUp={value:frame.u};
 shader.vertexShader='uniform vec3 obstacleCentre;uniform vec3 obstacleRight;uniform vec3 obstacleUp;varying vec2 obstacleRadial;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
vec4 obstacleLocalPoint=vec4(transformed,1.0);
#ifdef USE_INSTANCING
obstacleLocalPoint=instanceMatrix*obstacleLocalPoint;
#endif
vec3 obstacleWorld=(modelMatrix*obstacleLocalPoint).xyz-obstacleCentre;
obstacleRadial=vec2(dot(obstacleWorld,obstacleRight),dot(obstacleWorld,obstacleUp));`);
 shader.fragmentShader='varying vec2 obstacleRadial;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(dot(obstacleRadial,obstacleRadial)>53.29)discard;');};
 material.customProgramCacheKey=()=> previousKey+'/obstacle-tunnel-trim-v127-instanced';
}
function finishObstacleGeometry(o){o.rig.traverse(m=>{if(m.material)for(const material of Array.isArray(m.material)?m.material:[m.material])trimToTunnel(material,o.frame);if(m.isMesh&&m.castShadow){m.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});m.customDistanceMaterial=new THREE.MeshDistanceMaterial();trimToTunnel(m.customDepthMaterial,o.frame);trimToTunnel(m.customDistanceMaterial,o.frame);}});if(o.bodywork)o.bodywork.clipped=o.bodywork.meshes.every(m=>m.material.userData.tunnelTrim===true);}
// One reusable approach signal per track: no crowd of permanently glowing rings.
function createWarningRing(){
 const group=new THREE.Group();
 group.name='NEXT HAZARD / SEQUENTIAL SIGNAL';
 const base=new THREE.Mesh(new THREE.TorusGeometry(7.02,.052,6,80),new THREE.MeshBasicMaterial({color:0x80e9ff,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
 const arcGeometry=new THREE.TorusGeometry(7.04,.09,5,24,Math.PI*.46);
 const a=new THREE.Mesh(arcGeometry,new THREE.MeshBasicMaterial({color:0xb4faff,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
 const b=new THREE.Mesh(arcGeometry,a.material.clone());
 for(const mesh of [base,a,b]){mesh.castShadow=false;mesh.receiveShadow=false;mesh.userData.obstacleDecoration=true;}
 group.add(base,a,b);group.visible=false;group.position.z=.12;
 const alarmMaterial=new THREE.MeshBasicMaterial({color:0xff4d21,transparent:true,opacity:0,depthWrite:false,toneMapped:false});
 const alarmA=new THREE.Mesh(new THREE.TorusGeometry(6.87,.12,6,20,Math.PI*.28),alarmMaterial);
 const alarmB=new THREE.Mesh(alarmA.geometry,alarmMaterial.clone());
 for(const m of [alarmA,alarmB]){m.castShadow=false;m.receiveShadow=false;m.userData.obstacleDecoration=true;group.add(m)}
 return {group,base,a,b,alarmA,alarmB,owner:null};
}
export function buildObstacles(scene,track,course,select=null){
 const generated=specifications(course,track.length),specs=select?generated.filter(select):generated;
 const quality=typeof document!=='undefined'?document.getElementById('quality')?.value||'auto':'auto';let bodyworkCount=0,metalParts=0,glowParts=0;
 for(const o of specs){
  o.material=makeObstacleMaterial(o);o.edge=new THREE.LineBasicMaterial({color:0x9cdbeb,transparent:true,opacity:.72,toneMapped:false});o.trim=[o.edge];o.frame=track.frame(o.s);o.rig=new THREE.Group();o.motion=new THREE.Group();o.pieces=[];o.rig.add(o.motion);poseObject(o.rig,o.frame);
  for(const p of o.solids){
   const g=markHazardGeometry(hazardGeometry(p,course,quality),p),node=new THREE.Group(),m=new THREE.Mesh(g,o.material);
   node.position.set(p.x||0,p.y||0,p.z||0);node.rotation.z=p.a||0;node.add(m);o.motion.add(node);o.pieces.push(node);m.castShadow=m.receiveShadow=true;m.userData.collider=true;detailObstacleSolid(o,m,p);
   if(p.type==='torus'&&p.R<=2.5)smallRingGlow(o,m,p);
   // Organic reef structures retain their bioluminescent edge construction.
   if(o.course===2&&/reef/.test(o.family))seaDetail(o,m,p);
  }
  const kit=installObstacleBodywork(o,quality);bodyworkCount+=kit.meshes.length;metalParts+=kit.metal;glowParts+=kit.lit;finishObstacleGeometry(o);scene.add(o.rig);
 }
 if(specs.length)specs.warningRing=createWarningRing();
 if(typeof window!=='undefined'&&typeof location!=='undefined'&&(/obstacleqa=1|shipqa=1/.test(location.search)))window.__shiftlineObstacleQA={course,obstacles:specs.length,detailMeshes:bodyworkCount,metalParts,glowParts,quality,collisionTypes:specs.reduce((n,o)=>n+o.solids.length,0),decorOnly:true,clipped:specs.every(o=>o.bodywork?.clipped),families:[...new Set(specs.map(o=>o.family))],version:157};
 return specs;
}
const HAZARD_COLORS=[0,0xffb86b,0xff8fce,0x73efff,0xffd078,0x73ffe7,0xffbc7e],CUE_WHITE=new THREE.Color(0xffffff);
function obstacleColor(o,time,color){if(o.family)return color.setHex(HAZARD_COLORS[o.course]);if(o.course>=4)return color.setHex(EXPANSIONS[o.course].colors[o.theme-1]).lerp(new THREE.Color(EXPANSIONS[o.course].shift),expansionShift(time)*.6);if(o.course===3)return color.setHex(CINDER_ACTS[o.theme-1].color).lerp(new THREE.Color(0xff8056),cinderShift(time)*.65);if(o.course===2)return seaObstacleColor(o,time,color);return themeColor(o.theme,time,color)}
export function updateObstacles(specs,along,time){
 const next=upcomingHazard(specs,along),distance=next?next.s-along:Infinity;
 const active=next?cueEnvelope(distance,time,next.seed):null;
 const warning=specs.warningRing;
 if(warning){
  if(next&&active.energy>.005&&distance<390){
   if(warning.owner!==next){next.rig.add(warning.group);warning.owner=next;}
   warning.group.visible=true;
   const tint=obstacleColor(next,time,next.cachedTint??=new THREE.Color());
   warning.base.material.color.copy(tint);
   warning.a.material.color.copy(tint).lerp(CUE_WHITE,.38);
   warning.b.material.color.copy(tint).lerp(CUE_WHITE,.18);
   warning.base.material.opacity=active.ring;
   warning.a.material.opacity=active.sweep;
   warning.b.material.opacity=active.sweep*.57;
   const alarm=.18+.82*Math.pow(.5+.5*Math.sin(time*11.3),2);
   warning.alarmA.material.opacity=active.energy*.95*alarm;
   warning.alarmB.material.opacity=active.energy*.88*(1.18-alarm);
   warning.alarmA.rotation.z=time*.26+Math.PI*.2;
   warning.alarmB.rotation.z=time*.26+Math.PI*1.2;
   // Scanning arcs animate first; the solid rim powers up near the crossing.
   const rotation=time*.82+active.energy*3.8;
   warning.a.rotation.z=rotation;warning.b.rotation.z=rotation+Math.PI;
  }else warning.group.visible=false;
 }
 for(const o of specs){
  const d=o.s-along;
  o.rig.visible=d>-55&&d<520;
  if(!o.rig.visible)continue;
  const focus=o===next?active:null,energy=focus?.energy||0;
  const tint=obstacleColor(o,time,o.cachedTint??=new THREE.Color());
  for(const m of o.trim)m.color.copy(tint).multiplyScalar((m.userData.smallRing?1.05:.95)+energy*2.2);
  o.material.emissive.copy(tint);
  o.material.userData.hazardTime.value=time+o.seed;
  o.material.userData.hazardGlowStrength.value=focus?focus.glow:idleHazardGlow(d);
  o.material.userData.hazardAlert.value=energy;
  if(o.bodywork?.indicatorMaterial){
   const hz=[0,1.4,.95,1.1,1.85,.72,1.34][o.course]||1.2;
   const pulse=.93+.07*Math.sin(time*hz+o.seed*.73);
   o.bodywork.indicatorMaterial.color.copy(tint).multiplyScalar((focus?focus.indicators*.85:.33)*pulse);
  }
  for(const h of o.ringHalos||[])h.material.opacity=.035+.21*energy;
  const st=obstacleState(o,time);
  o.motion.position.set(st.x,st.y,0);o.motion.rotation.set(0,0,st.a);o.motion.scale.setScalar(st.scale);
  if(st.pieces){for(let i=0;i<o.pieces.length;i++){const j=i*6,node=o.pieces[i];node.position.set(st.pieces[j],st.pieces[j+1],st.pieces[j+2]);node.rotation.z=st.pieces[j+3];}updateObstacleBodywork(o,st);}
 }
 if(typeof window!=='undefined'&&typeof location!=='undefined'&&location.search.includes('lightqa=1'))
  window.__shiftlineLightingQA={version:160,nextId:next?.id??null,distance:Number.isFinite(distance)?distance:null,
   activeCount:warning?.group.visible?1:0,ringOpacity:warning?.group.visible?warning.base.material.opacity:0,
   sweepOpacity:warning?.group.visible?warning.a.material.opacity:0};
}
export function disposeObstacles(scene,specs){if(specs.warningRing){const w=specs.warningRing;w.group.parent?.remove(w.group);for(const m of [w.base,w.a,w.b,w.alarmA,w.alarmB])m.material.dispose();w.base.geometry.dispose();w.a.geometry.dispose();w.alarmA.geometry.dispose();specs.warningRing=null;}for(const o of specs){scene.remove(o.rig);o.surfaceTexture?.dispose();ringHaloUsers-=o.ringHalos?.length||0;releaseObstacleSurface(o);o.rig.traverse(m=>{m.geometry?.dispose();m.material?.dispose();m.customDepthMaterial?.dispose();m.customDistanceMaterial?.dispose()})}if(!ringHaloUsers&&ringHaloTexture){ringHaloTexture.dispose();ringHaloTexture=null;}}
