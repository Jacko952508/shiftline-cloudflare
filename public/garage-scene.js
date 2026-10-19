import * as THREE from 'three';
import {createCockpit,updateCockpit,renderCockpit,disposeCockpit} from './cockpit.js?v=172';
import {craft,animateCraft,disposeCraft} from './race-craft.js?v=172';
import {tuneTextureFiltering} from './material-lab.js?v=147';
import {fleetEnvironment} from './fleet-paint-v163.js?v=163';
import {createGarageFlight,updateGarageFlight,disposeGarageFlight} from './garage-flight-v163.js?v=163';
import {fleetEdition} from './fleet-designs-v162.js?v=163';
import {PAINT} from './progress.js?v=163';

// A restrained architectural atelier: broad soft lighting and honest materials.
function installShowroomArchitecture(scene){
 const group=new THREE.Group();group.name='FLIGHTWORKS / architectural atelier';
 const metal=new THREE.MeshStandardMaterial({color:0x182634,metalness:.65,roughness:.4});
 const wallMat=new THREE.MeshStandardMaterial({color:0x14212c,metalness:.18,roughness:.78});
 const glow=new THREE.MeshBasicMaterial({color:0x88d8df,toneMapped:false});
 const rail=new THREE.MeshBasicMaterial({color:0x2c4e63,toneMapped:false});
 const white=new THREE.MeshBasicMaterial({color:0xb5c6cb});
 const add=(geo,mat,x,y,z)=>{const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
 add(new THREE.BoxGeometry(14,.10,14),wallMat,0,-.86,0);
 const floor=add(new THREE.CylinderGeometry(2.15,2.20,.11,96),metal,0,-.69,0);floor.receiveShadow=true;
 const outline=add(new THREE.TorusGeometry(2.14,.008,6,96),rail,0,-.63,0);outline.rotation.x=-Math.PI/2;
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,4,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.52)');gradient.addColorStop(.5,'rgba(0,0,0,.27)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const shadowTexture=new THREE.CanvasTexture(shadowCanvas),shadowMat=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});
 const contact=add(new THREE.PlaneGeometry(3.1,3.8),shadowMat,0,-.627,0);contact.rotation.x=-Math.PI/2;
 add(new THREE.BoxGeometry(11,5,.15),wallMat,0,1.3,-3.6);
 // Recessed luminous ceiling bays create broad highlights along curved hulls.
 for(const x of[-2.9,0,2.9]){
  add(new THREE.BoxGeometry(1.65,.035,2.8),metal,x,3.3,-.5);
  add(new THREE.BoxGeometry(1.45,.018,2.55),white,x,3.275,-.5);
 }
 for(const side of[-1,1]){
  add(new THREE.BoxGeometry(.13,4,.3),metal,side*3.08,1,-2.8);
  add(new THREE.BoxGeometry(.028,2.6,.025),glow,side*2.99,1,-2.59);
  add(new THREE.BoxGeometry(1.5,.025,.04),white,side*1.62,1.75,-3.48);
  for(let k=0;k<7;k++)add(new THREE.BoxGeometry(.035,2.9,.06),metal,side*(1.3+k*.16),.7,-3.43);
 }
 add(new THREE.BoxGeometry(2.1,.012,.028),rail,0,-.05,-3.48);
 scene.add(group);return{group,glow,rail,floor,shadowTexture};
}
export function createGarage(p){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x101a24);scene.environment=fleetEnvironment();scene.environmentIntensity=1;
 const key=new THREE.DirectionalLight(0xfff2de,3.1);key.position.set(-3,4,2);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=3;key.shadow.camera.bottom=-3;key.shadow.normalBias=.018;
 const fill=new THREE.DirectionalLight(0xc0d9ef,1.45);fill.position.set(3,1.7,2.5);
 const rim=new THREE.DirectionalLight(0xe0f6ff,3.3);rim.position.set(-.8,3,-3);
 const ambient=new THREE.HemisphereLight(0xe1eaf1,0x263444,1.05);scene.add(key,fill,rim,ambient);
 const architecture=installShowroomArchitecture(scene);
 const g={scene,key,fill,rim,ambient,architecture,floor:architecture.floor,ship:null,yaw:2.62,pitch:.08,drag:null,auto:true,zoom:false,lightingMode:'studio',lightTarget:new THREE.Object3D(),camera:new THREE.PerspectiveCamera(35,1,.1,45)};
 equipGarage(g,p);setGarageLighting(g,'studio');return g;
}
export function equipGarage(g,p){
 const design=fleetEdition(p.craft,p.custom);disposeCockpit(g.cockpit);g.cockpit=createCockpit(p.custom,p.craft,design.accent,g.scene.environment);
 const previous=g.ship,active=g.lightingMode==='track'&&g.flight?g.flight.scene:g.scene;g.ship=craft(active,PAINT[p.color]||PAINT[0],p.craft,true,p.custom);if(previous)disposeCraft(active,previous);
 // One bounded lamp lets the actual inlaid lights colour nearby bodywork.
 g.paintLight=new THREE.PointLight(design.accent,g.lightingMode==='night'?1.15:.6,2.4,2);g.paintLight.position.set(0,.29,.72);g.ship.add(g.paintLight);
 if(g.flight){g.flight.glow.color.setHex(design.accent);if(g.lightingMode==='track')for(const l of[g.key,g.fill,g.rim])l.target=g.ship;}
 g.architecture.glow.color.setHex(design.accent).multiplyScalar(.64);g.architecture.rail.color.setHex(design.accent).multiplyScalar(.21);tuneTextureFiltering(g.scene,4);
}
export function setGarageLighting(g,mode='studio'){
 if(!g)return;const modes={studio:{background:0x101a24,key:2.6,fill:1.15,rim:2.5,ambient:.8,env:.95,exposure:1.02},night:{background:0x060d17,key:.85,fill:.3,rim:2.6,ambient:.36,env:.55,exposure:1.02},track:{background:0x06111c,key:2.7,fill:1.1,rim:2.6,ambient:.8,env:.9,exposure:1.08}};
 const previousMode=g.lightingMode;
 const s=modes[mode]||modes.studio;g.lightingMode=modes[mode]?mode:'studio';g.scene.background.setHex(s.background);g.scene.environmentIntensity=s.env;for(const light of['key','fill','rim','ambient'])g[light].intensity=s[light];g.exposure=s.exposure;
 const flying=g.lightingMode==='track';g.drag=null;
 if(flying){
  g.flight??=createGarageFlight(g.scene.environment,g.paintLight.color.getHex());g.flight.scene.environmentIntensity=s.env;
  if(previousMode!=='track')g.flight.startedAt=null;
  g.activeScene=g.flight.scene;g.viewCockpit=false;g.flight.scene.add(g.ship,g.key,g.fill,g.rim,g.ambient);for(const l of[g.key,g.fill,g.rim])l.target=g.ship;
 }else{
  g.activeScene=g.scene;g.scene.add(g.ship,g.key,g.fill,g.rim,g.ambient);for(const l of[g.key,g.fill,g.rim])l.target=g.lightTarget;
  g.key.position.set(-3,4,2);g.fill.position.set(3,1.7,2.5);g.rim.position.set(-.8,3,-3);g.scene.environmentRotation.y=mode==='night'?-.35:.15;g.ship.position.set(0,0,0);
 }
 g.key.castShadow=!flying;g.paintLight.intensity=mode==='night'?1.15:.6;
 const host=typeof document==='undefined'?null:document.querySelector('#craftDisplay');
 if(host){host.dataset.flight=String(flying);host.setAttribute('aria-label',flying?'Selected ship flying automatically around a figure-eight tunnel. Chase camera.':'Interactive 3D ship showroom. Drag to rotate.');host.querySelector('.garageSpec').textContent=flying?'FIGURE-EIGHT FLIGHT · CHASE CAMERA':'DRAG TO ROTATE · INSPECT EVERY ANGLE';document.querySelector('#garageCockpitView').disabled=flying;document.querySelector('#garageCockpitView').textContent=g.viewCockpit?'EXTERIOR':'COCKPIT';}
 if(typeof window!=='undefined')window.__shiftlineFlightQA=flying?{active:true}: {active:false};
 if(typeof location!=='undefined'&&location.search.includes('shipqa=1'))window.__shiftlineLightingQA={mode:g.lightingMode,exposure:g.exposure};
}
export function renderGarage(g,renderer,rect,time){
 const host=document.querySelector('#craftDisplay');
 if(host&&!g.previewRenderer){try{const c=document.createElement('canvas');c.className='garage3DCanvas';c.setAttribute('aria-hidden','true');host.prepend(c);g.previewRenderer=new THREE.WebGLRenderer({canvas:c,alpha:false,antialias:true,powerPreference:'low-power'});g.previewRenderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));g.previewRenderer.outputColorSpace=THREE.SRGBColorSpace;g.previewRenderer.toneMapping=THREE.ACESFilmicToneMapping;g.previewRenderer.shadowMap.enabled=true;g.previewRenderer.shadowMap.type=THREE.PCFSoftShadowMap;}catch(e){console.warn('Garage renderer unavailable',e);}}
 if(!rect||rect.width<1||rect.height<1||rect.bottom<0||rect.top>innerHeight)return;
 if(g.previewRenderer){const w=Math.round(rect.width),h=Math.round(rect.height);if(g.previewWidth!==w||g.previewHeight!==h){g.previewRenderer.setSize(w,h,false);g.previewWidth=w;g.previewHeight=h;}renderer=g.previewRenderer;rect={left:0,top:0,bottom:h,width:w,height:h};}
 g.camera.aspect=rect.width/rect.height;const flying=g.lightingMode==='track';
 if(flying){
  const f=updateGarageFlight(g.flight,g.ship,g.camera,time,g.zoom),lightAt=(light,x,y,z)=>light.position.copy(f.point).addScaledVector(f.right,x).addScaledVector(f.up,y).addScaledVector(f.forward,z);
  lightAt(g.key,-3,4,1.5);lightAt(g.fill,3,1.7,-2);lightAt(g.rim,-.8,3,-3);
 }else{
  g.ship.rotation.set(g.pitch,g.yaw+(g.auto?Math.sin(time*.13)*.17:0),0);g.ship.position.set(0,.015+Math.sin(time*.65)*.007,0);
  g.camera.fov=35;g.camera.near=.1;g.camera.far=45;g.camera.up.set(0,1,0);const distance=(g.zoom?3.05:3.8)*Math.max(1,.78/g.camera.aspect);g.camera.position.set(0,distance*.25,distance);g.camera.lookAt(0,-.06,0);g.camera.updateProjectionMatrix();
 }
 animateCraft(g.ship,time,flying&&Math.sin(g.flight.elapsed*.45)>.8,1,0,!flying);
 const exposure=renderer.toneMappingExposure;renderer.toneMappingExposure=g.exposure;renderer.setRenderTarget(null);renderer.setScissorTest(false);renderer.setViewport(0,0,g.previewRenderer?rect.width:innerWidth,g.previewRenderer?rect.height:innerHeight);renderer.clear();renderer.setViewport(rect.left,g.previewRenderer?0:innerHeight-rect.bottom,rect.width,rect.height);renderer.setScissor(rect.left,g.previewRenderer?0:innerHeight-rect.bottom,rect.width,rect.height);renderer.setScissorTest(true);
 try{if(g.viewCockpit&&!flying){updateCockpit(g.cockpit,.033,{time,speed:0,energy:100,boost:false,lateral:0,vertical:0,lock:'FLIGHTWORKS / COCKPIT'}, {left:rect.width*.45,top:rect.height*.79,width:rect.width*.1,height:rect.width*.1},rect.width,rect.height);renderCockpit(g.cockpit,renderer);}else {renderer.render(g.activeScene||g.scene,g.camera);g.ship.userData.fleet162.rendered=true;}}finally{renderer.toneMappingExposure=exposure;renderer.setScissorTest(false);}
 if(typeof location!=='undefined'&&location.search.includes('shipqa=1')){window.__shiftlinePaintQA={...g.ship.userData.paint,rendered:true,model:g.ship.userData.fleet162.index,edition:g.ship.userData.fleet162.edition};window.__shiftlineFlightQA=flying?{...g.flight.qa,rendered:true,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}:{active:false};}
}
export function disposeGarage(g){
 if(!g)return;g.previewRenderer?.dispose();g.previewRenderer?.domElement?.remove();disposeCockpit(g.cockpit);disposeCraft(g.ship.parent||g.scene,g.ship);disposeGarageFlight(g.flight);g.scene.environment.dispose();g.key.shadow.map?.dispose();g.architecture.shadowTexture.dispose();const geometries=new Set(),materials=new Set();g.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])materials.add(m);});geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());g.scene.clear();if(typeof window!=='undefined')window.__shiftlineFlightQA={active:false};
}
