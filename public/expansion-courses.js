export const EXPANSIONS={
4:{name:'TEMPEST',tag:'THE SKY FOUNDRY',desc:'Climb above mountain cities, then dive into the eye of the storm.',color:'#9bcfff',sky:0x162c46,fog:0x244761,ground:0x35404b,metal:0x536d84,colors:[0x8bd9ff,0xffd29a,0xb9a6ff,0x6feaff],shift:0xffcda0,chapters:['MOUNTAIN LAUNCH','TURBINE DISTRICT','LIGHTNING SPINE','STORM EYE'],details:['ASCENT / CITY','CORKSCREWS / TURBINES','ELECTRICAL GATES','DESCENT / LOOP']},
5:{name:'VERDANT',tag:'THE OVERGROWN MACHINE',desc:'Wind through a rainforest valley, waterfalls and luminous ruins.',color:'#a2eb9e',sky:0x183830,fog:0x224b3b,ground:0x344c30,metal:0x63786b,colors:[0xc0ee9a,0x80dfd4,0xe0be88,0x8aafff],shift:0xb5e7ff,chapters:['CANOPY APPROACH','WATERFALL CROSSING','ROOTWORKS','LUMINOUS CORE'],details:['FOREST / CANOPY','WATER WHEELS / GLASS','ROOTS / IRRIGATION','CAVERN / LOOP']},
6:{name:'FRACTURE',tag:'THE PLANETARY ENGINE',desc:'Spiral into a lunar excavation, cross the rift and thread twin loops.',color:'#ffc79b',sky:0x090d20,fog:0x141a2e,ground:0x514d54,metal:0x7a7474,colors:[0xffc193,0xc9d0e3,0x8eb3ff,0xcf98ff],shift:0x90e6ff,chapters:['SURFACE REFINERY','EXCAVATION SHAFT','FRACTURE CROSSING','GRAVITY CORE'],details:['MOON / REFINERY','HELIX / DRILLS','FIGURE EIGHT / RIFT','TWIN LOOPS / FINISH']}}
export function expansionAct(s,length,course){const i=Math.min(3,Math.floor(Math.max(0,s)/length*4)),p=EXPANSIONS[course];return{name:'0'+(i+1)+' / '+p.chapters[i],start:i/4,end:(i+1)/4,color:p.colors[i]};}
export function expansionShift(time){const cycle=Math.floor(Math.max(0,time)/30),q=Math.min(1,(Math.max(0,time)-cycle*30)/5),h=q*q*q*(q*(q*6-15)+10);return cycle?(cycle%2?h:1-h):0;}
export function expansionPoints(course){const out=[],v=(x,y,z)=>out.push([x,y,z]);
 const loop=r=>{const b=out.at(-1);for(let i=1;i<=64;i++){const a=i/64*Math.PI*2;v(b[0]+55*(a-Math.sin(a))/(Math.PI*2),b[1]-r*(1-Math.cos(a)),b[2]-r*Math.sin(a));}};
 if(course===4){for(let i=0;i<=10;i++)v(Math.sin(i*.32)*65,350+i*38,-i*100);let b=out.at(-1);for(let i=1;i<=50;i++){const a=i/50*Math.PI*4;v(b[0]+145*Math.sin(a),b[1]+125*(1-Math.cos(a)),b[2]-i*65);}b=out.at(-1);for(let i=1;i<=50;i++){const a=i/50*Math.PI*4;v(b[0]+260*Math.sin(a),b[1]-i*10,b[2]-260+260*Math.cos(a));}b=out.at(-1);for(let i=1;i<=5;i++)v(b[0],b[1],b[2]-i*65);loop(105);}
 if(course===5){for(let i=0;i<=9;i++)v(Math.sin(i*.4)*45,220-i*7,-i*100);let b=out.at(-1);for(let i=1;i<=42;i++){const a=i/42*Math.PI*3;v(b[0]+210*Math.sin(a),b[1]-i*1.8+35*Math.sin(a*.7),b[2]-i*65);}b=out.at(-1);for(let i=1;i<=22;i++)v(b[0]+Math.sin(i*.45)*135,b[1]-i*2.5+25*Math.sin(i*.3),b[2]-i*80);b=out.at(-1);for(let i=1;i<=4;i++)v(b[0],b[1],b[2]-i*65);loop(95);}
 if(course===6){for(let i=0;i<=8;i++)v(0,500-i*18,-i*100);let b=out.at(-1);for(let i=1;i<=64;i++){const a=i/64*Math.PI*4;v(b[0]+(290-i*1.6)*Math.sin(a),b[1]-i*5,b[2]-290+(290-i*1.6)*Math.cos(a));}b=out.at(-1);for(let i=1;i<=40;i++){const a=i/40*Math.PI*2;v(b[0]+240*Math.sin(a),b[1]+65*Math.sin(a*2),b[2]-i*65);}b=out.at(-1);for(let i=1;i<=4;i++)v(b[0],b[1],b[2]-i*60);loop(105);b=out.at(-1);for(let i=1;i<=4;i++)v(b[0],b[1],b[2]-i*70);loop(85);}
 const b=out.at(-1);for(let i=1;i<=4;i++)v(b[0],b[1],b[2]-i*75);return out;
}
const box=(x,y,hx,hy,a=0)=>({type:'box',x,y,hx,hy,hz:.45,a}),ring=(x,y,R,tube)=>({type:'torus',x,y,R,tube});
function arc(inner,outer,start,end){const points=[];for(let i=0;i<=40;i++){const a=start+(end-start)*i/40;points.push([Math.cos(a)*outer,Math.sin(a)*outer]);}for(let i=40;i>=0;i--){const a=start+(end-start)*i/40;points.push([Math.cos(a)*inner,Math.sin(a)*inner]);}return{type:'polygon',points,hz:.55};}
export function expansionSpecifications(course,length){const out=[],patterns=course===4?['sky-turbine','sky-shutter','sky-crane','sky-discharge']:course===5?['forest-wheel','forest-root','forest-irrigator','forest-door']:['moon-drill','moon-clamp','moon-carrier','moon-segments'];
 for(let i=0,s=240;s<length-350;i++,s+=Math.floor(s/length*4)>=2?130:155){const theme=Math.min(4,Math.floor(s/length*4)+1),kind=i%4===0?(course===4?'sky-shutter':course===5?'forest-door':'moon-clamp'):patterns[(i+theme-1)%4],solids=[];
 if(kind==='sky-turbine'||kind==='forest-wheel'||kind==='moon-drill'){solids.push(ring(0,0,1.7,.24));const n=kind==='forest-wheel'?4:3;for(let k=0;k<n;k++){const a=k*Math.PI*2/n;solids.push(box(Math.cos(a)*3.7,Math.sin(a)*3.7,2.4,kind==='moon-drill'?.34:.2,a));}if(kind==='forest-wheel')solids.push(ring(0,0,6.8,.17));}
 if(kind==='sky-shutter'||kind==='forest-door')solids.push(box(-5,0,2.7,6.8),box(5,0,2.7,6.8));
 if(kind==='sky-crane')solids.push(box(-3.9,-1.4,2.1,.3,.2),box(3.8,2.1,2.2,.3,-.3),ring(0,0,2.25,.15));
 if(kind==='sky-discharge')solids.push(arc(3.05,6.9,.55,Math.PI*2-.55));
 if(kind==='forest-root')solids.push(arc(3.5,6.9,.2,Math.PI*2-.75));
 if(kind==='forest-irrigator')solids.push(box(-4.2,1,2.35,.3,.25),box(4.2,-1,2.35,.3,.25),ring(0,0,2.4,.2));
 if(kind==='moon-clamp')solids.push(arc(3.3,6.9,.2,Math.PI-.2),arc(3.3,6.9,Math.PI+.2,Math.PI*2-.2));
 if(kind==='moon-carrier')solids.push(box(-3.3,2,1.6,1.05),box(3.3,-2,1.6,1.05),ring(0,0,2.3,.18));
 if(kind==='moon-segments')for(let k=0;k<3;k++)solids.push(arc(3.4,6.9,k*Math.PI*2/3+.17,(k+1)*Math.PI*2/3-.17));
 out.push({id:i,s,kind,course,theme,forceDodge:i%4===0,solids,seed:i*.731,spin:(i%2?1:-1)*(.12+theme*.015)});
 }return out;
}
export function expansionState(o,time){const shift=expansionShift(time),t=time+o.seed,rotating=/turbine|wheel|drill|segments/.test(o.kind);let x=0,y=0,a=rotating?o.seed*.2+time*o.spin:o.seed*.1;
 if(/shutter|door|carrier/.test(o.kind)){x=Math.sin(t*.28+shift*.35)*.8;a=Math.sin(t*.15)*.1;}
 if(/crane|irrigator|root/.test(o.kind)){y=Math.sin(t*.27+shift*.3)*.55;a=Math.sin(t*.23)*.2;}
 if(/discharge|clamp/.test(o.kind)){x=Math.sin(t*.22)*.65;y=Math.cos(t*.25)*.45;}
 return{x,y,a:a+shift*.22,scale:1};
}
