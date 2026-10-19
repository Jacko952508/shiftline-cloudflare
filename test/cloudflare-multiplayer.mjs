// SHIFTLINE integration smoke test: Cloudflare Worker static assets + real Render multiplayer relay.
// No credentials, player data or permanent rooms. Opens two temporary WebSocket test clients.
import assert from 'node:assert/strict';

const site=process.env.SHIFTLINE_SITE||'https://shiftline-game.beyondthebox.workers.dev';
const relay='https://tuber-racers-relay.onrender.com';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const timeout=(ms)=>AbortSignal.timeout(ms);
async function get(url,ms=20000) {
 const response=await fetch(url,{redirect:'follow',signal:timeout(ms),headers:{'Cache-Control':'no-cache'}});
 if(!response.ok)throw Error('HTTP '+response.status+' '+url);
 return response;
}
async function retry(label,task,attempts=5) {
 let error;
 for(let i=1;i<=attempts;i++)try{return await task()}catch(e){
  error=e;console.log(label+' attempt '+i+'/'+attempts+': '+e.message);
  if(i<attempts)await wait(16000);
 }
 throw error;
}
async function checkStatic() {
 const html=await retry('Cloudflare game',async()=>{
  const r=await get(site+'/?smoke='+Date.now());
  const t=await r.text();
  assert.match(r.headers.get('content-type')||'',/text\/html/i);
  assert.match(t,/race-engine\.js\?v=\d+/, 'Cloudflare must serve a versioned race engine');
  return t;
 });
 assert.match(html,/type="importmap"/);
 const activeEngine=html.match(/race-engine\.js\?v=\d+/)?.[0];
 assert.ok(activeEngine,'Current race engine asset missing from live HTML');
 for(const file of [activeEngine,'vendor/three.module.js','vendor/three.core.js']){
  await retry('Cloudflare '+file,async()=>{
   const r=await get(site+'/'+file);
   const t=await r.text();
   assert.match(r.headers.get('content-type')||'',/javascript|ecmascript/i,'Wrong MIME: '+file);
   assert.ok(t.length>(file.includes('three.core')?1000000:file.includes('three.module')?500000:30000),'Too-short script: '+file);
   if(file.startsWith('race-engine'))assert.match(t,/wss:\/\/tuber-racers-relay\.onrender\.com/);
  });
  console.log('PASS Cloudflare static '+file);
 }
 console.log('PASS Cloudflare main page and game imports');
}
function peer(name){
 const log=[];
 const ws=new WebSocket('wss://tuber-racers-relay.onrender.com');
 ws.addEventListener('message',event=>{try{log.push(JSON.parse(event.data))}catch{}});
 const opened=new Promise((resolve,reject)=>{
  let done=false;
  const timer=setTimeout(()=>{if(!done){done=true;reject(Error(name+' WebSocket opening timed out'))}},40000);
  ws.addEventListener('open',()=>{if(!done){done=true;clearTimeout(timer);resolve()}},{once:true});
  ws.addEventListener('error',()=>{if(!done){done=true;clearTimeout(timer);reject(Error(name+' WebSocket failed'))}},{once:true});
 });
 return {ws,log,opened,name,send:o=>ws.send(JSON.stringify(o))};
}
async function until(label,pred,ms=12000) {
 const start=Date.now();
 while(Date.now()-start<ms){const result=pred();if(result)return result;await wait(70)}
 throw Error(label+' timed out');
}
async function multiplayerTest(){
 await retry('Render relay wake-up',async()=>{
  const response=await get(relay+'/',110000);const json=await response.json();
  assert.equal(json.service,'tuber-racers-relay');return json;
 },2);
 console.log('PASS relay HTTP readiness');
 let h,g;
 try{
  h=peer('host');g=peer('guest');
  await Promise.all([h.opened,g.opened]);
  console.log('PASS two relay WebSocket handshakes');
  h.send({type:'create',game:'shiftline',name:'CF-SMOKE-HOST',combatVersion:1});
  const created=await until('Host room creation',()=>h.log.find(m=>m.type==='room'&&m.code));
  const code=created.code;assert.match(code,/^[A-Z0-9]{5}$/);
  g.send({type:'join',game:'shiftline',name:'CF-SMOKE-GUEST',code,combatVersion:1});
  await until('Guest joined',()=>g.log.find(m=>m.type==='room'&&m.code===code&&m.players?.length===2));
  await until('Host roster updated',()=>h.log.find(m=>m.type==='room'&&m.players?.length===2));
  console.log('PASS create/join two-player room '+code);
  h.send({type:'start',game:'shiftline',mode:'race',course:5});
  const startH=await until('Host race start',()=>h.log.find(m=>m.type==='start'));
  const startG=await until('Guest race start',()=>g.log.find(m=>m.type==='start'));
  assert.equal(startH.course,5);assert.equal(startG.course,5);
  const state=(t)=>({t,x:0,y:0,speed:55,energy:100,boost:false,crashed:false});
  h.send({type:'state',state:state(8)});
  g.send({type:'state',state:state(9)});
  await until('Host receives guest position',()=>h.log.some(m=>m.type==='state'&&m.id===g.log.find(x=>x.type==='room')?.id),8000);
  await until('Guest receives host position',()=>g.log.some(m=>m.type==='state'&&m.id===created.id),8000);
  const sent=Date.now();h.send({type:'ping',sent});
  await until('Ping response',()=>h.log.find(m=>m.type==='pong'&&m.sent===sent),8000);
  console.log(JSON.stringify({ok:true,room:code,course:startH.course,hostReceivedGuest:true,guestReceivedHost:true,pingPong:true}));
 }finally{h?.ws.close();g?.ws.close()}
}
try{await checkStatic();await multiplayerTest();console.log('SHIFTLINE MULTIPLAYER SMOKE: PASS')}catch(error){
 console.error('SHIFTLINE MULTIPLAYER SMOKE: FAIL',error.stack||error);
 process.exitCode=1;
}
