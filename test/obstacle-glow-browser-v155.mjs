import {chromium,webkit} from 'playwright';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const course=Number(process.env.GLOW_COURSE||1),output='obstacle-glow-v155-frames';await mkdir(output,{recursive:true});
const args=['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
for(const kind of [chromium,webkit]){
 const browser=await kind.launch(kind===chromium?{headless:true,args}:{headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error'&&/WebGLProgram|shader error|VALIDATE_STATUS/i.test(e.text()))errors.push(e.text());});
 try{
  await page.addInitScript(()=>localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({xp:5000,craft:2,color:0,custom:{wing:0,engine:0,fin:0},records:{1:112000},ghosts:{},medals:{},races:4})));
  await page.goto('http://127.0.0.1:8765/?shipqa=1&obstacleqa=1',{waitUntil:'domcontentloaded',timeout:65000});await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});
  assert.equal(await page.locator('script[src^="race-engine.js"]').getAttribute('src'),'race-engine.js?v=157');
  await page.evaluate(c=>document.querySelector('[data-course="'+c+'"]').click(),course);await page.locator('#launch').click();
  await page.waitForFunction(()=>document.querySelector('#count')?.classList.contains('off')&&window.__shiftlineRaceReadyQA?.version===152,null,{timeout:180000});
  for(const fraction of [.10,.39,.72]){
   const off=await page.evaluate(f=>window.__shiftlineGlowTest.show(f,false),fraction);
   const before=PNG.sync.read(await page.locator('#game').screenshot({timeout:65000}));
   const on=await page.evaluate(f=>window.__shiftlineGlowTest.show(f,true),fraction);
   const after=PNG.sync.read(await page.locator('#game').screenshot({path:output+'/'+kind.name()+'-'+course+'-'+fraction+'.png',timeout:65000}));
   assert.equal(on.calls,off.calls);assert.equal(on.triangles,off.triangles);assert.equal(on.ratio,off.ratio);assert.equal(on.quality,off.quality);assert.equal(on.lost,false);assert.equal(on.lit,true);
   let lifted=0,total=0;for(let i=0;i<after.data.length;i+=4){const d=after.data[i]+after.data[i+1]+after.data[i+2]-before.data[i]-before.data[i+1]-before.data[i+2];if(d>12)lifted++;total+=d;}
   assert.ok(lifted>40&&total>1000,'No visible obstacle illumination '+JSON.stringify({course,fraction,lifted,total}));
   console.log('PASS V155 native visible illumination, unchanged draws/triangles/resolution',kind.name(),{...on,lifted,total});
  }
  const state=await page.evaluate(()=>({record:JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')).records[1],native:window.__shiftlineRaceVisualQA?.path,passes:window.__shiftlineRaceVisualQA?.offscreenPasses}));assert.equal(state.record,112000);assert.equal(state.native,'native-webkit');assert.equal(state.passes,0);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
