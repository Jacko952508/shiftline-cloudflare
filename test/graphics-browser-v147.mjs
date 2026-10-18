import {chromium,webkit} from 'playwright';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765';
const args=['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
const output=process.env.SHIFTLINE_GRAPHICS_OUTPUT||'graphics-v147-frames';await mkdir(output,{recursive:true});
async function check(kind,courses){
 const browser=await kind.launch(kind===chromium?{headless:true,args}:{headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'});
 const errors=[],shaders=[];
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('console',e=>{if(e.type()==='error'&&/WebGLProgram|VALIDATE_STATUS|shader error/i.test(e.text()))shaders.push(e.text())});
 try{
  await page.addInitScript(()=>localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({xp:5000,craft:2,color:0,custom:{wing:2,engine:2,fin:1,trail:0},records:{1:112000},ghosts:{},medals:{},races:4})));
  await page.goto(base+'/?graphicsqa=1&shipqa=1&sceneryqa=1',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});
  assert.equal(await page.locator('script[src^="race-engine.js"]').getAttribute('src'),'race-engine.js?v=154');
  for(const course of courses){
   if(course!==1)await page.evaluate(n=>document.querySelector('[data-course="'+n+'"]').click(),course);
   await page.locator('#obsOpen').click({timeout:35000});
   await page.waitForFunction(n=>window.__shiftlineGraphicsQA?.course===n,course,{timeout:80000});
   const info=await page.evaluate(()=>window.__shiftlineGraphicsQA);
   assert.equal(info.version,147);assert.equal(info.addedPasses,0);assert.equal(info.addedLights,0);
   const art=await page.evaluate(()=>window.__shiftlineArtQA);assert.equal(art?.version,148);assert.equal(art.course,course);assert.equal(art.addedPasses,0);
   assert.equal(info.contextAntialias,true,'Native-framebuffer anti-aliasing unavailable');
   await page.screenshot({path:output+'/'+kind.name()+'-course-'+course+'.png',timeout:65000});
   await page.locator('#obsScrub').evaluate(el=>{el.value='520';el.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.waitForTimeout(450);
   const png=PNG.sync.read(await page.screenshot({path:output+'/'+kind.name()+'-midcourse-'+course+'.png',timeout:65000}));
   let varied=0;for(let i=0;i<png.width*png.height;i+=19){const p=i*4;if(Math.max(png.data[p],png.data[p+1],png.data[p+2])-Math.min(png.data[p],png.data[p+1],png.data[p+2])>14)varied++;}
   assert.ok(varied>500,'Blank course view '+course);
   if(course===4&&process.env.SHIFTLINE_ALPINE_REVIEW==='1')for(const progress of[300,820]){
    await page.locator('#obsScrub').evaluate((el,p)=>{el.value=String(p);el.dispatchEvent(new Event('input',{bubbles:true}));},progress);
    await page.waitForTimeout(350);
    await page.screenshot({path:output+'/'+kind.name()+'-chapter-'+progress+'-course-4.png',timeout:65000});
   }
   if(process.env.SHIFTLINE_CORAL_REVIEW==='1')for(const progress of [80,260,410,670,790]){
    await page.locator('#obsScrub').evaluate((el,p)=>{el.value=String(p);el.dispatchEvent(new Event('input',{bubbles:true}));},progress);
    await page.locator('[data-obs-mode="orbit"]').click();
    await page.waitForTimeout(450);
    await page.screenshot({path:output+'/'+kind.name()+'-reef-'+progress+'.png',timeout:65000});
   }
   if(process.env.SHIFTLINE_WORLD_IDENTITY==='1'){
    await page.locator('[data-obs-mode="orbit"]').click();
    for(let z=0;z<3;z++)await page.locator('#obsZoomOut').click();
    await page.waitForTimeout(350);
    await page.screenshot({path:output+'/'+kind.name()+'-exterior-'+course+'.png',timeout:65000});
   }
   console.log('PASS V147 '+kind.name()+' course '+course+' '+JSON.stringify(info));
   await page.locator('#obsClose').click();
  }
  if(process.env.SHIFTLINE_ART_SKIP_RACE==='1'){assert.deepEqual(errors,[]);assert.deepEqual(shaders,[]);return;}
  await page.evaluate(n=>document.querySelector('[data-course="'+n+'"]').click(),Number(process.env.SHIFTLINE_ART_RACE_COURSE||1));
  await page.locator('#launch').click({timeout:25000});
  await page.waitForFunction(()=>document.querySelector('#count')?.classList.contains('off'),null,{timeout:170000});
  await page.waitForFunction(()=>window.__shiftlineRaceVisualQA?.path==='native-webkit',null,{timeout:45000});
  const state=await page.evaluate(()=>{const gl=document.querySelector('#game').getContext('webgl2');return {
   path:window.__shiftlineRaceVisualQA,antialias:gl.getContextAttributes().antialias,
   samples:gl.getParameter(gl.SAMPLES),lost:gl.isContextLost(),
   record:JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')).records[1]
  }});
  assert.equal(state.path.offscreenPasses,0);assert.equal(state.antialias,true);
  assert.ok(state.samples>0,'No MSAA samples on native framebuffer');assert.equal(state.lost,false);assert.equal(state.record,112000);
  await page.screenshot({path:output+'/'+kind.name()+'-race.png',timeout:65000});
  await page.locator('#cameraBtn').click();
  await page.waitForFunction(()=>document.body.classList.contains('cockpitActive'),null,{timeout:25000});
  await page.screenshot({path:output+'/'+kind.name()+'-cockpit.png',timeout:65000});
  assert.deepEqual(errors,[]);assert.deepEqual(shaders,[]);
  console.log('PASS V147 native race, MSAA, cockpit and saved record '+kind.name()+' '+JSON.stringify(state));
 }finally{await browser.close()}
}
const selected=process.env.SHIFTLINE_ART_COURSES?.split(',').map(Number);
await check(chromium,selected||[1,2,3,4,5,6]);
await check(webkit,selected||[1,5]);
