
export async function mount(root,resume=null){
 const q=id=>root.querySelector('#'+id),stage=q('vxStage'),canvas=q('vxCanvas');
 const T=await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
 let alive=true;
 const mobile=/iPhone|iPad|Android/i.test(navigator.userAgent);
 const cfg={SIZE:64,Y:34,CHUNK:16,SEA:8,seed:91245};
 const {SIZE,Y,CHUNK,SEA}=cfg;
 const types=['AIR','GRASS','DIRT','STONE','SAND','LOG','LEAVES','GLASS','BRICKS','GLOW','WATER','ORE','PLANKS'];
 const colors=[0,0x65af64,0x805b3b,0x8c9097,0xd9c394,0x90613d,0x2b7c4f,0x98deeb,0x98746c,0xf6d98b,0x438aa8,0x4f94b3,0xc19b6c];
 const solid=id=>id!==0&&id!==10;
 const blocks=new Uint8Array(SIZE*SIZE*Y);
 const idx=(x,y,z)=>(x*SIZE+z)*Y+y;
 const inb=(x,y,z)=>x>=0&&x<SIZE&&z>=0&&z<SIZE&&y>=0&&y<Y;
 const get=(x,y,z)=>inb(x,y,z)?blocks[idx(x,y,z)]:0;
 const put=(x,y,z,id)=>{if(inb(x,y,z))blocks[idx(x,y,z)]=id};
 const hash=(x,z)=>{let n=Math.sin(x*127.1+z*311.7+cfg.seed*.004)*43758.5453;return n-Math.floor(n)};
 const smooth=(x,z)=>{const i=Math.floor(x),j=Math.floor(z);let a=x-i,b=z-j;a=a*a*(3-2*a);b=b*b*(3-2*b);return (hash(i,j)*(1-a)+hash(i+1,j)*a)*(1-b)+(hash(i,j+1)*(1-a)+hash(i+1,j+1)*a)*b};
 const fractal=(x,z)=>.55*smooth(x*.058,z*.058)+.28*smooth(x*.13+17,z*.13)+.17*smooth(x*.27+73,z*.27-8);
 function ground(x,z){let h=Math.floor(5+fractal(x,z)*23+Math.sin(x*.12)*1.9+Math.cos(z*.11)*1.6);const d=Math.hypot(x-32,z-32);h-=Math.floor(Math.max(0,(d-19)/23)*12);if(d<7)h=Math.round(12+(h-12)*Math.max(0,(d-4)/3));return Math.max(4,Math.min(26,h))}
 for(let x=0;x<SIZE;x++)for(let z=0;z<SIZE;z++){
   const h=ground(x,z),beach=h<=SEA+1;
   for(let y=0;y<=h;y++){
    let b=y===h?(beach?4:1):y>h-4?(beach?4:2):3;
    if(b===3&&y>4&&y<h-2&&hash(x*71+y,z*39-y)>.992)b=11;
    put(x,y,z,b);
   }
   for(let y=h+1;y<=SEA;y++)put(x,y,z,10);
 }
 for(let x=3;x<SIZE-3;x++)for(let z=3;z<SIZE-3;z++){
   const h=ground(x,z),r=hash(x*7,z*9);
   if(r>.958&&h>SEA+1&&h<22&&Math.hypot(x-32,z-32)>8){
     const tall=3+Math.floor(hash(x+7,z+8)*3);
     for(let j=1;j<=tall;j++)put(x,h+j,z,5);
     for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=-1;dy<=2;dy++){
       if(Math.abs(dx)+Math.abs(dz)+Math.max(0,dy)>4)continue;
       const xx=x+dx,zz=z+dz,yy=h+tall+dy;
       if(inb(xx,yy,zz)&&get(xx,yy,zz)===0)put(xx,yy,zz,6);
     }
   }
 }
 // A small starter cabin and illuminated path on the plateau.
 const cabinBase=ground(44,33)+1;
 for(let x=41;x<=48;x++)for(let z=29;z<=36;z++){
   for(let y=ground(x,z)+1;y<cabinBase;y++)put(x,y,z,8);
   put(x,cabinBase,z,12);
   for(let y=cabinBase+1;y<cabinBase+5;y++)if(get(x,y,z)!==0)put(x,y,z,0);
 }
 for(let x=41;x<=48;x++)for(let z=29;z<=36;z++){
   const wall=x===41||x===48||z===29||z===36;
   if(wall)for(let y=cabinBase+1;y<=cabinBase+4;y++){
     const door=z===36&&(x===44||x===45)&&y<=cabinBase+3;
     const window=(x===41||x===48)&&(z===32||z===33)&&y===cabinBase+3;
     if(!door)put(x,y,z,window?7:12);
   }
   put(x,cabinBase+5,z,8);
 }
 put(43,cabinBase+2,35,9);put(46,cabinBase+2,35,9);
 for(let z=37;z<46;z++){const y=ground(44,z);put(44,y,z,8);if(z%3===0)put(45,y+1,z,9)}
 // Save individual changes, not a huge serialized world.
 const saveKey='voxel-chat-world-91245-v1';
 const changes=new Map();
 try{
  const saved=resume?.changes?resume:JSON.parse(localStorage.getItem(saveKey)||'{}');
  for(const [k,v] of Object.entries(saved.changes||{})){
    const n=k.split(',').map(Number);if(n.length===3&&n.every(Number.isInteger)&&Number.isInteger(v)&&v>=0&&v<=12&&inb(...n)){put(...n,v);changes.set(k,v)}
  }
 }catch(e){}
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 renderer.shadowMap.enabled=false;
 const scene=new T.Scene();scene.background=new T.Color(0x82b6d4);scene.fog=new T.FogExp2(0x9abbd1,.017);
 const camera=new T.PerspectiveCamera(73,1,.07,350);
 const hemi=new T.HemisphereLight(0xe5f5ff,0x566858,2.0);scene.add(hemi);
 const sun=new T.DirectionalLight(0xffe2b0,2.6);sun.position.set(-38,70,26);scene.add(sun);
 const clock=new T.Clock();
 let period='day',weather='clear',quality='auto',maxDpr=mobile?1.1:1.5,loc,velY=0,grounded=false;
 const savedPosition=resume?.player??(()=>{try{return JSON.parse(localStorage.getItem(saveKey)||'{}').player}catch(e){return null}})();
 loc=new T.Vector3(savedPosition?.x??32.5,savedPosition?.y??ground(32,32)+2.6,savedPosition?.z??32.5);
 let yaw=savedPosition?.yaw??.5,pitch=.02,selected=1,lookPointer=null,lookOld=null;
 let mineCooldown=0,placeCooldown=0,runPressed=false,move={x:0,y:0},stickPointer=null;
 const atlas=document.createElement('canvas');atlas.width=atlas.height=512;
 const ctx=atlas.getContext('2d');const tile=128;
 const rgb=h=>[(h>>16)&255,(h>>8)&255,h&255];
 const palette=[
  [0,0,0],[0x6aaf4c,0x477b35],[0x895d39,0x654326],[0x989da3,0x5d6971],
  [0xe9d2a0,0xb99e75],[0xaf8055,0x765033],[0x579a5b,0x2c6d40],[0x9bd5ea,0x84b9ce],
  [0xc5a194,0x866e67],[0xf5dda2,0xcda25d],[0x4b9ab5,0x216080],[0x78909d,0x3d606f],
  [0xc69c6c,0x9a6c44],[0x4fa246,0x317836],[0xaac8c9,0x597e83],[0xc9bb90,0x866b46]
 ];
 for(let id=0;id<16;id++){
  const tx=id%4,ty=Math.floor(id/4),base=palette[id],data=ctx.createImageData(tile,tile);
  for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){
   let grain=.72+hash(x+id*113,y+id*57)*.48;
   const vein=Math.sin(y*.65+x*.3+Math.sin(x*.13)*2)*.08;
   if(id===2||id===3||id===11)grain+=vein;
   if(id===5||id===12||id===15)grain+=Math.sin(x*.14+Math.sin(y*.03)*2)*.16;
   if(id===8)grain-=((x%48<3)||(y%34<3))?.35:0;
   if(id===9)grain=1.05+hash(x,y)*.13;
   if(id===7)grain=.8+Math.sin(x*.09+y*.07)*.13;
   let mix=hash(x*11+7,y*13+17)*.32;
   let p=(y*tile+x)*4;
   const a=rgb(base[0]),b=rgb(base[1]);
   for(let k=0;k<3;k++)data.data[p+k]=Math.max(0,Math.min(255,(a[k]*(1-mix)+b[k]*mix)*grain));
   data.data[p+3]=255;
  }
  ctx.putImageData(data,tx*tile,ty*tile);
 }
 const tex=new T.CanvasTexture(atlas);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;
 const opaqueMat=new T.MeshStandardMaterial({map:tex,vertexColors:true,roughness:.88,metalness:0});
 const glassMat=new T.MeshPhysicalMaterial({color:0xa0d9e9,transparent:true,opacity:.38,metalness:.2,roughness:.12,side:T.DoubleSide,depthWrite:false});
 const waterMat=new T.MeshStandardMaterial({color:0x3f96c1,transparent:true,opacity:.7,metalness:.12,roughness:.3,side:T.DoubleSide,depthWrite:false});
 const distantWater=new T.Mesh(new T.PlaneGeometry(750,750,1,1),new T.MeshStandardMaterial({color:0x357f9d,transparent:true,opacity:.81,metalness:.35,roughness:.22,depthWrite:false}));distantWater.rotation.x=-Math.PI/2;distantWater.position.set(32,SEA+.86,32);scene.add(distantWater);
 const glowMat=new T.MeshStandardMaterial({color:0xffeac0,emissive:0xffb561,emissiveIntensity:1.7,roughness:.45});
 const geoGroups=new Map();
 const faces=[
  {d:[1,0,0],v:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],shade:.78},
  {d:[-1,0,0],v:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]],shade:.8},
  {d:[0,1,0],v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],shade:1},
  {d:[0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],shade:.55},
  {d:[0,0,1],v:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],shade:.9},
  {d:[0,0,-1],v:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],shade:.72}
 ];
 const uvQuad=[[.005,.005],[.005,.995],[.995,.995],[.995,.005]];
 const atlasTile=(block,side)=>{
  if(block===1)return side===2?13:side===3?2:1;
  if(block===5)return side===2||side===3?15:5;
  return block;
 };
 function chunkMesh(cx,cz){
  const geometry={0:{p:[],n:[],u:[],c:[],ix:[]},1:{p:[],n:[],u:[],c:[],ix:[]},2:{p:[],n:[],u:[],c:[],ix:[]},3:{p:[],n:[],u:[],c:[],ix:[]}};
  for(let x=cx*CHUNK;x<Math.min(SIZE,(cx+1)*CHUNK);x++)for(let z=cz*CHUNK;z<Math.min(SIZE,(cz+1)*CHUNK);z++)for(let y=0;y<Y;y++){
   const id=get(x,y,z);if(!id)continue;
   const layer=id===10?2:id===7?1:id===9?3:0;
   const g=geometry[layer];
   for(let fi=0;fi<6;fi++){
    const f=faces[fi],other=get(x+f.d[0],y+f.d[1],z+f.d[2]);
    if(id===10){if(other!==0)continue}
    else if(other!==0&&other!==10&&other!==7)continue;
    if(id===7&&other===7)continue;
    const start=g.p.length/3,tx=atlasTile(id,fi)%4,ty=Math.floor(atlasTile(id,fi)/4),shade=f.shade;
    for(let j=0;j<4;j++){
      const v=f.v[j],uv=uvQuad[j];
      g.p.push(x+v[0],y+v[1],z+v[2]);
      g.n.push(...f.d);g.u.push((tx+uv[0])/4,1-(ty+uv[1])/4);
      g.c.push(shade,shade,shade);
    }
    g.ix.push(start,start+1,start+2,start,start+2,start+3);
   }
  }
  const name=cx+':'+cz;
  if(geoGroups.has(name)){
   const old=geoGroups.get(name);scene.remove(old);old.traverse(o=>{if(o.geometry)o.geometry.dispose()})
  }
  const group=new T.Group();
  for(const [layer,data] of Object.entries(geometry)){
   if(!data.p.length)continue;
   const g=new T.BufferGeometry();
   g.setAttribute('position',new T.Float32BufferAttribute(data.p,3));
   g.setAttribute('normal',new T.Float32BufferAttribute(data.n,3));
   g.setAttribute('uv',new T.Float32BufferAttribute(data.u,2));
   g.setAttribute('color',new T.Float32BufferAttribute(data.c,3));g.setIndex(data.ix);
   g.computeBoundingSphere();
   const material=[opaqueMat,glassMat,waterMat,glowMat][Number(layer)];
   const o=new T.Mesh(g,material);o.receiveShadow=true;group.add(o);
  }
  scene.add(group);geoGroups.set(name,group);
 }
 for(let cx=0;cx<SIZE/CHUNK;cx++)for(let cz=0;cz<SIZE/CHUNK;cz++)chunkMesh(cx,cz);
 function updateAt(x,z){
  const pairs=[[Math.floor(x/CHUNK),Math.floor(z/CHUNK)]];
  if(x%CHUNK===0)pairs.push([Math.floor(x/CHUNK)-1,Math.floor(z/CHUNK)]);
  if(x%CHUNK===CHUNK-1)pairs.push([Math.floor(x/CHUNK)+1,Math.floor(z/CHUNK)]);
  if(z%CHUNK===0)pairs.push([Math.floor(x/CHUNK),Math.floor(z/CHUNK)-1]);
  if(z%CHUNK===CHUNK-1)pairs.push([Math.floor(x/CHUNK),Math.floor(z/CHUNK)+1]);
  for(const [cx,cz] of pairs)if(cx>=0&&cz>=0&&cx<SIZE/CHUNK&&cz<SIZE/CHUNK)chunkMesh(cx,cz);
 }
 const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#347fba')},horizon:{value:new T.Color('#bfdfea')},night:{value:0},time:{value:0}},
  vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top,horizon;uniform float night,time;varying vec3 v;void main(){vec3 d=normalize(v);float h=smoothstep(-.21,.82,d.y);vec3 c=mix(horizon,top,h);float s=pow(max(dot(d,normalize(vec3(-.55,.48,.55))),0.),600.);c+=vec3(1.,.8,.53)*s*1.9*(1.-night);gl_FragColor=vec4(c,1.);}'
 });
 const sky=new T.Mesh(new T.SphereGeometry(250,28,14),skyMat);scene.add(sky);
 const cloudMat=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false});
 const clouds=[];
 for(let i=0;i<38;i++){
  const g=new T.Group();scene.add(g);
  const x=hash(i,17)*150-50,z=hash(i,63)*140-40;g.position.set(x,35+hash(i,22)*9,z);
  for(let j=0;j<4;j++){
   const m=new T.Mesh(new T.BoxGeometry(7+hash(i,j)*6,1.7+hash(j,i)*1.2,3.5),cloudMat);
   m.position.set(j*4,Math.sin(j)*.4,j%2*1.8);g.add(m)
  }clouds.push(g);
 }
 
