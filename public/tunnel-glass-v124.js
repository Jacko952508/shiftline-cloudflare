import * as THREE from 'three';
// V124: glass glazing stays outside the gameplay radius. A single stitched,
// opaque gasket mesh per tunnel chunk seals the old angular pane/metal gaps.
// Reuses the world's existing metal material; no render targets or new lights.
const EPS=1e-6;
function ribbon(vertices,indices,track,start,end,a0,a1,rad,along=true){
 const distance=Math.max(.01,end-start),steps=along?Math.max(2,Math.ceil(distance/5)):Math.max(2,Math.ceil(Math.abs(a1-a0)*22));
 const anchor=vertices.length/3;
 for(let i=0;i<=steps;i++){
  const u=i/steps;
  for(let j=0;j<2;j++){
   const s=along?start+distance*u:start+distance*j;
   const a=along?(j===0?a0:a1):a0+(a1-a0)*u;
   const F=track.frame(s);
   const cs=Math.cos(a),sn=Math.sin(a);
   vertices.push(F.p.x+rad*(cs*F.r.x+sn*F.u.x),F.p.y+rad*(cs*F.r.y+sn*F.u.y),F.p.z+rad*(cs*F.r.z+sn*F.u.z));
  }
 }
 for(let i=0;i<steps;i++){
  const k=anchor+i*2;
  indices.push(k,k+2,k+1,k+1,k+2,k+3);
 }
}
export function installGlassFittings(group,track,glass,frameMaterial,options={}){
 const panes=[];
 group.traverse(o=>{
  if(!o.isMesh||o.material!==glass)return;
  const section=o.geometry?.userData?.tunnelSection;
  if(section)panes.push(section);
  o.name='GLASS / CLEAR WINDOW';
  o.castShadow=false;o.receiveShadow=false;
  o.renderOrder=1; // Glass is translucent, and NEVER writes depth over scenery.
 });
 if(!panes.length)return null;
 const vertices=[],indices=[];
 let edgePairs=0,crossSeams=0;
 for(const p of panes){
  const {start,end,a0,a1,rad}=p;
  if(!(end>start&&a1>a0&&rad>7.42+EPS))continue;
  const width=.015; // 11 cm on a 7.6 m tube: overlaps metal and glass edges.
  const r=rad-.034; // recessed toward the viewer, outside the collision space.
  for(const a of[a0,a1]){
   ribbon(vertices,indices,track,start,end,a-width,a+width,r,true);
   edgePairs++;
  }
  // Short cross-sectional glazing bead bridges chunks without coplanar endcaps.
  // Only the starting end is drawn; the next chunk owns the next seam.
  ribbon(vertices,indices,track,start,start+.055,a0-width,a1+width,r,false);
  crossSeams++;
  if(end>=track.length-.08){
   ribbon(vertices,indices,track,end-.055,end,a0-width,a1+width,r,false);
   crossSeams++;
  }
 }
 if(!indices.length)return null;
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const mesh=new THREE.Mesh(geometry,frameMaterial);
 mesh.name='GLASS / SEALED STRUCTURAL JOINS';
 mesh.userData.tunnelGlassFrame=true;
 mesh.userData.panes=panes.length;
 mesh.userData.longitudinalEdges=edgePairs;
 mesh.userData.crossSeams=crossSeams;
 mesh.castShadow=false;mesh.receiveShadow=false;
 group.add(mesh);
 if(typeof window!=='undefined'&&typeof location!=='undefined'&&
    (location.search.includes('glassqa=1')||location.search.includes('shipqa=1'))){
  const previous=window.__shiftlineGlassQA?.course===track.course?window.__shiftlineGlassQA:{course:track.course,panes:0,frames:0,seams:0,depthWrite:false};
  previous.panes+=panes.length;previous.frames++;previous.seams+=crossSeams;
  previous.depthWrite=glass.depthWrite;
  previous.singlePass=glass.forceSinglePass;
  window.__shiftlineGlassQA=previous;
 }
 return mesh;
}
