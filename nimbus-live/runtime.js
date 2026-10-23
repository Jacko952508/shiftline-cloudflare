// NIMBUS Live extension API v1. This module is loaded by the in-chat renderer.
export function activate({T,scene,config}) {
  const layer=new T.Group(); layer.name='NIMBUS LIVE MODULE'; scene.add(layer);
  const gold=new T.MeshStandardMaterial({color:0xd9ad70,metalness:.87,roughness:.19});
  const hull=new T.MeshStandardMaterial({color:0x213c4a,metalness:.62,roughness:.29});
  const light=new T.MeshBasicMaterial({color:0x8aebf1,toneMapped:false});
  const white=new T.MeshStandardMaterial({color:0xc5d6d7,metalness:.25,roughness:.35});
  const mats=[gold,hull,light,white];
  function mesh(geo,mat,x,y,z,p=layer){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=true;p.add(o);return o}
  const cube=(w,h,d,m,x,y,z,p=layer)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
  const cyl=(r,h,m,x,y,z,p=layer)=>mesh(new T.CylinderGeometry(r,r,h,18),m,x,y,z,p);
  const sphere=(r,m,x,y,z,p=layer)=>mesh(new T.IcosahedronGeometry(r,2),m,x,y,z,p);
  const ship=new T.Group();layer.add(ship);
  cube(8,1,2.8,hull,0,0,0,ship);
  cube(5.6,.7,2.4,white,0,.67,-.1,ship);
  cube(2,1.4,2,hull,-1,1.6,0,ship);
  cube(1.7,.68,.05,light,-1,1.8,1.02,ship);
  cyl(.08,4,gold,2.5,2.45,-.1,ship);
  const wake=mesh(new T.PlaneGeometry(11,3),new T.MeshBasicMaterial({color:0xb7e2df,transparent:true,opacity:.13,depthWrite:false,side:T.DoubleSide}),0,-.48,4,ship);
  wake.rotation.x=-Math.PI/2;
  const scanner=new T.Group(); scanner.position.set(-26,17,-22);layer.add(scanner);
  const outer=mesh(new T.TorusGeometry(6.2,.14,12,112),gold,0,0,0,scanner);
  const inner=mesh(new T.TorusGeometry(4.6,.055,8,112),light,0,0,0,scanner);
  const core=mesh(new T.IcosahedronGeometry(.85,2),light,0,0,0,scanner);
  const beacons=[];
  for(const [x,z] of [[-35,18],[28,39],[46,-36]]) {
    const group=new T.Group();group.position.set(x,-.1,z);layer.add(group);
    cyl(.42,2.3,hull,0,0,0,group);sphere(.34,light,0,1.4,0,group);
    beacons.push(group);
  }
  const extra=[];
  for(const item of (Array.isArray(config.structures)?config.structures:[]).slice(0,12)){
    if(!item||typeof item.type!=='string')continue;
    let obj;
    if(item.type==='sphere') obj=sphere(1.5,light,0,0,0);
    if(item.type==='tower')obj=cyl(1.5,11,white,0,0,0);
    if(item.type==='beacon')obj=cyl(.7,5,gold,0,0,0);
    if(item.type==='dish'){obj=mesh(new T.SphereGeometry(2,20,12,0,Math.PI),white,0,0,0);obj.scale.z=.2;}
    if(obj){obj.position.set(Number(item.x)||0,Number(item.y)||0,Number(item.z)||0);const s=Math.max(.25,Math.min(2.5,Number(item.scale)||1));obj.scale.multiplyScalar(s);extra.push(obj)}
  }
  return {
    update(dt,time){
      ship.position.set(-14+Math.sin(time*.15)*15,-1.85+Math.sin(time*1.3)*.15,38+Math.cos(time*.15)*11);
      ship.rotation.y=Math.sin(time*.15)*.5;
      scanner.rotation.y=time*.13;outer.rotation.z=Math.sin(time*.28)*.3;inner.rotation.z=-time*.24;core.rotation.y=time*.9;
      for(let i=0;i<beacons.length;i++)beacons[i].position.y=-.2+Math.sin(time*1.5+i)*.22;
      for(let i=0;i<extra.length;i++)extra[i].rotation.y+=dt*.2;
    },
    dispose(){
      scene.remove(layer);
      layer.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&o.material.dispose()&&!mats.includes(o.material)){}});
      mats.forEach(m=>m.dispose());
    }
  };
}
