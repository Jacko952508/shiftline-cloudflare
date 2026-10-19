import {flightPressure} from './flight-feedback-v176.js?v=176';
import{effectBuffer}from'./audio-effects.js?v=176';
// Recorded menu/Eclipse/Leviathan soundtracks, decoded once and looped by Web Audio.
let ctx,master,music,sfx,track=0,scene=1,src=null,srcTrack=-1,userVolume=1,boosted=false,lastBoost=false;
let synth=null,playGeneration=0,engine=null,engineNext=0,engineQuiet=true,sfxLimiter;
let warmQueue=null,warmPending=false;
const buffers=new Map(),pending=new Map(),voices=new Set(),musicVoices=new Set(),noiseCache=new Map(),effectTimes=new Map(),timings=new WeakMap(),missingRecordings=new Set();
function ac(){if(ctx&&ctx.state!=='closed')return ctx;if(ctx?.state==='closed')audioStop();ctx=new(window.AudioContext||window.webkitAudioContext)();ctx.addEventListener?.('statechange',()=>{if(ctx.state==='running'&&userVolume>0&&!document.hidden){warmEffects();if(!src||srcTrack!==track)play();}});master=ctx.createGain();master.gain.value=.7*userVolume;master.connect(ctx.destination);music=ctx.createGain();music.gain.value=.52;music.connect(master);sfx=ctx.createGain();sfx.gain.value=.72;sfxLimiter=ctx.createDynamicsCompressor();sfxLimiter.threshold.value=-12;sfxLimiter.knee.value=6;sfxLimiter.ratio.value=4;sfxLimiter.attack.value=.003;sfxLimiter.release.value=.14;sfx.connect(sfxLimiter);sfxLimiter.connect(master);return ctx}
const recordings={0:{url:'./music/m1.mp3?v=1a9617a75454',seconds:12.88589569161,beats:32},1:{url:'./music/s1.mp3?v=b227c68a7d35',seconds:25.77181405896,beats:64},5:{url:'./music/s2.mp3?v=c295d79ed0bc',seconds:24.30378684807,beats:64},10:{url:'./music/s3.mp3?v=8a7a585b3745',seconds:40,beats:96},14:{url:'./music/s4.mp3?v=3eea3f669ebe',seconds:19.2,beats:32},18:{url:'./music/s5.mp3?v=15e090851419',seconds:182.4,beats:304},22:{url:'./music/s6.mp3?v=1fd94e42b1b5',seconds:220.68965986394557,beats:640}};
function cacheBuffer(id,b){buffers.set(id,b);while(buffers.size>1&&(buffers.size>3||[...buffers.values()].reduce((n,b)=>n+b.length*8,0)>40000000))buffers.delete(buffers.keys().next().value);return b}
function render(id){if(buffers.has(id)){const b=buffers.get(id);buffers.delete(id);buffers.set(id,b);return Promise.resolve(b)}if(pending.has(id))return pending.get(id).promise;
 const recording=recordings[id];
 if(recording&&!missingRecordings.has(id)){
  const promise=(async()=>{const response=await fetch(recording.url);if(!response.ok)throw new Error('Soundtrack unavailable');const decoded=await ac().decodeAudioData(await response.arrayBuffer()),length=Math.min(decoded.length,Math.round(recording.seconds*decoded.sampleRate)),b=length===decoded.length?decoded:ac().createBuffer(decoded.numberOfChannels,length,decoded.sampleRate);
   for(let channel=0;channel<b.numberOfChannels;channel++){const out=b.getChannelData(channel);if(b!==decoded)out.set(decoded.getChannelData(channel).subarray(0,length));const width=Math.min(128,length),jump=out[0]-out[length-1];for(let i=0;i<width;i++)out[i]-=jump*(1-i/width)**3;}
   timings.set(b,{beat:b.duration/recording.beats,beats:recording.beats,kind:100+id});return cacheBuffer(id,b);
  })().catch(error=>{
   // Recorded music may be temporarily absent after migrating the static host.
   // Use the game's existing offline score engine instead of going silent.
   console.warn('SHIFTLINE: recorded soundtrack unavailable; using synthesised fallback',recording.url,error);
   missingRecordings.add(id);pending.delete(id);return render(id);
  });pending.set(id,{promise});promise.finally(()=>pending.delete(id)).catch(()=>{});return promise;
 }
 if(!synth){try{synth=new Worker('./audio-worker.js?v=53');synth.onmessage=({data})=>{const p=pending.get(data.id);if(!p||!p.resolve)return;pending.delete(data.id);if(data.error){p.reject(new Error(data.error));return}const b=ac().createBuffer(2,data.left.length,data.sampleRate||32000);b.copyToChannel(data.left,0);b.copyToChannel(data.right,1);timings.set(b,{beat:data.left.length/(data.sampleRate||32000)/(data.beats||64),beats:data.beats||64,kind:data.family||0});cacheBuffer(data.id,b);p.resolve(b)};synth.onerror=()=>{for(const [id,p]of pending){if(p.reject){p.reject(new Error('Music synthesis unavailable'));pending.delete(id)}}synth.terminate();synth=null}}catch{return Promise.reject(new Error('Music unavailable'))}}
 let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});pending.set(id,{promise,resolve,reject});synth.postMessage(id);return promise;
}
function clean(v){v.source.disconnect();for(const n of v.nodes)n.disconnect();voices.delete(v);musicVoices.delete(v)}
function play(){if(!ctx||ctx.state!=='running'||userVolume<=0)return;const generation=++playGeneration,id=track;render(id).then(buffer=>{if(generation!==playGeneration||track!==id||ctx.state!=='running'||userVolume<=0)return;const t=ctx.currentTime,info=timings.get(buffer),old=[...musicVoices].find(v=>v.source===src);
 // Sections within a level share a tempo and enter on the outgoing bar, including its bar phase.
 const matched=old&&old.startedAt<=t&&info.kind!==0&&old.info.kind===info.kind;
 let start=t,offset=0,fade=.55;
 if(matched){const position=Math.max(0,t-old.startedAt+old.offset),beatIndex=Math.ceil((position+.025)/(old.info.beat*4))*4;start=old.startedAt-old.offset+beatIndex*old.info.beat;offset=(beatIndex%info.beats)*info.beat;fade=Math.min(.4,info.beat*.9)}
 for(const v of [...musicVoices]){if(v!==old){try{v.source.stop()}catch{}clean(v);continue}v.gain.gain.cancelScheduledValues(t);v.gain.gain.setValueAtTime(v.gain.gain.value,t);v.gain.gain.linearRampToValueAtTime(0,matched?start+fade:t+.18);try{v.source.stop((matched?start+fade:t+.18)+.02)}catch{}}
 // Different-tempo menu/results cues fade out before the new rhythm enters.
 if(old&&!matched)start=t+.2;
 const source=ctx.createBufferSource(),gain=ctx.createGain(),v={source,gain,nodes:[gain],info,startedAt:start,offset};source.buffer=buffer;source.loop=true;gain.gain.setValueAtTime(0,start);for(let i=1;i<=12;i++)gain.gain.linearRampToValueAtTime(Math.sin(i/12*Math.PI/2),start+fade*i/12);source.connect(gain);gain.connect(music);source.onended=()=>clean(v);musicVoices.add(v);source.start(start,offset);src=source;srcTrack=id;
 }).catch(()=>{})}
