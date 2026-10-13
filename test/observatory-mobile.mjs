import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const url='https://shiftline-game.beyondthebox.workers.dev/?observatory-test=105';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await mkdir('observatory-screenshots',{recursive:true});
const browser=await chromium.launch({
 headless:true,args:['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle',
 '--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']
});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')console.log('BROWSER CONSOLE:',m.text().slice(0,500))});
function imageCheck(buffer,name) {
 const png=PNG.sync.read(buffer),n=png.width*png.height;
 let varied=0,bright=0,first=null;const stride=Math.max(1,Math.floor(n/15000));
 for(let p=0;p<n;p+=stride){const i=p*4,red=png.data[i],green=png.data[i+1],blue=png.data[i+2];if(!first)first=[red,green,blue];if(Math.abs(red-first[0])+Math.abs(green-first[1])+Math.abs(blue-first[2])>40)varied++;if(red+green+blue>180)bright++;}
 console.log(name+' screenshot '+png.width+'x'+png.height+' varied='+varied+' bright='+bright);
 assert.ok(varied>100,'Viewer rendering looks flat/empty: '+name);
}
try {
 let deployed=false;
 for(let attempt=1;attempt<=14;attempt++){
  await page.goto(url+'&revision='+attempt,{waitUntil:'domcontentloaded',timeout:35000});
  try{await page.waitForFunction(()=>window.shiftlineReady===true,{timeout:30000})}
  catch(e){console.log('Startup wait '+attempt+': '+e.message.slice(0,110));}
  const markup=await page.evaluate(()=>({button:!!document.getElementById('obsOpen'),legacy:!!document.querySelector('#trackExplorer summary'),ready:!!window.shiftlineReady,current:!!document.querySelector('script[src="race-engine.js?v=105"]')}));
  console.log('Cloudflare deployment revision check '+attempt+': '+JSON.stringify(markup));
  if(markup.button&&markup.ready&&markup.current){deployed=true;break;}
  await wait(10000);
 }
 assert.ok(deployed,'Cloudflare has not served the new actual-map Observatory build after retries');
 console.log('PASS actual Three.js game initialises on Cloudflare with current Observatory');
 const tilt=await page.evaluate(async()=>{
  const {steeringBank}=await import('./race-craft.js?v=100');
  const simulate=(lateral,dt=1/120)=>{let bank=0;for(let i=0;i<180;i++)bank=steeringBank(bank,lateral,dt);return bank};
  return {hardLeft:simulate(-20),hardRight:simulate(20),lightLeft:simulate(-1.5),lightRight:simulate(1.5),centre:simulate(0)};
 });
 console.log('BANKING TELEMETRY '+JSON.stringify(tilt));
 assert.ok(Math.abs(tilt.hardLeft)<=.441&&Math.abs(tilt.hardRight)<=.441,'Ship banking too strong');
 assert.ok(Math.abs(tilt.hardLeft+tilt.hardRight)<.001,'Banking is not symmetrical');
 assert.ok(Math.abs(tilt.lightLeft)<Math.abs(tilt.hardLeft),'Small steering should bank less');
 assert.ok(Math.abs(tilt.centre)<.001,'Centre input should recover level attitude');
 console.log('PASS bank capped at 25 degrees, proportional and symmetric');
 let passed=0;
 for(const [course,label] of [[1,'ECLIPSE'],[2,'LEVIATHAN'],[3,'CINDER'],[4,'TEMPEST'],[5,'VERDANT'],[6,'FRACTURE']]){
  if(course!==1){
   await page.evaluate(n=>document.querySelector('[data-course="'+n+'"]').click(),course);
   await wait(700);
  }
  await page.evaluate(()=>document.getElementById('obsOpen').click());
  await page.waitForFunction(()=>!document.getElementById('observatory').classList.contains('off'),{timeout:20000});
  const initial=await page.evaluate(()=>({
   title:document.getElementById('obsTitle').textContent,
   menuHidden:document.getElementById('menu').classList.contains('off'),
   area:document.getElementById('observatoryViewport').getBoundingClientRect().height,
   canvas:[document.getElementById('game').width,document.getElementById('game').height]
  }));
  assert.ok(initial.title.toUpperCase().includes(label),'Wrong course: '+JSON.stringify(initial));
  assert.ok(initial.menuHidden);
  assert.ok(initial.area>100,'no room to render actual map');
  await wait(450);
  if(course===1||course===5){
   const screenshot=await page.screenshot({path:'observatory-screenshots/course-'+course+'.png'});
   imageCheck(screenshot,'course '+course);
  }
  for(const mode of ['overhead','chase','fly','orbit']){
   await page.locator('[data-obs-mode="'+mode+'"]').click();
   await wait(130);
   assert.equal(await page.locator('[data-obs-mode="'+mode+'"]').getAttribute('class'),'active');
  }
  await page.locator('[data-obs-chapter="2"]').click();
  await page.waitForFunction(()=>Number.parseInt(document.getElementById('obsDistance').textContent,10)>45,{timeout:5000});
  await page.locator('#obsScrub').evaluate(el=>{el.value='800';el.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.ok((await page.locator('#obsDistance').textContent()).includes('80'));
  await page.locator('#obsClose').click();
  await page.waitForFunction(()=>document.getElementById('observatory').classList.contains('off')&&!document.getElementById('menu').classList.contains('off'),{timeout:10000});
  console.log('PASS '+label+': actual world, four camera modes, chapter, scrub, return to menu');
  passed++;
 }
 await page.evaluate(()=>document.getElementById('launch').click());
 await page.waitForFunction(()=>!document.getElementById('count').classList.contains('off'),{timeout:25000});
 console.log('PASS regular race still launches after Observatory');
 console.log('Browser errors: '+JSON.stringify(pageErrors.slice(0,12)));
 assert.equal(pageErrors.length,0,'Uncaught browser errors: '+pageErrors.join(' | '));
 console.log('SHIFTLINE OBSERVATORY E2E PASS: '+passed+' courses');
} finally {await browser.close()}
