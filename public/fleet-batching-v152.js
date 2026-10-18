import * as THREE from 'three';
// Bake static opponent airframes by material. Preserve every original vertex,
// UV, normal, finish and triangle; translucent glass and moving exhaust stay separate.
export function batchStaticAirframe(root){
 root.updateMatrixWorld(true);
 const inverse=root.matrixWorld.clone().invert(),relative=new THREE.Matrix4(),buckets=new Map();
 root.traverseVisible(o=>{
  if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||Array.isArray(o.material)||o.material.transparent||o.material.isShaderMaterial||o.userData.noBatch)return;
  const key=[o.material.uuid,o.castShadow,o.receiveShadow,o.renderOrder,o.layers.mask].join('/');
  if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);
 });
 let before=0,after=0,triangles=0;const retired=new Set();
 for(const list of buckets.values()){
  if(list.length<2)continue;
  const keys=new Map();let total=0;
  for(const o of list){for(const [name,a]of Object.entries(o.geometry.attributes))keys.set(name,a.itemSize);total+=o.geometry.attributes.position.count;}
  const arrays=new Map([...keys].map(([name,size])=>[name,new Float32Array(total*size)])),indices=[];
  let offset=0;
  for(const o of list){
   relative.multiplyMatrices(inverse,o.matrixWorld);
   const geometry=o.geometry.clone().applyMatrix4(relative),count=geometry.attributes.position.count,flip=relative.determinant()<0;
   for(const [name,size]of keys){
    const attr=geometry.attributes[name],out=arrays.get(name);
    for(let i=0;i<count;i++)for(let k=0;k<size;k++)out[(offset+i)*size+k]=attr?attr.array[i*size+k]:name==='color'?1:0;
   }
   const ix=geometry.index,num=ix?.count||count;
   for(let i=0;i<num;i+=3){const a=ix?ix.getX(i):i,b=ix?ix.getX(i+1):i+1,c=ix?ix.getX(i+2):i+2;indices.push(offset+a,offset+(flip?c:b),offset+(flip?b:c));}
   offset+=count;geometry.dispose();retired.add(o.geometry);o.removeFromParent();
  }
  const geo=new THREE.BufferGeometry();for(const [name,size]of keys)geo.setAttribute(name,new THREE.BufferAttribute(arrays.get(name),size));geo.setIndex(indices);geo.computeBoundingBox();geo.computeBoundingSphere();
  const first=list[0],mesh=new THREE.Mesh(geo,first.material);mesh.name='batched-airframe';mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;mesh.renderOrder=first.renderOrder;mesh.layers.mask=first.layers.mask;root.add(mesh);
  before+=list.length;after++;triangles+=indices.length/3;
 }
 // Shared geometry can also belong to an unbatched glass or animated part.
 const retained=new Set();root.traverse(o=>{if(o.geometry)retained.add(o.geometry);});for(const g of retired)if(!retained.has(g))g.dispose();
 return {before,after,saved:before-after,triangles};
}
