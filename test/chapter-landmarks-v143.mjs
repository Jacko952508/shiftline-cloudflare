import * as THREE from 'three';
import assert from 'node:assert/strict';
import {createTrack,actAt} from '../public/race-track.js';
import {attachChapterLandmarks,updateChapterLandmarks,setChapterLandmarkQuality,disposeChapterLandmarks} from '../public/chapter-landmarks-v143.js';
import {attachFarScenery,disposeFarScenery} from '../public/far-scenery-v129.js';
for(let course=1;course<=6;course++){
 const track=createTrack(course),scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
 const w={root,kind:course===4||course===5||course===6?'expansion':course===3?'cinder':course===2?'leviathan':'eclipse',renderAhead:700};
 if(course===4||course===5||course===6)w.ground=(x,z)=>track.frame(track.length/2).p.y-110;
 if(course===3)w.ground=(x,z)=>-170;
 if(course===2)w.vista={seabed:{heightAt:(x,z)=>-120}};
 attachFarScenery(scene,w,track,course,'auto');
 attachChapterLandmarks(w,track,course,'auto');
 const d=w.chapterLandmarks;
 assert.ok(d.sites.length>=8,'Not enough visible special landmarks in course '+course);
 assert.ok(d.chapterCounts.every(n=>n>0),'A chapter has no special landmarks in '+course);
 assert.ok(d.minClearance>=24,'Signature object clips another branch in '+course);
 assert.ok(d.sites.every(s=>s.meshes.length===3));
 for(const site of d.sites){
  const authored=actAt(track.length*(site.chapter+.5)/4,track.length,course);
  assert.ok(Math.abs(site.actStart-authored.start)<1e-10);
  assert.ok(Math.abs(site.actEnd-authored.end)<1e-10);
  assert.ok(site.s/track.length>=authored.start&&site.s/track.length<=authored.end,'Landmark outside actual act '+course+' / '+site.chapter);
 }
 assert.ok(d.sites.every(s=>s.meshes.every(m=>m.isInstancedMesh&&m.castShadow===false&&m.material.transparent===false)));
 assert.ok(d.totalParts>=d.sites.length*5);
 const original=d.sites[0].counts.slice();
 setChapterLandmarkQuality(w,'low');
 assert.equal(d.sites[0].meshes[1].count,0);assert.equal(d.sites[0].meshes[2].count,0);
 assert.ok(d.sites[0].meshes[0].count>=1);
 setChapterLandmarkQuality(w,'auto');
 assert.deepEqual(d.sites[0].meshes.map(x=>x.count),original);
 for(let ch=0;ch<4;ch++){
  updateChapterLandmarks(w,track.length*(ch+.5)/4);
  assert.ok(d.visible>0,'No camera-local signature landmark on chapter '+ch+' course '+course);
 }
 const expected=d.sites.length;
 disposeChapterLandmarks(w);disposeFarScenery(w);
 assert.equal(w.chapterLandmarks,null);assert.equal(scene.children.length,1);
 assert.equal(root.children.length,0);
 console.log('PASS V144 '+course+' signature landmarks='+expected+', parts='+d.totalParts+', clearance='+d.minClearance.toFixed(1));
}
