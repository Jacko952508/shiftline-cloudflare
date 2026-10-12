import * as THREE from 'three';
// Single-instance-draw architectural detail for all six worlds. All geometry sits
// outside the playable flight radius; no changes to obstacles or hit boxes.
const PALETTE={1:0x58c6ec,2:0x5bc9c3,3:0xe69b69,4:0x90bdfc,5:0x8bc99b,6:0xb4a1ff};
export function attachTunnelDetails(w,track,course){
 const countAt=Math.max(0,Math.floor((track.length-32)/30)),perStation=4,count=countAt*perStation;
 if(!w?.root||!count)return w;
 const frame=new THREE.Matrix4(),dummy=new THREE.Object3D(),to=new THREE.Vector3(),radial=new THREE.Vector3();
 const metal=w.materials?.titanium||w.materials?.bronze||w.materials?.steel||w.materials?.dark;
 const panel=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,1.45,5.2),metal,count);
 const stripeMat=new THREE.MeshBasicMaterial({color:PALETTE[course]||PALETTE[1],toneMapped:false});
 const stripe=new THREE.InstancedMesh(new THREE.BoxGeometry(.035,.07,3.65),stripeMat,count);
 const bolts=new THREE.InstancedMesh(new THREE.BoxGeometry(.09,.13,.22),metal,count*2);
 const meshes=[panel,stripe,bolts],sourceMatrices=[];
 for(let i=0;i<countAt;i++){
  const s=18+i*30,F=track.frame(s);
  frame.makeBasis(F.r,F.u,to.copy(F.f).negate());
  for(let k=0;k<perStation;k++){
   // Maintenance panels are spaced around the inside face of the shell.
   const angle=Math.PI*(.25+k*.5),cs=Math.cos(angle),sn=Math.sin(angle),index=i*perStation+k;
   dummy.quaternion.setFromRotationMatrix(frame);dummy.rotateZ(angle);
   radial.copy(F.r).multiplyScalar(cs).addScaledVector(F.u,sn);
   dummy.position.copy(F.p).addScaledVector(radial,7.43);
   dummy.scale.set(1,1,1);dummy.updateMatrix();panel.setMatrixAt(index,dummy.matrix);
   dummy.position.addScaledVector(radial,-.09);dummy.updateMatrix();stripe.setMatrixAt(index,dummy.matrix);
   for(let bolt=0;bolt<2;bolt++){
    dummy.position.copy(F.p).addScaledVector(radial,7.32).addScaledVector(F.f,(bolt===0?-2.15:2.15));
    dummy.updateMatrix();bolts.setMatrixAt(index*2+bolt,dummy.matrix);
   }
  }
 }
 for(const m of meshes){m.instanceMatrix.needsUpdate=true;m.frustumCulled=false;m.castShadow=false;m.receiveShadow=false;m.name='TUNNEL / INSTANCED SERVICE DETAIL';w.root.add(m);sourceMatrices.push(new Float32Array(m.instanceMatrix.array))}
 w.tunnelDetails={meshes,sourceMatrices,perStation,countAt,first:-1,last:-1,materials:[stripeMat]};
 return w;
}
export function updateTunnelDetails(w,s){
 const d=w?.tunnelDetails;if(!d)return;
 const ahead=w.renderAhead||680,behind=w.renderBehind||90;
 const first=Math.max(0,Math.floor((s-behind-18)/30)),last=Math.min(d.countAt,Math.ceil((s+ahead-18)/30));
 if(first===d.first&&last===d.last)return;
 d.first=first;d.last=last;
 // Copy only the near-camera instance transforms, including a small behind-camera
 // overlap for cockpit banking and the free-camera Observatory.
 for(let i=0;i<d.meshes.length;i++){
  const mesh=d.meshes[i],factor=i===2?2:1,stride=d.perStation*factor*16;
  mesh.instanceMatrix.array.set(d.sourceMatrices[i].subarray(first*stride,last*stride),0);
  mesh.count=Math.max(0,last-first)*d.perStation*factor;
  mesh.instanceMatrix.needsUpdate=true;
 }
}
export function disposeTunnelDetails(w){
 const d=w?.tunnelDetails;if(!d)return;
 for(const m of d.meshes){m.parent?.remove(m);m.geometry.dispose()}
 for(const material of d.materials)material.dispose();
 w.tunnelDetails=null;
}
