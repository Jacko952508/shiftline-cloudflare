import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createTrack,createTrackFrame,poseObject} from '../public/race-track.js';
import {specifications,obstacleState,collisionAt,BODY,localDistance} from '../public/race-obstacles.js';
import {freezeWorld} from '../public/scene-performance.js';

// Independent V174 interpolation and collision oracle. Probe curved sections,
// loops, endpoints and the complete banked body, not just centreline travel.
function referenceFrame(track,s){
 const n=track.frames.length-1,z=THREE.MathUtils.clamp(s/track.step,0,n),i=Math.min(n-1,Math.floor(z)),k=z-i;
 const A=track.frames[i],B=track.frames[i+1],f=A.f.clone().lerp(B.f,k).normalize(),u=A.u.clone().lerp(B.u,k).normalize();
 u.addScaledVector(f,-u.dot(f)).normalize();const r=new THREE.Vector3().crossVectors(f,u).normalize();
 return{p:A.p.clone().lerp(B.p,k),f,r,u:new THREE.Vector3().crossVectors(r,f).normalize()};
}
function referenceCollision(track,specs,s,x,y,time,bank){
 const F=referenceFrame(track,s),center=F.p.clone().addScaledVector(F.r,x).addScaledVector(F.u,y),c=Math.cos(bank),si=Math.sin(bank);
 for(const o of specs){
  if(Math.abs(o.s-s)>10)continue;
  const O=o.frame,state=obstacleState(o,time);
  for(const b of BODY){
   const p=center.clone().addScaledVector(F.r,b.x*c-b.y*si).addScaledVector(F.u,b.x*si+b.y*c).addScaledVector(F.f,-b.z).sub(O.p);
   if(localDistance(o,state,p.dot(O.r),p.dot(O.u),-p.dot(O.f))-b.r<0)return o.id;
  }
 }
 return null;
}
let poses=0,collisions=0,states=0;
for(let course=1;course<=6;course++){
 const track=createTrack(course),out=createTrackFrame(),point=new THREE.Vector3(),specs=specifications(course,track.length);
 const owned=track.frame(track.length*.4),saved=owned.p.clone();track.frame(track.length*.6);
 assert.deepEqual(owned.p,saved,'Default frame calls must retain independent ownership');
 for(let i=-1;i<=240;i++){
  const s=track.length*i/240,F=referenceFrame(track,s),actual=track.frame(s,out);
  assert.equal(actual,out);
  for(const key of ['p','f','r','u'])assert.ok(actual[key].distanceTo(F[key])<1e-12,'Frame mismatch '+course+'/'+s+'/'+key);
  const x=Math.sin(i)*4,y=Math.cos(i)*3,expected=F.p.clone().addScaledVector(F.r,x).addScaledVector(F.u,y);
  assert.equal(track.pose(s,x,y,point),point);assert.ok(point.distanceTo(expected)<1e-12);
  const ship=new THREE.Object3D();poseObject(ship,actual,x,y);assert.ok(ship.position.distanceTo(expected)<1e-12);poses++;
 }
 for(const o of specs){
  o.frame=track.frame(o.s);const reusable={};let pieces;
  for(const t of [0,.13,17.2,43.7]){
   const fresh=obstacleState(o,t),actual=obstacleState(o,t,reusable);
   assert.equal(actual,reusable);for(const key of ['x','y','a','scale','cycle'])assert.equal(actual[key],fresh[key]);
   assert.deepEqual(actual.pieces,fresh.pieces);if(pieces)assert.equal(actual.pieces,pieces);pieces=actual.pieces;states++;
  }
  for(let probe=0;probe<12;probe++){
   const s=o.s+(probe%4-1.5)*2.1,x=Math.sin(probe*2.7+o.id)*5,y=Math.cos(probe*1.9)*3,time=probe*3.7,bank=Math.sin(probe)*.44;
   assert.equal(collisionAt(track,specs,s,x,y,time,bank)?.id??null,referenceCollision(track,specs,s,x,y,time,bank),'Changed collision '+course+'/'+o.id+'/'+probe);collisions++;
  }
 }
}

const scene=new THREE.Scene(),root=new THREE.Group(),dynamic=new THREE.Group();scene.add(root);root.add(dynamic);
root.position.set(3,2,-7);dynamic.position.set(1,4,2);const leaf=new THREE.Object3D();leaf.position.set(2,1,3);dynamic.add(leaf);
freezeWorld(root,[dynamic]);scene.updateMatrixWorld(true);const expected=new THREE.Vector3(6,7,-2);assert.ok(leaf.getWorldPosition(new THREE.Vector3()).distanceTo(expected)<1e-12);
// Hide, move the ancestor, then reveal: a skipped subtree must not keep stale
// transforms even when every descendant has a baked local matrix.
dynamic.visible=false;root.position.x+=9;root.updateMatrix();scene.updateMatrixWorld(true);
dynamic.visible=true;scene.updateMatrixWorld();assert.ok(leaf.getWorldPosition(new THREE.Vector3()).distanceTo(expected.add(new THREE.Vector3(9,0,0)))<1e-12);
dynamic.position.z+=5;scene.updateMatrixWorld();assert.equal(leaf.matrixWorld.elements[14],3,'Visible moving assemblies must still animate');

const counts={baseline:0,candidate:0};
for(const optimized of [false,true]){
 const world=new THREE.Group();for(let i=0;i<100;i++){const g=new THREE.Group();for(let j=0;j<40;j++)g.add(new THREE.Object3D());g.visible=i<8;world.add(g);}
 if(optimized)freezeWorld(world,[]);
 world.traverse(o=>{const original=o.updateMatrixWorld;o.updateMatrixWorld=function(force){counts[optimized?'candidate':'baseline']++;return original.call(this,force);};});
 world.updateMatrixWorld(true);
}
assert.ok(counts.candidate<counts.baseline*.15,'Hidden course branches still consume transform traversal');
console.log('PASS V175 '+poses+' exact six-course poses, '+collisions+' banked collision probes, '+states+' reusable hazard states; hidden transform visits '+counts.baseline+' -> '+counts.candidate+'; reveal and moving-parent safety');
