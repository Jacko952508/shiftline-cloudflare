import{createCockpit,updateCockpit,renderCockpit,disposeCockpit}from'./cockpit.js?v=86';
import * as THREE from 'three';
import{craft,animateCraft,disposeCraft}from'./race-craft.js?v=81';
import{hdrEnvironment,tuneTextureFiltering}from'./material-lab.js?v=38';
import{PAINT}from'./progress.js?v=72';
export function createGarage(p){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x071019);scene.environment=hdrEnvironment();scene.environmentIntensity=.65;
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(1.9,2,.12,80),new THREE.MeshStandardMaterial({color:0x17212d,metalness:.65,roughness:.75}));floor.position.y=-.52;floor.receiveShadow=true;scene.add(floor);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.87,.016,6,80),new THREE.MeshBasicMaterial({color:0x75ced7}));ring.rotation.x=Math.PI/2;ring.position.y=-.448;scene.add(ring);
 const key=new THREE.SpotLight(0xe3f3ff,65,20,.7,.8,2);key.position.set(-3,5,-3);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.025;scene.add(key,key.target);
 const rim=new THREE.DirectionalLight(0x83bfd6,2);rim.position.set(3,1,3);scene.add(rim,new THREE.HemisphereLight(0xa3bed1,0x17232d,1.2));
 const g={scene,key,ship:null,yaw:.55,pitch:.12,drag:null,auto:true,camera:new THREE.PerspectiveCamera(38,1,.1,40)};equipGarage(g,p);return g;
}
export function equipGarage(g,p){disposeCockpit(g.cockpit);g.cockpit=createCockpit(p.custom,p.craft,PAINT[p.color]||PAINT[0]);const previous=g.ship;g.ship=craft(g.scene,PAINT[p.color]||PAINT[0],p.craft,false,p.custom);if(previous)disposeCraft(g.scene,previous);tuneTextureFiltering(g.scene,4);}
export function renderGarage(g,renderer,rect,time){
 if(!rect||rect.width<1||rect.height<1||rect.bottom<0||rect.top>innerHeight)return;
 g.ship.rotation.set(g.pitch,g.yaw+(g.auto?Math.sin(time*.18)*.25:0),0);g.ship.position.y=Math.sin(time*.8)*.014;animateCraft(g.ship,time,false,1,0,true);
 g.camera.aspect=rect.width/rect.height;g.camera.position.set(0,1.2,5.8);g.camera.lookAt(0,-.03,0);g.camera.updateProjectionMatrix();
 renderer.setRenderTarget(null);renderer.setScissorTest?.(false);renderer.setViewport?.(0,0,innerWidth,innerHeight);renderer.clear?.();
 renderer.setViewport?.(rect.left,innerHeight-rect.bottom,rect.width,rect.height);renderer.setScissor?.(rect.left,innerHeight-rect.bottom,rect.width,rect.height);renderer.setScissorTest?.(true);
 try{if(g.viewCockpit){updateCockpit(g.cockpit,.033,{time,speed:0,energy:100,boost:false,lateral:Math.sin(time*.5)*2,vertical:Math.cos(time*.4),lock:'GARAGE / INSTRUMENT PREVIEW'}, {left:rect.width*.45,top:rect.height*.79,width:rect.width*.1,height:rect.width*.1},rect.width,rect.height);renderCockpit(g.cockpit,renderer);}else renderer.render(g.scene,g.camera)}finally{renderer.setScissorTest?.(false);renderer.setViewport?.(0,0,innerWidth,innerHeight)}
}
export function disposeGarage(g){if(!g)return;disposeCockpit(g.cockpit);disposeCraft(g.scene,g.ship);g.scene.environment.dispose();g.key.shadow.map?.dispose();const geometries=new Set(),materials=new Set();g.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material)});geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());g.scene.clear();}
