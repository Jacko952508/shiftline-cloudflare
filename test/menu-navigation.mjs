// Existing graphics/garage gates enter the same explicit flow as a player.
export async function openSoloDemo(page,course=1,mode='race'){
 if(!await page.locator('#menu.flowShell').count())return;
 let screen=await page.locator('#menu').getAttribute('data-screen');
 if(screen==='demo'){
  const selected=await page.locator('#menu').getAttribute('data-current-course'),chosen=await page.locator('#menu').getAttribute('data-current-mode');
  if(+selected===course&&chosen===mode){await waitForDemo(page);return;}
  await page.locator('#demoBack').click();screen='levels';
 }
 if(screen==='garage'||screen==='records'){const records=screen==='records';await page.locator('#menuBack').click();if(records)await page.locator('#settingsBack').click();screen='home';}
 if(screen==='home'){await page.locator('[data-home="solo"]').click();screen='modes';}
 if(screen==='levels'&&await page.locator('#menu').getAttribute('data-current-mode')!==mode){await page.locator('#menuBack').click();screen='modes';}
 if(screen==='modes')await page.locator('[data-mode="'+mode+'"]').click();
 await page.locator('[data-course="'+course+'"]').click();await waitForDemo(page);
}
export async function waitForDemo(page){await page.waitForFunction(()=>document.querySelector('#menu').dataset.screen==='demo'&&!document.querySelector('#launch').disabled&&document.querySelector('#demoLoading').classList.contains('off'),null,{timeout:120000});}
export async function openTrackInspection(page){if(await page.locator('#menu.flowShell').count())await waitForDemo(page);await page.evaluate(()=>document.querySelector('#obsOpen').click());}
