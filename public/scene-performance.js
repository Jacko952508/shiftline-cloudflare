import * as THREE from 'three';
export function batchScenery(root,excludedRoots=[]){
 root.updateMatrixWorld(true);const rootInverse=root.matrixWorld.clone().invert(),relative=new THREE.Matrix4();const excluded=new Set();for(const g of excludedRoots)g.traverse(o=>excluded.add(o));const buckets=new Map();let before=0,after=0;
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||excluded.has(o)||!['BoxGeometry','CylinderGeometry','TorusGeometry'].includes(o.geometry.type)||Array.isArray(o.material))return;const key=o.material.uuid+o.geometry.type+JSON.stringify(o.geometry.parameters);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);});
 for(const list of buckets.values()){if(list.length<3)continue;const first=list[0],mesh=new THREE.InstancedMesh(first.geometry,first.material,list.length);mesh.name='batched-exterior';for(let i=0;i<list.length;i++){const o=list[i];relative.multiplyMatrices(rootInverse,o.matrixWorld);mesh.setMatrixAt(i,relative);o.parent.remove(o);if(o.geometry!==first.geometry)o.geometry.dispose();}mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=first.receiveShadow;mesh.castShadow=false;root.add(mesh);before+=list.length;after++;}
 return{before,after,saved:before-after};
}
// Bake fixed transforms once. Moving objects keep Three.js's normal matrix updates.
export function freezeWorld(root,dynamic){root.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false});for(const o of dynamic)o.matrixAutoUpdate=true;}
