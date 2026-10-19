import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir} from 'node:fs/promises';
import {openSoloDemo} from './menu-navigation.mjs';
import {FLEET_EDITIONS,fleetFinish} from '../public/fleet-designs-v162.js';

const browserName=process.env.FLEET_BROWSER||'chromium',range=process.env.FLEET_GROUP||'0-2';
const [low,high]=range.split('-').map(Number);
const kind=browserName==='webkit'?webkit:chromium;
const output='qa-v167/'+browserName+'-'+range;await mkdir(output,{recursive:true});
const flags=['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
const browser=await kind.launch(kind===chromium?{headless:true,args:flags}:{headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',e=>{if(e.type()==='error'&&/shader error|WebGLProgram|INVALID_OPERATION|race preparation failed/i.test(e.text()))errors.push(e.text());});
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
  assert.ok(state.actual&&!state.craftVisible,'Nose should be in cockpit overlay and world hull fully hidden');
  assert.equal(state.noseAttachmentCount,state.pieces+state.hoodCount+2,'True hood, authentic nose, painted rim and solid belly must share cockpit camera');
  assert.equal(state.hoodCount,4,'Each ship must load two physical body cowls and two illuminated shoulder rails');
  assert.equal(state.hoodSource.length,4,'Pilot hood must come from four real exterior ship components');
  assert.ok(state.hoodSource.every(p=>p.model===model&&p.edition===edition),'Cockpit hood belongs to the wrong ship');
  assert.ok(state.hoodSource.filter(p=>p.role==='paint').every(p=>p.maxZ>.30&&p.minY<-.40),
    'Rear cowls must sweep behind the dash and under the pilot station');
  assert.ok(state.hoodSource.filter(p=>p.role==='accent').every(p=>p.maxZ>.28&&p.minY<-.32),
    'Canopy trim accents must run back under the dashboard');
  assert.equal(state.reflectionPaint.length,2,'Two factory-painted ship cowls required');
  assert.ok(state.reflectionPaint.every(p=>p.reflective&&p.clearcoat>.9&&p.roughness<.33),
    'Cockpit paint must retain genuine metallic clearcoat and HDR reflections');
  assert.ok(state.hoodGeometry.every(p=>p.triangles>=10&&p.paint&&p.body===entry.body&&p.finish===fleetFinish(model,{edition})),'Pilot hood silhouette or factory colour incorrect');
  assert.ok(state.noseBelly,'Cockpit missing filled fuselage');
  assert.ok(state.realHullContinuity,'No original three-station airframe bridge: mere end caps cannot close the gap');
  assert.equal(state.nosePaint.length,state.pieces,'Missing factory paint on nose sections');
  assert.ok(state.nosePaint.every(p=>p.factoryBody===entry.body),'Ship colour is not the selected factory livery');
  assert.ok(state.nosePaint.every(p=>p.finish===fleetFinish(model,{edition})),'Metallic, chrome or pearlescent coating mismatch');
  assert.ok(state.nosePaint.every(p=>p.color!==0xffffff),'Cockpit nose has been overpainted white');
  assert.equal(state.nosePaint[0].accentStripes,2,'Missing coloured factory markings on forward nose');
  assert.ok(state.cabinClosed,'Cockpit interior is transparent / seating shell missing');
  assert.ok(state.rigidLock>.99999,'Pilot camera orientation drifts from ship rotation');
  assert.ok(state.independentCockpitSway<1e-5,'Cockpit overlay animates independently of nose');
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
   assert.equal(q.cabinClosed,true);assert.equal(q.lockedOverlay,true);
   assert.equal(q.cameraLocked,true);assert.equal(q.renderNoseInOverlay,true);
   assert.equal(q.pilot.model,model);assert.equal(q.pilot.edition,edition);
   assert.equal(q.pilotParts,model===4?3:1);
   assert.ok(q.pilot.visibleParts.every(p=>p.visible&&p.forward>0&&p.screen.every(Number.isFinite)));
   // The new V170 hull must ACTUALLY project into the gap between the
   // painted nose and cockpit rim, while leaving the racing horizon clear.
   const join=await page.evaluate(()=>window.__shiftlinePilotAudit167.continuationCoverage());
   assert.ok(join.total>40,'Full-circumference ship hull has no visible pixels: '+JSON.stringify({model,edition,label,join}));
   if(label==='portrait')assert.ok(join.gap>25,'Cockpit black gap is still uncovered by actual hull: '+JSON.stringify({model,edition,join}));
   assert.ok(join.horizon<120,'Continuation blocks front racing corridor: '+JSON.stringify({model,edition,label,join}));
   assert.ok(join.areaPct<(label==='portrait'?15:12),'Cockpit hull too big, swallows controls: '+JSON.stringify({model,edition,label,join}));
   // Use isolated stable cockpit 3D render, avoiding temporal racing
   // post-effects creating false giant nose silhouettes.
   const delta=await page.evaluate(()=>window.__shiftlinePilotAudit167.noseCoverage());
   const hood=await page.evaluate(()=>window.__shiftlinePilotAudit167.hoodCoverage());
   assert.ok(hood.total>12,'V172 ship hood is not actually visible in the pilot camera: '+JSON.stringify({model,edition,label,hood}));
   assert.ok(hood.topPct<8,'Ship-specific hood blocks racing sightline: '+JSON.stringify({model,edition,label,hood}));
   console.log('PILOT HOOD V172 '+browserName+' '+model+'/'+edition+' '+label+' '+JSON.stringify(hood));

   // readRenderTargetPixels binds an offscreen framebuffer. A new FULL
   // render is mandatory before taking a screenshot, particularly on WebKit:
   // otherwise only HTML HUD overlays are captured against an empty canvas.
   await page.evaluate(()=>window.__shiftlinePilotAudit167.frame());
   const img=await page.screenshot({path:output+'/'+model+'-'+edition+'-'+label+'.png',timeout:60000});
   const screenshot=PNG.sync.read(img);
   assert.equal(screenshot.width,w);assert.equal(screenshot.height,h);
   // Real Level 1 has illuminated tunnel panels and gates in the forward
   // window. A black WebGL canvas with visible HTML controls is NOT a pass.
   let litPixels=0;
   for(let yy=Math.floor(h*.13);yy<Math.floor(h*.72);yy+=2){
    for(let xx=Math.floor(w*.09);xx<Math.floor(w*.91);xx+=2){
     const i=(yy*w+xx)*4;
     if(Math.max(screenshot.data[i],screenshot.data[i+1],screenshot.data[i+2])>100)litPixels++;
    }
   }
   assert.ok(litPixels>350,'ECLIPSE 3D racing tunnel absent in '+browserName+'/'+model+'/'+edition+'/'+label+' (HTML HUD alone cannot pass)');
   assert.ok(delta.total>22,'Nose missing/hidden in '+model+'/'+edition+'/'+label+' '+JSON.stringify(delta));
   assert.ok(delta.areaPct<15,'Nose blocks too much of '+label+' screen: '+JSON.stringify({model,edition,delta}));
   assert.ok(delta.topPct<5.5,'Fuselage blocks forward racing horizon: '+JSON.stringify({model,edition,delta}));
   console.log('PASS PILOT '+browserName+' '+model+'/'+edition+' '+entry.name+' '+label+' '+JSON.stringify({eye:state.eye,nose:delta,continuity:join,paint:state.nosePaint[0],belly:state.noseBelly}));
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
