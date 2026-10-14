import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await mkdir('garage-screenshots',{recursive:true});
await page.addInitScript(()=>{
 localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({seaRevision:3,courseRevisions:{1:2,2:3},xp:5000,craft:0,color:0,custom:{},records:{1:32145},ghosts:{},medals:{},races:20,career:{unlocked:[6,7,8]},sentinel:'v112-preserve'}));
});
const base='http://127.0.0.1:8765';
try{
 await page.goto(base+'/?stage=garage-v112',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.shiftlineReady===true,{timeout:120000});
 await page.locator('[data-tab="garage"]').click();
 await page.waitForTimeout(2500);
 let layout=await page.evaluate(()=>{
  const e=document.querySelector('#craftDisplay').getBoundingClientRect(),dock=document.querySelector('.garageDock').getBoundingClientRect();
  return{viewport:innerHeight,preview:e.toJSON(),dock:dock.toJSON(),options:document.querySelectorAll('.garageOptionTile').length,tabs:document.querySelectorAll('[data-garage-category]').length};
 });
 console.log('Layout',layout);
 assert.ok(layout.preview.height>130,'3D preview must remain visible on iPhone');
 assert.ok(layout.dock.bottom<=layout.viewport+2,'Bottom option rail must fit on screen');
 assert.ok(layout.preview.bottom<=layout.dock.top+4,'No 3D preview/control overlap');
 assert.equal(layout.options,6);assert.equal(layout.tabs,12);
 await page.screenshot({path:'garage-screenshots/01-ship-selection.png'});
 // Change VECTOR, switch to Razor, customise, return to VECTOR and confirm independent setup.
 await page.locator('[data-garage-category="wing"]').click();
 await page.locator('[data-choice-kind="part"][data-choice-id="3"]').click();
 await page.locator('[data-garage-category="ship"]').click();
 await page.locator('[data-choice-kind="ship"][data-choice-id="1"]').click();
 await page.locator('[data-garage-category="wing"]').click();
 await page.locator('[data-choice-kind="part"][data-choice-id="1"]').click();
 await page.locator('[data-garage-category="ship"]').click();
 await page.locator('[data-choice-kind="ship"][data-choice-id="0"]').click();
 const saved=await page.evaluate(()=>{
  const p=JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1'));
  return{xp:p.xp,record:p.records[1],sentinel:p.sentinel,vector:p.shipBuilds[0].custom.wing,razor:p.shipBuilds[1].custom.wing,color:p.color};
 });
 console.log('Per-ship save',saved);
 assert.equal(saved.vector,3);assert.equal(saved.razor,1);assert.equal(saved.record,32145);assert.equal(saved.sentinel,'v112-preserve');
 await page.locator('[data-garage-category="finish"]').click();
 await page.locator('[data-choice-kind="color"][data-choice-id="7"]').click();
 const colour=await page.evaluate(()=>JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')).color);
 assert.equal(colour,7,'Earned gold finish must equip');
 await page.screenshot({path:'garage-screenshots/02-gold-finish.png'});
 await page.locator('#garageCockpitView').click();
 await page.waitForTimeout(900);
 await page.screenshot({path:'garage-screenshots/03-cockpit.png'});
 await page.locator('#garageCockpitView').click();
 // Select all six airframes; ensure each actual 3D craft can render.
 await page.locator('[data-garage-category="ship"]').click();
 for(let i=0;i<6;i++){
  await page.locator('[data-choice-kind="ship"][data-choice-id="'+i+'"]').click();
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#garageModel').innerText(),['VECTOR','RAZOR','PHANTOM','MANTA','GEMINI','SPECTRE'][i]);
 }
 await page.screenshot({path:'garage-screenshots/04-spectre.png'});
 assert.deepEqual(errors,[],'No JS page errors');
 console.log('PASS: six 3D models, fixed preview, earned gold, cockpit and separate saved builds');
}finally{await browser.close();}
