import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {PNG} from 'pngjs';
const site=process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765';
const sourcePaths=['race-world.js','leviathan-world.js','cinder-world.js','expansion-world.js','surface-detail.js'];
for(const file of sourcePaths){
 const src=await readFile(new URL('../public/'+file,import.meta.url),'utf8');
 assert.ok(!src.includes('installGlassFittings'),'Extraneous transparent-frame geometry returned in '+file);
 assert.ok(!src.includes('tunnel-glass-v124'),'Broken overlapping glass frame has been reintroduced');
 if(file==='surface-detail.js'){
  assert.ok(src.includes('material.forceSinglePass=true'),'Glass should use single pass');
  assert.ok(src.includes('shiftline-glass-v38'),'Restore the previously working glass shader');
 }else assert.ok(src.includes('depthWrite:false'),'Glass must not write depth: '+file);
}
await mkdir('glass-v125-artifacts',{recursive:true});
function frameStats(buffer){
 const img=PNG.sync.read(buffer),px=img.data,n=img.width*img.height;
 let varied=0,colored=0;const stride=Math.max(1,Math.floor(n/15000));
 const ref=[px[0],px[1],px[2]];
 for(let i=0;i<n;i+=stride){
  const p=i*4,r=px[p],g=px[p+1],b=px[p+2];
  if(Math.abs(r-ref[0])+Math.abs(g-ref[1])+Math.abs(b-ref[2])>36)varied++;
  if(Math.max(r,g,b)-Math.min(r,g,b)>15)colored++;
 }
 return {width:img.width,height:img.height,varied,colored};
}
async function browserSmoke(type,courses,racing=false){
 const opts=type===chromium?
  {headless:true,args:['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']}:
  {headless:true};
 const browser=await type.launch(opts),errors=[],shaderErrors=[];
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1,
 userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'});
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('console',e=>{if(e.type()==='error'&&/WebGLProgram|VALIDATE_STATUS|Shader Error|fragment shader|vertex shader/i.test(e.text()))shaderErrors.push(e.text())});
 await page.addInitScript(()=>localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({seaRevision:3,courseRevisions:{1:2,2:3},xp:5000,craft:2,color:0,custom:{wing:2,engine:2,fin:1,trail:1},records:{1:112000},ghosts:{},medals:{},races:4})));
 try{
  await page.goto(site+'/?shipqa=1&glassSafety=125',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});
  const engine=await page.locator('script[src^="race-engine.js"]').getAttribute('src');
  assert.equal(engine,'race-engine.js?v=152','Latest safe build must be loaded');
  for(const course of courses){
   if(course!==1)await page.evaluate(n=>document.querySelector('[data-course="'+n+'"]').click(),course);
   await page.locator('#obsOpen').click({timeout:25000});
   await page.waitForFunction(()=>!document.querySelector('#observatory').classList.contains('off'),null,{timeout:35000});
   await page.waitForTimeout(650);
   const image=await page.locator('#game').screenshot({timeout:65000});
   const stats=frameStats(image);
   assert.ok(stats.width>100&&stats.height>100&&stats.varied>80,'Viewer should render a detailed image on course '+course+': '+JSON.stringify(stats));
   const state=await page.evaluate(()=>{
    const c=document.getElementById('game'),gl=c.getContext('webgl2')||c.getContext('webgl');
    return {contextLost:gl?.isContextLost(),viewerOpen:!document.querySelector('#observatory').classList.contains('off')};
   });
   assert.equal(state.contextLost,false);
   console.log('PASS V125 '+type.name()+' transparent tunnel on course '+course+' '+JSON.stringify(stats));
   if(course===1||course===6)await page.screenshot({path:'glass-v125-artifacts/'+type.name()+'-course-'+course+'.png'});
   await page.locator('#obsClose').click({timeout:15000});
   await page.waitForFunction(()=>document.querySelector('#observatory').classList.contains('off'),null,{timeout:15000});
  }
  if(racing){
   await page.evaluate(()=>document.querySelector('[data-course="1"]').click());
   await page.locator('#launch').click({timeout:20000});
   await page.waitForFunction(()=>document.querySelector('#count')?.classList.contains('off')===true,null,{timeout:170000});
   await page.waitForFunction(()=>window.__shiftlineRaceVisualQA?.path==='native-webkit',null,{timeout:40000});
   const report=await page.evaluate(()=>{
    const gl=document.getElementById('game').getContext('webgl2');
    return {renderer:window.__shiftlineRaceVisualQA,record:JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')).records?.[1],contextLost:gl?.isContextLost()};
   });
   assert.equal(report.renderer.offscreenPasses,0);
   assert.equal(report.record,112000,'Do not damage saved records');
   assert.equal(report.contextLost,false);
   const snapshot=frameStats(await page.locator('#game').screenshot({timeout:60000}));
   assert.ok(snapshot.varied>80);
   await page.screenshot({path:'glass-v125-artifacts/'+type.name()+'-actual-race.png'});
   console.log('PASS V125 actual race and save '+JSON.stringify(report)+' frame '+JSON.stringify(snapshot));
  }
  assert.deepEqual(errors,[],'No browser JavaScript errors');
  assert.deepEqual(shaderErrors,[],'No transparent shader program errors');
 }finally{await browser.close()}
}
await browserSmoke(chromium,[1,2,3,4,5,6],true);
await browserSmoke(webkit,[1,2],false);
console.log('PASS V125 all six courses, iPhone WebKit, real race, stable transparent tunnel and saved records');