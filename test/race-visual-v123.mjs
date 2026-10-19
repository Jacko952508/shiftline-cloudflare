import {openSoloDemo,openTrackInspection} from './menu-navigation.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const site=process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']});
const page=await browser.newPage({
 viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,
 userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
});
const errors=[];
page.on('pageerror',e=>errors.push(e.stack||e.message));
try{
 await page.addInitScript(()=>{
  localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({
   xp:5000,craft:5,color:0,custom:{wing:3,engine:4,fin:2,trail:1},
   records:{1:112000},medals:{},ghosts:{},races:4
  }));
 });
 await page.goto(site+'/?shipqa=1',{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});await openSoloDemo(page,1);
 await page.locator('#launch').click();
 await page.waitForFunction(()=>document.querySelector('#count')?.classList.contains('off'),null,{timeout:150000});
 await page.waitForFunction(()=>window.__shiftlineRaceVisualQA?.path==='native-webkit'&&window.__shiftlineTrailQA?.raceView===true,null,{timeout:35000});
 let state=await page.evaluate(()=>({view:window.__shiftlineRaceVisualQA,rocket:window.__shiftlineTrailQA,layout:{width:document.querySelector('#game').width,height:document.querySelector('#game').height},save:JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1'))}));
 assert.equal(state.view.safeMobile,true);
 assert.equal(state.view.offscreenPasses,0,'iPhone race must avoid offscreen HDR tiles');
 assert.deepEqual(state.view.viewport,[390,844],'High-DPI race viewport must use logical pixels');
 assert.equal(state.rocket.raceView,true,'race-only compact trails activated');
 assert.ok(state.rocket.length<2.8,'idle exhaust cannot cover the whole race view');
 assert.equal(state.save.records[1],112000,'saved records untouched');
 assert.ok(state.layout.width>100&&state.layout.height>100);
 await page.locator('#boost').tap();
 // The old one-second fixed delay could extend past a real collision, which
 // correctly disables boost and made this otherwise-valid test intermittent.
 await page.waitForFunction(min=>window.__shiftlineTrailQA?.boost===true&&window.__shiftlineTrailQA.length>min+.18,state.rocket.length,{timeout:12000,polling:50});
 const after=await page.evaluate(()=>({view:window.__shiftlineRaceVisualQA,rocket:window.__shiftlineTrailQA}));
 assert.equal(after.rocket.boost,true);
 assert.ok(after.rocket.length>state.rocket.length+.18,'boost expands a visible plume');
 assert.ok(after.rocket.length<4.2,'boost stays within a useful iPhone chase-camera view');
 assert.deepEqual(errors,[]);
 console.log('PASS V123 iPhone race direct renderer, compact racing exhaust and saved progress',JSON.stringify({state,after}));
}finally{await browser.close();}
