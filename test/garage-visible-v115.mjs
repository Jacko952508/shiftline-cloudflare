import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.SHIFTLINE_SITE||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
const errors=[],warnings=[],shaderErrors=[];
page.on('pageerror',e=>errors.push(e.stack||e.message));
page.on('console',e=>{if(e.type()==='error'||e.type()==='warning'){warnings.push(e.text());if(/WebGLProgram|VALIDATE_STATUS|fragment shader|vertex shader|shader error|Shader Error/i.test(e.text()))shaderErrors.push(e.text())}});
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
 await page.goto(base+'/?stage=fleet-v117&shipqa=1',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForFunction(()=>window.shiftlineReady===true,{timeout:120000});
 const engineURL=await page.locator('script[src^="race-engine.js?"]').getAttribute('src');
 const cssURL=await page.locator('link[href^="style.css?"]').getAttribute('href');
 assert.equal(engineURL,'race-engine.js?v=134','fresh game engine URL');
 assert.equal(cssURL,'style.css?v=121','fresh garage stylesheet URL');
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
 const names=['VECTOR','RAZOR','PHANTOM','MANTA','GEMINI','SPECTRE'],signatures=[],spans=[];
 await page.locator('[data-garage-category="ship"]').click();
 for(let i=0;i<6;i++){
  const item=page.locator('[data-choice-kind="ship"][data-choice-id="'+i+'"]');
  await item.scrollIntoViewIfNeeded();await item.click();
  const meta=await page.evaluate(()=>window.__shiftlineModelQA);
  assert.equal(meta?.id,names[i],'Correct independent mesh for '+names[i]);
  assert.ok(Math.abs(meta.measuredSpan-2.08)<.002,names[i]+' unequal actual wingspan '+meta.measuredSpan);
  assert.ok(meta.parts>7,names[i]+' has insufficient unique geometry');
  const mountCount=[2,2,2,1,2,2][i];
  assert.equal(meta.finMounts?.length,mountCount,names[i]+' fin or blade mounts missing');
  assert.equal(meta.finShoes,mountCount,names[i]+' physical attachment shoes missing');
  assert.ok(meta.texturedMeshes>=3,names[i]+' still lacks proper mapped surface materials: '+meta.texturedMeshes);
  assert.equal(meta.exhaustEmitters,2,names[i]+' has no proper paired rocket thrusters');
  assert.ok(meta.upgradeCounts&&typeof meta.upgradeSignature==='string',names[i]+' customisation kit missing');
  assert.ok(meta.polishParts?.mechanics>=10,names[i]+' missing active wing/vent/nozzle mechanisms');
  assert.ok(meta.polishParts?.cockpit>=2,names[i]+' missing exterior-visible cockpit seating');
  assert.ok(meta.polishParts?.panels>=1,names[i]+' missing detailed bevelled bodywork');
  assert.ok(meta.insetContacts?.every(p=>p.attached),names[i]+' has an unsupported hovering armour plate: '+JSON.stringify(meta.insetContacts));
  assert.ok(meta.contacts?.length===mountCount&&meta.contacts.every(x=>x.shoeFin&&x.shoeHull),names[i]+' fin is physically disconnected from wing or fuselage: '+JSON.stringify(meta.contacts));

  spans.push(meta.measuredSpan);
  const stat=await measure('117-'+names[i].toLowerCase());
  assert.ok(stat.pctBright>.035,names[i]+' invisible');
  signatures.push([Math.round(stat.average*10),Math.round(stat.pctBright*1000),meta.parts]);
  console.log('MODEL',names[i],JSON.stringify({parts:meta.parts,span:meta.measuredSpan,brightness:stat.pctBright,average:stat.average,finContact:meta.contacts,materialFaces:meta.texturedMeshes}));
 }
 assert.ok(new Set(signatures.map(x=>x.join(','))).size>=5,'Six model renders are insufficiently different');
 await page.locator('[data-garage-category="wing"]').click();
 await page.locator('[data-choice-kind="part"][data-choice-id="3"]').click();
 assert.equal((await page.evaluate(()=>window.__shiftlineModelQA)).options.wing,3,'Ship-specific wing choice changes actual 3D geometry');
 await page.locator('[data-garage-category="engine"]').click();
 await page.locator('[data-choice-kind="part"][data-choice-id="4"]').click();
 const equipped=await page.evaluate(()=>window.__shiftlineModelQA);
 assert.equal(equipped.options.engine,4,'Engine option changes live ship build');
 assert.ok(Math.abs(equipped.measuredSpan-2.08)<.002,'Custom options must not change equal racing wingspan');

 const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('shiftlineEclipseProgressV1')));
 assert.ok(record.shipBuilds&&record.shipBuilds[5].custom.wing===3&&record.shipBuilds[5].custom.engine===4,'SPECTRE wing choice persisted independently');
 // Inspect several actual customisations. The optional kits must add geometry,
 // not merely change the selected tile in the menu.
 await page.locator('[data-garage-category="wing"]').click();
 await page.locator('[data-choice-kind="part"][data-choice-id="4"]').click();
 let kit=await page.evaluate(()=>window.__shiftlineModelQA);
 assert.ok(kit.upgradeCounts.wing>=7,'Crescent wing kit should add several substantial 3D panels');
 assert.ok(kit.signatureKits?.count>=2,'SPECTRE must have its own special bodywork kit, not generic wings');
 assert.equal(kit.options.wing,4);
 await page.locator('[data-garage-category="canopy"]').click();
 await page.locator('[data-choice-kind="part"][data-choice-id="4"]').click();
 kit=await page.evaluate(()=>window.__shiftlineModelQA);
 assert.ok(kit.upgradeCounts.canopy>=2,'Raised canopy option should add visible 3D parts');
 await page.locator('[data-garage-category="fin"]').click();
 await page.locator('[data-choice-kind="part"][data-choice-id="3"]').click();
 kit=await page.evaluate(()=>window.__shiftlineModelQA);
 assert.ok(kit.upgradeCounts.fin>=1,'Dorsal fin configuration must add a physical stabiliser');
 await page.locator('[data-garage-category="livery"]').click();
 await page.locator('[data-choice-kind="part"][data-choice-id="4"]').click();
 kit=await page.evaluate(()=>window.__shiftlineModelQA);
 assert.ok(kit.upgradeCounts.livery>=5,'Full livery must add larger coloured body panels');
 await page.locator('[data-garage-category="engine"]').click();
 await page.locator('[data-choice-kind="part"][data-choice-id="2"]').click();
 kit=await page.evaluate(()=>window.__shiftlineModelQA);
 assert.ok(kit.upgradeCounts.engine>=6,'Ion collar must add real glowing engine geometry');
 // Three real lighting configurations, while retaining a visible render.
 for(const mode of ['night','track','studio']){
  await page.locator('[data-garage-light="'+mode+'"]').click();
  await page.waitForTimeout(120);
  const lighting=await page.evaluate(()=>window.__shiftlineLightingQA);
  assert.equal(lighting?.mode,mode,'Showroom lighting option must change actual scene: '+mode);
  assert.equal(await page.locator('[data-garage-light="'+mode+'"]').getAttribute('aria-pressed'),'true');
  const pixels=await measure('120-light-'+mode);
  assert.ok(pixels.pctBright>.020,'Ship must remain visible in '+mode+' showroom lighting');
 }
 await page.locator('[data-garage-category="canopy"]').click();
 const inspect=await page.evaluate(()=>window.__shiftlineInspectQA);
 assert.equal(inspect?.category,'canopy','Canopy tab must move inspection camera to nose');
 await page.locator('[data-garage-category="cabin"]').click();
 await page.waitForTimeout(850);
 await page.screenshot({path:'garage-visible-artifacts/120-diegetic-cockpit.png'});
 assert.equal((await page.evaluate(()=>window.__shiftlineInspectQA))?.cockpit,true,'Cabin tab shows real cockpit');
 await page.locator('[data-garage-category="trail"]').click();
 await page.waitForTimeout(950);
 const originalTrail=await page.evaluate(()=>window.__shiftlineTrailQA);
 assert.equal(originalTrail?.emitters,2,'Paired engine trails must exist and animate');
 assert.ok(originalTrail.length>.80,'Idle thruster wake must be visible and animated');
 await page.locator('[data-choice-kind="part"][data-choice-id="4"]').click();
 await page.waitForTimeout(900);
 const roseTrail=await page.evaluate(()=>window.__shiftlineTrailQA);
 assert.equal(roseTrail?.colour,0xff89cf,'Changing exhaust colour must change the real shader');
 assert.ok(roseTrail.length>.80,'Custom trail must have visible plasma length');
 await page.screenshot({path:'garage-visible-artifacts/119-rose-rocket-trails.png'});
 // Verify every upgrade stabiliser family is a REPLACEMENT, not stacked on
 // the old fin set; render selected options to catch floating flaps.
 await page.locator('[data-garage-category="ship"]').click();
 for(let i=0;i<6;i++){
  await page.locator('[data-garage-category="ship"]').click();
  const tile=page.locator('[data-choice-kind="ship"][data-choice-id="'+i+'"]');
  await tile.scrollIntoViewIfNeeded();await tile.click();
  await page.locator('[data-garage-category="fin"]').click();
  await page.locator('[data-choice-kind="part"][data-choice-id="2"]').click();
  const geometry=await page.evaluate(()=>window.__shiftlineModelQA);
  const expected=i===5?4:2; // SPECTRE's two integral blade roots remain.
  assert.equal(geometry.finMounts.length,expected,names[i]+' has stacked original and optional fins');
  assert.ok(geometry.contacts.every(c=>c.shoeFin&&c.shoeHull),names[i]+' has an unsupported optional fin: '+JSON.stringify(geometry.contacts));
  assert.ok(geometry.insetContacts.every(c=>c.attached),names[i]+' has a floating armour panel');
  if(i===1||i===4||i===5)await page.locator('#craftDisplay').screenshot({path:'garage-visible-artifacts/120-'+names[i].toLowerCase()+'-attached-fins.png'});
 }
 assert.deepEqual(shaderErrors,[],'Plasma shaders must compile successfully in WebGL');
 console.log('PASS V120 six detailed ships, 3 lighting modes, real cockpit, distinctive kits and 5 animated trail profiles',JSON.stringify({originalTrail,roseTrail,spans}));


}finally{await browser.close();}
