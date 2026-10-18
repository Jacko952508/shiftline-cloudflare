import{createCockpit,updateCockpit,renderCockpit,disposeCockpit}from'./cockpit.js?v=153';
import * as THREE from 'three';
import{craft,animateCraft,disposeCraft}from'./race-craft.js?v=161';
import{hdrEnvironment,tuneTextureFiltering}from'./material-lab.js?v=147';
import{PAINT}from'./progress.js?v=112';
// Real scene architecture rather than a flat colour behind the ship.
function installShowroomArchitecture(scene){
 const group=new THREE.Group();group.name='V161 / flightworks exhibition hangar';
 const metal=new THREE.MeshStandardMaterial({color:0x152430,metalness:.83,roughness:.38});
 const glow=new THREE.MeshBasicMaterial({color:0x58dcef,toneMapped:false});
 const rail=new THREE.MeshBasicMaterial({color:0x1c5d79,toneMapped:false});
 const pad=new THREE.Mesh(new THREE.CylinderGeometry(1.65,1.76,.055,96),metal);
 pad.position.y=-.415;group.add(pad);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1.67,.018,7,96),glow);
 rim.rotation.x=Math.PI/2;rim.position.y=-.38;group.add(rim);
 const inner=new THREE.Mesh(new THREE.TorusGeometry(1.19,.009,5,96),rail);
 inner.rotation.x=Math.PI/2;inner.position.y=-.383;group.add(inner);
 const tick=new THREE.InstancedMesh(new THREE.BoxGeometry(.027,.008,.15),glow,32);
 const dummy=new THREE.Object3D();
 for(let i=0;i<32;i++){
  const a=i*Math.PI*2/32;dummy.position.set(Math.cos(a)*1.46,-.378,Math.sin(a)*1.46);
  dummy.rotation.set(0,-a,0);dummy.updateMatrix();tick.setMatrixAt(i,dummy.matrix);
 }
 tick.instanceMatrix.needsUpdate=true;group.add(tick);
 const wall=new THREE.Mesh(new THREE.PlaneGeometry(5.1,2.75),new THREE.MeshStandardMaterial({color:0x0a1824,metalness:.25,roughness:.7,side:THREE.DoubleSide}));
 wall.position.set(0,.59,-2.28);group.add(wall);
 for(const side of[-1,1]){
  const pole=new THREE.Mesh(new THREE.BoxGeometry(.11,1.9,.13),metal);pole.position.set(side*2.17,.38,-1.97);group.add(pole);
  const strip=new THREE.Mesh(new THREE.BoxGeometry(.024,1.76,.04),glow);strip.position.set(side*2.14,.38,-1.87);group.add(strip);
  const wing=new THREE.Mesh(new THREE.BoxGeometry(.46,.026,.075),rail);wing.position.set(side*1.65,-.25,-1.85);wing.rotation.z=side*.15;group.add(wing);
 }
 group.position.y=-.03;scene.add(group);
 return {group,glow,rail};
}
export function createGarage(p){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x060f19);scene.environment=hdrEnvironment();scene.environmentIntensity=1.2;
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(1.9,2,.12,80),new THREE.MeshStandardMaterial({color:0x17212d,metalness:.65,roughness:.75}));floor.position.y=-.52;floor.receiveShadow=true;scene.add(floor);
 const deck=new THREE.Mesh(new THREE.RingGeometry(.78,1.78,96),new THREE.MeshBasicMaterial({color:0x12384b,side:THREE.DoubleSide,transparent:true,opacity:.39}));deck.rotation.x=-Math.PI/2;deck.position.y=-.451;scene.add(deck);
 const guide=new THREE.GridHelper(5.6,16,0x2b6275,0x142c3c);guide.position.y=-.455;guide.material.transparent=true;guide.material.opacity=.23;scene.add(guide);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.87,.016,6,80),new THREE.MeshBasicMaterial({color:0x75ced7}));ring.rotation.x=Math.PI/2;ring.position.y=-.448;scene.add(ring);
 const key=new THREE.SpotLight(0xfff8e9,82,20,.72,.78,2);key.position.set(-3,5,-3);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.025;scene.add(key,key.target);
 const rim=new THREE.DirectionalLight(0x83bfd6,2);rim.position.set(3,1,3);const ambient=new THREE.HemisphereLight(0xd4ecfc,0x17232d,1.5);scene.add(rim,ambient);
 const fill=new THREE.DirectionalLight(0xc6e9ff,2.6);fill.position.set(3,2,3);scene.add(fill);
 const back=new THREE.DirectionalLight(0xffffff,1.7);back.position.set(0,4,3);scene.add(back);
 const architecture=installShowroomArchitecture(scene);
 const g={scene,key,rim,ambient,fill,back,floor,ring,architecture,ship:null,yaw:.55,pitch:.12,drag:null,auto:true,zoom:false,lightingMode:'studio',camera:new THREE.PerspectiveCamera(36,1,.1,40)};equipGarage(g,p);setGarageLighting(g,'studio');return g;
}
export function equipGarage(g,p){disposeCockpit(g.cockpit);g.cockpit=createCockpit(p.custom,p.craft,PAINT[p.color]||PAINT[0],g.scene.environment);const previous=g.ship;g.ship=craft(g.scene,PAINT[p.color]||PAINT[0],p.craft,true,p.custom);if(previous)disposeCraft(g.scene,previous);g.ring.material.color.setHex(p.color===7?0xffda81:p.color===6?0xe8faff:p.color===8?0xffa6dc:0x75ced7);
 if(g.architecture){
  const accent=p.color===7?0xffda81:p.color===6?0xd9f8ff:p.color===8?0xff97cf:[0x59dbff,0xff536a,0x9bb7ff,0x83ffe8,0xffc776,0xc2abff][p.craft]||0x59dbff;
  g.architecture.glow.color.setHex(accent);
  g.architecture.rail.color.setHex(accent).multiplyScalar(.32);
 }tuneTextureFiltering(g.scene,4);}
