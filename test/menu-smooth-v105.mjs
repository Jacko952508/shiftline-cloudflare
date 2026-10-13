import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const {menuFrameProfile,createMenuFrameGovernor}=await import('../public/menu-pacing.js');
assert.equal(menuFrameProfile('auto',2,390,844).fps,30);
assert.equal(menuFrameProfile('high',2,390,844).fps,60);
assert.equal(menuFrameProfile('low',2,390,844).fps,20);
assert.ok(menuFrameProfile('auto',2,390,844).pixelRatio<=1.28);
assert.ok(menuFrameProfile('high',2,390,844).pixelRatio<=1.5);
const governor=createMenuFrameGovernor();
assert.equal(governor.target('high'),60);
for(let i=0;i<9;i++)governor.observe('high',.052,26);
assert.equal(governor.target('high'),30,'Ultra must self-limit after slow frames');
for(let i=0;i<410;i++)governor.observe('high',.0333,6);
assert.equal(governor.target('high'),60,'Ultra must recover when device has headroom');
governor.reset();
assert.equal(governor.target('high'),60);
console.log('PASS 20/30/60 stable pacing tiers, self-protecting Ultra and mobile pixel budgets');

const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto((process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765')+'/?smooth-v105',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.shiftlineReady===true,{timeout:120000});
 const checks=await page.evaluate(async()=>{
  const {createTrack}=await import('./race-track.js?v=58');
  const {PREVIEW_CAMERA,prepareMenuCamera,menuCamera}=await import('./menu-camera.js?v=105');
  const THREE=await import('three');
  const worlds=[];
  for(let course=1;course<=6;course++){
    const track=createTrack(course),world={sceneryBounds:[]};
    prepareMenuCamera(track,course,world);
    if(world._menuShotPresets.size!==4)throw Error('Course '+course+' camera positions not prewarmed');
    const camera=new THREE.PerspectiveCamera(75,390/844,.15,14000),samples=[];
    for(let time=1;time<1.5;time+=.016667){menuCamera(track,course,camera,time,world);samples.push(camera.position.clone());}
    const steps=samples.slice(1).map((p,i)=>p.distanceTo(samples[i]));
    const max=Math.max(...steps),min=Math.min(...steps);
    if(!(min>0&&max/min<1.2))throw Error('Course '+course+' camera pacing has a position jump: '+max+'/'+min);
    const first=menuCamera(track,course,camera,13.9,world),cut=menuCamera(track,course,camera,14,world);
    const transition=camera.userData.menuReel.fade;
    if(transition<.99)throw Error('Course '+course+' camera cut not hidden');
    worlds.push({course,prewarmed:world._menuShotPresets.size,maxDelta:+max.toFixed(3),minDelta:+min.toFixed(3),transition});
  }
  return {worlds,ready:window.shiftlineReady,menu:!document.querySelector('#menu').classList.contains('off'),quality:document.querySelector('#quality').value,canvas:{width:document.querySelector('#game').width,height:document.querySelector('#game').height},screen:{width:innerWidth,height:innerHeight},status:document.querySelector('#menuReelStatus').textContent};
 });
 assert.ok(checks.ready&&checks.menu);
 assert.equal(checks.quality,'auto');
 assert.ok(checks.canvas.width<=390*1.29+2,'Adaptive menu rendered too many pixels '+JSON.stringify(checks.canvas));
 assert.equal(checks.worlds.length,6);
 console.log('PASS prewarmed camera landmarks, coherent 60Hz movement and fully masked scenic cuts across all six tracks '+JSON.stringify(checks.worlds));

 await page.evaluate(()=>{
  const q=document.querySelector('#quality');
  q.value='high';q.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await page.waitForTimeout(950);
 const ultra=await page.evaluate(()=>({width:document.querySelector('#game').width,height:document.querySelector('#game').height}));
 assert.ok(ultra.width<=390*1.51+2&&ultra.width>=390*1.28,'Ultra preview pixel ratio unexpected '+JSON.stringify(ultra));
 await page.evaluate(()=>{
  const q=document.querySelector('#quality');q.value='auto';q.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await page.evaluate(()=>document.querySelector('[data-course="6"]').click());
 await page.waitForTimeout(1800);
 assert.ok(await page.evaluate(()=>window.shiftlineReady&&document.querySelector('#menuReelStatus').textContent.includes('CINEMATIC')));
 assert.deepEqual(errors,[],'JS runtime errors');
 console.log('PASS real high-DPR iPhone menu, graphics-mode switching, course preview reset and no browser errors');
}catch(error){console.error('MENU SMOOTHNESS REGRESSION FAILED:',error.stack);console.error('Browser errors:',JSON.stringify(errors));process.exitCode=1}finally{await browser.close()}
