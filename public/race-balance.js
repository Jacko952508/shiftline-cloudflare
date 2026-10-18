import{obstacleState,localDistance}from'./course-colliders.js?v=157';
const errorRates=[.015,.025,.035,.045,.055,.07,.085];
function roll(id,gate,course){let n=Math.imul(id+11,374761393)^Math.imul(gate+17,668265263)^Math.imul(course+3,1274126177);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
// A late, imperfect line creates a real collision opportunity. It never awards
// a scripted crash or teleports a racer into an obstacle.
export function imperfectLine(o,at,line,id,mistakes=1){
 if(roll(id,o.id,o.course)>=errorRates[id%7]*mistakes)return null;
 const state=obstacleState(o,at);let best=null,cost=Infinity;
 for(const radius of[.65,1.1,1.65,2.2])for(let k=0;k<16;k++){
  const a=k*Math.PI/8,x=line.x+Math.cos(a)*radius,y=line.y+Math.sin(a)*radius;
  if(Math.hypot(x,y)>6.1)continue;
  const d=localDistance(o,state,x,y,0);
  if(d<-.3||d>.35)continue;
  const score=radius+Math.abs(d-.08)*2;
  if(score<cost){best={x,y,clearance:.3};cost=score;}
 }
 return best;
}
export function ringAtCrossing(o,time,x,y){
 const st=obstacleState(o,time),c=Math.cos(st.a),s=Math.sin(st.a),dx=x-st.x,dy=y-st.y,px=(dx*c+dy*s)/st.scale,py=(-dx*s+dy*c)/st.scale;
 let aperture=Infinity;
 for(const p of o.solids)if(p.type==='torus'){
  const inner=(p.R-p.tube)*st.scale;
  if(Math.hypot(px-p.x,py-p.y)*st.scale<inner-.3)aperture=Math.min(aperture,inner);
 }
 return Number.isFinite(aperture)?aperture:null;
}
export function passReward(ring,gap,forcedDodge=false){const base=6,extra=ring!==null&&ring!==undefined?(ring<2.05?18:10):gap>=0&&gap<=.55?8:0;return{amount:base+extra+(forcedDodge?4:0),label:ring!==null&&ring!==undefined?(ring<2.05?'TIGHT RING':'RING THREAD'):extra?'NEAR MISS':forcedDodge?'DODGE CLEAR':'CLEAN PASS'};}
