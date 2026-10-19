import {familySpecifications,familyState} from './hazard-families-v156.js?v=175';
import{expansionSpecifications,expansionState}from'./expansion-courses.js?v=67';
import{cinderSpecifications,cinderState,cinderShift}from'./cinder-colliders.js?v=67';
const TAU=Math.PI*2,torus=(x,y,R,tube)=>({type:'torus',x,y,R,tube}),box=(x,y,hx,hy,a=0)=>({type:'box',x,y,hx,hy,hz:.35,a}),sphere=(x,y,r)=>({type:'sphere',x,y,r});
const section=(s,length)=>s/length<.18?1:s/length<.47?2:s/length<.76?3:4;
const shiftState=time=>({amount:cinderShift(time)});
const poly=(points,hz=.6)=>({type:'polygon',points,hz});
function arc(inner,outer,start,end){const p=[],n=64;for(let i=0;i<=n;i++){const a=start+(end-start)*i/n;p.push([Math.cos(a)*outer,Math.sin(a)*outer])}for(let i=n;i>=0;i--){const a=start+(end-start)*i/n;p.push([Math.cos(a)*inner,Math.sin(a)*inner])}return p}
export function seaSpecifications(length){const specs=[];for(let i=0,s=220;s<length-340;i++,s+=s/length<.2?160:s/length<.5?140:s/length<.78?145:125){const zone=s/length,theme=zone<.2?1:zone<.5?2:zone<.78?3:4,order=[null,['pressure','turbine','pressure','portals'],['reef','portals','reef','turbine'],['portals','turbine','pressure','portals'],['pressure','turbine','portals','turbine']][theme],kind=i%4===0?'pressure':order[i%4],solids=[];
if(kind==='pressure'){solids.push(poly([[-7,-7],[-2.1,-7],[-2.1,-4.5],[-2.5,-3.8],[-2.3,3.5],[-1.9,4.3],[-1.9,7],[-7,7]],.8),poly([[7,-7],[2.1,-7],[2.1,-4.5],[2.5,-3.8],[2.3,3.5],[1.9,4.3],[1.9,7],[7,7]],.8),poly([[-2.3,7],[-2.3,4.5],[2.3,4.5],[2.3,7]],.8),poly([[-2.3,-7],[2.3,-7],[2.3,-4.5],[-2.3,-4.5]],.8))}
if(kind==='turbine'){solids.push({type:'sphere',x:0,y:0,r:.65});for(let k=0;k<4;k++){const angle=k*TAU/4,points=[[.6,-.17],[3.2,-.2],[6.8,-.43],[6.8,.2],[3.4,.43],[.6,.26]].map(([x,y])=>[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)]);solids.push(poly(points,.38))}}
if(kind==='reef')solids.push(poly(arc(2.6,6.7,.12,TAU-.6),.85));
if(kind==='portals'){solids.push({type:'torus',x:-3.3,y:1.05,R:1.7,tube:.22},{type:'torus',x:3.3,y:-1.05,R:1.7,tube:.22},poly([[-1.35,-7],[1.35,-7],[1.35,7],[-1.35,7]],.6))}
specs.push({id:i,s,kind,solids,seed:i*.731,spin:(i%2?1:-1)*(.29+theme*.03),course:2,theme,forceDodge:i%4===0})}return specs}
export function seaState(o,time){const t=time+o.seed,tide=shiftState(time).amount;let x=0,y=0,a=0,scale=1;if(o.kind==='pressure'){x=Math.sin(t*.31)*.9;y=Math.sin(t*.23)*.4;a=Math.sin(t*.18)*.1+tide*.18}else if(o.kind==='turbine')a=o.seed+time*o.spin+tide*.3;else if(o.kind==='reef'){x=Math.sin(t*.37)*1.4;y=Math.cos(t*.29)*1;a=o.seed+Math.sin(t*.2)*.15+tide*.25}else if(o.kind==='portals'){a=Math.sin(t*.23)*.23+tide*.24}return{x,y,a,scale}}

