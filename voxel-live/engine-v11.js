
export async function mount(root,resume=null){
 const q=id=>root.querySelector('#'+id),stage=q('vxStage'),canvas=q('vxCanvas');
 const branding=root.querySelector('.vxName');if(branding)branding.innerHTML='REALITY ENGINE <span style="color:#8ff1c8">LIVE</span>';
 const sub=root.querySelector('.vxSub');if(sub)sub.textContent='V11 · ASTRAEUS · SPACE EXPLORATION';
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
 let spaceMode=false;
 const spaceAutoEnter=directorState.activeMap==='space'||!directorState.spaceWorldSeen;
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

const landscapeMat=new T.MeshStandardMaterial({map:soilTex,normalMap:groundNormal,normalScale:new T.Vector2(.6,.6),vertexColors:true,roughness:.89,metalness:0,envMapIntensity:.28});
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

 // Puddled road layer, batched into one instanced draw call.
 let wetness=0;
 const puddleCanvas=document.createElement('canvas');puddleCanvas.width=puddleCanvas.height=96;
 const pct=puddleCanvas.getContext('2d'),pg=pct.createRadialGradient(48,48,3,48,48,46);
 pg.addColorStop(0,'rgba(220,240,250,.65)');pg.addColorStop(.48,'rgba(200,235,255,.34)');
 pg.addColorStop(.83,'rgba(183,224,255,.1)');pg.addColorStop(1,'rgba(175,220,255,0)');
 pct.fillStyle=pg;pct.fillRect(0,0,96,96);
 const puddleTexture=new T.CanvasTexture(puddleCanvas);
 const puddleMat=new T.MeshBasicMaterial({map:puddleTexture,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
 const puddleGeometry=new T.PlaneGeometry(1,1);puddleGeometry.rotateX(-Math.PI/2);
 const puddleCount=mobile?40:75,puddles=new T.InstancedMesh(puddleGeometry,puddleMat,puddleCount);
 const puddleDummy=new T.Object3D();
 for(let i=0;i<puddleCount;i++){
  const road=mainRoads[i%mainRoads.length],along=hash(i*7,91)*.91+.045,p=road.curve.getPoint(along);
  const tangent=road.curve.getTangent(along),side=hash(i,7)>.5?1:-1;
  const drift=(hash(i,51)*.8+.1)*road.width*.36*side;
  puddleDummy.position.set(p.x-tangent.z*drift,coastH(p.x,p.z)+.43,p.z+tangent.x*drift);
  puddleDummy.rotation.y=hash(i,61)*Math.PI;puddleDummy.scale.set(.85+hash(i,71)*1.8,1,1.3+hash(i,76)*2);
  puddleDummy.updateMatrix();puddles.setMatrixAt(i,puddleDummy.matrix);
 }
 puddles.instanceMatrix.needsUpdate=true;puddles.visible=false;smoothWorld.add(puddles);

const roadFurnitureMat=coastMaterial(0x33404b,.38,.74),warmLamp=new T.MeshBasicMaterial({color:0xffdda0,toneMapped:false});
const baseBox=new T.BoxGeometry(1,1,1);
const placeBox=(group,w,h,d,mat,x,y,z)=>{
 const m=new T.Mesh(baseBox,mat);m.position.set(x,y,z);m.scale.set(w,h,d);group.add(m);return m;
};

 let safeVistaTick=()=>{};
 try {
 // V7 VISTA REMASTER: skyline, lighthouse, sculpted cliff coast and roadside furniture.
 const vistaGroup=new T.Group();smoothWorld.add(vistaGroup);
 const vistaStone=new T.MeshStandardMaterial({color:0xa4a49a,roughness:.95,metalness:.04}),
       vistaRock=new T.MeshStandardMaterial({color:0x626b6d,roughness:.98}),
       vistaMetal=new T.MeshStandardMaterial({color:0x263b49,metalness:.74,roughness:.32}),
       vistaAccent=new T.MeshPhysicalMaterial({color:0xda6952,metalness:.48,roughness:.29,clearcoat:.94}),
       vistaLamp=new T.MeshBasicMaterial({color:0xffdf9d,toneMapped:false}),
       vistaCool=new T.MeshBasicMaterial({color:0x92e7ed,toneMapped:false});
 const scenicGeometry=(geometry,material,x,y,z,root=vistaGroup)=>{
   const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);root.add(mesh);return mesh;
 };
 function mountLighthouse(x,z){
  const y=coastH(x,z),g=new T.Group();g.position.set(x,y,z);vistaGroup.add(g);
  const white=new T.MeshStandardMaterial({color:0xe9e7dc,metalness:.03,roughness:.65});
  const stripe=new T.MeshStandardMaterial({color:0xb84d47,metalness:.12,roughness:.52});
  scenicGeometry(new T.CylinderGeometry(3.1,4.5,16,18),white,0,8,0,g);
  scenicGeometry(new T.CylinderGeometry(3.38,3.65,2.35,18),stripe,0,9,0,g);
  scenicGeometry(new T.CylinderGeometry(3.0,3.34,2.1,18),stripe,0,13.4,0,g);
  scenicGeometry(new T.CylinderGeometry(3.9,3.7,.6,18),vistaMetal,0,16.3,0,g);
  const glass=new T.MeshPhysicalMaterial({color:0xc6eaff,metalness:.27,roughness:.08,transparent:true,opacity:.54,depthWrite:false,clearcoat:1});
  scenicGeometry(new T.CylinderGeometry(2.7,2.7,3.4,20),glass,0,18.25,0,g);
  const light=scenicGeometry(new T.CylinderGeometry(1.4,1.4,1.4,20),vistaLamp,0,18.3,0,g);
  scenicGeometry(new T.ConeGeometry(3.7,2.5,20),vistaAccent,0,21.1,0,g);
  scenicGeometry(new T.CylinderGeometry(.12,.12,4,8),vistaMetal,0,24.05,0,g);
  const ring=scenicGeometry(new T.TorusGeometry(4,.075,6,36),vistaMetal,0,16.25,0,g);
  ring.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    const post=scenicGeometry(new T.CylinderGeometry(.075,.075,2.1,7),vistaMetal,Math.cos(a)*3.8,17.05,Math.sin(a)*3.8,g);
  }
  const beacon=new T.SpotLight(0xffe5a5,45,175,Math.PI/10,.78,1.35);
  beacon.position.set(0,18.4,0);
  const target=new T.Object3D();target.position.set(24,13,0);g.add(target,beacon);beacon.target=target;
  return {g,target,beacon};
 }
 const lighthouse=mountLighthouse(44,80);
 // Low-poly geometry is deliberately layered and shaded as limestone strata.
 // Instanced rock needles are visible from the starting overlook without one mesh per stone.
 const formations=mobile?44:70;
 const cliffs=new T.InstancedMesh(new T.ConeGeometry(1,1,6),vistaRock,formations);
 const strata=new T.InstancedMesh(new T.CylinderGeometry(.97,1,.13,6),vistaStone,formations);
 const cliffDummy=new T.Object3D();
 for(let i=0;i<formations;i++){
   let x=15+hash(i*37,12)*90,z=43+hash(i*17,32)*54;
   if(Math.hypot(x-44,z-80)<9)x+=10;
   const h=coastH(x,z),height=3+hash(i*4,71)*12,rad=1.1+hash(i,39)*3.1;
   cliffDummy.position.set(x,h+height*.48,z);
   cliffDummy.rotation.set(0,hash(i,12)*Math.PI*2,0);
   cliffDummy.scale.set(rad,height,rad*.9);cliffDummy.updateMatrix();cliffs.setMatrixAt(i,cliffDummy.matrix);
   cliffDummy.position.y=h+height*.35;cliffDummy.scale.set(rad*.98,.22,rad*.89);
   cliffDummy.updateMatrix();strata.setMatrixAt(i,cliffDummy.matrix);
 }
 cliffs.instanceMatrix.needsUpdate=true;strata.instanceMatrix.needsUpdate=true;vistaGroup.add(cliffs,strata);
 // Winding roadside crash barriers and reflective roadway markers.
 const railTransforms=[],lampTransforms=[],lampGlobes=[],signTransforms=[];
 for(let ri=0;ri<mainRoads.length;ri++){
  const road=mainRoads[ri];const sections=ri===0?36:ri===1?27:22;
  for(let i=0;i<sections;i++){
    const t=(i+.5)/sections,p=road.curve.getPoint(t),tan=road.curve.getTangent(t);
    const a=Math.atan2(tan.x,tan.z),edge=road.width*.5+.72;
    for(const side of [-1,1]){
     const x=p.x-tan.z*edge*side,z=p.z+tan.x*edge*side;
     const hy=coastH(x,z);
     railTransforms.push([x,hy+.8,z,a,sections,road.curve.getLength()/sections*.89]);
     if(i%5===0){
       lampTransforms.push([x,hy+2.4,z]);
       lampGlobes.push([x,hy+4.75,z]);
     }
    }
   }
 }
 const railPart=new T.InstancedMesh(new T.BoxGeometry(1,.19,1),vistaMetal,railTransforms.length);
 const railMarker=new T.InstancedMesh(new T.BoxGeometry(1,.2,.18),vistaAccent,railTransforms.length);
 for(let i=0;i<railTransforms.length;i++){
   const [x,y,z,a,,segment]=railTransforms[i];
   cliffDummy.position.set(x,y,z);cliffDummy.rotation.set(0,a,0);cliffDummy.scale.set(.14,.9,segment);
   cliffDummy.updateMatrix();railPart.setMatrixAt(i,cliffDummy.matrix);
   cliffDummy.position.y=y+.45;cliffDummy.scale.set(.13,.12,segment*.95);cliffDummy.updateMatrix();railMarker.setMatrixAt(i,cliffDummy.matrix);
 }
 railPart.instanceMatrix.needsUpdate=true;railMarker.instanceMatrix.needsUpdate=true;
 vistaGroup.add(railPart,railMarker);
 const lampStem=new T.InstancedMesh(new T.CylinderGeometry(.08,.11,4.7,6),vistaMetal,lampTransforms.length);
 const lampCap=new T.InstancedMesh(new T.SphereGeometry(.32,8,6),vistaLamp,lampTransforms.length);
 for(let i=0;i<lampTransforms.length;i++){
   cliffDummy.position.set(...lampTransforms[i]);cliffDummy.rotation.set(0,0,0);cliffDummy.scale.set(1,1,1);cliffDummy.updateMatrix();lampStem.setMatrixAt(i,cliffDummy.matrix);
   cliffDummy.position.set(...lampGlobes[i]);cliffDummy.updateMatrix();lampCap.setMatrixAt(i,cliffDummy.matrix);
 }
 lampStem.instanceMatrix.needsUpdate=true;lampCap.instanceMatrix.needsUpdate=true;vistaGroup.add(lampStem,lampCap);
 // A striking blue-glass observation arch near the existing coast spawn.
 const archGroup=new T.Group();archGroup.position.set(55,coastH(55,113),113);vistaGroup.add(archGroup);
 const archMaterial=new T.MeshPhysicalMaterial({color:0x65a8c5,metalness:.56,roughness:.16,clearcoat:1,envMapIntensity:1.8});
 const archGlow=new T.MeshBasicMaterial({color:0x9ef4f8,toneMapped:false});
 const arch=new T.Mesh(new T.TorusGeometry(7,.48,10,44,Math.PI),archMaterial);
 arch.rotation.y=0;arch.rotation.z=0;arch.position.y=2.4;archGroup.add(arch);
 for(const x of [-7,7])scenicGeometry(new T.CylinderGeometry(.4,.5,2.4,10),archMaterial,x,1.2,0,archGroup);
 const innerArch=new T.Mesh(new T.TorusGeometry(6.43,.12,8,44,Math.PI),archGlow);
 innerArch.rotation.copy(arch.rotation);innerArch.position.copy(arch.position);archGroup.add(innerArch);
 // Bold branded information billboard at the viewpoint: actual canvas glyphs, not floating placeholders.
 const billboard=document.createElement('canvas');billboard.width=768;billboard.height=240;
 const bctx=billboard.getContext('2d'),bgrad=bctx.createLinearGradient(0,0,768,240);
 bgrad.addColorStop(0,'#10374a');bgrad.addColorStop(1,'#1a5862');
 bctx.fillStyle=bgrad;bctx.fillRect(0,0,768,240);
 bctx.strokeStyle='#92efe4';bctx.lineWidth=7;bctx.strokeRect(11,11,746,218);
 bctx.fillStyle='#d4fffa';bctx.font='bold 71px system-ui';bctx.fillText('CRESCENT COAST',41,105);
 bctx.fillStyle='#ffd7a6';bctx.font='bold 33px system-ui';bctx.fillText('REALITY ENGINE V7  ·  SCENIC REMASTER',44,164);
 bctx.fillStyle='#8ddcda';bctx.font='23px system-ui';bctx.fillText('LIGHTHOUSE ROAD  •  MARINA  •  COASTAL DRIVE',44,206);
 const boardTexture=new T.CanvasTexture(billboard);boardTexture.colorSpace=T.SRGBColorSpace;
 const boardMat=new T.MeshBasicMaterial({map:boardTexture,side:T.DoubleSide});
 const board=scenicGeometry(new T.PlaneGeometry(12,3.75),boardMat,0,8.7,0,archGroup);
 board.rotation.y=.13;
 const pillarA=scenicGeometry(new T.CylinderGeometry(.21,.21,7,8),vistaMetal,-5.2,3.5,.2,archGroup);
 const pillarB=scenicGeometry(new T.CylinderGeometry(.21,.21,7,8),vistaMetal,5.2,3.5,.2,archGroup);
 // Scenic rim lighting makes the lookout readable at night, without costly multiple large lights.
 const vistaLight=new T.PointLight(0x83dce9,weather==='night'?7:2,27,2);
 vistaLight.position.set(55,12,113);vistaGroup.add(vistaLight);
 function animateVistaInternal(t){
  fallsShader.uniforms.time.value=t;
  spray.rotation.y=Math.sin(t*.12)*.025;
  lighthouse.target.position.set(Math.cos(t*.48)*32,13,Math.sin(t*.48)*32);
  lighthouse.beacon.intensity=weather==='night'?65:weather==='sunset'?31:14;
  vistaLight.intensity=weather==='night'?10:weather==='sunset'?4:1;
  const skyEmissive=weather==='night'?1:.68;
  innerArch.material.transparent=true;innerArch.material.opacity=skyEmissive;
 }


 // Continuous animated cascade running down the headland.
 const waterfallGroup=new T.Group();vistaGroup.add(waterfallGroup);
 const fallsShader=new T.ShaderMaterial({
   transparent:true,depthWrite:false,side:T.DoubleSide,
   uniforms:{time:{value:0}},
   vertexShader:`varying vec2 vUv;varying vec3 world;void main(){vUv=uv;world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
   fragmentShader:`varying vec2 vUv;varying vec3 world;uniform float time;
   void main(){float strip=sin(vUv.x*23.+sin(vUv.y*13.+time)*1.4)*.12;
    float waves=sin(vUv.y*65.-time*8.+vUv.x*6.)*.1;
    float froth=pow(max(0.,sin(vUv.y*39.-time*5.+vUv.x*25.)),7.)*.28;
    vec3 col=mix(vec3(.05,.34,.51),vec3(.63,.94,1.),.46+strip+waves+froth);
    float alpha=.85+.12*sin(vUv.x*15.);
    gl_FragColor=vec4(col,alpha);
   }`
 });
 const waterfallVertices=[],waterfallUVs=[],waterfallIndices=[];
 const fallX=74,zTop=79,zBottom=47,waterSteps=50;
 for(let i=0;i<=waterSteps;i++){
  const t=i/waterSteps,z=zTop+(zBottom-zTop)*t;
  const h=coastH(fallX,z),topH=coastH(fallX,zTop)+.75;
  const y=T.MathUtils.lerp(topH,SEA+.85,T.MathUtils.smoothstep(t,.02,.92))+.25*Math.sin(t*24);
  const yy=Math.max(h+.17,y);
  const width=2.2+Math.sin(t*7)*.24;
  for(const side of [-1,1]){
   waterfallVertices.push(fallX+width*side,yy,z);
   waterfallUVs.push(side<0?0:1,t*5);
  }
  if(i<waterSteps){let a=i*2;waterfallIndices.push(a,a+1,a+2,a+1,a+3,a+2)}
 }
 const fallsGeo=new T.BufferGeometry();
 fallsGeo.setAttribute('position',new T.Float32BufferAttribute(waterfallVertices,3));
 fallsGeo.setAttribute('uv',new T.Float32BufferAttribute(waterfallUVs,2));
 fallsGeo.setIndex(waterfallIndices);fallsGeo.computeVertexNormals();
 waterfallGroup.add(new T.Mesh(fallsGeo,fallsShader));
 const sprayGeo=new T.BufferGeometry();
 const sprayN=mobile?56:110,sprayPts=new Float32Array(sprayN*3);
 for(let i=0;i<sprayN;i++){
   sprayPts[3*i]=fallX+(hash(i,42)-.5)*9;
   sprayPts[3*i+1]=SEA+1+hash(i,53)*7;
   sprayPts[3*i+2]=zBottom+(hash(i,81)-.5)*9;
 }
 sprayGeo.setAttribute('position',new T.Float32BufferAttribute(sprayPts,3));
 const sprayMat=new T.PointsMaterial({color:0xd2f7ff,size:.42,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending});
 const spray=new T.Points(sprayGeo,sprayMat);waterfallGroup.add(spray);
 // Central contemporary waterfront observatory, providing a recognisable city skyline.
 const observatory=new T.Group();observatory.position.set(166,coastH(166,164),164);vistaGroup.add(observatory);
 const obsFrame=new T.MeshPhysicalMaterial({color:0xbac9cc,metalness:.78,roughness:.25,clearcoat:1});
 const obsGlass=new T.MeshPhysicalMaterial({color:0x2d607a,metalness:.52,roughness:.16,transparent:true,opacity:.83,depthWrite:false,clearcoat:1,envMapIntensity:1.9});
 scenicGeometry(new T.CylinderGeometry(6,8,36,24),obsGlass,0,18,0,observatory);
 for(let i=0;i<=12;i++){
  const y=i*3;
  const ring=scenicGeometry(new T.TorusGeometry(7.1-i*.075,.16,8,26),obsFrame,0,y,0,observatory);ring.rotation.x=Math.PI/2;
 }
 for(let i=0;i<8;i++){
  const angle=i*Math.PI/4,beam=scenicGeometry(new T.CylinderGeometry(.16,.2,35,8),obsFrame,Math.cos(angle)*7.1,18,Math.sin(angle)*7.1,observatory);
 }
 scenicGeometry(new T.CylinderGeometry(9.5,9.5,1.1,26),vistaMetal,0,37,0,observatory);
 scenicGeometry(new T.SphereGeometry(6,24,14),obsGlass,0,41,0,observatory);
 const obsCap=scenicGeometry(new T.TorusGeometry(6.4,.24,8,32),vistaCool,0,42,0,observatory);obsCap.rotation.x=Math.PI/2;


 safeVistaTick=animateVistaInternal;
 } catch(vistaError){
   console.warn('Optional V7 vista layer failed; keeping stable map:',vistaError);
   const hint=root.querySelector('.vxSub');if(hint)hint.textContent='CRESCENT COAST · SCENIC DETAIL FALLBACK';
 }
 function animateVista(t){try{safeVistaTick(t)}catch(error){safeVistaTick=()=>{};console.warn('Vista animation disabled',error)}}
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

 // V8 LIVING CITY: persistent economy, autonomous foot traffic and scheduled deliveries.
 // Resident agents use coarse simulation unless they are near the player.
 const citySim={
   population:124,day:0,minute:8*60,credits:directorState.cityCredits??3400,
   fuel:directorState.cityFuel??920,food:directorState.cityFood??640,
   materials:directorState.cityMaterials??580,energy:directorState.cityEnergy??1000,
   mood:directorState.cityMood??.78,
   deliveries:directorState.cityDeliveries??0,
   activeBusiness:0,incidents:0,
 };
 const businessDefs=[
   {name:'Crescent Market',x:127,z:177,stock:260,goods:'food',demand:1.1},
   {name:'Marina Fuel',x:172,z:67,stock:200,goods:'fuel',demand:1.15},
   {name:'Harbour Workshop',x:208,z:177,stock:140,goods:'materials',demand:1},
   {name:'Bay Hotel',x:194,z:193,stock:220,goods:'food',demand:.95},
   {name:'Coastal Clinic',x:147,z:195,stock:160,goods:'food',demand:.6},
   {name:'Power Station',x:226,z:131,stock:300,goods:'energy',demand:1.25}
 ];
 const buildingsSim=businessDefs.map((b,i)=>({...b,open:true,workers:3+(i%5),earnings:0}));
 const cityActors=[],uniformCoat=new T.MeshStandardMaterial({color:0x78a5b6,roughness:.87}),
       streetFace=new T.MeshStandardMaterial({color:0xddbb9d,roughness:.88});
 const actorGeo=new T.CapsuleGeometry(.21,.78,3,5),actorHeads=new T.SphereGeometry(.2,7,5);
 const maxActors=mobile?48:90;
 const cityBodies=new T.InstancedMesh(actorGeo,uniformCoat,maxActors);
 const cityHeads=new T.InstancedMesh(actorHeads,streetFace,maxActors);
 const adummy=new T.Object3D();smoothWorld.add(cityBodies,cityHeads);
 const taskNames=['COMMUTE','SHOP','WORK','LEISURE','DELIVERY','RETURN HOME'];
 for(let i=0;i<maxActors;i++){
   const origin=businessDefs[i%businessDefs.length];
   cityActors.push({id:i,x:origin.x+(hash(i,77)-.5)*12,z:origin.z+(hash(i,88)-.5)*12,
     destination:(i+1)%businessDefs.length,task:i%taskNames.length,
     speed:.58+hash(i,65)*1.15,phase:hash(i,21)*7,think:0,step:0,wealth:45+Math.floor(hash(i,41)*140),
     shift:Math.floor(hash(i,12)*6),visible:true});
 }
 const deliveryLinks=[];
 for(let i=0;i<8;i++){
  const g=new T.Group();smoothWorld.add(g);
  const shell=new T.Mesh(new T.BoxGeometry(1.85,.75,3.6),new T.MeshPhysicalMaterial({color:i%2?0xd5b795:0x769ba2,metalness:.5,roughness:.32}));
  shell.position.y=.8;g.add(shell);
  const cargo=new T.Mesh(new T.BoxGeometry(1.5,1.2,1.8),new T.MeshStandardMaterial({color:0xa38d73,roughness:.9}));
  cargo.position.set(0,1.56,1);g.add(cargo);
  for(const a of [-1,1])for(const z of [-1.12,1.1]){
    const w=new T.Mesh(new T.CylinderGeometry(.37,.37,.25,9),new T.MeshStandardMaterial({color:0x242a2c,roughness:1}));
    w.position.set(a*.98,.4,z);w.rotation.z=Math.PI/2;g.add(w);
  }
  deliveryLinks.push({g,phase:i/8,speed:3.2+(i%3)*1.1,target:i%businessDefs.length,route:i%mainRoads.length});
 }
 const activeClock={secs:0};
 function tickEconomy(dt){
   activeClock.secs+=dt;
   if(activeClock.secs<3)return;
   const loops=Math.min(8,Math.floor(activeClock.secs/3));activeClock.secs-=loops*3;
   for(let k=0;k<loops;k++){
     citySim.minute=(citySim.minute+7)%(24*60);
     if(citySim.minute<7)citySim.day++;
     const hour=citySim.minute/60;
     let open=0;
     for(let i=0;i<buildingsSim.length;i++){
       const b=buildingsSim[i];
       b.open=i===3||i===4||(hour>=7&&hour<=21);
       if(b.open)open++;
       const demand=b.demand*(b.open?1:.21);
       b.stock=Math.max(0,b.stock-demand*.5);
       if(b.open&&b.stock>5){b.earnings+=demand*2.5;citySim.credits+=demand*.68}
       if(b.stock<28&&citySim[b.goods]>40){
         b.stock+=65;citySim[b.goods]-=65;citySim.deliveries++;
       }
     }
     citySim.activeBusiness=open;
     citySim.food=Math.max(0,citySim.food-.24);
     citySim.fuel=Math.max(0,citySim.fuel-.19);
     citySim.energy=Math.max(0,citySim.energy-.3);
     citySim.mood=T.MathUtils.clamp(citySim.mood+(citySim.food>80&&open>2?.002:-.007),.15,.97);
   }
   Object.assign(directorState,{cityCredits:Math.round(citySim.credits),cityFuel:Math.round(citySim.fuel),
     cityFood:Math.round(citySim.food),cityMaterials:Math.round(citySim.materials),
     cityEnergy:Math.round(citySim.energy),cityMood:citySim.mood,cityDeliveries:citySim.deliveries});
 }
 function tickLivingCity(dt,t){
   tickEconomy(dt);
   const hr=citySim.minute/60;
   const active=hr>=6&&hr<22;
   cityBodies.visible=cityHeads.visible=newMapActive;
   for(let i=0;i<cityActors.length;i++){
     const a=cityActors[i],goal=businessDefs[a.destination];
     a.think-=dt;
     if(a.think<=0){a.think=4+(hash(i+Math.floor(t),17)*7);
       const preferred=hr>=7&&hr<17?Math.floor((i+a.shift)%businessDefs.length):Math.floor(hash(i,Math.floor(t/13))*businessDefs.length);
       a.destination=preferred;a.task=hr>=7&&hr<17?1:i%taskNames.length;
     }
     const dx=goal.x-a.x,dz=goal.z-a.z,dist=Math.hypot(dx,dz);
     const visibility=active||i%4===0;
     a.visible=visibility;
     if(dist>1.8&&visibility){const speed=a.speed*(hr>=20?.8:1);a.x+=dx/dist*speed*dt;a.z+=dz/dist*speed*dt;a.step+=speed*dt}
     if(dist<2)a.destination=(a.destination+1+i%3)%businessDefs.length;
     adummy.position.set(a.x,coastH(a.x,a.z)+.83+Math.sin(a.step*6)*.043,a.z);
     adummy.rotation.set(0,Math.atan2(dx,dz),0);adummy.scale.set(1,visibility?1:.001,1);adummy.updateMatrix();
     cityBodies.setMatrixAt(i,adummy.matrix);
     adummy.position.y+=.76;adummy.updateMatrix();cityHeads.setMatrixAt(i,adummy.matrix);
   }
   cityBodies.instanceMatrix.needsUpdate=true;cityHeads.instanceMatrix.needsUpdate=true;
   for(const d of deliveryLinks){
     const curve=mainRoads[d.route].curve,total=curve.getLength();
     const u=(d.phase+t*d.speed/total)%1,p=curve.getPoint(u),tangent=curve.getTangent(u);
     d.g.position.set(p.x,coastH(p.x,p.z)+.12,p.z);
     d.g.rotation.y=Math.atan2(-tangent.x,-tangent.z);
     d.g.visible=newMapActive&&(loc.x-p.x)**2+(loc.z-p.z)**2<115*115;
   }
 }


 // V10 REALITY EXPERIMENTS: low-cost portal camera, weather front and a fractureable pavilion.
 let portalCooldown=0,portalFrames=0,insideFront=false,portalFailed=false;
 const portalRT=new T.WebGLRenderTarget(mobile?192:320,mobile?256:420,{depthBuffer:true});
 portalRT.texture.colorSpace=T.SRGBColorSpace;
 const portalCamera=new T.PerspectiveCamera(57,(mobile?192:320)/(mobile?256:420),.2,250);
 const portalGlass=new T.MeshBasicMaterial({map:portalRT.texture,side:T.DoubleSide,toneMapped:false});
 const portalEdge=new T.MeshBasicMaterial({color:0x8ff3ed,toneMapped:false});
 const portalFrameMat=new T.MeshPhysicalMaterial({color:0x326e89,metalness:.88,roughness:.17,clearcoat:1});
 function portalGate(x,z,withView){
   const y=coastH(x,z),gate=new T.Group();gate.position.set(x,y,z);smoothWorld.add(gate);
   const pad=new T.Mesh(new T.CylinderGeometry(4.5,4.7,.44,24),portalFrameMat);
   pad.position.y=.22;gate.add(pad);
   const ring=new T.Mesh(new T.TorusGeometry(1,.115,9,64),portalEdge);
   ring.scale.set(3.5,4.9,1);ring.position.y=5;gate.add(ring);
   const outer=new T.Mesh(new T.TorusGeometry(1,.28,10,64),portalFrameMat);
   outer.scale.set(3.8,5.15,1);outer.position.y=5;gate.add(outer);
   const pane=new T.Mesh(new T.PlaneGeometry(6.5,9),withView?portalGlass:
     new T.MeshBasicMaterial({color:0x2a8294,transparent:true,opacity:.79,side:T.DoubleSide}));
   pane.position.y=5;gate.add(pane);
   for(const side of [-3.8,3.8]){
     const post=new T.Mesh(new T.BoxGeometry(.52,9,.66),portalFrameMat);
     post.position.set(side,4.5,.1);gate.add(post);
   }
   return {gate,x,z,pane};
 }
 const portalA=portalGate(94,138,true);
 const portalB=portalGate(192,161,false);
 const portalTarget={x:192,z:173};
 function teleportPortal(dest){
   if(riding)endFlight();
   const y=coastH(dest.x,dest.z);
   loc.set(dest.x,y+2.2,dest.z);
   yaw=dest.x>120?.15:0;pitch=0;velY=0;portalCooldown=5;
   directorState.portalTrips=(directorState.portalTrips||0)+1;
   notify('SPACE FOLDED · destination '+Math.round(dest.x)+' / '+Math.round(dest.z));
 }
 function renderPortalView(){
   if(!newMapActive||!alive||portalFailed)return;
   const d=Math.hypot(loc.x-portalA.x,loc.z-portalA.z);
   if(d>75||++portalFrames%11!==0)return;
   portalCamera.position.set(portalTarget.x,coastH(portalTarget.x,portalTarget.z)+8,portalTarget.z);
   portalCamera.lookAt(172,coastH(172,160)+12,160);
   portalA.gate.visible=portalB.gate.visible=false;
   const previousTarget=renderer.getRenderTarget();
   try{
     renderer.setRenderTarget(portalRT);
     renderer.clear();renderer.render(scene,portalCamera);
   }catch(error){
     console.warn('Portal secondary renderer disabled',error);
     portalFailed=true;
     portalA.pane.material.map=null;
     portalA.pane.material.color.set(0x235d72);
     portalA.pane.material.needsUpdate=true;
   }finally{
     renderer.setRenderTarget(previousTarget);
     portalA.gate.visible=portalB.gate.visible=true;
   }
 }
 const fractureRoot=new T.Group();smoothWorld.add(fractureRoot);
 const pavilion={x:117,z:145,y:coastH(117,145),pieces:[],collapsed:!!directorState.demolished,age:0};
 const intact=new T.Group();intact.position.set(pavilion.x,pavilion.y,pavilion.z);fractureRoot.add(intact);
 const fractureStone=new T.MeshStandardMaterial({color:0xc9bdb0,roughness:.82}),
       fractureGlass=new T.MeshPhysicalMaterial({color:0x6ea5b8,roughness:.15,metalness:.24,transparent:true,opacity:.7,depthWrite:false});
 const fbox=(w,h,d,mat,x,y,z)=>{
   const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);intact.add(m);return m;
 };
 fbox(11,.7,9,fractureStone,0,.35,0);
 fbox(11,.6,9,fractureStone,0,9,0);
 for(const xx of [-5,5])for(const zz of [-4,4])fbox(.7,8,.7,fractureStone,xx,4.8,zz);
 for(const xx of [-2.8,0,2.8]){
  fbox(2.1,6.7,.15,fractureGlass,xx,4.55,-4);
  fbox(2.1,6.7,.15,fractureGlass,xx,4.55,4);
 }
 for(const xx of [-4,4])fbox(.15,6.6,5.5,fractureGlass,xx,4.5,0);
 if(pavilion.collapsed)intact.visible=false;
 function fracturePavilion(){
   if(pavilion.collapsed){notify('This pavilion is already demolished');return}
   pavilion.collapsed=true;intact.visible=false;pavilion.age=0;
   directorState.demolished=true;directorState.events=(directorState.events||0)+1;
   for(let i=0;i<30;i++){
     const base=intact.children[i%intact.children.length],part=new T.Mesh(
       new T.BoxGeometry(.75+hash(i,11)*1.7,.5+hash(i,33)*1.15,.8+hash(i,55)*1.35),
       i%4===0?fractureGlass:fractureStone);
     part.position.set(pavilion.x+(hash(i*3,7)-.5)*10,pavilion.y+4+hash(i,99)*7,
                       pavilion.z+(hash(i*4,81)-.5)*8);
     fractureRoot.add(part);
     const a=i*2.39996;
     pavilion.pieces.push({mesh:part,v:new T.Vector3(Math.cos(a)*2.3,1.4+hash(i,75)*3.4,Math.sin(a)*2.3),rotation:hash(i,78)*3});
   }
   physicsImpulse(pavilion.x,pavilion.z,12);
   notify('Pavilion structure fractured · debris persists this session');
 }
 function resetPavilion(){
   for(const p of pavilion.pieces)fractureRoot.remove(p.mesh);
   pavilion.pieces=[];intact.visible=true;pavilion.collapsed=false;
   directorState.demolished=false;notify('Pavilion rebuilt');
 }
 // Spatial weather systems: moving rain cell with visible low cloud mass.
 let stormFrontEnabled=directorState.stormFrontEnabled!==false;
 const frontCloudTexture=document.createElement('canvas');
 frontCloudTexture.width=frontCloudTexture.height=64;
 const fctx=frontCloudTexture.getContext('2d'),grad=fctx.createRadialGradient(32,32,1,32,32,30);
 grad.addColorStop(0,'rgba(98,125,143,.85)');grad.addColorStop(.56,'rgba(91,113,129,.5)');
 grad.addColorStop(1,'rgba(60,82,106,0)');
 fctx.fillStyle=grad;fctx.fillRect(0,0,64,64);
 const frontTex=new T.CanvasTexture(frontCloudTexture);
 const frontMat=new T.SpriteMaterial({map:frontTex,transparent:true,depthWrite:false,color:0xc4dce2});
 const frontClouds=[];
 for(let i=0;i<18;i++){
   const sp=new T.Sprite(frontMat);sp.scale.set(28+hash(i,19)*21,13,1);smoothWorld.add(sp);frontClouds.push(sp);
 }
 let frontX=40,frontZ=152;
 function experimentTick(dt,t){
   portalCooldown=Math.max(0,portalCooldown-dt);
   if(newMapActive&&!riding&&portalCooldown<=0){
     if(Math.hypot(loc.x-portalA.x,loc.z-portalA.z)<3.5)teleportPortal(portalTarget);
     else if(Math.hypot(loc.x-portalB.x,loc.z-portalB.z)<3.5)teleportPortal({x:94,z:150});
   }
   frontX=125+Math.sin(t*.009)*111;frontZ=145+Math.cos(t*.008)*54;
   for(let i=0;i<frontClouds.length;i++){
     const c=frontClouds[i],a=i*2.39996,r=11+hash(i,13)*43;
     const xx=frontX+Math.cos(a)*r,zz=frontZ+Math.sin(a)*r;
     c.position.set(xx,43+hash(i,44)*13,zz);
     c.visible=newMapActive&&stormFrontEnabled;
   }
   insideFront=newMapActive&&stormFrontEnabled&&Math.hypot(loc.x-frontX,loc.z-frontZ)<45;
   if(insideFront){rain.visible=true;rainMat.opacity=.9;oceanMat.uniforms.storm.value=1}
   else{rainMat.opacity=.65;if(weather!=='rain')oceanMat.uniforms.storm.value=0}
   if(pavilion.pieces.length){
     pavilion.age+=dt;
     for(const p of pavilion.pieces){
       if(p.mesh.position.y>pavilion.y+.3){
         p.v.y-=9.81*dt;p.mesh.position.addScaledVector(p.v,dt);
         if(p.mesh.position.y<pavilion.y+.3){p.mesh.position.y=pavilion.y+.3;p.v.multiplyScalar(.17)}
       }
       p.mesh.rotation.x+=dt*p.rotation;p.mesh.rotation.z+=dt*p.rotation*.7;
     }
   }
 }

const coastHeadlight=new T.PointLight(0xffdaa3,4,36);coastHeadlight.position.set(163,24,173);smoothWorld.add(coastHeadlight);
const coastMeshes=smoothWorld.children.length;
function animateCoast(dt,t){
 if(directorState.trafficPaused)return;
 for(const c of coastTraffic){
  const time=(t*c.speed/c.path.curve.getLength()+c.phase)%1;
  const p=c.path.curve.getPoint(time),dir=c.path.curve.getTangent(time);
  c.g.position.set(p.x,coastH(p.x,p.z)+.38,p.z);
  c.g.rotation.y=Math.atan2(-dir.x,-dir.z);
 }
 coastHeadlight.intensity=weather==='night'?18:3;
}
function setMap(mode,initial=false){
 if(spaceMode)leaveSpaceWorld(true);
 const coast=mode!=='voxel';newMapActive=coast;directorState.activeMap=coast?'crescent':'voxel';
 smoothWorld.visible=coast;
 if(typeof coastalWater!=='undefined')coastalWater.visible=coast;
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
 const name=root.querySelector('.vxSub');if(name)name.textContent=coast?'V7 · CRESCENT COAST · SCENIC REMASTER':'LEGACY VOXEL WORLD · MINING · BUILDING';
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
 coastalWater.position.set(127,SEA+.955,127);coastalWater.visible=newMapActive;scene.add(coastalWater);

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
 
 // Cheap grounded contact shadow under the player's vehicle (no mobile shadow-map cost).
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
 const shctx=shadowCanvas.getContext('2d'),shg=shctx.createRadialGradient(64,64,0,64,64,62);
 shg.addColorStop(0,'rgba(13,20,26,.62)');shg.addColorStop(.55,'rgba(13,20,26,.25)');
 shg.addColorStop(1,'rgba(13,20,26,0)');shctx.fillStyle=shg;shctx.fillRect(0,0,128,128);
 const shadowTexture=new T.CanvasTexture(shadowCanvas);
 const contactShadowMaterial=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,opacity:.4,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});
 const vehicleShadow=new T.Mesh(new T.PlaneGeometry(10.5,6.5),contactShadowMaterial);
 vehicleShadow.rotation.x=-Math.PI/2;vehicleShadow.visible=false;scene.add(vehicleShadow);

 const craftGroup=new T.Group();scene.add(craftGroup);
 const craftBody=new T.Group();craftGroup.add(craftBody);
 const alloy=new T.MeshPhysicalMaterial({color:0xd7e8e9,metalness:.77,roughness:.19,clearcoat:1,clearcoatRoughness:.1,envMapIntensity:1.5});
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
 const chrome=new T.MeshPhysicalMaterial({color:0xc2cdd0,metalness:.97,roughness:.12,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:2.35});
 const racing=new T.MeshPhysicalMaterial({color:0x155e82,metalness:.72,roughness:.13,clearcoat:1,clearcoatRoughness:.07,iridescence:.38,iridescenceIOR:1.32,iridescenceThicknessRange:[180,420],envMapIntensity:2});
 const camel=new T.MeshPhysicalMaterial({color:0xa89873,metalness:.49,roughness:.29,clearcoat:.93,clearcoatRoughness:.14,envMapIntensity:1.2});
 const smoked=new T.MeshPhysicalMaterial({color:0x162d40,metalness:.2,roughness:.055,transparent:true,opacity:.84,depthWrite:false,clearcoat:1,clearcoatRoughness:.04,envMapIntensity:2.1});
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


 // V8 physics: Rapier WASM bodies in a fixed 30Hz simulation, optional fallback for embedded browsers.
 let physicsBackend='INITIALIZING',RAPIER=null,physicsWorld=null,vehicleKin=null,physicsAccum=0;
 const physicsProps=[],physicsGroup=new T.Group();smoothWorld.add(physicsGroup);
 const crateGeo=new T.BoxGeometry(1.25,1.25,1.25),crateMat=new T.MeshStandardMaterial({color:0xbe8651,roughness:.75});
 const tankGeo=new T.CylinderGeometry(.55,.55,1.4,12),tankMat=new T.MeshStandardMaterial({color:0x7898a5,roughness:.32,metalness:.75});
 function createPhysicsProp(x,z,index,y){
   if(physicsProps.length>=26){const old=physicsProps.shift();physicsGroup.remove(old.mesh);if(physicsWorld&&old.body)physicsWorld.removeRigidBody(old.body)}
   const barrel=index%3===0;
   const mesh=new T.Mesh(barrel?tankGeo:crateGeo,barrel?tankMat:crateMat);
   const p={mesh,x,z,y:y??coastH(x,z)+5,vy:0,spin:0,body:null,barrel};
   mesh.position.set(p.x,p.y,p.z);physicsGroup.add(mesh);
   if(physicsWorld&&RAPIER)attachRapier(p);
   physicsProps.push(p);return p;
 }
 function attachRapier(p){
   try{
     const R=RAPIER;
     const body=physicsWorld.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(p.x,p.y,p.z).setLinearDamping(.18));
     const shape=p.barrel?R.ColliderDesc.cylinder(.7,.54):R.ColliderDesc.cuboid(.62,.62,.62);
     physicsWorld.createCollider(shape.setRestitution(.15).setFriction(.82),body);
     physicsWorld.createCollider(R.ColliderDesc.cuboid(2.1,.18,2.1).setTranslation(p.x,coastH(p.x,p.z)-.12,p.z));
     p.body=body;
   }catch(e){console.warn('Rigid body fallback',e)}
 }
 for(let i=0;i<9;i++)createPhysicsProp(62+(i%3)*2,120+Math.floor(i/3)*2,i,coastH(65,123)+4+i*.18);
 async function loadPhysics(){
   try{
     const mod=await import('https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/+esm');
     const R=mod.default||mod;if(typeof R.init==='function')await R.init();
     if(!alive)return;
     RAPIER=R;physicsWorld=new R.World({x:0,y:-9.81,z:0});physicsWorld.timestep=1/30;
     for(const p of physicsProps)attachRapier(p);
     vehicleKin=physicsWorld.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(craftState.x,craftState.y,craftState.z));
     physicsWorld.createCollider(R.ColliderDesc.cuboid(1.12,.7,1.9),vehicleKin);
     physicsBackend='RAPIER 3D';
   }catch(e){physicsBackend='FALLBACK 30HZ';console.warn('Rapier unavailable in embedded mode',e)}
 }
 loadPhysics();
 function advancePhysics(dt){
   physicsAccum=Math.min(.14,physicsAccum+dt);
   let iter=0;
   while(physicsAccum>=1/30&&iter++<4){
     physicsAccum-=1/30;
     if(physicsWorld){
       try{
         if(vehicleKin)vehicleKin.setNextKinematicTranslation({x:craftState.x,y:craftState.y,z:craftState.z});
         physicsWorld.step();
         for(const p of physicsProps)if(p.body){
           const q=p.body.translation(),r=p.body.rotation();
           p.mesh.position.set(q.x,q.y,q.z);p.mesh.quaternion.set(r.x,r.y,r.z,r.w);
         }
       }catch(e){console.warn(e);physicsWorld=null;physicsBackend='FALLBACK 30HZ'}
     }else for(const p of physicsProps){
       p.vy-=9.81/30;p.y+=p.vy/30;
       const floor=coastH(p.x,p.z)+(p.barrel?.7:.63);
       if(p.y<floor){p.y=floor;p.vy=Math.abs(p.vy)>.35?-p.vy*.18:0}
       p.mesh.position.set(p.x,p.y,p.z);p.mesh.rotation.z+=p.spin/30;p.spin*=.98;
     }
   }
   physicsGroup.visible=newMapActive;
 }
 function physicsImpulse(x,z,power){
   for(const p of physicsProps){
     const xx=p.mesh.position.x-x,zz=p.mesh.position.z-z,rad=Math.hypot(xx,zz);
     if(rad>=9||rad<.01)continue;
     const impulse=power*(1-rad/9);
     if(p.body)try{p.body.applyImpulse({x:xx/rad*impulse,y:impulse*.33,z:zz/rad*impulse},true)}catch(e){}
     else{p.vy+=impulse*.3;p.spin+=impulse*.3}
   }
 }
 function physicsDrop(){
   if(!newMapActive)setMap('crescent');
   const x=T.MathUtils.clamp(loc.x+Math.sin(yaw)*7,9,245);
   const z=T.MathUtils.clamp(loc.z-Math.cos(yaw)*7,9,245);
   for(let i=0;i<6;i++)createPhysicsProp(x+(i%3-1)*1.5,z+(i%2)*2,physicsProps.length+i,coastH(x,z)+4+i*.7);
   notify('Interactive rigid-body props · '+physicsBackend);
 }
 const chassis={slip:0,pitch:0,roll:0};
 function suspensionStep(dt,steer,land){
   if(!land||!newMapActive)return;
   const d=1.6,h1=coastH(T.MathUtils.clamp(craftState.x-Math.sin(craftState.heading)*d,1,254),T.MathUtils.clamp(craftState.z-Math.cos(craftState.heading)*d,1,254));
   const h2=coastH(T.MathUtils.clamp(craftState.x+Math.sin(craftState.heading)*d,1,254),T.MathUtils.clamp(craftState.z+Math.cos(craftState.heading)*d,1,254));
   chassis.pitch=T.MathUtils.damp(chassis.pitch,T.MathUtils.clamp(Math.atan2(h1-h2,d*2),-.28,.28),3.5,dt);
   chassis.slip=T.MathUtils.damp(chassis.slip,steer*craftState.speed*.008,3.2,dt);
   chassis.roll=T.MathUtils.damp(chassis.roll,-chassis.slip,3.8,dt);
 }


 // V9 "reality.world/1": validated, incremental and replay-safe world mutations.
 const mutationProtocol='reality.world/1';
 const mutationSeen=new Set(Array.isArray(directorState.receivedMutations)?directorState.receivedMutations:[]);
 const mutationHistory=Array.isArray(directorState.mutationHistory)?directorState.mutationHistory:[];
 let mutationStatus='LOCAL',lastPatchPoll=0,mutationTimer=null,mutationConsole=null;
 function applyWorldMutation(packet,origin='local'){
   if(!packet||typeof packet!=='object'||packet.protocol!==mutationProtocol)throw Error('Protocol must be reality.world/1');
   const id=String(packet.id||'').slice(0,96);
   if(!/^[A-Za-z0-9_.-]{4,96}$/.test(id))throw Error('Mutation needs a safe unique id');
   if(mutationSeen.has(id))return 'Already applied: '+id;
   const op=String(packet.op||''),args=packet.args||{};
   const finite=(val,min,max,name)=>{const n=Number(val);if(!Number.isFinite(n)||n<min||n>max)throw Error(name+' out of bounds');return n};
   const num=(key,min,max)=>finite(args[key],min,max,key);
   if(op==='terrain.deform'){
     if(!newMapActive)throw Error('Terrain deformation requires Crescent Coast');
     const x=num('x',4,251),z=num('z',4,251),radius=num('radius',1,16),depth=num('depth',-9,9);
     if(coastCraters.length>=30)throw Error('Maximum 30 terrain deformations');
     coastCraters.push({x,z,radius,depth});
     directorState.coastCraters=coastCraters;
     for(let j=0;j<coords.count;j++){
       const xx=coords.getX(j),zz=coords.getZ(j);
       if(Math.hypot(xx-x,zz-z)<=radius+2)coords.setY(j,coastH(xx,zz));
     }
     coords.needsUpdate=true;terrainGeom.computeVertexNormals();
   }else if(op==='city.supply'){
     const resource=String(args.resource||'');
     if(!['food','fuel','materials','energy'].includes(resource))throw Error('Unknown city resource');
     const amount=num('amount',1,300);
     citySim[resource]=Math.min(2000,citySim[resource]+amount);
     const key='city'+resource[0].toUpperCase()+resource.slice(1);
     directorState[key]=citySim[resource];
   }else if(op==='city.business'){
     const index=Math.round(num('index',0,buildingsSim.length-1));
     const amount=num('stock',0,300);
     buildingsSim[index].stock=Math.min(500,buildingsSim[index].stock+amount);
   }else if(op==='physics.spawn'){
     const x=num('x',4,251),z=num('z',4,251),count=Math.round(num('count',1,8));
     for(let k=0;k<count;k++)createPhysicsProp(x+(k%3)*1.4,z+(k%2)*1.6,k,coastH(x,z)+4+k*.45);
   }else if(op==='vehicle.spawn'){
     const type=String(args.type||'');
     if(!vehicleData[type])throw Error('Unknown vehicle');
     if(!newMapActive)setMap('crescent');
     selectVehicle(type);
   }else if(op==='climate.set'){
     const type=String(args.weather||'');
     if(!['clear','rain','night','sunset'].includes(type))throw Error('Invalid weather');
     const el=q('vxWeather');el.value=type;el.dispatchEvent(new Event('change'));
   }else if(op==='traffic.control'){
     directorState.trafficPaused=!!args.paused;
   }else if(op==='portal.travel'){
     const dest=String(args.destination||'');
     if(!['marina','lighthouse'].includes(dest))throw Error('Valid portal destinations: marina, lighthouse');
     if(!newMapActive)setMap('crescent');
     teleportPortal(dest==='marina'?portalTarget:{x:94,z:150});
   }else if(op==='gravity.set'){
     directorState.lowGravity=!!args.low;
   }else if(op==='structure.fracture'){
     const state=String(args.state||'collapse');
     if(!['collapse','rebuild'].includes(state))throw Error('Structure state must be collapse or rebuild');
     if(state==='collapse')fracturePavilion();else resetPavilion();
   }else if(op==='storm.front'){
     stormFrontEnabled=!!args.enabled;directorState.stormFrontEnabled=stormFrontEnabled;
   }else if(op==='physics.impulse'){
     const x=num('x',4,251),z=num('z',4,251),power=num('power',1,40);
     physicsImpulse(x,z,power);
   }else{
     throw Error('Unknown operation: '+op);
   }
   mutationSeen.add(id);
   if(mutationSeen.size>150){const oldest=mutationSeen.values().next().value;mutationSeen.delete(oldest)}
   mutationHistory.push({id,op,origin,at:Date.now()});
   if(mutationHistory.length>35)mutationHistory.shift();
   directorState.receivedMutations=[...mutationSeen];
   directorState.mutationHistory=mutationHistory;
   directorState.events=(directorState.events||0)+1;
   persist();
   return 'Applied '+op+' · '+id;
 }
 function createMutationPanel(){
   const node=document.createElement('div');
   node.style.cssText='position:absolute;left:10px;right:10px;top:94px;max-height:56%;overflow-y:auto;z-index:8;border:1px solid #73e7c9;background:#071a2af2;border-radius:12px;padding:12px;color:#dcfff5;display:none;font:11px system-ui';
   node.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b>🧬 WORLD MUTATION PROTOCOL 1</b><button data-control="close">✕</button></div><p style="color:#9fcec8;margin:7px 0">Validated edits apply immediately without restarting Three.js. Use unique IDs to prevent duplicates.</p><textarea aria-label="Mutation command" style="width:100%;height:118px;background:#081c29;color:#c6fff2;font:10px/1.5 monospace;border:1px solid #387c84;border-radius:7px;padding:8px;resize:vertical"></textarea><div style="display:flex;gap:6px;margin-top:6px"><button data-control="apply">APPLY JSON</button><button data-control="example">EXAMPLE</button><button data-control="log">EVENT LOG</button></div><div data-out style="padding-top:8px;white-space:pre-wrap;color:#b0f8d9"></div>';
   stage.appendChild(node);
   const ta=node.querySelector('textarea'),out=node.querySelector('[data-out]');
   const makeExample=()=>({protocol:mutationProtocol,id:'manual-'+Date.now(),op:'city.supply',args:{resource:'materials',amount:100}});
   ta.value=JSON.stringify(makeExample(),null,2);
   node.addEventListener('click',e=>{
     const b=e.target.closest('button[data-control]');if(!b)return;
     const action=b.dataset.control;
     if(action==='close'){node.style.display='none';return}
     if(action==='example'){ta.value=JSON.stringify(makeExample(),null,2);return}
     if(action==='log'){out.textContent=mutationHistory.slice(-8).map(v=>v.id+' → '+v.op).join('\n')||'No world mutations yet';return}
     if(action==='apply'){
       try{out.textContent=applyWorldMutation(JSON.parse(ta.value));notify('World patch accepted')}catch(err){out.textContent='Rejected: '+String(err.message||err)}
     }
   });
   return node;
 }
 // The existing chat updater remains responsible for engine versions.
 // This optional channel checks pure JSON commands without running external code.
 const patchAddress='https://raw.githubusercontent.com/Jacko952508/shiftline-cloudflare/nimbus-chat-live/voxel-live/world-mutations/live.json';
 async function pollWorldMutations(){
   if(!alive)return;
   try{
     const response=await fetch(patchAddress+'?v='+Date.now(),{cache:'no-store'});
     if(!response.ok)throw Error('HTTP '+response.status);
     const payload=await response.json();
     if(payload.protocol!==mutationProtocol||!Array.isArray(payload.events))throw Error('Invalid mutation feed');
     let count=0;
     for(const event of payload.events.slice(-15)){
       try{
         if(event?.id&&!mutationSeen.has(event.id)){applyWorldMutation(event,'github');count++}
       }catch(error){console.warn('Rejected remote world patch',error)}
     }
     mutationStatus=count?'APPLIED '+count:'CONNECTED';
   }catch(e){mutationStatus='OFFLINE / OPTIONAL'}
 }

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
   riding=false;directorState.riding=false;flightLift=0;vehicleShadow.visible=false;
   loc.set(craftState.x,(newMapActive?coastH(craftState.x,craftState.z):Math.max(ground(Math.floor(craftState.x),Math.floor(craftState.z)),SEA))+2.3,craftState.z);
   yaw=craftState.heading;pitch=.04;velY=0;
   flightButtons();notify('Exited '+vehicleData[vehicleType].name+' · craft remains in the world');
 }

 function flightTick(dt,t){
  if(!riding){vehicleShadow.visible=false;return;}
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
  suspensionStep(dt,inputX,land);
  if(newMapActive&&land&&Math.abs(craftState.speed)>4)physicsImpulse(craftState.x,craftState.z,Math.min(7,Math.abs(craftState.speed)*.12));
  craftGroup.position.set(craftState.x,craftState.y+(land?.02:Math.sin(t*4)*.09),craftState.z);
  const floorY=newMapActive?coastH(craftState.x,craftState.z):ground(craftState.x,craftState.z);
  const floorGap=Math.max(0,craftState.y-floorY);
  vehicleShadow.position.set(craftState.x,floorY+.08,craftState.z);
  vehicleShadow.rotation.z=-craftState.heading;
  vehicleShadow.scale.setScalar(1+Math.min(2.2,floorGap*.029));
  vehicleShadow.visible=newMapActive&&floorGap<75&&vehicleType!=='boat';
  contactShadowMaterial.opacity=Math.max(.045,.41-floorGap*.005);
  craftGroup.rotation.y=craftState.heading;
  const model=vehicleModels[vehicleType];
  model.rotation.z=land?chassis.roll:craftState.bank;
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
   lightDir:{value:new T.Vector3(-38,70,26).normalize()},
   night:{value:0},time:{value:0},haze:{value:.28}
  },
  vertexShader:`varying vec3 v;
void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform vec3 top,horizon,lightDir;
uniform float night,time,haze;
varying vec3 v;
float rnd(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,73.7)))*43758.5453);}
void main(){
 vec3 d=normalize(v);
 float height=smoothstep(-.15,.86,d.y);
 vec3 col=mix(horizon,top,pow(height,.82));
 float air=exp(-abs(d.y)*9.);
 col=mix(col,horizon,.12*air+haze*.22*air);
 vec3 sunlight=normalize(lightDir);
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

 // V11 — ASTRAEUS / THE CELESTIAL EXPANSE: independent, GPU-first deep-space world.
 // Space is a self-contained scene island: no terrain, NPC or coast tick runs while active.
 const spaceRoot=new T.Group();spaceRoot.visible=false;scene.add(spaceRoot);
 const spaceStates={restore:new Map(),previousCameraFar:camera.far,previousFog:scene.fog,
   previousBackground:scene.background,previousPosition:loc.clone(),previousYaw:yaw,previousPitch:pitch,
   previousSun:sun.intensity,previousHemi:hemi.intensity};
 const spaceSave=directorState.spacePosition||{};
 const spaceCraftState={
   pos:new T.Vector3(Number.isFinite(spaceSave.x)?spaceSave.x:-70,Number.isFinite(spaceSave.y)?spaceSave.y:42,Number.isFinite(spaceSave.z)?spaceSave.z:-525),
   speed:0,boost:false,up:false,down:false,warp:null,clock:0,
   heading:Number.isFinite(spaceSave.heading)?spaceSave.heading:0,
   elevation:Number.isFinite(spaceSave.elevation)?spaceSave.elevation:-.025
 };
 const spaceDiscoveries=new Set(Array.isArray(directorState.spaceDiscoveries)?directorState.spaceDiscoveries:[]);
 const spaceWaypoints=[
   {id:'monolith',name:'THE SILENT ARRAY',p:[-235,15,-380],note:'A derelict communications array broadcasting prime-number signals from an extinct civilisation'},
   {id:'crystal',name:'CRYSTAL REEF',p:[355,-65,-490],note:'Violet crystalline growths on a shattered moon fragment, vibrating in perfect synchrony'},
   {id:'giant',name:'AEON · THE RINGED GIANT',p:[-110,70,-670],note:'An immense blue-violet giant with layered rings and turbulent atmosphere'},
   {id:'ember',name:'EMBER DRIFT',p:[-490,-70,-875],note:'A molten world of black volcanic stone and luminous thermal currents'},
   {id:'gateway',name:'THE HORIZON GATE',p:[355,32,-1620],note:'An ancient luminous ring structure pointing into unknown interstellar space'},
   {id:'nix',name:'NIX · ICE WORLD',p:[560,130,-1900],note:'An aurora-wrapped frozen sphere with towering icy continents'},
   {id:'ark',name:'THE GHOST ARK',p:[-660,85,-2170],note:'A kilometre-long exploration vessel whose crew never returned'},
   {id:'singularity',name:'GRAVITY WELL X9',p:[-780,60,-2430],note:'A gravitational singularity inside a whirling incandescent accretion disc'}
 ];
 const spacePalette={
   indigo:new T.Color('#7775ff'),violet:new T.Color('#be60ff'),cyan:new T.Color('#58e7ff'),
   amber:new T.Color('#ffc28d'),ice:new T.Color('#87eaff')
 };
 const spaceMat=(hex,rough=.32,metal=.4)=>new T.MeshPhysicalMaterial({color:hex,roughness:rough,metalness:metal,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.35});
 const spaceMetal=spaceMat(0xa8b7cf,.22,.81),spaceDark=spaceMat(0x192c48,.3,.82),
       spaceTrim=spaceMat(0x4a82a5,.18,.8),spaceGlass=spaceMat(0x3986ae,.06,.36),
       spaceGlow=new T.MeshBasicMaterial({color:0x61ddff,toneMapped:false}),
       spaceGold=new T.MeshBasicMaterial({color:0xf9bb81,toneMapped:false});
 const spaceMesh=(parent,geometry,material,x=0,y=0,z=0)=>{
   const o=new T.Mesh(geometry,material);o.position.set(x,y,z);parent.add(o);return o;
 };
 const spaceBox=(parent,w,h,d,m,x=0,y=0,z=0)=>spaceMesh(parent,new T.BoxGeometry(w,h,d),m,x,y,z);
 const spaceBall=(parent,r,m,x=0,y=0,z=0,segments=16)=>spaceMesh(parent,new T.SphereGeometry(r,segments,Math.max(9,segments/2)),m,x,y,z);
 // Galaxy sky: animated 3D volumetric-looking fractal ribbons and fine star cells.
 const cosmicSkyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,depthTest:false,
  uniforms:{time:{value:0},nebula:{value:1}},
  vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
    varying vec3 vDir;uniform float time,nebula;
    float hs(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
    float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(mix(hs(i),hs(i+vec3(1,0,0)),f.x),mix(hs(i+vec3(0,1,0)),hs(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(hs(i+vec3(0,0,1)),hs(i+vec3(1,0,1)),f.x),mix(hs(i+vec3(0,1,1)),hs(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=n3(p)*a;p=p*2.1+1.27;a*=.5;}return v;}
    void main(){
      vec3 d=normalize(vDir);float t=time*.003;
      float bands=fbm(d*4.2+vec3(t,.12,-t*.3));
      float smoke=fbm(d*11.8+vec3(t*.42,.5,-t));
      float swirl=fbm(d*2.4+vec3(bands*1.3,t*.16,smoke*.45));
      float milky=pow(max(0.,1.-abs(dot(d,normalize(vec3(.14,.82,.41))))),2.4);
      float cloud=smoothstep(.36,.73,bands*.64+smoke*.2+swirl*.43)*milky*nebula;
      vec3 night=mix(vec3(.003,.006,.023),vec3(.014,.012,.052),smoothstep(-.7,.5,d.y));
      vec3 magenta=vec3(.47,.075,.68),blue=vec3(.025,.24,.63),pink=vec3(.89,.21,.43);
      vec3 glow=mix(blue,magenta,smoothstep(.38,.69,swirl));
      glow=mix(glow,pink,pow(smoke,3.)*.64);
      vec3 col=night+glow*cloud*.92;
      float star=hs(floor(d*1850.));
      col+=vec3(.67,.84,1.)*step(.99922,star)*(.4+.6*hs(floor(d*390.)));
      float fine=hs(floor(d*3400.));
      col+=vec3(.78,.68,1.)*step(.99986,fine)*.48;
      gl_FragColor=vec4(col,1.);
    }`
 });
 const cosmicSky=spaceMesh(spaceRoot,new T.SphereGeometry(7800,38,24),cosmicSkyMat);
 cosmicSky.renderOrder=-30;
 // High-density physical star parallax. One geometry and one draw call.
 const starCount=mobile?3600:7500,starsGeometry=new T.BufferGeometry(),
   starCoords=new Float32Array(starCount*3),starColors=new Float32Array(starCount*3);
 for(let i=0;i<starCount;i++){
   const u=hash(i*17,41)*2-1,a=hash(i*3+19,91)*Math.PI*2,rad=900+Math.pow(hash(i*9+1,73),.7)*4900;
   const f=Math.sqrt(1-u*u);starCoords[i*3]=Math.cos(a)*f*rad;
   starCoords[i*3+1]=u*rad;starCoords[i*3+2]=Math.sin(a)*f*rad;
   const tint=hash(i,27),lum=.48+hash(i,61)*.52;
   starColors[i*3]=(tint>.86?1:.72)*lum;
   starColors[i*3+1]=(tint>.86?.72:.85)*lum;
   starColors[i*3+2]=lum;
 }
 starsGeometry.setAttribute('position',new T.BufferAttribute(starCoords,3));
 starsGeometry.setAttribute('color',new T.BufferAttribute(starColors,3));
 const starfield=new T.Points(starsGeometry,new T.PointsMaterial({size:mobile?1.5:2.0,
   sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.89,depthWrite:false,blending:T.AdditiveBlending}));
 spaceRoot.add(starfield);
 // One reusable high quality corona texture provides economical apparent bloom (no multipass render).
 const coronaCanvas=document.createElement('canvas');coronaCanvas.width=coronaCanvas.height=256;
 const corCtx=coronaCanvas.getContext('2d'),corGrad=corCtx.createRadialGradient(128,128,1,128,128,126);
 corGrad.addColorStop(0,'rgba(255,255,255,1)');corGrad.addColorStop(.09,'rgba(220,247,255,.93)');
 corGrad.addColorStop(.22,'rgba(116,205,255,.51)');corGrad.addColorStop(.56,'rgba(101,125,255,.13)');
 corGrad.addColorStop(1,'rgba(65,92,255,0)');
 corCtx.fillStyle=corGrad;corCtx.fillRect(0,0,256,256);
 const coronaTex=new T.CanvasTexture(coronaCanvas);coronaTex.colorSpace=T.SRGBColorSpace;
 const glowSprite=(parent,color,x,y,z,width,opacity=.8)=>{
   const mat=new T.SpriteMaterial({map:coronaTex,color,transparent:true,opacity,
     depthWrite:false,blending:T.AdditiveBlending});
   const sp=new T.Sprite(mat);sp.position.set(x,y,z);sp.scale.set(width,width,1);parent.add(sp);return sp;
 };
 // Procedural planet surface: storms and latitudinal banding, rim-lit by a fictional sun.
 function planetSurface(name,pos,radius,palette,ringed=false){
   const group=new T.Group();group.position.set(...pos);spaceRoot.add(group);
   const material=new T.ShaderMaterial({uniforms:{
     time:{value:0},cA:{value:new T.Color(palette[0])},cB:{value:new T.Color(palette[1])},
     cC:{value:new T.Color(palette[2])},illum:{value:new T.Vector3(-.63,.5,.4).normalize()},
     storminess:{value:palette[3]||1}
    },
    vertexShader:`varying vec3 vObj,vNor,vWorld;void main(){vObj=position;vNor=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vObj,vNor,vWorld;
      uniform vec3 cA,cB,cC,illum;uniform float time,storminess;
      float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
       return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
        mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){
        vec3 n=normalize(vObj),N=normalize(vNor),v=normalize(cameraPosition-vWorld);
        float lat=n.y*22.+sin(n.x*18.+time*.12)*.57;
        float whorl=noise(n*13.+vec3(time*.015,0.,0.));
        float band=sin(lat*2.9+whorl*5.1*storminess+noise(n*32.)*1.8)*.5+.5;
        vec3 col=mix(cA,cB,smoothstep(.17,.89,band));
        col=mix(col,cC,pow(whorl,3.)*.81);
        float ndl=max(.08,dot(N,illum)*.62+.42);
        float fres=pow(1.-max(dot(N,v),0.),3.);
        col=col*(.18+.82*ndl)+mix(cB,vec3(.45,.67,1.),.54)*fres*.58;
        gl_FragColor=vec4(col,1.);
      }`
   });
   const sphere=spaceMesh(group,new T.SphereGeometry(radius,mobile?46:68,mobile?30:44),material);
   const atmo=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.BackSide,
     uniforms:{color:{value:new T.Color(palette[1])}},
     vertexShader:`varying vec3 N,V;void main(){vec4 p=modelMatrix*vec4(position,1.);N=normalize(mat3(modelMatrix)*normal);V=normalize(cameraPosition-p.xyz);gl_Position=projectionMatrix*viewMatrix*p;}`,
     fragmentShader:`varying vec3 N,V;uniform vec3 color;void main(){float f=pow(1.-abs(dot(normalize(N),normalize(V))),4.);gl_FragColor=vec4(color*f*2.3,f*.74);}`
   });
   const halo=spaceMesh(group,new T.SphereGeometry(radius*1.095,32,22),atmo);
   const entry={name,group,sphere,material,atmo,halo,radius};
   if(ringed){
     const ringsMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
      uniforms:{time:{value:0},inner:{value:radius*1.3},outer:{value:radius*2.06}},
      vertexShader:`varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`varying vec2 vP;uniform float time,inner,outer;
        void main(){float r=length(vP);float p=(r-inner)/(outer-inner);
          float lanes=sin(p*180.)*.23+sin(p*48.)*.2+sin(p*490.)*.06;
          float gap=smoothstep(.12,.18,p)*smoothstep(.98,.88,p);
          float density=clamp(.43+lanes,0.,1.)*gap;
          vec3 gold=vec3(.63,.56,.91),icy=vec3(.30,.71,.93);
          vec3 col=mix(gold,icy,sin(p*24.+time*.009)*.5+.5);
          gl_FragColor=vec4(col*1.38,density*.83);
        }`
     });
     const ring=spaceMesh(group,new T.RingGeometry(radius*1.3,radius*2.06,mobile?124:192,1),ringsMat);
     ring.rotation.x=-.38;ring.rotation.y=.16;entry.ring=ring;entry.ringMat=ringsMat;
   }
   return entry;
 }
 const spacePlanets=[
  planetSurface('AEON',[90,0,-1140],185,['#181039','#3855c6','#ba78f7',1.3],true),
  planetSurface('NIX',[740,150,-2290],147,['#123359','#9deafb','#2a91bf',.65],false),
  planetSurface('EMBER',[-520,-85,-1140],83,['#210b19','#ed492b','#ffcc63',1.8],false)
 ];

 // Polar aurora curtains over NIX: physically curved shell with animated chromatic ribbons.
 const nixAurora=new T.ShaderMaterial({
   transparent:true,depthWrite:false,side:T.BackSide,blending:T.AdditiveBlending,
   uniforms:{time:{value:0}},
   vertexShader:`varying vec3 vPos,vNormal;void main(){vPos=normalize(position);vNormal=normal;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`varying vec3 vPos,vNormal;uniform float time;
      void main(){float poles=pow(abs(vPos.y),4.);
       float ribbon=sin(atan(vPos.z,vPos.x)*13.+vPos.y*23.+time*.27);
       ribbon+=.42*sin(atan(vPos.z,vPos.x)*29.-time*.13);
       float curtain=pow(max(0.,ribbon*.5+.45),4.);
       float alpha=poles*curtain*.27;
       vec3 col=mix(vec3(.07,.88,.85),vec3(.48,.37,1.),.5+.5*sin(vPos.x*12.+time*.25));
       gl_FragColor=vec4(col*2.1,alpha);
      }`
 });
 const aurora=spaceMesh(spacePlanets[1].group,new T.SphereGeometry(170,38,30),nixAurora);
 const aeonMoons=[];
 for(let i=0;i<3;i++){
   const moonMat=new T.MeshStandardMaterial({color:[0xb9abce,0x728999,0xb7a8a0][i],roughness:.95,metalness:.04});
   const moon=spaceBall(spaceRoot,[20,13,25][i],moonMat,0,0,0,20);
   aeonMoons.push({mesh:moon,radius:430+i*112,speed:.011+(3-i)*.006,phase:i*2.39});
 }
 // An orbiting micro-probe records weak signals and gives the craft a personal companion.
 const probe=new T.Group();explorer.add(probe);
 spaceBall(probe,.66,spaceMetal);
 for(const a of [0,Math.PI/2]){
   const rail=spaceMesh(probe,new T.TorusGeometry(1.45,.065,6,32),spaceGlow);
   rail.rotation.y=a;
 }
 glowSprite(probe,0x80bfff,0,0,0,4,.72);

 const burningSun=spaceBall(spaceRoot,67,new T.MeshBasicMaterial({color:0xffbd7c,toneMapped:false}),-650,350,-1760,30);
 const sunGlow=glowSprite(spaceRoot,0xffae68,-650,350,-1760,490,.92);
 const sunFlare=glowSprite(spaceRoot,0xfce7ad,-650,350,-1760,760,.27);
 const brightStarLight=new T.PointLight(0xa9cfff,25,1900,2);
 brightStarLight.position.set(-650,350,-1760);spaceRoot.add(brightStarLight);
 // Accretion-disc singularity; visible ion streams are not an expensive true raytracing solver.
 const singularity=new T.Group();singularity.position.set(-940,85,-2780);spaceRoot.add(singularity);
 const voidCore=spaceBall(singularity,97,new T.MeshBasicMaterial({color:0x010106}),0,0,0,32);
 const discMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
   uniforms:{time:{value:0}},blending:T.AdditiveBlending,
   vertexShader:`varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`varying vec2 vP;uniform float time;
      void main(){float r=length(vP),angle=atan(vP.y,vP.x);float band=sin(r*.23-angle*11.+time*1.2)*.15;
        float sw=sin(angle*21.-time*.65+r*.057)*.5+.5;
        float edge=smoothstep(105.,151.,r)*smoothstep(333.,294.,r);
        vec3 c=mix(vec3(.72,.09,.56),vec3(1.,.63,.17),smoothstep(170.,285.,r)+band);
        gl_FragColor=vec4(c*(1.2+sw*.7),edge*(.58+sw*.4));
      }`
 });
 const accretion=spaceMesh(singularity,new T.RingGeometry(110,330,170,1),discMat);
 accretion.rotation.x=-.46;accretion.rotation.y=.24;
 glowSprite(singularity,0xd353f0,0,0,0,540,.55);
 const blackOrbit=new T.Mesh(new T.TorusGeometry(104,4,9,80),spaceGlow);
 blackOrbit.rotation.x=.44;singularity.add(blackOrbit);
 // Instanced asteroid cloud. Procedural positions and individual rotations in one draw call.
 const rockCount=mobile?540:1200,rockGeo=new T.IcosahedronGeometry(1,1),
   rockMat=new T.MeshStandardMaterial({color:0x768399,roughness:.92,metalness:.12});
 const asteroids=new T.InstancedMesh(rockGeo,rockMat,rockCount);
 const rockDummy=new T.Object3D(),rockColor=new T.Color();
 for(let i=0;i<rockCount;i++){
   const zone=i%3;
   const angle=hash(i,11)*Math.PI*2,rad=zone===0?120+hash(i*3,13)*190:zone===1?290+hash(i*9,15)*650:210+hash(i*19,17)*320;
   const center=zone===0?[-240,20,-435]:zone===1?[50,30,-1180]:[370,-75,-660];
   const yy=(hash(i*4,39)-.5)*(zone===1?210:100);
   rockDummy.position.set(center[0]+Math.cos(angle)*rad,center[1]+yy,center[2]+Math.sin(angle)*rad);
   rockDummy.rotation.set(hash(i,20)*3,hash(i,30)*6,hash(i,40)*3);
   const size=.7+Math.pow(hash(i,59),2)*(zone===1?11:8);
   rockDummy.scale.set(size*(.6+hash(i,78)),size*.72,size*(.8+hash(i,93)));
   rockDummy.updateMatrix();asteroids.setMatrixAt(i,rockDummy.matrix);
   rockColor.setHSL(.58+hash(i,84)*.08,.09+hash(i,83)*.13,.22+hash(i,81)*.34);
   asteroids.setColorAt(i,rockColor);
 }
 asteroids.instanceMatrix.needsUpdate=true;asteroids.instanceColor.needsUpdate=true;
 asteroids.frustumCulled=false;spaceRoot.add(asteroids);


 // ASTRAEUS "KESTREL XR" exploratory spacecraft, bespoke cockpit and animated ion thrusters.
 const explorer=new T.Group();spaceRoot.add(explorer);
 const explorerBody=new T.Group();explorer.add(explorerBody);
 const explorerHull=spaceBall(explorerBody,1,spaceMetal,0,0,0,22);explorerHull.scale.set(2.5,.92,6.9);
 const beak=spaceBall(explorerBody,1,spaceDark,0,.27,-3.3,20);beak.scale.set(1.5,.64,3.6);
 const canopy=spaceBall(explorerBody,1,spaceGlass,0,1.08,-2.2,24);canopy.scale.set(1.52,.67,2.35);
 spaceMesh(explorerBody,new T.TorusGeometry(1.34,.075,6,40,Math.PI),spaceTrim,0,1.1,-2.2).rotation.x=Math.PI/2;
 function explorerWing(sign){
   const mesh=new T.BufferGeometry();
   const v=new Float32Array([
     sign*1.9,0,-1.6,sign*9.5,0,1.45,sign*5.3,0,3.9,
     sign*1.9,0,-1.6,sign*5.3,0,3.9,sign*1.8,0,4.1,
     sign*2, -.11,-1.7,sign*5.3,-.11,3.9,sign*9.5,-.11,1.45,
     sign*2, -.11,-1.7,sign*1.8,-.11,4.1,sign*5.3,-.11,3.9,
   ]);
   mesh.setAttribute('position',new T.BufferAttribute(v,3));mesh.computeVertexNormals();
   spaceMesh(explorerBody,mesh,new T.MeshPhysicalMaterial({color:0x829cbd,metalness:.88,roughness:.26,side:T.DoubleSide,clearcoat:1}));
   const edge=spaceBox(explorerBody,7.5,.12,.17,spaceGlow,sign*5.4,.16,1.18);
   edge.rotation.y=sign*.18;
   const pod=spaceBall(explorerBody,1,spaceDark,sign*7.2,-.27,1.52,16);pod.scale.set(.72,.58,2);
   const tube=spaceMesh(explorerBody,new T.CylinderGeometry(.36,.36,1.2,16),spaceTrim,sign*7.2,-.26,2.65);
   tube.rotation.x=Math.PI/2;
   const flame=spaceBall(explorerBody,.37,spaceGlow,sign*7.2,-.26,3.48,14);flame.scale.z=2.9;
   return flame;
 }
 const explorerThrust=[explorerWing(-1),explorerWing(1)];
 const mainThrusters=[];
 for(const side of [-1,1]){
   const housing=spaceMesh(explorerBody,new T.CylinderGeometry(.76,.89,3.1,18),spaceDark,side*1.3,-.12,3.92);
   housing.rotation.x=Math.PI/2;
   const ring=spaceMesh(explorerBody,new T.TorusGeometry(.69,.14,8,26),spaceGlow,side*1.3,-.12,5.48);
   const glow=glowSprite(explorerBody,0x77f0ff,side*1.3,-.1,6.6,6,.84);
   mainThrusters.push({ring,glow});
 }
 // Mechanical articulation and visual identity.
 for(const side of [-1,1]){
   const fin=spaceBox(explorerBody,.17,2.1,2.4,spaceTrim,side*2.1,1.03,3.55);fin.rotation.z=side*.27;
   for(let i=0;i<5;i++)spaceBox(explorerBody,.35,.08,.45,spaceGold,side*.75,.92,-3.4+i*.64);
 }
 const scannerDome=spaceBall(explorerBody,.64,spaceGlow,0,1.48,.6,14);
 const scannerRing=spaceMesh(explorerBody,new T.TorusGeometry(1.45,.07,8,48),spaceGlow,0,1.2,-3.1);
 scannerRing.rotation.x=Math.PI/2;
 const explorerThrusterLight=new T.PointLight(0x71ecff,2.8,29,2);explorerThrusterLight.position.set(0,0,6);explorer.add(explorerThrusterLight);
 // The Silent Array — orbiting relic and signal beams.
 const arraySite=new T.Group();arraySite.position.set(-235,15,-480);spaceRoot.add(arraySite);
 const ancientMetal=spaceMat(0x253a59,.36,.68),ancientGlow=new T.MeshBasicMaterial({color:0x9c72ff,toneMapped:false});
 const centralCore=spaceBall(arraySite,18,ancientMetal,0,0,0,20);
 const signal=spaceBall(arraySite,12,ancientGlow,0,0,0,18);
 signal.material.transparent=true;signal.material.opacity=.31;
 const orbitalSpokes=[];
 for(let i=0;i<7;i++){
   const a=i*Math.PI*2/7;
   const spire=spaceMesh(arraySite,new T.CylinderGeometry(2.2,3.9,85,8),ancientMetal,
      Math.cos(a)*54,Math.sin(a*2)*15,Math.sin(a)*54);
   spire.rotation.z=a*.12;orbitalSpokes.push(spire);
   spaceBox(arraySite,1.3,2.2,9,ancientGlow,Math.cos(a)*54,Math.sin(a*2)*15+17,Math.sin(a)*54);
 }
 const signalRing=spaceMesh(arraySite,new T.TorusGeometry(75,1.1,8,96),ancientGlow);
 signalRing.rotation.y=.42;signalRing.rotation.x=.64;
 glowSprite(arraySite,0xa97fff,0,0,0,175,.39);
 // The Crystal Reef — jagged iridescent formations on a drifting rock.
 const crystalSite=new T.Group();crystalSite.position.set(355,-75,-660);spaceRoot.add(crystalSite);
 const crystalBase=spaceMesh(crystalSite,new T.IcosahedronGeometry(69,2),spaceDark);
 crystalBase.scale.set(1.28,.34,.95);crystalBase.rotation.z=.18;
 const crystalGeo=new T.ConeGeometry(1,1,5),crystalMat=new T.MeshPhysicalMaterial({
   color:0x9679ff,metalness:.34,roughness:.12,clearcoat:1,iridescence:.75,iridescenceIOR:1.27,emissive:0x301a76,emissiveIntensity:.6,flatShading:true
 });
 const shardCount=mobile?145:280,crystals=new T.InstancedMesh(crystalGeo,crystalMat,shardCount),
   crystalDummy=new T.Object3D(),crystalColor=new T.Color();
 for(let i=0;i<shardCount;i++){
   const a=hash(i,10)*Math.PI*2,rad=Math.sqrt(hash(i,20))*69;
   const x=Math.cos(a)*rad,z=Math.sin(a)*rad*.84,h=3+hash(i,35)*39;
   crystalDummy.position.set(x,h*.41,z);crystalDummy.rotation.set((hash(i,24)-.5)*.45,hash(i,28)*6,(hash(i,36)-.5)*.45);
   crystalDummy.scale.set(1+hash(i,42)*3.8,h,1+hash(i,44)*4);crystalDummy.updateMatrix();
   crystals.setMatrixAt(i,crystalDummy.matrix);
   crystalColor.setHSL(.68+hash(i,55)*.13,.77,.54+hash(i,58)*.31);crystals.setColorAt(i,crystalColor);
 }
 crystals.instanceMatrix.needsUpdate=true;crystals.instanceColor.needsUpdate=true;
 crystalSite.add(crystals);
 glowSprite(crystalSite,0x9672ff,0,28,0,170,.55);
 // Horizon Gate, a colossal portal-shaped ancient alien structure.
 const horizonGate=new T.Group();horizonGate.position.set(355,32,-1840);spaceRoot.add(horizonGate);
 const gateRadius=72;
 for(let i=0;i<4;i++){
   const ring=spaceMesh(horizonGate,new T.TorusGeometry(gateRadius+i*7,1.9+i*.7,8,120),
      i%2?spaceGlow:ancientMetal);
   ring.rotation.y=i*.21;ring.rotation.x=i*.19;
 }
 const gateSpines=[];
 for(let i=0;i<12;i++){
   const a=i*Math.PI/6;
   const ob=spaceMesh(horizonGate,new T.OctahedronGeometry(6+hash(i,20)*8),i%3?ancientMetal:ancientGlow,
     Math.cos(a)*103,Math.sin(a)*103,0);
   ob.rotation.y=a;gateSpines.push(ob);
 }
 const gatewayEye=glowSprite(horizonGate,0x5adfff,0,0,0,150,.58);
 // The Ghost Ark: recognisable asymmetric wreck and solar sails.
 const ghostArk=new T.Group();ghostArk.position.set(-660,85,-2310);spaceRoot.add(ghostArk);
 const arkShip=spaceBall(ghostArk,1,ancientMetal,0,0,0,30);arkShip.scale.set(22,13,117);
 for(let i=0;i<9;i++){
   const z=-93+i*24,r=17+(i%3)*4;
   const rib=spaceMesh(ghostArk,new T.TorusGeometry(r,2.4,7,32),spaceMetal,0,0,z);rib.rotation.y=.14+i*.01;
 }
 for(const side of [-1,1]){
   const sail=spaceBox(ghostArk,3.5,75,94,ancientMetal,side*28,0,10);sail.rotation.z=side*.14;
   for(let i=0;i<10;i++){
     spaceBox(ghostArk,3,1.1,5,spaceGlow,side*30,-29+i*6.4,11+i*.24);
   }
 }
 spaceBox(ghostArk,13,8,48,spaceDark,0,15,-51);
 glowSprite(ghostArk,0x5ca4ef,0,-4,116,98,.35);
 // Moving signal drones near the artefacts.
 const artifactDrones=[];
 const droneMaterial=new T.MeshBasicMaterial({color:0x7edfff,toneMapped:false});
 for(let j=0;j<14;j++){
   const host=j%3===0?arraySite:j%3===1?crystalSite:horizonGate;
   const drone=spaceBall(host,1.1,droneMaterial,0,0,0,10);
   artifactDrones.push({drone,host,radius:32+hash(j,22)*82,phase:j*2.39,rate:.03+hash(j,33)*.055});
 }
 // Warp field: velocity-oriented light tunnels use one LineSegments draw call.
 const warpCount=mobile?85:170,warpGeometry=new T.BufferGeometry(),
  warpPositions=new Float32Array(warpCount*6);
 warpGeometry.setAttribute('position',new T.BufferAttribute(warpPositions,3));
 const warpMaterial=new T.LineBasicMaterial({color:0x91e5ff,transparent:true,opacity:.88,
   depthWrite:false,blending:T.AdditiveBlending});
 const warpLines=new T.LineSegments(warpGeometry,warpMaterial);
 spaceRoot.add(warpLines);warpLines.visible=false;warpLines.frustumCulled=false;
 function updateWarpVisual(t,forward){
   warpLines.visible=!!spaceCraftState.warp;
   if(!spaceCraftState.warp)return;
   const p=spaceCraftState.pos;
   const side=new T.Vector3().crossVectors(forward,new T.Vector3(0,1,0)).normalize();
   const up=new T.Vector3().crossVectors(side,forward).normalize();
   for(let i=0;i<warpCount;i++){
     const angle=hash(i,13)*Math.PI*2,rad=7+hash(i,19)*38;
     const xx=Math.cos(angle)*rad,yy=Math.sin(angle)*rad;
     const zz=18+((hash(i,61)*260+t*170+i*4)%260);
     const origin=p.clone().addScaledVector(side,xx).addScaledVector(up,yy).addScaledVector(forward,zz-120);
     for(let j=0;j<2;j++){
       const dst=origin.clone().addScaledVector(forward,j?8+hash(i,27)*42:0);
       const k=i*6+j*3;warpPositions[k]=dst.x;warpPositions[k+1]=dst.y;warpPositions[k+2]=dst.z;
     }
   }
   warpGeometry.attributes.position.needsUpdate=true;
 }


 // Space exploration UI is touch-first and separate from terrestrial builder controls.
 const spaceStatus=document.createElement('div');
 spaceStatus.style.cssText='position:absolute;z-index:5;top:65px;left:9px;right:9px;pointer-events:none;color:#e4f8ff;display:none;font:11px/1.5 ui-monospace,monospace;text-shadow:0 1px 8px #001420';
 spaceStatus.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:6px"><b style="font:700 14px system-ui;letter-spacing:1.9px;color:#9edbff">✦ ASTRAEUS <span style="color:#e3a4ff">/ V11</span></b><span data-readout style="background:#081725aa;border:1px solid #37667e;padding:3px 7px;border-radius:6px">ENGINES READY</span></div><div data-telemetry style="padding:5px 0 0;font-size:10px;color:#bad3e4">KESTREL XR · DEEP SPACE EXPEDITION</div>';
 stage.appendChild(spaceStatus);
 const spaceControls=document.createElement('div');
 spaceControls.style.cssText='position:absolute;bottom:8px;right:7px;z-index:6;display:none;pointer-events:auto;width:163px;font:700 11px system-ui;color:#fff;touch-action:manipulation';
 spaceControls.innerHTML='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:5px"><button data-space="nav">🪐 SIGHTS</button><button data-space="scan">⌁ SCAN</button><button data-space="boost">⚡ BOOST</button><button data-space="warp">✧ WARP</button><button data-space="up">▲ RISE</button><button data-space="down">▼ DIVE</button><button data-space="world">🌍 WORLD</button><button data-space="director">✦ DIRECTOR</button></div>';
 for(const button of spaceControls.querySelectorAll('button')){
   button.style.cssText='background:linear-gradient(145deg,#0f3857ef,#1e2554f1);border:1px solid #75a9d077;color:#e7faff;border-radius:8px;padding:10px 4px;min-height:41px;font:700 10px system-ui;box-shadow:0 2px 8px #0019;touch-action:none';
 }
 stage.appendChild(spaceControls);
 const starNav=document.createElement('div');
 starNav.style.cssText='position:absolute;z-index:8;left:9px;right:9px;top:101px;max-height:57%;overflow:auto;overscroll-behavior:contain;background:linear-gradient(155deg,#061a2df5,#18264eea);border:1px solid #8bcefaaa;border-radius:12px;color:#e9faff;display:none;padding:11px;font:11px/1.4 system-ui;box-shadow:0 10px 28px #000b';
 starNav.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between"><b style="letter-spacing:1.5px">✧ ASTRAEUS · EXPLORATION INDEX</b><button data-n="close">✕</button></div><p style="color:#b7cde5;margin:6px 0 9px">Select a destination to begin a guided warp. Scan interesting objects to log discoveries.</p><div data-routes style="display:grid;grid-template-columns:1fr;gap:5px"></div><div data-count style="margin-top:10px;color:#8dd5ec"></div>';
 stage.appendChild(starNav);
 const navRoutes=starNav.querySelector('[data-routes]');
 const navCount=starNav.querySelector('[data-count]');
 function updateNavigation(){
   navRoutes.innerHTML=spaceWaypoints.map((w,i)=>{
     const visited=spaceDiscoveries.has(w.id);
     const dist=Math.round(spaceCraftState.pos.distanceTo(new T.Vector3(...w.p)));
     return '<button data-route="'+i+'" style="width:100%;text-align:left;background:#142d50df;color:#d8f5ff;border:1px solid '+(visited?'#5ed8b8':'#6383b1')+';border-radius:8px;padding:8px;font:11px system-ui">'+(visited?'✓ ':'◇ ')+w.name+' <span style="float:right;color:#b6c7e2">'+dist+' km</span></button>';
   }).join('');
   navCount.textContent='SURVEY LOG · '+spaceDiscoveries.size+' / '+spaceWaypoints.length+' UNIQUE SIGHTINGS DISCOVERED';
 }
 const universeToast=document.createElement('div');
 universeToast.style.cssText='position:absolute;top:164px;left:10px;right:10px;z-index:8;background:#071d35d9;border:1px solid #65e7eea5;border-radius:10px;padding:10px;display:none;color:#c8fbff;font:11px/1.45 system-ui;pointer-events:none;box-shadow:0 2px 15px #0006';
 stage.appendChild(universeToast);
 let universeToastUntil=0,lastSight=null,lastSpaceHUD=0,spaceFPSstart=performance.now(),spaceFrameCount=0;
 function spaceNotify(textMsg,seconds=3.5){
   universeToast.textContent=textMsg;
   universeToast.style.display='block';universeToastUntil=performance.now()+seconds*1000;
 }
 function scanUniverse(){
   const sorted=spaceWaypoints.map(w=>({w,dist:spaceCraftState.pos.distanceTo(new T.Vector3(...w.p))})).sort((a,b)=>a.dist-b.dist);
   const near=sorted[0];
   if(!near||near.dist>340){
     const signal=sorted[0];
     spaceNotify('NO DIRECT SIGNAL · nearest object '+signal.w.name+' ('+Math.floor(signal.dist)+' km). Use SIGHTS to warp.',4);
     return;
   }
   lastSight=near.w.id;
   if(!spaceDiscoveries.has(near.w.id)){
     spaceDiscoveries.add(near.w.id);
     directorState.spaceDiscoveries=[...spaceDiscoveries];
     directorState.events=(directorState.events||0)+1;
     spaceNotify('✧ FIRST CONTACT · '+near.w.name+' — '+near.w.note,8);
   }else spaceNotify('✧ '+near.w.name+' — '+near.w.note,7);
   updateNavigation();
 }
 function warpTo(index){
   const target=spaceWaypoints[index];
   if(!target||!spaceMode)return;
   const from=spaceCraftState.pos.clone(),to=new T.Vector3(...target.p);
   if(from.distanceTo(to)<45){spaceNotify('Already in the '+target.name+' sector. Try SCAN.',4);return}
   spaceCraftState.warp={from,to,elapsed:0,duration:3.65,targetIndex:index};
   spaceCraftState.boost=false;lastSight=target.id;
   starNav.style.display='none';
   spaceNotify('✧ WARP ENGAGED · '+target.name,3.4);
 }
 starNav.addEventListener('click',e=>{
   const route=e.target.closest('[data-route]');
   if(route){warpTo(Number(route.dataset.route));return}
   if(e.target.closest('[data-n="close"]'))starNav.style.display='none';
 });
 for(const type of ['up','down']){
   const button=spaceControls.querySelector('[data-space="'+type+'"]');
   button.addEventListener('pointerdown',e=>{
     if(!spaceMode)return;
     e.preventDefault();e.stopPropagation();button.setPointerCapture(e.pointerId);
     spaceCraftState[type]=true;button.style.background='#297ba5';});
   for(const ev of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(ev,()=>{
     spaceCraftState[type]=false;button.style.background='linear-gradient(145deg,#0f3857ef,#1e2554f1)';
   });
 }
 spaceControls.addEventListener('click',e=>{
   const b=e.target.closest('button[data-space]');if(!b||!spaceMode)return;
   const action=b.dataset.space;
   if(action==='nav'){updateNavigation();starNav.style.display=starNav.style.display==='none'?'block':'none'}
   if(action==='scan')scanUniverse();
   if(action==='warp'){
     const route=spaceWaypoints.findIndex(w=>w.id===lastSight);
     warpTo(route>=0?route:2);
   }
   if(action==='boost'){
     spaceCraftState.boost=!spaceCraftState.boost;
     b.style.borderColor=spaceCraftState.boost?'#8fffe2':'#75a9d077';
     spaceNotify(spaceCraftState.boost?'ION AFTERBURNERS · ENGAGED':'ION AFTERBURNERS · IDLE',1.7);
   }
   if(action==='world')leaveSpaceWorld();
   if(action==='director'){directorPanel.style.display='block';updateDirectorStats()}
 });
 function enterSpaceWorld(auto=false){
   if(spaceMode)return;
   if(riding)endFlight();
   spaceStates.previousPosition.copy(loc);
   spaceStates.previousYaw=yaw;spaceStates.previousPitch=pitch;
   spaceStates.previousCameraFar=camera.far;
   spaceStates.previousFog=scene.fog;spaceStates.previousBackground=scene.background;
   spaceStates.previousSun=sun.intensity;spaceStates.previousHemi=hemi.intensity;
   directorState.spaceReturnMap=directorState.activeMap==='voxel'?'voxel':'crescent';
   spaceStates.restore.clear();
   for(const child of scene.children){
     if(child===spaceRoot||child===sun||child===hemi)continue;
     spaceStates.restore.set(child,child.visible);child.visible=false;
   }
   spaceRoot.visible=true;spaceMode=true;directorState.spaceWorldSeen=true;directorState.activeMap='space';
   camera.far=12000;camera.fov=72;camera.updateProjectionMatrix();
   scene.fog=null;scene.background=new T.Color(0x020410);
   hemi.intensity=1.9;sun.intensity=1.5;
   yaw=spaceCraftState.heading;pitch=spaceCraftState.elevation;
   spaceStatus.style.display='block';spaceControls.style.display='block';starNav.style.display='none';
   q('vxHotbar').style.display='none';
   for(const id of ['vxMine','vxPlace','vxJump','vxRun','vxInventory'])q(id).style.display='none';
   const top=root.querySelector('.vxTopOptions');if(top)top.style.opacity='.68';
   const sub=root.querySelector('.vxSub');if(sub)sub.textContent='V11 · ASTRAEUS / THE CELESTIAL EXPANSE';
   spaceNotify(auto?'ASTRAEUS V11 · NEW WORLD LOADED · left thumb to fly, SIGHTS to explore':'ASTRAEUS · WELCOME BACK TO THE EXPANSE',5.8);
 }
 function leaveSpaceWorld(silent=false){
   if(!spaceMode)return;
   directorState.spacePosition={x:spaceCraftState.pos.x,y:spaceCraftState.pos.y,z:spaceCraftState.pos.z,
      heading:yaw,elevation:pitch};
   spaceMode=false;spaceRoot.visible=false;
   for(const [object,vis] of spaceStates.restore)object.visible=vis;
   spaceStates.restore.clear();
   camera.far=spaceStates.previousCameraFar;camera.fov=directorState.cinematic?61:73;
   camera.updateProjectionMatrix();
   scene.fog=spaceStates.previousFog;scene.background=spaceStates.previousBackground;
   sun.intensity=spaceStates.previousSun;hemi.intensity=spaceStates.previousHemi;
   loc.copy(spaceStates.previousPosition);
   yaw=spaceStates.previousYaw;pitch=spaceStates.previousPitch;velY=0;
   directorState.activeMap=directorState.spaceReturnMap||'crescent';
   starNav.style.display='none';spaceStatus.style.display='none';spaceControls.style.display='none';
   universeToast.style.display='none';
   for(const id of ['vxMine','vxPlace','vxJump','vxRun','vxInventory'])q(id).style.display='';
   q('vxHotbar').style.display='';
   const top=root.querySelector('.vxTopOptions');if(top)top.style.opacity='';
   const sub=root.querySelector('.vxSub');if(sub)sub.textContent='CRESCENT COAST · REALITY ENGINE V11';
   if(!silent)notify('Returned to '+(newMapActive?'Crescent Coast':'Voxel World')+' · space expedition saved');
   persist();
 }
 function spaceStep(dt,t){
   const st=spaceCraftState;
   st.clock+=dt;
   cosmicSkyMat.uniforms.time.value=t;
   cosmicSky.position.copy(st.pos);
   // Throttle controls: left-side steering joystick; drag viewport for pitch/heading.
   if(st.warp){
     const w=st.warp;w.elapsed+=dt;
     const progress=T.MathUtils.clamp(w.elapsed/w.duration,0,1);
     const eased=progress*progress*(3-2*progress);
     st.pos.copy(w.from).lerp(w.to,eased);
     const dir=w.to.clone().sub(w.from).normalize();
     yaw=Math.atan2(-dir.x,-dir.z);pitch=Math.asin(T.MathUtils.clamp(dir.y,-.94,.94));
     st.speed=420+Math.sin(Math.PI*progress)*1350;
     if(progress>=1){
       st.warp=null;st.speed=0;lastSight=spaceWaypoints[w.targetIndex].id;
       spaceNotify('WARP COMPLETE · '+spaceWaypoints[w.targetIndex].name+' · press SCAN',4.5);
     }
   }else{
     yaw-=move.x*dt*1.12;
     if(keys.has('a')||keys.has('arrowleft'))yaw+=dt*.95;
     if(keys.has('d')||keys.has('arrowright'))yaw-=dt*.95;
     pitch=T.MathUtils.clamp(pitch,-1.28,1.28);
     const desired=(move.y+(keys.has('w')?1:0)-(keys.has('s')?1:0))*(st.boost?350:115);
     st.speed=T.MathUtils.damp(st.speed,desired,st.boost?.9:1.6,dt);
     const rise=Number(st.up||keys.has(' '))-Number(st.down||keys.has('q'));
     const cp=Math.cos(pitch),direction=new T.Vector3(-Math.sin(yaw)*cp,Math.sin(pitch),-Math.cos(yaw)*cp);
     st.pos.addScaledVector(direction,st.speed*dt);
     st.pos.y+=rise*dt*(st.boost?180:78);
     st.pos.clamp(new T.Vector3(-6500,-3400,-7300),new T.Vector3(6500,3400,4100));
   }
   st.heading=yaw;st.elevation=pitch;
   const cosPitch=Math.cos(pitch);
   const forward=new T.Vector3(-Math.sin(yaw)*cosPitch,Math.sin(pitch),-Math.cos(yaw)*cosPitch);
   const right=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
   const shipLocation=st.pos.clone();
   explorer.position.copy(shipLocation);
   explorer.rotation.order='YXZ';explorer.rotation.y=yaw;explorer.rotation.x=pitch;
   explorerBody.rotation.z=T.MathUtils.damp(explorerBody.rotation.z,move.x*.23,4,dt);
   scannerRing.rotation.z+=dt*.7;scannerDome.material=spaceGlow;
   for(const x of explorerThrust)x.scale.z=2.6+Math.sin(t*13)*.8+(st.boost?2.1:0);
   for(const unit of mainThrusters){
     unit.glow.material.opacity=st.boost?.98:.72;
     unit.glow.scale.setScalar(st.boost?9+Math.sin(t*27)*.9:6+Math.sin(t*10)*.4);
   }
   explorerThrusterLight.intensity=st.boost?9:3.2;
   // Chase camera: flight craft always visible in front of the user.
   const wanted=shipLocation.clone().addScaledVector(forward,-30).add(new T.Vector3(0,9,0));
   camera.position.lerp(wanted,1-Math.exp(-dt*5.6));
   const focus=shipLocation.clone().addScaledVector(forward,46);
   camera.lookAt(focus);
   nixAurora.uniforms.time.value=t;
   for(const [i,moon] of aeonMoons.entries()){
     const angle=t*moon.speed+moon.phase;
     moon.mesh.position.set(90+Math.cos(angle)*moon.radius,Math.sin(angle*1.1)*95,-1140+Math.sin(angle)*moon.radius*.48);
     moon.mesh.rotation.y=t*.03;
   }
   probe.position.set(11,3.4+Math.sin(t*1.4)*1.2,-1.2);
   probe.rotation.y=t*.82;
   for(const p of spacePlanets){
     p.sphere.rotation.y+=dt*.018;
     p.material.uniforms.time.value=t;
     if(p.ringMat)p.ringMat.uniforms.time.value=t;
   }
   discMat.uniforms.time.value=t;accretion.rotation.z=t*.065;
   blackOrbit.rotation.y=t*.22;
   signalRing.rotation.z+=dt*.07;
   horizonGate.rotation.y=Math.sin(t*.08)*.14;
   gatewayEye.material.rotation=t*.015;
   crystalSite.rotation.y=Math.sin(t*.09)*.09;
   sunGlow.material.opacity=.81+Math.sin(t*.4)*.1;
   for(const drone of artifactDrones){
     const a=t*drone.rate+drone.phase,r=drone.radius;
     drone.drone.position.set(Math.cos(a)*r,Math.sin(a*1.7)*r*.25,Math.sin(a)*r);
   }
   // Lower visual detail when very far from landmarks.
   arraySite.visible=shipLocation.distanceTo(arraySite.position)<3100;
   crystalSite.visible=shipLocation.distanceTo(crystalSite.position)<3100;
   ghostArk.visible=shipLocation.distanceTo(ghostArk.position)<3800;
   horizonGate.visible=shipLocation.distanceTo(horizonGate.position)<3600;
   singularity.visible=shipLocation.distanceTo(singularity.position)<6200;
   updateWarpVisual(t,forward);
   // Cheap per-discovery signal marker when player approaches a curious object.
   if(performance.now()-lastSpaceHUD>420){
     lastSpaceHUD=performance.now();
     const nearest=spaceWaypoints.map(w=>({w,dist:shipLocation.distanceTo(new T.Vector3(...w.p))})).sort((a,b)=>a.dist-b.dist)[0];
     const count=spaceDiscoveries.size;
     spaceStatus.querySelector('[data-readout]').textContent=st.warp?'HYPERSPACE · '+Math.round(st.speed)+' KM/S':Math.round(Math.abs(st.speed))+' KM/S · '+(st.boost?'BOOST':'CRUISE');
     spaceStatus.querySelector('[data-telemetry]').textContent=
        'DISCOVERIES '+count+'/8  ·  SECTOR '+Math.round(st.pos.x)+' / '+Math.round(st.pos.y)+' / '+Math.round(st.pos.z)+
        '  ·  SIGNAL '+(nearest?.w.name||'NONE')+' '+Math.round(nearest?.dist||0)+' KM';
     if(universeToastUntil<performance.now())universeToast.style.display='none';
     spaceFrameCount+=1;
     const rate=Math.round(1000/Math.max(10,adaptive.frameMs));
     text('vxFps',rate+' FPS · SPACE · '+renderer.getPixelRatio().toFixed(2)+'x');
     if(quality==='auto'&&performance.now()>adaptive.nextCheck){
       const ratio=renderer.getPixelRatio(),fps=1000/Math.max(1,adaptive.frameMs);
       if(fps<28&&ratio>.68)renderer.setPixelRatio(Math.max(.68,ratio-.075));
       else if(fps>49&&ratio<Math.min(devicePixelRatio||2,mobile?1.25:1.8))renderer.setPixelRatio(Math.min(mobile?1.25:1.8,ratio+.045));
       adaptive.nextCheck=performance.now()+8500;
     }
   }
   // Render star and ship at full quality, never the distant terrestrial worlds.
   renderer.render(scene,camera);
 }

 const directorPanel=document.createElement('div');
 directorPanel.style.cssText='position:absolute;z-index:4;top:103px;left:9px;right:9px;max-height:49%;overflow-y:auto;overscroll-behavior:contain;display:none;background:linear-gradient(160deg,#082c38ef,#09202bf2);border:1px solid #8eead699;border-radius:12px;padding:12px;box-shadow:0 7px 24px #0019;backdrop-filter:blur(12px);color:#eaffff';
 directorPanel.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="letter-spacing:2px">✦ REALITY DIRECTOR</b><button data-action="close">✕ CLOSE</button></div><p style="margin:7px 0 10px;font:11px/1.45 system-ui;color:#bfe0de">These events change the active world. For new features, describe what you want in this ChatGPT conversation and I can publish the next version.</p><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px"><button data-action="space">🚀 ASTRAEUS SPACE WORLD</button><button data-action="sights">✧ SPACE EXPLORATION LOG</button><button data-action="vista">📸 V7 SCENIC VISTA</button><button data-action="coast">🏝 CRESCENT COAST</button><button data-action="voxel">⛏ VOXEL WORLD</button><button data-action="supercar">🏎 ASTRA GT</button><button data-action="expedition">🚙 ATLAS 6×6</button><button data-action="seaplane">🛩 SEAPLANE</button><button data-action="city">🌆 GO TO MEGACITY</button><button data-action="worldmap">🗺 WORLD MAP</button><button data-action="heli">🚁 HAWK HELICOPTER</button><button data-action="jet">✈ STRIKE JET</button><button data-action="buggy">🏎 DUNE BUGGY</button><button data-action="hoverbike">🏍 HOVERBIKE</button><button data-action="boat">🚤 HYDROFOIL</button><button data-action="town">🏙 CREATE SETTLEMENT</button><button data-action="meteor">☄ METEOR IMPACT</button><button data-action="fly">✈ SPAWN SKYRIDER</button><button data-action="storm">⛈ TOGGLE STORM</button><button data-action="visit">🌆 VISIT SETTLEMENT</button><button data-action="relic">◇ VISIT ANOMALY</button><button data-action="stats">🧠 CIVILISATION STATUS</button><button data-action="day">☀ DAYLIGHT</button><button data-action="night">🌙 NIGHT MODE</button><button data-action="golden">🌇 GOLDEN HOUR</button><button data-action="cinematic">🎬 CINEMATIC LENS</button><button data-action="showcase">🏎 COAST SHOWCASE</button><button data-action="renderinfo">📊 GPU METRICS</button><button data-action="portal">🌀 VISIT PORTAL</button><button data-action="collapse">💥 DEMOLISH PAVILION</button><button data-action="rebuild">🏗 REBUILD PAVILION</button><button data-action="gravity">🌙 LOW GRAVITY</button><button data-action="front">⛈ STORM FRONTS</button><button data-action="protocol">🧬 WORLD MUTATIONS</button><button data-action="supply">🚛 RESTOCK CITY</button><button data-action="physicsdrop">📦 DROP CRATES</button><button data-action="impulse">💥 PHYSICS BLAST</button><button data-action="fireworks">🎆 FIREWORKS</button><button data-action="terraform">⛏ TERRAIN BRUSH</button><button data-action="tower">🏗 BUILD TOWER</button><button data-action="lightning">⚡ LIGHTNING STRIKE</button><button data-action="devhud">📊 DEBUG HUD</button><button data-action="distance">🔭 DRAW DISTANCE</button><button data-action="stats">🧠 CIVILISATION STATUS</button></div><div id="realityStats" style="margin-top:10px;border-top:1px solid #ffffff26;padding-top:9px;font:10px/1.65 ui-monospace,monospace;color:#a9e3d9"></div>';
 stage.appendChild(directorPanel);
 directorButton.onclick=()=>{const open=directorPanel.style.display!=='none';directorPanel.style.display=open?'none':'block';updateDirectorStats()};
 function updateDirectorStats(){
   const stats=directorPanel.querySelector('#realityStats');
   if(stats)stats.textContent='POPULATION '+(citizens.length+citySim.population)+' • BUSINESSES '+buildingsSim.filter(x=>x.open).length+' • CITY CREDITS '+Math.floor(citySim.credits)+' • DELIVERIES '+citySim.deliveries+' • CRATERS '+directorState.craters+' • EVENTS '+directorState.events;
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
   if(debugHudOn)debugHud.textContent='REALITY ENGINE V6 / RENDER CORE\nWORLD: '+SIZE+' x '+SIZE+' x '+Y+'\nCHUNKS: '+geoGroups.size+' / '+(SIZE/CHUNK)**2+'\nQUEUE: '+chunkQueue.length+'\nDRAW RADIUS: '+chunkRadius.value+'\nGPU DPR: '+renderer.getPixelRatio().toFixed(2)+'\nDRAWS: '+renderer.info.render.calls+' / '+renderer.info.render.triangles+' TRI'+'\nMODE: '+(riding?vehicleType:'ON FOOT')+'\nWEATHER: '+weather.toUpperCase();
 }

 
 // One-tap showcase: ensures a user who updated while exploring another area
 // can find the actual redesigned part of the map immediately.
 const showcaseButton=document.createElement('button');
 showcaseButton.textContent='📸 V7 SHOWCASE';
 showcaseButton.style.cssText='position:absolute;top:145px;left:10px;z-index:3;background:#13445dda;color:#e2fffa;border:1px solid #88e5d5;border-radius:8px;padding:7px 10px;font:bold 10px system-ui;box-shadow:0 2px 10px #072032aa';
 stage.appendChild(showcaseButton);
 showcaseButton.onclick=()=>{
   if(!newMapActive)setMap('crescent');
   if(riding)endFlight();
   loc.set(53,coastH(53,132)+2.35,132);
   yaw=.13;pitch=-.05;velY=0;
   q('vxWeather').value='sunset';q('vxWeather').dispatchEvent(new Event('change'));
   notify('Crescent Coast V7 showcase loaded');
 };

directorPanel.addEventListener('click',e=>{
   const button=e.target.closest('button[data-action]');if(!button)return;
   const action=button.dataset.action;
   if(action==='close'){directorPanel.style.display='none';return}
   if(action==='space'){directorPanel.style.display='none';enterSpaceWorld(false);return}
   if(action==='sights'){if(!spaceMode)enterSpaceWorld(false);directorPanel.style.display='none';updateNavigation();starNav.style.display='block';return}

   if(action==='portal'){
     if(!newMapActive)setMap('crescent');
     if(riding)endFlight();
     loc.set(94,coastH(94,151)+2.3,151);yaw=0;pitch=-.04;
     directorPanel.style.display='none';notify('Approach the glowing portal to travel');
   }
   if(action==='collapse'){fracturePavilion();directorPanel.style.display='none'}
   if(action==='rebuild'){resetPavilion()}
   if(action==='gravity'){directorState.lowGravity=!directorState.lowGravity;notify(directorState.lowGravity?'LOW GRAVITY ON · moon jumps':'Gravity restored')}
   if(action==='front'){stormFrontEnabled=!stormFrontEnabled;directorState.stormFrontEnabled=stormFrontEnabled;notify(stormFrontEnabled?'Dynamic storm cell enabled':'Dynamic storm cell disabled')}

   if(action==='protocol'){if(!mutationConsole)mutationConsole=createMutationPanel();mutationConsole.style.display='block';directorPanel.style.display='none'}
   if(action==='supply'){try{notify(applyWorldMutation({protocol:mutationProtocol,id:'restock-'+Date.now(),op:'city.supply',args:{resource:'food',amount:180}}))}catch(err){notify(String(err.message||err))}}
   if(action==='physicsdrop'){physicsDrop();directorPanel.style.display='none'}
   if(action==='impulse'){physicsImpulse(loc.x,loc.z,26);notify('Rigid-body impulse activated')}
   if(action==='vista'){
     if(!newMapActive)setMap('crescent');
     if(riding)endFlight();
     loc.set(53,coastH(53,132)+2.35,132);
     yaw=.13;pitch=-.055;velY=0;
     directorPanel.style.display='none';
     q('vxWeather').value='sunset';q('vxWeather').dispatchEvent(new Event('change'));
     notify('V7 scenic vista · lighthouse, arch, coast and roadside detail');
   }

   if(action==='coast'||action==='voxel'){directorPanel.style.display='none';setMap(action==='coast'?'crescent':'voxel');}


   if(action==='city'){if(newMapActive)setMap('voxel');if(riding)endFlight();loc.set(160.5,ground(160,160)+3,160.5);yaw=0;velY=0;directorPanel.style.display='none';requestChunks(loc.x,loc.z);streamChunks(4);notify('Arrived in METROPOLIS DISTRICT · 256×256 world')}
   if(['heli','jet','buggy','hoverbike','boat','supercar','expedition','seaplane'].includes(action)){directorPanel.style.display='none';selectVehicle(action)}
   if(action==='worldmap'){showMap=!showMap;mapCanvas.style.display=showMap?'block':'none';directorPanel.style.display='none';notify('Tap a location on the atlas to teleport')}
   if(action==='night'){const el=q('vxWeather');el.value='night';el.dispatchEvent(new Event('change'))}
   if(action==='golden'){const el=q('vxWeather');el.value='sunset';el.dispatchEvent(new Event('change'));directorPanel.style.display='none';notify('Golden hour · warm directional lighting and reflections')}
   if(action==='cinematic'){directorState.cinematic=!directorState.cinematic;camera.fov=directorState.cinematic?61:73;camera.updateProjectionMatrix();notify(directorState.cinematic?'Cinematic 61° lens engaged':'Wide 73° lens restored')}
   if(action==='showcase'){if(!newMapActive)setMap('crescent');loc.set(74,coastH(74,130)+2.4,130);selectVehicle('supercar');directorPanel.style.display='none';notify('ASTRA GT · Crescent Coast test drive')}
   if(action==='renderinfo'){debugHudOn=!debugHudOn;debugHud.style.display=debugHudOn?'block':'none';notify(debugHudOn?'GPU diagnostics visible':'GPU diagnostics hidden')}
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
 q('vxJump').onclick=()=>{if(riding){endFlight();return}if(grounded){velY=directorState.lowGravity?8.6:6.8;grounded=false}};
 q('vxRun').onclick=()=>{runPressed=!runPressed;q('vxRun').classList.toggle('active',runPressed);if(riding)notify(runPressed?'Skyrider boost engaged':'Skyrider boost disengaged')};
 q('vxInventory').onclick=()=>{q('vxHotbar').classList.toggle('expanded');q('vxInventory').classList.toggle('active')};
 q('vxReset').onclick=()=>{if(spaceMode){spaceCraftState.pos.set(-70,42,-525);spaceCraftState.speed=0;spaceNotify('ASTRAEUS · RETURNED TO ARRIVAL SECTOR');return}if(riding)endFlight();if(newMapActive)loc.set(45,coastH(45,113)+2.4,113);else loc.set(32.5,ground(32,32)+3,32.5);yaw=.5;pitch=.05;notify('Returned to spawn')};
 q('vxWeather').insertAdjacentHTML('beforeend','<option value="sunset">🌇 Golden hour</option>');
 q('vxWeather').onchange=e=>{
  weather=e.target.value;
  const storm=weather==='rain',night=weather==='night',sunset=weather==='sunset';
  sun.intensity=night?.09:storm?.75:sunset?1.65:2.6;
  sun.color.set(sunset?0xffb67f:night?0xa5c2ef:storm?0xd5e1ff:0xffe2b0);
  sun.position.set(sunset?-67:-38,sunset?16:70,26);
  hemi.intensity=night?.67:storm?1.23:sunset?1.56:2;
  skyMat.uniforms.top.value.set(night?'#07182e':storm?'#40566f':sunset?'#315678':'#347fba');
  skyMat.uniforms.horizon.value.set(night?'#29364d':storm?'#7e919a':sunset?'#edaf8b':'#bfdfea');
  skyMat.uniforms.haze.value=sunset?.62:storm?.65:.28;
  skyMat.uniforms.night.value=night?1:0;sunDisk.visible=!newMapActive&&!night&&!storm;
  skyMat.uniforms.lightDir.value.copy(sun.position).normalize();
  oceanMat.uniforms.lightDir.value.copy(sun.position).normalize();
  oceanMat.uniforms.night.value=night?1:0;oceanMat.uniforms.storm.value=storm?1:0;
  oceanMat.uniforms.deep.value.set(night?'#061d39':storm?'#123049':sunset?'#1f5b75':'#123d5e');
  oceanMat.uniforms.shallow.value.set(night?'#174969':storm?'#416578':sunset?'#679ca0':'#3ea7a4');
  scene.fog.color.set(night?0x1e3548:storm?0x748e9b:sunset?0xcb9b8c:0x9abbd1);
  scene.fog.density=storm?.0092:night?.0076:.0065;
  scene.environmentIntensity=night?.4:storm?.7:sunset?.96:.81;
  renderer.toneMappingExposure=night?.91:storm?.95:sunset?1.09:1.07;
  cloudMat.opacity=night?.15:storm?.95:sunset?.6:.8;
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
 q('vxWeather').value='sunset';q('vxWeather').dispatchEvent(new Event('change'));
 setQuality('auto');resizeObserver.observe(stage);
 if(directorState.cinematic){camera.fov=61;camera.updateProjectionMatrix()}
 q('vxLoad').style.opacity='0';setTimeout(()=>{if(alive&&q('vxLoad'))q('vxLoad').style.display='none'},750);
 const rainGeo=new T.BufferGeometry(),rainCount=mobile?250:600,rainPos=new Float32Array(rainCount*3);
 for(let i=0;i<rainCount;i++){rainPos[3*i]=(Math.random()-.5)*50;rainPos[3*i+1]=Math.random()*30;rainPos[3*i+2]=(Math.random()-.5)*50}
 rainGeo.setAttribute('position',new T.BufferAttribute(rainPos,3));
 const rainMat=new T.PointsMaterial({color:0xb3e0fa,size:.08,transparent:true,opacity:.65});
 const rain=new T.Points(rainGeo,rainMat);scene.add(rain);
 let last=performance.now(),fpsAt=last,frames=0,saveAt=last,adaptAt=last,lastCivilWork=last;
 const adaptive={frameMs:22,nextCheck:performance.now()+12000,high:mobile?1.44:1.85,min:.72};

 const stat=()=>({x:loc.x,y:loc.y,z:loc.z,yaw});
 function persist(){
  try{localStorage.setItem(saveKey,JSON.stringify({player:stat(),changes:Object.fromEntries(changes),director:{...directorState,riding,flight:{...craftState}}}))}catch(e){}
 }
 function frame(){
  if(!alive||!root.isConnected)return;requestAnimationFrame(frame);
  const now=performance.now(),elapsed=Math.max(.003,(now-last)/1000),dt=Math.min(.05,elapsed);last=now;
  adaptive.frameMs+=(Math.min(100,elapsed*1000)-adaptive.frameMs)*.09;
  if(spaceMode){
    try{spaceStep(dt,clock.getElapsedTime())}
    catch(error){
      console.warn('Space world runtime fallback',error);
      leaveSpaceWorld(true);
      notify('Space scene recovered to terrestrial world: '+String(error?.message||error).slice(0,60));
    }
    if(now-saveAt>6500){
      saveAt=now;
      directorState.spacePosition={x:spaceCraftState.pos.x,y:spaceCraftState.pos.y,z:spaceCraftState.pos.z,heading:yaw,elevation:pitch};
      directorState.spaceDiscoveries=[...spaceDiscoveries];
      persist();
    }
    return;
  }
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
  if(keys.has(' ')&&grounded){velY=directorState.lowGravity?8.6:6.8;grounded=false}
  const ox=loc.x,oz=loc.z;
  if(canOccupy(loc.x+vx,loc.y,loc.z))loc.x+=vx;else if(canOccupy(loc.x+vx,loc.y+1.01,loc.z)){loc.x+=vx;loc.y+=1}
  if(canOccupy(loc.x,loc.y,loc.z+vz))loc.z+=vz;else if(canOccupy(loc.x,loc.y+1.01,loc.z+vz)){loc.z+=vz;loc.y+=1}
  velY=Math.max(-24,velY-(directorState.lowGravity?6.5:18.8)*dt);
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
  const t=clock.getElapsedTime();skyMat.uniforms.time.value=t;advancePhysics(dt);
  wetness=T.MathUtils.damp(wetness,weather==='rain'?1:0,weather==='rain'?.7:.045,dt);
  asphalt.roughness=.8-wetness*.51;asphalt.envMapIntensity=.64+wetness*.63;
  puddles.visible=newMapActive&&wetness>.025;puddleMat.opacity=wetness*.78;
  landscapeMat.roughness=.94-wetness*.1;oceanMat.uniforms.time.value=t;sunDisk.visible=!newMapActive&&weather!=='night'&&weather!=='rain';advanceDirector(dt,t);updateVfx(dt,t);if(newMapActive){animateCoast(dt,t);animateVista(t);tickLivingCity(dt,t)}else animateTraffic(dt,t);
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
  experimentTick(dt,t);
  if(weather==='rain'){const a=rainGeo.attributes.position;for(let i=0;i<rainCount;i++){let y=a.array[3*i+1]-dt*25;if(y<0)y+=30;a.array[3*i+1]=y}a.needsUpdate=true}
  currentTarget=riding||newMapActive?null:castBlock();
  reticle.visible=!!currentTarget;
  if(currentTarget)reticle.position.set(currentTarget.pos[0]+.5,currentTarget.pos[1]+.5,currentTarget.pos[2]+.5);
  renderPortalView();
  renderer.render(scene,camera);
  frames++;
  if(now-fpsAt>1350){
    const rate=Math.round(frames*1000/(now-fpsAt));frames=0;fpsAt=now;
    text('vxFps',rate+' FPS · '+quality.toUpperCase()+' · '+renderer.getPixelRatio().toFixed(2)+'x');
    text('vxLocation','XYZ '+Math.floor(loc.x)+' / '+Math.floor(loc.y)+' / '+Math.floor(loc.z)+' · '+(newMapActive?'COAST':'CH '+geoGroups.size));
    text('vxTarget',riding?vehicleData[vehicleType].name+' · '+Math.abs(craftState.speed*3.6).toFixed(0)+' km/h · ALT '+Math.floor(craftState.y)+' m':newMapActive?'CRESCENT COAST · Scenic roads · Open Director for vehicles':currentTarget?types[currentTarget.id]+' · '+currentTarget.pos.join(', '):citizens.length+' inhabitants · Director Mode ready');
    if(quality==='auto'&&now>adaptive.nextCheck){
      const ratio=renderer.getPixelRatio();
      const smoothFPS=1000/Math.max(1,adaptive.frameMs);
      if(smoothFPS<28&&(ratio>adaptive.min+.02||(!newMapActive&&chunkRadius.value>2))){
        if(ratio>adaptive.min+.02)renderer.setPixelRatio(Math.max(adaptive.min,ratio-.085));
        if(!newMapActive&&chunkRadius.value>2)chunkRadius.value--;
        resize();
      }else if(smoothFPS>48&&ratio<Math.min(devicePixelRatio||2,adaptive.high)-.02){
        renderer.setPixelRatio(Math.min(Math.min(devicePixelRatio||2,adaptive.high),ratio+.055));
        resize();
      }
      adaptive.nextCheck=now+12000;
    }
  }
  if(now-lastCivilWork>7500){lastCivilWork=now;buildersProgress();updateDirectorStats()}
  if(now-saveAt>5000){saveAt=now;persist()}
  if(!newMapActive){if(!frame.streamAt||now-frame.streamAt>400){frame.streamAt=now;requestChunks(loc.x,loc.z)}streamChunks(mobile?1:2)}
  if(now>tipUntil)q('vxToast').style.opacity='0';
 }
 if(spaceAutoEnter)enterSpaceWorld(true);
 requestAnimationFrame(frame);
 mutationTimer=setInterval(pollWorldMutations,30000);
 pollWorldMutations();
 return {snapshot(){return {player:stat(),changes:Object.fromEntries(changes),director:{...directorState,riding,flight:{...craftState}}}},dispose(){alive=false;
        if(spaceMode)directorState.spacePosition={x:spaceCraftState.pos.x,y:spaceCraftState.pos.y,z:spaceCraftState.pos.z,heading:yaw,elevation:pitch};
        try{physicsWorld?.free?.()}catch(e){}
        warpGeometry.dispose();starsGeometry.dispose();coronaTex.dispose();
        const sg=new Set(),sm=new Set();
        spaceRoot.traverse(o=>{if(o.geometry)sg.add(o.geometry);
          if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>sm.add(m));else sm.add(o.material)}});
        sg.forEach(g=>g.dispose?.());sm.forEach(m=>m.dispose?.());
        for(const n of [spaceStatus,spaceControls,starNav,universeToast])n.remove();
        portalRT.dispose();frontTex.dispose();if(mutationTimer)clearInterval(mutationTimer);persist();resizeObserver.disconnect();stage.removeEventListener('keydown',kd);stage.removeEventListener('keyup',ku);for(const m of geoGroups.values())m.traverse(o=>o.geometry?.dispose());const gset=new Set(),mset=new Set();smoothWorld.traverse(o=>{if(o.geometry)gset.add(o.geometry);if(o.material){if(Array.isArray(o.material))o.material.forEach(x=>mset.add(x));else mset.add(o.material)}});gset.forEach(g=>g.dispose?.());mset.forEach(m=>m.dispose?.());soilTex.dispose();groundNormal.dispose();asphaltTex.dispose();roadNormal.dispose();vaporTexture.dispose();puddleTexture.dispose();shadowTexture.dispose();envTexture.dispose();reflectionTarget?.dispose();renderer.dispose();tex.dispose();opaqueMat.dispose();}};
}
