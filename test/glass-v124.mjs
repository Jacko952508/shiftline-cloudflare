import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const BASE=process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765';
async function check(browserType,allCourses){
 const browser=await browserType.launch({headless:true,args:browserType===chromium?['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']:[]});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const errors=[],shaderErrors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',event=>{if(event.type()==='error'&&/WebGLProgram|shader|VALIDATE_STATUS/i.test(event.text()))shaderErrors.push(event.text())});
 try{
  await page.goto(BASE+'/?glassqa=1',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:85000});
  const worlds=allCourses?[1,2,3,4,5,6]:[1];
  for(const course of worlds){
   if(course!==1)await page.evaluate(n=>document.querySelector('[data-course="'+n+'"]').click(),course);
   await page.locator('#obsOpen').click();
   await page.waitForFunction(n=>window.__shiftlineGlassQA?.course===n&&window.__shiftlineGlassQA?.frames>0,course,{timeout:65000});
   const info=await page.evaluate(()=>({
    glass:window.__shiftlineGlassQA,
    active:!document.getElementById('observatory').classList.contains('off'),
    canvas:document.querySelector('#game').getBoundingClientRect().width
   }));
   assert.equal(info.active,true,'3D explorer opens');
   assert.ok(info.canvas>100,'render viewport remains visible');
   assert.ok(info.glass.panes>0,'actual window panes present on course '+course);
   assert.ok(info.glass.frames>0,'opaque gasket meshes created on course '+course);
   assert.ok(info.glass.seams>=info.glass.panes,'pane edges properly joined on course '+course);
   assert.equal(info.glass.depthWrite,false,'no scenery-occluding glass depth writes');
   assert.equal(info.glass.singlePass,true,'mobile glass draws as one pass');
   console.log('PASS course '+course+' glass sealing '+JSON.stringify(info.glass));
   await page.locator('#obsClose').click();
   await page.waitForFunction(()=>document.getElementById('observatory').classList.contains('off'),null,{timeout:15000});
  }
  assert.deepEqual(errors,[],'No game script errors');
  assert.deepEqual(shaderErrors,[],'Glass shader compiles');
  console.log('PASS V124 mobile tunnel glass '+browserType.name()+' '+worlds.join(','));
 } finally{await browser.close();}
}
await check(chromium,true);
await check(webkit,false);
