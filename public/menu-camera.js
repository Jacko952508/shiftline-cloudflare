import * as THREE from 'three';

// Four curated, continuously moving hero shots for each existing course.
// This is menu-only: racing camera, progress, obstacles and physics are unchanged.
// Editing the shot fractions changes filming locations, NOT course geometry.
const SHOT_SECONDS=14,CUT_SECONDS=.9;
const smoothstep=x=>{const u=Math.max(0,Math.min(1,x));return u*u*(3-2*u);};
export const PREVIEW_CAMERA={
  1:{shots:[.09,.28,.55,.82],back:21,front:48,x:.75,y:.65,fov:75,travel:108,offsets:[[.8,.6],[-.5,.7],[.4,-.4],[.5,.65]]},
  2:{shots:[.12,.33,.59,.83],back:24,front:49,x:-.65,y:.7,fov:75,travel:100,offsets:[[-.7,.7],[.55,.6],[-.35,-.3],[.65,.5]]},
  3:{shots:[.1,.34,.62,.83],back:24,front:48,x:.8,y:.6,fov:76,travel:103,offsets:[[.9,.6],[-.65,.7],[.55,.35],[-.55,.55]]},
  4:{shots:[.13,.34,.59,.83],back:37,front:86,x:20,y:23,fov:72,travel:135,offsets:[[20,23],[-18,29],[24,34],[-15,22]]},
  5:{shots:[.12,.34,.58,.84],back:38,front:82,x:24,y:22,fov:73,travel:128,offsets:[[24,23],[-20,27],[17,36],[-24,20]]},
  6:{shots:[.11,.32,.6,.83],back:43,front:80,x:-23,y:21,fov:72,travel:134,offsets:[[-23,23],[18,28],[-26,35],[23,20]]}
};
export const MENU_SHOT_DURATION=SHOT_SECONDS;
const hit=new THREE.Vector3(),direction=new THREE.Vector3(),up=new THREE.Vector3();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function candidateClear(from,to,world){
  const boxes=world?.sceneryBounds;
  if(!boxes?.length)return true;
  direction.copy(to).sub(from);
  const distance=direction.length();
  if(distance<1)return true;
  const ray=new THREE.Ray(from,direction.divideScalar(distance));
  for(const b of boxes){
    if(b.containsPoint(from))return false;
    const p=ray.intersectBox(b,hit);
    if(p&&p.distanceTo(from)<distance*.87)return false;
  }
  return true;
}
function safePosition(track,s,p,x,y,world){
  const v=track.pose(Math.max(4,s-p.back),x,y);
  if(world?.ground)v.y=Math.max(v.y,world.ground(v.x,v.z)+15);
  return v;
}
function resolveShot(track,course,shot,world){
  const p=PREVIEW_CAMERA[course]||PREVIEW_CAMERA[1];
  const index=Number.isFinite(shot)?((Math.trunc(shot)%p.shots.length)+p.shots.length)%p.shots.length:0;
  const base=clamp(track.length*p.shots[index],60,track.length-170);
  const [ox,oy]=p.offsets[index]||[p.x,p.y];
  const candidate=course<4?[[ox,oy]]:[[ox,oy],[-ox,oy],[ox,oy+16],[-ox,oy+16],[.85,.65]];
  const target=track.pose(Math.min(track.length-4,base+p.front+30),0,0);
  const chosen=candidate.find(([x,y])=>candidateClear(safePosition(track,base,p,x,y,world),target,world))||[.85,.65];
  return {base,x:chosen[0],y:chosen[1]};
}
// Calculate all collision-aware scenic shot placements once per course change.
// Without this, the first frame after each camera cut performs ray/box searches
// while an animation is running, which produces a visible pause on mobile.
export function prepareMenuCamera(track,course,world){
 if(!world)return;
 const p=PREVIEW_CAMERA[course]||PREVIEW_CAMERA[1];
 world._menuShotPresets=new Map(p.shots.map((_,i)=>[i,resolveShot(track,course,i,world)]));
}
// The fade happens only when changing edited shots, so we never swipe through
// several kilometres of unseen track or teleport the camera while visible.
export function menuCamera(track,course,camera,t,world,reduced=false){
  // Frame-clock discontinuities can briefly produce a negative time. Keep the
  // carousel on its first shot instead of indexing offsets[-1].
  t=Number.isFinite(t)?Math.max(0,t):0;
  const p=PREVIEW_CAMERA[course]||PREVIEW_CAMERA[1],shot=reduced?0:Math.floor(t/SHOT_SECONDS)%p.shots.length;
  const elapsed=reduced?0:t%SHOT_SECONDS;
  const progress=reduced?0:Math.min(1,elapsed/(SHOT_SECONDS-CUT_SECONDS));
  if(world&&!world._menuShotPresets)world._menuShotPresets=new Map();
  let preset=world?world._menuShotPresets.get(shot):null;
  if(!preset){preset=resolveShot(track,course,shot,world);world?._menuShotPresets.set(shot,preset);}
  // Gentle cinematic acceleration without slowing to a stop or juddering.
  const glide=reduced?0:Math.min(1,progress+.027*Math.sin(progress*Math.PI*2));
  const s=clamp(preset.base+p.travel*glide,60,track.length-95),F=track.frame(Math.max(1,s-p.back));
  const wobble=reduced?0:Math.sin(t*.48+shot)*.62;
  const from=safePosition(track,s,p,preset.x+wobble,preset.y+(reduced?0:Math.sin(t*.32)*.42),course>=4?world:null);
  camera.position.copy(from);
  up.copy(F.u).addScaledVector(F.r,reduced?0:Math.sin(t*.3+shot)*.065).normalize();
  camera.up.copy(up);
  const look=track.pose(Math.min(track.length-4,s+p.front),course>=4?Math.sin(t*.16+shot)*2:0,course>=4?.6:0);
  camera.lookAt(look);
  const fov=p.fov+(reduced?0:Math.sin(t*.21+shot)*1.3);
  if(Math.abs(fov-camera.fov)>.09){camera.fov=fov;camera.updateProjectionMatrix();}
  // Brief cut mask preserves visual continuity while changing viewpoints.
  const fade=reduced?0:Math.max(
    t>=SHOT_SECONDS?smoothstep((CUT_SECONDS-elapsed)/CUT_SECONDS):0,
    smoothstep((elapsed-(SHOT_SECONDS-CUT_SECONDS))/CUT_SECONDS)
  );
  camera.userData.menuReel={shot,progress,fade:clamp(fade,0,1),s};
  return s;
}