const polygonEdges=new WeakMap();
export function polygonSector(inner,outer,start,end){const points=[];const n=Math.ceil((end-start)/.12);for(let i=0;i<=n;i++){const a=start+(end-start)*i/n;points.push([Math.cos(a)*outer,Math.sin(a)*outer])}for(let i=n;i>=0;i--){const a=start+(end-start)*i/n;points.push([Math.cos(a)*inner,Math.sin(a)*inner])}return points;}
function legacySpecifications(course,length){if(course>=4)return expansionSpecifications(course,length);if(course===3)return cinderSpecifications(length);if(course===2)return seaSpecifications(length);const specs=[];for(let i=0,s=210;s<length-150;i++,s+=section(s,length)===1?145:section(s,length)===2?125:section(s,length)===3?115:105){const theme=section(s,length),themed=[null,['rotor','shutter','iris','rotor'],['rings','sector','rings','iris'],['sector','rings','iris','rings'],['iris','rotor','sector','iris']][theme],kind=i%4===0?'shutter':course===2?['rings','shutter','iris','sector'][i%4]:themed[i%themed.length],solids=[];if(kind==='iris')solids.push(torus(0,0,4.35,2.1));if(kind==='rings'){for(let k=0;k<3;k++){const a=k*TAU/3+.3;solids.push(torus(Math.cos(a)*3.55,Math.sin(a)*3.55,1.6,.2))}}if(kind==='rotor'){solids.push(sphere(0,0,.58));for(let k=0;k<3;k++)solids.push(box(Math.cos(k*TAU/3)*3.25,Math.sin(k*TAU/3)*3.25,2.65,.29,k*TAU/3))}if(kind==='shutter'){solids.push(box(-5,0,3.4,8),box(5,0,3.4,8))}if(kind==='slalom'){solids.push(sphere(-2.65,1.3,1.45),sphere(2.65,-1.3,1.45),torus(0,0,2.0,.15))}if(kind==='sector'){const gap=1.16;solids.push({type:'polygon',points:polygonSector(.82,6.9,gap/2,TAU-gap/2),hz:.32})}specs.push({id:i,s,kind,solids,seed:i*.731,spin:(i%2?1:-1)*(.32+theme*.035),course,theme,forceDodge:i%4===0});}return specs;}
export function obstacleState(o,time,out){if(o.family)return familyState(o,time,out);if(o.forceDodge){const a=(Math.floor(o.id/4)%4)*Math.PI/2+Math.sin(time*.2+o.seed)*.08+shiftState(time).amount*.12,d=o.course===6?4.1:3.2+Math.sin(time*.3+o.seed)*.1,axis=o.course===6?a+Math.PI/2:a;return{x:Math.cos(axis)*d,y:Math.sin(axis)*d,a,scale:1}}if(o.course>=4)return expansionState(o,time);if(o.course===3)return cinderState(o,time);if(o.course===2)return seaState(o,time);const t=time+o.seed,kind=o.kind;let x=0,y=0,a=o.seed,scale=1;if(kind==='iris'){x=Math.sin(t*.49)*1.75;y=Math.cos(t*.41)*1.4;scale=1}else if(kind==='rings'){a+=Math.sin(t*.35)*.35}else if(kind==='rotor')a+=time*o.spin;else if(kind==='shutter'){x=Math.sin(t*.38)*1.55;a+=Math.sin(t*.21)*.3}else if(kind==='sector')a+=Math.sin(t*.32)*.7;else if(kind==='slalom'){a+=Math.sin(t*.25)*.25}const shift=shiftState(time).amount;a+=shift*(o.theme===3?.6:.38);if(kind==='iris'){x+=shift*.35;y-=shift*.25}if(kind==='rings')scale=1-shift*.04;return{x,y,a,scale};}
function polygonDistance(points,x,y){let edges=polygonEdges.get(points);if(!edges){edges=new Float64Array(points.length*5);for(let i=0,j=points.length-1;i<points.length;j=i++){const[ax,ay]=points[i],[bx,by]=points[j],vx=bx-ax,vy=by-ay,k=i*5;edges.set([ax,ay,vx,vy,vx*vx+vy*vy],k)}polygonEdges.set(points,edges)}let d=Infinity,inside=false;for(let i=0;i<edges.length;i+=5){const ax=edges[i],ay=edges[i+1],vx=edges[i+2],vy=edges[i+3],k=Math.max(0,Math.min(1,((x-ax)*vx+(y-ay)*vy)/edges[i+4])),dx=x-ax-vx*k,dy=y-ay-vy*k;d=Math.min(d,dx*dx+dy*dy);if((ay>y)!==(ay+vy>y)&&x<vx*(y-ay)/vy+ax)inside=!inside}return (inside?-1:1)*Math.sqrt(d);}
function geometryDistance(p,x,y,z){
 if(p.type==='torus')return Math.hypot(Math.hypot(x,y)-p.R,z)-p.tube;
 if(p.type==='arc'){
  const angle=Math.atan2(y,x),rel=((angle-p.start)%TAU+TAU)%TAU,span=p.end-p.start;
  if(rel<=span)return Math.hypot(Math.hypot(x,y)-p.R,z)-p.tube;
  return Math.min(Math.hypot(x-Math.cos(p.start)*p.R,y-Math.sin(p.start)*p.R,z),Math.hypot(x-Math.cos(p.end)*p.R,y-Math.sin(p.end)*p.R,z))-p.tube;
 }
 if(p.type==='sphere')return Math.hypot(x,y,z)-p.r;
 if(p.type==='box'){const qx=Math.abs(x)-p.hx,qy=Math.abs(y)-p.hy,qz=Math.abs(z)-p.hz;return Math.hypot(Math.max(0,qx),Math.max(0,qy),Math.max(0,qz))+Math.min(Math.max(qx,qy,qz),0);}
 const d=polygonDistance(p.points,x,y),dz=Math.abs(z)-p.hz;return Math.hypot(Math.max(0,d),Math.max(0,dz))+Math.min(Math.max(d,dz),0);
}
export function solidDistance(p,x,y,z){
 x-=p.x||0;y-=p.y||0;z-=p.z||0;
 if(p.a){const c=Math.cos(p.a),s=Math.sin(p.a),t=x*c+y*s;y=-x*s+y*c;x=t;}
 return geometryDistance(p,x,y,z);
}
export function localDistance(o,state,x,y,z){
 if(state.cachedAngle!==state.a){state.cachedAngle=state.a;state.cosAngle=Math.cos(state.a);state.sinAngle=Math.sin(state.a);}
 const c=state.cosAngle,s=state.sinAngle,dx=x-state.x,dy=y-state.y,rx=(dx*c+dy*s)/state.scale,ry=(-dx*s+dy*c)/state.scale,rz=z/state.scale;let distance=Infinity;
 for(let i=0;i<o.solids.length;i++){
  const p=o.solids[i];let d;
  if(state.pieces){const j=i*6,part=state.pieces,px=rx-part[j],py=ry-part[j+1];d=geometryDistance(p,px*part[j+4]+py*part[j+5],-px*part[j+5]+py*part[j+4],rz-part[j+2]);}
  else d=solidDistance(p,rx,ry,rz);
  distance=Math.min(distance,d);
 }
 return distance*state.scale;
}
export const obstacleDistance=(o,time,x,y,z=0)=>localDistance(o,obstacleState(o,time),x,y,z);

export function specifications(course,length){return familySpecifications(course,length);}
