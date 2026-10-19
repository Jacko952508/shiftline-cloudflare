// CI-only pilot camera studio. Appended by GitHub Action to the race engine
// after runtime-bridge-v152.js. Not included in production.
window.__shiftlinePilotAudit167={
 select(model,edition){
  if(state!=='race'||!track)throw Error('Launch Level 1 before auditing');
  model=Math.max(0,Math.min(5,model|0));edition=Math.max(0,Math.min(2,edition|0));
  firstPerson=false;
  if(player)disposeCraft(scene,player);
  if(cockpit)disposeCockpit(cockpit);
  const custom={edition,livery:edition,finish:0,wing:0,engine:0,canopy:0,fin:0,trail:edition,cabin:edition,instrument:edition,stick:edition};
  player=craft(scene,PAINT[0],model,true,custom,{pilotModel:true});
  player.userData.exhaustFX.racing=true;
  cockpit=createCockpit(custom,model,fleetEdition(model,custom).accent,scene.environment);
  attachPilotAirframe(cockpit,player);
  x=y=vx=vy=bank=dead=0;visualPrevious=null;
  firstPerson=true;
  render(1/60);
  const rig=player.children.find(o=>o.userData.pilotRig)?.userData.pilotRig;
  if(!rig)throw Error('Missing pilot rig '+model+' '+edition);
  return this.read();
 },
 read(){
  const root=player?.children.find(o=>o.userData.pilotRig),rig=root?.userData.pilotRig;
  if(!rig)throw Error('No pilot rig');
  return {
   model:rig.model,edition:rig.edition,eye:rig.eyeLocal,
   pieces:cockpit.noseMeshes.length,actual:cockpit.noseMeshes.every(p=>p.visible),
   noseGeometry:rig.parts.map(p=>({name:p.name,triangles:p.geometry.index?.count/3||p.geometry.attributes.position.count/3})),
   craftVisible:player.visible,
   noseAttachmentCount:cockpit.noseCameraRoot.children.length,
   rigidLock:Math.abs(camera.quaternion.dot(player.quaternion)),
   cabinClosed:!!cockpit.tub&&cockpit.tub.children.length>=16,
   independentCockpitSway:Math.abs(cockpit.root.rotation.z)+Math.abs(cockpit.root.rotation.x),
   exteriorParts:rig.exterior.map(({child})=>({name:child.name,visible:child.visible})).filter(x=>x.visible),
   cockpitEdition:cockpit.custom,front:viewClip()
  };
 },
 draw(showNose){
  const rig=player.children.find(o=>o.userData.pilotRig)?.userData.pilotRig;
  for(const mesh of cockpit.noseMeshes)mesh.visible=!!showNose;
  effects.render(scene,camera,time,boost,$('#quality').value,$('#reducedMotion').checked);
  renderCockpit(cockpit,renderer);
 },
 frame(){
  render(1/60);return this.read();
 }
};
function viewClip(){
 const rig=player.children.find(o=>o.userData.pilotRig)?.userData.pilotRig;
 cockpit.camera.updateMatrixWorld(true);cockpit.noseCameraRoot.updateMatrixWorld(true);
 const boxes=cockpit.noseMeshes.map(part=>{
  const b=new THREE.Box3().setFromObject(part);
  const v=new THREE.Vector3();const points=[];
  for(const X of[b.min.x,b.max.x])for(const Y of[b.min.y,b.max.y])for(const Z of[b.min.z,b.max.z]){
   v.set(X,Y,Z).project(cockpit.camera);points.push([v.x,v.y,v.z]);
  }
  return {name:part.name,rect:[Math.min(...points.map(p=>p[0])),Math.max(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[1]))]};
 });
 return boxes;
}
