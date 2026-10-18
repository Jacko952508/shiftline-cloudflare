import * as THREE from 'three';
import {createCockpit,updateCockpit,renderCockpit,disposeCockpit} from './cockpit.js?v=162';
import {craft,animateCraft,disposeCraft} from './race-craft.js?v=162';
import {hdrEnvironment,tuneTextureFiltering} from './material-lab.js?v=147';
import {fleetEdition} from './fleet-designs-v162.js?v=162';
import {PAINT} from './progress.js?v=162';

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
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x101a24);scene.environment=hdrEnvironment();scene.environmentIntensity=1;
 const key=new THREE.DirectionalLight(0xfff2de,3.1);key.position.set(-3,4,2);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=3;key.shadow.camera.bottom=-3;key.shadow.normalBias=.018;
 const fill=new THREE.DirectionalLight(0xc0d9ef,1.45);fill.position.set(3,1.7,2.5);
 const rim=new THREE.DirectionalLight(0xe0f6ff,3.3);rim.position.set(-.8,3,-3);
 const ambient=new THREE.HemisphereLight(0xe1eaf1,0x263444,1.05);scene.add(key,fill,rim,ambient);
 const architecture=installShowroomArchitecture(scene);
 const g={scene,key,fill,rim,ambient,architecture,floor:architecture.floor,ship:null,yaw:2.62,pitch:.08,drag:null,auto:true,zoom:false,lightingMode:'studio',camera:new THREE.PerspectiveCamera(35,1,.1,45)};
 equipGarage(g,p);setGarageLighting(g,'studio');return g;
}
export function equipGarage(g,p){
 const design=fleetEdition(p.craft,p.custom);disposeCockpit(g.cockpit);g.cockpit=createCockpit(p.custom,p.craft,design.accent,g.scene.environment);
 const previous=g.ship;g.ship=craft(g.scene,PAINT[p.color]||PAINT[0],p.craft,true,p.custom);if(previous)disposeCraft(g.scene,previous);
 g.architecture.glow.color.setHex(design.accent).multiplyScalar(.64);g.architecture.rail.color.setHex(design.accent).multiplyScalar(.21);tuneTextureFiltering(g.scene,4);
}
export function setGarageLighting(g,mode='studio'){
 if(!g)return;const modes={studio:{background:0x101a24,key:3.1,fill:1.45,rim:3.3,ambient:1.05,env:1.04,exposure:1.14},night:{background:0x060d17,key:1.45,fill:.55,rim:3.9,ambient:.62,env:.78,exposure:1.12},track:{background:0x223848,key:3.7,fill:1.9,rim:2.7,ambient:1.3,env:1.2,exposure:1.12}};
 const s=modes[mode]||modes.studio;g.lightingMode=modes[mode]?mode:'studio';g.scene.background.setHex(s.background);g.scene.environmentIntensity=s.env;for(const light of['key','fill','rim','ambient'])g[light].intensity=s[light];g.exposure=s.exposure;
 if(typeof location!=='undefined'&&location.search.includes('shipqa=1'))window.__shiftlineLightingQA={mode:g.lightingMode,exposure:g.exposure};
}
export function renderGarage(g,renderer,rect,time){
 const host=document.querySelector('#craftDisplay');
 if(host&&!g.previewRenderer){try{const c=document.createElement('canvas');c.className='garage3DCanvas';c.setAttribute('aria-hidden','true');host.prepend(c);g.previewRenderer=new THREE.WebGLRenderer({canvas:c,alpha:false,antialias:true,powerPreference:'low-power'});g.previewRenderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));g.previewRenderer.outputColorSpace=THREE.SRGBColorSpace;g.previewRenderer.toneMapping=THREE.ACESFilmicToneMapping;g.previewRenderer.shadowMap.enabled=true;g.previewRenderer.shadowMap.type=THREE.PCFSoftShadowMap;}catch(e){console.warn('Garage renderer unavailable',e);}}
 if(!rect||rect.width<1||rect.height<1||rect.bottom<0||rect.top>innerHeight)return;
 if(g.previewRenderer){const w=Math.round(rect.width),h=Math.round(rect.height);if(g.previewWidth!==w||g.previewHeight!==h){g.previewRenderer.setSize(w,h,false);g.previewWidth=w;g.previewHeight=h;}renderer=g.previewRenderer;rect={left:0,top:0,bottom:h,width:w,height:h};}
 g.ship.rotation.set(g.pitch,g.yaw+(g.auto?Math.sin(time*.13)*.17:0),0);g.ship.position.y=.015+Math.sin(time*.65)*.007;animateCraft(g.ship,time,false,1,0,true);
 g.camera.aspect=rect.width/rect.height;const distance=(g.zoom?3.6:4.65)*Math.max(1,.78/g.camera.aspect);g.camera.position.set(0,distance*.25,distance);g.camera.lookAt(0,-.06,0);g.camera.updateProjectionMatrix();
 const exposure=renderer.toneMappingExposure;renderer.toneMappingExposure=g.exposure;renderer.setRenderTarget(null);renderer.setScissorTest(false);renderer.setViewport(0,0,g.previewRenderer?rect.width:innerWidth,g.previewRenderer?rect.height:innerHeight);renderer.clear();renderer.setViewport(rect.left,g.previewRenderer?0:innerHeight-rect.bottom,rect.width,rect.height);renderer.setScissor(rect.left,g.previewRenderer?0:innerHeight-rect.bottom,rect.width,rect.height);renderer.setScissorTest(true);
 try{if(g.viewCockpit){updateCockpit(g.cockpit,.033,{time,speed:0,energy:100,boost:false,lateral:0,vertical:0,lock:'FLIGHTWORKS / COCKPIT'}, {left:rect.width*.45,top:rect.height*.79,width:rect.width*.1,height:rect.width*.1},rect.width,rect.height);renderCockpit(g.cockpit,renderer);}else renderer.render(g.scene,g.camera);}finally{renderer.toneMappingExposure=exposure;renderer.setScissorTest(false);}
}
export function disposeGarage(g){
 if(!g)return;g.previewRenderer?.dispose();g.previewRenderer?.domElement?.remove();disposeCockpit(g.cockpit);disposeCraft(g.scene,g.ship);g.scene.environment.dispose();g.key.shadow.map?.dispose();g.architecture.shadowTexture.dispose();const geometries=new Set(),materials=new Set();g.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])materials.add(m);});geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());g.scene.clear();
}
