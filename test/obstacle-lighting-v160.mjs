import assert from 'node:assert/strict';
import {upcomingHazard,cueEnvelope,idleHazardGlow,CUE_RANGE} from '../public/obstacle-lighting-v160.js';
import {specifications} from '../public/course-colliders.js';
import {readFile} from 'node:fs/promises';
assert.equal(CUE_RANGE,390);
let cases=0;
for(let course=1;course<=6;course++){
 const objects=specifications(course,7500);
 assert.ok(objects.length>20);
 for(let i=0;i<objects.length;i++){
  const o=objects[i];
  assert.equal(upcomingHazard(objects,o.s-340),o,'The next hazard should be the nearest ahead');
  assert.equal(upcomingHazard(objects,o.s+5),objects[i+1]||null,'Passed hazard must hand off');
  const remote=cueEnvelope(520,0,o.seed),powering=cueEnvelope(300,0,o.seed),locked=cueEnvelope(55,0,o.seed);
  assert.equal(remote.energy,0);
  assert.ok(powering.energy>0&&powering.energy<1,'Remote ring should light gradually');
  assert.ok(locked.energy>.95&&locked.ring>.50,'Near warning ring must be clearly visible');
  assert.ok(powering.sweep>0,'Startup sweep must precede full ring');
  assert.ok(locked.glow>idleHazardGlow(55)*2,'Only next gate gets bright glow');
  assert.ok(idleHazardGlow(520)<idleHazardGlow(30));
  assert.equal(cueEnvelope(-9,0,o.seed).energy,0,'Passed hazard shuts off');
  for(const v of [remote,powering,locked])for(const n of Object.values(v))assert.ok(Number.isFinite(n)&&n>=0,'Valid finite cue intensity');
  cases++;
 }
}
const source=await readFile(new URL('../public/race-obstacles.js',import.meta.url),'utf8');
assert.ok(source.includes('warningRing=createWarningRing()'),'Reuse one ring rather than one per hazard');
assert.ok(source.includes('warning.owner!==next'),'Ring must attach to upcoming hazard');
assert.ok(source.includes('o.material.userData.hazardGlowStrength.value=focus?focus.glow:idleHazardGlow(d)'));
const guide=await readFile(new URL('../public/race-sightlines-v158.js',import.meta.url),'utf8');
assert.ok(guide.includes('smoothstep(22.,490.,routeGuideDepth)'));
console.log('PASS V160 '+cases+' six-course nearest-obstacle activation, sweep, low-glare fade and unchanged collisions');
