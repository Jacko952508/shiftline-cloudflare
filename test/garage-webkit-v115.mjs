import {webkit} from 'playwright';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await webkit.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.stack||e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('Console error: '+m.text())});
await mkdir('garage-visible-artifacts',{recursive:true});
await page.addInitScript(()=>localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({seaRevision:3,courseRevisions:{1:2,2:3},xp:5000,craft:1,color:7,custom:{},records:{},ghosts:{},medals:{},races:2,career:{unlocked:[6,7,8]}})));
try{
 await page.goto((process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765')+'/?test=webkit',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.shiftlineReady===true,{timeout:90000});
 const engineURL=await page.locator('script[src^="race-engine.js?"]').getAttribute('src');
 const cssURL=await page.locator('link[href^="style.css?"]').getAttribute('href');
 assert.equal(engineURL,'race-engine.js?v=135','fresh game engine URL');
 assert.equal(cssURL,'style.css?v=121','fresh garage stylesheet URL');
 await page.locator('[data-tab="garage"]').click();
 await page.waitForTimeout(2000);
 const details=await page.evaluate(()=>{
 const e=document.querySelector('#craftDisplay'),c=e.querySelector('canvas.garage3DCanvas'),r=e.getBoundingClientRect();return{rect:{x:r.x,y:r.y,width:r.width,height:r.height},canvas:c?{width:c.width,height:c.height,clientWidth:c.clientWidth,clientHeight:c.clientHeight}:null,contextLost:!!c?.getContext('webgl2')?.isContextLost?.(),ready:window.shiftlineReady}});
 const png=PNG.sync.read(await page.locator('#craftDisplay').screenshot({path:'garage-visible-artifacts/04-webkit-razor-gold.png'}));
 let n=0,k=0,max=0,total=0;for(let y=Math.floor(png.height*.25);y<png.height*.82;y+=2)for(let x=Math.floor(png.width*.11);x<png.width*.89;x+=2){const i=(y*png.width+x)*4;const yy=.2126*png.data[i]+.7152*png.data[i+1]+.0722*png.data[i+2];n++;if(yy>58)k++;max=Math.max(max,yy);total+=yy}
 const ratio=k/n;
 console.log('WEBKIT VISIBLE',JSON.stringify({ratio,max,avg:total/n,details,errors}));
 assert.ok(details.canvas&&details.canvas.width>100,'dedicated in-panel WebGL canvas is present and sized');
 assert.ok(ratio>.025,'WebKit ship invisible; bright-pixel ratio '+ratio);
 assert.deepEqual(errors,[],'WebKit console/page errors');
 console.log('PASS WebKit visible ship pixels and stable garage context');
}finally{await browser.close();}
