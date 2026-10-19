import * as THREE from 'three';
import {planTarget} from './race-obstacles.js?v=161';
import {poseObject} from './race-track.js?v=58';
import {flightAttitude} from './race-craft.js?v=163';
import {chaseProfile} from './race-sightlines-v158.js?v=158';

export function createTrackDemo(track,obstacles){return{track,obstacles,distance:8,time:0,x:0,y:0,vx:0,vy:0,bank:0,target:{x:0,y:0},think:0,speed:60,laps:0};}
export function advanceTrackDemo(d,dt){
 dt=THREE.MathUtils.clamp(Number.isFinite(dt)?dt:0,0,.1);
 // Small fixed steps keep the flight and obstacle prediction consistent on
 // slow phones, display rotation, and a resumed browser tab.
 const steps=Math.max(1,Math.ceil(dt*60)),step=dt/steps;
 for(let i=0;i<steps;i++){
  d.time+=step;d.think-=step;
  const next=d.obstacles.find(o=>o.s>d.distance-2&&o.s<d.distance+255);
  if(d.think<=0){d.think=.10;d.target=next?(planTarget(next,d.time+Math.max(0,next.s-d.distance)/d.speed,d.x,d.y)||d.target):{x:Math.sin(d.time*.3)*.4,y:Math.sin(d.time*.21)*.25};}
  d.vx+=(d.target.x-d.x)*70*step;d.vy+=(d.target.y-d.y)*70*step;d.vx*=Math.exp(-14*step);d.vy*=Math.exp(-14*step);d.x+=d.vx*step;d.y+=d.vy*step;d.distance+=d.speed*step;
  if(d.distance>=d.track.length-12){d.distance=8;d.x=d.y=d.vx=d.vy=0;d.target={x:0,y:0};d.think=0;d.laps++;}
 }
 return d;
}
export function frameTrackDemo(d,ship,camera,dt,reduced=false){
 const F=d.track.frame(d.distance);poseObject(ship,F);ship.position.copy(d.track.pose(d.distance,d.x,d.y));flightAttitude(ship,d.vx,d.vy,dt,reduced?0:null);
 const profile=chaseProfile(camera.aspect,false,false,{});camera.fov=camera.aspect<.8?76:70;camera.near=.15;camera.far=14000;
 camera.position.copy(d.track.pose(Math.max(0,d.distance-profile.distance),d.x*.7,profile.height+d.y*.7));camera.up.copy(F.u);camera.lookAt(d.track.pose(Math.min(d.track.length,d.distance+12),d.x*.72,d.y*.72));camera.updateProjectionMatrix();
 return{course:d.track.course,distance:d.distance,time:d.time,laps:d.laps,position:ship.position.toArray(),camera:camera.position.toArray(),aspect:camera.aspect,reduced};
}
