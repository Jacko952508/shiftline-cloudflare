import * as THREE from 'three';
import {appearance,SHIP_SCALE} from './ship-catalog.js?v=163';
import {buildFleetSculpture} from './fleet-sculpture-v162.js?v=163';
export function craft(scene,color=0x72efff,variant=0,lit=true,custom={},options={}){
 const ship=new THREE.Group();variant=Math.max(0,Math.min(5,variant|0));
 ship.userData.flames=[];ship.userData.rotors=[];ship.userData.materialKinds=[];
 buildFleetSculpture(ship,variant,appearance(custom),lit,options);
 ship.scale.setScalar(SHIP_SCALE);scene.add(ship);return ship;
}
export function animateCraft(ship,time,boost,course=1,s=0,reduced=false){ship.userData.exhaustFX?.update(time,boost,reduced);}
export function disposeCraft(scene,ship){
 if(!ship)return;scene.remove(ship);const geometry=new Set(),materials=new Set();
 ship.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])materials.add(m);});
 for(const m of ship.userData.sculptMaterials||[])materials.add(m);
 geometry.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());ship.clear();
}

// Ship nose points down local -Z: positive X rotation raises it; negative
// Z rotation lowers the right wing. The track basis handles loops independently.
export function steeringBank(current,lateral,dt){const target=THREE.MathUtils.clamp(-lateral*.105,-.44,.44);return current+(target-current)*(1-Math.exp(-Math.min(.1,Math.max(0,dt))*16));}
export function flightAttitude(g,lateral,vertical,dt,physicalBank=null){const a=g.userData.flight||(g.userData.flight={pitch:0,roll:0});const k=1-Math.exp(-Math.min(.1,Math.max(0,dt))*10);a.pitch+=(THREE.MathUtils.clamp(vertical*.055,-.28,.28)-a.pitch)*k;a.roll=physicalBank===null?steeringBank(a.roll,lateral,dt):physicalBank;g.rotateZ(a.roll);g.rotateX(a.pitch);return a;}
