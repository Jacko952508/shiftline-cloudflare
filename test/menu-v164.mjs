import assert from 'node:assert/strict';
import {createMenuFlow,GAME_MODES} from '../public/menu-flow-v164.js';
import {createTrackDemo,advanceTrackDemo,frameTrackDemo} from '../public/track-demo-v164.js';
import {createTrack} from '../public/race-track.js';
import {specifications,collisionAt} from '../public/race-obstacles.js';
import * as THREE from 'three';

assert.deepEqual(GAME_MODES.map(m=>m.id),['race','trial','combat','tour']);
for(const mode of GAME_MODES)for(let course=1;course<=6;course++){
 const f=createMenuFlow();assert.equal(f.state.screen,'home');f.solo();assert.equal(f.state.screen,'modes');f.mode(mode.id);assert.equal(f.state.screen,'levels');f.level(course);assert.deepEqual(f.state,{screen:'demo',mode:mode.id,course});f.back();assert.equal(f.state.screen,'levels');assert.equal(f.state.mode,mode.id);f.back();assert.equal(f.state.screen,'modes');f.back();assert.equal(f.state.screen,'home');f.garage();assert.equal(f.state.screen,'garage');f.back();assert.equal(f.state.screen,'home');
}
const flow=createMenuFlow();flow.solo();flow.mode('invalid');assert.equal(flow.state.mode,'race');flow.level(7);assert.equal(flow.state.screen,'levels');
let hits=0;
for(let course=1;course<=6;course++){
 const track=createTrack(course),obstacles=specifications(course,track.length);obstacles.forEach(o=>o.frame=track.frame(o.s));
 const d=createTrackDemo(track,obstacles),ship=new THREE.Group(),camera=new THREE.PerspectiveCamera(70,430/932,.15,14000),seen=new Set();
 for(let i=0;i<Math.ceil(track.length/60*30);i++){
  advanceTrackDemo(d,1/30);frameTrackDemo(d,ship,camera,1/30);
  assert.ok([...ship.position.toArray(),...camera.position.toArray(),d.x,d.y].every(Number.isFinite));assert.ok(Math.hypot(d.x,d.y)<6.1);assert.ok(ship.position.distanceTo(camera.position)>2.5);
  const hit=collisionAt(track,obstacles,d.distance,d.x,d.y,d.time,ship.userData.flight?.roll||0);if(hit)seen.add(hit.id);
 }
 hits+=seen.size;console.log('Demo course '+course+': '+obstacles.length+' hazards, '+seen.size+' crossed hazard contacts');
 const time=d.time;advanceTrackDemo(d,NaN);assert.equal(d.time,time);advanceTrackDemo(d,100);assert.ok(d.time-time<=.10001);
}
assert.equal(hits,0,'Demonstration flight clears actual moving obstacles');
console.log('PASS V164: isolated home/mode/level/demo navigation, all four modes and six tracks, continuous safe autopilot and chase camera.');
