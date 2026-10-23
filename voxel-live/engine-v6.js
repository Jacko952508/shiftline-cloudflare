
export async function mount(root,resume=null){
 const q=id=>root.querySelector('#'+id),stage=q('vxStage'),canvas=q('vxCanvas');
 const branding=root.querySelector('.vxName');if(branding)branding.innerHTML='REALITY ENGINE <span style="color:#8ff1c8">LIVE</span>';
 const sub=root.querySelector('.vxSub');if(sub)sub.textContent='CRESCENT COAST · SMOOTH ROADS · NEW VEHICLES';
 const T=await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
 let alive=true;
 const mobile=/iPhone|iPad|Android/i.test(navigator.userAgent);
 const cfg={SIZE:256,Y:64,CHUNK:16,SEA:8,seed:91245}; // 16x previous land area. Legacy spawn region and saves preserved.
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
 function ground(x,z){
 if(x>=104&&x<=216&&z>=101&&z<=216)return 13;
 if(x<65&&z<65){let h=Math.floor(5+fractal(x,z)*23+Math.sin(x*.12)*1.9+Math.cos(z*.11)*1.6);const d=Math.hypot(x-32,z-32);h-=Math.floor(Math.max(0,(d-19)/23)*12);if(d<7)h=Math.round(12+(h-12)*Math.max(0,(d-4)/3));return Math.max(4,Math.min(26,h))}
 const n=fractal(x+31,z+57),low=smooth(x*.019+78,z*.019-33);
 let h=Math.floor(7+n*26+(low-.5)*18+Math.sin(x*.042+z*.015)*4.2+Math.cos(z*.049)*2.7);
 if(Math.hypot(x-160,z-160)<91)h=Math.floor(13+(h-13)*Math.min(1,Math.max(0,(Math.hypot(x-160,z-160)-64)/27)));
 return Math.max(3,Math.min(43,h));
}
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
   const h=ground(x,z),r=hash(x*7,z*9);if(x>102&&x<218&&z>99&&z<218)continue;
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

 // Built-in coastal metropolis. Towers are hollow, entered through doors, and lit at night.
 const cityBounds={minX:111,maxX:209,minZ:111,maxZ:209,cx:160,cz:160};
 for(let x=cityBounds.minX;x<=cityBounds.maxX;x++)for(let z=cityBounds.minZ;z<=cityBounds.maxZ;z++){
   const xp=(x-112)%16,zp=(z-112)%16,h=ground(x,z);
   const road=xp<4||zp<4;
   put(x,h,z,road?3:8);
   if(road){if((xp===1||zp===1)&&(x%7===0||z%7===0))put(x,h+1,z,9);continue}
   if(xp===4||zp===4||xp===15||zp===15){put(x,h+1,z,8);continue}
   const cx=Math.floor((x-112)/16),cz=Math.floor((z-112)/16);
   const level=10+Math.floor(hash(cx*5+12,cz*7+9)*25);
   const bx=xp>=6&&xp<=13,bz=zp>=6&&zp<=13;
   if(!bx||!bz)continue;
   const edge=xp===6||xp===13||zp===6||zp===13;
   for(let dy=1;dy<=level;dy++){
     const y=h+dy;if(y>=Y-2)break;
     const floor=dy%7===0;
     if(floor){put(x,y,z,8);continue}
     if(!edge)continue;
     const entrance=dy<=3&&(zp===6||zp===13)&&(xp===9||xp===10);
     if(entrance)continue;
     const window=dy>2&&dy<level-1&&((xp+zp+dy)%4!==0);
     put(x,y,z,window?7:cx%3===0?12:cx%3===1?8:3);
   }
   if(xp===6&&zp===6)for(let dy=1;dy<=Math.min(level,Y-h-4);dy++)put(x,h+dy,z,9);
   if(level<Y-h-3)put(x,h+level+1,z,3);
 }

 // City plazas with trees, benches and street lights.
 for(let x=117;x<210;x+=16)for(let z=117;z<210;z+=16){
   const h=ground(x,z);
   if((x+z)%3===0){
     for(let y=h+1;y<h+6;y++)put(x,y,z,5);
     for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=4;dy<=7;dy++){
       if(Math.abs(dx)+Math.abs(dz)+Math.abs(dy-5)<7&&inb(x+dx,h+dy,z+dz)&&!get(x+dx,h+dy,z+dz))put(x+dx,h+dy,z+dz,6)
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
 const directorState={town:false,craters:0,events:0,structures:0,pilots:0,day:1};
 try{const prior=resume?.director??JSON.parse(localStorage.getItem(saveKey)||'{}').director;if(prior&&typeof prior==='object')Object.assign(directorState,prior)}catch(e){}

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
 const scene=new T.Scene();scene.background=new T.Color(0x82b6d4);scene.fog=new T.FogExp2(0x9abbd1,.0065);
 const camera=new T.PerspectiveCamera(73,1,.07,420);
 const hemi=new T.HemisphereLight(0xe5f5ff,0x566858,2.0);scene.add(hemi);
 const sun=new T.DirectionalLight(0xffe2b0,2.6);sun.position.set(-38,70,26);scene.add(sun);
 
 // V6: one-time local environment map — gives vehicle clearcoat, glass and metal realistic reflections.
 // Pre-filter exactly once: no costly live cubemap redraws on iPhone.
 const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;
 const ectx=envCanvas.getContext('2d'),eg=ectx.createLinearGradient(0,0,0,256);
 eg.addColorStop(0,'#174565');eg.addColorStop(.34,'#70a8ba');eg.addColorStop(.48,'#e9d8b6');
 eg.addColorStop(.54,'#8babb5');eg.addColorStop(.67,'#4b6476');eg.addColorStop(1,'#102e47');
 ectx.fillStyle=eg;ectx.fillRect(0,0,512,256);
 const skylight=ectx.createRadialGradient(105,115,5,105,115,68);
 skylight.addColorStop(0,'rgba(255,253,226,1)');skylight.addColorStop(.17,'rgba(255,230,184,.84)');
 skylight.addColorStop(.52,'rgba(254,225,190,.29)');skylight.addColorStop(1,'rgba(255,224,186,0)');
 ectx.fillStyle=skylight;ectx.fillRect(36,43,140,140);
 const envTexture=new T.CanvasTexture(envCanvas);
 envTexture.mapping=T.EquirectangularReflectionMapping;envTexture.colorSpace=T.SRGBColorSpace;
 let reflectionTarget=null;
 try{
   const prefilter=new T.PMREMGenerator(renderer);
   reflectionTarget=prefilter.fromEquirectangular(envTexture);
   scene.environment=reflectionTarget.texture;
   scene.environmentIntensity=.77;
   prefilter.dispose();
 }catch(e){console.warn('V6 environment lighting fallback',e);scene.environment=null}

 const clock=new T.Clock();
 let period='day',weather='clear',quality='auto',maxDpr=mobile?1.1:1.5,loc,velY=0,grounded=false;
 const savedPosition=resume?.player??(()=>{try{return JSON.parse(localStorage.getItem(saveKey)||'{}').player}catch(e){return null}})();
 loc=new T.Vector3(savedPosition?.x??32.5,savedPosition?.y??ground(32,32)+2.6,savedPosition?.z??32.5);
 let newMapActive=directorState.activeMap!=='voxel';
 // Lightweight autonomous traffic: 14 moving vehicles on city street loops.
 const traffic=[],trafficRoot=new T.Group();trafficRoot.visible=!newMapActive;scene.add(trafficRoot);
 const trafficColors=[0x8fdad5,0xe7a46b,0xb3b8d3,0xeadfbd,0x9879a9];
 const trafficMat=trafficColors.map(color=>new T.MeshStandardMaterial({color,metalness:.68,roughness:.26}));
 const trafficGlass=new T.MeshPhysicalMaterial({color:0x719cae,roughness:.14,metalness:.3,transparent:true,opacity:.78,depthWrite:false});
 const trafficRubber=new T.MeshStandardMaterial({color:0x1b2830,roughness:.88});
 const trafficLamp=new T.MeshBasicMaterial({color:0xd7fff6,toneMapped:false});
 for(let i=0;i<14;i++){
   const g=new T.Group();trafficRoot.add(g);
   const chassis=new T.Mesh(new T.BoxGeometry(1.55,.42,3.1),trafficMat[i%trafficMat.length]);chassis.position.y=.57;g.add(chassis);
   const cab=new T.Mesh(new T.BoxGeometry(1.24,.7,1.4),trafficGlass);cab.position.set(0,1.07,-.18);g.add(cab);
   for(const side of [-1,1])for(const z of [-.92,.97]){
     const wheel=new T.Mesh(new T.CylinderGeometry(.32,.32,.22,10),trafficRubber);
     wheel.position.set(side*.79,.35,z);wheel.rotation.z=Math.PI/2;g.add(wheel)
   }
   for(const side of [-.54,.54]){const lamp=new T.Mesh(new T.BoxGeometry(.28,.1,.035),trafficLamp);lamp.position.set(side,.65,-1.6);g.add(lamp)}
   traffic.push({g,offset:i/14,speed:3.4+(i%4)*.74,ring:i%3});
 }
 function animateTraffic(dt,t){
   const paths=[
     [[114,114],[207,114],[207,206],[114,206]],
     [[130,130],[192,130],[192,192],[130,192]],
     [[146,146],[177,146],[177,177],[146,177]]
   ];
   for(const a of traffic){
     const nodes=paths[a.ring],size=nodes.length,total=nodes.reduce((p,b,i)=>p+Math.hypot(b[0]-nodes[(i+1)%size][0],b[1]-nodes[(i+1)%size][1]),0);
     let d=(a.offset*total+t*a.speed)%total,px=nodes[0][0],pz=nodes[0][1],heading=0;
     for(let i=0;i<size;i++){
       const p=nodes[i],b=nodes[(i+1)%size],segment=Math.hypot(b[0]-p[0],b[1]-p[1]);
       if(d<=segment){const f=d/segment;px=p[0]+(b[0]-p[0])*f;pz=p[1]+(b[1]-p[1])*f;heading=Math.atan2(-(b[0]-p[0]),-(b[1]-p[1]));break}
       d-=segment;
     }
     a.g.position.set(px,ground(Math.round(px),Math.round(pz))+.3,pz);
     a.g.rotation.y=heading;
     // No need to draw tiny traffic objects when player is on another continent.
     a.g.visible=(loc.x-px)**2+(loc.z-pz)**2<130**2;
   }
 }



// CRESCENT COAST: a separately rendered curved terrain world (not a grid of voxel blocks).
const smoothWorld=new T.Group();scene.add(smoothWorld);
const legacyPos=new T.Vector3().copy(loc);
if(directorState.legacyPosition){const p=directorState.legacyPosition;if([p.x,p.y,p.z].every(Number.isFinite))legacyPos.set(p.x,p.y,p.z)}
const coastCraters=Array.isArray(directorState.coastCraters)?directorState.coastCraters:[];
const coastH=(x,z)=>{
 const seaSlope=T.MathUtils.smoothstep(z,43,112);
 const hills=6.5*Math.sin(x*.025+.7)*Math.cos(z*.031)
            +3.6*Math.sin(x*.075+z*.043)
            +2.9*Math.cos(z*.093-x*.052);
 const plateau=11+Math.sin(x*.013+z*.018)*3.6+Math.sin(z*.029)*2.2;
 const residential=Math.max(0,1-Math.max(Math.abs(x-170)/59,Math.abs(z-164)/51));
 const flatten=T.MathUtils.smoothstep(residential,.05,.7);
 const result=3.1+seaSlope*(plateau+hills);
 let height=T.MathUtils.lerp(result,17.5,flatten*.83);
 for(const c of coastCraters){const r=Math.hypot(x-c.x,z-c.z);if(r<c.radius){const w=1-r/c.radius;height-=c.depth*w*w}}
 return height;
};
const coastMaterial=(base,roughness=.86,metalness=0)=>new T.MeshStandardMaterial({color:base,roughness,metalness});
const soilCanvas=document.createElement('canvas');soilCanvas.width=soilCanvas.height=256;
const soilCtx=soilCanvas.getContext('2d');
const soilImg=soilCtx.createImageData(256,256);
for(let yy=0;yy<256;yy++)for(let xx=0;xx<256;xx++){
 const rand=hash(xx*1.89+39,yy*3.29+51),grain=hash(xx*.28+7,yy*.28+9);
 const i=(yy*256+xx)*4,shade=.66+.31*grain+.14*rand;
 soilImg.data[i]=Math.round(116*shade);
 soilImg.data[i+1]=Math.round(132*shade);
 soilImg.data[i+2]=Math.round(88*shade);
 soilImg.data[i+3]=255;
}
soilCtx.putImageData(soilImg,0,0);
const soilTex=new T.CanvasTexture(soilCanvas);
soilTex.colorSpace=T.SRGBColorSpace;soilTex.wrapS=soilTex.wrapT=T.RepeatWrapping;soilTex.repeat.set(36,36);
soilTex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());

 // Texture-space terrain normal map: preserves micro-relief on flat geometry without extra polygons.
 const groundNormalCanvas=document.createElement('canvas');
 groundNormalCanvas.width=groundNormalCanvas.height=256;
 const gn=groundNormalCanvas.getContext('2d'),mapData=gn.createImageData(256,256);
 const altitude=new Float32Array(256*256);
 for(let i=0;i<altitude.length;i++){
   const x=i%256,y=(i/256)|0;
   altitude[i]=.57*hash(x*1.89+39,y*3.29+51)+.3*hash(x*.28+7,y*.28+9)+.13*Math.sin(x*.17)*Math.cos(y*.19);
 }
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const offset=(xx,yy)=>altitude[((yy+256)%256)*256+((xx+256)%256)];
   const dx=offset(x+1,y)-offset(x-1,y),dy=offset(x,y+1)-offset(x,y-1);
   const scale=2.1,inv=1/Math.hypot(dx*scale,dy*scale,1),j=(y*256+x)*4;
   mapData.data[j]=Math.round((-.5*dx*scale*inv+.5)*255);
   mapData.data[j+1]=Math.round((-.5*dy*scale*inv+.5)*255);
   mapData.data[j+2]=Math.round((.5*inv+.5)*255);
   mapData.data[j+3]=255;
 }
 gn.putImageData(mapData,0,0);
 const groundNormal=new T.CanvasTexture(groundNormalCanvas);
 groundNormal.wrapS=groundNormal.wrapT=T.RepeatWrapping;
 groundNormal.repeat.copy(soilTex.repeat);
 groundNormal.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());

