import * as THREE from 'three';

// V126: phase-two surface equipment. Everything follows an existing obstacle
// motion group but NEVER participates in its shared physics/collider data.
// Two instanced draw calls per hazard, with conservative 7 m radial culling.
// Geometry interpenetrates the parent hazard face slightly to prevent floating
// fittings; no tunnel-mounted surfaces, transparent planes or post-processing.
const THEMES={
 1:{name:'ECLIPSE / machined airframe alloy',paint:0x7c9fb4,accent:0x65e5ff,roughness:.36,metalness:.83},
 2:{name:'LEVIATHAN / pressure ceramic',paint:0x567d83,accent:0x57dabc,roughness:.66,metalness:.55},
 3:{name:'CINDER / heat-scored foundry',paint:0x79625d,accent:0xff9756,roughness:.77,metalness:.75},
 4:{name:'TEMPEST / storm-proof titanium',paint:0x91a4b8,accent:0x87beff,roughness:.42,metalness:.82},
 5:{name:'VERDANT / oxidized bio-alloy',paint:0x657c68,accent:0x8bdc9b,roughness:.82,metalness:.35},
 6:{name:'FRACTURE / crystallized armour',paint:0x77728f,accent:0xc79bff,roughness:.39,metalness:.75}
};
const TAU=Math.PI*2,MAX_RADIAL=6.9;
const finite=n=>Number.isFinite(n);
export function installObstacleBodywork(obstacle,quality='auto'){
 const theme=THEMES[obstacle.course]||THEMES[1],low=quality==='low';
 const metal=[],light=[],q=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3(),matrix=new THREE.Matrix4();
 const metalMaterial=new THREE.MeshStandardMaterial({
  color:theme.paint,metalness:theme.metalness,roughness:theme.roughness,
  emissive:obstacle.course===3?0x271008:0x050b0d,emissiveIntensity:.24,
  side:THREE.FrontSide
 });
 const trimMaterial=new THREE.MeshBasicMaterial({
  color:theme.accent,toneMapped:false,depthTest:true,depthWrite:true,
  side:THREE.FrontSide
 });
 const place=(dest,x,y,z,w,h,d,angle=0)=>{
  if(![x,y,z,w,h,d,angle].every(finite)||w<=0||h<=0||d<=0)return;
  // Decorative hardware never projects beyond the usable cylinder. This
  // deliberately rejects outer-wall fittings rather than clipping in shaders.
  if(Math.hypot(x,y)+Math.hypot(w,h)*.5>=MAX_RADIAL)return;
  position.set(x,y,z);q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP.clone().set(0,0,1),angle);
  scale.set(w,h,d);matrix.compose(position,q,scale);
  dest.push(matrix.clone());
 };
 const fitting=(dest,p,localX,localY,z,w,h,d)=>{
  const a=p.a||0,ca=Math.cos(a),sa=Math.sin(a);
  place(dest,(p.x||0)+ca*localX-sa*localY,(p.y||0)+sa*localX+ca*localY,z,w,h,d,a);
 };
 const addBox=p=>{
  // Hinges stay on an existing solid face; large shutters get their fittings
  // along the inward edge rather than in the outer tunnel wall.
  const inset=Math.min(p.hx*.72,1.65);
  const edgeX=(p.x||0)<0?inset:-inset;
  const z=p.hz+.038;
  const isPlate=p.hy>.7,spacing=isPlate?Math.min(2.65,p.hy*.55):0;
  const positions=isPlate?(low?[0]:[-spacing,0,spacing]):[0];
  for(const y of positions){
   fitting(metal,p,edgeX,y,z,.19,Math.min(p.hy*.66,.92),.135);
   fitting(light,p,edgeX+((p.x||0)<0?.13:-.13),y,z+.074,.055,Math.min(p.hy*.55,.75),.047);
  }
  if(!low&&p.hy>.4){
   const z2=p.hz+.035;
   for(const y of[-p.hy*.62,p.hy*.62]){
    fitting(metal,p,edgeX*.63,y,z2,.12,.13,.16);
    fitting(light,p,edgeX*.63,y,z2+.085,.06,.055,.042);
   }
  }
 };
 const addRing=p=>{
  // Tiny machined studs sit on the solid torus tube, never across its hole.
  const n=low?4:8;
  for(let k=0;k<n;k++){
   const a=(k+.5)*TAU/n,rr=p.R,xx=(p.x||0)+Math.cos(a)*rr,yy=(p.y||0)+Math.sin(a)*rr;
   const z=p.tube*.67;
   place(metal,xx,yy,z,Math.min(.23,p.tube*.35),Math.min(.21,p.tube*.35),.13,a);
   if(!low&&k%2===0)place(light,xx,yy,z+.10,.075,.075,.06,a);
  }
 };
 const addPolygon=p=>{
  const pts=p.points||[],n=pts.length,step=Math.max(1,Math.floor(n/(low?6:12)));
  for(let i=0;i<n;i+=step){
   const pt=pts[i],x=pt[0],y=pt[1],r=Math.hypot(x,y);
   if(r<.35||r>6.91)continue;
   const toward=(r>4.6?-.23:.23)/r,px=x+x*toward,py=y+y*toward;
   place(metal,px,py,p.hz+.045,.14,.15,.15,Math.atan2(y,x));
   if(!low&&i%(step*2)===0)place(light,px,py,p.hz+.136,.067,.075,.045,Math.atan2(y,x));
  }
 };
 const addSphere=p=>{
  // A lit machined axle cap conveys rotation without putting a bar into
  // the clear fly-through area.
  if(p.r>.8||Math.hypot(p.x||0,p.y||0)>4.5)return;
  const z=p.r+.03;
  for(const a of[0,Math.PI/2,Math.PI,Math.PI*1.5]){
   const x=(p.x||0)+Math.cos(a)*p.r*.28,y=(p.y||0)+Math.sin(a)*p.r*.28;
   place(metal,x,y,z,.17,.17,.12,a);
   if(!low)place(light,x,y,z+.075,.075,.075,.045,a);
  }
 };
 for(const p of obstacle.solids){
  if(p.type==='box')addBox(p);
  else if(p.type==='torus')addRing(p);
  else if(p.type==='polygon')addPolygon(p);
  else if(p.type==='sphere')addSphere(p);
 }
 const add=(matrices,material,name)=>{
  if(!matrices.length){material.dispose();return null}
  const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,matrices.length);
  for(let i=0;i<matrices.length;i++)mesh.setMatrixAt(i,matrices[i]);
  mesh.instanceMatrix.needsUpdate=true;
  mesh.frustumCulled=false; // Parent group follows its moving gameplay bounds.
  mesh.castShadow=false;mesh.receiveShadow=false;
  mesh.name=name;mesh.userData.obstacleDecoration=true;
  obstacle.motion.add(mesh);return mesh;
 };
 const solid=add(metal,metalMaterial,'V126 / forged mountings');
 const lights=add(light,trimMaterial,'V126 / hazard indicator pins');
 if(lights)obstacle.trim.push(trimMaterial);
 obstacle.bodywork={course:obstacle.course,name:theme.name,metal:metal.length,lit:light.length,low,meshes:[solid,lights].filter(Boolean)};
 return obstacle.bodywork;
}
export function inspectObstacleBodywork(obstacle){return obstacle.bodywork?{
 kind:obstacle.kind,course:obstacle.course,metal:obstacle.bodywork.metal,
 lit:obstacle.bodywork.lit,low:obstacle.bodywork.low,
 parts:obstacle.bodywork.meshes.length
}:null}
