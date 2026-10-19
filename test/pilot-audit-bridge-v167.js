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
   noseBelly:!!cockpit.noseBelly&&cockpit.noseBelly.geometry.index.count>70,
   realHullContinuity:rig.continuationStations?.length===3 &&
    cockpit.noseBelly?.name.includes('authentic continuous') &&
    cockpit.noseBelly.geometry.index.count>300,
   nosePaint:cockpit.noseMeshes.map(m=>({factoryBody:m.material.userData.factoryBody,finish:m.material.userData.factoryFinish,color:m.material.color.getHex(),metalness:m.material.metalness,roughness:m.material.roughness,accentStripes:m.children.filter(x=>x.name.includes('livery')).length})),
   rigidLock:Math.abs(camera.quaternion.dot(player.quaternion)),
   cabinClosed:!!cockpit.tub&&cockpit.tub.children.length>=16,
   independentCockpitSway:Math.abs(cockpit.root.rotation.z)+Math.abs(cockpit.root.rotation.x),
   exteriorParts:rig.exterior.map(({child})=>({name:child.name,visible:child.visible})).filter(x=>x.visible),
   cockpitEdition:cockpit.custom,front:viewClip()
  };
 },
 draw(showNose){
  for(const mesh of cockpit.noseMeshes)mesh.visible=!!showNose;
  effects.render(scene,camera,time,boost,$('#quality').value,$('#reducedMotion').checked);
  renderCockpit(cockpit,renderer);
 },
 noseCoverage(){
  // Compare two screenshots of the ISOLATED cockpit scene, never two frames
  // from the temporal world postprocessor. This prevents false 70% 'nose'
  // occlusion reports from exposure/blurring changes between race renders.
  const w=innerWidth>innerHeight?320:180,h=innerWidth>innerHeight?148:390;
  const rt=new THREE.WebGLRenderTarget(w,h,{depthBuffer:true,stencilBuffer:false});
  const prev=renderer.getRenderTarget(),tone=renderer.toneMapping,auto=renderer.autoClear,
   clr=renderer.getClearColor(new THREE.Color()).clone(),alpha=renderer.getClearAlpha();
  const on=new Uint8Array(w*h*4),off=new Uint8Array(w*h*4);
  const old=cockpit.noseMeshes.map(m=>m.visible);
  const sample=(visible,dest)=>{
   for(const m of cockpit.noseMeshes)m.visible=visible;
   renderer.setRenderTarget(rt);renderer.setClearColor(0x08111b,1);
   renderer.autoClear=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;
   renderer.clear(true,true,true);renderer.render(cockpit.scene,cockpit.camera);
   renderer.readRenderTargetPixels(rt,0,0,w,h,dest);
  };
  try{sample(false,off);sample(true,on);}finally{
   cockpit.noseMeshes.forEach((m,i)=>m.visible=old[i]);
   renderer.setRenderTarget(prev);renderer.setClearColor(clr,alpha);
   renderer.autoClear=auto;renderer.toneMapping=tone;rt.dispose();
  }
  let total=0,top=0,bottom=0,minY=h,maxY=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4;
   const d=Math.abs(on[i]-off[i])+Math.abs(on[i+1]-off[i+1])+Math.abs(on[i+2]-off[i+2]);
   if(d>35){total++;
    // WebGL reads render targets bottom-to-top.
    const fromTop=h-1-y;
    if(fromTop<h*.3)top++;
    if(fromTop>h*.55)bottom++;
    minY=Math.min(minY,fromTop);maxY=Math.max(maxY,fromTop);
   }
  }
  return{total,top,bottom,areaPct:100*total/(w*h),topPct:100*top/(w*h),
   firstVisibleY:total?minY/h:1,lastVisibleY:total?maxY/h:0};
 },
 continuationCoverage(){
  // Pixel-difference of the real hull addition in the stable cockpit
  // render target, independent of animated tunnel graphics and HUD.
  const w=180,h=390,rt=new THREE.WebGLRenderTarget(w,h,{depthBuffer:true,stencilBuffer:false});
  const prev=renderer.getRenderTarget(),tone=renderer.toneMapping,auto=renderer.autoClear,
   clr=renderer.getClearColor(new THREE.Color()).clone(),alpha=renderer.getClearAlpha(),
   was=cockpit.noseBelly.visible,on=new Uint8Array(w*h*4),off=new Uint8Array(w*h*4);
  const render=(visible,target)=>{
   cockpit.noseBelly.visible=visible;
   renderer.setRenderTarget(rt);renderer.setClearColor(0x08111b,1);
   renderer.autoClear=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;
   renderer.clear(true,true,true);renderer.render(cockpit.scene,cockpit.camera);
   renderer.readRenderTargetPixels(rt,0,0,w,h,target);
  };
  try{render(false,off);render(true,on);}finally{
   cockpit.noseBelly.visible=was;renderer.setRenderTarget(prev);
   renderer.setClearColor(clr,alpha);renderer.autoClear=auto;
   renderer.toneMapping=tone;rt.dispose();
  }
  let gap=0,total=0,horizon=0,minY=h,maxY=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4,delta=Math.abs(on[i]-off[i])+
    Math.abs(on[i+1]-off[i+1])+Math.abs(on[i+2]-off[i+2]);
   if(delta>35){
    const fromTop=h-1-y;total++;
    if(fromTop>h*.62&&fromTop<h*.92&&x>w*.22&&x<w*.78)gap++;
    if(fromTop<h*.36)horizon++;
    minY=Math.min(minY,fromTop);maxY=Math.max(maxY,fromTop);
   }
  }
  return{gap,total,horizon,firstVisibleY:total?minY/h:1,
    lastVisibleY:total?maxY/h:0,areaPct:100*total/(w*h)};
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
