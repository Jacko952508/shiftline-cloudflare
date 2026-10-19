import assert from 'node:assert/strict';
import {webkit,chromium} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {openSoloDemo} from './menu-navigation.mjs';
const kind=process.env.FLOW_BROWSER==='chromium'?chromium:webkit,courses=(process.env.FLOW_COURSES||'1').split(',').map(Number),output='qa-v176/'+kind.name()+'-'+courses.join('-');await mkdir(output,{recursive:true});
const browser=await kind.launch(kind===chromium?{headless:true,args:['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']}:{headless:true});
const seed={xp:18000,craft:2,color:0,custom:{edition:1},records:{1:112000},courseRevisions:{1:2,2:3},ghosts:{},medals:{},races:8};
async function loaded(course,candidate,classic=false){
 const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error'&&/WebGLProgram|shader error|INVALID_OPERATION|race preparation failed/i.test(e.text()))errors.push(e.text());});
 await page.addInitScript(p=>{localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify(p));localStorage.setItem('eclipseQualityV1','high');},seed);
 await page.goto('http://127.0.0.1:'+(candidate?8765:8764)+'/?shipqa=1&cockpitqa=1'+(classic?'&classicqa=1':''),{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.shiftlineReady&&window.__shiftlineRuntimeTest,null,{timeout:180000});
 return {ctx,page,errors};
}
try{for(const course of courses){
 const reports=[];
 for(const candidate of [false,true]){const {ctx,page,errors}=await loaded(course,candidate,true);try{
  await openSoloDemo(page,course);await page.locator('#launch').click();await page.waitForFunction(()=>window.__shiftlineRuntimeTest.read().state==='countdown',null,{timeout:240000});await page.evaluate(()=>window.__shiftlineRuntimeTest.freeze());await page.evaluate(()=>window.__shiftlineRuntimeTest.position(.12));await page.evaluate(()=>window.__shiftlineRuntimeTest.settle());
  await page.addStyleTag({content:'#hud,#sectorHUD,#event,#count{visibility:hidden!important}'});const png=await page.screenshot({path:output+'/'+course+'-'+(candidate?'candidate':'baseline')+'.png',timeout:90000});const info=await page.evaluate(()=>window.__shiftlineRuntimeTest.read());const extra=candidate?await page.evaluate(()=>window.__flow176.read()):null;reports.push({png,info,extra});assert.deepEqual(errors,[]);
 }finally{await ctx.close();}}
 const [a,b]=reports;assert.equal(a.info.ratio,b.info.ratio);assert.equal(b.info.quality,'high');assert.ok(b.extra.budget.saved>100,'Tunnel draw calls did not batch');assert.ok(b.info.calls<a.info.calls,'Visible draw calls did not decrease '+JSON.stringify({a:a.info.calls,b:b.info.calls}));
 const x=PNG.sync.read(a.png),y=PNG.sync.read(b.png);let error=0,large=0;for(let i=0;i<x.data.length;i+=4)for(let k=0;k<3;k++){const d=Math.abs(x.data[i+k]-y.data[i+k]);error+=d;if(d>16)large++;}const meanError=error/(x.width*x.height*3),changedPixels=large/(x.width*x.height*3);assert.ok(meanError<2.5&&changedPixels<.035,'High image changed '+JSON.stringify({meanError,changedPixels}));
 const {ctx,page,errors}=await loaded(course,true);try{
  await openSoloDemo(page,course,'trial');await page.locator('#practiceOptions summary').click();assert.equal(await page.locator('#practiceSectors button').count(),4);await page.locator('#practiceSectors [data-sector="1"]').click();await page.waitForFunction(()=>window.__shiftlineRuntimeTest.read().state==='countdown',null,{timeout:240000});
  let r=await page.evaluate(()=>window.__flow176.tick());assert.equal(r.variant,'practice');assert.equal(r.practiceSector,1);assert.equal(r.rivals,0);assert.ok(r.along>=r.sectors[1].start);assert.equal(r.raceEnd,r.sectors[1].end);assert.ok(r.specs.every(o=>o.s>r.sectors[1].start&&o.s<r.raceEnd));assert.ok(await page.locator('#sectorHUD').isVisible());
  await page.evaluate(()=>window.__shiftlineRuntimeTest.cockpit());assert.ok((await page.evaluate(()=>window.__shiftlineCockpitQA)).cameraLocked);await page.screenshot({path:output+'/'+course+'-practice-cockpit.png',timeout:90000});await page.evaluate(()=>window.__shiftlineRuntimeTest.cockpit());
  r=await page.evaluate(()=>window.__flow176.finish());assert.equal(r.state,'finished');assert.equal(r.splitCount,1);assert.equal(await page.locator('.sectorRow').count(),1);assert.ok(await page.locator('#nextSector').isVisible());assert.equal(await page.locator('#again').textContent(),'RETRY SECTOR');
  let p=await page.evaluate(()=>JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')));assert.equal(p.xp,seed.xp);assert.equal(p.races,seed.races);assert.deepEqual(p.records,seed.records);assert.deepEqual(p.ghosts,seed.ghosts);assert.ok(p.sectorBests['176:'+course+':practice'][1].ghost.length>=2);
  await page.locator('#again').click();await page.waitForFunction(()=>window.__flow176.read().state==='countdown',null,{timeout:240000});r=await page.evaluate(()=>window.__flow176.tick());assert.equal(r.practiceSector,1);await page.evaluate(()=>window.__flow176.finish(true));const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')));assert.deepEqual(after.sectorBests,p.sectorBests,'Impact run overwrote clean practice ghost');
  await page.locator('#nextSector').click();await page.waitForFunction(()=>window.__flow176.read().state==='countdown',null,{timeout:240000});r=await page.evaluate(()=>window.__flow176.tick());assert.equal(r.practiceSector,2);assert.ok(r.along>=r.sectors[2].start);
  await page.evaluate(()=>document.querySelector('#reducedMotion').checked=true);await page.evaluate(()=>window.__shiftlineRuntimeTest.frame());assert.equal(await page.locator('#speedfx').evaluate(el=>el.style.getPropertyValue('--flight-pressure')),'0');assert.deepEqual(errors,[]);
 }finally{await ctx.close();}
 const report={course,browser:kind.name(),baseline:a.info,candidate:b.info,budget:b.extra.budget,meanError,changedPixels};await writeFile(output+'/'+course+'.json',JSON.stringify(report,null,2));console.log('PASS V176 '+JSON.stringify(report));
}}finally{await browser.close();}
