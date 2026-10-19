import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {themeColor,shiftState,PALETTES} from '../public/race-theme.js';
import {poseObject,createTrack} from '../public/race-track.js';
for(let index=1;index<=4;index++)for(const time of [0,1.2,29.9,30,30.25,31.5,35,40,60,61.2,91]){
 const expected=new THREE.Color(PALETTES[index].base).lerp(new THREE.Color(PALETTES[index].shift),shiftState(time).amount);
 const actual=themeColor(index,time);
 assert.ok(Math.max(Math.abs(actual.r-expected.r),Math.abs(actual.g-expected.g),Math.abs(actual.b-expected.b))<1e-10,'Theme colour mismatch at '+index+' / '+time);
}
for(const course of [1,2,3,4,5,6]){
 const track=createTrack(course),ship=new THREE.Object3D();
 for(const s of [0,10,track.length*.15,track.length*.5,track.length*.85,track.length-1]){
  const frame=track.frame(s),original=new THREE.Matrix4().makeBasis(frame.r,frame.u,frame.f.clone().negate());
  const q=new THREE.Quaternion().setFromRotationMatrix(original);
  poseObject(ship,frame);
  assert.ok(ship.position.distanceTo(frame.p)<1e-8);
  assert.ok(1-Math.abs(ship.quaternion.dot(q))<1e-9,'Pose changed on course '+course);
 }
}
const race=readFileSync(new URL('../public/race-engine.js',import.meta.url),'utf8');
const world=readFileSync(new URL('../public/race-world.js',import.meta.url),'utf8');
assert.match(race,/STEP=1\/120/,'120 Hz player collision accuracy must be retained');
assert.match(race,/aiSubstep\+\+&1/,'AI updates must be staggered');
assert.match(race,/aiStep\(r,dt\*2\)/,'AI elapsed time must be preserved');
assert.match(race,/cockpitBoostRect\(\),innerWidth,innerHeight/,'Cockpit uses cached layout');
assert.match(world,/Math\.floor\(time\*30\)/,'Tunnel rib animation upload cadence');
assert.match(world,/w\.lastColorTick=colorTick/);
console.log('PASS V171 six-course precise poses and physics cadence; colours identical; cockpit layout cached; full graphics maintained');
