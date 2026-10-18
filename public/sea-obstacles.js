import{seaSpecifications as sharedSeaSpecifications,seaState as sharedSeaState}from'./course-colliders.js?v=156';
export function seaSpecifications(length){return sharedSeaSpecifications(length)}
export function seaState(o,time){return sharedSeaState(o,time)}
import{acquirePBR}from'./material-lab.js?v=38';
import * as THREE from 'three';
import{shiftState}from'./race-theme.js';
export function seaMaterial(o){const organic=o.kind==='reef',maps=acquirePBR(organic?'coral':'metal');o.materialKind=organic?'coral':'metal';return new THREE.MeshPhysicalMaterial({...maps,normalScale:new THREE.Vector2(.35,.35),color:organic?0xb39b87:0x6a9f98,metalness:organic?.08:.8,roughness:organic?1:.85,clearcoat:organic?.1:.2,clearcoatRoughness:.4,anisotropy:organic?0:.2,emissive:0x123f3b,emissiveIntensity:.12})}
export function seaDetail(o,mesh,p){if(p.type==='torus'){const tube=new THREE.Mesh(new THREE.TorusGeometry(p.R,p.tube*(p.R<=2.5?.44:.28),8,72),new THREE.MeshBasicMaterial({color:new THREE.Color(0x7df2d5).multiplyScalar(2.4),toneMapped:false}));tube.position.z=p.tube*.94;mesh.add(tube);tube.material.userData.smallRing=p.R<=2.5;o.trim.push(tube.material)}else if(p.type==='polygon'){const e=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,35),new THREE.LineBasicMaterial({color:new THREE.Color(0x7df2d5).multiplyScalar(3),transparent:true,opacity:1,toneMapped:false}));mesh.add(e);o.trim.push(e.material)}}

export function seaObstacleColor(o,time,color){return color.setHex([0,0x58d6d2,0x72d8b4,0x739bea,0x93e2c1][o.theme]).lerp(new THREE.Color(0xb0efab),shiftState(time).amount*.4)}
