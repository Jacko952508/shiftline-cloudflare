import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base='http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const errors=[],warnings=[];
page.on('pageerror',e=>errors.push(e.stack||e.message));
page.on('console',e=>{if(e.type()==='error'||e.type()==='warning')warnings.push(e.text())});
await mkdir('garage-visible-artifacts',{recursive:true});
await page.addInitScript(()=>{localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({seaRevision:3,courseRevisions:{1:2,2:3},xp:5000,craft:1,color:7,custom:{},records:{},ghosts:{},medals:{},races:2,career:{unlocked:[6,7,8]}}))});
async function measure(label){
 await page.waitForTimeout(1300);
 const diagnostic=await page.evaluate(()=>{
  const host=document.querySelector('#craftDisplay'),rect=host.getBoundingClientRect();
  const canvas=host.querySelector('canvas.garage3DCanvas');
  const info=(selector)=>{const el=document.querySelector(selector);if(!el)return null;const c=getComputedStyle(el),r=el.getBoundingClientRect();return{selector,display:c.display,visibility:c.visibility,opacity:c.opacity,zIndex:c.zIndex,background:c.backgroundColor,rect:{x:r.x,y:r.y,w:r.width,h:r.height}}};
  return{ready:window.shiftlineReady,garagerect:{w:rect.width,h:rect.height,top:rect.top},canvas:canvas?{width:canvas.width,height:canvas.height,clientWidth:canvas.clientWidth,clientHeight:canvas.clientHeight,style:info('canvas.garage3DCanvas')}:null,parts:['#game','#menu','.dashboard','.garageStage','.garageHeader','#craftDisplay','.garageFrame','.menuShade','#menuArt'].map(info)};
 });
 const img=PNG.sync.read(await page.locator('#craftDisplay').screenshot({path:'garage-visible-artifacts/'+label+'.png'}));
 let count=0,bright=0,veryBright=0,sum=0,max=0,white=0;
 const x0=Math.round(img.width*.11),x1=Math.round(img.width*.89),y0=Math.round(img.height*.25),y1=Math.round(img.height*.83);
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
 const i=(y*img.width+x)*4;const R=img.data[i],G=img.data[i+1],B=img.data[i+2],Y=.2126*R+.7152*G+.0722*B;
 count++;sum+=Y;max=Math.max(max,Y);if(Y>58)bright++;if(Y>92)veryBright++;if(R>165&&G>165&&B>165)white++;
 }
 const stats={label,size:[img.width,img.height],pctBright:bright/count,pctVeryBright:veryBright/count,average:sum/count,max,white:white/count};
 console.log('VISIBILITY',JSON.stringify({stats,diagnostic,errors,warnings}).slice(0,8000));
 return stats;
}
try{
 await page.goto(base+'/?stage=visibility-v115',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForFunction(()=>window.shiftlineReady===true,{timeout:120000});
 await page.locator('[data-tab="garage"]').click();
 const first=await measure('01-razor-gold');
 await page.locator('[data-choice-kind="ship"][data-choice-id="0"]').click();
 const second=await measure('02-vector');
 await page.locator('[data-choice-kind="ship"][data-choice-id="4"]').scrollIntoViewIfNeeded();
 await page.locator('[data-choice-kind="ship"][data-choice-id="4"]').click();
 const third=await measure('03-gemini');
 if(errors.length)throw new Error('Page errors '+errors.join('; '));
 assert.ok(first.pctBright>.025,'RAZOR invisible; bright pixel ratio '+first.pctBright);
 assert.ok(second.pctBright>.025,'VECTOR invisible; bright pixel ratio '+second.pctBright);
 assert.ok(third.pctBright>.025,'GEMINI invisible; bright pixel ratio '+third.pctBright);
 console.log('PASS visible craft pixels for all three tested models');
}finally{await browser.close();}
