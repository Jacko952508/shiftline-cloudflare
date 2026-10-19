import {openSoloDemo,openTrackInspection} from './menu-navigation.mjs';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const output='horizon-v151-frames';await mkdir(output,{recursive:true});
const args=['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'];
for(const kind of[chromium,webkit]){
 const browser=await kind.launch(kind===chromium?{headless:true,args}:{headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error'&&/WebGLProgram|shader error|VALIDATE_STATUS/i.test(e.text()))errors.push(e.text());});
 try{
  await page.addInitScript(()=>localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({xp:5000,craft:2,color:0,custom:{wing:0,engine:0,fin:0},records:{},ghosts:{},medals:{},races:4})));
  await page.goto((process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765')+'/?graphicsqa=1&sceneryqa=1',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});await openSoloDemo(page,1);
  await page.evaluate(()=>document.querySelector('[data-course="4"]').click());
  await openTrackInspection(page);
  await page.waitForFunction(()=>window.__shiftlineHorizonQA?.version===151,null,{timeout:100000});
  const horizon=await page.evaluate(()=>window.__shiftlineHorizonQA);assert.equal(horizon.padding,26000);assert.equal(horizon.extraDrawCalls,1);assert.ok(horizon.triangles<11000);
  for(const [progress,mode,yaw,lowAngle]of [[80,'orbit',0,false],[300,'orbit',160,true],[520,'orbit',-160,true],[820,'overhead',0,false]]){
   await page.locator('#obsScrub').evaluate((el,p)=>{el.value=String(p);el.dispatchEvent(new Event('input',{bubbles:true}));},progress);
   await page.locator('[data-obs-mode="'+mode+'"]').click();
   if(progress!==80)for(let i=0;i<5;i++)await page.locator('#obsZoomOut').click();
   if(yaw||lowAngle){
    const b=await page.locator('#observatoryViewport').boundingBox(),x=b.x+b.width/2,y=b.y+b.height*.65;
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+yaw,y-(lowAngle?105:0),{steps:6});await page.mouse.up();
   }
   await page.waitForTimeout(350);
   await page.screenshot({path:output+'/'+kind.name()+'-'+progress+'-'+mode+'.png',timeout:65000});
  }
  // Low detail must still restore the continuous backdrop when returning to Auto.
  await page.locator('#obsClose').click();
  const gl=await page.evaluate(()=>{const gl=document.querySelector('#game').getContext('webgl2');return {lost:gl.isContextLost(),samples:gl.getParameter(gl.SAMPLES)};});assert.equal(gl.lost,false);assert.ok(gl.samples>0);
  assert.deepEqual(errors,[]);console.log('PASS V151 '+kind.name()+' four wide horizon views, no shader errors, native MSAA '+JSON.stringify(horizon));
 }finally{await browser.close();}
}
