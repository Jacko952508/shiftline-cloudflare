import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir} from 'node:fs/promises';
import {openSoloDemo} from './menu-navigation.mjs';
import {FLEET_EDITIONS} from '../public/fleet-designs-v162.js';

const browserName=process.env.FLEET_BROWSER||'chromium',range=process.env.FLEET_GROUP||'0-2';
const [low,high]=range.split('-').map(Number);
const kind=browserName==='webkit'?webkit:chromium;
const output='qa-v167/'+browserName+'-'+range;await mkdir(output,{recursive:true});
const flags=['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
const browser=await kind.launch(kind===chromium?{headless:true,args:flags}:{headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',e=>{if(e.type()==='error'&&/shader error|WebGLProgram|INVALID_OPERATION|race preparation failed/i.test(e.text()))errors.push(e.text());});
function difference(withNose,withoutNose){
 const a=PNG.sync.read(withNose),b=PNG.sync.read(withoutNose);
 assert.equal(a.width,b.width);assert.equal(a.height,b.height);
 let total=0,top=0,bottom=0,minY=a.height,maxY=0;
 for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){
  const i=(y*a.width+x)*4,delta=Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2]);
  if(delta>46){
   total++;if(y/a.height<.3)top++;if(y/a.height>.55)bottom++;
   minY=Math.min(y,minY);maxY=Math.max(y,maxY);
  }
 }
 return {total,top,bottom,areaPct:total/(a.width*a.height)*100,topPct:top/(a.width*a.height)*100,firstVisibleY:total?minY/a.height:1,lastVisibleY:total?maxY/a.height:0};
}
try{
 await page.addInitScript(()=>{
  localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({xp:18000,craft:0,color:0,custom:{edition:0,wing:0,engine:0},records:{1:110000},ghosts:{},medals:{},races:8}));
  localStorage.setItem('eclipseQualityV1','auto');
 });
 await page.goto('http://127.0.0.1:8765/?cockpitqa=1&lightqa=1',{waitUntil:'domcontentloaded',timeout:80000});
 await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:130000});
 await openSoloDemo(page,1,'race');
 await page.locator('#launch').click({timeout:130000});
 await page.waitForFunction(()=>window.__shiftlineRuntimeTest?.read()?.state==='countdown',null,{timeout:180000});
 await page.evaluate(()=>window.__shiftlineRuntimeTest.freeze());
 let audited=0,seen=new Set();
 for(let model=low;model<=high;model++)for(let edition=0;edition<3;edition++){
  const entry=FLEET_EDITIONS[model][edition];
  const state=await page.evaluate(({m,e})=>window.__shiftlinePilotAudit167.select(m,e),{m:model,e:edition});
  assert.equal(state.model,model,'Wrong ship model cockpit loaded');
  assert.equal(state.edition,edition,'Wrong authored edition');
  assert.equal(state.pieces,model===4?3:1,'Missing or extra forward geometry');
  assert.ok(state.actual&&state.craftVisible,'Real nose hidden');
  assert.deepEqual(state.exteriorParts,[],'Rear fuselage or exhaust remains visible through cockpit');
  assert.ok(state.noseGeometry.every(x=>x.triangles>35),'Degenerate forward hull');
  assert.equal(state.cockpitEdition.instrument,edition,'Incorrect instrument palette');
  assert.equal(state.cockpitEdition.cabin,edition,'Wrong cabin style loaded');
  for(const [w,h,label] of [[390,844,'portrait'],[844,390,'landscape']]){
   await page.setViewportSize({width:w,height:h});
   await page.waitForTimeout(100);
   const status=await page.evaluate(()=>window.__shiftlinePilotAudit167.frame());
   assert.equal(status.edition,edition);assert.ok(status.actual);
   const q=await page.evaluate(()=>window.__shiftlineCockpitQA);
   assert.equal(q.pilot.model,model);assert.equal(q.pilot.edition,edition);
   assert.equal(q.pilotParts,model===4?3:1);
   assert.ok(q.pilot.visibleParts.every(p=>p.visible&&p.forward>0&&p.screen.every(Number.isFinite)));
   const bare=await page.evaluate(()=>window.__shiftlinePilotAudit167.draw(false));
   const back=await page.screenshot({timeout:60000});
   await page.evaluate(()=>window.__shiftlinePilotAudit167.draw(true));
   const img=await page.screenshot({path:output+'/'+model+'-'+edition+'-'+label+'.png',timeout:60000});
   const delta=difference(img,back);
   assert.ok(delta.total>22,'Nose missing/hidden in '+model+'/'+edition+'/'+label+' '+JSON.stringify(delta));
   assert.ok(delta.areaPct<17,'Nose blocks too much of '+label+' screen: '+JSON.stringify({model,edition,delta}));
   assert.ok(delta.topPct<5.5,'Fuselage blocks forward racing horizon: '+JSON.stringify({model,edition,delta}));
   console.log('PASS PILOT '+browserName+' '+model+'/'+edition+' '+entry.name+' '+label+' '+JSON.stringify({eye:state.eye,nose:delta}));
  }
  // Verify returning to full-chase exterior (no forward-only geometry).
  await page.locator('#cameraBtn').click();
  await page.evaluate(()=>window.__shiftlineRuntimeTest.frame(false));
  const chase=await page.evaluate(()=>window.__shiftlineCockpitQA);
  assert.equal(chase.active,false);assert.equal(chase.worldExteriorVisible,true);
  assert.equal(chase.pilotNoseVisible,false,'Pilot-only model leaks into chase scene');
  await page.locator('#cameraBtn').click();
  await page.evaluate(()=>window.__shiftlineRuntimeTest.frame(false));
  const pilot=await page.evaluate(()=>window.__shiftlineCockpitQA);
  assert.equal(pilot.active,true);assert.equal(pilot.pilotNoseVisible,true);
  seen.add(entry.name);audited++;
 }
 assert.equal(audited,9,'Not all three styles of all three ships were checked in this job');
 assert.equal(seen.size,9,'Each styling variant must have a distinct name');
 assert.deepEqual(errors,[],'Browser or WebGL errors occurred during fleet cockpit traversal');
 console.log('PASS '+browserName+' models '+range+' all '+audited+' edition interiors and noses, both orientations, chase restore');
}finally{await browser.close();}
