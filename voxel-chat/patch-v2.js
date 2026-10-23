
export function apply(api){
 const T=api.THREE,scene=api.scene;
 const fur=new T.MeshStandardMaterial({color:0xf3eee0,roughness:.9});
 const fleece=new T.MeshStandardMaterial({color:0xe1ded4,roughness:1});
 const face=new T.MeshStandardMaterial({color:0x434446,roughness:.95});
 const eye=new T.MeshBasicMaterial({color:0x0b1722});
 const hoof=new T.MeshStandardMaterial({color:0x514d4b,roughness:1});
 function part(g,m,x,y,z,parent){let o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=false;parent.add(o);return o}
 function box(x,y,z,w,h,d,m,p){return part(new T.BoxGeometry(w,h,d),m,x,y,z,p)}
 const flock=[];
 const spots=[[25,47],[20,44],[30,49],[16,51]];
 function ground(x,z){for(let y=32;y>0;y--){let id=api.getBlock(Math.floor(x),y,Math.floor(z));if(id!==0&&id!==6&&id!==10)return y+1}return 12}
 for(let i=0;i<spots.length;i++){
  const [x,z]=spots[i],group=new T.Group();scene.add(group);
  const body=box(0,.92,0,1.5,1.05,2.0,fur,group);
  for(let j=-1;j<=1;j++)for(let k=-1;k<=1;k++)if(Math.abs(j)+Math.abs(k)!==0)
    box(j*.58,1.2,k*.58,.44,.54,.46,fleece,group);
  const head=box(0,1.15,-1.13,.88,.81,.85,face,group);
  box(0,1.62,-1.08,.91,.27,.7,fur,group);
  for(let sx of [-1,1]){
   box(sx*.45,1.43,-1.24,.37,.21,.29,face,group);
   box(sx*.45,1.25,-1.57,.09,.11,.05,eye,group);
  }
  const legs=[];
  for(const sx of [-.52,.52])for(const sz of [-.66,.66]){
   const pivot=new T.Group();pivot.position.set(sx,.55,sz);group.add(pivot);
   box(0,-.3,0,.29,.64,.29,hoof,pivot);legs.push(pivot);
  }
  flock.push({group,legs,baseX:x,baseZ:z,phase:i*2.08});
 }
 api.onTick((dt,t)=>{
  for(const sheep of flock){
   const t0=t*.35+sheep.phase;
   const x=sheep.baseX+Math.sin(t0)*2.2,z=sheep.baseZ+Math.cos(t0*.8)*1.5;
   const y=ground(x,z);
   sheep.group.position.set(x,y+.05*Math.sin(t*3+sheep.phase),z);
   sheep.group.rotation.y=-t0*.2;
   sheep.legs.forEach((p,j)=>p.rotation.x=Math.sin(t*2.8+sheep.phase+(j%2)*Math.PI)*.15);
  }
 });
 const grass=new T.InstancedMesh(new T.ConeGeometry(.09,.52,3),new T.MeshStandardMaterial({color:0x9fbe71,roughness:1}),140),dummy=new T.Object3D();
 let count=0;
 for(let i=0;i<230&&count<140;i++){
  const x=12+((i*37)%37),z=36+((i*19)%23);
  const y=ground(x,z);if(y<10||y>24)continue;
  dummy.position.set(x+.2,y+.16,z+.3);dummy.rotation.y=(i*2.3)%6.28;dummy.scale.set(1,.7+(.6*((i*13)%11)/11),1);
  dummy.updateMatrix();grass.setMatrixAt(count++,dummy.matrix);
 }
 grass.count=count;grass.instanceMatrix.needsUpdate=true;scene.add(grass);
 api.notify('LIVE V2 · SHEEP & MEADOW ADDED');
}
