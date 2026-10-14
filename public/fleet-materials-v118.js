import * as THREE from 'three';
// Small deterministic manufactured-surface atlases. One shared texture set per
// material family, no network files, compatible with Safari WebGL on iPhone.
const cache=new Map();
const palettes={
 brushed:{base:235,panel:15,seam:78,rough:138,kind:'alloy'},
 industrial:{base:204,panel:26,seam:83,rough:188,kind:'armour'},
 stealth:{base:224,panel:12,seam:104,rough:207,kind:'stealth'},
 ceramic:{base:248,panel:6,seam:220,rough:142,kind:'ceramic'},
 pod:{base:204,panel:25,seam:95,rough:178,kind:'pod'},
};
const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
const noise=(a,b,c=0)=>((a*127.1+b*311.7+c*74.7)%997+997)%997/997;
function makeCanvas(){const can=document.createElement('canvas');can.width=256;can.height=256;return can;}
function tex(canvas,isColor=false){
 const t=new THREE.CanvasTexture(canvas);
 t.wrapS=t.wrapT=THREE.RepeatWrapping;
 t.repeat.set(2,3);
 t.magFilter=THREE.LinearFilter;
 t.minFilter=THREE.LinearMipmapLinearFilter;
 t.anisotropy=2;
 if(isColor)t.colorSpace=THREE.SRGBColorSpace;
 return t;
}
export function fleetSurfaceMaps(type='brushed'){
 if(cache.has(type))return cache.get(type);
 const spec=palettes[type]||palettes.brushed;
 const albedo=makeCanvas(),rough=makeCanvas(),bump=makeCanvas();
 const color=albedo.getContext('2d'),rctx=rough.getContext('2d'),bctx=bump.getContext('2d');
 const gray=v=>{const c=clamp(v);return 'rgb('+c+','+c+','+c+')';};
 for(const [ctx,value]of [[color,spec.base],[rctx,spec.rough],[bctx,128]]){
  ctx.fillStyle=gray(value);ctx.fillRect(0,0,256,256);
 }
 const columns=type==='pod'?5:type==='stealth'?3:4,rows=type==='pod'?8:5;
 const cw=256/columns,ch=256/rows;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const x=col*cw,y=row*ch,r=noise(col,row,type.length),border=type==='stealth'?2:2.5;
  const tone=spec.base+(r-.5)*spec.panel;
  color.fillStyle=gray(tone);color.fillRect(x+border,y+border,cw-border*2,ch-border*2);
  color.strokeStyle=gray(spec.seam);color.lineWidth=1;color.strokeRect(x+1,y+1,cw-2,ch-2);
  color.fillStyle='rgba(255,255,255,'+(type==='ceramic'?.09:.16)+')';color.fillRect(x+3,y+3,cw-7,1);
  rctx.fillStyle=gray(spec.rough+(r-.5)*48);rctx.fillRect(x+2,y+2,cw-4,ch-4);
  bctx.strokeStyle='rgb(91,91,91)';bctx.lineWidth=1.2;bctx.strokeRect(x+1.5,y+1.5,cw-3,ch-3);
  bctx.fillStyle='rgb(147,147,147)';bctx.fillRect(x+3,y+3,cw-6,1);
  if((row+col)%3===0){
   // Access covers, with darker inset seams and small manufactured bolts.
   const px=x+cw*.24,py=y+ch*.21,pw=cw*.54,ph=ch*.55;
   color.strokeStyle=gray(spec.seam+17);color.strokeRect(px,py,pw,ph);
   bctx.strokeStyle='rgb(104,104,104)';bctx.strokeRect(px,py,pw,ph);
   for(const [dx,dy]of[[4,4],[pw-4,4],[4,ph-4],[pw-4,ph-4]]){
    color.fillStyle='rgba(14,21,29,.52)';color.fillRect(px+dx-1,py+dy-1,2,2);
    bctx.fillStyle='rgb(177,177,177)';bctx.fillRect(px+dx-1,py+dy-1,2,2);
   }
  }
  if(type==='pod'||type==='industrial'){
   color.fillStyle='rgba(15,24,30,.45)';
   bctx.fillStyle='rgb(89,89,89)';
   for(let k=0;k<3;k++){
    const vx=x+cw*.15+k*cw*.22;
    color.fillRect(vx,y+ch*.76,cw*.13,Math.max(1,ch*.035));
    bctx.fillRect(vx,y+ch*.76,cw*.13,2);
   }
  }
 }
 if(type==='stealth'){
  // Long, angular facet seams to differentiate PHANTOM from the others.
  color.strokeStyle='rgba(36,48,57,.22)';color.lineWidth=2;
  bctx.strokeStyle='rgb(111,111,111)';bctx.lineWidth=2;
  for(const ctx of [color,bctx]){
   ctx.beginPath();ctx.moveTo(2,110);ctx.lineTo(95,35);ctx.lineTo(190,158);ctx.lineTo(255,118);ctx.stroke();
  }
 }
 if(type==='industrial'||type==='brushed'){
  for(let i=0;i<145;i++){
   const x=noise(i,19)*256,y=noise(i,71)*256;
   const length=4+noise(i,43)*24;
   color.strokeStyle='rgba(247,252,255,'+(.02+noise(i,56)*.07)+')';
   color.lineWidth=.6;color.beginPath();color.moveTo(x,y);color.lineTo(x+length,y+.3);color.stroke();
   rctx.strokeStyle='rgba(255,255,255,.09)';
   rctx.lineWidth=.5;rctx.beginPath();rctx.moveTo(x,y);rctx.lineTo(x+length,y);rctx.stroke();
  }
 }
 if(type==='ceramic'){
  for(let i=0;i<24;i++){
   const x=noise(i,17)*256,y=noise(i,19)*256;
   color.strokeStyle='rgba(170,190,205,.16)';color.lineWidth=.7;
   color.beginPath();color.moveTo(x,y);color.lineTo(x+26,y+1);color.stroke();
  }
 }
 const pack={map:tex(albedo,true),roughnessMap:tex(rough),bumpMap:tex(bump)};
 cache.set(type,pack);
 return pack;
}
export function disposeFleetSurfaceMaps(){
 for(const maps of cache.values())for(const t of Object.values(maps))t.dispose();
 cache.clear();
}
