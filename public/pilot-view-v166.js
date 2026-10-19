import * as THREE from 'three';
// The same gameplay ship supplies the pilot anchor and authentic nose profile.
// No camera-only duplicate craft, and no editing of collision geometry.
export function pilotRig(ship){
 const root=ship?.children.find(o=>o.userData?.pilotRig);
 return root?.userData.pilotRig||null;
}
export function setPilotView(ship,firstPerson,alive=true){
 const rig=pilotRig(ship);
 if(!rig){if(ship)ship.visible=!firstPerson&&alive;return null;}
 const root=rig.seat.parent;
 if(!rig.exterior){
  rig.exterior=root.children.filter(child=>child!==rig.seat&&!rig.parts.includes(child))
   .map(child=>({child,visible:child.visible}));
  rig.active=false;
 }
 if(firstPerson){
  // Keep the actual ship as the parent so the nose follows live racing pose.
  // Nothing behind the pilot seat, no engine trails and no glass dome should
  // appear through the windscreen. The real forward loft alone stays visible.
  for(const {child} of rig.exterior)child.visible=false;
  for(const nose of rig.parts)nose.visible=true;
 }else if(rig.active){
  for(const {child,visible} of rig.exterior)child.visible=visible;
  for(const nose of rig.parts)nose.visible=false;
 }
 rig.active=!!firstPerson;
 ship.visible=!!alive;
 return rig;
}
export function placePilotCamera(ship,target){
 const rig=pilotRig(ship);
 if(!rig)return false;
 ship.updateMatrixWorld(true);
 rig.seat.getWorldPosition(target);
 return true;
}
export function inspectPilotSilhouette(ship,camera){
 const rig=pilotRig(ship);if(!rig)return null;
 const eye=new THREE.Vector3();rig.seat.getWorldPosition(eye);
 const axis=new THREE.Vector3(0,0,-1).applyQuaternion(ship.quaternion).normalize();
 const visibleParts=rig.parts.map(m=>{
  const box=new THREE.Box3().setFromObject(m);
  const center=box.getCenter(new THREE.Vector3());
  const p=center.clone().project(camera);
  return {name:m.name,visible:m.visible,forward:axis.dot(center.sub(eye)),screen:[p.x,p.y],span:[box.min.toArray(),box.max.toArray()]};
 });
 return {version:166,model:rig.model,edition:rig.edition,eye:eye.toArray(),localEye:rig.eyeLocal,visibleParts};
}