const landscapeMat=new T.MeshStandardMaterial({map:soilTex,normalMap:groundNormal,normalScale:new T.Vector2(.48,.48),vertexColors:true,roughness:.94,metalness:0,envMapIntensity:.2});
const terrainGeom=new T.PlaneGeometry(256,256,128,128);
terrainGeom.rotateX(-Math.PI/2);terrainGeom.translate(128,0,128);
const coords=terrainGeom.attributes.position,terrainColors=[];
const grass=new T.Color(0x8cac79),dirt=new T.Color(0xb4a48a),cliff=new T.Color(0x979a90),beach=new T.Color(0xe2d0a5);
for(let i=0;i<coords.count;i++){
 const x=coords.getX(i),z=coords.getZ(i),h=coastH(x,z);
 coords.setY(i,h);
 const du=coastH(Math.min(255,x+1.1),z)-coastH(Math.max(0,x-1.1),z);
 const dv=coastH(x,Math.min(255,z+1.1))-coastH(x,Math.max(0,z-1.1));
 const slope=Math.hypot(du,dv);
 const base= h<8?beach:h>26||slope>2.5?cliff:h<11?dirt:grass;
 const alt=.91+hash(x*3.3,z*3.7)*.2;
 terrainColors.push(base.r*alt,base.g*alt,base.b*alt);
}
terrainGeom.setAttribute('color',new T.Float32BufferAttribute(terrainColors,3));
terrainGeom.computeVertexNormals();
const terra=new T.Mesh(terrainGeom,landscapeMat);terra.receiveShadow=true;smoothWorld.add(terra);
const asphaltCanvas=document.createElement('canvas');asphaltCanvas.width=asphaltCanvas.height=128;
const actx=asphaltCanvas.getContext('2d');
actx.fillStyle='#33373d';actx.fillRect(0,0,128,128);
for(let i=0;i<8000;i++){
 const k=hash(i,22),x=(hash(i*11,4)*128)|0,y=(hash(i*4,7)*128)|0;
 actx.fillStyle=k>.68?'#64676b':k>.34?'#383e43':'#242b31';
 actx.fillRect(x,y,1+k*2,1+k*2);
}
const asphaltTex=new T.CanvasTexture(asphaltCanvas);asphaltTex.colorSpace=T.SRGBColorSpace;
asphaltTex.wrapS=asphaltTex.wrapT=T.RepeatWrapping;asphaltTex.repeat.set(1,14);

 const roadNormalCanvas=document.createElement('canvas');roadNormalCanvas.width=roadNormalCanvas.height=128;
 const anc=roadNormalCanvas.getContext('2d'),nd=anc.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   const a=(dx,dy)=>hash((x+dx+128)*11+2,(y+dy+128)*7+19);
   const nx=a(1,0)-a(-1,0),ny=a(0,1)-a(0,-1),sz=.42;
   const z=1/Math.hypot(nx*sz,ny*sz,1),i=(y*128+x)*4;
   nd.data[i]=(128-nx*sz*z*127)|0;nd.data[i+1]=(128-ny*sz*z*127)|0;
   nd.data[i+2]=(128+z*127)|0;nd.data[i+3]=255;
 }
 anc.putImageData(nd,0,0);
 const roadNormal=new T.CanvasTexture(roadNormalCanvas);
 roadNormal.wrapS=roadNormal.wrapT=T.RepeatWrapping;roadNormal.repeat.copy(asphaltTex.repeat);

