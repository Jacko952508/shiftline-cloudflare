import * as THREE from 'three';
// Physical, model-specific airframe markings rather than recoloured generic
// geometry. Instancing keeps the six variants at two additional draw calls.
// These details are cosmetic; they never change the racing hit envelope.
const ACCENTS=[0x67dfff,0xff4464,0x90a9ff,0x7dffe2,0xffc276,0xb6a7ff];
const RIVETS=[0x1b3543,0x25111c,0x131d2b,0x20363b,0x33302a,0x182139];
// Each spec: [x,y,z,width,height,length,yaw]. The six configurations are
// deliberately not mirrored copies of the same central hull detail.
const IDENTITIES=[
 {name:'VECTOR // forward arrow',lit:[[0,.165,-1.00,.065,.025,.26,0],[0,.17,-.69,.15,.028,.29,0],[-.42,.075,-.18,.29,.018,.035,-.62],[.42,.075,-.18,.29,.018,.035,.62],[-.56,.068,.37,.22,.018,.035,.38],[.56,.068,.37,.22,.018,.035,-.38]], dark:[[-.11,.145,-.47,.08,.025,.22,0],[.11,.145,-.47,.08,.025,.22,0],[-.3,.085,.14,.12,.02,.18,0],[.3,.085,.14,.12,.02,.18,0]]},
 {name:'RAZOR // split fangs',lit:[[-.20,.13,-.89,.035,.023,.35,-.16],[.20,.13,-.89,.035,.023,.35,.16],[-.36,.09,-.53,.04,.02,.43,-.27],[.36,.09,-.53,.04,.02,.43,.27],[-.17,.20,.43,.038,.026,.27,0],[.17,.20,.43,.038,.026,.27,0]],dark:[[-.28,.14,-.15,.14,.027,.30,-.15],[.28,.14,-.15,.14,.027,.30,.15],[0,.205,.40,.20,.018,.15,0]]},
 {name:'PHANTOM // broken stealth lattice',lit:[[0,.145,-.82,.08,.017,.16,0],[-.19,.14,-.49,.055,.019,.20,-.65],[.19,.14,-.49,.055,.019,.20,.65],[-.44,.065,-.21,.16,.018,.035,.72],[.44,.065,-.21,.16,.018,.035,-.72],[-.27,.07,.52,.14,.02,.034,-.48],[.27,.07,.52,.14,.02,.034,.48]],dark:[[0,.16,-.18,.17,.018,.34,0],[-.27,.06,.19,.19,.018,.12,0],[.27,.06,.19,.19,.018,.12,0]]},
 {name:'MANTA // ocean sweep',lit:[[0,.175,-.79,.06,.016,.26,0],[-.29,.11,-.29,.05,.02,.42,-.6],[.29,.11,-.29,.05,.02,.42,.6],[-.57,.08,-.03,.16,.016,.035,-.32],[.57,.08,-.03,.16,.016,.035,.32],[-.64,.06,.48,.17,.016,.033,.35],[.64,.06,.48,.17,.016,.033,-.35]],dark:[[-.19,.13,.19,.10,.025,.28,-.2],[.19,.13,.19,.10,.025,.28,.2],[0,.165,.50,.14,.022,.25,0]]},
 {name:'GEMINI // exposed industrial banks',lit:[[0,.14,-.93,.11,.02,.27,0],[-.78,.275,-.53,.06,.02,.34,0],[.78,.275,-.53,.06,.02,.34,0],[-.78,.275,.07,.06,.02,.34,0],[.78,.275,.07,.06,.02,.34,0],[-.78,.275,.57,.06,.02,.25,0],[.78,.275,.57,.06,.02,.25,0]],dark:[[-.79,.275,-.3,.22,.016,.085,0],[.79,.275,-.3,.22,.016,.085,0],[-.79,.275,.29,.22,.016,.085,0],[.79,.275,.29,.22,.016,.085,0],[0,.14,.45,.15,.03,.36,0]]},
 {name:'SPECTRE // razor spine',lit:[[0,.205,-1.39,.025,.026,.33,0],[0,.215,-1.01,.08,.02,.34,0],[-.32,.13,-.4,.025,.027,.30,-.16],[.32,.13,-.4,.025,.027,.30,.16],[-.69,.31,.20,.04,.025,.34,-.33],[.69,.31,.20,.04,.025,.34,.33],[-.29,.145,.66,.07,.024,.20,0],[.29,.145,.66,.07,.024,.20,0]],dark:[[0,.185,-.35,.20,.022,.40,0],[-.27,.11,.15,.16,.022,.14,.15],[.27,.11,.15,.16,.022,.14,-.15]]}
];
export function installFleetIdentity(ship,root,index,owned,high=true){
 const info=IDENTITIES[index]||IDENTITIES[0];
 const hue=ACCENTS[index]||ACCENTS[0];
 const dark=new THREE.MeshPhysicalMaterial({color:RIVETS[index],metalness:.62,roughness:.45,clearcoat:.34});
 const edge=new THREE.MeshBasicMaterial({color:hue,toneMapped:false});
 owned.push(dark,edge);
 const g=new THREE.BoxGeometry(1,1,1),q=new THREE.Quaternion(),pos=new THREE.Vector3(),scale=new THREE.Vector3(),matrix=new THREE.Matrix4();
 const make=(pieces,material,label)=>{
  const mesh=new THREE.InstancedMesh(g,material,pieces.length);
  for(let i=0;i<pieces.length;i++){
   const [x,y,z,w,h,d,rot]=pieces[i];
   pos.set(x,y,z);q.setFromAxisAngle(new THREE.Vector3(0,1,0),rot);
   scale.set(w,h,d);matrix.compose(pos,q,scale);mesh.setMatrixAt(i,matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;
  mesh.castShadow=false;mesh.receiveShadow=false;mesh.name=label;
  root.add(mesh);return mesh;
 };
 make(info.dark,dark,'V161 / '+info.name+' recessed vents');
 make(info.lit,edge,'V161 / '+info.name+' illuminated signature');
 ship.userData.identity161={version:161,index,name:info.name,lights:info.lit.length,vents:info.dark.length};
 if(high&&typeof window!=='undefined'&&location.search.includes('shipqa=1'))
  window.__shiftlineIdentityQA=ship.userData.identity161;
 return ship.userData.identity161;
}
