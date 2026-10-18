import * as THREE from 'three';
import {updateWorld} from './race-world.js?v=153';
import {updateObstacles} from './race-obstacles.js?v=153';

// SHIFTLINE Observatory: independently directed camera over the exact ACTIVE
// racing scene. No stand-in map, cloned geometry, materials or textures.
const clamp=THREE.MathUtils.clamp,UP_WORLD=new THREE.Vector3(0,1,0);
function at(track,s,x=0,y=0){return track.pose(clamp(s,2,track.length-2),x,y);}
function setFrameUp(vec,frame){vec.copy(frame.u);}
export function createTrackExplorer(track,scene,world,specs=[]){
 return {track,scene,world,specs,mode:'orbit',yaw:.55,pitch:.62,zoom:1,
  camera:new THREE.PerspectiveCamera(65,1,.12,20000),
  pan:new THREE.Vector3(),progress:.08,paused:false,
  hasCamera:false,pointers:new Map(),pointerDistance:0,
  desired:new THREE.Vector3(),aim:new THREE.Vector3(),up:new THREE.Vector3(),
  focus:new THREE.Vector3(),currentAim:new THREE.Vector3(),currentUp:new THREE.Vector3(0,1,0),
  time:0,viewport:{w:0,h:0},frameCount:0};
}
export function resetExplorer(e){
 if(!e)return;
 e.mode='orbit';e.yaw=.55;e.pitch=e.track?.course<=2?.62:.50;e.zoom=1;e.pan.set(0,0,0);
 e.hasCamera=false;e.paused=false;e.pointers.clear();
}
export function zoomExplorer(e,factor){if(e)e.zoom=clamp(e.zoom*factor,.4,2.8);}
export function setExplorerMode(e,mode){
 if(!e||!['orbit','overhead','chase','fly'].includes(mode))return;
 e.mode=mode;e.pan.set(0,0,0);e.zoom=1;
 e.yaw=mode==='orbit'?.55:0;
 e.pitch=mode==='orbit'?(e.track.course<=2?.62:.50):mode==='overhead'?1.35:0;
 e.hasCamera=false;e.paused=false;
}
export function seekExplorer(e,fraction){
 if(!e)return;
 const next=clamp(Number(fraction)||0,.003,.995);
 if(Math.abs(next-e.progress)>.006)e.hasCamera=false;
 e.progress=next;
}
export function advanceExplorer(e,dt){
 if(!e||e.mode!=='fly'||e.paused)return;
 const next=e.progress+clamp(dt,0,.06)*75/e.track.length;
 if(next>=.993){e.progress=.005;e.hasCamera=false;}else e.progress=next;
}
function cameraPose(e){
 const t=e.track,s=clamp(e.progress*t.length,9,t.length-22),F=t.frame(s);
 const tunnel=t.course<=2,near=t.course===3;
 const aim=e.aim,pos=e.desired,up=e.up;
 const mode=e.mode;
 if(tunnel){
  // Enclosed courses must be surveyed FROM THE INSIDE of their actual tube.
  // Looking down on their opaque exterior would hide the playable scenery.
  if(mode==='orbit'){
   const angle=e.yaw,r=clamp(4.8*e.zoom,1.9,6.1);
   pos.copy(at(t,s-19,Math.sin(angle)*r,Math.cos(angle)*r));
   aim.copy(at(t,s+29,Math.sin(e.pitch)*3.2,Math.cos(e.pitch)*1.2));
  }else if(mode==='overhead'){
   pos.copy(at(t,s-17,0,5.3*e.zoom));
   aim.copy(at(t,s+30,0,-2));
  }else{
   const back=mode==='fly'?8:24,offsetX=mode==='fly'?Math.sin(e.yaw)*.6:Math.sin(e.yaw)*3.3;
   pos.copy(at(t,s-back*e.zoom,offsetX,mode==='fly'?.55:1.8+e.pitch*2));
   aim.copy(at(t,s+(mode==='fly'?36:50),Math.sin(e.yaw)*3,.4+e.pitch*2.2));
  }
  setFrameUp(up,t.frame(Math.max(2,s-12)));
 }else if(mode==='orbit'){
  const distance=clamp((near?115:t.course===5?125:155)*e.zoom,40,490);
  const cp=clamp(e.pitch,.12,1.47);
  aim.copy(at(t,s)).add(e.pan);
  pos.copy(aim).addScaledVector(UP_WORLD,Math.sin(cp)*distance);
  pos.x+=Math.sin(e.yaw)*Math.cos(cp)*distance;
  pos.z+=Math.cos(e.yaw)*Math.cos(cp)*distance;
  // On mountain tracks avoid the ground while preserving the chosen view.
  if(typeof e.world.ground==='function')pos.y=Math.max(pos.y,e.world.ground(pos.x,pos.z)+12);
  up.copy(UP_WORLD);
 }else if(mode==='overhead'){
  aim.copy(at(t,s)).add(e.pan);
  pos.copy(aim).addScaledVector(UP_WORLD,clamp((near?150:220)*e.zoom,36,520));
  pos.x+=.05;pos.z+=.05;
  up.set(Math.sin(e.yaw),0,-Math.cos(e.yaw)).normalize();
 }else{
  const back=mode==='fly'?9:29,angle=e.yaw;
  const offsetX=mode==='fly'?Math.sin(angle)*1.2:Math.sin(angle)*5;
  pos.copy(at(t,s-back*e.zoom,offsetX,mode==='fly'?2:4+e.pitch*4));
  aim.copy(at(t,s+(mode==='fly'?43:65),Math.sin(angle)*3,e.pitch*3));
  setFrameUp(up,t.frame(Math.max(2,s-back)));
 }
 return {s,near,tunnel,mode};
}
export function renderTrackExplorer(e,renderer,rect,dt=.033,time=0){
 if(!e||!rect||rect.width<1||rect.height<1||rect.bottom<=0||rect.top>=innerHeight)return;
 const view=cameraPose(e),cam=e.camera;
 // Reuse the existing game world, including its real textures, machinery,
 // sky, fog and distance-based scene streaming. No race physics are run.
 updateWorld(e.world,view.s,time);
 updateObstacles(e.specs,view.s,time);
 // Distinct camera goals are interpolated for smooth navigation and flythrough.
 const alpha=e.hasCamera?1-Math.exp(-clamp(dt,.004,.08)*(e.mode==='fly'?7:12)):1;
 if(!e.hasCamera){
  cam.position.copy(e.desired);
  e.currentAim.copy(e.aim);
  e.currentUp.copy(e.up);
 }else{
  cam.position.lerp(e.desired,alpha);
  e.currentAim.lerp(e.aim,alpha);
  e.currentUp.lerp(e.up,alpha).normalize();
 }
 cam.up.copy(e.currentUp);cam.lookAt(e.currentAim);
 cam.fov=view.tunnel?72:view.mode==='fly'?73:view.mode==='chase'?66:60;
 cam.aspect=rect.width/Math.max(1,rect.height);
 cam.updateProjectionMatrix();e.hasCamera=true;e.frameCount++;
 const prevAuto=renderer.autoClear,prevTone=renderer.toneMapping;
 const prevColor=renderer.getClearColor(new THREE.Color()),prevAlpha=renderer.getClearAlpha();
 renderer.setRenderTarget(null);
 renderer.setViewport(rect.left,innerHeight-rect.bottom,rect.width,rect.height);
 renderer.setScissor(rect.left,innerHeight-rect.bottom,rect.width,rect.height);
 renderer.setScissorTest(true);renderer.autoClear=true;
 try{
  renderer.setClearColor(0x06111b,1);
  renderer.clear(true,true,true);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.render(e.scene,cam);
 }finally{
  renderer.setScissorTest(false);
  renderer.autoClear=prevAuto;
  renderer.toneMapping=prevTone;
  renderer.setClearColor(prevColor,prevAlpha);
  renderer.setViewport(0,0,innerWidth,innerHeight);
 }
}
export function bindExplorer(pad,getExplorer){
 pad.addEventListener('pointerdown',event=>{
  const e=getExplorer();if(!e||event.target.closest('button,input'))return;
  event.preventDefault();
  e.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  pad.setPointerCapture?.(event.pointerId);
 });
 pad.addEventListener('pointermove',event=>{
  const e=getExplorer(),p=e?.pointers.get(event.pointerId);
  if(!p)return;event.preventDefault();
  const dx=event.clientX-p.x,dy=event.clientY-p.y;
  if(e.pointers.size===1){
   if(e.mode==='chase'||e.mode==='fly'){
    e.yaw=clamp(e.yaw-dx*.0065,-1.0,1.0);
    e.pitch=clamp(e.pitch+dy*.0055,-.85,.85);
   }else{
    e.yaw-=dx*.008;
    if(e.mode==='overhead'){
     if(e.track.course<=2)e.pitch=clamp(e.pitch+dy*.005,-1,1);
    }else e.pitch=clamp(e.pitch+dy*.0055,-1.3,1.43);
   }
  }else{
   const other=[...e.pointers.entries()].find(([id])=>id!==event.pointerId)?.[1];
   if(other){
    const before=Math.hypot(p.x-other.x,p.y-other.y),after=Math.hypot(event.clientX-other.x,event.clientY-other.y);
    if(before>12&&after>12)zoomExplorer(e,before/after);
    if(e.track.course>2&&(e.mode==='orbit'||e.mode==='overhead')){
     // Pan in track-relative coordinates even on curved sections.
     const F=e.track.frame(e.progress*e.track.length),factor=Math.max(.04,e.zoom)*.21;
     e.pan.addScaledVector(F.r,-dx*factor).addScaledVector(UP_WORLD,dy*factor);
     e.pan.clampLength(0,230);
    }
   }
  }
  p.x=event.clientX;p.y=event.clientY;
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture']){
  pad.addEventListener(type,event=>getExplorer()?.pointers.delete(event.pointerId));
 }
 pad.addEventListener('wheel',event=>{
  const e=getExplorer();if(!e)return;
  event.preventDefault();
  zoomExplorer(e,Math.exp(clamp(event.deltaY,-100,100)*.003));
 },{passive:false});
}
export function disposeTrackExplorer(e){
 if(!e)return;
 e.pointers.clear();
 e.camera=null;e.scene=null;e.world=null;e.specs=[];e.track=null;
}
