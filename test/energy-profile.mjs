// SHIFTLINE energy-workload diagnostic. Browser GPU load is a proxy, NOT iPhone battery watts.
// Runs unmodified production game on the real Cloudflare origin, measures WebGL activity.
import {chromium} from 'playwright';
const origin='https://shiftline-game.beyondthebox.workers.dev/?battery-probe=97';
const browser=await chromium.launch({headless:true,args:[
 '--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
 '--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']});
const page=await browser.newPage({viewport:{width:430,height:932},deviceScaleFactor:3,isMobile:true,hasTouch:true});
await page.addInitScript(()=>{
 const stat=window.__energyProbe={draws:0,triangles:0,defaultDraws:0,clears:0,glCalls:0,contexts:[],last:null};
 const orig=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(kind,options){
  const gl=orig.call(this,kind,options);
  if(!/webgl/.test(String(kind))||!gl||gl.__energyInstrumented)return gl;
  gl.__energyInstrumented=true;stat.contexts.push({kind,settings:gl.getContextAttributes?.(),powerPreference:options?.powerPreference});
  let backbuffer=true;
  const bind=gl.bindFramebuffer.bind(gl);
  gl.bindFramebuffer=function(target,fb){if(target===gl.FRAMEBUFFER||target===gl.DRAW_FRAMEBUFFER)backbuffer=fb===null;return bind(target,fb)};
  for(const method of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){
   if(typeof gl[method]!=='function')continue;const original=gl[method].bind(gl);
   gl[method]=function(...args){stat.draws++;if(backbuffer)stat.defaultDraws++;return original(...args)};
  }
  const clear=gl.clear.bind(gl);gl.clear=function(...args){stat.clears++;return clear(...args)};
  stat.last=gl;return gl;
 };
});
const client=await page.context().newCDPSession(page);
await client.send('Performance.enable');
const getMetrics=async()=>Object.fromEntries((await client.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const perf=async(label,seconds=7)=>{
 await sleep(1700);
 const before=await page.evaluate(()=>({draws:__energyProbe.draws,defaultDraws:__energyProbe.defaultDraws,clears:__energyProbe.clears,db:[__energyProbe.last?.drawingBufferWidth||0,__energyProbe.last?.drawingBufferHeight||0],ctx:__energyProbe.contexts}));
 const m0=await getMetrics(),start=Date.now();await sleep(seconds*1000);const m1=await getMetrics();
 const after=await page.evaluate(()=>({draws:__energyProbe.draws,defaultDraws:__energyProbe.defaultDraws,clears:__energyProbe.clears,db:[__energyProbe.last?.drawingBufferWidth||0,__energyProbe.last?.drawingBufferHeight||0]}));
 const elapsed=(Date.now()-start)/1000;
 const row={scenario:label,seconds:+elapsed.toFixed(2),bufferPixels:after.db[0]*after.db[1],buffer:after.db,
  drawCallsPerSecond:+((after.draws-before.draws)/elapsed).toFixed(1),
  visibleCompositesPerSecond:+((after.defaultDraws-before.defaultDraws)/elapsed).toFixed(1),
  clearsPerSecond:+((after.clears-before.clears)/elapsed).toFixed(1),
  rendererTaskSecondsPerSecond:+((m1.TaskDuration-m0.TaskDuration)/elapsed).toFixed(3),
  rendererScriptSecondsPerSecond:+((m1.ScriptDuration-m0.ScriptDuration)/elapsed).toFixed(3),
  jsHeapMB:+(m1.JSHeapUsedSize/1048576).toFixed(1)};
 console.log('ENERGY_PROFILE '+JSON.stringify(row));return row;
};
const apply=async(q,fps)=>{
 await page.evaluate(({q,fps})=>{
  const quality=document.getElementById('quality');quality.value=q;
  quality.dispatchEvent(new Event('change',{bubbles:true}));
  window.dispatchEvent(new Event('shiftline-quality'));
  const frame=document.getElementById('frameLimit');frame.value=String(fps);frame.dispatchEvent(new Event('change',{bubbles:true}));
 },{q,fps});await sleep(900);
};
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForFunction(()=>window.shiftlineReady===true,{timeout:90000});
 console.log('GAME_INITIALISED '+JSON.stringify(await page.evaluate(()=>({dpr:devicePixelRatio,viewport:[innerWidth,innerHeight],quality:document.querySelector('#quality').value,frameLimit:document.querySelector('#frameLimit').value,contexts:__energyProbe.contexts}))));
 const result=[];
 result.push(await perf('menu_adaptive_30',7));
 await apply('low',30);result.push(await perf('menu_low_30',7));
 await apply('auto',60);
 await page.evaluate(()=>document.getElementById('launch').click());
 await page.waitForFunction(()=>!document.getElementById('count').classList.contains('off'),{timeout:30000});
 await sleep(5000);
 result.push(await perf('race_adaptive_60',8));
 await apply('auto',30);result.push(await perf('race_adaptive_30',8));
 await apply('low',30);result.push(await perf('race_low_30',8));
 await apply('high',60);result.push(await perf('race_ultra_60',8));
 console.log('ENERGY_REPORT '+JSON.stringify({ok:true,device:'headless Chromium with software WebGL (not an iPhone)',result,errors}));
 if(errors.length)process.exitCode=1;
}catch(e){console.error('ENERGY_TEST_FAILED '+e.stack);process.exitCode=1}
finally{await browser.close()}
