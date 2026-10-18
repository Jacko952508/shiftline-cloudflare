import{EXPANSIONS,expansionShift}from'./expansion-courses.js?v=67';
import{polygonSector,specifications as sharedSpecifications,obstacleState as sharedObstacleState,solidDistance as sharedSolidDistance,localDistance as sharedLocalDistance}from'./course-colliders.js?v=67';
export function specifications(course,length){return sharedSpecifications(course,length)}
export function obstacleState(o,time){return sharedObstacleState(o,time)}
export function solidDistance(p,x,y,z){return sharedSolidDistance(p,x,y,z)}
export function localDistance(o,state,x,y,z){return sharedLocalDistance(o,state,x,y,z)}
import{cinderSpecifications,cinderState,CINDER_ACTS,cinderShift}from'./cinder-colliders.js?v=67';
const RACING_LINES=[];for(let r=0;r<=5.8;r+=.65)for(let k=0;k<24;k++){const a=k*Math.PI*2/24;RACING_LINES.push({x:Math.cos(a)*r,y:Math.sin(a)*r})}
import{makeObstacleMaterial,releaseObstacleSurface,detailObstacleSolid,makeInstancedRingClamps}from'./obstacle-surfaces.js?v=153';
import{installObstacleBodywork}from'./obstacle-bodywork-v126.js?v=153';
import{seaSpecifications,seaState,seaDetail,seaObstacleColor}from'./sea-obstacles.js?v=67';
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
export function buildObstacles(scene,track,course,select=null){const generated=specifications(course,track.length),specs=select?generated.filter(select):generated;const quality=typeof document!=='undefined'?document.getElementById('quality')?.value||'auto':'auto';let bodyworkCount=0,metalParts=0,glowParts=0;for(const o of specs){o.material=makeObstacleMaterial(o);o.edge=new THREE.LineBasicMaterial({color:(o.course===2?0x65e2c3:(o.course===3?CINDER_ACTS[o.theme-1].color:PALETTES[o.theme].base)),transparent:true,opacity:.8,toneMapped:false});o.trim=[o.edge];o.frame=track.frame(o.s);o.rig=new THREE.Group();o.motion=new THREE.Group();o.rig.add(o.motion);poseObject(o.rig,o.frame);for(const p of o.solids){const g=shapeGeometry(p),m=new THREE.Mesh(g,o.material);m.position.set(p.x||0,p.y||0,0);m.rotation.z=p.a||0;m.castShadow=m.receiveShadow=true;m.userData.collider=true;o.motion.add(m);detailObstacleSolid(o,m,p);if(p.type==='torus'&&p.R<=2.5)smallRingGlow(o,m,p);if(o.course===2){seaDetail(o,m,p);continue}if(o.course===3&&p.type==='box'){for(const side of[-1,1]){const cap=new THREE.Mesh(new THREE.BoxGeometry(.1,p.hy*1.5,.08),new THREE.MeshStandardMaterial({color:0xbca48e,metalness:.6,roughness:.55}));cap.position.set(side*(p.hx-.12),0,p.hz+.05);m.add(cap)}}if(p.type==='torus'){const light=new THREE.Mesh(new THREE.TorusGeometry(p.R,p.tube*(p.R<=2.5?.44:.24),8,96),new THREE.MeshBasicMaterial({color:new THREE.Color((o.course===2?0x65e2c3:(o.course===3?CINDER_ACTS[o.theme-1].color:PALETTES[o.theme].base))).multiplyScalar(3),toneMapped:false}));light.position.copy(m.position);light.position.z=p.tube*.92;light.material.userData.smallRing=p.R<=2.5;o.trim.push(light.material);o.motion.add(light);o.motion.add(makeInstancedRingClamps(o,p));}if(p.type!=='torus'&&p.type!=='sphere'){const e=new THREE.LineSegments(new THREE.EdgesGeometry(g,35),o.edge);e.position.copy(m.position);e.rotation.copy(m.rotation);o.motion.add(e)}}const rim=new THREE.Mesh(new THREE.TorusGeometry(7.18,.035,6,64),new THREE.MeshBasicMaterial({color:0x516c83}));if(o.course!==2)o.rig.add(rim);else{rim.geometry.dispose();rim.material.dispose()}const kit=installObstacleBodywork(o,quality);bodyworkCount+=kit.meshes.length;metalParts+=kit.metal;glowParts+=kit.lit;finishObstacleGeometry(o);scene.add(o.rig)}if(typeof window!=='undefined'&&typeof location!=='undefined'&&(/obstacleqa=1|shipqa=1/.test(location.search))){window.__shiftlineObstacleQA={course,obstacles:specs.length,detailMeshes:bodyworkCount,metalParts,glowParts,quality,collisionTypes:specs.reduce((n,o)=>n+o.solids.length,0),decorOnly:true,clipped:specs.every(o=>o.bodywork?.clipped),version:127};}return specs;}
function obstacleColor(o,time,color){if(o.course>=4)return color.setHex(EXPANSIONS[o.course].colors[o.theme-1]).lerp(new THREE.Color(EXPANSIONS[o.course].shift),expansionShift(time)*.6);if(o.course===3)return color.setHex(CINDER_ACTS[o.theme-1].color).lerp(new THREE.Color(0xff8056),cinderShift(time)*.65);if(o.course===2)return seaObstacleColor(o,time,color);return themeColor(o.theme,time,color)}
export function updateObstacles(specs,along,time){for(const o of specs){o.rig.visible=o.s>along-55&&o.s<along+520;if(!o.rig.visible)continue;const tint=obstacleColor(o,time,o.cachedTint??=new THREE.Color());for(const m of o.trim)m.color.copy(tint).multiplyScalar(m.userData.smallRing?3.4:3);o.material.emissive.copy(tint);if(o.bodywork?.indicatorMaterial){const hz=[0,1.4,.95,1.1,1.85,.72,1.34][o.course]||1.2;const pulse=.86+.14*Math.sin(time*hz+o.seed*.73);o.bodywork.indicatorMaterial.color.copy(tint).multiplyScalar(2.4*pulse);}for(const h of o.ringHalos||[])h.material.opacity=.16+.08*Math.max(0,Math.min(1,(520-(o.s-along))/400));const st=obstacleState(o,time);o.motion.position.set(st.x,st.y,0);o.motion.rotation.set(0,0,st.a);o.motion.scale.setScalar(st.scale)}}
export function disposeObstacles(scene,specs){for(const o of specs){scene.remove(o.rig);o.surfaceTexture?.dispose();ringHaloUsers-=o.ringHalos?.length||0;releaseObstacleSurface(o);o.rig.traverse(m=>{m.geometry?.dispose();m.material?.dispose();m.customDepthMaterial?.dispose();m.customDistanceMaterial?.dispose()})}if(!ringHaloUsers&&ringHaloTexture){ringHaloTexture.dispose();ringHaloTexture=null;}}
