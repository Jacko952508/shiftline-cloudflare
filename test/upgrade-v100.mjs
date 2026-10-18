// Production-safe v100 regression: serves exactly the candidate branch from a local HTTP server.
// All six game worlds, active Observatory, cockpit rendering, graphics profile, save continuity.
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
const base=process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765';
const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const expectedEngine=html.match(/race-engine[.]js[?]v=[0-9]+/)?.[0];
assert.ok(expectedEngine,'Missing revisioned race engine reference');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
await mkdir('upgrade-screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('console',message=>{if(message.type()==='error')console.log('CONSOLE ERROR:',message.text().slice(0,250))});
page.on('requestfailed',r=>{if(!r.url().includes('/music/'))console.log('NETWORK FAILED:',r.url().slice(0,120),r.failure()?.errorText)});
page.addInitScript(()=>{
 const key='shiftlineEclipseProgressV1';
 if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({seaRevision:3,courseRevisions:{1:2,2:3},xp:314,craft:0,color:0,custom:{},records:{3:12345},ghosts:{},medals:{},races:1,sentinel:'v100-retain'}));
});
function checkImage(buffer,label){
 const p=PNG.sync.read(buffer);const first=[p.data[0],p.data[1],p.data[2]],n=p.width*p.height;
 let changed=0;for(let i=0;i<n;i+=Math.max(1,Math.floor(n/22000))){const k=i*4;if(Math.abs(p.data[k]-first[0])+Math.abs(p.data[k+1]-first[1])+Math.abs(p.data[k+2]-first[2])>30)changed++}
 assert.ok(changed>250,label+' screenshot unexpectedly blank');console.log('PASS visible '+label+' / varied pixels '+changed)
}
try{
 await page.goto(base+'/?candidate=v100',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});
 const start=await page.evaluate(()=>({menu:!document.querySelector('#menu').classList.contains('off'),six:document.querySelectorAll('.courseSelector [data-course]').length,quality:[...document.querySelector('#quality').options].map(o=>o.textContent),source:document.querySelector('script[src*="race-engine.js"]')?.getAttribute('src'),sentinel:JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')).sentinel}));
 assert.equal(start.six,6);assert.ok(start.menu);assert.deepEqual(start.quality,['ULTRA','ADAPTIVE','BATTERY SAVER']);assert.equal(start.source,expectedEngine,'Candidate should load this checkout engine');assert.equal(start.sentinel,'v100-retain');
 console.log('PASS launch, 6 course selector and progress-store compatibility '+JSON.stringify(start));
 checkImage(await page.screenshot({path:'upgrade-screenshots/01-menu.png'}),'menu');
 for(let course=1;course<=6;course++){
  await page.evaluate(n=>document.querySelector('[data-course="'+n+'"]').click(),course);
  await page.waitForFunction(n=>document.querySelector('[data-course="'+n+'"]').classList.contains('selected'),course,null,{timeout:20000});
  const display=await page.evaluate(()=>({name:document.querySelector('#trackTitle').textContent,ready:window.shiftlineReady}));
  assert.ok(display.name.length>3&&display.ready);
  await page.evaluate(()=>document.querySelector('#obsOpen').click());
  await page.waitForFunction(()=>!document.querySelector('#observatory').classList.contains('off'),null,{timeout:45000});
  assert.ok(await page.evaluate(()=>document.querySelector('#observatoryViewport').getBoundingClientRect().height>100));
  for(const mode of ['overhead','chase','fly','orbit']){await page.evaluate(m=>document.querySelector('[data-obs-mode="'+m+'"]').click(),mode);await sleep(140)}
  await page.evaluate(()=>document.querySelector('[data-obs-chapter="2"]').click());
  await page.evaluate(()=>{const el=document.querySelector('#obsScrub');el.value='580';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await sleep(450);
  if(course===2||course===6)checkImage(await page.screenshot({path:'upgrade-screenshots/0'+course+'-observatory.png'}),'observatory course '+course);
  await page.evaluate(()=>document.querySelector('#obsClose').click());
  await page.waitForFunction(()=>document.querySelector('#observatory').classList.contains('off'),null,{timeout:25000});
  console.log('PASS WORLD '+course+' '+display.name+' / four camera modes, scrubbing, close');
 }
 // Battery saver and observability are opt-in; retain the original quality localStorage key.
 await page.evaluate(()=>document.querySelector('#settingsBtn').click());
 await page.evaluate(()=>{
  const q=document.querySelector('#quality');q.value='low';q.dispatchEvent(new Event('change',{bubbles:true}));
  const hud=document.querySelector('#perfToggle');hud.checked=true;hud.dispatchEvent(new Event('change',{bubbles:true}));
 });
 const config=await page.evaluate(()=>({quality:localStorage.getItem('eclipseQualityV1'),hud:localStorage.getItem('shiftlinePerfHUD')}));
 assert.equal(config.quality,'low');assert.equal(config.hud,'1');
 await page.evaluate(()=>document.querySelector('#settingsBack').click());
 await page.evaluate(()=>document.querySelector('[data-course="1"]').click());
 await page.evaluate(()=>document.querySelector('#launch').click());
 await page.waitForFunction(()=>!document.querySelector('#hud').classList.contains('off'),null,{timeout:40000});
 // Software WebGL can stretch the 3-second simulated countdown considerably;
 // wait for the actual race state rather than an arbitrary real-time sleep.
 await page.waitForFunction(()=>document.querySelector('#count').classList.contains('off'),null,{timeout:90000});
 await page.evaluate(()=>document.querySelector('#cameraBtn').click());
 await page.waitForFunction(()=>document.body.classList.contains('cockpitActive'),null,{timeout:40000});
 assert.equal(await page.locator('#cameraBtn').getAttribute('aria-label'),'Switch to chase view');
 await page.waitForFunction(()=>{const h=document.querySelector('#perfHUD');return !!h.textContent&&!h.classList.contains('off')},null,{timeout:75000});
 checkImage(await page.screenshot({path:'upgrade-screenshots/07-cockpit.png'}),'cockpit');
 const hud=await page.evaluate(()=>({text:document.querySelector('#perfHUD').textContent,hidden:document.querySelector('#perfHUD').classList.contains('off')}));
 assert.ok(hud.text.includes('FPS')&&!hud.hidden,'Live performance overlay did not render: '+JSON.stringify(hud));
 console.log('PASS first-person cockpit, texture display and actual live device FPS metrics '+JSON.stringify(hud));
 await page.evaluate(()=>document.querySelector('#cameraBtn').click());
 await page.waitForFunction(()=>!document.body.classList.contains('cockpitActive'),null,{timeout:25000});
 await page.evaluate(()=>document.querySelector('#pauseBtn').click());
 await page.waitForFunction(()=>!document.querySelector('#pause').classList.contains('off'),null,{timeout:25000});
 await page.evaluate(()=>document.querySelector('#quit').click());
 await page.waitForFunction(()=>!document.querySelector('#menu').classList.contains('off'),null,{timeout:80000});
 const final=await page.evaluate(()=>({progress:JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')),quality:localStorage.getItem('eclipseQualityV1')}));
 assert.equal(final.progress.sentinel,'v100-retain');assert.ok(final.progress.xp>=314);assert.equal(final.progress.records['3'],12345);assert.equal(final.quality,'low');
 assert.deepEqual(errors,[],'Uncaught page errors: '+errors.join('; '));
 console.log('PASS save record, XP, texture profile and player state preserved; no JS exceptions');
 console.log('PASS v100 staged six-map regression completed without production deployment');
}catch(e){console.error('STAGED TEST FAILED',e.stack);console.error('PAGE ERRORS',JSON.stringify(errors));process.exitCode=1;}finally{await browser.close()}
