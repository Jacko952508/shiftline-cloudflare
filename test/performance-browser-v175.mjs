import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {openSoloDemo} from './menu-navigation.mjs';

const kind=process.env.PERF_BROWSER==='webkit'?webkit:chromium;
const courses=(process.env.PERF_COURSES||'1,2,3,4,5,6').split(',').map(Number);
const output='qa-v175/'+kind.name()+'-'+courses.join('-');await mkdir(output,{recursive:true});
const browser=await kind.launch(kind===chromium?{headless:true,args:['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']}:{headless:true});
async function run(course,candidate){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',e=>{if(e.type()==='error'&&/WebGLProgram|shader error|INVALID_OPERATION|race preparation failed/i.test(e.text()))errors.push(e.text());});
 try{
  await page.addInitScript(()=>{
   localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({xp:18000,craft:2,color:0,custom:{edition:1},records:{1:112000},courseRevisions:{1:2,2:3},ghosts:{},medals:{},races:8}));
   localStorage.setItem('eclipseQualityV1','high');
  });
  await page.goto('http://127.0.0.1:'+(candidate?8765:8764)+'/?shipqa=1&cockpitqa=1',{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.shiftlineReady&&window.__shiftlineRuntimeTest,null,{timeout:180000});
  await openSoloDemo(page,course);await page.locator('#launch').click({timeout:180000});
  await page.waitForFunction(()=>window.__shiftlineRuntimeTest.read().state==='countdown',null,{timeout:240000});
  await page.evaluate(()=>window.__shiftlineRuntimeTest.freeze());
  await page.evaluate(async()=>{
   const T=await import('three'),stats=window.__perf175={composes:0,products:0,clones:0};
   for(const [proto,key,counter]of [[T.Matrix4.prototype,'compose','composes'],[T.Matrix4.prototype,'multiplyMatrices','products'],[T.Vector3.prototype,'clone','clones']]){
    const original=proto[key];proto[key]=function(...args){stats[counter]++;return original.apply(this,args);};
   }
  });
  const frames=[];for(let i=0;i<6;i++)frames.push(await page.evaluate(()=>window.__shiftlineRuntimeTest.frame()));
  const work=await page.evaluate(()=>({...window.__perf175}));
  await page.evaluate(()=>window.__shiftlineRuntimeTest.position(.12));
  for(let i=0;i<14;i++)await page.evaluate(()=>window.__shiftlineRuntimeTest.frame());
  const image=await page.screenshot({path:output+'/'+course+'-'+(candidate?'candidate':'baseline')+'.png',timeout:90000});
  const info=await page.evaluate(()=>window.__shiftlineRuntimeTest.read());
  await writeFile(output+'/'+course+'-'+(candidate?'candidate':'baseline')+'-work.json',JSON.stringify({work,info},null,2));
  assert.equal(info.quality,'high');assert.ok(info.ratio>1,'High quality was reduced');
  if(candidate){
   for(const fraction of [.12,.5,.85]){
    await page.evaluate(p=>window.__shiftlineRuntimeTest.position(p),fraction);
    const hit=await page.evaluate(()=>window.__shiftlineRuntimeTest.collide());assert.ok(hit.dead>0,'Sustained collision missing '+JSON.stringify({course,fraction,hit}));
    const recovered=await page.evaluate(()=>window.__shiftlineRuntimeTest.recover());assert.equal(recovered.dead,0);assert.equal(recovered.blocked,false);assert.equal(recovered.x,0);assert.equal(recovered.y,0);
   }
   assert.equal((await page.evaluate(()=>window.__shiftlineRuntimeTest.cockpit())).active,true);
   const q=await page.evaluate(()=>window.__shiftlineCockpitQA);
   assert.ok(q.cameraLocked&&q.cabinClosed&&q.lockedOverlay,'Pilot camera or cockpit layering changed');
   await page.screenshot({path:output+'/'+course+'-cockpit.png',timeout:90000});
   await page.evaluate(()=>window.__shiftlineRuntimeTest.cockpit());
   assert.equal((await page.evaluate(()=>window.__shiftlineRuntimeTest.read())).quality,'high');
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')));assert.equal(saved.records[1],112000);
  }
  assert.deepEqual(errors,[]);return{frames,work,info,image};
 }finally{await context.close();}
}
try{
 for(const course of courses){
  const baseline=await run(course,false),candidate=await run(course,true);
  assert.equal(candidate.info.ratio,baseline.info.ratio,'Resolution changed');
  assert.equal(candidate.info.triangles,baseline.info.triangles,'Visible geometry changed');
  assert.equal(candidate.info.calls,baseline.info.calls,'Rendering passes or objects changed');
  assert.ok(candidate.work.composes<baseline.work.composes,'Static obstacle transforms still recomposed');
  assert.ok(candidate.work.clones<baseline.work.clones,'Repeated track sampling allocations did not fall');
  const a=PNG.sync.read(baseline.image),b=PNG.sync.read(candidate.image);let error=0,large=0;
  for(let i=0;i<a.data.length;i+=4)for(let k=0;k<3;k++){const delta=Math.abs(a.data[i+k]-b.data[i+k]);error+=delta;if(delta>16)large++;}
  const meanError=error/(a.width*a.height*3),changedPixels=large/(a.width*a.height*3);
  // Deterministic frozen race: permit minor antialias/shadow rounding, never
  // missing scenery, hidden hazards or a downgraded framebuffer.
  assert.ok(meanError<2.5&&changedPixels<.035,'Visible race changed '+JSON.stringify({course,meanError,changedPixels}));
  const report={course,browser:kind.name(),baseline:{work:baseline.work,info:baseline.info},candidate:{work:candidate.work,info:candidate.info},meanError,changedPixels};
  await writeFile(output+'/'+course+'.json',JSON.stringify(report,null,2));
  console.log('PASS V175 '+kind.name()+' course '+course+' '+JSON.stringify({baseline:baseline.work,candidate:candidate.work,meanError,changedPixels,ratio:candidate.info.ratio,triangles:candidate.info.triangles}));
 }
}finally{await browser.close();}
