import {chromium,webkit} from 'playwright';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765';
const browserArgs=['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
await mkdir('obstacle-v126-artifacts',{recursive:true});
async function check(kind,courses){
 const browser=await kind.launch(kind===chromium?{headless:true,args:browserArgs}:{headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'});
 const errors=[],shaders=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',e=>{if(e.type()==='error'&&/WebGLProgram|VALIDATE_STATUS|shader error/i.test(e.text()))shaders.push(e.text())});
 try{
  await page.addInitScript(()=>localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({xp:5000,craft:2,color:0,custom:{wing:2,engine:2,fin:1,trail:0},records:{1:112000},ghosts:{},medals:{},races:4})));
  await page.goto(base+'/?shipqa=1&obstacleqa=1',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});
  assert.equal(await page.locator('script[src^="race-engine.js"]').getAttribute('src'),'race-engine.js?v=138');
  for(const course of courses){
   if(course!==1)await page.evaluate(n=>document.querySelector('[data-course="'+n+'"]').click(),course);
   await page.locator('#obsOpen').click({timeout:35000});
   await page.waitForFunction(n=>window.__shiftlineObstacleQA?.course===n&&window.__shiftlineObstacleQA.obstacles>5,course,{timeout:70000});
   const info=await page.evaluate(()=>window.__shiftlineObstacleQA);
   assert.equal(info.decorOnly,true);
   assert.equal(info.clipped,true,'Every moving decoration must respect original tunnel boundary');
   assert.ok(info.metalParts>info.obstacles*.7);
   assert.ok(info.glowParts>info.obstacles*.3);
   await page.waitForTimeout(350);
   const ss=await page.locator('#game').screenshot({timeout:65000});
   const png=PNG.sync.read(ss);let varied=0,lit=0;
   for(let p=0;p<png.width*png.height;p+=21){const i=p*4,r=png.data[i],g=png.data[i+1],b=png.data[i+2];if(Math.max(r,g,b)-Math.min(r,g,b)>15)varied++;if(r+g+b>270)lit++;}
   assert.ok(varied>150&&lit>180,'Course image empty '+course+': '+JSON.stringify({varied,lit}));
   console.log('PASS V126 '+kind.name()+' course '+course+' '+JSON.stringify({info,varied,lit}));
   if(course===1||course===3||course===6)await page.screenshot({path:'obstacle-v126-artifacts/'+kind.name()+'-course-'+course+'.png'});
   await page.locator('#obsClose').click();
  }
  // Trigger the real race after inspecting hazards; verify gameplay remains usable.
  await page.evaluate(()=>document.querySelector('[data-course="1"]').click());
  await page.locator('#launch').click({timeout:20000});
  await page.waitForFunction(()=>window.__shiftlineObstacleQA?.course===1&&window.__shiftlineObstacleQA.obstacles>20,null,{timeout:85000});
  await page.waitForFunction(()=>document.querySelector('#count')?.classList.contains('off')===true,null,{timeout:155000});
  const state=await page.evaluate(()=>({
   obstacles:window.__shiftlineObstacleQA,
   record:JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')).records[1],
   lost:document.getElementById('game').getContext('webgl2')?.isContextLost()
  }));
  assert.equal(state.record,112000);
  assert.equal(state.lost,false);
  assert.ok(state.obstacles.obstacles>20);
  await page.waitForFunction(()=>window.__shiftlineRaceVisualQA?.path==='native-webkit',null,{timeout:40000});
  const frame=PNG.sync.read(await page.locator('#game').screenshot({timeout:65000}));
  let visible=0,colourful=0,nearBlack=0;
  for(let p=0;p<frame.width*frame.height;p+=11){
   const i=p*4,r=frame.data[i],g=frame.data[i+1],b=frame.data[i+2];
   if(r+g+b>65)visible++;
   if(Math.max(r,g,b)-Math.min(r,g,b)>18)colourful++;
   if(r+g+b<8)nearBlack++;
  }
  assert.ok(visible>650,'Race canvas is black on '+kind.name()+': '+JSON.stringify({visible,colourful,nearBlack}));
  assert.ok(colourful>300,'Race lost all coloured track detail on '+kind.name());
  console.log('RACE PIXELS '+kind.name()+' '+JSON.stringify({visible,colourful,nearBlack}));
  await page.screenshot({path:'obstacle-v126-artifacts/'+kind.name()+'-race.png'});
  assert.deepEqual(errors,[]);
  assert.deepEqual(shaders,[]);
  console.log('PASS V126 live race '+kind.name()+' '+JSON.stringify(state));
 }finally{await browser.close()}
}
await check(chromium,[1,2,3,4,5,6]);
await check(webkit,[1]);
