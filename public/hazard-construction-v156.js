import * as THREE from 'three';
import {bevelBox} from './art-direction-v148.js?v=153';
import {solidDistance} from './course-colliders.js?v=156';
// Surface equipment is baked into the solid draw, not added as dozens of
// separate meshes. The authored collider remains the primary silhouette.
function combine(parts){
 const pos=[],normal=[],uv=[],colour=[],index=[];
 for(const [g,tint=1] of parts){
  const offset=pos.length/3,a=g.attributes;
  pos.push(...a.position.array);normal.push(...a.normal.array);
  const c=typeof tint==='number'?[tint,tint,tint]:tint;
  for(let i=0;i<a.position.count;i++){uv.push(a.uv?.getX(i)||0,a.uv?.getY(i)||0);colour.push(...c);}
  if(g.index)for(const i of g.index.array)index.push(offset+i);else for(let i=0;i<a.position.count;i++)index.push(offset+i);
  g.dispose();
 }
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));out.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));out.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));out.setAttribute('color',new THREE.Float32BufferAttribute(colour,3));out.setIndex(index);out.computeBoundingBox();out.computeBoundingSphere();return out;
}
export function hazardGeometry(p,course,quality='auto'){
 let base;
 if(p.type==='box')base=bevelBox(p.hx*2,p.hy*2,p.hz*2,Math.min(.10,p.hx*.16,p.hy*.16));
 else if(p.type==='torus')base=new THREE.TorusGeometry(p.R,p.tube,20,96);
 else if(p.type==='sphere')base=new THREE.SphereGeometry(p.r,32,20);
 else if(p.type==='arc'){
  base=new THREE.TorusGeometry(p.R,p.tube,16,Math.ceil((p.end-p.start)*22),p.end-p.start);base.rotateZ(p.start);
 }else{
  const s=new THREE.Shape();p.points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();base=new THREE.ExtrudeGeometry(s,{depth:p.hz*2,bevelEnabled:false,steps:1});base.translate(0,0,-p.hz);
 }
 const parts=[[base,1]],local={...p,x:0,y:0,z:0,a:0};
 const addBox=(x,y,z,w,h,d,tint=.3)=>{const g=bevelBox(w,h,d,.035);g.translate(x,y,z);parts.push([g,tint]);};
 if(p.type==='arc'){
  // Rounded living root ends are also the spherical end caps in the shared SDF.
  for(const a of [p.start,p.end]){const cap=new THREE.SphereGeometry(p.tube,16,12);cap.translate(Math.cos(a)*p.R,Math.sin(a)*p.R,0);parts.push([cap,1]);}
 }else if(p.type==='box'||p.type==='polygon'){
  base.computeBoundingBox();const b=base.boundingBox,wide=b.max.x-b.min.x,tall=b.max.y-b.min.y,thin=Math.min(wide,tall)<1.3;
  const w=thin?Math.min(wide*.45,1.2):Math.min(wide*.45,1.8),h=thin?Math.min(tall*.40,.22):Math.min(tall*.40,.80),z=p.hz+.025;
  const candidates=[];
  for(let y=b.min.y+h*.7;y<=b.max.y-h*.7;y+=Math.max(h*2.2,1.2))for(let x=b.min.x+w*.7;x<=b.max.x-w*.7;x+=Math.max(w*1.8,1.5)){
   let fit=true;for(const dx of[-w*.55,w*.55])for(const dy of[-h*.7,h*.7])if(solidDistance(local,x+dx,y+dy,0)>-.045)fit=false;
   if(fit)candidates.push({x,y,rank:Math.hypot(x,y)});
  }
  candidates.sort((a,b)=>a.rank-b.rank);
  for(const {x,y}of candidates.slice(0,quality==='low'?1:3)){
   // Dark inset, raised rails and steel fastening blocks give the face depth.
   addBox(x,y,z,w,h,.045,p.role==='root'?[.30,.34,.23]:.27);
   for(const side of[-1,1]){
    addBox(x,y+side*h*.51,z+.035,w*1.03,.055,.07,.91);
    addBox(x+side*w*.42,y,z+.055,.09,h*.78,.09,1.10);
   }
   if(!thin&&quality!=='low'){
    // Telescopic cylinder and stepped collars are contained by this face patch.
    const barrel=new THREE.CylinderGeometry(.075,.075,w*.68,10);barrel.rotateZ(Math.PI/2);barrel.translate(x,y,z+.10);parts.push([barrel,.78]);
    for(const side of[-1,1]){const collar=new THREE.CylinderGeometry(.10,.10,w*.12,10);collar.rotateZ(Math.PI/2);collar.translate(x+side*w*.30,y,z+.10);parts.push([collar,1.12]);}
   }
  }
 }else if(p.type==='torus'){
  const n=quality==='low'?6:12;
  for(let i=0;i<n;i++){
   const a=i*Math.PI*2/n,g=bevelBox(Math.min(.48,p.tube*.8),Math.min(.26,p.tube*.5),.10,.025);g.translate(p.R,0,p.tube*.97);g.rotateZ(a);parts.push([g,i%3?.34:.93]);
  }
 }
 const g=combine(parts);g.userData.machine156=true;g.name='V156 / '+(p.role||p.type)+' / layered construction';return g;
}
