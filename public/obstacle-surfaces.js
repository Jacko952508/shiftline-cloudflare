import {illuminateHazard} from './obstacle-glow-v155.js?v=158';
import {actuationPeriod} from './hazard-families-v156.js?v=158';
import * as THREE from 'three';
import {finishSurface,bevelBox} from './art-direction-v148.js?v=153';

// Compact, procedural PBR atlases for the race hazards. One 256px atlas per
// course, plus a separate organic finish for Leviathan's reef structure.
// Materials stay unique per obstacle because their tunnel-clipping uniforms
// are frame-specific, but the four textures are shared between all obstacles.
const SIZE=256,TAU=Math.PI*2,cache=new Map(),MAX_IDLE=2;
const THEMES={
  1:{base:0x6e899b,metalness:.83,roughness:.47,accent:0x70deff}, // orbital machined alloy
  2:{base:0x709e9b,metalness:.7,roughness:.57,accent:0x68ebd4},  // pressure-aged copper alloy
  3:{base:0x746d65,metalness:.73,roughness:.78,accent:0xffa55d}, // volcanic refractory steel
  4:{base:0x8399ad,metalness:.82,roughness:.45,accent:0x8acbff}, // storm-hardened titanium
  5:{base:0x8b987e,metalness:.38,roughness:.88,accent:0xa9ed88}, // reclaimed bio-alloy
  6:{base:0x737589,metalness:.76,roughness:.4,accent:0xc5a0ff}   // obsidian fractured plate
};
const clamp=(v,min=0,max=255)=>Math.min(max,Math.max(min,v));
function random(x,y,seed){let h=Math.imul(x+seed*71,374761393)^Math.imul(y+seed*29,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
function atlas(course,organic=false){
 const key=course+(organic?':reef':''),stored=cache.get(key);
 if(stored){stored.users++;cache.delete(key);cache.set(key,stored);return stored.maps}
 const maps={};const base=new Uint8ClampedArray(SIZE*SIZE*4),rough=new Uint8ClampedArray(base.length),emit=new Uint8ClampedArray(base.length),normal=new Uint8ClampedArray(base.length),height=new Float32Array(SIZE*SIZE);
 const theme=THEMES[course]||THEMES[1];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const i=y*SIZE+x,k=i*4,u=x/SIZE,v=y/SIZE,n=random(x,y,course),coarse=random(x>>4,y>>4,course),fine=random(x>>2,y>>2,course);
  let value=.69+n*.08+coarse*.095,etched=0,glow=0,relief=.5,matte=.52;
  if(course===1){
   const sx=x%64,sy=y%64,seam=sx<2||sy<2,bolt=(sx-9)**2+(sy-9)**2<5||((sx-55)**2+(sy-55)**2<5);
   const circuit=Math.abs((x+Math.floor(y/32)*11)%64-19)<2&&sy>8&&sy<56;
   value=seam?.28:bolt?.91:.65+coarse*.14+fine*.025;
   etched=seam?-.19:bolt?.13:0;glow=circuit?.63:bolt?.32:0;matte=seam?.94:.38+coarse*.13;
  }else if(course===2){
   const rib=x%48<3,rail=y%80<3,patina=(fine>.67&&coarse>.43),salt=Math.sin(x*.3+y*.065+coarse*5)*.035;
   value=rib?.33:.62+coarse*.12+n*.05+salt-(patina?.17:0);
   etched=rib?-.16:Math.sin(y*.15+x*.015)*.04;
   glow=rail?.34:patina&&n>.85?.17:0;matte=.64+coarse*.2;
  }else if(course===3){
   const plate=x%64<3||y%64<3,crack=Math.abs(Math.sin(x*.062+Math.sin(y*.075)*1.9)+Math.sin(y*.14+x*.013))<.11;
   const hot=crack&&coarse>.37;
   value=plate?.34:.46+coarse*.16+n*.07-(crack?.13:0);
   etched=crack?-.22:coarse*.07;glow=hot?.76:plate?.09:0;matte=.82+coarse*.13;
  }else if(course===4){
   const rib=y%48<3,streak=Math.abs((x+(Math.floor(y/24)%2)*23)%58-29)<2;
   const chevron=Math.abs(((x+y*.56)%80)-40)<3&&Math.floor(y/48)%3===0;
   value=rib?.37:.7+coarse*.11+n*.04;
   etched=rib?-.13:streak?.07:0;glow=chevron?.7:streak?.13:0;matte=rib?.78:.41+coarse*.12;
  }else if(course===5){
   const vine=Math.abs(Math.sin(x*.038+Math.sin(y*.032)*1.8)+Math.cos(y*.09+x*.014)*.7)<.11;
   const moss=coarse>.44&&fine>.46;
   value=.48+coarse*.19+n*.07+(moss?.05:0);
   etched=vine?.13:Math.sin(y*.09)*.025;glow=vine?.47:moss&&n>.93?.22:0;matte=.81+coarse*.15;
  }else if(course===6){
   const fault=Math.abs(Math.sin(x*.06+y*.033+Math.sin(y*.035)*2)+Math.sin(y*.105-x*.017)*.65)<.115;
   const vein=Math.abs(Math.sin(x*.12-y*.055))<.07&&coarse>.66;
   value=fault?.24:.54+coarse*.18+fine*.065;
   etched=fault?-.2:coarse*.065;glow=fault?.78:vein?.4:0;matte=fault?.38:.4+coarse*.24;
  }
  if(organic){
   const vein=Math.abs(Math.sin(x*.07+Math.cos(y*.04)*2)+Math.sin(y*.11))<.2;
   value=.52+coarse*.17+fine*.08-(vein?.07:0);etched=vein?.13:coarse*.06;
   glow=vein?.20:0;matte=.94;
  }
  height[i]=clamp(relief+etched+n*.035,0,1);
  const shade=clamp(value*255),rf=clamp(matte*255),gl=clamp(glow*255);
  // Keep the base map neutral so per-course metal paint can tint accurately.
  base[k]=clamp(shade*1.03);base[k+1]=shade;base[k+2]=clamp(shade*.98);base[k+3]=255;
  rough[k]=rough[k+1]=rough[k+2]=rf;rough[k+3]=255;
  emit[k]=emit[k+1]=emit[k+2]=gl;emit[k+3]=255;
 }
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const i=y*SIZE+x,k=i*4,l=height[y*SIZE+((x+SIZE-1)%SIZE)],r=height[y*SIZE+((x+1)%SIZE)],d=height[((y+SIZE-1)%SIZE)*SIZE+x],u=height[((y+1)%SIZE)*SIZE+x];
  const dx=(l-r)*3.5,dy=(d-u)*3.5,inv=1/Math.hypot(dx,dy,1);
  normal[k]=clamp((dx*inv*.5+.5)*255);normal[k+1]=clamp((dy*inv*.5+.5)*255);normal[k+2]=clamp((inv*.5+.5)*255);normal[k+3]=255;
 }
 for(const [name,data]of [['map',base],['normalMap',normal],['roughnessMap',rough],['emissiveMap',emit]]){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE;
  const c=canvas.getContext('2d');const image=c.createImageData(SIZE,SIZE);image.data.set(data);c.putImageData(image,0,0);
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.colorSpace=(name==='map'||name==='emissiveMap')?THREE.SRGBColorSpace:THREE.NoColorSpace;
  texture.anisotropy=4;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;
  maps[name]=texture;
 }
 cache.set(key,{maps,users:1});return maps;
}
export function makeObstacleMaterial(obstacle){
 const course=obstacle.course,organic=(course===2&&/reef/.test(obstacle.kind))||(course===5&&/root/.test(obstacle.kind)),t=THEMES[course]||THEMES[1],maps=atlas(course,organic);
 obstacle.surfaceAtlasKey=course+(organic?':reef':'');
 const mat=new THREE.MeshStandardMaterial({...maps,vertexColors:!!obstacle.family,color:organic?0xb69d87:t.base,metalness:organic?.13:t.metalness,roughness:organic?.94:t.roughness,normalScale:new THREE.Vector2(organic?.32:.48,organic?.32:.48),emissive:t.accent,emissiveIntensity:course===6?.55:course===3?.52:.46,side:THREE.FrontSide});
 finishSurface(mat,organic?'organic':'obstacle',course);illuminateHazard(mat,{period:actuationPeriod(obstacle.family),driveScale:1.8+(obstacle.variant||0)*.18});if(obstacle.family){mat.userData.hazardGlowStrength.value=1.15;mat.emissiveIntensity*=.78;mat.fog=false;}return mat;
}
export function releaseObstacleSurface(obstacle){
 const key=obstacle.surfaceAtlasKey;if(!key)return;obstacle.surfaceAtlasKey=null;
 const entry=cache.get(key);if(!entry)return;entry.users=Math.max(0,entry.users-1);
 const idle=[...cache.entries()].filter(([,v])=>v.users===0);
 while(idle.length>MAX_IDLE){const [old,e]=idle.shift();for(const map of Object.values(e.maps))map.dispose();cache.delete(old)}
}
function accentMaterial(obstacle){
 const t=THEMES[obstacle.course]||THEMES[1];
 const material=new THREE.MeshBasicMaterial({color:t.accent,toneMapped:false,side:THREE.DoubleSide});
 obstacle.trim.push(material);return material;
}
// An instanced pair of guide rails on hazard faces: one draw, no hit-box changes.
export function detailObstacleSolid(obstacle,mesh,shape){
 if(shape.type==='box'&&shape.hx>.35&&shape.hy>.25){
  const width=Math.min(2*shape.hx*.79,11),geom=new THREE.PlaneGeometry(width,Math.max(.035,Math.min(.115,shape.hy*.07)));
  const stripes=new THREE.InstancedMesh(geom,accentMaterial(obstacle),2),dummy=new THREE.Object3D();
  for(let i=0;i<2;i++){dummy.position.set(0,(i?1:-1)*shape.hy*.78,shape.hz+.018);dummy.updateMatrix();stripes.setMatrixAt(i,dummy.matrix)}
  stripes.instanceMatrix.needsUpdate=true;stripes.frustumCulled=false;stripes.renderOrder=1;stripes.name='Hazard face guide lines';
  mesh.add(stripes);
 }else if(shape.type==='sphere'&&shape.r>.38){
  const geom=new THREE.TorusGeometry(shape.r*.69,Math.max(.018,shape.r*.045),5,32);
  const core=new THREE.Mesh(geom,accentMaterial(obstacle));core.position.z=shape.r*.79;core.name='Hazard hub corona';mesh.add(core);
 }
}
export function makeInstancedRingClamps(obstacle,shape){
 const count=18,geo=bevelBox(shape.tube*.46,shape.tube*.24,shape.tube*.22,.012);
 const metal=THEMES[obstacle.course]||THEMES[1],mat=new THREE.MeshStandardMaterial({color:metal.base,roughness:.48,metalness:.8});
 const band=new THREE.InstancedMesh(geo,mat,count),dummy=new THREE.Object3D();
 for(let j=0;j<count;j++){const a=j*TAU/count;dummy.position.set((shape.x||0)+Math.cos(a)*shape.R,(shape.y||0)+Math.sin(a)*shape.R,shape.tube*.98);dummy.rotation.z=a;dummy.updateMatrix();band.setMatrixAt(j,dummy.matrix)}
 band.instanceMatrix.needsUpdate=true;band.frustumCulled=false;band.name='Instanced machined ring clamps';return band;
}
