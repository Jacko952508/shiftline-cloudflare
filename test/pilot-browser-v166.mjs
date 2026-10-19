import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir} from 'node:fs/promises';
import {openSoloDemo} from './menu-navigation.mjs';
const out='qa-v166-pilot-eye';await mkdir(out,{recursive:true});
const flags=['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
for(const [browserType,model] of [[chromium,0],[webkit,4]]){
 const browser=await browserType.launch(browserType===chromium?{headless:true,args:flags}:{headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',e=>{if(e.type()==='error'&&/WebGLProgram|Shader Error|race preparation failed/i.test(e.text()))errors.push(e.text());});
 try{
  await page.addInitScript(m=>{
   localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({xp:5000,craft:m,color:0,custom:{edition:0,wing:0,engine:0},records:{1:112000},ghosts:{},medals:{},races:5}));
   localStorage.setItem('eclipseQualityV1','auto');
  },model);
  await page.goto('http://127.0.0.1:8765/?cockpitqa=1&lightqa=1',{waitUntil:'domcontentloaded',timeout:70000});
  await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:130000});
  await openSoloDemo(page,1,'race');await page.locator('#launch').click({timeout:140000});
  await page.waitForFunction(()=>window.__shiftlineRuntimeTest?.read().state==='countdown',null,{timeout:160000});
  await page.evaluate(()=>{window.__shiftlineRuntimeTest.freeze();window.__shiftlineRuntimeTest.frame(true);});
  for(const [w,h,orient] of [[390,844,'portrait'],[844,390,'landscape']]){
   await page.setViewportSize({width:w,height:h});
   await page.locator('#cameraBtn').click();
   await page.evaluate(()=>window.__shiftlineRuntimeTest.frame(true));
   await page.waitForFunction(()=>window.__shiftlineCockpitQA?.active&&window.__shiftlineCockpitQA.pilot?.version===166,null,{timeout:35000});
   const q=await page.evaluate(()=>window.__shiftlineCockpitQA);
   assert.equal(q.hasExteriorClone,false,'Whole duplicate ship returned');
   assert.equal(q.worldExteriorVisible,false,'Rear aircraft not culled in cockpit');
   assert.equal(q.pilotNoseVisible,true,'Real ship nose is missing');
   assert.equal(q.pilot.model,model,'Wrong model eye calibration');
   assert.equal(q.pilotParts,model===4?3:1,'Unexpected cockpit forward geometry');
   assert.ok(q.pilot.visibleParts.every(p=>p.visible&&p.forward>0),'Physical parts behind the pilot or invisible');
   assert.ok(q.pilot.visibleParts.every(p=>p.screen.every(Number.isFinite)),'Bad projection of pilot nose');
   assert.ok(q.pilot.localEye[1]>.29&&q.pilot.localEye[1]<.38,'Camera eye not positioned in canopy');
   assert.ok(q.pilot.eye.every(Number.isFinite));
   const png=PNG.sync.read(await page.screenshot({path:out+'/'+browserType.name()+'-model'+model+'-'+orient+'-pilot.png',timeout:65000}));
   assert.ok(png.width===w&&png.height===h);
   await page.locator('#cameraBtn').click();await page.evaluate(()=>window.__shiftlineRuntimeTest.frame(true));
   const chase=await page.evaluate(()=>window.__shiftlineCockpitQA);
   assert.equal(chase.pilotNoseVisible,false,'Forward-only piece appears on exterior chase view');
   assert.equal(chase.worldExteriorVisible,true,'Full external craft not restored');
   await page.screenshot({path:out+'/'+browserType.name()+'-model'+model+'-'+orient+'-chase.png',timeout:65000});
   console.log('PASS V166 '+browserType.name()+' '+orient+' '+JSON.stringify({model,eye:q.pilot.localEye,projected:q.pilot.visibleParts.map(p=>p.screen)}));
  }
  assert.deepEqual(errors,[],'Level 1 runtime shader and JavaScript errors');
 }finally{await browser.close();}
}
