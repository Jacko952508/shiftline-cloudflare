import {clearOfFleetCamera} from '../public/fleet-camera-v162.js';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {craft,disposeCraft} from '../public/race-craft.js';
import {FLEET_EDITIONS,equipEdition,fleetEdition} from '../public/fleet-designs-v162.js';
import {appearance,modelUnlocked} from '../public/ship-catalog.js';
import {sealedLoft} from '../public/fleet-sculpture-v162.js';
import {shipAppearance} from '../public/ship-wire.js';

function closed(geo){
 const p=geo.attributes.position,ix=geo.index,edges=new Map(),directions=new Map(),point=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');
 for(let i=0;i<(ix?.count??p.count);i+=3){const tri=[0,1,2].map(k=>point(ix?ix.getX(i+k):i+k));for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3];if(a===b)continue;const key=[a,b].sort().join('/');edges.set(key,(edges.get(key)||0)+1);directions.set(key,(directions.get(key)||0)+(a<b?1:-1));}}
 return [...edges.values()].every(n=>n===2)&&[...directions.values()].every(n=>n===0);
}
const signatures=new Set(),palette=new Set(),lengths=Array.from({length:6},()=>new Set());
for(let model=0;model<6;model++)for(let edition=0;edition<3;edition++){
 const scene=new THREE.Scene(),p={craft:model,custom:{},color:0};equipEdition(p,edition);
 const ship=craft(scene,0xffffff,model,true,p.custom,{batchStatic:false}),root=ship.children[0],qa=ship.userData.fleet162;
 assert.equal(qa.edition,edition);assert.equal(qa.index,model);assert.ok(modelUnlocked({xp:0},model));
 ship.updateMatrixWorld(true);const bodyBounds=new THREE.Box3();root.traverse(o=>{if(o.userData.structural)bodyBounds.union(new THREE.Box3().setFromObject(o));});
 assert.ok(Math.abs((bodyBounds.max.x-bodyBounds.min.x)-2.08*.83)<.05,'Equal racing wingspans');
 const fingerprint=createHash('sha256');root.traverse(o=>{if(o.userData.structural)fingerprint.update(Buffer.from(o.geometry.attributes.position.array.buffer));});lengths[model].add(fingerprint.digest('hex'));
 let triangles=0;
 root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry;triangles+=(g.index?.count??g.attributes.position.count)/3;assert.ok([...g.attributes.position.array].every(Number.isFinite),'Finite geometry');if(g.userData.sealed)assert.ok(closed(g),'Closed manifold '+model+'/'+edition+'/'+o.name);});
 assert.ok(triangles<40000,'Mobile triangle budget');
 const structs=qa.structure.map(s=>({name:s.name,box:new THREE.Box3(new THREE.Vector3(...s.min),new THREE.Vector3(...s.max))})),seen=new Set([0]);
 for(let pass=0;pass<structs.length;pass++)for(let i=0;i<structs.length;i++)if(!seen.has(i)&&[...seen].some(j=>structs[i].box.intersectsBox(structs[j].box)))seen.add(i);
 assert.equal(seen.size,structs.length,'All structural components contact the airframe '+model+'/'+edition+': '+structs.filter((_,i)=>!seen.has(i)).map(s=>s.name));
 const fx=ship.userData.exhaustFX;assert.equal(fx.actors.length,2);fx.update(.5,true,false);assert.ok(fx.length>1.15);assert.equal(fx.colour,fleetEdition(model,p.custom).accent);
 assert.equal(shipAppearance(p).custom.edition,edition,'Edition survives network serialization');
 const legacy={...p.custom};delete legacy.edition;assert.equal(appearance(legacy).edition,edition,'Legacy relay livery retains edition');
 signatures.add(model+'/'+edition+'/'+FLEET_EDITIONS[model][edition].name);palette.add(FLEET_EDITIONS[model][edition].body);
 disposeCraft(scene,ship);assert.equal(scene.children.length,0);
}
assert.equal(signatures.size,18);assert.equal(palette.size,18);for(const forms of lengths)assert.equal(forms.size,3,'Three physically different editions per ship');assert.equal(appearance(null).edition,0);
assert.equal(clearOfFleetCamera(5,8,3.8),false,'A nacelle crossing the chase camera is hidden');assert.equal(clearOfFleetCamera(8,8,3.8),true);assert.equal(clearOfFleetCamera(8,8,3.8,true),false);assert.equal(clearOfFleetCamera(11,8,3.8,true),true);
assert.ok(closed(sealedLoft([[-1,.1,.1],[0,.3,.2],[1,.2,.1]])));
console.log('PASS V162: 18 editions; closed hulls, wings and fins; structural contact graph; finite geometry; equal spans; unique colours; exhaust anchors; wire compatibility.');