const asphalt=new T.MeshStandardMaterial({map:asphaltTex,normalMap:roadNormal,normalScale:new T.Vector2(.34,.34),color:0xd3d5d9,roughness:.8,metalness:.12,envMapIntensity:.64,side:T.DoubleSide});
const marking=new T.MeshBasicMaterial({color:0xffe8aa,side:T.DoubleSide});
const curb=coastMaterial(0xd1c7b4,.83,.05);
const pathLines=[
 [[8,98],[34,104],[59,116],[86,127],[119,133],[145,139],[173,143],[203,151],[234,168],[250,176]],
 [[32,225],[47,194],[69,172],[96,161],[123,147],[148,133],[175,108],[201,87],[231,83]],
 [[28,76],[52,81],[76,88],[99,96],[118,109],[143,119],[172,123],[202,115],[238,117]],
 [[110,234],[122,210],[137,189],[155,167],[177,150],[198,144],[223,137]]
];
const mainRoads=[];
function roadMesh(nodes,width=7){
 const points=nodes.map(([x,z])=>new T.Vector3(x,coastH(x,z)+.22,z));
 const curve=new T.CatmullRomCurve3(points,false,'centripetal');
 const count=nodes.length*22,vertices=[],uv=[],indices=[],lineV=[],lineUV=[],lineI=[];
 for(let i=0;i<=count;i++){
  const t=i/count,p=curve.getPoint(t),v=curve.getTangent(t);
  const normal=new T.Vector3(-v.z,0,v.x).normalize();
  const y=coastH(p.x,p.z)+.36;
  for(const sign of [-1,1]){
    vertices.push(p.x+normal.x*width*.5*sign,y,p.z+normal.z*width*.5*sign);
    uv.push(sign<0?0:1,t*nodes.length*4);
  }
  const markWidth=.09;
  for(const sign of [-1,1]){
    lineV.push(p.x+normal.x*markWidth*sign,y+.015,p.z+normal.z*markWidth*sign);
    lineUV.push(sign<0?0:1,t);
  }
  if(i<count){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);if(i%16<10)lineI.push(a,a+2,a+1,a+1,a+2,a+3)}
 }
 const makeMesh=(p,tex,ix,m)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(tex,2));g.setIndex(ix);g.computeVertexNormals();const o=new T.Mesh(g,m);smoothWorld.add(o);return o};
 makeMesh(vertices,uv,indices,asphalt);
 makeMesh(lineV,lineUV,lineI,marking);
 mainRoads.push({curve,width,count});
}
for(const path of pathLines)roadMesh(path,path===pathLines[1]?8:7);
const roadFurnitureMat=coastMaterial(0x33404b,.38,.74),warmLamp=new T.MeshBasicMaterial({color:0xffdda0,toneMapped:false});
const baseBox=new T.BoxGeometry(1,1,1);
const placeBox=(group,w,h,d,mat,x,y,z)=>{
 const m=new T.Mesh(baseBox,mat);m.position.set(x,y,z);m.scale.set(w,h,d);group.add(m);return m;
};
// Premium coastal village, glass-front apartments, architecture and covered terraces.
const glassFront=new T.MeshPhysicalMaterial({color:0xa2c7db,roughness:.09,metalness:.15,transparent:true,opacity:.75,depthWrite:false,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.8});
const whiteWalls=coastMaterial(0xece6da,.71),warmWalls=coastMaterial(0xb09d89,.84),roofMat=coastMaterial(0x42474f,.52,.2);
const promenadeBuildings=[],coastWindowMatrices=[];
for(let i=0;i<32;i++){
 const a=i%16,row=Math.floor(i/16);
 const px=106+(a%8)*17+(row?4:0),pz=row?197:177;
 const py=coastH(px,pz),height=7+Math.floor(hash(i*13,99)*22);
 const g=new T.Group();g.position.set(px,py,pz);smoothWorld.add(g);
 const width=9+hash(i,12)*3,depth=10+hash(i,11)*4;
 placeBox(g,width,height,depth,i%3===0?warmWalls:whiteWalls,0,height/2,0);
 placeBox(g,width+1,.65,depth+1,roofMat,0,height+.15,0);
 for(let floor=2;floor<height-1;floor+=2.8)for(const side of [-1,1]){
  for(let wx=-3.5;wx<=3.5;wx+=2.3){
   coastWindowMatrices.push([px+wx,py+floor,pz+side*(depth/2+.065),1.18,1.65,.08]);
   if(i%5===0)placeBox(g,1.28,.08,.22,roofMat,wx,floor-1,side*(depth/2+.17))
  }
 }
 if(i%4===0)placeBox(g,width*.74,.4,2,roofMat,0,height*.58,depth/2+1);
 promenadeBuildings.push(g);
}
const coastWindows=new T.InstancedMesh(baseBox,glassFront,coastWindowMatrices.length);
const windowDummy=new T.Object3D();
for(let i=0;i<coastWindowMatrices.length;i++){
 const [x,y,z,w,h,d]=coastWindowMatrices[i];
 windowDummy.position.set(x,y,z);windowDummy.scale.set(w,h,d);windowDummy.rotation.set(0,0,0);windowDummy.updateMatrix();
 coastWindows.setMatrixAt(i,windowDummy.matrix);
}
coastWindows.instanceMatrix.needsUpdate=true;smoothWorld.add(coastWindows);
// Instanced vegetation uses just a few draw calls and natural height/slope tests.
const treeCount=mobile?240:420;
const trunkMat=coastMaterial(0x6b5643,.99),leavesMat=coastMaterial(0x527d58,.99);
const trunkGeo=new T.CylinderGeometry(.15,.3,3.2,6);
const crownGeo=new T.IcosahedronGeometry(1.8,1);
const trunks=new T.InstancedMesh(trunkGeo,trunkMat,treeCount),crowns=new T.InstancedMesh(crownGeo,leavesMat,treeCount);
const dummy=new T.Object3D();
for(let i=0;i<treeCount;i++){
 let x=3+hash(i*7,23)*250,z=14+hash(i*13,89)*237;
 if(z<98)z+=68;
 if(x>104&&x<231&&z>169&&z<214)z=70+hash(i,2)*20;
 const h=coastH(x,z),alt=.7+hash(i,51)*.75;
 dummy.position.set(x,h+1.8*alt,z);dummy.scale.set(alt,alt,alt);dummy.rotation.y=i*.39;dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
 dummy.position.y=h+4.15*alt;dummy.scale.set(alt,alt*.86,alt);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);
}
trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;smoothWorld.add(trunks,crowns);
// Pier and marina: smooth decks, reflective roof, boats and spotlights.
const marina=new T.Group();smoothWorld.add(marina);
for(let j=0;j<7;j++){
 const z=47+j*7;placeBox(marina,36,.55,3.6,curb,170,9.35,z);
 for(const x of [153,169,187]){
  placeBox(marina,.42,7,.42,roadFurnitureMat,x,5.8,z);
 }
}
for(let j=0;j<9;j++){
 const g=new T.Group();g.position.set(156+(j%3)*13,9.4,49+Math.floor(j/3)*16);marina.add(g);
 const hull=new T.Mesh(new T.SphereGeometry(1,12,8),j%2?whiteWalls:roofMat);hull.scale.set(1.35,.53,3.8);g.add(hull);
 placeBox(g,1.5,.9,1.4,glassFront,0,.75,-.4);
 placeBox(g,.09,2,.09,roadFurnitureMat,.1,1.8,.6);
}
// Standalone curved suspension bridge over inlet, with slender posts and cable arcs.
const bridgeMat=coastMaterial(0x455864,.5,.65);
const bridge=new T.Group();smoothWorld.add(bridge);
const bridgeCurve=new T.CatmullRomCurve3([new T.Vector3(70,14,86),new T.Vector3(86,14.2,73),new T.Vector3(104,14.8,62),new T.Vector3(123,15.5,53)],false,'centripetal');
const bridgePath=[];
for(let i=0;i<45;i++){
 const p=bridgeCurve.getPoint(i/44);bridgePath.push(p);
 placeBox(bridge,5.7,.48,1.45,bridgeMat,p.x,p.y,p.z);
 if(i%7===0){placeBox(bridge,.17,6,.17,roadFurnitureMat,p.x,p.y+3,p.z);placeBox(bridge,.35,.3,.35,warmLamp,p.x,p.y+6,p.z)}
}
const coastTraffic=[];
for(let i=0;i<11;i++){
 const g=new T.Group();smoothWorld.add(g);
 const bodyMat=coastMaterial([0x314e61,0x9b4546,0xe8e3d7,0x3f8287,0xc9a16e][i%5],.26,.62);
 placeBox(g,1.55,.38,3.3,bodyMat,0,.53,0);
 placeBox(g,1.28,.57,1.57,glassFront,0,1.02,-.31);
 for(const xx of [-.83,.83])for(const zz of [-1.05,1.13]){
  const wheel=new T.Mesh(new T.CylinderGeometry(.32,.32,.2,12),roadFurnitureMat);wheel.rotation.z=Math.PI/2;wheel.position.set(xx,.37,zz);g.add(wheel)
 }
 coastTraffic.push({g,path:mainRoads[i%mainRoads.length],phase:i*.17,speed:4.3+i*.3});
}
const coastHeadlight=new T.PointLight(0xffdaa3,4,36);coastHeadlight.position.set(163,24,173);smoothWorld.add(coastHeadlight);
const coastMeshes=smoothWorld.children.length;
function animateCoast(dt,t){
 for(const c of coastTraffic){
  const time=(t*c.speed/c.path.curve.getLength()+c.phase)%1;
  const p=c.path.curve.getPoint(time),dir=c.path.curve.getTangent(time);
  c.g.position.set(p.x,coastH(p.x,p.z)+.38,p.z);
  c.g.rotation.y=Math.atan2(-dir.x,-dir.z);
 }
 coastHeadlight.intensity=weather==='night'?18:3;
}
function setMap(mode,initial=false){
 const coast=mode!=='voxel';newMapActive=coast;directorState.activeMap=coast?'crescent':'voxel';
 smoothWorld.visible=coast;
 if(typeof trafficRoot!=='undefined')trafficRoot.visible=!coast;
 if(typeof geoGroups!=='undefined'){
  for(const old of geoGroups.values())old.visible=!coast;
 }
 if(!initial){
  if(riding)endFlight();
  if(coast){legacyPos.copy(loc);directorState.legacyPosition={x:loc.x,y:loc.y,z:loc.z};loc.set(45,coastH(45,113)+2.4,113)}
  else{if(directorState.legacyPosition){const p=directorState.legacyPosition;legacyPos.set(p.x,p.y,p.z)}loc.copy(legacyPos)};
  velY=0;requestChunks(loc.x,loc.z);streamChunks(coast?0:3);
  notify(coast?'CRESCENT COAST · smooth terrain & scenic roads':'VOXEL LEGACY · mining restored');
 }else if(coast){loc.set(45,coastH(45,113)+2.4,113)}
 const name=root.querySelector('.vxSub');if(name)name.textContent=coast?'CRESCENT COAST · CURVED ROADS · REALISTIC MATERIALS':'LEGACY VOXEL WORLD · MINING · BUILDING';
 if(typeof flightButtons==='function')flightButtons();
}
smoothWorld.visible=newMapActive;
if(newMapActive){
  if(directorState.activeMap==='crescent'&&savedPosition){
    loc.x=T.MathUtils.clamp(loc.x,2,254);loc.z=T.MathUtils.clamp(loc.z,2,254);
    loc.y=Math.max(coastH(loc.x,loc.z)+2.3,loc.y);
  }else loc.set(45,coastH(45,113)+2.4,113);
}
directorState.activeMap=newMapActive?'crescent':'voxel';

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

 // V6 layered Gerstner-inspired surface: vertex displacement + analytic normals,
 // Fresnel, multi-lobe sun glints and crest foam — shader keeps running at every quality.
 const oceanMat=new T.ShaderMaterial({
  transparent:false,depthWrite:true,side:T.DoubleSide,
  uniforms:{
   time:{value:0},deep:{value:new T.Color('#123d5e')},
   shallow:{value:new T.Color('#3ea7a4')},storm:{value:0},
   night:{value:0},lightDir:{value:new T.Vector3(-.52,.72,.55).normalize()}
  },
  vertexShader:`uniform float time,storm;
varying vec3 wp,wn;
varying float crest;
void main(){
 vec4 p=modelMatrix*vec4(position,1.);
 float x=p.x,z=p.z;
 float w1=x*.15+time*.86+sin(z*.093);
 float w2=z*.32-time*.68+x*.04;
 float w3=(x+z)*.53+time*1.36;
 float h=sin(w1)*.23+sin(w2)*.13+sin(w3)*.05;
 float dx=cos(w1)*.15*.23+cos(w2)*.04*.13+cos(w3)*.53*.05;
 float dz=cos(w1)*cos(z*.093)*.093*.23+cos(w2)*.32*.13+cos(w3)*.53*.05;
 float strength=1.+storm*.85;
 p.y+=h*strength;
 wn=normalize(vec3(-dx*strength,1.,-dz*strength));
 wp=p.xyz;crest=smoothstep(.18,.37,h*strength);
 gl_Position=projectionMatrix*viewMatrix*p;
}`,
  fragmentShader:`uniform vec3 deep,shallow,lightDir;
uniform float time,storm,night;
varying vec3 wp,wn;
varying float crest;
void main(){
 vec3 n=normalize(wn),v=normalize(cameraPosition-wp);
 float ndv=max(dot(n,v),0.);
 float fres=pow(1.-ndv,4.);
 float high=pow(max(dot(reflect(-lightDir,n),v),0.),115.);
 float low=pow(max(dot(reflect(-lightDir,n),v),0.),22.);
 float ripple=sin(wp.x*.88+time*2.1)*sin(wp.z*1.2-time*1.3)*.5+.5;
 vec3 col=mix(deep,shallow,.22+fres*.55+ripple*.065);
 col+=vec3(1.,.88,.68)*(high*1.65+low*.32)*(1.-night*.85);
 float foam=crest*(.14+.24*ripple);
 col+=vec3(.73,.95,1.)*foam*(.6+storm*.8);
 col*=1.-night*.6;
 gl_FragColor=vec4(col,1.);
}`
 });
 const distantWater=new T.Mesh(new T.PlaneGeometry(2000,2000,1,1),oceanMat);distantWater.rotation.x=-Math.PI/2;distantWater.position.set(32,SEA+.86,32);scene.add(distantWater);

 // Fine grid only near the coast, large ocean beyond uses a single cheap quad.
 const coastalWater=new T.Mesh(new T.PlaneGeometry(355,355,84,84),oceanMat);
 coastalWater.rotation.x=-Math.PI/2;
 coastalWater.position.set(127,SEA+.955,127);scene.add(coastalWater);

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
 
 const chunkRadius={value:3},chunkQueue=[],chunkPending=new Set();
 function requestChunks(px,pz){
   if(newMapActive){
     chunkQueue.length=0;chunkPending.clear();
     for(const [key,old] of geoGroups){scene.remove(old);old.traverse(o=>o.geometry?.dispose());geoGroups.delete(key)}
     return;
   }
   const cx=Math.max(0,Math.min(SIZE/CHUNK-1,Math.floor(px/CHUNK)));
   const cz=Math.max(0,Math.min(SIZE/CHUNK-1,Math.floor(pz/CHUNK)));
   const wanted=new Set(),tasks=[];
   for(let dx=-chunkRadius.value;dx<=chunkRadius.value;dx++)for(let dz=-chunkRadius.value;dz<=chunkRadius.value;dz++){
     const x=cx+dx,z=cz+dz;
     if(x<0||z<0||x>=SIZE/CHUNK||z>=SIZE/CHUNK)continue;
     const key=x+':'+z;wanted.add(key);
     if(!geoGroups.has(key)&&!chunkPending.has(key))tasks.push({x,z,key,d:dx*dx+dz*dz});
   }
   tasks.sort((a,b)=>a.d-b.d);
   for(const t of tasks){chunkQueue.push(t);chunkPending.add(t.key)}
   for(const [key,old] of geoGroups){
     if(wanted.has(key))continue;
     scene.remove(old);old.traverse(o=>{if(o.geometry)o.geometry.dispose()});
     geoGroups.delete(key);
   }
   for(let i=chunkQueue.length-1;i>=0;i--)if(!wanted.has(chunkQueue[i].key)){chunkPending.delete(chunkQueue[i].key);chunkQueue.splice(i,1)}
 }
 function streamChunks(max=2){
   if(newMapActive)return;
   for(let n=0;n<max&&chunkQueue.length;n++){
     const t=chunkQueue.shift();chunkPending.delete(t.key);
     if(!geoGroups.has(t.key))chunkMesh(t.x,t.z);
   }
 }
 requestChunks(32.5,32.5);
 streamChunks(mobile?2:5);

 function updateAt(x,z){
  const pairs=[[Math.floor(x/CHUNK),Math.floor(z/CHUNK)]];
  if(x%CHUNK===0)pairs.push([Math.floor(x/CHUNK)-1,Math.floor(z/CHUNK)]);
  if(x%CHUNK===CHUNK-1)pairs.push([Math.floor(x/CHUNK)+1,Math.floor(z/CHUNK)]);
  if(z%CHUNK===0)pairs.push([Math.floor(x/CHUNK),Math.floor(z/CHUNK)-1]);
  if(z%CHUNK===CHUNK-1)pairs.push([Math.floor(x/CHUNK),Math.floor(z/CHUNK)+1]);
  for(const [cx,cz] of pairs)if(cx>=0&&cz>=0&&cx<SIZE/CHUNK&&cz<SIZE/CHUNK&&geoGroups.has(cx+':'+cz))chunkMesh(cx,cz);
 }

 // REALITY ENGINE: edits are grouped by chunk for major world-changing events.
 const dirty=new Set();
 function editWorld(x,y,z,b){
  x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);
  if(!inb(x,y,z)||b===get(x,y,z))return;
  put(x,y,z,b);changes.set(x+','+y+','+z,b);
  dirty.add(Math.floor(x/CHUNK)+':'+Math.floor(z/CHUNK));
  if(x%CHUNK===0)dirty.add((Math.floor(x/CHUNK)-1)+':'+Math.floor(z/CHUNK));
  if(x%CHUNK===CHUNK-1)dirty.add((Math.floor(x/CHUNK)+1)+':'+Math.floor(z/CHUNK));
  if(z%CHUNK===0)dirty.add(Math.floor(x/CHUNK)+':'+(Math.floor(z/CHUNK)-1));
  if(z%CHUNK===CHUNK-1)dirty.add(Math.floor(x/CHUNK)+':'+(Math.floor(z/CHUNK)+1));
 }
 function flushWorld(){
  for(const item of dirty){const [cx,cz]=item.split(':').map(Number);if(cx>=0&&cz>=0&&cx<SIZE/CHUNK&&cz<SIZE/CHUNK&&geoGroups.has(item))chunkMesh(cx,cz)}
  dirty.clear();
 }
 function surfaceAt(x,z){
  x=Math.floor(x);z=Math.floor(z);
  for(let y=Y-2;y>=0;y--){const b=get(x,y,z);if(b&&b!==6&&b!==7&&b!==9&&b!==10)return y}
  return SEA;
 }
 // Autonomous actors — decisions are repeated, not a prewritten animation route.
 const citizens=[],creatureBody=new T.MeshStandardMaterial({color:0xb8a3cb,roughness:.84}),
       skin=new T.MeshStandardMaterial({color:0xdab596,roughness:.93}),
       uniform=new T.MeshStandardMaterial({color:0x447f94,roughness:.83}),
       darkEyes=new T.MeshStandardMaterial({color:0x25313b,roughness:.84});
 const npcRoles=['BUILDER','SCOUT','FORAGER','ENGINEER','EXPLORER','FARMER','GUARD','RESEARCHER'];
 function npcCube(p,m,w,h,d,x,y,z){
   const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p.add(o);return o;
 }
 function makeCitizen(i){
   const g=new T.Group();scene.add(g);
   npcCube(g,i%3?uniform:creatureBody,.58,.86,.34,0,.96,0);
   npcCube(g,skin,.48,.47,.47,0,1.63,-.03);
   const eyes=npcCube(g,darkEyes,.3,.065,.04,0,1.71,-.286);
   const limbs=[];
   for(const x of [-.19,.19])limbs.push(npcCube(g,uniform,.18,.68,.2,x,.31,0));
   for(const x of [-.42,.42])limbs.push(npcCube(g,skin,.17,.73,.18,x,.94,0));
   const originX=i<8?17+i*2.2:128+(i%6)*10,originZ=i<8?35+(i%3)*2:134+Math.floor((i-8)/6)*15;
   const a={id:i,g,limbs,x:originX,z:originZ,v:0,goalX:originX+2,goalZ:originZ-3,role:npcRoles[i%npcRoles.length],
     wood:0,stone:0,work:0,panic:0,think:0,bob:0};
   citizens.push(a);
 }
 for(let i=0;i<(mobile?16:22);i++)makeCitizen(i);
 const citySite={x:18,z:39}; // Existing founding town; metropolis is at 160,160.
 function buildHouse(cx,cz,wide=5){
   cx=Math.round(cx);cz=Math.round(cz);
   const sy=Math.min(Y-8,Math.max(SEA+2,surfaceAt(cx,cz)+1)),half=Math.floor(wide/2);
   for(let x=cx-half;x<=cx+half;x++)for(let z=cz-half;z<=cz+half;z++){
     for(let y=sy-3;y<=sy;y++)if(get(x,y,z)===0||get(x,y,z)===10)editWorld(x,y,z,8);
     editWorld(x,sy,z,12);
     for(let y=sy+1;y<=sy+5;y++)editWorld(x,y,z,0);
     for(let y=sy+1;y<=sy+4;y++){
       const wall=x===cx-half||x===cx+half||z===cz-half||z===cz+half;
       if(!wall)continue;
       const door=z===cz+half&&x===cx&&y<=sy+2;
       const window=y===sy+3&&((x===cx-half||x===cx+half)&&z===cz);
       if(!door)editWorld(x,y,z,window?7:12);
     }
     editWorld(x,sy+5,z,8);
   }
   editWorld(cx,sy+4,cz+half,9);
   directorState.structures++;
 }
 function makeSettlement(){
   if(directorState.town){return false}
   // Build on the western plateau, never overwrite the central spawn.
   for(let x=9;x<=29;x++)for(let z=32;z<=52;z++){
     const y=surfaceAt(x,z);
     for(let yy=y+1;yy<Math.min(Y,y+9);yy++)if(get(x,yy, z)!==0)editWorld(x,yy,z,0);
   }
   for(let z=33;z<=52;z++)for(let x=18;x<=20;x++){const y=surfaceAt(x,z);editWorld(x,y,z,8)}
   for(let x=9;x<=28;x++)for(let z=40;z<=42;z++){const y=surfaceAt(x,z);editWorld(x,y,z,8)}
   for(const [x,z] of [[13,36],[25,36],[13,48],[25,48]])buildHouse(x,z,5);
   for(let z=33;z<=52;z+=4){const h=surfaceAt(21,z);if(h+1<Y)editWorld(21,h+1,z,9)}
   directorState.town=true;directorState.events++;flushWorld();
   return true;
 }
 function buildersProgress(){
   if(!directorState.town)return;
   const eligible=citizens.filter(c=>c.role==='BUILDER'||c.role==='ENGINEER');
   const sum=eligible.reduce((v,n)=>v+n.work,0);
   if(sum>10&&directorState.structures<10){
     const i=directorState.structures;
     const spots=[[16,29],[28,48],[11,27],[27,29],[9,52],[29,53]];
     const p=spots[i-4];if(p) {buildHouse(p[0],p[1],5);flushWorld()}
     for(const n of eligible)n.work=0;
   }
 }
 // A giant mysterious glowing monolith provides an immediate cinematic landmark.
 const relic=new T.Group();scene.add(relic);relic.position.set(37,ground(37,17)+1,17);
 const relicStone=new T.MeshStandardMaterial({color:0x1c3546,metalness:.76,roughness:.25});
 const relicGlow=new T.MeshBasicMaterial({color:0x70f4e4,toneMapped:false});
 const relicBody=new T.Mesh(new T.BoxGeometry(4.8,14,2),relicStone);relicBody.position.y=7;relic.add(relicBody);
 for(const x of [-2,0,2]){const line=new T.Mesh(new T.BoxGeometry(.08,11,.15),relicGlow);line.position.set(x,7,1.06);relic.add(line)}
 const relicHalo=new T.Mesh(new T.TorusGeometry(4.9,.085,8,85),relicGlow);relicHalo.position.y=14;relic.add(relicHalo);
 // Falling meteor and impact visuals, with real block destruction.
 const meteorGroup=new T.Group();scene.add(meteorGroup);meteorGroup.visible=false;
 const meteorCore=new T.Mesh(new T.IcosahedronGeometry(2,2),new T.MeshBasicMaterial({color:0xff9a36,toneMapped:false}));meteorGroup.add(meteorCore);
 const meteorShell=new T.Mesh(new T.IcosahedronGeometry(3,1),new T.MeshBasicMaterial({color:0xff4d13,wireframe:true,transparent:true,opacity:.7,depthWrite:false}));meteorGroup.add(meteorShell);
 const meteorLamp=new T.PointLight(0xff7127,9,70);meteorGroup.add(meteorLamp);
 const impactFx=new T.Group();scene.add(impactFx);impactFx.visible=false;
 const impactRing=new T.Mesh(new T.RingGeometry(1,1.2,48),new T.MeshBasicMaterial({color:0xffb359,transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}));
 impactRing.rotation.x=-Math.PI/2;impactFx.add(impactRing);
 let meteor=null,impactAge=0,panicPoint=null,quake=0,daytime=0;
 function startMeteor(){
   if(meteor){return false}
   const tx=T.MathUtils.clamp(Math.floor(loc.x+Math.sin(yaw)*12),8,SIZE-9);
   const tz=T.MathUtils.clamp(Math.floor(loc.z-Math.cos(yaw)*12),8,SIZE-9);
   const ty=newMapActive?coastH(tx,tz):surfaceAt(tx,tz);
   meteor={x:tx,z:tz,y:ty+1,age:0};
   meteorGroup.visible=true;
   meteorGroup.position.set(tx-24,ty+65,tz-19);directorState.events++;return true;
 }
 function impact(){
   if(!meteor)return;
   const {x:cx,z:cz,y:cy}=meteor;
   if(newMapActive){
     const crater={x:cx,z:cz,radius:10,depth:6};
     coastCraters.push(crater);directorState.coastCraters=coastCraters;
     for(let j=0;j<coords.count;j++){const x=coords.getX(j),z=coords.getZ(j);if(Math.hypot(x-cx,z-cz)<12)coords.setY(j,coastH(x,z))}
     coords.needsUpdate=true;terrainGeom.computeVertexNormals();
     meteorGroup.visible=false;meteor=null;impactAge=0;impactFx.visible=true;impactFx.position.set(cx,cy+.2,cz);
     impactRing.scale.setScalar(.2);panicPoint={x:cx,z:cz};quake=1;
     directorState.craters++;directorState.events++;for(const c of citizens)c.panic=12;
     return;
   }

   for(let x=cx-7;x<=cx+7;x++)for(let z=cz-7;z<=cz+7;z++){
     const rad=Math.hypot(x-cx,z-cz);
     if(rad>7||x<1||z<1||x>=SIZE-1||z>=SIZE-1)continue;
     const current=surfaceAt(x,z);
     const depth=Math.max(0,Math.round((7-rad)*.95));
     for(let y=Math.max(1,current-depth+1);y<Y;y++)if(get(x,y,z)!==0)editWorld(x,y,z,0);
     if(rad>5&&current+1<Y&&Math.random()>.72)editWorld(x,current+1,z,11);
     if(rad<3&&current-depth>1)editWorld(x,current-depth,z,11);
   }
   flushWorld();
   meteorGroup.visible=false;meteor=null;impactAge=0;
   impactFx.visible=true;impactFx.position.set(cx,cy+.1,cz);impactRing.scale.setScalar(.2);
   panicPoint={x:cx,z:cz};quake=1;directorState.craters++;directorState.events++;
   for(const c of citizens)c.panic=12;
 }
 function advancePopulation(dt,t){
   for(const a of citizens){
     a.g.visible=!newMapActive;
     a.think-=dt;a.bob+=dt;
     if(a.think<=0){
       a.think=1.8+hash(a.id+Math.floor(t),a.id*33)*3;
       if(a.panic>0&&panicPoint){
         const away=new T.Vector2(a.x-panicPoint.x,a.z-panicPoint.z).normalize();
         a.goalX=a.x+away.x*10;a.goalZ=a.z+away.y*10;
       }else if(directorState.town&&a.role==='BUILDER'){
         a.goalX=citySite.x+Math.sin(t*.14+a.id)*7;a.goalZ=citySite.z+Math.cos(t*.18+a.id)*8;
         a.work++;a.wood++;a.stone++;
       }else{
         a.goalX=T.MathUtils.clamp(a.x+(hash(a.id+Math.floor(t),a.id)-.5)*19,4,60);
         a.goalZ=T.MathUtils.clamp(a.z+(hash(a.id*7,Math.floor(t))-.5)*19,4,60);
         if(a.role==='FORAGER')a.wood++;
         if(a.role==='ENGINEER')a.work++;
       }
     }
     a.panic=Math.max(0,a.panic-dt);
     const dx=a.goalX-a.x,dz=a.goalZ-a.z,length=Math.hypot(dx,dz);
     if(length>.4){const speed=a.panic>0?3.9:1.4;a.x+=dx/length*speed*dt;a.z+=dz/length*speed*dt;a.g.rotation.y=-Math.atan2(dx,dz)}
     a.x=T.MathUtils.clamp(a.x,2,SIZE-3);a.z=T.MathUtils.clamp(a.z,2,SIZE-3);
     a.g.position.set(a.x,surfaceAt(a.x,a.z)+1+Math.sin(a.bob*6)*.05,a.z);
     const stride=Math.min(1,length);
     for(let i=0;i<a.limbs.length;i++)a.limbs[i].rotation.x=Math.sin(a.bob*7+i*Math.PI)*.45*stride;
   }
 }
 function advanceDirector(dt,t){
   relicHalo.rotation.z=t*.19;relicHalo.position.y=14+Math.sin(t*.8)*.25;
   advancePopulation(dt,t);
   if(meteor){
     meteor.age+=dt;const p=Math.min(1,meteor.age/3.5);
     meteorGroup.position.set(meteor.x-24*(1-p),meteor.y+65*(1-p),meteor.z-19*(1-p));
     meteorCore.rotation.y=t*3;meteorShell.rotation.x=t*2;
     if(p>=1)impact();
   }
   if(impactFx.visible){
     impactAge+=dt;impactRing.scale.setScalar(1+impactAge*7);impactRing.material.opacity=Math.max(0,1-impactAge/2.1);
     if(impactAge>2.1)impactFx.visible=false;
   }
   quake=Math.max(0,quake-dt*.75);
   daytime+=dt;
   if(Math.floor(daytime/100)+1!==directorState.day)directorState.day=Math.floor(daytime/100)+1;
 }


 // SKYRIDER: a pilotable hybrid VTOL craft, rather than a decorative spawn.
 const craftGroup=new T.Group();scene.add(craftGroup);
 const craftBody=new T.Group();craftGroup.add(craftBody);
 const alloy=new T.MeshPhysicalMaterial({color:0xd7e8e9,metalness:.7,roughness:.19,clearcoat:1});
 const midnight=new T.MeshPhysicalMaterial({color:0x1c364b,metalness:.81,roughness:.19,clearcoat:1});
 const luminous=new T.MeshBasicMaterial({color:0x68f0ff,toneMapped:false});
 const glassCab=new T.MeshPhysicalMaterial({color:0x56b9d9,transparent:true,opacity:.67,metalness:.28,roughness:.09,depthWrite:false,clearcoat:1});
 const craftMesh=(g,m,x,y,z)=>{const a=new T.Mesh(g,m);a.position.set(x,y,z);craftBody.add(a);return a};
 const craftBox=(w,h,d,m,x,y,z)=>craftMesh(new T.BoxGeometry(w,h,d),m,x,y,z);
 const hull=craftMesh(new T.SphereGeometry(1,20,14),alloy,0,0,0);hull.scale.set(1.15,.55,2.85);
 const nose=craftMesh(new T.SphereGeometry(1,20,12),midnight,0,.36,-.8);nose.scale.set(.88,.52,1.15);
 const roof=craftMesh(new T.SphereGeometry(1,20,12),glassCab,0,.53,-.98);roof.scale.set(.83,.46,.92);
 for(const xx of [-1,1]){
   const wing=craftBox(2.35,.17,1.9,alloy,xx*2,-.08,.15);wing.rotation.y=xx*.13;
   const pod=craftMesh(new T.CylinderGeometry(.37,.45,2.25,16),midnight,xx*2.7,-.07,.33);pod.rotation.x=Math.PI/2;
   const exhaust=craftMesh(new T.CylinderGeometry(.3,.3,.045,16),luminous,xx*2.7,-.07,1.46);exhaust.rotation.x=Math.PI/2;
   const beacon=craftMesh(new T.SphereGeometry(.1,8,7),luminous,xx*2.95,.09,-.52);
 }
 craftBox(.19,.88,1.25,midnight,0,.52,2.2);
 craftBox(3,.09,.48,alloy,0,.36,2.27);
 const thruster=new T.PointLight(0x3ffff2,2,11);craftBody.add(thruster);thruster.position.set(0,-.15,1.8);
 const craftState={x:loc.x,y:loc.y+7,z:loc.z,heading:yaw,speed:0,climb:0,bank:0};
 let riding=!!directorState.riding,flightLift=0,flightOrbit=0,flightPitch=.12;
 if(directorState.flight&&riding){const f=directorState.flight;for(const k of ['x','y','z','heading','speed'])if(Number.isFinite(f[k]))craftState[k]=f[k]}
 craftGroup.visible=!!directorState.hasVehicle||riding;
 craftGroup.position.set(craftState.x,craftState.y,craftState.z);

 // V4 vehicle garage — 5 distinct, flyable/drivable models in a shared controller.
 const vehicleModels={skyrider:craftBody};
 // Reflected environment stays active across all visual quality levels.
 const vMats={
  blue:new T.MeshPhysicalMaterial({color:0x196986,metalness:.79,roughness:.21,clearcoat:1}),
  orange:new T.MeshPhysicalMaterial({color:0xf28d44,metalness:.56,roughness:.31,clearcoat:1}),
  red:new T.MeshPhysicalMaterial({color:0xa52b48,metalness:.7,roughness:.2,clearcoat:1}),
  black:new T.MeshStandardMaterial({color:0x17272f,metalness:.45,roughness:.36}),
  glass:new T.MeshPhysicalMaterial({color:0x65cee5,metalness:.21,roughness:.09,transparent:true,opacity:.64,depthWrite:false,clearcoat:1}),
  glow:new T.MeshBasicMaterial({color:0x6dfff3,toneMapped:false})
 };
 const meshV=(g,m,x,y,z,p)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o};
 const bx=(w,h,d,m,x,y,z,p)=>meshV(new T.BoxGeometry(w,h,d),m,x,y,z,p);
 const sp=(a,b,c,m,x,y,z,p)=>{const o=meshV(new T.SphereGeometry(1,20,12),m,x,y,z,p);o.scale.set(a,b,c);return o};
 const cy=(r,h,m,x,y,z,p)=>meshV(new T.CylinderGeometry(r,r,h,14),m,x,y,z,p);
 const vehicleParts={wheels:[],mainRotor:null,tailRotor:null,jetThrusters:[]};
 // Helicopter HAWK H-21: aerodynamic fuselage, enclosed cockpit and landing skids.
 const heli=new T.Group();craftGroup.add(heli);vehicleModels.helicopter=heli;
 sp(1.02,.73,2.65,vMats.blue,0,.1,0,heli);
 sp(.93,.64,1.25,vMats.glass,0,.35,-1.21,heli);
 bx(.35,.36,5.9,vMats.blue,0,.26,3.76,heli);
 bx(2.6,.09,1.0,vMats.orange,0,.42,5.7,heli);
 bx(.15,1.22,.75,vMats.orange,0,.91,6.25,heli);
 for(const x of [-.86,.86]){
  bx(.11,.12,4.4,vMats.black,x,-1.03,-.18,heli);
  bx(.095,.78,.15,vMats.black,x,-.66,-1.3,heli);
  bx(.095,.78,.15,vMats.black,x,-.66,.95,heli);
  cy(.22,.9,vMats.black,x*.72,.64,.77,heli).rotation.x=Math.PI/2;
 }
 bx(1.3,.2,1.1,vMats.black,0,.94,.05,heli);
 const rotor=new T.Group();rotor.position.y=1.52;heli.add(rotor);
 for(let i=0;i<5;i++){
  const a=i*Math.PI*2/5;const o=bx(.34,.048,4.9,vMats.black,-2.43*Math.sin(a),0,-2.43*Math.cos(a),rotor);o.rotation.y=a;
 }
 vehicleParts.mainRotor=rotor;
 const rearRotor=new T.Group();rearRotor.position.set(-.2,1.05,6.15);heli.add(rearRotor);
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2;const o=bx(.08,1.45,.11,vMats.black,0,.72*Math.cos(a),.72*Math.sin(a),rearRotor);o.rotation.x=a;
 }vehicleParts.tailRotor=rearRotor;
 // Interceptor jet: narrow fuselage, swept wings, twin illuminated engines.
 const jet=new T.Group();craftGroup.add(jet);vehicleModels.jet=jet;
 sp(.83,.52,3.1,vMats.red,0,.07,-.15,jet);
 sp(.59,.37,1.25,vMats.glass,0,.43,-1.28,jet);
 for(const sign of [-1,1]){
  const wing=bx(3.7,.12,1.8,vMats.red,sign*2.15,-.12,.65,jet);wing.rotation.y=sign*.27;
  const stab=bx(1.55,.11,.79,vMats.orange,sign*1,.09,2.22,jet);stab.rotation.y=sign*.2;
  const ex=cy(.36,1.2,vMats.black,sign*.57,-.18,2.15,jet);ex.rotation.x=Math.PI/2;
  const flame=sp(.28,.28,.7,vMats.glow,sign*.57,-.18,2.99,jet);vehicleParts.jetThrusters.push(flame);
 }
 bx(.17,1.28,.83,vMats.red,0,.65,2.29,jet);
 // Dune buggy: roll cage, real rotating wheels, headlamps.
 const buggy=new T.Group();craftGroup.add(buggy);vehicleModels.buggy=buggy;
 bx(1.55,.44,3.0,vMats.orange,0,.34,0,buggy);
 bx(1.15,.46,.94,vMats.black,0,.69,-.16,buggy);
 bx(1.44,.18,1.3,vMats.orange,0,1.22,-.25,buggy);
 for(const x of [-1,1])for(const z of [-1.1,1.1]){
  const wheel=cy(.51,.31,vMats.black,x*.96,.27,z,buggy);wheel.rotation.z=Math.PI/2;
  vehicleParts.wheels.push(wheel);
 }
 for(const x of [-.5,.5])sp(.14,.13,.13,vMats.glow,x,.46,-1.56,buggy);
 // Hoverbike: floating magnetic chassis and glowing anti-grav skids.
 const bike=new T.Group();craftGroup.add(bike);vehicleModels.hoverbike=bike;
 sp(.48,.36,2.26,vMats.blue,0,.33,0,bike);
 bx(1.25,.18,1.3,vMats.orange,0,.45,.28,bike);
 sp(.55,.28,.73,vMats.glass,0,.71,-.75,bike);
 for(const x of [-.8,.8]){bx(.29,.13,1.9,vMats.black,x,-.1,.45,bike);sp(.25,.14,.75,vMats.glow,x,-.18,.55,bike)}
 // Hydrofoil boat: pointed hull with cabin and engine, suitable for ocean/coast travel.
 const boat=new T.Group();craftGroup.add(boat);vehicleModels.boat=boat;
 sp(1.32,.45,3.4,vMats.blue,0,-.2,0,boat);
 bx(1.7,.36,2.6,vMats.orange,0,.15,.25,boat);
 bx(1.6,1.05,1.35,vMats.glass,0,.8,-.3,boat);
 bx(1.95,.16,1.75,vMats.black,0,1.34,-.3,boat);
 sp(.44,.33,.9,vMats.black,0,-.04,2.75,boat);
 
 // V5 premium additions: touring supercar, six-wheel expedition truck and twin-float seaplane.
 const chrome=new T.MeshPhysicalMaterial({color:0xc2cdd0,metalness:.98,roughness:.14,clearcoat:1});
 const racing=new T.MeshPhysicalMaterial({color:0x155e82,metalness:.72,roughness:.15,clearcoat:1,clearcoatRoughness:.09});
 const camel=new T.MeshPhysicalMaterial({color:0xa89873,metalness:.43,roughness:.38,clearcoat:.5});
 const smoked=new T.MeshPhysicalMaterial({color:0x162d40,metalness:.24,roughness:.07,transparent:true,opacity:.83,depthWrite:false,clearcoat:1});
 const rubber=new T.MeshStandardMaterial({color:0x1c2026,roughness:.91});
 function rimWheel(parent,x,y,z,r=.48){
  const o=new T.Mesh(new T.CylinderGeometry(r,r,.24,16),rubber);o.rotation.z=Math.PI/2;o.position.set(x,y,z);parent.add(o);
  const disc=new T.Mesh(new T.CylinderGeometry(r*.55,r*.55,.252,12),chrome);disc.rotation.z=Math.PI/2;disc.position.set(x,y,z);parent.add(disc);
  return o
 }
 const coupe=new T.Group();craftGroup.add(coupe);vehicleModels.supercar=coupe;
 const coupeShape=sp(.98,.3,2.2,racing,0,.46,.1,coupe);
 bx(1.9,.3,4.2,racing,0,.48,0,coupe);
 const coupeCabin=sp(.79,.42,1.13,smoked,0,.94,-.45,coupe);
 bx(1.85,.09,.46,chrome,0,.72,1.93,coupe);
 for(const x of [-.88,.88]){
  rimWheel(coupe,x,.38,-1.38,.43);rimWheel(coupe,x,.38,1.21,.43);
  sp(.26,.12,.12,vMats.glow,x*.63,.54,-2.18,coupe);
  bx(.14,.13,.3,vMats.red,x,.56,2.13,coupe);
 }
 // Long-wheelbase expedition six-wheeler with cargo rack and reinforced wheel arches.
 const truck=new T.Group();craftGroup.add(truck);vehicleModels.expedition=truck;
 bx(2.15,.52,5.2,camel,0,.88,0,truck);
 bx(2.08,1.04,2.2,camel,0,1.69,-1.33,truck);
 bx(1.98,.63,.07,smoked,0,1.84,-2.46,truck);
 for(const x of [-1.1,1.1]){
   for(const z of [-1.75,.12,1.76])rimWheel(truck,x,.55,z,.6);
   bx(.13,.9,1.95,chrome,x,2.2,.65,truck);
   bx(.09,.12,4.5,rubber,x,1.03,0,truck);
 }
 bx(1.95,.13,2.5,rubber,0,2.59,.65,truck);
 for(const xx of [-.76,.76])sp(.25,.2,.08,vMats.glow,xx,1.16,-2.68,truck);
 const plane=new T.Group();craftGroup.add(plane);vehicleModels.seaplane=plane;
 sp(.9,.78,3.65,alloy,0,.38,0,plane);
 sp(.78,.45,1.45,smoked,0,.87,-1.35,plane);
 const highWing=bx(11.8,.21,1.7,alloy,0,1.64,-.18,plane);highWing.rotation.z=.016;
 bx(4.1,.15,.98,alloy,0,.81,3.18,plane);
 bx(.15,1.45,1.3,racing,0,1.58,3.19,plane);
 for(const x of [-1.8,1.8]){
  sp(.42,.33,2.4,racing,x,-.8,.4,plane);
  bx(.1,1.18,.12,chrome,x,-.06,-.8,plane);
  bx(.1,1.18,.12,chrome,x,-.06,1.4,plane);
 }
 const propeller=new T.Group();propeller.position.set(0,.48,-3.55);plane.add(propeller);
 for(const r of [0,Math.PI/2]){
   const blade=bx(.16,3.55,.1,rubber,0,0,0,propeller);blade.rotation.z=r;
 }

 const vehicleData={
  skyrider:{name:'SKYRIDER VTOL',speed:33,lift:9},
  helicopter:{name:'HAWK H-21',speed:27,lift:10},
  jet:{name:'STRIKE JET',speed:68,lift:16},
  buggy:{name:'DUNE BUGGY',speed:32,lift:0},
  hoverbike:{name:'HOVERBIKE',speed:48,lift:2},
  boat:{name:'HYDROFOIL',speed:29,lift:0},
  supercar:{name:'ASTRA GT',speed:74,lift:0},
  expedition:{name:'ATLAS 6x6',speed:41,lift:0},
  seaplane:{name:'COAST GUARD SEAPLANE',speed:55,lift:13}
 };
 let vehicleType=vehicleData[directorState.vehicleType]?directorState.vehicleType:'skyrider',hopTime=0;
 function selectVehicle(type){
  if(!vehicleData[type])return;
  vehicleType=type;directorState.vehicleType=type;
  for(const [key,model] of Object.entries(vehicleModels))model.visible=key===type;
  beginFlight();
 }
 for(const [key,model] of Object.entries(vehicleModels))model.visible=key===vehicleType;

 function flightButtons(){
   const land=vehicleType==='buggy'||vehicleType==='hoverbike'||vehicleType==='boat'||vehicleType==='supercar'||vehicleType==='expedition';const labels=riding?(land?['◀ BRAKE','▲ HOP','✕ EXIT','⚡ BOOST']:['▼ DOWN','▲ UP','✕ EXIT','⚡ BOOST']):newMapActive?['🗺 MAP','🏎 DRIVE','↑ JUMP','» RUN']:['⛏ MINE','▣ PLACE','↑ JUMP','» RUN'];
   for(const [i,id] of ['vxMine','vxPlace','vxJump','vxRun'].entries())q(id).textContent=labels[i];
   q('vxInventory').style.opacity=riding?'.45':'1';
 }
 function beginFlight(){
   directorState.hasVehicle=true;directorState.riding=true;riding=true;
   craftState.x=T.MathUtils.clamp(loc.x,3,SIZE-4);craftState.z=T.MathUtils.clamp(loc.z,3,SIZE-4);
   const surface=newMapActive?coastH(craftState.x,craftState.z):ground(craftState.x,craftState.z);craftState.y=vehicleType==='buggy'||vehicleType==='supercar'||vehicleType==='expedition'?surface+1.7:vehicleType==='hoverbike'?surface+2.3:vehicleType==='boat'?SEA+1.0:Math.max(loc.y+6,surface+9);
   craftState.heading=yaw;craftState.speed=0;
   craftGroup.visible=true;
   flightOrbit=0;flightPitch=.17;flightButtons();
   notify(vehicleData[vehicleType].name+' online · steer with joystick');
 }
 function endFlight(){
   riding=false;directorState.riding=false;flightLift=0;
   loc.set(craftState.x,(newMapActive?coastH(craftState.x,craftState.z):Math.max(ground(Math.floor(craftState.x),Math.floor(craftState.z)),SEA))+2.3,craftState.z);
   yaw=craftState.heading;pitch=.04;velY=0;
   flightButtons();notify('Exited '+vehicleData[vehicleType].name+' · craft remains in the world');
 }

 function flightTick(dt,t){
  if(!riding)return;
  const inputF=T.MathUtils.clamp(move.y,-1,1),inputX=T.MathUtils.clamp(move.x,-1,1);
  const land=vehicleType==='buggy'||vehicleType==='hoverbike'||vehicleType==='boat'||vehicleType==='supercar'||vehicleType==='expedition';
  const vessel=vehicleType==='boat',jetMode=vehicleType==='jet'||vehicleType==='seaplane';
  const vehicle=vehicleData[vehicleType];
  craftState.heading+=inputX*dt*(jetMode?1.1:land?1.8:1.48);
  const speedTarget=(jetMode?Math.max(8,inputF*vehicle.speed):(inputF*(runPressed?vehicle.speed*1.4:vehicle.speed)))*(flightLift<0&&land?.35:1);
  craftState.speed=T.MathUtils.damp(craftState.speed,speedTarget,land?2.5:1.45,dt);
  craftState.climb=T.MathUtils.damp(craftState.climb,flightLift*vehicle.lift+(jetMode?inputF*3:0),2.3,dt);
  const nx=T.MathUtils.clamp(craftState.x-Math.sin(craftState.heading)*craftState.speed*dt,2,SIZE-3);
  const nz=T.MathUtils.clamp(craftState.z-Math.cos(craftState.heading)*craftState.speed*dt,2,SIZE-3);
  const blockAtFront=newMapActive?0:get(Math.floor(nx),Math.floor(ground(nx,nz)+2),Math.floor(nz));
  const blocked=land&&!vessel&&blockAtFront!==0&&blockAtFront!==10&&blockAtFront!==9;
  if(!blocked){craftState.x=nx;craftState.z=nz}else craftState.speed*=.32;
  if(land){
    const expected=vessel?SEA+1.3:(newMapActive?coastH(craftState.x,craftState.z):ground(craftState.x,craftState.z))+(vehicleType==='buggy'||vehicleType==='supercar'||vehicleType==='expedition'?1.45:2.2);
    if(vehicleType!=='boat'&&flightLift>0&&hopTime<=0)hopTime=1.1;
    hopTime=Math.max(0,hopTime-dt);
    const jump=hopTime>0?Math.sin((1.1-hopTime)/1.1*Math.PI)*(vehicleType==='buggy'?2.3:.9):0;
    craftState.y=T.MathUtils.damp(craftState.y,expected+jump+(vehicleType==='hoverbike'?Math.sin(t*3)*.14:0),7,dt);
    if(vessel){const depth=newMapActive?coastH(craftState.x,craftState.z):ground(craftState.x,craftState.z);if(depth>SEA+2)craftState.speed*=.88}
  }else{
    craftState.y+=craftState.climb*dt;
    craftState.y=T.MathUtils.clamp(craftState.y,Math.min(61,(newMapActive?coastH(craftState.x,craftState.z):surfaceAt(craftState.x,craftState.z))+5),150);
  }
  craftState.bank=T.MathUtils.damp(craftState.bank,inputX*(jetMode?.27:land?.13:.2),4,dt);
  craftGroup.position.set(craftState.x,craftState.y+(land?.02:Math.sin(t*4)*.09),craftState.z);
  craftGroup.rotation.y=craftState.heading;
  const model=vehicleModels[vehicleType];
  model.rotation.z=craftState.bank;
  model.rotation.x=T.MathUtils.damp(model.rotation.x,-inputF*(land?.05:.13),4,dt);
  if(vehicleType==='helicopter'){vehicleParts.mainRotor.rotation.y+=dt*33;vehicleParts.tailRotor.rotation.x+=dt*38}
  if(vehicleType==='seaplane')propeller.rotation.z+=dt*44;
  if(vehicleType==='buggy')for(const w of vehicleParts.wheels)w.rotation.x+=craftState.speed*dt*.7;
  if(vehicleType==='supercar'||vehicleType==='expedition'){for(const mesh of vehicleModels[vehicleType].children)if(mesh.geometry?.type==='CylinderGeometry')mesh.rotation.x+=craftState.speed*dt*.32;}
  for(const flame of vehicleParts.jetThrusters)flame.scale.z=.62+Math.sin(t*21)*.22;
  thruster.intensity=vehicleType==='skyrider'?2+Math.abs(craftState.speed)*.15:0;
  loc.set(craftState.x,craftState.y+1.8,craftState.z);velY=0;
  const eyeYaw=craftState.heading+flightOrbit,dist=land?9:jetMode?19:13;
  const wanted=new T.Vector3(craftState.x+Math.sin(eyeYaw)*dist,craftState.y+3.8+Math.sin(flightPitch)*dist*.58,craftState.z+Math.cos(eyeYaw)*dist);
  camera.position.lerp(wanted,1-Math.exp(-dt*6));
  camera.lookAt(craftState.x,craftState.y+(land?1:0),craftState.z);
 }

 // Hold down the mining/placement buttons in flight to control collective lift.
 function flightHold(id,v){
   const b=q(id);
   b.addEventListener('pointerdown',e=>{if(!riding)return;e.stopPropagation();e.preventDefault();flightLift=v;b.setPointerCapture(e.pointerId)});
   for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{if(flightLift===v)flightLift=0});
 }
 flightHold('vxMine',-1);flightHold('vxPlace',1);


 // Filmic atmospheric sky: horizon aerosol scattering, warm sun halo and subtle stars.
 const skyMat=new T.ShaderMaterial({
  side:T.BackSide,depthWrite:false,
  uniforms:{
   top:{value:new T.Color('#347fba')},horizon:{value:new T.Color('#bfdfea')},
   night:{value:0},time:{value:0},haze:{value:.28}
  },
  vertexShader:`varying vec3 v;
void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform vec3 top,horizon;
uniform float night,time,haze;
varying vec3 v;
float rnd(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,73.7)))*43758.5453);}
void main(){
 vec3 d=normalize(v);
 float height=smoothstep(-.15,.86,d.y);
 vec3 col=mix(horizon,top,pow(height,.82));
 float air=exp(-abs(d.y)*9.);
 col=mix(col,horizon,.12*air+haze*.22*air);
 vec3 sunlight=normalize(vec3(-.63,.41,.64));
 float angle=max(dot(d,sunlight),0.);
 col+=vec3(1.,.67,.36)*pow(angle,24.)*.38*(1.-night);
 col+=vec3(1.,.9,.67)*pow(angle,480.)*1.8*(1.-night);
 float star=step(.9995,rnd(floor(d*1250.)));
 col+=vec3(.7,.85,1.)*star*night*smoothstep(.08,.27,d.y);
 gl_FragColor=vec4(col,1.);
}`
 });
 const sky=new T.Mesh(new T.SphereGeometry(250,28,14),skyMat);scene.add(sky);
 const cloudMat=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false});

 // Soft billboard cloud banks with alpha falloff: cheaper and more natural than 3D box clouds.
 const vaporCanvas=document.createElement('canvas');vaporCanvas.width=vaporCanvas.height=128;
 const vapCtx=vaporCanvas.getContext('2d'),vapGrad=vapCtx.createRadialGradient(64,64,2,64,64,61);
 vapGrad.addColorStop(0,'rgba(255,255,255,.91)');vapGrad.addColorStop(.36,'rgba(255,255,255,.65)');
 vapGrad.addColorStop(.72,'rgba(255,255,255,.22)');vapGrad.addColorStop(1,'rgba(255,255,255,0)');
 vapCtx.fillStyle=vapGrad;vapCtx.fillRect(0,0,128,128);
 const vaporTexture=new T.CanvasTexture(vaporCanvas);vaporTexture.colorSpace=T.SRGBColorSpace;
 const vaporMaterial=new T.SpriteMaterial({map:vaporTexture,transparent:true,opacity:.59,depthWrite:false,color:0xedf5fa});
 const softClouds=[];
 for(let i=0;i<(mobile?23:36);i++){
  const c=new T.Sprite(vaporMaterial);
  const x=hash(i+87,11)*370-55,z=hash(i+37,52)*380-55;
  c.position.set(x,48+hash(i,12)*17,z);
  c.scale.set(30+hash(i,25)*40,6+hash(i,42)*10,1);
  scene.add(c);softClouds.push(c);
 }

 const clouds=[];
 for(let i=0;i<38;i++){
  const g=new T.Group();scene.add(g);
  const x=hash(i,17)*280-50,z=hash(i,63)*280-40;g.position.set(x,35+hash(i,22)*9,z);
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
  if(newMapActive)return x>.7&&x<SIZE-.7&&z>.7&&z<SIZE-.7;
  for(const ox of [-.27,.27])for(const oz of [-.27,.27]){
    const bx=Math.floor(x+ox),bz=Math.floor(z+oz);
    for(const dy of [-1.46,-.46]){const by=Math.floor(y+dy);if(solid(get(bx,by,bz)))return false}
  }
  return x>.45&&x<SIZE-.45&&z>.45&&z<SIZE-.45;
 }
 function notify(message){
  text('vxToast',message);q('vxToast').style.opacity='1';tipUntil=performance.now()+1700;
 }

 // DIRECTOR MODE is a native part of the live in-chat game window.
 const topOptions=root.querySelector('.vxTopOptions');
 const directorButton=document.createElement('button');
 directorButton.textContent='✦ DIRECTOR';directorButton.style.cssText='background:#23645b;color:#e2fff3;font-weight:800;border-color:#94f5d7';
 topOptions?.appendChild(directorButton);
 const directorPanel=document.createElement('div');
 directorPanel.style.cssText='position:absolute;z-index:4;top:103px;left:9px;right:9px;max-height:49%;overflow-y:auto;overscroll-behavior:contain;display:none;background:linear-gradient(160deg,#082c38ef,#09202bf2);border:1px solid #8eead699;border-radius:12px;padding:12px;box-shadow:0 7px 24px #0019;backdrop-filter:blur(12px);color:#eaffff';
 directorPanel.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="letter-spacing:2px">✦ REALITY DIRECTOR</b><button data-action="close">✕ CLOSE</button></div><p style="margin:7px 0 10px;font:11px/1.45 system-ui;color:#bfe0de">These events change the active world. For new features, describe what you want in this ChatGPT conversation and I can publish the next version.</p><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px"><button data-action="coast">🏝 CRESCENT COAST</button><button data-action="voxel">⛏ VOXEL WORLD</button><button data-action="supercar">🏎 ASTRA GT</button><button data-action="expedition">🚙 ATLAS 6×6</button><button data-action="seaplane">🛩 SEAPLANE</button><button data-action="city">🌆 GO TO MEGACITY</button><button data-action="worldmap">🗺 WORLD MAP</button><button data-action="heli">🚁 HAWK HELICOPTER</button><button data-action="jet">✈ STRIKE JET</button><button data-action="buggy">🏎 DUNE BUGGY</button><button data-action="hoverbike">🏍 HOVERBIKE</button><button data-action="boat">🚤 HYDROFOIL</button><button data-action="town">🏙 CREATE SETTLEMENT</button><button data-action="meteor">☄ METEOR IMPACT</button><button data-action="fly">✈ SPAWN SKYRIDER</button><button data-action="storm">⛈ TOGGLE STORM</button><button data-action="visit">🌆 VISIT SETTLEMENT</button><button data-action="relic">◇ VISIT ANOMALY</button><button data-action="stats">🧠 CIVILISATION STATUS</button><button data-action="day">☀ DAYLIGHT</button><button data-action="night">🌙 NIGHT MODE</button><button data-action="fireworks">🎆 FIREWORKS</button><button data-action="terraform">⛏ TERRAIN BRUSH</button><button data-action="tower">🏗 BUILD TOWER</button><button data-action="lightning">⚡ LIGHTNING STRIKE</button><button data-action="devhud">📊 DEBUG HUD</button><button data-action="distance">🔭 DRAW DISTANCE</button><button data-action="stats">🧠 CIVILISATION STATUS</button></div><div id="realityStats" style="margin-top:10px;border-top:1px solid #ffffff26;padding-top:9px;font:10px/1.65 ui-monospace,monospace;color:#a9e3d9"></div>';
 stage.appendChild(directorPanel);
 directorButton.onclick=()=>{const open=directorPanel.style.display!=='none';directorPanel.style.display=open?'none':'block';updateDirectorStats()};
 function updateDirectorStats(){
   const stats=directorPanel.querySelector('#realityStats');
   if(stats)stats.textContent='POPULATION '+citizens.length+' • DISTRICTS '+Number(directorState.town)+' • BUILDINGS '+directorState.structures+' • CRATERS '+directorState.craters+' • WORLD EVENTS '+directorState.events;
 }

 // More developer tools: world atlas, runtime information, terrain brush and GPU-friendly effects.
 let showMap=false,debugHudOn=false,fireworksAge=-1,thunderAge=-1;
 const mapCanvas=document.createElement('canvas');mapCanvas.width=mapCanvas.height=256;
 mapCanvas.style.cssText='position:absolute;left:9px;top:104px;width:187px;height:187px;z-index:3;display:none;border:2px solid #8fffffb8;background:#142c32;border-radius:8px;box-shadow:0 4px 18px #001b;image-rendering:pixelated;touch-action:manipulation';
 stage.appendChild(mapCanvas);
 const mapctx=mapCanvas.getContext('2d');
 const mapImg=mapctx.createImageData(256,256);
 const coastMapImg=mapctx.createImageData(256,256);
 for(let z=0;z<256;z++)for(let x=0;x<256;x++){
   const h=coastH(x,z),p=(z*256+x)*4;
   const col=h<=8.7?[48,139,174]:h<12?[215,190,144]:h>28?[118,126,116]:[104,141,92];
   const color=col;
   for(let k=0;k<3;k++)coastMapImg.data[p+k]=color[k];
   coastMapImg.data[p+3]=255;
 }

 for(let z=0;z<256;z++)for(let x=0;x<256;x++){
   const id=get(x,ground(x,z),z),h=ground(x,z),k=(z*256+x)*4;
   const col=(x>=111&&x<=209&&z>=111&&z<=209)?(id===3?[59,68,79]:id===8?[180,163,145]:[120,140,164]):h<=SEA?[43,117,155]:h>27?[147,150,148]:h>17?[74,123,79]:[86,146,93];
   for(let c=0;c<3;c++)mapImg.data[k+c]=col[c];mapImg.data[k+3]=255;
 }
 mapctx.putImageData(mapImg,0,0);
 mapCanvas.addEventListener('click',e=>{
   const r=mapCanvas.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/r.width*256),z=Math.floor((e.clientY-r.top)/r.height*256);
   if(riding)endFlight();
   loc.set(T.MathUtils.clamp(x+.5,3,253),(newMapActive?coastH(x,z):ground(x,z))+3,T.MathUtils.clamp(z+.5,3,253));
   velY=0;showMap=false;mapCanvas.style.display='none';notify('Developer teleport · '+x+' / '+z);
   requestChunks(loc.x,loc.z);streamChunks(3);
 });
 const debugHud=document.createElement('div');
 debugHud.style.cssText='position:absolute;right:8px;top:130px;z-index:3;pointer-events:none;display:none;font:10px/1.6 ui-monospace,monospace;padding:7px;background:#061c2bce;color:#a4ffcf;border:1px solid #84f8d788;border-radius:7px;white-space:pre';
 stage.appendChild(debugHud);
 const sparkN=mobile?140:280,sparkGeo=new T.BufferGeometry(),sparkPositions=new Float32Array(sparkN*3),sparkVel=new Float32Array(sparkN*3);
 sparkGeo.setAttribute('position',new T.BufferAttribute(sparkPositions,3));
 const sparkMat=new T.PointsMaterial({color:0xffc783,size:.48,transparent:true,opacity:.96,depthWrite:false,blending:T.AdditiveBlending});
 const sparks=new T.Points(sparkGeo,sparkMat);scene.add(sparks);sparks.visible=false;
 const thunder=new T.PointLight(0xc6edff,0,130,2);thunder.position.set(160,45,160);scene.add(thunder);
 const lightningGroup=new T.Group();scene.add(lightningGroup);lightningGroup.visible=false;
 const lightningMat=new T.LineBasicMaterial({color:0xd6f4ff,transparent:true,opacity:1});
 const lightningPoints=[];
 for(let i=0;i<13;i++)lightningPoints.push(new T.Vector3(Math.sin(i*1.3)*1.5,37-i*2.8,Math.cos(i*1.7)*1.5));
 const boltGeo=new T.BufferGeometry().setFromPoints(lightningPoints);
 const bolt=new T.Line(boltGeo,lightningMat);lightningGroup.add(bolt);
 function makeFireworks(){
   fireworksAge=0;sparks.visible=true;
   const px=loc.x+Math.sin(yaw)*20,pz=loc.z-Math.cos(yaw)*20,py=Math.max(ground(px,pz)+17,loc.y+6);
   for(let i=0;i<sparkN;i++){
     const u=Math.random()*2-1,a=Math.random()*Math.PI*2,b=Math.sqrt(1-u*u);
     const v=(5+Math.random()*12);
     sparkPositions[i*3]=px;sparkPositions[i*3+1]=py;sparkPositions[i*3+2]=pz;
     sparkVel[i*3]=Math.cos(a)*b*v;sparkVel[i*3+1]=u*v;sparkVel[i*3+2]=Math.sin(a)*b*v;
   }
   sparkGeo.attributes.position.needsUpdate=true;directorState.events++;
 }
 function lightningStrike(){
   thunderAge=0;thunder.position.set(loc.x+8,loc.y+18,loc.z-11);
   lightningGroup.position.set(thunder.position.x,8,thunder.position.z);
   lightningGroup.visible=true;
   directorState.events++;
 }
 function terraformBrush(){
   if(newMapActive){notify('Smooth coast terrain brush arrives in the next editor pass · switch to VOXEL for block terraforming');return}
   const tx=Math.round(loc.x+Math.sin(yaw)*7),tz=Math.round(loc.z-Math.cos(yaw)*7);
   if(tx<3||tz<3||tx>=SIZE-3||tz>=SIZE-3)return;
   const sy=surfaceAt(tx,tz);
   for(let dx=-4;dx<=4;dx++)for(let dz=-4;dz<=4;dz++){
     if(dx*dx+dz*dz>16)continue;
     const x=tx+dx,z=tz+dz;if(x<1||z<1||x>=SIZE-1||z>=SIZE-1)continue;
     const level=surfaceAt(x,z);
     for(let y=sy+1;y<=Math.min(Y-2,level+1);y++)editWorld(x,y,z,0);
     for(let y=level+1;y<=sy;y++)editWorld(x,y,z,2);
     editWorld(x,sy,z,1);
   }
   flushWorld();notify('Flattened a 9×9 terrain brush near you');directorState.events++;
 }
 function customTower(){
   if(newMapActive){notify('Tower tool currently edits voxel world · switch maps to build');return}
   const x=Math.floor(loc.x+Math.sin(yaw)*11),z=Math.floor(loc.z-Math.cos(yaw)*11);
   if(x<5||z<5||x>SIZE-6||z>SIZE-6)return;
   const y=Math.max(SEA+2,Math.min(Y-30,ground(x,z)+1));
   for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++){
     editWorld(x+dx,y,z+dz,8);
     for(let dy=1;dy<=24;dy++){
       const edge=Math.abs(dx)===3||Math.abs(dz)===3,door=dz===3&&dx===0&&dy<4;
       if(dy%7===0)editWorld(x+dx,y+dy,z+dz,8);
       else if(edge&&!door)editWorld(x+dx,y+dy,z+dz,dy%3?7:3);
       else editWorld(x+dx,y+dy,z+dz,0);
     }
     editWorld(x+dx,y+25,z+dz,8);
   }
   editWorld(x,y+26,z,9);flushWorld();directorState.events++;
   notify('Built a 26-block developer observation tower');
 }
 function updateVfx(dt,t){
   if(fireworksAge>=0){
     fireworksAge+=dt;sparkMat.opacity=Math.max(0,1-fireworksAge/3);
     for(let i=0;i<sparkN;i++){
       sparkPositions[i*3]+=sparkVel[i*3]*dt;
       sparkPositions[i*3+1]+=sparkVel[i*3+1]*dt-.5*dt;
       sparkPositions[i*3+2]+=sparkVel[i*3+2]*dt;
       sparkVel[i*3+1]-=dt*4.2;
     }
     sparkGeo.attributes.position.needsUpdate=true;
     if(fireworksAge>3){fireworksAge=-1;sparks.visible=false}
   }
   if(thunderAge>=0){
     thunderAge+=dt;thunder.intensity=thunderAge<.14?85:thunderAge<.37?13:0;
     lightningGroup.visible=thunderAge<.18;
     if(thunderAge>.5){thunderAge=-1;lightningGroup.visible=false}
   }
   if(showMap){
     mapctx.putImageData(newMapActive?coastMapImg:mapImg,0,0);
     if(newMapActive){
       mapctx.strokeStyle='#464e55';mapctx.lineWidth=3;
       for(const r of mainRoads){
         mapctx.beginPath();
         for(let k=0;k<=75;k++){const p=r.curve.getPoint(k/75);if(k===0)mapctx.moveTo(p.x,p.z);else mapctx.lineTo(p.x,p.z)}
         mapctx.stroke();
       }
     }
     mapctx.fillStyle='#ff5e48';mapctx.fillRect(Math.floor(loc.x)-2,Math.floor(loc.z)-2,5,5);
     mapctx.strokeStyle='#fff';mapctx.strokeRect(Math.floor(loc.x)-5,Math.floor(loc.z)-5,11,11);
   }
   if(debugHudOn)debugHud.textContent='REALITY ENGINE V4\nWORLD: '+SIZE+' x '+SIZE+' x '+Y+'\nCHUNKS: '+geoGroups.size+' / '+(SIZE/CHUNK)**2+'\nQUEUE: '+chunkQueue.length+'\nDRAW RADIUS: '+chunkRadius.value+'\nGPU DPR: '+renderer.getPixelRatio().toFixed(2)+'\nMODE: '+(riding?vehicleType:'ON FOOT')+'\nWEATHER: '+weather.toUpperCase();
 }

 directorPanel.addEventListener('click',e=>{
   const button=e.target.closest('button[data-action]');if(!button)return;
   const action=button.dataset.action;
   if(action==='close'){directorPanel.style.display='none';return}
   if(action==='coast'||action==='voxel'){directorPanel.style.display='none';setMap(action==='coast'?'crescent':'voxel');}


   if(action==='city'){if(newMapActive)setMap('voxel');if(riding)endFlight();loc.set(160.5,ground(160,160)+3,160.5);yaw=0;velY=0;directorPanel.style.display='none';requestChunks(loc.x,loc.z);streamChunks(4);notify('Arrived in METROPOLIS DISTRICT · 256×256 world')}
   if(['heli','jet','buggy','hoverbike','boat','supercar','expedition','seaplane'].includes(action)){directorPanel.style.display='none';selectVehicle(action)}
   if(action==='worldmap'){showMap=!showMap;mapCanvas.style.display=showMap?'block':'none';directorPanel.style.display='none';notify('Tap a location on the atlas to teleport')}
   if(action==='night'){const el=q('vxWeather');el.value='night';el.dispatchEvent(new Event('change'))}
   if(action==='fireworks'){makeFireworks();directorPanel.style.display='none';notify('Fireworks display deployed')}
   if(action==='terraform'){terraformBrush()}
   if(action==='tower'){customTower()}
   if(action==='lightning'){lightningStrike();directorPanel.style.display='none';notify('Lightning strike incoming')}
   if(action==='devhud'){debugHudOn=!debugHudOn;debugHud.style.display=debugHudOn?'block':'none'}
   if(action==='distance'){chunkRadius.value=chunkRadius.value===2?3:chunkRadius.value===3?4:2;requestChunks(loc.x,loc.z);notify('Chunk render radius '+chunkRadius.value+' · '+(chunkRadius.value===2?'FAST':'SCENIC'))}

   if(action==='town'){
     if(newMapActive)setMap('voxel');
     if(makeSettlement()){notify('Settlement constructed! Inhabitants will begin developing it.');loc.set(19.5,surfaceAt(19,40)+3,39.5)}
     else notify('Your settlement is already developing.');
   }
   if(action==='meteor'){if(startMeteor())notify('Meteor inbound! Watch the sky ahead.');else notify('Meteor already incoming.')}
   if(action==='fly'){directorPanel.style.display='none';beginFlight()}
   if(action==='storm'||action==='day'){
     const select=q('vxWeather');select.value=action==='day'?'clear':weather==='rain'?'clear':'rain';
     select.dispatchEvent(new Event('change'));notify(action==='day'?'Daylight restored':'Atmosphere changed');
   }
   if(action==='visit'){
     if(newMapActive)setMap('voxel');
     if(!directorState.town)makeSettlement();
     if(riding)endFlight();
     loc.set(18.5,surfaceAt(18,40)+3,39.5);yaw=-.2;notify('Transported to the settlement');
   }
   if(action==='relic'){
     if(newMapActive)setMap('voxel');
     if(riding)endFlight();loc.set(37.5,ground(37,21)+3,21.5);yaw=0;notify('You have arrived at the ancient anomaly');
   }
   if(action==='stats')notify(citizens.length+' active inhabitants · '+directorState.structures+' buildings · '+directorState.craters+' craters');
   updateDirectorStats();persist();
 });
 flightButtons();
 if(riding){craftGroup.visible=true;for(const [key,model] of Object.entries(vehicleModels))model.visible=key===vehicleType;loc.set(craftState.x,craftState.y+1.8,craftState.z)}
 
 function editBlock(place){
  if(riding||newMapActive){if(newMapActive)notify('Switch to VOXEL LEGACY to mine and build blocks');return;}
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
 q('vxMine').onclick=()=>{if(newMapActive&&!riding){showMap=!showMap;mapCanvas.style.display=showMap?'block':'none';notify('Tap the world map to teleport')}else editBlock(false)};
 q('vxPlace').onclick=()=>{if(newMapActive&&!riding)selectVehicle('supercar');else editBlock(true)};
 q('vxJump').onclick=()=>{if(riding){endFlight();return}if(grounded){velY=6.8;grounded=false}};
 q('vxRun').onclick=()=>{runPressed=!runPressed;q('vxRun').classList.toggle('active',runPressed);if(riding)notify(runPressed?'Skyrider boost engaged':'Skyrider boost disengaged')};
 q('vxInventory').onclick=()=>{q('vxHotbar').classList.toggle('expanded');q('vxInventory').classList.toggle('active')};
 q('vxReset').onclick=()=>{if(riding)endFlight();if(newMapActive)loc.set(45,coastH(45,113)+2.4,113);else loc.set(32.5,ground(32,32)+3,32.5);yaw=.5;pitch=.05;notify('Returned to spawn')};
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
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer||!lookOld)return;const dx=e.clientX-lookOld[0],dy=e.clientY-lookOld[1];if(riding){flightOrbit-=dx*.0045;flightPitch=T.MathUtils.clamp(flightPitch+dy*.003,-.28,.8)}else{yaw-=dx*.0045;pitch=T.MathUtils.clamp(pitch+dy*.0042,-1.45,1.45)}lookOld=[e.clientX,e.clientY]});
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
 let last=performance.now(),fpsAt=last,frames=0,saveAt=last,adaptAt=last,lastCivilWork=last;
 const stat=()=>({x:loc.x,y:loc.y,z:loc.z,yaw});
 function persist(){
  try{localStorage.setItem(saveKey,JSON.stringify({player:stat(),changes:Object.fromEntries(changes),director:{...directorState,riding,flight:{...craftState}}}))}catch(e){}
 }
 function frame(){
  if(!alive||!root.isConnected)return;requestAnimationFrame(frame);
  const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
  if(riding){
   if(keys.has(' '))flightLift=1;else if(keys.has('q'))flightLift=-1;
   else if(!q('vxMine').matches(':active')&&!q('vxPlace').matches(':active'))flightLift=0;
   flightTick(dt,clock.getElapsedTime());
  }else{
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
  if(newMapActive){
    const footY=coastH(loc.x,loc.z)+1.84;
    if(loc.y<footY){loc.y=footY;velY=0;grounded=true}
   }else if(loc.y<2){loc.set(32.5,ground(32,32)+3,32.5);velY=0}
  camera.position.copy(loc);camera.rotation.order='YXZ';camera.rotation.y=-yaw;camera.rotation.x=pitch;

  }
  if(quake>0){camera.position.x+=(Math.random()-.5)*quake*.55;camera.position.y+=(Math.random()-.5)*quake*.35}
  sky.position.copy(loc);
  const t=clock.getElapsedTime();skyMat.uniforms.time.value=t;oceanMat.uniforms.time.value=t;advanceDirector(dt,t);updateVfx(dt,t);if(newMapActive)animateCoast(dt,t);else animateTraffic(dt,t);
  for(const a of animals){
    a.g.visible=!newMapActive;
    const xx=a.origin[0]+Math.sin(t*.21+a.phase)*3.4,zz=a.origin[1]+Math.cos(t*.19+a.phase)*2.4;
    a.g.position.set(xx,ground(Math.round(xx),Math.round(zz))+1,zz);
    a.g.rotation.y=t*.24+a.phase;
    for(let j=0;j<a.legs.length;j++)a.legs[j].rotation.x=Math.sin(t*3+a.phase+j*Math.PI)*.15;
  }

  for(let i=0;i<clouds.length;i++)clouds[i].position.x+=dt*(i%3+1)*.38;
  for(const cloud of clouds)if(cloud.position.x>285)cloud.position.x=-40;
  for(const c of softClouds){c.visible=newMapActive;c.position.x+=dt*.72;if(c.position.x>325)c.position.x=-45}
  for(const g of clouds)g.visible=!newMapActive;
  rain.visible=weather==='rain';rain.position.set(loc.x,loc.y+1,loc.z);
  if(weather==='rain'){const a=rainGeo.attributes.position;for(let i=0;i<rainCount;i++){let y=a.array[3*i+1]-dt*25;if(y<0)y+=30;a.array[3*i+1]=y}a.needsUpdate=true}
  currentTarget=riding||newMapActive?null:castBlock();
  reticle.visible=!!currentTarget;
  if(currentTarget)reticle.position.set(currentTarget.pos[0]+.5,currentTarget.pos[1]+.5,currentTarget.pos[2]+.5);
  renderer.render(scene,camera);
  frames++;
  if(now-fpsAt>1350){
    const rate=Math.round(frames*1000/(now-fpsAt));frames=0;fpsAt=now;
    text('vxFps',rate+' FPS · '+quality.toUpperCase());
    text('vxLocation','XYZ '+Math.floor(loc.x)+' / '+Math.floor(loc.y)+' / '+Math.floor(loc.z)+' · '+(newMapActive?'COAST':'CH '+geoGroups.size));
    text('vxTarget',riding?vehicleData[vehicleType].name+' · '+Math.abs(craftState.speed*3.6).toFixed(0)+' km/h · ALT '+Math.floor(craftState.y)+' m':newMapActive?'CRESCENT COAST · Scenic roads · Open Director for vehicles':currentTarget?types[currentTarget.id]+' · '+currentTarget.pos.join(', '):citizens.length+' inhabitants · Director Mode ready');
    if(quality==='auto'&&rate<27&&now-adaptAt>12000&&renderer.getPixelRatio()>.72){renderer.setPixelRatio(Math.max(.72,renderer.getPixelRatio()-.1));if(chunkRadius.value>2)chunkRadius.value--;resize();adaptAt=now}
  }
  if(now-lastCivilWork>7500){lastCivilWork=now;buildersProgress();updateDirectorStats()}
  if(now-saveAt>5000){saveAt=now;persist()}
  if(!newMapActive){if(!frame.streamAt||now-frame.streamAt>400){frame.streamAt=now;requestChunks(loc.x,loc.z)}streamChunks(mobile?1:2)}
  if(now>tipUntil)q('vxToast').style.opacity='0';
 }
 requestAnimationFrame(frame);
 return {snapshot(){return {player:stat(),changes:Object.fromEntries(changes),director:{...directorState,riding,flight:{...craftState}}}},dispose(){alive=false;persist();resizeObserver.disconnect();stage.removeEventListener('keydown',kd);stage.removeEventListener('keyup',ku);for(const m of geoGroups.values())m.traverse(o=>o.geometry?.dispose());const gset=new Set(),mset=new Set();smoothWorld.traverse(o=>{if(o.geometry)gset.add(o.geometry);if(o.material){if(Array.isArray(o.material))o.material.forEach(x=>mset.add(x));else mset.add(o.material)}});gset.forEach(g=>g.dispose?.());mset.forEach(m=>m.dispose?.());soilTex.dispose();asphaltTex.dispose();renderer.dispose();tex.dispose();opaqueMat.dispose();}};
}
