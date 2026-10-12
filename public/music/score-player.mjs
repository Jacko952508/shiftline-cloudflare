// Prepared replacement for the procedural music worker. Activate only after
// the seven recorded assets have been generated, checked and published.
const NAMES=['menu','eclipse','leviathan','cinder','tempest','verdant','fracture'];
export function scoreForTrack(id){
 id=Math.max(0,Math.min(25,id|0));
 if(id===0||id===9)return 'menu';
 return NAMES[id<5?1:id<9?2:id<14?3:id<18?4:id<22?5:6];
}
export function createScorePlayer(ctx,output,{fetchAsset=fetch,budget=40000000,assetBase=new URL('./music/',globalThis.location?.href||'https://example.invalid/')}={}){
 const cache=new Map(),pending=new Map(),voices=new Set();
 let active=null,wanted=null,generation=0;
 function clean(v){if(v.cleaned)return;v.cleaned=true;v.source.disconnect();v.gain.disconnect();voices.delete(v);if(active===v)active=null;}
 function retire(v,time,fade){
  if(v.retiring)return;v.retiring=true;
  const p=v.gain.gain;
  if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(time);
  else {p.cancelScheduledValues(time);p.setValueAtTime(p.value,time);}
  p.linearRampToValueAtTime(0,time+fade);
  try{v.source.stop(time+fade+.02)}catch{clean(v)}
 }
 async function load(name){
  if(cache.has(name)){const b=cache.get(name);cache.delete(name);cache.set(name,b);return b;}
  if(pending.has(name))return pending.get(name);
  const promise=(async()=>{
   const response=await fetchAsset(new URL(`${name}-v62.mp3`,assetBase));
   if(!response.ok)throw new Error(`Soundtrack ${name}: HTTP ${response.status}`);
   const buffer=await ctx.decodeAudioData(await response.arrayBuffer());
   if(!Number.isFinite(buffer.duration)||buffer.duration<30)throw new Error(`Soundtrack ${name}: invalid duration`);
   cache.set(name,buffer);
   while(cache.size>1&&[...cache.values()].reduce((s,b)=>s+b.length*b.numberOfChannels*4,0)>budget)cache.delete(cache.keys().next().value);
   return buffer;
  })();
  pending.set(name,promise);
  try{return await promise}finally{pending.delete(name)}
 }
 function startVoice(name,buffer,time,offset=0,fade=.45){
  const source=ctx.createBufferSource(),gain=ctx.createGain();
  source.buffer=buffer;source.loop=false;source.connect(gain);gain.connect(output);
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(1,time+fade);
  const v={name,buffer,source,gain,start:time-offset,end:time+buffer.duration-offset,retiring:false,token:generation};
  gain.gain.setValueAtTime(1,v.end-1.2);gain.gain.linearRampToValueAtTime(0,v.end);
  source.onended=()=>{clean(v);if(!v.retiring&&v.token===generation&&wanted===name)armLoop(active)};
  voices.add(v);source.start(time,offset);active=v;return v;
 }
 function armLoop(v){
  if(!v||v.loopArmed||v.retiring||v.token!==generation||wanted!==v.name)return;
  v.loopArmed=true;
  // Schedule the successor on the Web Audio clock before the current track
  // ends. No JS timing, gameplay frame rate or background interval controls
  // the seam. Only the atmospheric outro overlaps the next introduction.
  startVoice(v.name,v.buffer,Math.max(ctx.currentTime,v.end-1.2),0,1.2);
 }
 async function play(id){
  const name=scoreForTrack(id);
  if(wanted===name&&(active?.name===name||pending.has(name)))return;
  wanted=name;const token=++generation;
  const buffer=await load(name);
  if(token!==generation||wanted!==name||ctx.state!=='running')return;
  const t=ctx.currentTime;
  for(const v of [...voices]){
   if(v.retiring||v.start>t){try{v.source.stop()}catch{}clean(v)}
   else retire(v,t,.45);
  }
  armLoop(startVoice(name,buffer,t+.02,0,.5));
 }
 function stop(){generation++;wanted=null;active=null;for(const v of [...voices]){try{v.source.stop()}catch{}clean(v)}}
 return {play,preload:id=>load(scoreForTrack(id)),stop,
  stats:()=>({cached:cache.size,pending:pending.size,voices:voices.size,bytes:[...cache.values()].reduce((s,b)=>s+b.length*b.numberOfChannels*4,0),active:active?.name??null})};
}