export function setGarageLighting(g,mode='studio'){
 if(!g)return;
 const schemes={
  studio:{background:0x07131e,key:70,rim:2.25,fill:1.35,back:2.2,ambient:1.05,env:1.04,exposure:1.16,floor:0x12202c},
  night:{background:0x020610,key:28,rim:3.8,fill:.42,back:1.4,ambient:.62,env:.72,exposure:1.13,floor:0x0a111e},
  track:{background:0x1c3444,key:89,rim:2.1,fill:2.25,back:2.15,ambient:1.55,env:1.4,exposure:1.12,floor:0x1a3240}
 };
 const k=schemes[mode]||schemes.studio;
 g.lightingMode=schemes[mode]?mode:'studio';
 g.scene.background.setHex(k.background);
 g.scene.environmentIntensity=k.env;
 g.key.intensity=k.key;g.rim.intensity=k.rim;g.fill.intensity=k.fill;g.back.intensity=k.back;g.ambient.intensity=k.ambient;
 g.floor.material.color.setHex(k.floor);
 g.exposure=k.exposure;
 if(typeof location!=='undefined'&&location.search.includes('shipqa=1'))window.__shiftlineLightingQA={mode:g.lightingMode,exposure:g.exposure,ambient:g.ambient.intensity};
}
export function renderGarage(g,renderer,rect,time){
 // Render into a dedicated canvas INSIDE the showroom. The global race canvas sits
 // behind the menu and is not reliably visible on iOS WebKit.
 const host=document.querySelector('#craftDisplay');
 if(host&&!g.previewRenderer){try{const c=document.createElement('canvas');c.className='garage3DCanvas';c.setAttribute('aria-hidden','true');host.prepend(c);g.previewRenderer=new THREE.WebGLRenderer({canvas:c,alpha:true,antialias:true,powerPreference:'low-power'});g.previewRenderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));g.previewRenderer.toneMapping=THREE.ACESFilmicToneMapping;g.previewRenderer.toneMappingExposure=1.7;g.previewRenderer.outputColorSpace=THREE.SRGBColorSpace;}catch(e){console.warn('Dedicated garage renderer unavailable',e)}}
 if(g.previewRenderer){const w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));if(g.previewWidth!==w||g.previewHeight!==h){g.previewRenderer.setSize(w,h,false);g.previewWidth=w;g.previewHeight=h}renderer=g.previewRenderer;rect={left:0,top:0,bottom:h,width:w,height:h};}

 if(!rect||rect.width<1||rect.height<1||rect.bottom<0||rect.top>innerHeight)return;
 g.ship.rotation.set(g.pitch,g.yaw+(g.auto?Math.sin(time*.18)*.25:0),0);g.ship.position.y=Math.sin(time*.8)*.014;animateCraft(g.ship,time,false,1,0,true);
 g.camera.aspect=rect.width/rect.height;g.camera.position.set(0,g.zoom?.86:1.10,g.zoom?3.25:4.45);g.camera.lookAt(0,.02,0);g.camera.updateProjectionMatrix();
 const exposure=renderer.toneMappingExposure;renderer.toneMappingExposure=g.exposure||1.42;renderer.setRenderTarget(null);renderer.setScissorTest?.(false);renderer.setViewport?.(0,0,g.previewRenderer?rect.width:innerWidth,g.previewRenderer?rect.height:innerHeight);renderer.clear?.();
 renderer.setViewport?.(rect.left,g.previewRenderer?0:innerHeight-rect.bottom,rect.width,rect.height);renderer.setScissor?.(rect.left,g.previewRenderer?0:innerHeight-rect.bottom,rect.width,rect.height);renderer.setScissorTest?.(true);
 try{if(g.viewCockpit){updateCockpit(g.cockpit,.033,{time,speed:0,energy:100,boost:false,lateral:Math.sin(time*.5)*2,vertical:Math.cos(time*.4),lock:'GARAGE / INSTRUMENT PREVIEW'}, {left:rect.width*.45,top:rect.height*.79,width:rect.width*.1,height:rect.width*.1},rect.width,rect.height);renderCockpit(g.cockpit,renderer);}else renderer.render(g.scene,g.camera)}finally{renderer.toneMappingExposure=exposure;renderer.setScissorTest?.(false);renderer.setViewport?.(0,0,g.previewRenderer?rect.width:innerWidth,g.previewRenderer?rect.height:innerHeight)}
}
export function disposeGarage(g){if(!g)return;g.previewRenderer?.dispose();g.previewRenderer?.domElement?.remove();disposeCockpit(g.cockpit);disposeCraft(g.scene,g.ship);g.scene.environment.dispose();g.key.shadow.map?.dispose();const geometries=new Set(),materials=new Set();g.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material)});geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());g.scene.clear();}