export function setAudioScene(n){scene=n===2||n===5?2:n===3||n===6?3:1}
export function setAudioTrack(n){n=Math.max(0,Math.min(25,n|0));if(n>=1&&n<=4)n=1;else if(n>=5&&n<=8)n=5;else if(n>=10&&n<=13)n=10;else if(n>=14&&n<=17)n=14;else if(n>=18&&n<=21)n=18;else if(n>=22)n=22;if(track===n&&(src||pending.has(n)))return;track=n;if(ctx?.state==='running')play()}
function warmEffects(){
 if(warmPending||!ctx||ctx.state!=='running'||!userVolume)return;
 warmQueue??=[...['engineBody','engineTurbine','engineAir'].map(n=>[n,false]),...[false,true].flatMap(w=>['pulse','missile','mine','crash','shield','hull','boost','release','scrape','flyby','hit','kill'].map(n=>[n,w]))];
 if(!warmQueue.length)return;warmPending=true;
 const run=()=>{warmPending=false;if(!ctx||ctx.state!=='running'||!userVolume)return;const [name,water]=warmQueue.shift();effectBuffer(ctx,name,water);warmEffects();};
 if(window.requestIdleCallback)window.requestIdleCallback(run,{timeout:1500});else setTimeout(run,40);
}
// Prepare the first-use sounds before the countdown, one buffer per task.
// Background idle warming may otherwise leave the first crash at the end of its queue.
export async function prepareRaceAudio(valid=()=>true){
 if(!ctx||!userVolume)return;
 const effects=['pulse','missile','mine','crash','shield','hull','boost','release','scrape','flyby','hit','kill'];
 const required=[...['engineBody','engineTurbine','engineAir'].map(name=>[name,false]),...[false,true].flatMap(water=>effects.map(name=>[name,water]))];
 for(const [name,water] of required){
  if(!valid())return;
  effectBuffer(ctx,name,water);
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 if(!valid())return;
 noise(.55);
 if(ctx.state==='running'){
  engineSound(84,false,0);
  for(const v of engine||[]) {v.gain.gain.cancelScheduledValues(ctx.currentTime);v.gain.gain.setValueAtTime(0,ctx.currentTime);}
  engineQuiet=true;
 }
}
export async function audioStart(gesture=false){
 if(!userVolume)return;const c=ac();const resume=c.state!=='running'?c.resume().catch(()=>{}):Promise.resolve();
 if(gesture&&c.state!=='running'){
  // Start inside the gesture itself; iOS can reject a deferred unlock.
  const source=c.createBufferSource(),gain=c.createGain(),v={source,nodes:[gain]};
  source.buffer=c.createBuffer(1,1,c.sampleRate);gain.gain.value=0;source.connect(gain);gain.connect(master);source.onended=()=>clean(v);voices.add(v);source.start();source.stop(c.currentTime+.01);
 }
 try{await resume}catch{}
 if(c.state==='running'){warmEffects();if(!src||srcTrack!==track)play()}
}
export function installAudioActivation(canPlay=()=>true){
 // Prepare the score before the first tap and try permitted autoplay once.
 if(userVolume){render(track).catch(()=>{});audioStart().catch(()=>{});}
 const activate=()=>{if(document.hidden||!canPlay()||!userVolume)return;if(!ctx||ctx.state!=='running'||!src)audioStart(true).catch(()=>{});};
 for(const name of ['pointerdown','pointerup','touchstart','touchend','click','keydown'])document.addEventListener(name,activate,{capture:true,passive:true});
}
export async function audioResume(gesture=false){await audioStart(gesture);if(music)music.gain.setTargetAtTime(boosted?.6:.52,ctx.currentTime,.1)}
export async function audioSuspend(){if(ctx?.state==='running')try{await ctx.suspend()}catch{}}
export function audioStop(){playGeneration++;for(const v of [...musicVoices]){try{v.source.stop()}catch{}clean(v)}for(const v of [...voices]){try{v.source.stop()}catch{}clean(v)}src=null;srcTrack=-1;lastBoost=boosted=false;effectTimes.clear();if(ctx&&music){music.gain.cancelScheduledValues(ctx.currentTime);music.gain.setValueAtTime(.52,ctx.currentTime)}stopEngine()}
export function setMasterVolume(v){const previous=userVolume;userVolume=Math.max(0,Math.min(1,Number(v)||0));if(ctx){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(.7*userVolume,ctx.currentTime,.02);if(userVolume===0){audioStop();ctx.suspend().catch(()=>{})}else if(previous===0)audioResume().catch(()=>{})}}
function tone(f,end,duration,volume,type='sine',delay=0){if(!ctx||ctx.state!=='running'||!userVolume)return;const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain(),v={source:o,nodes:[g]};o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(sfx);voices.add(v);o.onended=()=>clean(v);o.start(t);o.stop(t+duration+.02)}
function noise(sec){const key=Math.ceil(sec*10);if(noiseCache.has(key))return noiseCache.get(key);const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*key/10),ctx.sampleRate),x=b.getChannelData(0);let seed=7251;for(let i=0;i<x.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;x[i]=(seed>>>0)/2147483648-1}noiseCache.set(key,b);return b}
function burst(duration,frequency,end,volume,type='lowpass'){if(!ctx||ctx.state!=='running'||!userVolume)return;const t=ctx.currentTime,n=ctx.createBufferSource(),g=ctx.createGain(),lp=ctx.createBiquadFilter(),v={source:n,nodes:[lp,g]};n.buffer=noise(duration);lp.type=type;lp.frequency.setValueAtTime(frequency,t);lp.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);n.connect(lp);lp.connect(g);g.connect(sfx);voices.add(v);n.onended=()=>clean(v);n.start(t);n.stop(t+duration+.02)}
function effect(name,volume=1,gap=.04,pan=0){
 if(!ctx||ctx.state!=='running'||!userVolume)return;const t=ctx.currentTime;
 if(t-(effectTimes.get(name)??-100)<gap)return;effectTimes.set(name,t);
 while(voices.size>=24){const oldest=voices.values().next().value;try{oldest.source.stop()}catch{}clean(oldest);}
 const source=ctx.createBufferSource(),gain=ctx.createGain(),v={source,nodes:[gain]};
 source.buffer=effectBuffer(ctx,name,scene===2);source.playbackRate.value=1+(scene===3?-.04:0)+(name==='pulse'?Math.sin(t*17)*.025:0);
 gain.gain.value=volume;source.connect(gain);if(pan&&ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=Math.max(-.85,Math.min(.85,pan));gain.connect(p);p.connect(sfx);v.nodes.push(p);}else gain.connect(sfx);source.onended=()=>clean(v);voices.add(v);source.start(t);source.stop(t+source.buffer.length/32000/source.playbackRate.value+.01);
}
export function setAudioBoost(v){boosted=!!v;if(!ctx||ctx.state!=='running')return;if(boosted===lastBoost)return;lastBoost=boosted;music.gain.setTargetAtTime(boosted?.6:.52,ctx.currentTime,.18);effect(boosted?'boost':'release',boosted?.38:.22,.12)}
function stopEngine(){if(!engine)return;for(const v of engine){try{v.source.stop()}catch{}v.source.disconnect();v.filter.disconnect();v.gain.disconnect();}engine=null;}
export function engineSound(speed,boost,draft){
 if(!speed){if(engine&&ctx&&!engineQuiet){for(const v of engine)v.gain.gain.setTargetAtTime(0,ctx.currentTime,.035);engineQuiet=true;}return;}if(!ctx||ctx.state!=='running'||!userVolume)return;
 if(!engine){engine=['engineBody','engineTurbine','engineAir'].map(name=>{const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=effectBuffer(ctx,name);source.loop=true;filter.type='lowpass';filter.frequency.value=800;gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(sfx);source.start();return{source,filter,gain};});engineNext=0;}
 const t=ctx.currentTime;if(!engineQuiet&&t<engineNext)return;engineNext=t+.05;engineQuiet=false;
 const drive=Math.max(0,Math.min(1.7,speed/84)),water=scene===2,heavy=scene===3,voice=[1,1,.88,.9,1.06,.96,.93][scene]||1;
 const pressure=flightPressure(speed);const rates=[.72+drive*.35+pressure*.17,.7+drive*.43+pressure*.22,.8+drive*.2];
 const levels=[.105+pressure*.04,water?.016:.034+pressure*.012,.038*drive+pressure*.03+(draft||0)*.008];
 const cuts=[water?420:heavy?900:1150,water?850:2200+pressure*500,water?900:2600+drive*650];
 for(let i=0;i<engine.length;i++){const v=engine[i];v.source.playbackRate.setTargetAtTime(rates[i]*(heavy?.9:1)*voice,t,.13);v.filter.frequency.setTargetAtTime(cuts[i],t,.13);v.gain.gain.setTargetAtTime(levels[i],t,.09);}
}
export function crashSound(){effect('crash',.64,.14);if(music){const t=ctx.currentTime;music.gain.cancelScheduledValues(t);music.gain.setTargetAtTime(.26,t,.025);music.gain.setTargetAtTime(boosted?.6:.52,t+.34,.24)}}
export function flybySound(gap=.35,side=0){effect('flyby',.12+Math.max(0,.55-gap)*.2,.16,-side/6.25)}
export function scrapeSound(){effect('scrape',.3,.085)}
let lastShift=-Infinity;
export function shiftSound(){if(ctx){if(ctx.currentTime-lastShift<1.2)return;lastShift=ctx.currentTime}burst(.55,scene===2?420:1100,scene===2?1300:3800,.025,'bandpass');tone(scene===2?160:220,scene===2?640:880,.7,.035,'sine');tone(scene===2?640:880,scene===2?320:440,.65,.025,'sine',.35)}
export function passSound(quality){const f=[880,880,659.25,523.25,987.77,783.99,698.46][scene]||880;tone(f,f,.14,quality===3?.05:.023);if(quality===3){tone(f*1.5,f*1.5,.25,.04,'sine',.07);tone(f*2,f*2,.32,.025,'sine',.14)}}
export function uiSound(){tone(660,880,.06,.025,'sine');tone(1320,1320,.075,.012,'sine',.025)}
export function countdownSound(n){tone(n>0?440:880,n>0?440:1320,n>0?.12:.35,n>0?.045:.065,'sine');if(n===0)tone(1760,1760,.4,.03,'sine',.07)}
export function finishSound(place){const notes=place===1?[0,4,7,12]:[0,3,7,10];for(const [i,n]of notes.entries())tone(440*2**(n/12),440*2**(n/12),.6,.045,'triangle',i*.12)}

export function weaponSound(kind){if(kind==='pulse')effect('pulse',.3,.045);else if(kind==='missile')effect('missile',.48,.12);else if(kind==='mine')effect('mine',.38,.12)}
export function shieldSound(shield){effect(shield?'shield':'hull',shield?.36:.46,.075)}
export function hitSound(killed=false){effect(killed?'kill':'hit',killed?.35:.22,killed?.15:.045)}
