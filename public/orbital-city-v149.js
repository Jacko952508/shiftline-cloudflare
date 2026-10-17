import * as THREE from 'three';
// Baked assemblies retain the existing five instanced scenery draws per chunk.
// No transparent exhaust, point lights, animation loops or collision bodies.
function assembly(parts){
 const positions=[],normals=[];
 for(const [geometry,s,x=0,y=0,z=0] of parts){
  const g=geometry.index?geometry.toNonIndexed():geometry.clone();
  g.scale(...s);g.translate(x,y,z);
  positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);
  g.dispose();geometry.dispose();
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.computeBoundingSphere();return g;
}
export function orbitalCityShapes(low=false){
 const box=()=>new THREE.BoxGeometry(1,1,1),radial=low?6:10;
 const cone=(top,bottom)=>new THREE.CylinderGeometry(top,bottom,1,radial,1,true);
 const towers=[
  [box(),[.35,1,.36],0,0,0],
  [box(),[.25,.68,.28],-.30,-.16,.20],
  [box(),[.24,.81,.25],.29,-.095,-.19],
  [box(),[.23,.50,.26],.27,-.25,.25],
  [box(),[.27,.10,.44],0,.30,0],
  [box(),[.05,.22,.05],0,.61,0]
 ];
 const deck=[
  [cone(.46,.36),[1,1,1]],
  [box(),[1.15,.28,.25]],
  [box(),[.25,.28,1.12]],
  [box(),[.22,.18,.32],-.44,.22,0],
  [box(),[.22,.18,.32],.44,.22,0]
 ];
 const engines=[],light=[];
 for(const x of[-.34,.34])for(const z of[-.34,.34]){
  engines.push([cone(.16,.22),[1,1,1],x,0,z]);
  engines.push([cone(.23,.23),[1,.19,1],x,-.39,z]);
  light.push([cone(.16,.025),[1,1,1],x,0,z]);
 }
 // Navigation strips and docking lights are baked into the same emissive mesh.
 for(const x of[-.47,.47])light.push([box(),[.025,.12,.68],x,3.5,0]);
 return [assembly(towers),assembly(deck),assembly(engines),assembly(light),new THREE.TorusGeometry(1,.065,low?4:6,low?16:28)];
}
