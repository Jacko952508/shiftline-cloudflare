import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createTrack} from '../public/race-track.js';
import {specifications,collisionAt} from '../public/race-obstacles.js';
import {chaseProfile} from '../public/race-sightlines-v158.js';
const source=await readFile(new URL('../public/cockpit.js',import.meta.url),'utf8');
assert.ok(!source.includes('craft(nose'),'Exterior ship must not be instantiated inside the cockpit');
assert.ok(!source.includes('disposeCraft(c.nose'),'No second airframe should be allocated');
assert.ok(!source.includes('c.nose.rotation'),'No obsolete nose orientation animation');
assert.ok(source.includes('v165 / clear pilot windscreen'),'Cockpit is pilot-eye');
assert.ok(source.includes('renderer.clearDepth()'),'Cockpit should compose over rendered outside scenery');
assert.ok(source.includes('renderer.autoClear=false'),'Avoid clearing the outside Level 1 track');
const track=createTrack(1),hazards=specifications(1,track.length);
assert.ok(track.length>2000&&hazards.length>25,'ECLIPSE level is missing obstacles');
const ids=new Set();
for(const hazard of hazards){
 assert.ok(hazard.s>=0&&hazard.s<=track.length);
 assert.ok(!ids.has(hazard.id),'Duplicate ECLIPSE collision object');ids.add(hazard.id);
}
assert.ok(chaseProfile(390/844).distance>5.8,'Portrait racing corridor too close to ship');
assert.equal(chaseProfile(16/9).distance,3.8,'Landscape chase profile must remain unchanged');
console.log('PASS V165 clear cockpit overlay, no exterior model, 3D composition, Eclipse obstacle identity and framing');
