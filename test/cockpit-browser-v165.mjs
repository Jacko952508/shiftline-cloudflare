import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir} from 'node:fs/promises';
import {openSoloDemo} from './menu-navigation.mjs';

const base='http://127.0.0.1:8765',screens='qa-v165-cockpit';
await mkdir(screens,{recursive:true});
const flags=['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
function hasRenderedScene(bytes){
 const p=PNG.sync.read(bytes),arr=p.data,background=[arr[0],arr[1],arr[2]];
 let contrast=0,colored=0;
 for(let i=0;i<arr.length;i+=4*37){
  const dr=Math.abs(arr[i]-background[0])+Math.abs(arr[i+1]-background[1])+Math.abs(arr[i+2]-background[2]);
  if(dr>45)contrast++;
  if(Math.max(arr[i],arr[i+1],arr[i+2])-Math.min(arr[i],arr[i+1],arr[i+2])>35)colored++;
 }
 assert.ok(contrast>500,'Level 1 view is a blank screen');
 assert.ok(colored>200,'Level 1 color or illumination missing');
 return {contrast,colored};
}
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium?{headless:true,args:flags}:{headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',e=>{if(e.type()==='error'&&/Shader Error|WebGLProgram|INVALID_OPERATION|VALIDATE_STATUS|race preparation failed/i.test(e.text()))errors.push(e.text());});
 try{
  await page.addInitScript(()=>{localStorage.setItem('eclipseQualityV1','auto');localStorage.setItem('shiftlineSound','0');});
  await page.goto(base+'/?cockpitqa=1&lightqa=1',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});
  await openSoloDemo(page,1,'race');
  assert.equal(await page.locator('#menu').getAttribute('data-current-course'),'1');
  await page.locator('#launch').click({timeout:120000});
  await page.waitForFunction(()=>window.__shiftlineCockpitQA?.course===1&&document.querySelector('#hud:not(.off)'),null,{timeout:150000});
  let cockpit=await page.evaluate(()=>window.__shiftlineCockpitQA);
  assert.equal(cockpit.hasExteriorClone,false,'Cockpit still contains a full duplicate ship mesh');
  assert.ok(cockpit.interiorParts>=8,'Missing cockpit dashboard and canopy');
  assert.ok(cockpit.windshieldClear,'Exterior overlaps forward window');
  for(const [w,h,name] of [[390,844,'portrait'],[844,390,'landscape']]){
   await page.setViewportSize({width:w,height:h});
   await page.waitForTimeout(500);
   await page.locator('#cameraBtn').click();
   await page.waitForFunction(()=>window.__shiftlineCockpitQA?.active===true&&window.__shiftlineCockpitQA?.worldExteriorVisible===false,null,{timeout:30000});
   assert.equal(await page.locator('#cameraBtn').getAttribute('aria-label'),'Switch to chase view');
   const shot=await page.screenshot({path:screens+'/'+engine.name()+'-'+name+'-cockpit.png',timeout:65000});
   const metrics=hasRenderedScene(shot);
   assert.equal((await page.evaluate(()=>window.__shiftlineCockpitQA)).course,1);
   await page.locator('#cameraBtn').click();
   await page.waitForFunction(()=>window.__shiftlineCockpitQA?.active===false&&window.__shiftlineCockpitQA?.worldExteriorVisible===true,null,{timeout:30000});
   assert.equal(await page.locator('#cameraBtn').getAttribute('aria-label'),'Switch to cockpit view');
   await page.screenshot({path:screens+'/'+engine.name()+'-'+name+'-chase.png',timeout:65000});
   console.log('PASS ECLIPSE '+engine.name()+' '+name+' cockpit clear, race world rendered, chase restore '+JSON.stringify(metrics));
  }
  assert.deepEqual(errors,[],'Browser/WebGL errors in Level 1');
 }finally{await browser.close();}
}
