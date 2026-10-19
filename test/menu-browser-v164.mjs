import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {openSoloDemo} from './menu-navigation.mjs';

const origin=process.env.SHIFTLINE_TEST_ORIGIN||process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765';
const args=['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
await mkdir('qa-v164',{recursive:true});
for(const kind of[chromium,webkit]){
 const browser=await kind.launch(kind===chromium?{headless:true,args}:{headless:true}),context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error'&&/Shader Error|WebGLProgram|VALIDATE_STATUS/.test(e.text()))errors.push(e.text());});
 try{
  await page.addInitScript(()=>{localStorage.setItem('eclipseQualityV1','low');localStorage.setItem('shiftlineSound','0');});
  await page.goto(origin+'/?menuqa=1&shipqa=1',{waitUntil:'domcontentloaded',timeout:65000});await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});
  async function screen(name){assert.equal(await page.locator('#menu').getAttribute('data-screen'),name);assert.equal(await page.locator('#menu .flowPage:not(.off)').count()+(await page.locator('#garagePage:not(.off),#recordsPage:not(.off)').count()),1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));}
  await screen('home');await page.waitForFunction(()=>window.__shiftlineMenuBackgroundQA?.time>1,null,{timeout:90000});const background=await page.evaluate(()=>window.__shiftlineMenuBackgroundQA.position);await page.waitForFunction(p=>Math.hypot(...window.__shiftlineMenuBackgroundQA.position.map((v,i)=>v-p[i]))>1,background,{timeout:60000});assert.deepEqual(await page.locator('#homePage button:visible strong').allTextContents(),['SOLO','GARAGE','MULTIPLAYER','SETTINGS']);
  assert.equal(await page.locator('[data-mode]:visible,[data-course]:visible,#launch:visible').count(),0,'Home contains no mode, level, or launch controls');
  await page.screenshot({path:'qa-v164/'+kind.name()+'-home.png'});
  await page.locator('[data-home="solo"]').click();await screen('modes');assert.equal(await page.locator('[data-mode]:visible').count(),4);assert.equal(await page.locator('[data-course]:visible').count(),0);
  await page.screenshot({path:'qa-v164/'+kind.name()+'-modes.png'});
  await page.locator('[data-mode="race"]').click();await screen('levels');assert.equal(await page.locator('[data-course]:visible').count(),6);assert.equal(await page.locator('[data-mode]:visible').count(),0);
  await page.screenshot({path:'qa-v164/'+kind.name()+'-levels.png'});
  const demoChecks=[];
  for(let course=1;course<=6;course++){
   await openSoloDemo(page,course);await screen('demo');await page.waitForFunction(c=>window.__shiftlineDemoQA?.rendered&&window.__shiftlineDemoQA.course===c,course,{timeout:120000});
   assert.deepEqual((await page.locator('#menu button:visible').allTextContents()).map(s=>s.replace(/[←▶]/g,'').trim()),['BACK','PLAY']);
   const start=await page.evaluate(()=>window.__shiftlineDemoQA);await page.waitForFunction(d=>window.__shiftlineDemoQA.distance>d+12,start.distance,{timeout:60000});
   const q=await page.evaluate(()=>window.__shiftlineDemoQA);assert.ok(q.hazards>25);assert.equal(q.mode,'race');demoChecks.push(q);
   await page.screenshot({path:'qa-v164/'+kind.name()+'-demo-'+course+'.png'});
   await page.locator('#demoBack').click();await screen('levels');
  }
  for(const mode of['trial','combat','tour']){await page.locator('#menuBack').click();await screen('modes');await page.locator('[data-mode="'+mode+'"]').click();await screen('levels');await openSoloDemo(page,1,mode);assert.equal(await page.evaluate(()=>window.__shiftlineDemoQA.mode),mode);await page.locator('#demoBack').click();}
  await page.locator('#menuBack').click();await page.locator('#menuBack').click();await screen('home');
  await page.locator('[data-home="garage"]').click();await screen('garage');await page.waitForFunction(()=>window.__shiftlineFleetQA?.rendered,null,{timeout:60000});assert.equal(await page.locator('[data-fleet-ship]:visible').count(),6);await page.screenshot({path:'qa-v164/'+kind.name()+'-garage.png'});await page.locator('#menuBack').click();await screen('home');
  await page.locator('#settingsBtn').click();assert.ok(await page.locator('#settings').isVisible());assert.ok(await page.locator('#menu').isHidden());await page.locator('#settingsBack').click();await screen('home');
  await page.locator('#online').click();assert.ok(await page.locator('#lobby').isVisible());await page.locator('#back').click();await screen('home');
  await page.setViewportSize({width:932,height:430});await page.screenshot({path:'qa-v164/'+kind.name()+'-landscape-home.png'});await page.locator('[data-home="solo"]').click();await page.screenshot({path:'qa-v164/'+kind.name()+'-landscape-modes.png'});await page.locator('[data-mode="race"]').click();await page.screenshot({path:'qa-v164/'+kind.name()+'-landscape-levels.png'});await openSoloDemo(page,4);await page.waitForFunction(()=>window.__shiftlineDemoQA.aspect>1.9);await page.screenshot({path:'qa-v164/'+kind.name()+'-landscape-demo.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await page.locator('#launch').click();await page.waitForFunction(()=>window.__shiftlineRaceReadyQA?.course===4,null,{timeout:120000});assert.ok(await page.locator('#menu').isHidden());
  await page.locator('#pauseBtn').click();await page.locator('#quit').click();await screen('home');
  await writeFile('qa-v164/'+kind.name()+'-checks.json',JSON.stringify(demoChecks,null,2));assert.deepEqual(errors,[]);console.log('PASS V164 '+kind.name()+': four home options only, separate modes and six levels, actual moving demos with two buttons, all mode mappings, Back, garage, settings, multiplayer, portrait/landscape and race launch.');
 }catch(error){await page.screenshot({path:'qa-v164/'+kind.name()+'-failure.png'}).catch(()=>{});throw error;}finally{await writeFile('qa-v164/'+kind.name()+'-errors.json',JSON.stringify(errors,null,2));await browser.close();}
}
