import {chromium,webkit} from 'playwright';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765';
const args=['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
await mkdir('phase3-v130-frames',{recursive:true});
async function run(kind,courses){
 const browser=await kind.launch(kind===chromium?{headless:true,args}:{headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'});
 const errs=[],shaders=[];
 page.on('pageerror',e=>errs.push(e.message));
 page.on('console',e=>{if(e.type()==='error'&&/WebGLProgram|Shader Error|VALIDATE_STATUS/i.test(e.text()))shaders.push(e.text())});
 try{
  await page.addInitScript(()=>localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({xp:5000,craft:2,color:0,custom:{wing:2,engine:2,fin:1,trail:0},records:{1:112000},ghosts:{},medals:{},races:4})));
  await page.goto(base+'/?shipqa=1&sceneryqa=1&groundqa=1&atmosqa=1&landmarkqa=1',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});
  assert.equal(await page.locator('script[src^="race-engine.js"]').getAttribute('src'),'race-engine.js?v=143');
  for(const course of courses){
   if(course!==1)await page.evaluate(c=>document.querySelector('[data-course="'+c+'"]').click(),course);
   await page.locator('#obsOpen').click();
   await page.waitForFunction(c=>window.__shiftlineSceneryQA?.course===c&&window.__shiftlineSceneryQA.version===136,course,{timeout:70000});
   const info=await page.evaluate(()=>window.__shiftlineSceneryQA);
   const atmosphere=await page.evaluate(()=>window.__shiftlineAtmosphereQA);
   const landmark=await page.evaluate(()=>window.__shiftlineChapterLandmarkQA);
   assert.equal(landmark?.version,143,'Signature landmarks not loaded '+course);
   assert.equal(landmark.course,course);
   assert.ok(landmark.sites>=8,'Chapter world set pieces missing '+course);
   assert.ok(landmark.chapterCounts.every(n=>n>0),'Chapter scene missing landmarks '+course);
   assert.ok(landmark.minClearance>=24,'Landmark fails whole-track collision clearance '+course);
   assert.equal(landmark.collisionObjects,0);
   assert.equal(landmark.transparent,0);
   assert.equal(landmark.shadowCasters,0);
   assert.equal(atmosphere?.version,142,'Atmosphere module missing on course '+course);
   assert.equal(atmosphere.course,course);
   assert.ok(atmosphere.density>0&&atmosphere.density<.002);
   assert.equal(atmosphere.addedPasses,0);assert.equal(atmosphere.addedGeometry,0);
   assert.ok(info.minClearance>=24);
   assert.ok(info.landmarks>20);
   assert.equal(info.chapterCounts.reduce((a,b)=>a+b,0),info.landmarks);
   assert.ok(info.chapterCounts.every(n=>n>0),'Scenery missing from a chapter');
   assert.ok(info.nearCount>(course===4?3:8),'Foreground landmarks missing on course '+course);
   if(course===4){assert.ok(info.stormMountainCount>12,'TEMPEST ridges missing');assert.equal(info.stormPoleCount,0,'Floating pole forest returned');}
   assert.equal(info.collisionObjects,0);assert.equal(info.glassSurfaces,0);assert.equal(info.shadows,0);
   if(course>=3){
    const floor=await page.evaluate(()=>window.__shiftlineGroundQA);
    assert.equal(floor?.version,140,'V140 ground details have not loaded on '+course);
    assert.equal(floor.course,course);assert.ok(floor.clusters>25);
    assert.equal(floor.drawCalls,2);assert.equal(floor.collisionObjects,0);
    assert.equal(floor.transparentSurfaces,0);assert.equal(floor.shadows,0);
    console.log('PASS V140 floor '+JSON.stringify(floor));
   }
   if(course===5){
    const forest=await page.evaluate(()=>window.__shiftlineFoliageQA);
    assert.equal(forest?.version,139,'New VERDANT canopies did not load');
    assert.ok(forest.trees>=20,'Not enough trees survived course clearance tests');
    assert.equal(forest.crowns,forest.trees*5);
    assert.equal(forest.geometry,'IcosahedronGeometry');
    assert.equal(forest.usesInstancedColors,true);
    assert.equal(forest.collisionObjects,0);
    console.log('PASS V139 foliage '+JSON.stringify(forest));
   }
   const ss=await page.locator('#game').screenshot({timeout:65000});
   const png=PNG.sync.read(ss);
   let colored=0,bright=0;
   for(let i=0;i<png.width*png.height;i+=17){const p=i*4,r=png.data[p],g=png.data[p+1],b=png.data[p+2];if(Math.max(r,g,b)-Math.min(r,g,b)>17)colored++;if(r+g+b>250)bright++}
   assert.ok(colored>120&&bright>80,'Blank or dark viewport '+course+': '+JSON.stringify({colored,bright}));
   console.log('PASS V136 '+kind.name()+' '+course+' '+JSON.stringify({name:info.name,landmarks:info.landmarks,minClearance:info.minClearance,colored,bright}));
   if(course===1||course===3||course===4||course===5||course===6){
    await page.locator('#game').screenshot({path:'phase3-v130-frames/'+kind.name()+'-course-'+course+'.png'});
    await page.locator('#obsScrub').evaluate(el=>{el.value='520';el.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.waitForTimeout(450);
    await page.locator('#game').screenshot({path:'phase3-v130-frames/'+kind.name()+'-midcourse-'+course+'.png'});
   }
   await page.locator('#obsClose').click();
   if(course===4){
    await page.waitForFunction(()=>!document.querySelector('#menu').classList.contains('off'),null,{timeout:18000});
    const menu=page.locator('#menu');
    await menu.screenshot({path:'phase3-v130-frames/'+kind.name()+'-tempest-menu.png'});
    const info=await menu.evaluate(el=>({background:getComputedStyle(el).backgroundImage,title:el.querySelector('#trackTitle')?.textContent,visible:getComputedStyle(el).display!=='none'}));
    assert.equal(info.visible,true,'Main menu must return after Observatory');
    assert.equal(info.title,'TEMPEST');
    assert.ok(info.background.includes('linear-gradient'),'Menu backdrop missing, storm world must not obscure navigation');
   }
  }
  await page.evaluate(()=>document.querySelector('[data-course="1"]').click());
  await page.locator('#launch').click();
  await page.waitForFunction(()=>document.querySelector('#count')?.classList.contains('off')===true,null,{timeout:170000});
  await page.waitForFunction(()=>window.__shiftlineRaceVisualQA?.path==='native-webkit',null,{timeout:45000});
  const state=await page.evaluate(()=>({
   scenery:window.__shiftlineSceneryQA,
   effects:window.__shiftlineRaceVisualQA,
   record:JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')).records?.[1],
   contextLost:document.getElementById('game').getContext('webgl2')?.isContextLost()
  }));
  assert.equal(state.record,112000);assert.equal(state.contextLost,false);
  const png=PNG.sync.read(await page.locator('#game').screenshot({path:'phase3-v130-frames/'+kind.name()+'-race.png'}));
  let lit=0;for(let i=0;i<png.width*png.height;i+=14){const p=i*4;if(png.data[p]+png.data[p+1]+png.data[p+2]>90)lit++}
  assert.ok(lit>1100,'Race black screen '+lit);
  assert.deepEqual(errs,[]);assert.deepEqual(shaders,[]);
  console.log('PASS V130 '+kind.name()+' race, persistence, renderer '+JSON.stringify(state.effects));
 }finally{await browser.close()}
}
await run(chromium,[1,2,3,4,5,6]);
await run(webkit,[1]);
