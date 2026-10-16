import * as THREE from 'three';
// Fixed particle pools: impacts never allocate geometry during a race.
// Distinct collision flashes per racing world, reusing the original GPU pools.
const IMPACT_PALETTE={
 1:{a:0xc9f3ff,b:0xffa85f,shard:0x7f9cab},
 2:{a:0x8de9e0,b:0x61c7a7,shard:0x709996},
 3:{a:0xffd38d,b:0xff6f37,shard:0x70514a},
 4:{a:0xbde9ff,b:0x7caeff,shard:0x899db0},
 5:{a:0xb7ffc1,b:0x78d4ac,shard:0x778a75},
 6:{a:0xe2cbff,b:0xa992ff,shard:0x73758c}
};

export function createImpacts(scene){
 const slots=[],dummy=new THREE.Object3D(),shardGeo=new THREE.BoxGeometry(.07,.025,.12);
 for(let k=0;k<8;k++){const p=new Float32Array(48*3),colors=new Float32Array(48*3),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));const material=new THREE.PointsMaterial({vertexColors:true,size:.085,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending});const sparks=new THREE.Points(geo,material);sparks.frustumCulled=false;const shards=new THREE.InstancedMesh(shardGeo,new THREE.MeshStandardMaterial({color:0x8aa7b7,roughness:.7,metalness:.65,transparent:true,depthWrite:false}),12);shards.frustumCulled=false;sparks.visible=shards.visible=false;scene.add(sparks,shards);slots.push({sparks,shards,p,colors,particles:Array.from({length:48},()=>new THREE.Vector3()),started:-10,origin:new THREE.Vector3()})}
 return{slots,dummy,scratch:new THREE.Vector3(),color:new THREE.Color(),next:0};
}
export function burstImpact(pool,position,frame,time,underwater=false,course=underwater?2:1){
 const slot=pool.slots[pool.next++%pool.slots.length],palette=IMPACT_PALETTE[course]||IMPACT_PALETTE[1];
 slot.started=time;slot.course=course;slot.origin.copy(position);
 slot.shards.material.color.setHex(palette.shard);
 slot.sparks.material.size=course===2?.105:course===3?.1:.085;
 for(let i=0;i<48;i++){
  const a=i*2.399963,r=1+(i%7)*.36,v=slot.particles[i].copy(frame.r).multiplyScalar(Math.cos(a)*r).addScaledVector(frame.u,Math.sin(a)*r).addScaledVector(frame.f,-2-(i%5));
  const color=pool.color.setHex((i%3===0)?palette.b:palette.a);
  slot.colors.set([color.r*2,color.g*2,color.b*2],i*3);
  slot.p.set([position.x,position.y,position.z],i*3);
 }
 slot.sparks.geometry.attributes.color.needsUpdate=true;
 slot.sparks.visible=slot.shards.visible=true;
}
export function updateImpacts(pool,time){for(const s of pool.slots){const age=Math.max(0,time-s.started);s.sparks.visible=s.shards.visible=age<1.25;if(age>=1.25)continue;const drag=(1-Math.exp(-age*2.4))/2.4;for(let i=0;i<48;i++){const p=pool.scratch.copy(s.origin).addScaledVector(s.particles[i],drag);p.y-=age*age*.6;s.p.set([p.x,p.y,p.z],i*3);if(i<12){pool.dummy.position.copy(p);pool.dummy.rotation.set(age*(i%3+2),age*(i%5+1),age*(i%4+1));pool.dummy.scale.setScalar(Math.max(.05,1-age*.4));pool.dummy.updateMatrix();s.shards.setMatrixAt(i,pool.dummy.matrix)}}s.sparks.geometry.attributes.position.needsUpdate=true;s.shards.instanceMatrix.needsUpdate=true;s.sparks.material.opacity=Math.pow(1-age/1.25,2);s.shards.material.opacity=1-age/1.25;}}
export function impactPose(ship,time,started,reduced=false){const age=time-started;if(age<0||age>=1)return;const kick=Math.sin(Math.min(1,age/.32)*Math.PI)*Math.exp(-age*2);ship.rotateZ(kick*(reduced?.05:.4));ship.rotateX(kick*(reduced?.02:.12));ship.scale.setScalar(.9*(age>.72?THREE.MathUtils.smoothstep(age,.72,1):1));}
export function disposeImpacts(scene,pool){const geometries=new Set();for(const s of pool.slots){scene.remove(s.sparks,s.shards);geometries.add(s.sparks.geometry);geometries.add(s.shards.geometry);s.sparks.material.dispose();s.shards.material.dispose()}for(const g of geometries)g.dispose();}
