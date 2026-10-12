import * as THREE from 'three';

// Dedicated cinematic menu presets; gameplay camera and obstacles remain untouched.
// Enclosed courses are filmed from inside their clear corridor. Open-air
// tracks are filmed from a raised diagonal for a better view of the scenery.
export const PREVIEW_CAMERA={
  1:{part:.09,back:21,front:33,x:.8,y:.6,fov:69},
  2:{part:.27,back:24,front:34,x:-.7,y:.7,fov:69},
  3:{part:.34,back:24,front:34,x:.9,y:.6,fov:71},
  4:{part:.24,back:37,front:58,x:18,y:21,fov:66},
  5:{part:.30,back:37,front:57,x:22,y:22,fov:67},
  6:{part:.23,back:41,front:54,x:-22,y:18,fov:66}
};
const hit=new THREE.Vector3(),direction=new THREE.Vector3();
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
    if(p&&p.distanceTo(from)<distance*.86)return false;
  }
  return true;
}
function safePosition(track,s,p,x,y,world){
  const v=track.pose(Math.max(4,s-p.back),x,y);
  if(world?.ground)v.y=Math.max(v.y,world.ground(v.x,v.z)+13);
  return v;
}
export function menuCamera(track,course,camera,t,world){
  const p=PREVIEW_CAMERA[course],base=Math.max(55,Math.min(track.length-110,track.length*p.part));
  if(world&&!world._menuCameraPreset){
    const to=track.pose(Math.min(track.length-4,base+p.front),0,0);
    const angles=course<4?[[p.x,p.y]]:[[p.x,p.y],[-p.x,p.y],[p.x,p.y+13],[-p.x,p.y+13],[.9,.7]];
    const safe=angles.find(([x,y])=>candidateClear(safePosition(track,base,p,x,y,world),to,world));
    world._menuCameraPreset=safe||[.9,.7];
  }
  const s=Math.max(55,Math.min(track.length-110,base+Math.sin(t*.11)*8));
  const [px,py]=world?world._menuCameraPreset||[p.x,p.y]:[p.x,p.y];
  const from=safePosition(track,s,p,px+Math.sin(t*.08)*.25,py+Math.cos(t*.13)*.2,course>=4?world:null);
  camera.position.copy(from);
  camera.up.copy(track.frame(s-p.back).u);
  camera.lookAt(track.pose(Math.min(track.length-4,s+p.front),0,0));
  const fov=p.fov+Math.sin(t*.075)*.7;
  if(Math.abs(fov-camera.fov)>.1){camera.fov=fov;camera.updateProjectionMatrix();}
  return s;
}