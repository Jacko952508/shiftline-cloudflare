import * as THREE from 'three';
import {updateWorld} from './race-world.js?v=85';
import {updateObstacles} from './race-obstacles.js?v=67';

// Live spectator director: views the EXISTING game scene; no duplicate meshes,
// textures, shaders, terrain, or approximated track geometry are created here.
const clamp=THREE.MathUtils.clamp;
const WORLD_UP=new THREE.Vector3(0,1,0);
const TMP=new THREE.Vector3(),POS=new THREE.Vector3(),LOOK=new THREE.Vector3(),UP=new THREE.Vector3();
function location(track,s,x=0,y=0){return track.pose(clamp(s,2,track.length-2),x,y);}
export function createTrackExplorer(track,scene,world,specs=[]){
 const e={track,scene,world,specs,camera:new THREE.PerspectiveCamera(67,1,.2,20000),
  mode:'orbit',yaw:.48,pitch:.58,zoom:1,pan:new THREE.Vector3(),progress:.08,
  paused:false,hasCamera:false,pointers:new Map(),time:0};
 return e;
}
export function resetExplorer(e){
 if(!e)return;e.mode='orbit';e.yaw=.48;e.pitch=.58;e.zoom=1;e.pan.set(0,0,0);
 e.hasCamera=false;e.paused=false;e.pointers.clear();
}
export function zoomExplorer(e,factor){if(e)e.zoom=clamp(e.zoom*factor,.36,2.8);}
export function setExplorerMode(e,mode){
 if(!e||!['orbit','overhead','chase','fly'].includes(mode))return;
 e.mode=mode;e.hasCamera=false;e.zoom=1;e.pan.set(0,0,0);
 e.yaw=mode==='orbit'?.48:0;e.pitch=mode==='overhead'?1.4:mode==='orbit'?.58:.06;
}
export function seekExplorer(e,fraction){
 if(!e)return;e.progress=clamp(Number(fraction)||0,.005,.99);e.hasCamera=false;
}
export function advanceExplorer(e,dt){
 if(e?.mode==='fly'&&!e.paused){
  let next=e.progress+clamp(dt,0,.06)*95/e.track.length;
  if(next>=.99){next=.005;e.hasCamera=false;}e.progress=next;
 }
}
export function renderTrackExplorer(e,renderer,rect,dt=.033,time=0){
 if(!e||!rect||rect.width<1||rect.height<1||rect.bottom<=0||rect.top>=innerHeight)return;
 const tr=e.track,s=clamp(e.progress*tr.length,10,tr.length-20),F=tr.frame(s),cam=e.camera;
 // The exact gameplay simulation's culling, machinery, animals, sky and
 // environment effects continue to animate; physics and AI do not run.
 updateWorld(e.world,s,time);
 updateObstacles(e.specs,s,time);
 const orbit=e.mode==='orbit',overhead=e.mode==='overhead',close=e.mode==='chase',fly=e.mode==='fly';
 const tunnel=tr.course<=2;
 let desiredFov=68;
 if(orbit&&tunnel){
   // Closed tunnel walls require an internal survey angle, not a camera
   // outside the hull that would stare at its backface.
   const a=e.yaw,r=clamp(4.6*e.zoom,1.6,5.5);
   POS.copy(location(tr,s-26,Math.sin(a)*r,Math.cos(a)*r));
   LOOK.copy(location(tr,s+35,e.pan.x*.08,e.pan.y*.08));
   UP.copy(F.u);desiredFov=72;
 }else if(orbit){
   const distance=clamp((tr.course===3?118:190)*e.zoom,36,525),
    cp=clamp(e.pitch,.13,1.48),ca=e.yaw;
   LOOK.copy(location(tr,s)).add(e.pan);
   POS.copy(LOOK).addScaledVector(WORLD_UP,Math.sin(cp)*distance)
     .add(new THREE.Vector3(Math.sin(ca)*Math.cos(cp)*distance,0,Math.cos(ca)*Math.cos(cp)*distance));
   if(typeof e.world.ground==='function')POS.y=Math.max(POS.y,e.world.ground(POS.x,POS.z)+14);
   UP.copy(WORLD_UP);desiredFov=62;
 }else if(overhead){
   LOOK.copy(location(tr,s)).add(e.pan);
   const height=(tunnel?65:250)*e.zoom;
   POS.copy(LOOK).addScaledVector(WORLD_UP,height).add(new THREE.Vector3(.1,0,.1));
   UP.set(Math.sin(e.yaw),0,-Math.cos(e.yaw));desiredFov=65;
 }else{
   const nearS=s-(fly?8:25)*e.zoom;
   POS.copy(location(tr,nearS,fly?0:Math.sin(e.yaw)*2.3,fly?1.2:1.8+e.pitch*2));
   LOOK.copy(location(tr,s+(fly?45:55),0,0));
   UP.copy(tr.frame(nearS).u);desiredFov=fly?77:66;
 }
 const alpha=e.hasCamera?1-Math.exp(-clamp(dt,.001,.08)*(fly?12:14)):1;
 if(!e.hasCamera){cam.position.copy(POS);e.lookCurrent=LOOK.clone();e.upCurrent=UP.clone();}
 else{cam.position.lerp(POS,alpha);e.lookCurrent.lerp(LOOK,alpha);e.upCurrent.lerp(UP,alpha).normalize();}
 cam.up.copy(e.upCurrent);cam.lookAt(e.lookCurrent);
 cam.fov=desiredFov;cam.aspect=rect.width/Math.max(1,rect.height);
 cam.updateProjectionMatrix();e.hasCamera=true;
 const oldAuto=renderer.autoClear,oldTone=renderer.toneMapping,oldBg=renderer.getClearColor(new THREE.Color()),oldAlpha=renderer.getClearAlpha();
 renderer.setRenderTarget(null);
 renderer.setViewport(rect.left,innerHeight-rect.bottom,rect.width,rect.height);
 renderer.setScissor(rect.left,innerHeight-rect.bottom,rect.width,rect.height);renderer.setScissorTest(true);
 renderer.autoClear=true;
 try{renderer.setClearColor(0x06111b,1);renderer.clear(true,true,true);
     renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.render(e.scene,cam);}
 finally{renderer.setScissorTest(false);renderer.autoClear=oldAuto;renderer.toneMapping=oldTone;renderer.setClearColor(oldBg,oldAlpha);renderer.setViewport(0,0,innerWidth,innerHeight);}
}
export function bindExplorer(pad,getExplorer){
 pad.addEventListener('pointerdown',ev=>{
  const e=getExplorer();if(!e||ev.target.closest('button,input'))return;
  ev.preventDefault();e.pointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});pad.setPointerCapture?.(ev.pointerId);
 });
 pad.addEventListener('pointermove',ev=>{
  const e=getExplorer(),p=e?.pointers.get(ev.pointerId);if(!p)return;
  ev.preventDefault();const dx=ev.clientX-p.x,dy=ev.clientY-p.y;
  if(e.pointers.size===1){
    if(e.mode==='fly'||e.mode==='chase'){e.yaw=clamp(e.yaw-dx*.008,-1.0,1.0);e.pitch=clamp(e.pitch+dy*.006,-.8,.8);}
    else{e.yaw-=dx*.008;e.pitch=clamp(e.pitch+dy*.006,.13,1.48);}
  }else{
    const other=[...e.pointers.entries()].find(([id])=>id!==ev.pointerId)?.[1];
    if(other){
      const old=Math.hypot(p.x-other.x,p.y-other.y),next=Math.hypot(ev.clientX-other.x,ev.clientY-other.y);
      if(old>12&&next>12)zoomExplorer(e,old/next);
      if(e.mode==='orbit'||e.mode==='overhead'){
        const F=e.track.frame(e.progress*e.track.length),distance=e.zoom*110;
        e.pan.addScaledVector(F.r,-dx*.002*distance).addScaledVector(F.u,dy*.002*distance);
        e.pan.clampLength(0,250);
      }
    }
  }
  p.x=ev.clientX;p.y=ev.clientY;
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,ev=>getExplorer()?.pointers.delete(ev.pointerId));
 pad.addEventListener('wheel',ev=>{const e=getExplorer();if(e){ev.preventDefault();zoomExplorer(e,Math.exp(clamp(ev.deltaY,-100,100)*.003));}},{passive:false});
}
export function disposeTrackExplorer(e){if(!e)return;e.pointers.clear();e.camera=null;e.scene=null;e.world=null;e.specs=[];e.track=null;}