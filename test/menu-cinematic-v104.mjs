import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir} from 'node:fs/promises';

// An isolated mobile Chromium test against checked-out candidate files,
// never a live deployment. Full race / multiplayer regression follows separately.
const origin=process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('menu-v104-screenshots',{recursive:true});
try{
 await page.goto(origin+'/?menu-reel=v104',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.shiftlineReady===true,{timeout:120000});
 const checks=await page.evaluate(async()=>{
  const THREE=await import('three');
  const {createTrack}=await import('./race-track.js?v=58');
  const {menuCamera,PREVIEW_CAMERA,MENU_SHOT_DURATION}=await import('./menu-camera.js?v=105');
  const results=[];
  for(let course=1;course<=6;course++){
   const track=createTrack(course),world={sceneryBounds:[]},camera=new THREE.PerspectiveCamera(68,390/844,.15,14000);
   const samples=[];
   for(const t of [0,6,13.9,14.25,19,28.5,43]){
    const s=menuCamera(track,course,camera,t,world,false);
    samples.push({s,pos:camera.position.toArray(),shot:camera.userData.menuReel.shot,fade:camera.userData.menuReel.fade});
   }
   const distance=(a,b)=>Math.hypot(...a.pos.map((x,i)=>x-b.pos[i]));
   if(samples[0].shot!==0||samples[3].shot!==1||samples[5].shot!==2||samples[6].shot!==3)throw Error('Bad reel course '+course+JSON.stringify(samples));
   if(distance(samples[0],samples[1])<15||distance(samples[1],samples[4])<15)throw Error('Camera not travelling on '+course);
   if(!(samples[2].fade>.55&&samples[3].fade>.2))throw Error('Missing cinematic cuts '+course);
   const negative=menuCamera(track,course,camera,-.01,world,false);
   if(!Number.isFinite(negative)||camera.userData.menuReel.shot!==0)throw Error('Negative frame delta broke preview shot '+course);
   const invalid=menuCamera(track,course,camera,NaN,world,false);
   if(!Number.isFinite(invalid)||camera.userData.menuReel.shot!==0)throw Error('Nonfinite preview clock broke shot '+course);
   const frozen=menuCamera(track,course,camera,51,world,true),pos=camera.position.clone();
   menuCamera(track,course,camera,250,world,true);
   if(camera.position.distanceTo(pos)>.001)throw Error('Reduced-motion still moves on '+course);
   results.push({course,shotCount:PREVIEW_CAMERA[course].shots.length,travel:Math.round(distance(samples[0],samples[1])),cutFade:samples[2].fade});
  }
  const menu=document.querySelector('#menu'),pane=document.querySelector('.trackPreview');
  const bg=getComputedStyle(menu).backgroundImage;
  if(!bg.includes('rgba(3, 11, 22, 0.37)'))throw Error('Old opaque menu background still active: '+bg);
  if(getComputedStyle(pane).opacity==='0')throw Error('Live cinematic window hidden');
  if(!document.querySelector('#menuReelCurtain'))throw Error('Shot transition overlay missing');
  if(document.querySelector('#menuReelStatus')?.textContent.indexOf('LIVE CINEMATIC')<0)throw Error('Cinematic overlay label missing');
  return {shots:results,menuBackground:bg,previewOpacity:getComputedStyle(pane).opacity,shotDuration:MENU_SHOT_DURATION};
 });
 assert.equal(checks.shots.length,6);console.log('PASS all 24 curated camera viewpoints, 6 animated courses, reduced motion, translucent backdrop and transition masks');
 console.log('PASS camera paths '+JSON.stringify(checks.shots));
 for(let course=1;course<=6;course++){
  await page.evaluate(n=>document.querySelector('[data-course="'+n+'"]').click(),course);
  await page.waitForFunction(n=>document.querySelector('[data-course="'+n+'"]').classList.contains('selected'),course,{timeout:18000});
  await page.waitForTimeout(1500);
  const status=await page.evaluate(()=>({name:document.querySelector('#trackTitle')?.textContent,active:document.querySelector('#menuReelStatus')?.textContent,ready:window.shiftlineReady,overlay:getComputedStyle(document.querySelector('#menu')).backgroundImage}));
  assert.ok(status.ready&&status.active.includes('LIVE CINEMATIC'),'Course '+course+' menu preview not ready');
  const png=PNG.sync.read(await page.screenshot({path:'menu-v104-screenshots/course-'+course+'.png'}));
  let visible=0,luminance=0;
  // Sample the live-world area, not the dark controls at the bottom.
  for(let y=70;y<380;y+=8)for(let x=210;x<380;x+=8){
   const k=(y*png.width+x)*4;const sum=png.data[k]+png.data[k+1]+png.data[k+2];luminance+=sum/3;if(sum>32)visible++;
  }
  const brightness=Math.round(luminance/(Math.ceil((380-70)/8)*Math.ceil((380-210)/8)));
  assert.ok(visible>100,'Menu course '+course+' preview black/blank');
  console.log('PASS 3D course menu '+course+' '+status.name+' visiblePixels='+visible+' avgLum='+brightness);
 }
 assert.deepEqual(errors,[],'Uncaught JavaScript errors');
 console.log('PASS all courses visually rendered in mobile 390x844 viewport without JS errors');
}catch(e){console.error('MENU CINEMATIC TEST FAILED',e.stack);console.error('BROWSER ERRORS',JSON.stringify(errors));process.exitCode=1}finally{await browser.close()}