// V2: wandering voxel wildlife and a little life in the starter biome.
const animalGroup=new T.Group();scene.add(animalGroup);
const wool=new T.MeshStandardMaterial({color:0xe1ded0,roughness:.96});
const fleece=new T.MeshStandardMaterial({color:0x8d9389,roughness:.95});
const eyes=new T.MeshStandardMaterial({color:0x1b262b,roughness:.84});
const animals=[];
function animalBox(w,h,d,material,x,y,z,parent){
 const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);
 mesh.position.set(x,y,z);parent.add(mesh);return mesh
}
for(let i=0;i<8;i++){
 const ag=new T.Group();animalGroup.add(ag);
 const color=i%4?fleece:wool;
 animalBox(.98,.74,1.35,color,0,.83,0,ag);
 animalBox(.7,.67,.62,wool,0,1.1,-.86,ag);
 for(const xx of [-.26,.26])animalBox(.075,.11,.07,eyes,xx,1.2,-1.19,ag);
 const legs=[];
 for(const xx of [-.34,.34])for(const zz of [-.42,.42])legs.push(animalBox(.19,.7,.2,color,xx,.22,zz,ag));
 animals.push({g:ag,legs,origin:[22+i*2.8,20+(i%3)*5],phase:i*1.9});
}

const sunDisk=new T.Mesh(new T.SphereGeometry(4,16,10),new T.MeshBasicMaterial({color:0xffebba}));
 sunDisk.position.set(-76,110,70);scene.add(sunDisk);
 const reticle=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.015,1.015,1.015)),new T.LineBasicMaterial({color:0xffffff,depthTest:false,transparent:true,opacity:.93}));
 reticle.renderOrder=10;reticle.visible=false;scene.add(reticle);
 function castBlock(){
  const origin=loc.clone(),dir=new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
  let x=Math.floor(origin.x),y=Math.floor(origin.y),z=Math.floor(origin.z);
  const sx=dir.x>=0?1:-1,sy=dir.y>=0?1:-1,sz=dir.z>=0?1:-1;
  const ix=dir.x!==0?Math.abs(1/dir.x):1e30,iy=dir.y!==0?Math.abs(1/dir.y):1e30,iz=dir.z!==0?Math.abs(1/dir.z):1e30;
  let tx=dir.x!==0?((sx>0?x+1-origin.x:origin.x-x)*ix):1e30;
  let ty=dir.y!==0?((sy>0?y+1-origin.y:origin.y-y)*iy):1e30;
  let tz=dir.z!==0?((sz>0?z+1-origin.z:origin.z-z)*iz):1e30;
  let prev=null;
  for(let i=0;i<26;i++){
   const b=get(x,y,z);
   if(b&&b!==10)return {pos:[x,y,z],adj:prev,id:b};
   prev=[x,y,z];
   const min=Math.min(tx,ty,tz);if(min>7)break;
   if(tx<=ty&&tx<=tz){x+=sx;tx+=ix}
   else if(ty<=tz){y+=sy;ty+=iy}
   else{z+=sz;tz+=iz}
  }
  return null;
 }
 let currentTarget=null,tipUntil=0;
 const text=(id,s)=>{const el=q(id);if(el)el.textContent=s};
 function refreshHotbar(){
  const bar=q('vxHotbar');bar.innerHTML='';
  for(const id of [1,2,3,4,5,6,7,8,9,11,12]){
    const b=document.createElement('button');b.className='vxSlot'+(id===selected?' selected':'');
    b.style.setProperty('--tile','#'+colors[id].toString(16).padStart(6,'0'));
    b.textContent=types[id];b.onclick=()=>{selected=id;refreshHotbar()};bar.appendChild(b);
  }
 }
 refreshHotbar();
 function canOccupy(x,y,z){
  for(const ox of [-.27,.27])for(const oz of [-.27,.27]){
    const bx=Math.floor(x+ox),bz=Math.floor(z+oz);
    for(const dy of [-1.46,-.46]){const by=Math.floor(y+dy);if(solid(get(bx,by,bz)))return false}
  }
  return x>.45&&x<SIZE-.45&&z>.45&&z<SIZE-.45;
 }
 function notify(message){
  text('vxToast',message);q('vxToast').style.opacity='1';tipUntil=performance.now()+1700;
 }
 function editBlock(place){
  const target=castBlock();if(!target){notify('Aim at a block within 7 metres');return}
  const [x,y,z]=place?(target.adj||[]):target.pos;
  if(x===undefined||!inb(x,y,z)){notify('Cannot place here');return}
  if(place){
    if(get(x,y,z)!==0&&get(x,y,z)!==10)return;
    if(Math.abs(loc.x-x-.5)<.8&&Math.abs(loc.z-z-.5)<.8&&y<loc.y+.25&&y+1>loc.y-1.65){notify('Block intersects player');return}
    put(x,y,z,selected);
  } else {
    put(x,y,z,0);
  }
  changes.set([x,y,z].join(','),place?selected:0);updateAt(x,z);
  if(changes.size>12000)notify('World edit memory limit approaching');
 }
 q('vxMine').onclick=()=>editBlock(false);
 q('vxPlace').onclick=()=>editBlock(true);
 q('vxJump').onclick=()=>{if(grounded){velY=6.8;grounded=false}};
 q('vxRun').onclick=()=>{runPressed=!runPressed;q('vxRun').classList.toggle('active',runPressed)};
 q('vxInventory').onclick=()=>{q('vxHotbar').classList.toggle('expanded');q('vxInventory').classList.toggle('active')};
 q('vxReset').onclick=()=>{loc.set(32.5,ground(32,32)+3,32.5);yaw=.5;pitch=.05;notify('Returned to spawn')};
 q('vxWeather').onchange=e=>{
  weather=e.target.value;const storm=weather==='rain',night=weather==='night';
  sun.intensity=night?.12:storm?.85:2.6;hemi.intensity=night?.7:storm?1.3:2;
  skyMat.uniforms.top.value.set(night?'#07182e':storm?'#40566f':'#347fba');
  skyMat.uniforms.horizon.value.set(night?'#29364d':storm?'#7e919a':'#bfdfea');
  skyMat.uniforms.night.value=night?1:0;sunDisk.visible=!night&&!storm;scene.fog.color.set(night?0x1e3548:storm?0x748e9b:0x9abbd1);
  cloudMat.opacity=night?.15:storm?.95:.8;
 };
 function setQuality(v){
  quality=v;maxDpr=v==='low'?.75:v==='medium'?1:v==='high'?Math.min(devicePixelRatio||1,1.7):(mobile?1.1:1.4);
  renderer.setPixelRatio(maxDpr);resize();
 }
 q('vxQuality').onchange=e=>setQuality(e.target.value);
 const touchPad=q('vxJoystick'),touchNub=q('vxNub');
 function stickMove(e){
  const r=touchPad.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),l=Math.max(1,Math.hypot(dx,dy)),k=Math.min(36,l)/l;
  move.x=dx*k/36;move.y=-dy*k/36;touchNub.style.transform='translate('+(move.x*36)+'px,'+(-move.y*36)+'px)';
 }
 touchPad.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();stickPointer=e.pointerId;touchPad.setPointerCapture(e.pointerId);stickMove(e)});
 touchPad.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)stickMove(e)});
 const stopStick=e=>{if(e.pointerId!==stickPointer)return;stickPointer=null;move.x=move.y=0;touchNub.style.transform='translate(0,0)'};
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])touchPad.addEventListener(ev,stopStick);
 canvas.addEventListener('pointerdown',e=>{lookPointer=e.pointerId;lookOld=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer||!lookOld)return;yaw-=(e.clientX-lookOld[0])*.0045;pitch=T.MathUtils.clamp(pitch+(e.clientY-lookOld[1])*.0042,-1.45,1.45);lookOld=[e.clientX,e.clientY]});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>{if(e.pointerId===lookPointer){lookPointer=null;lookOld=null}});
 const keys=new Set();
 const kd=e=>{const t=e.target;if(t&&/INPUT|TEXTAREA|SELECT/.test(t.tagName))return;keys.add(e.key.toLowerCase());if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault()};
 const ku=e=>keys.delete(e.key.toLowerCase());
 stage.tabIndex=0;stage.addEventListener('keydown',kd);stage.addEventListener('keyup',ku);
 const resizeObserver=new ResizeObserver(resize);
 function resize(){let w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
 setQuality('auto');resizeObserver.observe(stage);
 q('vxLoad').style.opacity='0';setTimeout(()=>{if(alive&&q('vxLoad'))q('vxLoad').style.display='none'},750);
 const rainGeo=new T.BufferGeometry(),rainCount=mobile?250:600,rainPos=new Float32Array(rainCount*3);
 for(let i=0;i<rainCount;i++){rainPos[3*i]=(Math.random()-.5)*50;rainPos[3*i+1]=Math.random()*30;rainPos[3*i+2]=(Math.random()-.5)*50}
 rainGeo.setAttribute('position',new T.BufferAttribute(rainPos,3));
 const rainMat=new T.PointsMaterial({color:0xb3e0fa,size:.08,transparent:true,opacity:.65});
 const rain=new T.Points(rainGeo,rainMat);scene.add(rain);
 let last=performance.now(),fpsAt=last,frames=0,saveAt=last,adaptAt=last;
 const stat=()=>({x:loc.x,y:loc.y,z:loc.z,yaw});
 function persist(){
  try{localStorage.setItem(saveKey,JSON.stringify({player:stat(),changes:Object.fromEntries(changes)}))}catch(e){}
 }
 function frame(){
  if(!alive||!root.isConnected)return;requestAnimationFrame(frame);
  const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
  const fwd=move.y+(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);
  const side=move.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
  let vx=0,vz=0;
  const magnitude=Math.max(1,Math.hypot(fwd,side)),speed=(runPressed||keys.has('shift')?8.6:5.2);
  vx=(Math.sin(yaw)*fwd+Math.cos(yaw)*side)/magnitude*speed*dt;
  vz=(-Math.cos(yaw)*fwd+Math.sin(yaw)*side)/magnitude*speed*dt;
  if(keys.has(' ')&&grounded){velY=6.8;grounded=false}
  const ox=loc.x,oz=loc.z;
  if(canOccupy(loc.x+vx,loc.y,loc.z))loc.x+=vx;else if(canOccupy(loc.x+vx,loc.y+1.01,loc.z)){loc.x+=vx;loc.y+=1}
  if(canOccupy(loc.x,loc.y,loc.z+vz))loc.z+=vz;else if(canOccupy(loc.x,loc.y+1.01,loc.z+vz)){loc.z+=vz;loc.y+=1}
  velY=Math.max(-24,velY-18.8*dt);
  if(canOccupy(loc.x,loc.y+velY*dt,loc.z)){loc.y+=velY*dt;grounded=false}
  else{if(velY<=0)grounded=true;velY=0}
  if(loc.y<2){loc.set(32.5,ground(32,32)+3,32.5);velY=0}
  camera.position.copy(loc);camera.rotation.order='YXZ';camera.rotation.y=-yaw;camera.rotation.x=pitch;
  sky.position.copy(loc);
  const t=clock.getElapsedTime();skyMat.uniforms.time.value=t;
  for(const a of animals){
    const xx=a.origin[0]+Math.sin(t*.21+a.phase)*3.4,zz=a.origin[1]+Math.cos(t*.19+a.phase)*2.4;
    a.g.position.set(xx,ground(Math.round(xx),Math.round(zz))+1,zz);
    a.g.rotation.y=t*.24+a.phase;
    for(let j=0;j<a.legs.length;j++)a.legs[j].rotation.x=Math.sin(t*3+a.phase+j*Math.PI)*.15;
  }

  for(let i=0;i<clouds.length;i++)clouds[i].position.x+=dt*(i%3+1)*.38;
  for(const cloud of clouds)if(cloud.position.x>140)cloud.position.x=-40;
  rain.visible=weather==='rain';rain.position.set(loc.x,loc.y+1,loc.z);
  if(weather==='rain'){const a=rainGeo.attributes.position;for(let i=0;i<rainCount;i++){let y=a.array[3*i+1]-dt*25;if(y<0)y+=30;a.array[3*i+1]=y}a.needsUpdate=true}
  currentTarget=castBlock();
  reticle.visible=!!currentTarget;
  if(currentTarget)reticle.position.set(currentTarget.pos[0]+.5,currentTarget.pos[1]+.5,currentTarget.pos[2]+.5);
  renderer.render(scene,camera);
  frames++;
  if(now-fpsAt>1350){
    const rate=Math.round(frames*1000/(now-fpsAt));frames=0;fpsAt=now;
    text('vxFps',rate+' FPS · '+quality.toUpperCase());
    text('vxLocation','XYZ '+Math.floor(loc.x)+' / '+Math.floor(loc.y)+' / '+Math.floor(loc.z));
    text('vxTarget',currentTarget?types[currentTarget.id]+' · '+currentTarget.pos.join(', '):'Explore · Mine · Build');
    if(quality==='auto'&&rate<27&&now-adaptAt>12000&&renderer.getPixelRatio()>.75){renderer.setPixelRatio(Math.max(.75,renderer.getPixelRatio()-.1));resize();adaptAt=now}
  }
  if(now-saveAt>5000){saveAt=now;persist()}
  if(now>tipUntil)q('vxToast').style.opacity='0';
 }
 requestAnimationFrame(frame);
 return {snapshot(){return {player:stat(),changes:Object.fromEntries(changes)}},dispose(){alive=false;persist();resizeObserver.disconnect();stage.removeEventListener('keydown',kd);stage.removeEventListener('keyup',ku);renderer.dispose();for(const m of geoGroups.values())m.traverse(o=>o.geometry?.dispose());tex.dispose();opaqueMat.dispose();}};
}
