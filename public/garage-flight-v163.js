import * as THREE from 'three';

const UP=new THREE.Vector3(0,1,0),TAU=Math.PI*2;
export class GarageFlightPath extends THREE.Curve{
 constructor(){super();this.arcLengthDivisions=2048;}
 getPoint(t,target=new THREE.Vector3()){const a=t*TAU;return target.set(24*Math.sin(a),6.5*Math.cos(a),15*Math.sin(2*a));}
 getTangent(t,target=new THREE.Vector3()){const a=t*TAU;return target.set(24*Math.cos(a),-6.5*Math.sin(a),30*Math.cos(2*a)).normalize();}
}
export function flightFrame(curve,u){
 u=THREE.MathUtils.euclideanModulo(u,1);
 const point=curve.getPointAt(u),forward=curve.getTangentAt(u),right=new THREE.Vector3().crossVectors(forward,UP).normalize(),up=new THREE.Vector3().crossVectors(right,forward).normalize();
 const rotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,forward.clone().negate()));
 return{point,forward,right,up,rotation};
}

export function createGarageFlight(environment,accent=0x66eaff){
 const curve=new GarageFlightPath(),length=curve.getLength(),scene=new THREE.Scene();scene.background=new THREE.Color(0x06111c);scene.environment=environment;scene.environmentIntensity=.85;scene.fog=new THREE.FogExp2(0x06111c,.026);
 const tunnel=new THREE.Group();tunnel.name='FLIGHTWORKS / figure-eight test tunnel';scene.add(tunnel);
 const shell=new THREE.MeshStandardMaterial({color:0x223b50,metalness:.7,roughness:.38,side:THREE.BackSide});
 const ribMat=new THREE.MeshStandardMaterial({color:0x547184,metalness:.85,roughness:.26});
 const glow=new THREE.MeshBasicMaterial({color:accent,toneMapped:false});
 const white=new THREE.MeshBasicMaterial({color:0xb8d8e6,toneMapped:false});
 const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,320,3.65,16,true),shell);tube.name='continuous closed-loop tunnel';tunnel.add(tube);
 const count=Math.ceil(length/4.2),ribs=new THREE.InstancedMesh(new THREE.TorusGeometry(3.59,.055,4,16),ribMat,count),matrix=new THREE.Matrix4(),scale=new THREE.Vector3(1,1,1);ribs.name='tunnel frame ribs';
 const lights=new THREE.InstancedMesh(new THREE.BoxGeometry(.075,.075,2.25),white,count*2),beacons=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,.12,.46),glow,count*2);
 for(let i=0;i<count;i++){
  const f=flightFrame(curve,i/count);ribs.setMatrixAt(i,matrix.compose(f.point,f.rotation,scale));
  for(let side=0;side<2;side++){
   const p=f.point.clone().addScaledVector(f.right,side?2.42:-2.42).addScaledVector(f.up,2.5);lights.setMatrixAt(i*2+side,matrix.compose(p,f.rotation,scale));
   p.copy(f.point).addScaledVector(f.right,side?3.33:-3.33).addScaledVector(f.up,-.55);beacons.setMatrixAt(i*2+side,matrix.compose(p,f.rotation,scale));
  }
 }
 tunnel.add(ribs,lights,beacons);
 // Continuous guide rails make the direction and bank legible from behind.
 for(const side of[-1,1]){
  const points=[];for(let i=0;i<=320;i++){const f=flightFrame(curve,i/320);points.push(f.point.addScaledVector(f.right,side*2.20).addScaledVector(f.up,-2.75));}
  const rail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.slice(0,-1),true),320,.024,4,true),glow);tunnel.add(rail);
 }
 return{scene,tunnel,curve,length,glow,startedAt:null,elapsed:0,lapSeconds:22,qa:null};
}

export function updateGarageFlight(flight,ship,camera,time,zoom=false){
 if(flight.startedAt===null)flight.startedAt=time;
 flight.elapsed=Math.max(0,time-flight.startedAt);
 const u=(flight.elapsed/flight.lapSeconds+.085)%1,f=flightFrame(flight.curve,u),next=flightFrame(flight.curve,u+.015);
 const turn=Math.atan2(new THREE.Vector3().crossVectors(f.forward,next.forward).dot(f.up),f.forward.dot(next.forward)),bank=THREE.MathUtils.clamp(turn*2.8,-.38,.38);
 ship.position.copy(f.point).addScaledVector(f.right,Math.sin(flight.elapsed*.6)*.12);ship.quaternion.copy(f.rotation);ship.rotateZ(bank);
 const distance=(zoom?3.9:5.1)*Math.max(1,.9/camera.aspect);
 camera.fov=48;camera.near=.08;camera.far=180;camera.up.copy(f.up);camera.position.copy(f.point).addScaledVector(f.forward,-distance).addScaledVector(f.up,1.12);camera.lookAt(f.point.clone().addScaledVector(f.forward,2.1).addScaledVector(f.up,.12));camera.updateProjectionMatrix();
 flight.qa={active:true,elapsed:flight.elapsed,u,bank,position:ship.position.toArray(),forward:f.forward.toArray(),camera:camera.position.toArray(),model:ship.userData.fleet162.index,edition:ship.userData.fleet162.edition,finish:ship.userData.paint.finish};
 return f;
}
export function disposeGarageFlight(flight){
 if(!flight)return;const geometries=new Set(),materials=new Set();flight.tunnel.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());flight.scene.clear();
}
