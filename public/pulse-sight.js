import * as THREE from 'three';
// Pulse rounds keep the shooter's lane coordinates and advance along the track.
// Project that same trajectory, rather than ship tilt or a rival's position.
export function pulseSightPoint(track,actor,distance,out=new THREE.Vector3()){return out.copy(track.pose(Math.min(track.length,actor.s+2+distance),actor.x,actor.y));}
export function createPulseSight(){return{point:new THREE.Vector3(),ndc:new THREE.Vector3(),direction:new THREE.Vector3()};}
export function updatePulseSight(v,node,track,camera,actor,{active=false,cooling=false,firing=false,width=1,height=1}={}){
 if(!active){node.classList.add('off');return false;}camera.updateMatrixWorld();camera.getWorldDirection(v.direction);let visible=false;
 for(const range of[60,30,15,8]){pulseSightPoint(track,actor,range,v.point);if(v.ndc.copy(v.point).sub(camera.position).dot(v.direction)<=0)continue;v.ndc.copy(v.point).project(camera);if(Number.isFinite(v.ndc.x)&&Number.isFinite(v.ndc.y)&&v.ndc.z>=-1&&v.ndc.z<=1&&Math.abs(v.ndc.x)<.94&&Math.abs(v.ndc.y)<.82){visible=true;break;}}
 node.classList.toggle('off',!visible);if(!visible)return false;
 node.style.left=((v.ndc.x+1)*width*.5)+'px';node.style.top=((1-v.ndc.y)*height*.5)+'px';node.classList.toggle('cooling',cooling);node.classList.toggle('firing',firing&&!cooling);return true;
}