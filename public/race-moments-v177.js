import * as THREE from 'three';
import {poseObject,createTrackFrame} from './race-track.js?v=175';
import {courseSectors} from './race-sectors-v176.js?v=176';
import {freezeWorld} from './scene-performance.js?v=175';
export const MOMENTS={
 1:{names:['GYRO DOCK','HELIX IGNITION'],color:0x86eaff,metal:0x59758b,kind:'gyro'},
 2:{names:['PRESSURE CATHEDRAL','TIDAL HEART'],color:0x73e5cf,metal:0x3d6767,kind:'tidal'},
 3:{names:['FORGE HAMMERS','FURNACE HEART'],color:0xffae73,metal:0x72524b,kind:'forge'},
 4:{names:['STORM HARVEST','THUNDER CROWN'],color:0xa6d5ff,metal:0x718292,kind:'storm'},
 5:{names:['ROOT CATHEDRAL','VERDANT HEART'],color:0xbdeaa0,metal:0x5a7250,kind:'roots'},
 6:{names:['EXCAVATION ARRAY','LUNAR CORE'],color:0xc9b9ff,metal:0x6b6680,kind:'drill'}
};
// Each moment is a shallow exterior assembly. The nearest solid stays outside
// the 7.4m racing tube; no new collider, light, transparency or screen pass.
function partsFor(course,number){const parts=[],add=(x,y,z,sx,sy,sz,a=0)=>parts.push({x,y,z,sx,sy,sz,a});
 const count=course===4?12:course===5?16:course===6?18:12;
 for(let k=0;k<count;k++){const a=k*Math.PI*2/count,rad=course===5?14.6:14;
  if(course===2){add(Math.cos(a)*rad,Math.sin(a)*rad,0,1.25,4.4,1.2,a);add(Math.cos(a)*rad,Math.sin(a)*rad,-2,1.8,.45,1.7,a);}
  else if(course===3)add(Math.cos(a)*rad,Math.sin(a)*rad,0,2.4,2,2.2,a+Math.PI/4);
  else if(course===4)add(Math.cos(a)*rad,Math.sin(a)*rad,0,.48,6,1.1,a);
  else if(course===5)add(Math.cos(a)*rad,Math.sin(a)*rad,0,1.1,5,1.4,a+.36*Math.sin(k));
  else if(course===6)add(Math.cos(a)*rad,Math.sin(a)*rad,0,2.4,2.3,1.3,a+Math.PI/3);
  else {add(Math.cos(a)*rad,Math.sin(a)*rad,0,1.5,5,1.4,a);if(k%3===0)add(Math.cos(a)*19,Math.sin(a)*19,0,4.8,1.3,2,a);}
 }if(number)for(const p of parts){p.x*=1.04;p.y*=1.04;p.a+=.08;}return parts;}
function assembly(course,number){const profile=MOMENTS[course],root=new THREE.Group(),rotor=new THREE.Group();root.add(rotor);root.name=profile.names[number];const material=new THREE.MeshStandardMaterial({color:profile.metal,metalness:course===5?.18:.78,roughness:course===5?.87:.51}),glow=new THREE.MeshBasicMaterial({color:profile.color,toneMapped:false}),geo=course===5?new THREE.CylinderGeometry(.7,1,1,6):new THREE.BoxGeometry(1,1,1),parts=partsFor(course,number),frame=new THREE.Object3D(),mesh=new THREE.InstancedMesh(geo,material,parts.length);
 for(let i=0;i<parts.length;i++){const p=parts[i];frame.position.set(p.x,p.y,p.z);frame.scale.set(p.sx,p.sy,p.sz);frame.rotation.set(0,0,p.a);frame.updateMatrix();mesh.setMatrixAt(i,frame.matrix);}mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();rotor.add(mesh);
 const ringGeo=new THREE.TorusGeometry(course===5?17.3:16.5,course===5?.4:.18,6,course===5?48:64,course===4?Math.PI*1.7:Math.PI*2),ring=new THREE.Mesh(ringGeo,glow);root.add(ring);ring.position.z=1.7;
 const innerGeo=new THREE.TorusGeometry(11.1,.1,5,64,Math.PI*(course===3?1.6:1.9)),inner=new THREE.Mesh(innerGeo,glow);inner.position.z=-1.4;rotor.add(inner);root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=false;o.userData.nonCollidingEnvironment=true;}});freezeWorld(root,[rotor]);return{root,rotor,ring,inner,parts,geometry:[geo,ringGeo,innerGeo],materials:[material,glow],speed:course===5?.012:course===2?.035:course===3?-.06:course===4?.09:.055};}
function minimumClearance(root,track){
 // Conservative swept annulus, including every rotor angle. Sampling the
 // entire course also catches neighbouring loops, not just the local centreline.
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),p=new THREE.Vector3(),frame=createTrackFrame();let minimum=Infinity;
 for(let s=0;s<=track.length;s+=2){p.copy(track.frame(s,frame).p).applyMatrix4(inverse);const radial=Math.hypot(p.x,p.y),dr=Math.max(10.5-radial,radial-23,0),dz=Math.max(Math.abs(p.z)-3,0);minimum=Math.min(minimum,Math.hypot(dr,dz));}return minimum;
}
export function attachRaceMoments(world,track,course){const root=new THREE.Group(),sites=[],sectors=courseSectors(course,track.length);root.name='SIGNATURE TRACK MOMENTS';world.root.add(root);for(const [number,index]of [1,3].entries()){const sector=sectors[index],site=assembly(course,number);let accepted=false;for(const offset of [0,70,-70,140,-140]){site.s=sector.start+(sector.end-sector.start)*.48+offset;poseObject(site.root,track.frame(site.s));site.root.updateMatrix();root.add(site.root);site.clearance=minimumClearance(site.root,track);if(site.clearance>=9){accepted=true;break;}}if(!accepted){site.root.removeFromParent();site.geometry.forEach(g=>g.dispose());site.materials.forEach(m=>m.dispose());continue;}site.name=MOMENTS[course].names[number];site.root.visible=false;sites.push(site);}world.raceMoments={root,sites};return world;}
export function updateRaceMoments(world,distance,time,reduced=false){for(const site of world.raceMoments?.sites||[]){site.root.visible=site.s>distance-75&&site.s<distance+Math.min(world.renderAhead||585,480);if(!site.root.visible)continue;site.rotor.rotation.z=reduced||world.lowDetail?0:time*site.speed;}}
export function disposeRaceMoments(world){const moments=world.raceMoments;if(!moments)return;moments.root.removeFromParent();for(const site of moments.sites){site.geometry.forEach(g=>g.dispose());site.materials.forEach(m=>m.dispose());}world.raceMoments=null;}
