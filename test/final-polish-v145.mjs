import assert from 'node:assert/strict';
import {RaceEffects} from '../public/race-effects.js';
import {createTrack,actAt} from '../public/race-track.js';
// Exercise the actual rendering path with a high-DPI renderer contract.
for(const ratio of [1,1.25,1.75,2,3]){
 let viewport,draws=0;
 const renderer={domElement:{width:390*ratio,height:844*ratio},getSize(v){return v.set(390,844)},getPixelRatio(){return ratio},setRenderTarget(){},setScissorTest(){},setViewport(...v){viewport=v},clear(){},render(){draws++}};
 const fx=new RaceEffects(renderer);fx.safeMobile=true;
 fx.render({}, {}, 0,false,'auto',false);
 assert.deepEqual(viewport,[0,0,390,844],`DPR ${ratio} crops the camera`);
 assert.equal(draws,1);assert.equal(fx.target,undefined);fx.dispose();
 const low=new RaceEffects(renderer);low.safeMobile=false;
 low.render({}, {}, 0,false,'low',false);
 assert.equal(low.target,undefined,'Low quality allocated unused HDR buffers');
 assert.equal(low.renderPath,'native-low');low.dispose();
}
for(let course=1;course<=6;course++){
 const track=createTrack(course),names=new Set();
 for(let i=0;i<4;i++){
  const act=actAt(track.length*(i+.5)/4,track.length,course);
  const seek=act.start+(act.end-act.start)*.14;
  assert.equal(actAt(track.length*seek,track.length,course).name,act.name);
  names.add(act.name);
 }
 assert.equal(names.size,4,`Course ${course} duplicates a chapter`);
}
console.log('PASS V145 high-DPI viewport, Low render allocations, six-course chapter destinations');
