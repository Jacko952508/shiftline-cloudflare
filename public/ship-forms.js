import * as THREE from 'three';
// Unique geometry for VECTOR, RAZOR, PHANTOM, MANTA, GEMINI and SPECTRE.
// Geometry fits inside the unchanged competitive collision envelope.
const contours=[
 [[.22,-.16],[.39,-.34],[.78,-.17],[1.03,.49],[.73,.62],[.33,.55]],
 [[.18,-.30],[.49,-.73],[.94,-.94],[.82,.18],[1.02,.76],[.55,.57],[.31,.8]],
 [[.18,-.25],[.99,-.68],[.82,-.08],[1.04,.72],[.66,.58],[.33,.83]],
 [[.19,-.27],[.46,-.50],[.99,-.68],[.81,-.16],[.65,.22],[.88,.75],[.40,.68]],
 [[.22,-.11],[.43,-.35],[.88,-.69],[1.02,-.35],[.81,.31],[.39,.82]],
 [[.16,-.32],[.42,-.53],[1.01,-.88],[.77,-.19],[1.03,.81],[.55,.53],[.30,.76]]
];
function plate(points,thickness=.035){
 const outline=new THREE.Shape();points.forEach(([x,z],i)=>i?outline.lineTo(x,-z):outline.moveTo(x,-z));outline.closePath();
 const geo=new THREE.ExtrudeGeometry(outline,{depth:thickness,steps:1,bevelEnabled:true,bevelThickness:.009,bevelSize:.012,bevelSegments:1});
 geo.rotateX(-Math.PI/2);return geo;
}
function hullLoft(stations,sides=12){
 const pos=[],uv=[],ind=[];
 for(let i=0;i<stations.length;i++){const[z,rx,ry,y]=stations[i];for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;pos.push(Math.cos(a)*rx,Math.sin(a)*ry+y,z);uv.push(j/sides,i/(stations.length-1));}}
 for(let i=0;i<stations.length-1;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;ind.push(a,a+1,b,b,a+1,b+1);}
 for(let side of[0,stations.length-1]){const[z,rx,ry,y]=stations[side],centre=pos.length/3;pos.push(0,y,z);uv.push(.5,.5);for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;pos.push(Math.cos(a)*rx,Math.sin(a)*ry+y,z);uv.push(.5+Math.cos(a)*.5,.5+Math.sin(a)*.5);}for(let j=0;j<sides;j++)ind.push(centre,...(side===0?[centre+2+j,centre+1+j]:[centre+1+j,centre+2+j]));}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(ind);geo.computeVertexNormals();return geo;
}
export function sculptCraft(ship,model,cosmetics,materials){
 const {hull,carbon}=materials,premium=materials.premium,root=new THREE.Group();
 root.name='SHIFTLINE_MODEL_'+['VECTOR','RAZOR','PHANTOM','MANTA','GEMINI','SPECTRE'][model];ship.add(root);
 const glow=new THREE.MeshBasicMaterial({color:premium?0xffffff:0x8ef5ff,toneMapped:false,side:THREE.DoubleSide});
 const accent=new THREE.MeshPhysicalMaterial({color:premium?0xf6ffff:0x91cbdc,metalness:.68,roughness:.24,clearcoat:.9,emissive:premium?0xffffff:0x144b59,emissiveIntensity:premium?1.15:.14});
 const add=(geo,mat,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;root.add(m);return m};
 const wingType=cosmetics.wing||0,shapeWidth=[.96,1,.88,.92,1.0][wingType],sweep=[0,-.12,.06,-.18,-.05][wingType];
 const styledWing=contours[model].map(([x,z])=>[x*shapeWidth,z+(x>.48?sweep*(x-.48)*1.7:0)]);
 for(const side of[-1,1]){
  const wing=add(plate(styledWing),model===2?carbon:hull);wing.scale.x=side;wing.position.y=model===3?.029:.046;
  if(model===3){const inset=add(plate([[.34,-.19],[.77,-.44],[.64,-.07],[.56,.25],[.43,.38]],.008),carbon);inset.scale.x=side;inset.position.y=.075;}
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.27,.072,-.18),new THREE.Vector3(side*(model===3?.53:.47),.078,model===1?-.61:-.32),new THREE.Vector3(side*(model===3?.85:.93),.068,model===3?-.48:model===5?-.73:-.28)]);
  const seam=add(new THREE.TubeGeometry(curve,9,premium?.011:.007,5,false),glow);seam.castShadow=false;
  if(model===0||model===4){
   const radius=(model===4?.22:.16)*[1,1.13,.9,.85,1.08][cosmetics.engine||0];
   add(hullLoft([[-1.02,.012,.014,.01],[-.72,radius*.8,radius*.85,.01],[-.14,radius,radius*.79,.01],[.54,radius*.84,radius*.8,.01],[.84,.10,.11,.01],[.97,.02,.02,.01]],14),model===0?carbon:hull,side*.72,.018);
   add(new THREE.TorusGeometry(radius*.77,.018,6,20),accent,side*.72,.01,.82);
   add(new THREE.TorusGeometry(radius*.59,.012,6,20),glow,side*.72,.01,.87);
  }
  if(model===1||model===5){
   const tip=add(hullLoft([[-.95,.004,.005,.035],[-.58,.065,.04,.045],[.22,.055,.045,.035],[.67,.015,.012,.03]],7),model===1?hull:carbon,side*.78,.08);tip.rotation.z=side*(model===5?.08:.03);
  }
  if(model===2){const wingPanel=add(plate([[.38,-.24],[.87,-.55],[.67,.16],[.38,.36]],.012),hull);wingPanel.scale.x=side;wingPanel.position.y=.09;}
  if(model===4){const link=add(new THREE.BoxGeometry(.48,.07,.27),hull,side*.48,.02,.33);link.rotation.y=side*.13;}
  const vent=add(new THREE.BoxGeometry(.15,.013,.095),carbon,side*.49,.092,.27);vent.rotation.y=side*.24;
  for(let i=0;i<3;i++){const detail=add(new THREE.BoxGeometry(.08,.006,.009),premium?glow:accent,side*(.46+i*.04),.102,.26+i*.035);detail.castShadow=false;}
 }
 if(model===3)add(hullLoft([[-1.27,.006,.007,.015],[-1.04,.11,.04,.01],[-.59,.21,.11,.015],[.11,.21,.12,.01],[.63,.15,.09,.015],[.87,.015,.02,.01]],12),hull);
 if(model===1||model===5)add(hullLoft([[-1.46,.004,.005,0],[-1.2,.075,.055,.015],[-.55,.20,.10,.015],[.24,.21,.11,.01],[.79,.09,.07,.01]],model===1?10:8),hull,0,-.02);
 if(model===2){const ridge=add(new THREE.BoxGeometry(.14,.028,.62),hull,0,.163,.35);ridge.rotation.x=-.06;}
 if(model===4)for(const side of[-1,1]){const shoulder=add(new THREE.BoxGeometry(.085,.045,.60),accent,side*.24,.095,.20);shoulder.rotation.z=side*.15;}
 if(model===5)for(const side of[-1,1]){const blade=add(plate([[.15,.10],[.42,.06],[.39,.88],[.22,.65]],.019),carbon);blade.scale.x=side;blade.position.y=.14;}
 ship.userData.sculptMaterials=[glow,accent];
 return root;
}
