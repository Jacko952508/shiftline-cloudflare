import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('visual-v161-frames',{recursive:true});
const args=['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
for(const kind of [chromium,webkit]){
 const browser=await kind.launch(kind===chromium?{headless:true,args}:{headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',e=>{if(e.type()==='error'&&/Shader Error|WebGLProgram|VALIDATE_STATUS/i.test(e.text()))errors.push(e.text());});
 try{
  await page.addInitScript(()=>localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({xp:5000,craft:0,color:0,custom:{},records:{},ghosts:{},medals:{},races:4})));
  await page.goto('http://127.0.0.1:8765/?shipqa=1&obstacleqa=1&lightqa=1',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});
  assert.equal(await page.locator('script[src^="race-engine.js"]').getAttribute('src'),'race-engine.js?v=161');
  await page.locator('[data-tab="garage"]').click();
  await page.waitForFunction(()=>window.__shiftlineIdentityQA?.version===161,null,{timeout:65000});
  const indices=kind===chromium?[0,1,2,3,4,5]:[0,3,5];
  for(const i of indices){
   await page.locator('[data-garage-category="ship"]').click();
   const tile=page.locator('[data-choice-kind="ship"][data-choice-id="'+i+'"]');
   await tile.scrollIntoViewIfNeeded();await tile.click();
   await page.waitForFunction(n=>window.__shiftlineIdentityQA?.index===n,i,{timeout:45000});
   const details=await page.evaluate(()=>window.__shiftlineIdentityQA);
   assert.ok(details.lights>=6&&details.vents>=3);
   if(i===0||i===5)await page.screenshot({path:'visual-v161-frames/'+kind.name()+'-ship-'+i+'.png',timeout:65000});
  }
  for(const mode of ['night','studio','track']){
   await page.locator('[data-garage-light="'+mode+'"]').click();
   assert.equal((await page.evaluate(()=>window.__shiftlineLightingQA))?.mode,mode);
  }
  await page.locator('[data-tab="race"]').click();
  await page.locator('#obsOpen').click();
  await page.waitForFunction(()=>window.__shiftlineObstacleQA?.obstacles>5,null,{timeout:90000});
  const current=await page.evaluate(()=>window.__shiftlineObstacleQA);
  assert.ok(current.metalParts>current.obstacles*.7,'V161 hazard bodywork absent');
  await page.screenshot({path:'visual-v161-frames/'+kind.name()+'-hazards.png',timeout:65000});
  assert.deepEqual(errors,[],'Browser should not log fatal shader or JS errors');
  console.log('PASS V161 '+kind.name()+' six ship identities, hangar modes, true hazard scene');
 }finally{await browser.close();}
}
