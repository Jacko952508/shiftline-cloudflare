// Original 32-bar scores. All composition and mastering run off the game thread.
const SR=32000,TAU=Math.PI*2;
const families={
 menu:{bpm:92,root:73.416,kind:'menu',chords:[0,-5,3,-2,0,5,3,7],motif:[12,19,22,15,14,19,10,7],mode:3},
 eclipse:{bpm:138,root:73.416,kind:'eclipse',chords:[0,0,3,-5,0,7,3,-2],motif:[12,19,15,22,24,19,14,10],mode:3},
 leviathan:{bpm:124,root:61.735,kind:'leviathan',chords:[0,3,-5,7,0,-2,3,-5],motif:[19,15,22,14,12,10,7,14],mode:3},
 cinder:{bpm:142,root:69.296,kind:'cinder',chords:[0,-1,-5,3,0,-5,7,-1],motif:[12,7,13,19,15,12,10,7],mode:3},
 tempest:{bpm:132,root:55,kind:'tempest',chords:[0,3,7,-5,0,5,3,7],motif:[12,15,19,24,22,19,15,14],mode:3},
 verdant:{bpm:116,root:82.407,kind:'verdant',chords:[0,5,7,3,0,-5,5,7],motif:[12,14,19,21,24,19,16,14],mode:4},
 fracture:{bpm:130,root:65.406,kind:'fracture',chords:[0,-5,3,7,0,-2,-5,3],motif:[12,19,10,22,15,24,14,7],mode:3},
 results:{bpm:104,root:73.416,kind:'results',chords:[0,3,-5,7],motif:[12,15,19,24,22,19,15,12],mode:3}
};
const scores=[{...families.menu,family:0},{...families.results,family:0}];
function config(id){if(id===0)return scores[0];if(id===9)return scores[1];const ranges=[[1,'eclipse',1],[5,'leviathan',2],[10,'cinder',3],[14,'tempest',4],[18,'verdant',5],[22,'fracture',6]];for(const[start,name,family]of ranges)if(id>=start&&id<start+4)return{...families[name],family,stage:id-start};return scores[0];}
const table=new Float32Array(4096);for(let i=0;i<table.length;i++)table[i]=Math.sin(i/4096*TAU);
function sine(cycles){const p=cycles*4096,i=Math.floor(p),f=p-i;return table[i&4095]*(1-f)+table[(i+1)&4095]*f;}
function render(id){
 const cfg=config(id),kind=cfg.kind,calm=kind==='menu'||kind==='results',stage=cfg.stage||0,bars=kind==='results'?16:32,beats=bars*4;
 const N=Math.round(SR*beats*60/cfg.bpm),beat=N/SR/beats,L=new Float32Array(N),R=new Float32Array(N);let seed=72319+cfg.family*733;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296*2-1;},freq=n=>cfg.root*2**(n/12);
 function add(at,d,fn,pan=0,echo=0){const start=Math.round(at*SR),count=Math.ceil(d*SR),l=Math.sqrt((1-pan)/2),r=Math.sqrt((1+pan)/2),delay=Math.round(beat*.75*SR);for(let i=0;i<count;i++){const t=i/SR,v=fn(t,i)*Math.min(1,t/.006)*Math.min(1,(d-t)/.024),j=(start+i)%N;L[j]+=v*l;R[j]+=v*r;if(echo){const k=(j+delay)%N,h=(j+delay*2)%N;L[k]+=v*r*echo;R[k]+=v*l*echo;L[h]+=v*l*echo*.3;R[h]+=v*r*echo*.3;}}}
 function kick(at,vol=1){add(at,.4,t=>(sine(46*t+88*.025*(1-Math.exp(-t/.025)))*Math.exp(-t*12)*.105+random()*Math.exp(-t*230)*.008)*vol);}
 function snare(at,vol=1){let low=0;add(at,.21,t=>{const n=random();low+=.2*(n-low);return((n-low)*.046+sine(180*t)*Math.exp(-t*28)*.022)*Math.exp(-t*22)*vol},.12);}
 function hat(at,open=false,vol=1,pan=.45){let low=0;add(at,open?.18:.055,t=>{const n=random();low+=.3*(n-low);return(n-low)*Math.exp(-t*(open?28:90))*.011*vol},pan);}
 function mallet(at,n,vol=.048,pan=0){const f=freq(n);add(at,beat*1.8,t=>{const e=Math.exp(-t*7);return(sine(f*t+sine(f*2.01*t)*.18*e)+.18*sine(f*3.98*t)*Math.exp(-t*12))*(Math.exp(-t*5)+.12*Math.exp(-t*1.7))*vol},pan,.3);}
 for(let bar=0;bar<bars;bar++){
  const base=bar*beat*4,root=cfg.chords[Math.floor(bar/4)%cfg.chords.length],phrase=Math.floor(bar/8),breakdown=bar%16===7||bar%16===15,sparse=bar>=24&&bar<28;
  // Sustained chord voicings and a high string line; voiced above the bass range.
  const chord=[0,cfg.mode,7,kind==='verdant'?14:10];
  for(let j=0;j<chord.length;j++){const f=freq(root+chord[j]+12),d=beat*5,wide=(j-1.5)*.4;add(base,d,t=>{const attack=Math.min(1,t/(beat*.8)),release=Math.min(1,(d-t)/(beat*1.4)),env=attack*release,duck=calm?1:.7+.3*Math.min(1,(t%beat)/.15),motion=.85+.15*sine(t*.27+j*.2);return(sine(f*t)+.25*sine(f*1.0025*t)+.1*sine(f*2*t))*env*duck*motion*(calm?.02:.014+stage*.0015)},wide,.12);}
  if((kind==='tempest'||kind==='menu'||kind==='verdant')&&bar%2===0){const f=freq(root+19),d=beat*8;add(base,d,t=>(sine(f*t+.0018*sine(t*4))+sine(f*1.0018*t)*.22)*Math.sin(Math.PI*Math.min(1,t/d))**2*.023,-.28,.2);}
  for(let st=0;st<16;st++){
   const at=base+st*beat*.25,off=st%4,accent=st===0?1:.8;
   if(!calm&&!sparse){
    const kickSteps=kind==='eclipse'?[0,4,8,12]:kind==='leviathan'?[0,6,8,11]:kind==='tempest'?[0,3,8,10]:kind==='verdant'?[0,8,14]:kind==='fracture'?[0,7,8,14]:[0,4,8,12];
    if(kickSteps.includes(st)&&!(breakdown&&st>8))kick(at,accent*(kind==='verdant'?.72:1));
    if(st===4||st===12)snare(at,kind==='verdant'?.5:kind==='leviathan'?.68:.82);
    if(st%2===1&&!(breakdown&&st>11))hat(at,st===11,.65+stage*.06,st%4===1?-.48:.48);
    if(kind==='verdant'&&[3,7,10,15].includes(st)){const f=freq(root+24+(st%3)*3);add(at,.13,t=>sine(f*t+sine(f*1.45*t)*.3)*Math.exp(-t*35)*.026,(st%3-1)*.45);}
    if(kind==='cinder'&&[2,10].includes(st)){const f=freq(root+31);add(at,.18,t=>(sine(f*t)+.3*sine(f*2.7*t))*Math.exp(-t*28)*.016,st===2?-.6:.6);}
   }else if(calm&&bar%2===0&&st===0)kick(at,.18);
   const bassSteps=calm?[0,8]:kind==='leviathan'?[0,3,6,8,11,14]:kind==='verdant'?[0,6,8,14]:[0,3,6,8,10,14];
   if(bassSteps.includes(st)&&(!sparse||st===0||st===8)){const n=root+(st===14?7:st===10?10:0)-12,f=freq(n),d=beat*(calm?2:.62);add(at,d,t=>{const p=f*t,e=Math.exp(-t/(d*.5));return(sine(p)+.35*sine(p*2)+.14*sine(p*3)+(kind==='cinder'?.15*sine(p*5):0))*e*(calm?.052:kind==='verdant'?.08:.095)});}
   // A lead phrase answers the arpeggio instead of running nonstop.
   if(st%2===0&&(stage>0||calm||st%4===0)&&(!calm||st%4===0)&&(!sparse||st%4===0)){
    const degrees=[0,cfg.mode,7,10,14,7,cfg.mode,19],n=root+degrees[(st/2+bar%4)%8]+12,f=freq(n),d=beat*(calm?1.6:.65),pan=sine((bar*16+st)*.13)*.52,volume=calm?.036:.024+stage*.003;
    if(kind==='leviathan'||kind==='verdant'||kind==='fracture'||calm)mallet(at,n,volume,pan);else add(at,d,t=>{const env=Math.exp(-t/(d*.35));return(sine(f*t)+.24*sine(f*2*t)+.1*sine(f*3*t)+.035*sine(f*5*t))*env*volume},pan,.23);
   }
   if((bar%8>=4||stage>=2&&bar%4===2)&&[0,6,10,14].includes(st)&&!sparse){const n=root+cfg.motif[(Math.floor(st/2)+bar%4+phrase+stage)%8]+(phrase===3?12:0),f=freq(n),d=beat*1.35;add(at,d,t=>{const e=Math.min(1,t/.045)*Math.exp(-t/(d*.58)),vibrato=.0025*sine(t*4.8);return(sine(f*t+vibrato)+.2*sine(f*2*t)+.06*sine(f*3*t))*e*(calm?.035:.041+stage*.004)},-.14,.25);}
  }
  if(bar%8===7&&!calm&&!sparse){for(let k=1;k<4;k++)snare(base+beat*(3+k*.25),.1+k*.035);mallet(base+beat*3,root+24,.032,.5);}
 }
 // Wrapped stereo room reflections keep tails across the exact bar-length loop.
 const delays=[.037,.071,.113,.173].map(t=>Math.round(t*SR)),wet=calm?.18:kind==='leviathan'?.16:kind==='fracture'?.14:.09;
 const rawL=L.slice(),rawR=R.slice();let dcL=0,dcR=0,prevL=0,prevR=0,energy=0,peak=0;
 for(let i=0;i<N;i++){let l=rawL[i],r=rawR[i];for(let k=0;k<delays.length;k++){const j=(i+N-delays[k])%N,g=wet/(k+2);l+=(k%2?rawL[j]:rawR[j])*g;r+=(k%2?rawR[j]:rawL[j])*g;}dcL+=.002*(l-dcL);dcR+=.002*(r-dcR);prevL=(l-dcL)*.8+prevL*.2;prevR=(r-dcR)*.8+prevR*.2;L[i]=prevL;R[i]=prevR;energy+=prevL*prevL+prevR*prevR;peak=Math.max(peak,Math.abs(prevL),Math.abs(prevR));}
 const rms=Math.sqrt(energy/(N*2)),gain=Math.min(.155/Math.max(.001,rms),.84/Math.max(.001,peak),2.8);
 for(let i=0;i<N;i++){const seam=Math.min(1,i/96,(N-1-i)/96);L[i]=Math.tanh(L[i]*gain)*.95*seam;R[i]=Math.tanh(R[i]*gain)*.95*seam;}
 return{left:L,right:R,sampleRate:SR,bpm:cfg.bpm,bars,beats,family:cfg.family,title:kind};
}
self.onmessage=({data:id})=>{try{const data=render(id);self.postMessage({id,...data},[data.left.buffer,data.right.buffer])}catch(e){self.postMessage({id,error:String(e)})}};
