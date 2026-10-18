import * as THREE from 'three';
// V150: restrained 512px airframe skins. Broad inset panels replace dense
// checkerboard tiling; roughness detail carries the fine manufacturing grain.
const cache=new Map(),SIZE=512;
const palettes={
 brushed:{base:244,panel:8,seam:175,rough:210},
 industrial:{base:234,panel:13,seam:156,rough:225},
 stealth:{base:237,panel:6,seam:191,rough:237},
 ceramic:{base:251,panel:4,seam:218,rough:219},
 pod:{base:241,panel:9,seam:165,rough:222}
};
function canvas(){const c=document.createElement('canvas');c.width=c.height=SIZE;return c;}
const hash=(a,b)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n);};
const gray=n=>'rgb('+[n,n,n].map(v=>Math.round(v)).join(',')+')';
function texture(c,color=false){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,1);t.anisotropy=4;if(color)t.colorSpace=THREE.SRGBColorSpace;return t;}
export function fleetSurfaceMaps(type='brushed'){
 if(cache.has(type))return cache.get(type);
 const s=palettes[type]||palettes.brushed,a=canvas(),r=canvas(),b=canvas();
 const ac=a.getContext('2d'),rc=r.getContext('2d'),bc=b.getContext('2d');
 for(const [ctx,v]of [[ac,s.base],[rc,s.rough],[bc,128]]){ctx.fillStyle=gray(v);ctx.fillRect(0,0,SIZE,SIZE);}
 const paths=type==='stealth'?
  [[[0,60],[160,60],[282,224],[512,224]],[[0,360],[172,360],[315,150],[512,150]],[[70,0],[70,110],[350,420],[350,512]]]:
  [[[0,142],[176,142],[200,168],[512,168]],[[0,354],[322,354],[347,330],[512,330]],[[116,0],[116,142]],[[405,168],[405,330]],[[240,354],[240,512]]];
 for(const points of paths)for(const [ctx,color,width]of [[ac,s.seam,1.4],[rc,244,2.8],[bc,109,1.5]]){
  ctx.strokeStyle=gray(color);ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
 }
 // Directional satin-metal machining and recessed alloy inlays. The larger
 // irregular facets produce readable surfaces rather than a flat grey shell.
 const offsets=type==='stealth'?[28,137,303,427]:type==='pod'?[62,176,284,406]:[18,156,295,425];
 for(let j=0;j<offsets.length;j++){
  const x=offsets[j],w=42+(j%2)*27,top=72+j*86;
  ac.fillStyle=gray(s.base-(j%2?23:34));
  ac.beginPath();ac.moveTo(x,top);ac.lineTo(x+w,top+7);ac.lineTo(x+w-13,top+32);ac.lineTo(x+4,top+24);ac.closePath();ac.fill();
  ac.strokeStyle=gray(s.seam+14);ac.lineWidth=1.5;ac.stroke();
  rc.fillStyle=gray(Math.max(45,s.rough-33));rc.fillRect(x+9,top+8,Math.max(6,w-28),4);
  bc.strokeStyle=gray(94);bc.lineWidth=2;bc.beginPath();bc.moveTo(x+4,top+24);bc.lineTo(x+w-13,top+32);bc.stroke();
 }
 // A few broad access covers and flush screw heads; no repeated tile grids.
 for(const [x,y,w,h]of [[31,195,112,84],[290,390,155,67]]){
  ac.fillStyle=gray(s.base-7);ac.fillRect(x,y,w,h);ac.strokeStyle=gray(s.seam);ac.lineWidth=1;ac.strokeRect(x,y,w,h);
  rc.fillStyle=gray(s.rough-11);rc.fillRect(x,y,w,h);bc.strokeStyle=gray(117);bc.strokeRect(x,y,w,h);
  for(const dx of[6,w-6])for(const dy of[6,h-6]){ac.fillStyle=gray(s.seam-20);ac.fillRect(x+dx-1,y+dy-1,2,2);}
 }
 if(type==='pod'||type==='industrial')for(let j=0;j<5;j++){
  ac.fillStyle=gray(115);ac.fillRect(212+j*11,221,4,59);bc.fillStyle=gray(108);bc.fillRect(212+j*11,221,4,59);
 }
 for(let i=0;i<310;i++){
  const x=hash(i,3)*SIZE,y=hash(i,7)*SIZE,len=5+hash(i,9)*35;
  rc.strokeStyle='rgba(255,255,255,.035)';rc.lineWidth=.5;rc.beginPath();rc.moveTo(x,y);rc.lineTo(x+len,y);rc.stroke();
 }
 const pack={map:texture(a,true),roughnessMap:texture(r),bumpMap:texture(b)};cache.set(type,pack);return pack;
}
export function disposeFleetSurfaceMaps(){for(const maps of cache.values())for(const t of Object.values(maps))t.dispose();cache.clear();}
