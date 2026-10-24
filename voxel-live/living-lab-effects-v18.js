// V18 Living Lab visualiser. Uses existing renderer, no second WebGL canvas.
export function createLivingEffects({T,world,state,land,sea,toX,toZ,terrainAt,sim}){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),group=new T.Group(),assets=new Set(),events=[],waves=[],particles=[];
 world.add(group);
 const keep=x=>{assets.add(x);return x};
 const mat=(c,e=0)=>keep(new T.MeshStandardMaterial({color:c,metalness:.25,roughness:.38,emissive:e,emissiveIntensity:e?.8:0}));
 const glow=(c,a=.8)=>keep(new T.MeshBasicMaterial({color:c,transparent:true,opacity:a,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));
 const stone=mat(0x554236,0x452010),lava=mat(0xff8538,0xc43a09),mint=mat(0x65ffe4,0x297e77),gem=mat(0xc293ff,0x6327af),leaf=mat(0x82cb72),metal=mat(0x9bcbce);
 const orb=keep(new T.SphereGeometry(1,12,8)),oct=keep(new T.OctahedronGeometry(1)),cone=keep(new T.ConeGeometry(1,2,6)),ring=keep(new T.RingGeometry(.92,1.08,48)),rod=keep(new T.CylinderGeometry(.2,.55,1,8));
 const tile=(x,y)=>state.tiles[clamp(Math.round(y),0,17)*24+clamp(Math.round(x),0,23)];
 const point=id=>{const s=state.sectors[id];return new T.Vector3(toX(s.x),terrainAt(s.x,s.y)+1,toZ(s.y))};
 const add=(geo,material,p,scale=1,parent=group)=>{const m=new T.Mesh(geo,material);m.position.copy(p);m.scale.setScalar(scale);parent.add(m);return m};
 const now=()=>performance.now()*.001,random=n=>{const a=Math.sin(n*63.71+45)*43758.545;return a-Math.floor(a)};
 let alive=true,lastSync=0,markerKey='';
 const effects=new T.Group();group.add(effects);
 const particleMesh=new T.InstancedMesh(orb,glow(0xffffff,.85),180);
 particleMesh.count=0;particleMesh.frustumCulled=false;group.add(particleMesh);
 const dummy=new T.Object3D(),color=new T.Color();
 function spray(p,n,hex,force=10,life=3,kind='spark'){
  const t=now();
  for(let i=0;i<n;i++){
   const a=random(i*13+t*97)*6.283,e=random(i*41+t)*2.6,v=force*(.3+random(i*39+t)*.7);
   particles.push({p:p.clone(),vel:new T.Vector3(Math.sin(e)*Math.cos(a)*v,Math.cos(e)*v+force*.4,Math.sin(e)*Math.sin(a)*v),
     born:t,life:life*(.65+random(i*29+t)*.5),col:new T.Color(hex),scale:.12+random(i*17+t)*.42,kind});
  }
  while(particles.length>180)particles.shift();
 }
 function wave(p,hex,duration=3){
  const m=add(ring,glow(hex,.8),p);m.rotation.x=-Math.PI/2;
  waves.push({m,start:now(),duration});
 }
 // Improved dynamic water in a single shader pass.
 const previousWater=sea.material;
 const water=keep(new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
  uniforms:{time:{value:0}},
  vertexShader:'uniform float time;varying vec3 wp;void main(){vec3 p=position;p.z+=sin(p.x*.034+time*.7)*.28+cos(p.y*.057-time*.4)*.21;vec4 w=modelMatrix*vec4(p,1.);wp=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform float time;varying vec3 wp;void main(){float a=sin(wp.x*.15+wp.z*.06+time*.7)*.5+.5;float b=sin(wp.z*.18-wp.x*.04-time*1.1)*.5+.5;float glint=pow(max(0.,sin(wp.x*.9+wp.z*.6+time*1.7)),27.);vec3 c=mix(vec3(.035,.21,.30),vec3(.19,.56,.52),.16+.44*a+.3*b);c+=glint*vec3(.12,.29,.28);gl_FragColor=vec4(c,.91);}'
 }));sea.material=water;
 // Smooth the landscape with a denser mesh. Craters have actual depressed geometry.
 const previousGeo=land.geometry,W=24,H=18,R=3,nx=W*R,ny=H*R;
 const positions=new Float32Array((nx+1)*(ny+1)*3),colors=new Float32Array(positions.length),indices=[];
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=y*(nx+1)+x,c=a+nx+1;indices.push(a,c,a+1,a+1,c,c+1)}
 const detail=keep(new T.BufferGeometry());detail.setIndex(indices);
 detail.setAttribute('position',new T.BufferAttribute(positions,3));detail.setAttribute('color',new T.BufferAttribute(colors,3));
 land.geometry=detail;land.frustumCulled=false;
 const shade=new T.Color();
 function ground(x,y){
  const x0=clamp(Math.floor(x),0,23),y0=clamp(Math.floor(y),0,17),fx=x-x0,fy=y-y0,x1=clamp(x0+1,0,23),y1=clamp(y0+1,0,17);
  let h=(terrainAt(x0,y0)*(1-fx)+terrainAt(x1,y0)*fx)*(1-fy)+(terrainAt(x0,y1)*(1-fx)+terrainAt(x1,y1)*fx)*fy;
  for(const s of state.sectors){const crater=tile(s.x,s.y).crater||0;
    if(crater){const d=Math.hypot(x-s.x,y-s.y);h-=Math.exp(-(d*d)/3.5)*crater*3.2}}
  return h;
 }
 function updateTerrain(){
  for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
   const fx=x/R,fy=y/R,t=tile(fx,fy),i=(y*(nx+1)+x)*3;
   positions[i]=fx*6.2-74.4;positions[i+1]=ground(fx,fy);positions[i+2]=fy*6.2-55.8;
   shade.set(t.water?'#477e8c':t.hazard>.25?'#62453e':t.forest?'#43856b':t.fertility>.78?'#83aa71':'#9c9d80');
   shade.multiplyScalar(.86+random(x*91+y*53)*.25);
   colors[i]=shade.r;colors[i+1]=shade.g;colors[i+2]=shade.b;
  }
  detail.attributes.position.needsUpdate=true;detail.attributes.color.needsUpdate=true;detail.computeVertexNormals();detail.computeBoundingSphere();
 }
 updateTerrain();
 const persistent=new T.Group();group.add(persistent);
 const domeGeo=keep(new T.SphereGeometry(15,20,12,0,Math.PI*2,0,Math.PI*.5));
 function updatePersistent(){
  const fingerprint=state.sectors.map(s=>[s.isolated,tile(s.x,s.y).crater,tile(s.x,s.y).energy,tile(s.x,s.y).ore,tile(s.x,s.y).fertility].map(v=>Math.floor(Number(v||0)*12)).join(':')).join('|');
  if(fingerprint===markerKey)return;markerKey=fingerprint;
  persistent.clear();
  for(const s of state.sectors){
   const p=point(s.id),t=tile(s.x,s.y);
   if(t.crater){
    const scar=add(keep(new T.TorusGeometry(7.2,1.2,7,40)),stone,p.clone(),1,persistent);scar.rotation.x=Math.PI/2;scar.position.y-=1.6;
    const burn=add(orb,lava,p.clone().add(new T.Vector3(0,-1.7,0)),1,persistent);burn.scale.set(3,.45,3);
   }
   if(t.energy>.05){
    const mast=add(rod,metal,p.clone().add(new T.Vector3(0,6.2,0)),1,persistent);mast.scale.set(1.7,11,1.7);
    const cap=add(oct,mint,p.clone().add(new T.Vector3(0,14,0)),3,persistent);cap.scale.y=1.7;
   }
   if(t.ore>.8)for(let i=0;i<8;i++){
    const a=i*2.4,r=6+i*.6;const c=add(oct,gem,p.clone().add(new T.Vector3(Math.cos(a)*r,2,Math.sin(a)*r)),1,persistent);c.scale.set(1.2,2.5,1.2);
   }
   if(t.fertility>.94)for(let i=0;i<12;i++){
    const a=i*2.4,r=5+i*.75;add(cone,leaf,p.clone().add(new T.Vector3(Math.cos(a)*r,1.2,Math.sin(a)*r)),1,persistent);
   }
   if(s.isolated)add(domeGeo,glow(0x9287ff,.1),p,1,persistent);
  }
  updateTerrain();
 }
 updatePersistent();
 function trigger(type,sector){
  if(!alive)return;
  const p=point(sector),t=now(),e={type,p,born:t,duration:6,objects:[]};
  const append=(geo,material,position,scale=1)=>{
   const m=add(geo,material,position,scale);e.objects.push(m);return m;
  };
  if(type==='disaster'){
   e.duration=8;e.meteor=append(orb,stone,p.clone().add(new T.Vector3(-38,90,-25)),3);
   e.trail=append(keep(new T.ConeGeometry(1.9,17,8)),glow(0xff6c28,.85),e.meteor.position.clone().add(new T.Vector3(0,8,0)));
   e.light=new T.PointLight(0xff783a,4,110,2);group.add(e.light);e.objects.push(e.light);
  }else if(type==='rains'){
   e.duration=11;e.cloud=append(orb,glow(0x718eb4,.56),p.clone().add(new T.Vector3(0,30,0)),14);e.cloud.scale.y=.52;wave(p,0x75cfff,4);
  }else if(type==='energy'){
   e.beam=append(rod,glow(0x67ffe0,.55),p.clone().add(new T.Vector3(0,23,0)));e.beam.scale.set(5,42,5);
   spray(p,65,0x80ffe4,9,4);wave(p,0x7affd8,4.5);
  }else if(type==='mineral'||type==='fertility'){
   e.grow=[];
   for(let i=0;i<20;i++){
    const a=i*2.4,r=4+i*.65;
    const crystal=append(type==='mineral'?oct:cone,type==='mineral'?gem:leaf,p.clone().add(new T.Vector3(Math.cos(a)*r,1.5,Math.sin(a)*r)));
    crystal.scale.y=.001;e.grow.push(crystal);
   }
   spray(p,90,type==='mineral'?0xd3a0ff:0xa9ff8f,7,4);wave(p,type==='mineral'?0xb08bff:0x8effad,5);
  }else if(type==='migration'){
   e.duration=8;e.path=new T.CatmullRomCurve3([point((sector+3)%8),p.clone().add(new T.Vector3(-12,26,0)),p.clone()]);
   e.travel=[];for(let i=0;i<18;i++)e.travel.push(append(orb,i%2?mint:lava,point((sector+3)%8),.5));
   wave(p,0xffdba9,5);
  }else if(type==='peace'){
   e.duration=7;e.paths=[];
   for(const s of state.sectors){
    if(s.id===sector)continue;const far=point(s.id);
    const curve=new T.QuadraticBezierCurve3(p,p.clone().lerp(far,.5).add(new T.Vector3(0,18,0)),far);
    e.paths.push(append(keep(new T.TubeGeometry(curve,18,.18,4,false)),glow(0x8effd2,.65),new T.Vector3()));
   }
   spray(p,60,0xaaffdc,6,4);wave(p,0x93ffdf,5);
  }else if(type==='isolation'){
   e.duration=8;e.dome=append(domeGeo,glow(0x9687ff,.19),p,.01);wave(p,0xb4a1ff,5);
  }
  events.push(e);if(events.length>13)removeEvent(events.shift());
  updatePersistent();
 }
 function removeEvent(e){for(const o of e.objects){o.parent?.remove(o);
  if(o.material&&assets.has(o.material)){o.material.dispose();assets.delete(o.material)}
 }}
 const unsubscribe=sim.onExperiment(({action,sector})=>trigger(action,sector));
 function animate(dt,ms){
  if(!alive)return;const t=ms*.001;
  water.uniforms.time.value=t;
  if(ms-lastSync>1600){lastSync=ms;updatePersistent()}
  let count=0;
  for(let i=particles.length-1;i>=0;i--){
   const p=particles[i],age=t-p.born;if(age>p.life){particles.splice(i,1);continue}
   const xyz=p.p.clone().addScaledVector(p.vel,age);if(p.kind!=='rain')xyz.y-=4*age*age;
   dummy.position.copy(xyz);dummy.rotation.y=age;dummy.scale.setScalar(p.scale*(1-age/p.life));dummy.updateMatrix();
   particleMesh.setMatrixAt(count,dummy.matrix);particleMesh.setColorAt(count,p.col);count++;
  }
  particleMesh.count=count;if(count){particleMesh.instanceMatrix.needsUpdate=true;if(particleMesh.instanceColor)particleMesh.instanceColor.needsUpdate=true}
  for(let i=waves.length-1;i>=0;i--){
   const w=waves[i],a=(t-w.start)/w.duration;if(a>=1){w.m.parent?.remove(w.m);w.m.material.dispose();assets.delete(w.m.material);waves.splice(i,1);continue}
   w.m.scale.setScalar(1+a*30);w.m.material.opacity=.8*(1-a);
  }
  for(let i=events.length-1;i>=0;i--){
   const e=events[i],a=clamp((t-e.born)/e.duration,0,1),p=e.p;
   if(a>=1){removeEvent(e);events.splice(i,1);continue}
   if(e.type==='disaster'){
    const f=clamp(a/.37,0,1);
    e.meteor.position.set(p.x-38*(1-f),p.y+90*(1-f),p.z-25*(1-f));
    e.meteor.scale.setScalar(f>=1?.001:3);e.trail.position.copy(e.meteor.position).add(new T.Vector3(0,9,0));e.trail.visible=f<1;
    e.light.position.copy(e.meteor.position);e.light.intensity=f<1?6:Math.max(0,6*(1-a));
    if(f>=1&&!e.hit){e.hit=true;spray(p,135,0xff9c48,24,4.5);wave(p,0xffd2a3,4.5);updatePersistent()}
   }else if(e.type==='rains'){
    e.cloud.position.x=p.x+Math.sin(t*.7)*4;
    for(let j=0;j<3;j++){
     const rainp=new T.Vector3(p.x+(Math.random()-.5)*33,p.y+31,p.z+(Math.random()-.5)*33);
     particles.push({p:rainp,vel:new T.Vector3(-1,-19,.5),born:t,life:1.35,col:new T.Color(0x8cbdff),scale:.12,kind:'rain'});
    }
    while(particles.length>180)particles.shift();
   }else if(e.type==='energy'){
    e.beam.scale.y=42*(1-a);e.beam.material.opacity=.55*(1-a);
   }else if(e.type==='mineral'||e.type==='fertility'){
    e.grow.forEach((m,j)=>m.scale.y=Math.max(.01,clamp((a-j*.007)*4,0,1)));
   }else if(e.type==='migration'){
    e.travel.forEach((m,j)=>{m.position.copy(e.path.getPoint(clamp((a-j*.025)/(1-j*.025),0,1)))});
   }else if(e.type==='peace'){
    e.paths.forEach(m=>m.material.opacity=.6*(1-a));
   }else if(e.type==='isolation'){
    e.dome.scale.setScalar(clamp(a*4,0,1));e.dome.material.opacity=.19*(1-a*.3);
   }
  }
 }
 function dispose(){
  alive=false;unsubscribe();events.forEach(removeEvent);
  land.geometry=previousGeo;sea.material=previousWater;group.parent?.remove(group);
  for(const a of assets)try{a.dispose?.()}catch(e){}
  assets.clear();
 }
 return {animate,dispose,trigger,refresh:updatePersistent};
}