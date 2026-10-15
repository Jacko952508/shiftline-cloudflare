import * as THREE from 'three';
// V120 manufactured airframe details. No gameplay physics or hitbox changes.
const X=[.77,.46,.23,.39,.79,.28],Y=[.055,.025,-.02,-.03,.07,.02],Z=[.83,.85,.79,.75,.96,.88];
const WY=[.064,.08,.073,.088,.28,.05],RX=[.41,.45,.49,.47,.45,.47];
const PAL=[0xbdd8e3,0x9f273a,0x415564,0xe6f4fa,0x9bb9cd,0xc5d8e3];
const HEAT=[0x554d6e,0x622a36,0x304052,0x576b74,0x48586a,0x42546d];
const PI=Math.PI;
function panelGeo(length=.3,width=.2,depth=.019){
 const s=new THREE.Shape();s.moveTo(-width*.45,-length*.5);s.lineTo(width*.43,-length*.5);
 s.lineTo(width*.52,length*.48);s.lineTo(-width*.32,length*.52);s.closePath();
 const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.008,bevelSize:.010,bevelSegments:2,steps:1});
 g.rotateX(-PI/2);return g;
}
export function installFleetPolish(ship,root,index,c,api){
 const {materials,owned,high}=api;
 const {hull,polished,graphite,carbon,glass,glow,premium}=materials;
 const rig={joints:[],louvers:[],petals:[],high,added:{panels:0,mechanics:0,cockpit:0},boost:false};
 ship.userData.fleetPolish=rig;
 // Distant AI ships preserve their existing silhouettes without extra draw calls.
 if(!high)return rig;
 const trim=new THREE.MeshPhysicalMaterial({color:premium?hull.color.clone():new THREE.Color(PAL[index]),metalness:.88,roughness:.26,clearcoat:.91,clearcoatRoughness:.12,side:THREE.DoubleSide});
 const hot=new THREE.MeshPhysicalMaterial({color:HEAT[index],metalness:.75,roughness:.43,emissive:0x2b1211,emissiveIntensity:.02,side:THREE.DoubleSide});
 const gasket=new THREE.MeshStandardMaterial({color:0x0e202e,metalness:.46,roughness:.63});
 owned.push(trim,hot,gasket);rig.heat=hot;
 const mesh=(geo,mat,pos,parent=root,name='')=>{
  const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 };
 const group=(name,pos)=>{const g=new THREE.Group();g.position.set(...pos);g.name=name;root.add(g);return g;};
 const rod=(start,end,r=.04,mat=trim,name='structural-brace')=>{
  const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),d=b.clone().sub(a);
  const o=mesh(new THREE.CylinderGeometry(r*.82,r,d.length(),8),mat,a.clone().add(b).multiplyScalar(.5).toArray(),root,name);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;
 };
 // The canopy has a real substructure below its translucent tinted shell.
 if(glass){glass.transparent=true;glass.opacity=.88;glass.depthWrite=true;glass.roughness=.075;glass.clearcoat=1;glass.clearcoatRoughness=.07;}
 const seating=group('visible-cockpit-interior',[0,.132,-.07]);
 for(const side of[-1,1]){
  const x=side*(index===4?.091:.072);
  const back=mesh(new THREE.BoxGeometry(.072,.115,.093),gasket,[x,.026,.051],seating,'integrated-seat-back');
  back.rotation.x=-.14;
  mesh(new THREE.BoxGeometry(.063,.021,.115),carbon,[x,-.023,-.035],seating,'integrated-seat-pan');
  mesh(new THREE.SphereGeometry(.03,9,6),gasket,[x,.096,.023],seating,'pilot-headrest');
  rig.added.cockpit++;
 }
 // Bevelled inspection panel, recessed bolts and flush framing.
 const deckY=[.125,.137,.105,.145,.152,.139][index];
 mesh(panelGeo(.32,.19,.015),trim,[0,deckY,.43],root,'bevelled-service-hatch');rig.added.panels++;
 for(const side of[-1,1]){
  const x=side*.077;
  for(const z of[.30,.52])mesh(new THREE.SphereGeometry(.008,7,4),gasket,[x,deckY+.017,z],root,'service-fastener');
  const wx=side*RX[index],wy=WY[index],hz=.365;
  mesh(new THREE.BoxGeometry(.16,.052,.20),gasket,[wx,wy+.016,hz],root,'aileron-anchor-block');
  const hinge=group('active-aileron-'+(side<0?'left':'right'),[wx,wy+.048,hz]);
  mesh(panelGeo(.31,.27,.028),index===3?trim:polished,[0,.008,.09],hinge,'bevelled-hinged-control-surface');
  const pin=mesh(new THREE.CylinderGeometry(.018,.018,.18,9),carbon,[0,0,0],hinge,'load-bearing-aileron-pin');pin.rotation.z=PI/2;
  rod([wx,wy-.026,hz-.10],[wx,wy+.06,hz+.055],.025,graphite,'aileron-support-strut');
  rig.joints.push({hinge,side});rig.added.mechanics++;
  // Ship-specific manufacturing: six different families, not shared stripes.
  if(index===0||index===4){
   const px=side*X[index],py=index===0?.14:.24;
   for(let j=0;j<4;j++){
    const z=-.45+j*.25;
    mesh(new THREE.BoxGeometry(index===4?.210:.15,.012,.112),j%2?carbon:graphite,[px,py,z],root,'flush-pod-service-cover');rig.added.panels++;
   }
   rod([side*.27,.056,-.30],[side*.62,.060,-.29],.05,polished,'real-nacelle-front-strut');
   rod([side*.29,.05,.42],[side*.62,.049,.42],.058,polished,'real-nacelle-rear-strut');
  }else if(index===1){
   for(let k=0;k<3;k++){mesh(new THREE.BoxGeometry(.12,.009,.052),gasket,[side*.68,.157,-.42+k*.29],root,'trident-mechanical-channel');rig.added.panels++;}
   rod([side*.47,.054,.45],[side*.76,.09,.60],.038,hull,'trident-armour-root');
  }else if(index===2){
   for(let k=0;k<3;k++){mesh(panelGeo(.15,.14,.009),k===1?trim:graphite,[side*(.49+k*.11),.105,.08+k*.13],root,'flush-stealth-armour');rig.added.panels++;}
  }else if(index===3){
   // Organic crescent forms, broad embedded ribs instead of sharp armour.
   rod([side*.35,.083,-.31],[side*.60,.081,-.52],.022,trim,'manta-internal-wing-rib');
  }else if(index===5){
   rod([side*.47,.051,.16],[side*.74,.264,.44],.038,polished,'sword-fin-support');
   mesh(new THREE.BoxGeometry(.068,.012,.23),graphite,[side*.52,.14,.28],root,'sword-blade-root-channel');rig.added.panels++;
  }
 }
 // Boost-actuated radiator plates: visibly attached hinges and movable flaps.
 for(const side of[-1,1]){
  const x=side*(index===4?.30:index===3?.23:.27),y=[.149,.17,.118,.163,.17,.163][index],z=.61;
  mesh(new THREE.BoxGeometry(.16,.055,.22),gasket,[x,y-.025,z],root,'radiator-base-socket');
  const hinge=group('moving-radiator-'+side,[x,y,z]);
  mesh(new THREE.BoxGeometry(.135,.024,.196),hot,[0,.025,.027],hinge,'thermally-coated-hinged-radiator');
  mesh(new THREE.BoxGeometry(.100,.010,.09),carbon,[0,.04,.002],hinge,'radiator-core');
  rig.louvers.push({hinge,side});rig.added.mechanics++;
 }
 // Moving four-petal vectored exhaust bells, welded into each engine's root.
 for(const side of[-1,1]){
  const x=side*X[index],y=Y[index],z=Z[index]-.06;
  mesh(new THREE.TorusGeometry(.115,.021,7,18),graphite,[x,y,z],root,'exhaust-petal-collar');
  for(let k=0;k<4;k++){
   const pivot=group('thrust-nozzle-'+side+'-'+k,[x,y,z]);
   pivot.rotation.z=k*PI/2;
   const flap=mesh(new THREE.BoxGeometry(.062,.030,.21),k%2?hot:polished,[0,.095,.087],pivot,'articulated-nozzle-petal');
   flap.rotation.x=.10;rig.petals.push({pivot,flap});rig.added.mechanics++;
  }
  const shield=mesh(new THREE.CylinderGeometry(.13,.14,.12,12,1,true),hot,[x,y,z-.07],root,'exhaust-heat-shield');shield.rotation.x=PI/2;
 }
 return rig;
}
export function animateFleetPolish(ship,time,boost=false,reduced=false){
 const rig=ship?.userData?.fleetPolish;if(!rig?.high)return;
 const roll=THREE.MathUtils.clamp(ship.userData.flight?.roll||0,-.45,.45),pitch=THREE.MathUtils.clamp(ship.userData.flight?.pitch||0,-.30,.30);
 const throttle=THREE.MathUtils.clamp(ship.userData.throttle||0,0,1);
 for(const a of rig.joints){
  const angle=THREE.MathUtils.clamp(a.side*roll*.55+pitch*.30,-.28,.28);
  a.hinge.rotation.x+=(angle-a.hinge.rotation.x)*.26;
 }
 for(const l of rig.louvers){
  const target=boost?.36:.055+throttle*.08;
  l.hinge.rotation.x+=(target-l.hinge.rotation.x)*.2;
 }
 for(const p of rig.petals){
  const target=boost?.27:.11+throttle*.08;
  p.flap.rotation.x+=(target-p.flap.rotation.x)*.2;
 }
 rig.heat.emissiveIntensity=boost?.2:.03+throttle*.08;
 rig.boost=!!boost;
 if(typeof location!=='undefined'&&location.search.includes('shipqa=1')){
  window.__shiftlinePolishQA={model:ship.userData.designId,joints:rig.joints.length,louvers:rig.louvers.length,petals:rig.petals.length,details:rig.added,boost:!!boost,flap:rig.joints[0]?.hinge.rotation.x||0,vent:rig.louvers[0]?.hinge.rotation.x||0,nozzle:rig.petals[0]?.flap.rotation.x||0};
 }
}
