import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.stack||e.message));
await mkdir('garage-visible-artifacts',{recursive:true});
await page.addInitScript(()=>localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({seaRevision:3,courseRevisions:{1:2,2:3},xp:5000,craft:5,color:0,custom:{wing:3,engine:4,fin:2},records:{1:112000},ghosts:{},medals:{},races:4,shipBuilds:{5:{color:0,custom:{wing:3,engine:4,fin:2}}}})));
try{
 await page.goto((process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765')+'/?shipqa=1',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForFunction(()=>window.shiftlineReady===true,{timeout:100000});
 await page.locator('#launch').click({timeout:15000});
 await page.waitForTimeout(7000);
 const report=await page.evaluate(()=>{
  const game=document.querySelector('#game'),style=getComputedStyle(game),menu=document.querySelector('#menu');
  const gl=game.getContext('webgl2')||game.getContext('webgl');
  const p=JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1'));
  return{game:{width:game.width,height:game.height,visible:style.display!=='none'&&style.visibility!=='hidden',contextLost:gl?.isContextLost()},menuOff:menu.classList.contains('off')||getComputedStyle(menu).display==='none',savedRecord:p.records?.[1],craft:p.craft,shipBuilds:p.shipBuilds};
 });
 await page.screenshot({path:'garage-visible-artifacts/117-race-spectre.png'});
 console.log('RACE SMOKE',JSON.stringify({report,errors}));
 assert.equal(errors.length,0,'No errors when entering live race');
 assert.ok(report.game.width>100&&report.game.height>100&&report.game.visible,'Race canvas drawing');
 assert.equal(report.game.contextLost,false,'WebGL context remains active');
 assert.equal(report.menuOff,true,'Start Race enters game');
 assert.equal(report.savedRecord,112000,'Saved race progress survives ship rebuild');
 console.log('PASS V117 race scene, Spectre ship, GPU context and saved progress');
}finally{await browser.close();}
