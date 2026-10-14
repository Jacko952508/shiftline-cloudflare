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

 // V116: model-specific architectural detailing, all kept inside the racing hitbox.
 const dark=new THREE.MeshStandardMaterial({color:0x0b1826,metalness:.63,roughness:.42});
 const panel=new THREE.MeshPhysicalMaterial({color:model===1?0x7f1829:model===3?0xd9e6ee:0x9aaebf,metalness:.86,roughness:.26,clearcoat:.75,side:THREE.DoubleSide});
 const cyan=new THREE.MeshBasicMaterial({color:model===1?0xff244c:0x44d8ff,toneMapped:false});
 const violet=new THREE.MeshBasicMaterial({color:0xa782ff,toneMapped:false});
 const glassMat=new THREE.MeshPhysicalMaterial({color:0x06384a,metalness:.22,roughness:.11,transparent:true,opacity:.92,clearcoat:1,clearcoatRoughness:.07});
 const tapered=(x,y,z,rx,ry,rz,mat=panel)=>{const m=add(new THREE.ConeGeometry(rx,rz,8,1),mat,x,y,z);m.scale.y=ry/Math.max(.001,rz);m.rotation.x=Math.PI/2;return m;};
 const line=(points,mat=cyan,width=.007)=>{const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=add(new THREE.TubeGeometry(curve,Math.max(8,points.length*4),width,5,false),mat);mesh.castShadow=false;return mesh};
 const sidePanel=(points,side,mat=panel,height=.12)=>{const m=add(plate(points,.018),mat);m.scale.x=side;m.position.y=height;return m};
 // Continuous canopy replaces the flat centre of the stock chassis.
 const canopy=add(hullLoft([[-.78,.008,.015,.20],[-.57,.105,.055,.23],[-.21,.19,.10,.245],[.24,.17,.10,.235],[.48,.08,.045,.21],[.56,.008,.012,.18]],20),glassMat);
 line([[0,.23,-.66],[0,.345,-.21],[0,.32,.26],[0,.22,.51]],accent,.005);
 if(model===0||model===4){
  // Vector's shorter pods and Gemini's heavier independent twin hulls.
  for(const side of[-1,1]){
   const x=side*(model===4?.75:.72);
   const pod=add(hullLoft([[-1.04,.006,.008,0],[-.83,.10,.085,.015],[-.50,model===4?.205:.16,.145,.02],[.30,model===4?.20:.16,.14,.025],[.77,.12,.105,.015],[1.04,.006,.008,0]],20),dark,x,.10);
   const spine=add(hullLoft([[-.93,.003,.004,.05],[-.66,.05,.025,.08],[.16,.055,.025,.085],[.75,.045,.025,.075],[1.02,.004,.003,.05]],12),carbon,x,.13);
   for(let i=0;i<9;i++){const z=-.65+i*.15;const stripe=add(new THREE.BoxGeometry(model===4?.27:.22,.004,.012),carbon,x,.246,z);stripe.rotation.y=side*.06;}
   line([[x,.14,-.87],[x+side*.08,.245,-.42],[x+side*.08,.24,.36],[x,.14,.86]],cyan,.006);
   const nozzle=add(new THREE.CylinderGeometry(.075,.11,.22,12),dark,x,.09,.89);nozzle.rotation.x=Math.PI/2;
   const thrust=add(new THREE.CylinderGeometry(.045,.055,.02,12),violet,x,.09,1.005);thrust.rotation.x=Math.PI/2;
   if(model===0){sidePanel([[.26,-.20],[.53,-.28],[.61,.42],[.36,.57]],side,panel,.11);}
   else {sidePanel([[.32,-.27],[.50,-.39],[.58,.53],[.38,.67]],side,panel,.095);}
  }
 }
 if(model===1){
  // RAZOR: three long aggressive red needles and angular layered armour.
  sidePanel([[.20,-.40],[.58,-.82],[.94,-.97],[.78,-.32],[.90,.42],[.52,.18]],1,panel,.145);
  sidePanel([[.20,-.40],[.58,-.82],[.94,-.97],[.78,-.32],[.90,.42],[.52,.18]],-1,panel,.145);
  for(const side of[-1,1]){
   sidePanel([[.33,-.20],[.71,-.79],[.79,-.24],[.56,.15]],side,dark,.177);
   line([[side*.32,.19,-.35],[side*.65,.19,-.78],[side*.77,.19,-.25],[side*.71,.18,.30]],cyan,.009);
   const blade=add(plate([[.41,-.26],[.67,-.69],[.86,.62],[.66,.42]],.026),panel);blade.scale.x=side;blade.position.y=.17;
  }
  line([[0,.22,-1.32],[0,.29,-.8],[0,.35,-.31]],cyan,.009);
 }
 if(model===2||model===5){
  // PHANTOM broad faceted stealth wings; SPECTRE's tall split blades.
  for(const side of[-1,1]){
   sidePanel(model===2?[[.25,-.24],[.92,-.71],[.76,.05],[.99,.70],[.53,.53]]:[[.30,-.22],[.99,-.84],[.67,.06],[.94,.83],[.49,.46]],side,panel,.117);
   sidePanel([[.40,-.18],[.78,-.46],[.66,.17],[.49,.39]],side,dark,.15);
   for(let i=0;i<4;i++)line([[side*(.48+i*.075),.16,.23],[side*(.51+i*.075),.16,.36]],cyan,.005);
   if(model===5){const blade=add(plate([[.45,-.22],[.72,-.55],[.98,.83],[.69,.50]],.032),dark);blade.scale.x=side;blade.position.y=.19;line([[side*.73,.20,-.48],[side*.93,.22,.69]],cyan,.009);}
  }
 }
 if(model===3){
  // MANTA: broad white sweeping scythes with actual open negative space.
  for(const side of[-1,1]){
   const scythe=add(plate([[.18,-.29],[.48,-.55],[.99,-.70],[.89,-.25],[.67,.25],[.78,.76],[.53,.65],[.43,.18]],.043),panel);
   scythe.scale.x=side;scythe.position.y=.125;
   sidePanel([[.43,-.18],[.70,-.40],[.60,-.05],[.48,.26]],side,dark,.18);
   line([[side*.35,.18,-.31],[side*.74,.18,-.49],[side*.66,.18,.12],[side*.79,.17,.68]],cyan,.008);
  }
 }
 for(const side of[-1,1]){
  for(let i=0;i<5;i++){
   const x=side*(.22+i*.06);
   const rivet=add(new THREE.SphereGeometry(.007,5,4),dark,x,.155,.32+i*.035);rivet.castShadow=false;
  }
 }
 ship.userData.sculptMaterials=[glow,accent];
 return root;
}
