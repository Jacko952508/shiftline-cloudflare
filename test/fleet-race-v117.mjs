import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
const errors=[],shaderErrors=[];
page.on('pageerror',e=>errors.push(e.stack||e.message));
page.on('console',e=>{if(e.type()==='error'&&/WebGLProgram|VALIDATE_STATUS|shader error|Shader Error/i.test(e.text()))shaderErrors.push(e.text())});
await mkdir('garage-visible-artifacts',{recursive:true});
await page.addInitScript(()=>localStorage.setItem('shiftlineEclipseProgressV1',JSON.stringify({seaRevision:3,courseRevisions:{1:2,2:3},xp:5000,craft:5,color:0,custom:{wing:3,engine:4,fin:2,trail:2},records:{1:112000},ghosts:{},medals:{},races:4,shipBuilds:{5:{color:0,custom:{wing:3,engine:4,fin:2,trail:2}}}})));
try{
 await page.goto((process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765')+'/?shipqa=1',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForFunction(()=>window.shiftlineReady===true,null,{timeout:120000});
 await page.locator('#launch').click({timeout:15000});
 // Wait for the actual in-game countdown, not wall-clock time: software WebGL
 // may render fewer frames while shaders compile, delaying the game timer.
 await page.waitForFunction(()=>document.querySelector('#count')?.classList.contains('off')===true,null,{timeout:150000}).catch(async error=>{
  const info=await page.evaluate(()=>({count:document.querySelector('#count')?.textContent,countOff:document.querySelector('#count')?.classList.contains('off'),menuOff:document.querySelector('#menu')?.classList.contains('off'),boost:document.querySelector('#boost')?.textContent}));
  console.log('COUNTDOWN_DIAGNOSTIC',JSON.stringify(info));throw error;
 });
 await page.waitForTimeout(520);
 const idleRocket=await page.evaluate(()=>window.__shiftlineTrailQA);
 const idleMechanical=await page.evaluate(()=>window.__shiftlinePolishQA);
 assert.equal(idleMechanical?.joints,2,'Player has live aerodynamic control surfaces');
 assert.equal(idleMechanical?.louvers,2,'Player has two movable cooling vents');
 assert.equal(idleMechanical?.petals,8,'Each engine has four articulating nozzle petals');
 assert.equal(idleRocket?.emitters,2,'Real race must have twin animated thrusters');
 assert.equal(idleRocket?.colour,0xbc8dff,'Race uses saved Violet Pulse exhaust');
 assert.ok(idleRocket.length>.50,'Normal race speed has persistent visible exhaust');
 await page.screenshot({path:'garage-visible-artifacts/119-race-idle-trail.png'});
 // A genuine mobile tap should engage boost, not a synthetic out-of-phase event.
 await page.locator('#boost').tap({timeout:18000});
 await page.waitForTimeout(1250);
 const boostedRocket=await page.evaluate(()=>window.__shiftlineTrailQA);
 const boostedMechanical=await page.evaluate(()=>window.__shiftlinePolishQA);
 console.log('BOOST TRAILS',JSON.stringify({idleRocket,boostedRocket}));
 assert.equal(boostedRocket?.boost,true,'Boost input activates the actual rocket effect');
 assert.ok(boostedRocket.length>idleRocket.length+.25,'Rocket plume visibly lengthens under boost');
 assert.ok(boostedRocket.power>idleRocket.power+.10,'Boost changes real plasma intensity');
 assert.equal(boostedMechanical?.boost,true,'Boost must actuate active mechanical parts');
 assert.ok(boostedMechanical.vent>idleMechanical.vent+.05,'Radiator plates actually open under boost');
 assert.ok(boostedMechanical.nozzle>idleMechanical.nozzle+.04,'Nozzle petals actually vector under boost');
 await page.screenshot({path:'garage-visible-artifacts/119-race-boost-trail.png'});

 const report=await page.evaluate(()=>{
  const game=document.querySelector('#game'),style=getComputedStyle(game),menu=document.querySelector('#menu');
  const gl=game.getContext('webgl2')||game.getContext('webgl');
  const p=JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1'));
  return{game:{width:game.width,height:game.height,visible:style.display!=='none'&&style.visibility!=='hidden',contextLost:gl?.isContextLost()},menuOff:menu.classList.contains('off')||getComputedStyle(menu).display==='none',savedRecord:p.records?.[1],craft:p.craft,shipBuilds:p.shipBuilds};
 });
 await page.screenshot({path:'garage-visible-artifacts/117-race-spectre.png'});
 console.log('RACE SMOKE',JSON.stringify({report,errors}));
 assert.equal(errors.length,0,'No errors when entering live race');
 assert.deepEqual(shaderErrors,[],'Rocket plume shader compiles without WebGL errors');
 assert.ok(report.game.width>100&&report.game.height>100&&report.game.visible,'Race canvas drawing');
 assert.equal(report.game.contextLost,false,'WebGL context remains active');
 assert.equal(report.menuOff,true,'Start Race enters game');
 assert.equal(report.savedRecord,112000,'Saved race progress survives ship rebuild');
 console.log('PASS V120 racing with animated control surfaces, radiator/nozzle boost transformation, strong violet trail and intact progress',JSON.stringify({idleMechanical,boostedMechanical}));
}finally{await browser.close();}
