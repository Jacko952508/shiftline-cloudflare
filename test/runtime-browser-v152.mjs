import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const kind=process.env.RUNTIME_BROWSER==='webkit'?webkit:chromium,course=Number(process.env.RUNTIME_COURSE||1),out='runtime-v152-artifacts';await mkdir(out,{recursive:true});
const args=['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
async function run(name,port){
 const browser=await kind.launch(kind===chromium?{headless:true,args}:{headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error'&&/WebGLProgram|shader error|race preparation failed/i.test(e.text()))errors.push(e.text());});
 try{
  await page.addInitScript(()=>{
   localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({xp:5000,craft:5,color:0,custom:{wing:3,engine:4,fin:2,trail:1},records:{1:112000},courseRevisions:{1:2,2:3},ghosts:{},medals:{},races:4}));
   window.__runtimeCounters={programs:0,audioBuffers:0,audioEvents:[]};
   const create=WebGL2RenderingContext.prototype.createProgram;WebGL2RenderingContext.prototype.createProgram=function(...a){window.__runtimeCounters.programs++;return create.apply(this,a);};
   const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){const fn=Audio.prototype.createBuffer;Audio.prototype.createBuffer=function(...a){window.__runtimeCounters.audioBuffers++;window.__runtimeCounters.audioEvents.push({channels:a[0],length:a[1],source:new Error().stack});return fn.apply(this,a);};}
  });
  await page.goto('http://127.0.0.1:'+port+'/?shipqa=1',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.shiftlineReady&&window.__shiftlineRuntimeTest,null,{timeout:150000});
  await page.evaluate(n=>{const q=document.querySelector('#quality');q.value='high';window.dispatchEvent(new Event('shiftline-quality'));document.querySelector('[data-course="'+n+'"]').click();},course);
  const start=Date.now();await page.locator('#launch').click({timeout:120000});
  await page.waitForFunction(()=>window.__shiftlineRuntimeTest.read().state==='countdown',null,{timeout:220000});
  const launchMS=Date.now()-start;await page.evaluate(()=>window.__shiftlineRuntimeTest.freeze());
  const grid=[];for(let i=0;i<4;i++)grid.push(await page.evaluate(()=>window.__shiftlineRuntimeTest.frame(true)));
  const report={name,browser:kind.name(),course,launchMS,grid,collisions:[]};
  if(name==='candidate'){
   const ready=await page.evaluate(()=>window.__shiftlineRaceReadyQA);assert.equal(ready?.version,152);assert.equal(ready.course,course);assert.equal(ready.impactPools,8);assert.ok(ready.rivalBatches.every(b=>b.saved>10));
   await page.screenshot({path:out+'/'+course+'-'+kind.name()+'-grid.png',timeout:90000});
  }
  if(name==='candidate'&&process.env.RUNTIME_FAMILY156==='1'){
   const families=await page.evaluate(()=>window.__shiftlineFamilyTest.list());assert.equal(families.length,3);report.families=[];
   for(const family of families){
    const first=await page.evaluate(f=>window.__shiftlineFamilyTest.show(f,17.2),family);
    await page.screenshot({path:out+'/'+course+'-'+kind.name()+'-'+family+'.png',timeout:90000});
    const moved=await page.evaluate(f=>window.__shiftlineFamilyTest.show(f,19.2),family);
    assert.ok(first.poseError<1e-7&&moved.poseError<1e-7,'Rendered moving parts do not match physics');assert.equal(moved.lost,false);assert.equal(moved.ratio,first.ratio);assert.equal(moved.quality,first.quality);
    assert.ok(first.poses.some((v,i)=>Math.abs(v-moved.poses[i])>.01),'Family has no moving mechanism');
    await page.screenshot({path:out+'/'+course+'-'+kind.name()+'-'+family+'-moving.png',timeout:90000});
    report.families.push({first,moved});
   }
  }
  for(const fraction of[.08,.50,.85]){
   await page.evaluate(p=>window.__shiftlineRuntimeTest.position(p),fraction);
   // Finish an ordinary render before measuring only first-use collision work.
   const before=await page.evaluate(()=>({...window.__runtimeCounters,...window.__shiftlineRuntimeTest.read()}));
   const hit=await page.evaluate(()=>window.__shiftlineRuntimeTest.collide());assert.ok(hit.dead>0,'Actual collision was not detected');
   const frame=await page.evaluate(()=>window.__shiftlineRuntimeTest.frame());const after=await page.evaluate(()=>({...window.__runtimeCounters,...window.__shiftlineRuntimeTest.read()}));
   const recovery=await page.evaluate(()=>window.__shiftlineRuntimeTest.recover());assert.equal(recovery.dead,0,'Repeated crash recovery failed');assert.equal(recovery.x,0);assert.equal(recovery.y,0);assert.equal(recovery.blocked,false,'Respawn inside an obstacle');
   report.collisions.push({fraction,hitCPU:hit.cpu,frameCPU:frame.cpu,programDelta:after.programs-before.programs,pcmDelta:after.audioBuffers-before.audioBuffers,scale:frame.scale,recovery});
   if(name==='candidate'){assert.equal(after.programs,before.programs,'First collision compiles GPU programs');assert.equal(after.audioBuffers,before.audioBuffers,'First collision allocates audio '+JSON.stringify(after.audioEvents.slice(before.audioEvents.length)));assert.ok(Math.abs(frame.scale-.83)<1e-6,'Collision resizes ship');}
  }
  const cockpit=await page.evaluate(()=>window.__shiftlineRuntimeTest.cockpit());assert.equal(cockpit.active,true);assert.equal(cockpit.lost,false);await page.evaluate(()=>window.__shiftlineRuntimeTest.cockpit());
  if(name==='candidate'&&course===1){
   await page.evaluate(()=>window.__shiftlineRuntimeTest.trial());
   await page.waitForFunction(()=>window.__shiftlineRuntimeTest.read().state==='countdown',null,{timeout:220000});
   assert.equal((await page.evaluate(()=>window.__shiftlineRuntimeTest.read())).ghost?.batched,false,'Translucent time-trial ghost must preserve original part sorting');
   await page.evaluate(()=>{window.__shiftlineRuntimeTest.menu();window.__shiftlineRuntimeTest.start();window.__shiftlineRuntimeTest.menu();});
   await page.waitForTimeout(400);
   assert.equal((await page.evaluate(()=>window.__shiftlineRuntimeTest.read())).state,'menu','Cancelled preparation starts a hidden race later');
  }
  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')));assert.equal(save.records[1],112000,'Regression erased saved record');assert.deepEqual(errors,[]);
  return report;
 }finally{await browser.close();}
}
const baseline=await run('baseline',8764),candidate=await run('candidate',8765);
const oldCalls=baseline.grid.at(-1).calls,newCalls=candidate.grid.at(-1).calls;
if(process.env.RUNTIME_FAMILY156==='1')assert.ok(newCalls<=oldCalls+80,'New machinery exceeds the draw-call budget: '+oldCalls+' -> '+newCalls);else assert.ok(newCalls<oldCalls-60,'Starting grid draw calls did not fall');
assert.equal(candidate.grid[0].ratio,baseline.grid[0].ratio,'Resolution was reduced');assert.equal(candidate.grid[0].quality,baseline.grid[0].quality);
assert.deepEqual(candidate.grid[0].rivals.map(r=>r.triangles),baseline.grid[0].rivals.map(r=>r.triangles),'Rival geometry quality changed');
await writeFile(out+'/'+course+'-'+kind.name()+'.json',JSON.stringify({baseline,candidate,gridDrawReduction:1-newCalls/oldCalls},null,2));
console.log('PASS V152 '+kind.name()+' course '+course+' grid calls '+oldCalls+' -> '+newCalls+'; same triangles/resolution; 3 collision/recovery cases, no first-use collision programs or PCM allocations');
