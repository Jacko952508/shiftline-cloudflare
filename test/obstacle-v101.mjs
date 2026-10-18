// SHIFTLINE obstacle regression: verifies actual Six Worlds obstacle renderer and
// compares collider meshes against the authoritative unmodified collision specs.
// Runs exclusively against a local copy of the candidate branch before publishing.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(origin+'/?hazard-v101',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.shiftlineReady===true,{timeout:120000});
 const result=await page.evaluate(async()=>{
  const THREE=await import('three');
  const {createTrack}=await import('./race-track.js?v=58');
  const {specifications,buildObstacles,updateObstacles,disposeObstacles,obstacleState}=await import('./race-obstacles.js?v=157');
  const results=[],colors=new Set(),checks=(ok,what)=>{if(!ok)throw Error(what)};
  for(let course=1;course<=6;course++){
   const track=createTrack(course),before=specifications(course,track.length).map(o=>JSON.stringify({id:o.id,s:o.s,kind:o.kind,theme:o.theme,forceDodge:o.forceDodge,solids:o.solids,seed:o.seed,spin:o.spin}));
   const scene=new THREE.Scene(),specs=buildObstacles(scene,track,course);
   checks(specs.length===before.length&&specs.length>5,'Course '+course+' missing or fewer hazards');
   let n=0,clamps=0,stripes=0,visible=0;
   for(let i=0;i<specs.length;i++){
    const o=specs[i];
    const after=JSON.stringify({id:o.id,s:o.s,kind:o.kind,theme:o.theme,forceDodge:o.forceDodge,solids:o.solids,seed:o.seed,spin:o.spin});
    checks(after===before[i],'Course '+course+' physics changed on hazard '+i);
    checks(o.rig.position.distanceTo(track.frame(o.s).p)<.00001,'Course '+course+' position changed at '+i);
    checks(!!o.material.map&&!!o.material.normalMap&&!!o.material.roughnessMap&&!!o.material.emissiveMap,'Course '+course+' lost surface maps');
    checks([o.material.map,o.material.normalMap,o.material.roughnessMap,o.material.emissiveMap].every(t=>t.image?.width===256),'Course '+course+' unbounded material texture');
    if(i===0)colors.add(o.material.color.getHex());
    const collider=[];
    o.motion.traverse(m=>{if(m.isMesh&&m.userData.collider)collider.push(m);if(m.name==='Instanced machined ring clamps'){clamps++;checks(m.count===18,'Ring clamps not instanced')}if(m.name==='Hazard face guide lines')stripes++});
    checks(collider.length===o.solids.length,'Course '+course+' collider mesh count changed '+i);
    for(let j=0;j<collider.length;j++){
     const expected=o.solids[j],mesh=o.pieces?.[j]||collider[j];
     checks(Math.abs(mesh.position.x-(expected.x||0))<1e-6&&Math.abs(mesh.position.y-(expected.y||0))<1e-6,'Course '+course+' collider coords shifted');
     checks(Math.abs(mesh.rotation.z-(expected.a||0))<1e-6,'Course '+course+' collider rotation shifted');
    }
    n+=collider.length;
   }
   updateObstacles(specs,specs[0].s,2.75);
   const active=specs.filter(o=>o.rig.visible);visible=active.length;
   checks(visible>0,'Course '+course+' hazards incorrectly culled');
   for(const o of active){
    const st=obstacleState(o,2.75);
    checks(Math.abs(o.motion.position.x-st.x)<1e-6&&Math.abs(o.motion.position.y-st.y)<1e-6,'Course '+course+' obstacle motion changed');
    checks(Math.abs(o.motion.rotation.z-st.a)<1e-6,'Course '+course+' obstacle rotation changed');
    if(st.pieces)for(let i=0;i<o.pieces.length;i++){const node=o.pieces[i],j=i*6;checks(Math.abs(node.position.x-st.pieces[j])<1e-6&&Math.abs(node.position.y-st.pieces[j+1])<1e-6&&Math.abs(node.position.z-st.pieces[j+2])<1e-6&&Math.abs(node.rotation.z-st.pieces[j+3])<1e-6,'Course '+course+' articulated collider/render mismatch');}
   }
   disposeObstacles(scene,specs);
   checks(scene.children.length===0,'Course '+course+' leaked obstacle scene roots');
   results.push({course,hazards:specs.length,colliderSolids:n,instancedClampRings:clamps,warningGuidePairs:stripes,active:visible});
  }
  checks(colors.size===6,'All six world materials must be independently coloured');
  return {courses:results,paletteVariations:colors.size};
 });
 assert.equal(result.courses.length,6);
 for(const c of result.courses){assert.ok(c.colliderSolids>=c.hazards);assert.ok(c.active>0);console.log('PASS COURSE '+c.course+' '+JSON.stringify(c))}
 assert.equal(result.paletteVariations,6);
 assert.deepEqual(errors,[],'Unexpected browser errors');
 console.log('PASS Six World obstacle geometry, coordinates, animation, atlas size, material themes, instancing and cleanup');
}catch(e){console.error('OBSTACLE REGRESSION FAILED:',e.stack);console.error('BROWSER ERRORS:',JSON.stringify(errors));process.exitCode=1}finally{await browser.close()}
