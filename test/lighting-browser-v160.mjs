import {openSoloDemo,openTrackInspection} from './menu-navigation.mjs';
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const args=['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
await mkdir('lighting-v160-frames',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium?{headless:true,args}:{headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',e=>{if(e.type()==='error'&&/WebGLProgram|Shader Error|VALIDATE_STATUS/.test(e.text()))errors.push(e.text());});
 try{
  await page.goto('http://127.0.0.1:8765/?lightqa=1&obstacleqa=1',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});await openSoloDemo(page,1);
  for(const course of [1,5]){
   if(course!==1)await page.evaluate(c=>document.querySelector('[data-course="'+c+'"]').click(),course);
   await openTrackInspection(page);
   await page.waitForFunction(c=>window.__shiftlineObstacleQA?.course===c,course,{timeout:80000});
   await page.waitForTimeout(600);
   let signal=await page.evaluate(()=>window.__shiftlineLightingQA);
   assert.equal(signal.version,160);
   assert.ok(signal.activeCount===0||signal.activeCount===1,'Only one cue is permitted');
   for(const scrub of ['130','400','710']){
    await page.locator('#obsScrub').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},scrub);
    await page.waitForTimeout(250);
    signal=await page.evaluate(()=>window.__shiftlineLightingQA);
    assert.equal(signal.version,160,'Lighting must track Observatory jumps');
    assert.ok(signal.activeCount<=1,'Multiple obstacle rings lit up');
    if(signal.distance!==null&&signal.distance>0&&signal.distance<300){
     assert.equal(signal.activeCount,1,'Next obstacle ring inactive');
     assert.ok(signal.sweepOpacity>0&&signal.ringOpacity>0,'Startup sequence invisible');
    }
   }
   await page.screenshot({path:'lighting-v160-frames/'+engine.name()+'-course-'+course+'.png',timeout:65000});
   await page.locator('#obsClose').click();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS V160 '+engine.name()+' sequenced cues on two real worlds');
 }finally{await browser.close();}
}
