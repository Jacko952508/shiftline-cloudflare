// Pure deterministic encounter data shared by rendering, AI and combat.
// Geometry is in metres. Piece actuation is evaluated once per obstacle state.
const TAU=Math.PI*2;
export const HAZARD_FAMILIES={
 1:['dock-clamps','reactor-vanes','security-segments'],
 2:['pressure-bulkhead','pump-assembly','reef-machinery'],
 3:['forge-press','furnace-shutters','cooling-rotor'],
 4:['storm-turbine','sky-crane','discharge-gate'],
 5:['water-wheel','root-arch','irrigation-valves'],
 6:['excavation-drill','mining-claws','cargo-carrier']
};
const jaw=[[-1.65,-4.4],[.85,-4.4],[1.5,-3.75],[1.10,-2.7],[1.5,-2.35],[1.5,2.35],[1.1,2.7],[1.5,3.75],[.85,4.4],[-1.65,4.4]];
const swept=[[.55,-.22],[2.8,-.58],[5.5,-.36],[6.65,.15],[6.45,.6],[4.8,.77],[2.8,.28],[.55,.26]];
const head=[[-4.7,-.95],[-4.1,-1.3],[-1.3,-1.3],[-.8,-1.05],[.8,-1.05],[1.3,-1.3],[4.1,-1.3],[4.7,-.95],[4.7,.95],[4.1,1.25],[-4.1,1.25],[-4.7,.95]];
const cargo=[[-1.25,-1.4],[.9,-1.4],[1.4,-.85],[1.4,1.05],[.85,1.4],[-1.25,1.4],[-1.45,.95],[-1.45,-.95]];
function sector(inner,outer,start,end){const points=[],n=Math.max(6,Math.ceil((end-start)/.10));for(let i=0;i<=n;i++){const a=start+(end-start)*i/n;points.push([Math.cos(a)*outer,Math.sin(a)*outer]);}for(let i=n;i>=0;i--){const a=start+(end-start)*i/n;points.push([Math.cos(a)*inner,Math.sin(a)*inner]);}return points;}
export function familySolids(course,family,variant=0){
 const out=[],shift=(variant-1)*.35;
 const poly=(points,x=0,y=0,a=0,hz=.85,drive=null,role='armour',z=0)=>out.push({type:'polygon',points:points.map(p=>[...p]),x,y,a,hz,z,drive,role});
 const box=(x,y,hx,hy,hz=.8,a=0,drive=null,role='armour')=>out.push({type:'box',x,y,hx,hy,hz,a,drive,role});
 const ring=(x,y,R,tube,drive=null,role='housing')=>out.push({type:'torus',x,y,R,tube,drive,role});
 const hub=r=>out.push({type:'sphere',x:0,y:0,r,role:'motor'});
 const slide=(x,y,phase=0)=>({x,y,phase});
 const spin=(turn,phase=0)=>({turn,phase});
 if(family==='dock-clamps'||family==='pressure-bulkhead'){
  for(const side of[-1,1])poly(jaw,side*4.65,shift,side<0?0:Math.PI,course===2?1.15:.95,slide(-side*.95,0,side>0?.35:0),'jaw');
  box(0,6.45,3.6,.35,.8,0,null,'mount');box(0,-6.45,3.6,.35,.8,0,null,'mount');for(const side of[-1,1])box(side*6.5,0,.28,4.7,.9,0,null,'rail');
 }else if(family==='reactor-vanes'||family==='pump-assembly'||family==='storm-turbine'){
  const n=family==='pump-assembly'?4:family==='storm-turbine'?3:4;hub(family==='storm-turbine'?.88:.7);
  for(let k=0;k<n;k++)poly(swept,0,0,k*TAU/n+variant*.22,family==='pump-assembly'?.62:.44,spin(family==='reactor-vanes'?(k%2?-.17:.17):family==='storm-turbine'?.18:.15),'blade',family==='reactor-vanes'?(k%2?.65:-.65):0);
  if(family!=='reactor-vanes')ring(0,0,6.55,.24);
 }else if(family==='security-segments'||family==='discharge-gate'){
  const n=family==='security-segments'?6:3,inner=family==='security-segments'?2.45:3.2;
  for(let k=0;k<n;k++){
   const a=k*TAU/n+.10,mid=a+(TAU/n-.20)/2;
   poly(sector(inner,6.7,a,a+TAU/n-.20),0,0,variant*.18,.85,{x:Math.cos(mid)*.65,y:Math.sin(mid)*.65,phase:k*.4,rock:(k%2?1:-1)*.14},'segment');
  }
 }else if(family==='reef-machinery'){
  for(const side of[-1,1]){ring(side*3.2,side*(.9+shift),1.95,.48,null,'reef');poly(jaw.map(([x,y])=>[x*.5,y*.65]),side*6.1,0,side<0?0:Math.PI,1.05,slide(0,side*.55),'reef');}
  box(0,0,.65,5.7,1.0,0,null,'spine');
 }else if(family==='forge-press'){
  for(const side of[-1,1])poly(head,shift,side*4.5,side<0?0:Math.PI,1.3,slide(0,-side*1.75),'press');
  box(-6.4,0,.35,4.4,1.05,0,null,'mount');box(6.4,0,.35,4.4,1.05,0,null,'mount');
 }else if(family==='furnace-shutters'){
  for(let k=0;k<3;k++)poly(jaw.map(([x,y])=>[x*.64,y*.75]),(k-1)*(4.0+variant*.18),(k%2?-2.3:2.3)+(variant-1)*.25,k%2?Math.PI:0,1.05,slide(0,k%2?2.2:-2.2,k*1.4),'shutter');
  for(const side of[-1,1])box(0,side*6.45,5.8,.28,.85,0,null,'rail');
 }else if(family==='cooling-rotor'){
  ring(0,0,1.8,.28,null,'motor');
  for(let k=0;k<6;k++)poly(swept.map(([x,y])=>[1.3+x*.79,y*.65]),0,0,k*TAU/6+shift,.65,spin(k%2?-.12:.12),'blade',k%2?.65:-.65);
 }else if(family==='sky-crane'||family==='cargo-carrier'){
  const h=family==='sky-crane'?1.15:1;
  for(const side of[-1,1])poly(cargo.map(([x,y])=>[x*h,y*h]),side*3.05,side*(1.8+shift),side*.08,1.25,slide(side*.95,0,side>0?1.8:0),'cargo');
  box(0,6.55,5.0,.28,.7,0,null,'rail');
 }else if(family==='water-wheel'){
  ring(0,0,5.65,.42,spin(.12),'wheel');hub(.7);
  for(let k=0;k<4;k++)poly([[.65,-.3],[3.5,-.3],[4.2,-.75],[5.8,-.75],[6.0,.7],[4.3,.7],[3.5,.3],[.65,.3]],0,0,k*TAU/4+shift,.9,spin(.12),'paddle');
 }else if(family==='root-arch'){
  for(const [start,end]of [[.15,2.55],[3.15,5.75]])out.push({type:'arc',x:0,y:0,R:5.15,tube:1.12,start,end,a:shift,drive:{rock:.09,phase:start},role:'root'});
  out.push({type:'arc',x:0,y:0,R:3.9,tube:.55,start:.8,end:1.65,a:variant*.35,drive:{rock:.12},role:'root'});
 }else if(family==='irrigation-valves'){
  for(const side of[-1,1]){
   ring(side*3.1,side*(1.1+shift),2.0,.38,null,'valve');
   poly([[-1.6,-.22],[1.65,-.22],[1.65,.24],[-1.6,.24]],side*3.1,side*(1.1+shift),side*.55,.65,{turn:side*.16},'valve-flap');
  }
 }else if(family==='excavation-drill'){
  hub(.85);
  for(let k=0;k<3;k++)poly([[.65,-.25],[3,-.6],[4.5,-1.0],[6.5,-.65],[6.75,.15],[5.6,.4],[5.4,.85],[4.5,.62],[4.1,1.0],[3.1,.55],[.65,.28]],0,0,k*TAU/3+shift,.85,spin(.16),'cutter');
  ring(0,0,6.5,.22,null,'housing');
 }else if(family==='mining-claws'){
  for(let k=0;k<3;k++){
   const a=k*TAU/3+variant*.2;
   poly([[-1.45,-.8],[-.7,-1.0],[1.4,-.7],[1.7,-.15],[1.2,.10],[1.65,.45],[.9,.85],[-.7,.85],[-1.45,.45]],Math.cos(a)*4.7,Math.sin(a)*4.7,a+Math.PI,.95,{rock:.78,phase:k*.65},'claw');
  }
  ring(0,0,6.25,.25,null,'housing');
 }
 if(!out.length)throw Error('Unknown hazard family '+family);return out;
}
export function familySpecifications(course,length){
 const families=HAZARD_FAMILIES[course];if(!families)throw Error('Unknown course '+course);
 const out=[],order=[0,1,2,0,2,1];
 // Short phrases alternate decisions, linked pairs and a longer reset. The
 // final act tightens the spacing gently, never spawning overlapping gates.
 const beats=[142,128,166,130,205,146,124,176,138,222];
 for(let i=0,s=190;s<length-270;i++){
  const bounds=course>=4?[.25,.5,.75]:course===2?[.2,.5,.78]:course===3?[.2,.48,.76]:[.18,.47,.76];
  const theme=1+bounds.filter(b=>s/length>=b).length,family=families[order[(i+theme-1)%order.length]],variant=(Math.floor(i/3)+theme)%3;
  const forceDodge=i>1&&[0,3,6,8].includes(i%10),orientation=[0,.32,-.32,Math.PI/2,.22,-Math.PI/2][Math.floor(i/2)%6];
  out.push({id:i,s,kind:family,family,course,theme,variant,orientation,forceDodge,solids:familySolids(course,family,variant),seed:i*.731,spin:(i%2?1:-1)*.14,revision:157});
  s+=i<3?[188,168,156][i]:beats[(i-3)%beats.length]*(s/length>.72?.92:1);
 }
 return out;
}
export function actuationPeriod(family){return family==='forge-press'?5.4:family==='furnace-shutters'?6.2:6.8;}
export function familyState(o,time){
 const clock=time+o.seed,period=actuationPeriod(o.family);
 // A smooth dwell at each end of a cycle makes direction changes readable.
 const cycle=phase=>{const v=.5-.5*Math.cos(clock*TAU/period+phase);return v*v*(3-2*v);};
 let x=0,y=0,a=0;
 if(o.forceDodge){const axis=(Math.floor(o.id/3)%4)*Math.PI/2,offset=o.family==='root-arch'?4.35:o.family==='discharge-gate'?3.7:/segments/.test(o.family)?3.05:/press/.test(o.family)?2.1:2.8;x=Math.cos(axis)*offset;y=Math.sin(axis)*offset;}
 else if(/segments|gate|arch|machinery/.test(o.family)){x=Math.sin(clock*.16)*.35;y=Math.cos(clock*.13)*.25;}
 if(/vanes|rotor|turbine|wheel|drill|assembly/.test(o.family))a=o.variant*.18+(o.orientation||0);
 else a=(o.orientation||0)+Math.sin(clock*.12)*.055;
 const pieces=new Float64Array(o.solids.length*6);
 for(let i=0;i<o.solids.length;i++){
  const p=o.solids[i],d=p.drive,travel=d?cycle(d.phase||0):0,angularSpeed=(d?.turn||0)*(1.8+o.variant*.18),angle=(p.a||0)+angularSpeed*clock+(d?.rock||0)*(2*travel-1),j=i*6;
  pieces[j]=(p.x||0)+(d?.x||0)*travel;pieces[j+1]=(p.y||0)+(d?.y||0)*travel;pieces[j+2]=p.z||0;pieces[j+3]=angle;pieces[j+4]=Math.cos(angle);pieces[j+5]=Math.sin(angle);
 }
 return {x,y,a,scale:1,pieces,cycle:cycle(0)};
}
