// Original reusable stereo effects. Render once; playback does no per-sample JS work.
const SR=32000,TAU=Math.PI*2,cache=new Map();
export function effectBuffer(ctx,name,water=false){
 const key=name+':'+Number(water);if(cache.has(key))return cache.get(key);
 const looping=name.startsWith('engine'),duration=looping?1:({pulse:.24,missile:1.05,mine:.62,crash:1.25,shield:.48,hull:.6,boost:.75,release:.38,scrape:.22,flyby:.42,hit:.2,kill:.8}[name]||.3);
 const N=Math.round(duration*SR),b=ctx.createBuffer(2,N,SR),L=b.getChannelData(0),R=b.getChannelData(1);
 let seed=9157,low=0,slow=0;const sin=n=>Math.sin(TAU*n),dec=(t,k)=>Math.exp(-t*k);
 for(let i=0;i<N;i++){
  const t=i/SR;seed=(Math.imul(seed,1664525)+1013904223)|0;const n=(seed>>>0)/2147483648-1;low+=.16*(n-low);slow+=.025*(n-slow);const hiss=n-low;
  let v=0,side=0;
  if(name==='engineBody')v=(sin(72*t)+.42*sin(144*t)+.22*sin(216*t)+.09*sin(360*t))*(.83+.12*sin(3*t)+.05*sin(7*t))*.44;
  else if(name==='engineTurbine'){v=(sin(320*t+.045*sin(4*t))+.32*sin(640*t)+.12*sin(960*t))*.34;side=.04*sin(321*t);}
  else if(name==='engineAir'){v=(low-slow)*1.6+hiss*.07;side=hiss*.09;}
  else if(name==='pulse'){
   v=sin(92*t+20*.018*(1-dec(t,55)))*dec(t,35)*.52;
   v+=(sin(135*t+650*.025*(1-dec(t,40))+.12*sin(470*t))+.2*sin(1200*t))*dec(t,22)*.37+hiss*dec(t,115)*.2;
   side=sin(880*t)*dec(t,28)*.07;
  }else if(name==='missile'){
   v=sin(68*t)*dec(t,33)*.65+(low-slow)*(.6*Math.min(1,t/.06)*dec(t,3.8))+(hiss*.12+sin(180*t+230*t*t)*.12)*Math.min(1,t/.09)*dec(t,4);
   v+=sin(460*t)*dec(t,70)*.17;side=hiss*Math.min(1,t/.08)*dec(t,5)*.1;
  }else if(name==='mine'){
   v=sin(110*t)*dec(t,35)*.4+hiss*dec(t,90)*.2;
   for(const a of [.08,.22])if(t>a){const q=t-a;v+=sin((a===.08?760:1140)*q+.15*sin(1520*q))*dec(q,25)*.32;}
   side=sin(1800*t)*dec(t,18)*.05;
  }else if(name==='crash'||name==='hull'){
   const k=name==='hull'?1.6:1;
   v=sin(42*t+90*.035*(1-dec(t,29)))*dec(t,9*k)*.64+(low*.85+hiss*.23)*dec(t,13*k);
   for(const [f,a]of [[347,.15],[593,.11],[941,.07],[1537,.035]])v+=sin(f*t)*dec(t,6*k+f/220)*a;
   for(const a of [.09,.17,.29,.43])if(t>a){const q=t-a;v+=(hiss*.22+sin(700*q+200*q*q)*.05)*dec(q,38*k)*dec(a,4);}
   side=hiss*dec(t,10*k)*.13;
  }else if(name==='hit'){
   v=sin(170*t)*dec(t,40)*.35+sin(1670*t)*dec(t,65)*.18+hiss*dec(t,75)*.14;
  }else if(name==='kill'){
   v=sin(58*t)*dec(t,13)*.35;
   for(const [a,f]of [[.025,660],[.13,880],[.25,1320]])if(t>a){const q=t-a;v+=(sin(f*q)+.2*sin(f*2*q))*dec(q,8)*.19;side+=sin((f+3)*q)*dec(q,10)*.04;}
  }else if(name==='shield'){
   v=(sin(220*t+.4*sin(33*t))+.35*sin(660*t))*dec(t,9)*.43+hiss*dec(t,45)*.12;side=sin(442*t)*dec(t,12)*.08;
  }else if(name==='boost'){
   const env=Math.min(1,t/.04)*dec(t,5);v=(sin(85*t+260*t*t)*.42+(low-slow)*.65+hiss*.08)*env+sin(46*t)*dec(t,13)*.25;side=hiss*env*.09;
  }else if(name==='release'){v=(low*.8+sin(210*t-130*t*t)*.25)*Math.min(1,t/.008)*dec(t,13);side=hiss*dec(t,18)*.05;}
  else if(name==='flyby'){const e=Math.sin(Math.PI*Math.min(1,t/.42))**3;v=((low-slow)*.7+hiss*.12)*e;side=hiss*e*.06;}
  else if(name==='scrape'){v=(hiss*.3+sin(1450*t+60*sin(24*t))*.16)*dec(t,16);side=hiss*dec(t,20)*.07;}
  if(water&&!looping){v=v*.7+slow*.35*dec(t,8);side*=.6;}
  const edge=looping&&name!=='engineAir'?1:Math.min(1,i/(looping?256:64),(N-1-i)/(looping?256:320));
  L[i]=Math.tanh((v+side)*1.12)*.8*edge;R[i]=Math.tanh((v-side)*1.12)*.8*edge;
 }
 cache.set(key,b);return b;
}
