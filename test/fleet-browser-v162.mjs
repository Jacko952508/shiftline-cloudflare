import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {fleetFinish} from '../public/fleet-designs-v162.js';
await mkdir('qa-v162',{recursive:true});
const base=process.env.SHIFTLINE_TEST_ORIGIN||process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765';
const args=['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
const browsers=process.env.FLEET_BROWSERS==='chromium'?[chromium]:process.env.FLEET_BROWSERS==='webkit'?[webkit]:[chromium,webkit];
for(const kind of browsers){
 const browser=await kind.launch(kind===chromium?{headless:true,args}:{headless:true});
 const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error'&&/Shader Error|WebGLProgram|VALIDATE_STATUS/.test(e.text()))errors.push(e.text());});
 try{
  // Exercise a real legacy save without XP: migration must expose the collection
  // while preserving records, XP and selected editions on reload.
  await page.addInitScript(()=>{if(!localStorage.getItem('fleet162TestSeeded')){localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({courseRevisions:{1:2,2:3},seaRevision:3,xp:42,craft:0,color:0,custom:{wing:4,fin:4,livery:4},records:{1:120000},ghosts:{},medals:{1:'BRONZE'},races:4}));localStorage.setItem('fleet162TestSeeded','1');}localStorage.setItem('shiftlineQuality','low');});
  await page.goto(base+'/?shipqa=1',{waitUntil:'domcontentloaded',timeout:65000});await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});
  await page.locator('[data-tab="garage"]').click();
  await page.waitForSelector('.garage3DCanvas',{timeout:60000});
  assert.equal(await page.locator('[data-fleet-ship]').count(),6);assert.equal(await page.locator('[data-fleet-edition]').count(),3);assert.equal(await page.locator('[data-garage-category]').count(),0);
  for(let model=0;model<6;model++){
   await page.locator('[data-fleet-ship="'+model+'"]').click();
   for(let edition=0;edition<3;edition++){
    await page.locator('[data-fleet-edition="'+edition+'"]').click();
    await page.waitForFunction(({model,edition})=>window.__shiftlineFleetQA?.index===model&&window.__shiftlineFleetQA?.edition===edition&&window.__shiftlineFleetQA?.rendered===true,{model,edition},{timeout:45000});
    await page.waitForFunction(({model,edition})=>window.__shiftlinePaintQA?.model===model&&window.__shiftlinePaintQA?.edition===edition&&window.__shiftlinePaintQA?.rendered,{model,edition},{timeout:45000});
    assert.equal(await page.evaluate(()=>window.__shiftlinePaintQA.finish),fleetFinish(model,{edition}));
    const canvas=page.locator('.garage3DCanvas');
    await canvas.screenshot({path:'qa-v162/'+kind.name()+'-'+model+'-'+edition+'.png',timeout:60000});
    assert.equal(await page.locator('[data-fleet-edition][aria-pressed="true"]').count(),1);
   }
   const canvas=page.locator('.garage3DCanvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox(),cy=box.y+box.height*.51;
   await page.mouse.move(box.x+75,cy);await page.mouse.down();await page.mouse.move(box.x+335,cy,{steps:18});await page.mouse.up();
   await canvas.screenshot({path:'qa-v162/'+kind.name()+'-rear-'+model+'.png',timeout:60000});
   await page.mouse.move(box.x+215,cy);await page.mouse.down();await page.mouse.move(box.x+215,cy-70,{steps:10});await page.mouse.up();
   await canvas.screenshot({path:'qa-v162/'+kind.name()+'-inspection-'+model+'.png',timeout:60000});
   await page.locator('#garageResetView').click();console.log('Rendered '+kind.name()+' ship '+model+' with three editions and rear inspection');
  }
  await page.screenshot({path:'qa-v162/'+kind.name()+'-portrait.png',fullPage:true});
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});await page.locator('[data-tab="garage"]').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')));
  assert.equal(saved.xp,42);assert.equal(saved.records[1],120000);assert.equal(saved.craft,5);assert.equal(saved.custom.edition,2);
  for(const mode of['studio','night','track']){await page.locator('[data-garage-light="'+mode+'"]').click();await page.waitForFunction(m=>window.__shiftlineLightingQA?.mode===m,mode);}
  await page.waitForFunction(()=>window.__shiftlineFlightQA?.rendered&&window.__shiftlineFlightQA.elapsed>1,null,{timeout:60000});
  assert.ok(await page.locator('#garageCockpitView').isDisabled());
  const firstFlight=await page.evaluate(()=>window.__shiftlineFlightQA);
  await page.locator('.garage3DCanvas').screenshot({path:'qa-v162/'+kind.name()+'-track-start.png',timeout:60000});
  await page.waitForFunction(p=>{const q=window.__shiftlineFlightQA;return q?.rendered&&Math.hypot(...q.position.map((v,i)=>v-p[i]))>8;},firstFlight.position,{timeout:60000});
  await page.locator('.garage3DCanvas').screenshot({path:'qa-v162/'+kind.name()+'-track-turn.png',timeout:60000});
  const moving=await page.evaluate(()=>window.__shiftlineFlightQA);assert.ok(moving.active&&moving.elapsed>firstFlight.elapsed);assert.ok(moving.drawCalls<45,'Lightweight tunnel preview');
  assert.ok(moving.camera.reduce((sum,v,i)=>sum+(v-moving.position[i])*moving.forward[i],0)<-3,'Actual rear chase camera');
  for(let model=0;model<6;model++){
   await page.locator('[data-fleet-ship="'+model+'"]').click();const edition=model%3;await page.locator('[data-fleet-edition="'+edition+'"]').click();
   await page.waitForFunction(({model,edition})=>window.__shiftlineFlightQA?.rendered&&window.__shiftlineFlightQA.model===model&&window.__shiftlineFlightQA.edition===edition,{model,edition},{timeout:60000});
   assert.equal(await page.locator('[data-garage-light="track"]').getAttribute('aria-pressed'),'true');
   await page.locator('.garage3DCanvas').screenshot({path:'qa-v162/'+kind.name()+'-track-'+model+'.png',timeout:60000});
  }
  await page.locator('#garageZoomView').click();await page.locator('#garageResetView').click();
  await page.waitForFunction(()=>window.__shiftlineFlightQA?.rendered&&window.__shiftlineFlightQA.elapsed<1,null,{timeout:60000});
  for(let i=0;i<2;i++)for(const mode of['studio','night','track']){await page.locator('[data-garage-light="'+mode+'"]').click();await page.waitForFunction(m=>window.__shiftlineLightingQA?.mode===m,mode);}
  await page.setViewportSize({width:932,height:430});await page.locator('.garage3DCanvas').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>{const c=document.querySelector('.garage3DCanvas'),q=window.__shiftlineFlightQA;return q?.active&&q.rendered&&c.width===Math.floor(Math.round(c.getBoundingClientRect().width)*Math.min(devicePixelRatio,1.75));},null,{timeout:60000});
  await page.screenshot({path:'qa-v162/'+kind.name()+'-landscape.png',fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Landscape has no horizontal overflow');
  await page.locator('[data-garage-light="studio"]').click();await page.waitForFunction(()=>window.__shiftlineFlightQA?.active===false);
  assert.ok(await page.locator('#garageCockpitView').isEnabled());await page.locator('#garageCockpitView').click();await page.locator('#garageCockpitView').click();
  await page.locator('.garage3DCanvas').screenshot({path:'qa-v162/'+kind.name()+'-studio-return.png',timeout:60000});
  await page.locator('[data-tab="race"]').click();await page.locator('#launch').click();await page.waitForFunction(()=>!document.querySelector('#hud').classList.contains('off'),null,{timeout:90000});
  await page.screenshot({path:'qa-v162/'+kind.name()+'-race.png',timeout:60000});
  assert.deepEqual(errors,[]);console.log('PASS V163 '+kind.name()+': all 18 reflective finishes, legacy save, persistent selection, live six-ship tunnel preview, chase motion, repeated switches, mobile layouts and race launch.');
 }finally{await writeFile('qa-v162/'+kind.name()+'-errors.json',JSON.stringify(errors,null,2));await browser.close();}
}
