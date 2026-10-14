import{createCockpit,updateCockpit,renderCockpit,disposeCockpit}from'./cockpit.js?v=110';
import * as THREE from 'three';
import{craft,animateCraft,disposeCraft}from'./race-craft.js?v=118';
import{hdrEnvironment,tuneTextureFiltering}from'./material-lab.js?v=38';
import{PAINT}from'./progress.js?v=112';
export function createGarage(p){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x060f19);scene.environment=hdrEnvironment();scene.environmentIntensity=1.2;
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(1.9,2,.12,80),new THREE.MeshStandardMaterial({color:0x17212d,metalness:.65,roughness:.75}));floor.position.y=-.52;floor.receiveShadow=true;scene.add(floor);
 const deck=new THREE.Mesh(new THREE.RingGeometry(.78,1.78,96),new THREE.MeshBasicMaterial({color:0x12384b,side:THREE.DoubleSide,transparent:true,opacity:.39}));deck.rotation.x=-Math.PI/2;deck.position.y=-.451;scene.add(deck);
 const guide=new THREE.GridHelper(5.6,16,0x2b6275,0x142c3c);guide.position.y=-.455;guide.material.transparent=true;guide.material.opacity=.23;scene.add(guide);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.87,.016,6,80),new THREE.MeshBasicMaterial({color:0x75ced7}));ring.rotation.x=Math.PI/2;ring.position.y=-.448;scene.add(ring);
 const key=new THREE.SpotLight(0xfff8e9,82,20,.72,.78,2);key.position.set(-3,5,-3);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.025;scene.add(key,key.target);
 const rim=new THREE.DirectionalLight(0x83bfd6,2);rim.position.set(3,1,3);scene.add(rim,new THREE.HemisphereLight(0xd4ecfc,0x17232d,1.5));
 const fill=new THREE.DirectionalLight(0xc6e9ff,2.6);fill.position.set(3,2,3);scene.add(fill);
 const back=new THREE.DirectionalLight(0xffffff,1.7);back.position.set(0,4,3);scene.add(back);
 const g={scene,key,ring,ship:null,yaw:.55,pitch:.12,drag:null,auto:true,zoom:false,camera:new THREE.PerspectiveCamera(38,1,.1,40)};equipGarage(g,p);return g;
}
export function equipGarage(g,p){disposeCockpit(g.cockpit);g.cockpit=createCockpit(p.custom,p.craft,PAINT[p.color]||PAINT[0],g.scene.environment);const previous=g.ship;g.ship=craft(g.scene,PAINT[p.color]||PAINT[0],p.craft,true,p.custom);if(previous)disposeCraft(g.scene,previous);g.ring.material.color.setHex(p.color===7?0xffda81:p.color===6?0xe8faff:p.color===8?0xffa6dc:0x75ced7);tuneTextureFiltering(g.scene,4);}
export function renderGarage(g,renderer,rect,time){
 // Render into a dedicated canvas INSIDE the showroom. The global race canvas sits
 // behind the menu and is not reliably visible on iOS WebKit.
 const host=document.querySelector('#craftDisplay');
 if(host&&!g.previewRenderer){try{const c=document.createElement('canvas');c.className='garage3DCanvas';c.setAttribute('aria-hidden','true');host.prepend(c);g.previewRenderer=new THREE.WebGLRenderer({canvas:c,alpha:true,antialias:true,powerPreference:'low-power'});g.previewRenderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));g.previewRenderer.toneMapping=THREE.ACESFilmicToneMapping;g.previewRenderer.toneMappingExposure=1.7;g.previewRenderer.outputColorSpace=THREE.SRGBColorSpace;}catch(e){console.warn('Dedicated garage renderer unavailable',e)}}
 if(g.previewRenderer){const w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));if(g.previewWidth!==w||g.previewHeight!==h){g.previewRenderer.setSize(w,h,false);g.previewWidth=w;g.previewHeight=h}renderer=g.previewRenderer;rect={left:0,top:0,bottom:h,width:w,height:h};}

 if(!rect||rect.width<1||rect.height<1||rect.bottom<0||rect.top>innerHeight)return;
 g.ship.rotation.set(g.pitch,g.yaw+(g.auto?Math.sin(time*.18)*.25:0),0);g.ship.position.y=Math.sin(time*.8)*.014;animateCraft(g.ship,time,false,1,0,true);
 g.camera.aspect=rect.width/rect.height;g.camera.position.set(0,g.zoom?.9:1.18,g.zoom?3.55:5.0);g.camera.lookAt(0,-.02,0);g.camera.updateProjectionMatrix();
 const exposure=renderer.toneMappingExposure;renderer.toneMappingExposure=1.42;renderer.setRenderTarget(null);renderer.setScissorTest?.(false);renderer.setViewport?.(0,0,g.previewRenderer?rect.width:innerWidth,g.previewRenderer?rect.height:innerHeight);renderer.clear?.();
 renderer.setViewport?.(rect.left,g.previewRenderer?0:innerHeight-rect.bottom,rect.width,rect.height);renderer.setScissor?.(rect.left,g.previewRenderer?0:innerHeight-rect.bottom,rect.width,rect.height);renderer.setScissorTest?.(true);
 try{if(g.viewCockpit){updateCockpit(g.cockpit,.033,{time,speed:0,energy:100,boost:false,lateral:Math.sin(time*.5)*2,vertical:Math.cos(time*.4),lock:'GARAGE / INSTRUMENT PREVIEW'}, {left:rect.width*.45,top:rect.height*.79,width:rect.width*.1,height:rect.width*.1},rect.width,rect.height);renderCockpit(g.cockpit,renderer);}else renderer.render(g.scene,g.camera)}finally{renderer.toneMappingExposure=exposure;renderer.setScissorTest?.(false);renderer.setViewport?.(0,0,g.previewRenderer?rect.width:innerWidth,g.previewRenderer?rect.height:innerHeight)}
}
export function disposeGarage(g){if(!g)return;g.previewRenderer?.dispose();g.previewRenderer?.domElement?.remove();disposeCockpit(g.cockpit);disposeCraft(g.scene,g.ship);g.scene.environment.dispose();g.key.shadow.map?.dispose();const geometries=new Set(),materials=new Set();g.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material)});geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());g.scene.clear();}
