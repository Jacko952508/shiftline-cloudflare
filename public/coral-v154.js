import * as THREE from 'three';
// Opaque, reusable reef colonies: tapering skeletons, an open sea-fan lattice
// and scalloped shelves. Vertex colours keep living tissue and pale growing
// tips readable in blue water without emissive lights or transparent planes.
function builder(){
 const p=[],ix=[],col=[];
 const color=(hex)=>new THREE.Color(hex);
 function vertex(v,c){const i=p.length/3;p.push(v.x,v.y,v.z);col.push(c.r,c.g,c.b);return i;}
 function limb(points,radius,hex,tip=0xffdfba,sides=5){
  const base=p.length/3,a=color(hex),b=color(tip),up=new THREE.Vector3(0,1,0),axis=new THREE.Vector3(),u=new THREE.Vector3(),v=new THREE.Vector3();
  for(let i=0;i<points.length;i++){
   axis.subVectors(points[Math.min(i+1,points.length-1)],points[Math.max(i-1,0)]).normalize();
   u.crossVectors(axis,Math.abs(axis.y)>.9?new THREE.Vector3(1,0,0):up).normalize();v.crossVectors(axis,u).normalize();
   const t=i/(points.length-1),r=radius*(.12+.88*(1-t)**.7),c=a.clone().lerp(b,THREE.MathUtils.smoothstep(t,.63,1));
   for(let k=0;k<sides;k++){const angle=k/sides*Math.PI*2;vertex(points[i].clone().addScaledVector(u,Math.cos(angle)*r).addScaledVector(v,Math.sin(angle)*r),c);}
  }
  for(let i=0;i<points.length-1;i++)for(let k=0;k<sides;k++){const a=base+i*sides+k,b=base+i*sides+(k+1)%sides,c=a+sides,d=b+sides;ix.push(a,b,c,b,d,c);}
  const end=vertex(points.at(-1),b);for(let k=0;k<sides;k++)ix.push(end,base+(points.length-1)*sides+k,base+(points.length-1)*sides+(k+1)%sides);
 }
 function plate(cx,cy,cz,radius,phase,hex){
  const base=p.length/3,n=28,rings=3,c=color(hex),edge=color(0xf6cf9d);
  // Upper and lower skins share an irregular outline, with a rolled living rim.
  for(let side=0;side<2;side++)for(let j=0;j<=rings;j++)for(let k=0;k<n;k++){
   const a=k/n*Math.PI*2,t=j/rings,r=radius*t*(1+.08*Math.sin(a*7+phase)+.035*Math.cos(a*11-phase));
   const y=cy+.11*t*t+.025*Math.sin(a*8+phase)*t+(side?-.055:0)+.025*Math.sin(a*14)*t;
   vertex(new THREE.Vector3(cx+Math.cos(a)*r,y,cz+Math.sin(a)*r*.78),c.clone().lerp(edge,t>.92?.60:.12*t));
  }
  const skin=(rings+1)*n;
  for(let side=0;side<2;side++)for(let j=0;j<rings;j++)for(let k=0;k<n;k++){
   const a=base+side*skin+j*n+k,b=base+side*skin+j*n+(k+1)%n,c=a+n,d=b+n;
   if(side)ix.push(a,c,b,b,c,d);else ix.push(a,b,c,b,d,c);
  }
  for(let k=0;k<n;k++){const a=base+rings*n+k,b=base+rings*n+(k+1)%n;ix.push(a,b,a+skin,b,b+skin,a+skin);}
 }
 function finish(name){
  const g=new THREE.BufferGeometry();g.name=name;g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();g.userData.coral154=true;return g;
 }
 return {limb,plate,finish};
}
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
export function staghornCoral(){
 const b=builder();b.limb([V(0,0,0),V(.025,.24,0),V(-.02,.48,.035),V(.04,.72,.02)],.083,0xe78459);
 for(let i=0;i<7;i++){
  const a=i*2.39996,y=.16+i*.065,dx=Math.cos(a),dz=Math.sin(a),r=.28+(i%3)*.045;
  const start=V(.01,y,.01),fork=V(dx*r*.65,y+.19,dz*r*.65),end=V(dx*r,y+.40,dz*r);
  b.limb([start,V(dx*r*.30,y+.07,dz*r*.3),fork,end],.047-i*.002,0xe78459);
  for(const side of[-1,1]){const ex=dx*r+Math.cos(a+side*.85)*.14,ez=dz*r+Math.sin(a+side*.85)*.14;b.limb([fork,V(ex*.8,y+.32,ez*.8),V(ex,y+.49,ez)],.022,0xea9163);}
 }
 return b.finish('Acropora / tapered staghorn colony');
}
export function fanAndPlateCoral(){
 const b=builder();
 b.limb([V(-.15,0,.1),V(-.18,.26,.11),V(-.13,.47,.1)],.045,0xb34d83,0xf6b1cf);
 const ends=[];
 for(let i=0;i<9;i++){
  const a=(i/8-.5)*2.5,tip=V(-.15+Math.sin(a)*.47,.26+Math.cos(a)*.64,.10+.035*Math.sin(i*1.7));ends.push(tip);
  const fork=V(-.15+Math.sin(a)*.25,.28+Math.cos(a)*.32,.1);
  b.limb([V(-.16,.20,.10),fork,tip],.018,0xbc528b,0xf6c2d9,4);
  if(i>0)for(const t of [.52,.75]){const prev=ends[i-1],p=V(-.15+(prev.x+.15)*t,.23+(prev.y-.23)*t,.10+(prev.z-.1)*t),q=V(-.15+(tip.x+.15)*t,.23+(tip.y-.23)*t,.10+(tip.z-.1)*t);b.limb([p,p.clone().lerp(q,.5).add(V(0,.025,0)),q],.008,0xc56a9d,0xd788b3,4);}
 }
 b.limb([V(.26,0,-.15),V(.27,.22,-.13),V(.25,.49,-.12)],.055,0xbb843f,0xe7bc78);
 b.plate(.25,.16,-.12,.36,0,0xd79a48);b.plate(.28,.34,-.13,.29,1.3,0xe2ac5c);b.plate(.23,.51,-.11,.22,2.7,0xedbe78);
 return b.finish('Gorgonian sea fan and Montipora shelf colony');
}
export function createCoralShapes(){return [staghornCoral(),fanAndPlateCoral()];}
