import * as THREE from 'three';
import assert from 'node:assert/strict';
import {createTrack} from '../public/race-track.js';
import {attachBiomeAtmosphere,updateBiomeAtmosphere,disposeBiomeAtmosphere} from '../public/biome-atmosphere-v142.js';
import {readFile} from 'node:fs/promises';
for(let course=1;course<=6;course++){
 const track=createTrack(course),scene=new THREE.Scene(),fog=new THREE.FogExp2(0x243044,.0002);
 scene.fog=fog;const w={lowDetail:false,skyMat:{uniforms:{base:{value:new THREE.Color(0x283445)},chapterTint:{value:new THREE.Color(0x283445)}}}};
 if(course===2)w.vista={water:{material:{uniforms:{chapterTint:{value:new THREE.Color(0x123456)}}}}};
 attachBiomeAtmosphere(scene,w,track,course);const a=w.biomeAtmosphere;
 for(let ch=0;ch<4;ch++){
  updateBiomeAtmosphere(w,track.length*(ch+.5)/4);
  assert.equal(a.blend.from,ch);assert.equal(a.blend.to,ch);
  assert.ok(a.density>0&&a.density<.002);
  assert.equal(scene.fog,fog);assert.ok(fog.color.equals(a.fogColors[ch]));
 }
 const count=a.updates;updateBiomeAtmosphere(w,track.length*.875+1);assert.equal(a.updates,count);
 for(let boundary=1;boundary<=3;boundary++){
  updateBiomeAtmosphere(w,track.length*boundary/4);
  assert.equal(a.blend.from,boundary-1);assert.equal(a.blend.to,boundary);assert.ok(Math.abs(a.blend.t-.5)<.01);
  const half=a.fogColors[boundary-1].clone().lerp(a.fogColors[boundary],.5);
  assert.ok((fog.color.r-half.r)**2+(fog.color.g-half.g)**2+(fog.color.b-half.b)**2<1e-7);
 }
 updateBiomeAtmosphere(w,track.length*.625);const high=a.density;
 w.lowDetail=true;updateBiomeAtmosphere(w,track.length*.625);
 assert.ok(Math.abs(a.density/high-.78)<.002);
 disposeBiomeAtmosphere(w);assert.equal(w.biomeAtmosphere,null);assert.equal(scene.fog,fog);
 console.log('PASS V142 chapter atmosphere '+course);
}
for(const file of ['race-world.js','cinder-world.js','ocean-vista.js']){
 const src=await readFile(new URL('../public/'+file,import.meta.url),'utf8');
 assert.ok(src.includes('chapterTint'),'Sky uniform missing '+file);
}