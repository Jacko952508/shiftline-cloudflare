import * as THREE from 'three';
// SHIFTLINE V119. Each menu option physically replaces or augments a sizeable
// external assembly. The six aircraft stay recognisable, with a common span.
const PI=Math.PI;
const ENGINE_X=[.77,.46,.23,.39,.79,.28];
const ENGINE_Y=[.055,.025,-.02,-.03,.07,.02];
const ENGINE_Z=[.83,.85,.79,.75,.96,.88];
const CANOPY_Z0=[-.67,-.67,-.72,-.73,-.65,-.79];
const CANOPY_Z1=[.39,.38,.21,.40,.24,.28];
const WING_TOP=[.084,.104,.083,.103,.27,.08];
const OUTER_X=[.86,.84,.90,.88,.85,.88];
const PALETTE=[0x65eaff,0xff873c,0xbc8dff,0x72ffd1,0xff89cf];
export function addFleetUpgrades(index,c,api){
 const {add,layer,line,bar,mountedFin,hullMesh,materials,owned}=api;
 const {hull,carbon,trim,polished,graphite,ceramic,glass,glow}=materials;
 const counts={wing:0,engine:0,canopy:0,fin:0,livery:0},parts=[];
 const mark=(category,object,kind='shape')=>{
  if(!object)return object;
  object.name='fleet-kit-'+category+'-'+(c[category]||0)+'-'+kind+'-'+counts[category];
  object.userData.customisationCategory=category;
  counts[category]++;parts.push(object);return object;
 };
 const finish=materials.premium?hull:(index===3?ceramic:polished);
 const coloured=new THREE.MeshPhysicalMaterial({color:trim.color.clone().lerp(new THREE.Color(0xbdefff),.08),metalness:.67,roughness:.24,clearcoat:.92,clearcoatRoughness:.13,emissive:trim.color.clone(),emissiveIntensity:.15,side:THREE.DoubleSide});
 owned.push(coloured);
 const bright=new THREE.MeshBasicMaterial({color:PALETTE[c.trail]||PALETTE[0],toneMapped:false,side:THREE.DoubleSide});
 owned.push(bright);
 const wingPoint=(x,z)=>[x,z];
 const wing=(poly,side,mat=finish,height=WING_TOP[index],thickness=.04)=>{
  const m=layer(poly,mat,height,thickness,side);return mark('wing',m);
 };
 const ornament=(category,points,side,height,mat=coloured,width=.008)=>{
  return mark(category,line(points.map(([x,y,z])=>[x*side,y+height,z]),mat,width),'seam');
 };
 const bracket=(category,from,to,thick=.05,mat=graphite)=>{
  return mark(category,bar(from,to,thick,thick*.72,mat),'brace');
 };
 // Large alternative aerodynamic kits, not microscopic tweaks to the stock shape.
 // The panel profiles are deliberately different, and retain the model's core form.
 if(c.wing>0){
  const profile=[
   null,
   [[.22,-.37],[.43,-.65],[.99,-.54],[1.04,.28],[.78,.65],[.35,.56]],
   [[.22,-.19],[.50,-.54],[1.02,-.95],[.85,-.22],[1.07,.65],[.74,.48],[.40,.38]],
   [[.21,-.30],[.53,-.68],[1.05,-1.07],[.83,-.09],[1.06,.67],[.48,.43]],
   [[.23,-.14],[.49,-.46],[.88,-.84],[1.08,-.75],[.92,-.11],[.79,.24],[1.04,.76],[.62,.55],[.37,.35]]
  ][c.wing];
  for(const side of[-1,1]){
   const baseY=WING_TOP[index],length=OUTER_X[index];
   // Selected kits have visibly different outer leading and trailing edges.
   wing(profile,side,(c.wing===2||c.wing===4)?finish:hull,baseY,.040);
   const section=[
    [.36,-.17],[.55,-.43],[.83,-.32],[.75,.35],[.44,.33]
   ].map(([x,z])=>[x,z+(c.wing===3?-.13:0)]);
   wing(section,side,(c.wing===2||c.wing===4)?graphite:coloured,baseY+.045,.018);
   bracket('wing',[side*.31,baseY-.026,-.16],[side*.67,baseY+.010,.22],.047,graphite);
   ornament('wing',[[.35,.052,-.26],[.65,.052,-.55],[.91,.046,-.28]],side,baseY,bright,.008);
   if(c.wing===1)mark('wing',layer([[.47,.35],[.64,.42],[.70,.70],[.57,.59]],coloured,baseY+.06,.023,side),'rear-aileron');
   if(c.wing===2)mark('wing',layer([[.45,-.41],[.74,-.70],[.91,-.91],[.72,-.36]],carbon,baseY+.063,.017,side),'swept-edge');
   if(c.wing===3)mark('wing',layer([[.55,-.26],[.85,-.80],[.97,-1.00],[.78,-.06]],graphite,baseY+.06,.024,side),'arrow-spine');
   if(c.wing===4){
    ornament('wing',[[.52,.07,-.44],[.83,.08,-.75],[1.02,.06,-.65]],side,baseY,bright,.010);
    mark('wing',layer([[.49,.28],[.76,.31],[.98,.71],[.76,.58]],coloured,baseY+.055,.020,side),'crescent-tip');
   }
  }
 }
 // Engine: armoured, annular, articulated and split-shroud assemblies.
 if(c.engine>0){
  for(const side of[-1,1]){
   const x=side*ENGINE_X[index],y=ENGINE_Y[index],z=ENGINE_Z[index],r=index===4?.19:index===0?.16:.125;
   if(c.engine===1){
    const m=add(new THREE.CylinderGeometry(r*1.17,r*1.08,.54,16,1,true),finish,[x,y,z-.26]);
    m.rotation.x=PI/2;mark('engine',m,'long-armoured-cowl');
    for(const dx of[-1,1])mark('engine',add(new THREE.BoxGeometry(.039,.16,.40),graphite,[x+dx*r*1.04,y,z-.27]),'cowl-rails');
    for(const dz of[-.38,-.25,-.10]){
     const ring=add(new THREE.TorusGeometry(r*1.1,.017,7,20),coloured,[x,y,z+dz]);
     mark('engine',ring,'armour-rib');
    }
   }else if(c.engine===2){
    const m=add(new THREE.CylinderGeometry(r*.92,r*.90,.44,16,1,true),graphite,[x,y,z-.20]);m.rotation.x=PI/2;mark('engine',m,'ion-spool');
    for(const dz of[-.32,-.13,.06]){
     mark('engine',add(new THREE.TorusGeometry(r*1.22,.027,7,20),bright,[x,y,z+dz]),'ion-ring');
    }
    for(const sign of[-1,1])bracket('engine',[x+sign*r,y,z-.32],[x+sign*r,y,z+.05],.038,finish);
   }else if(c.engine===3){
    const m=add(new THREE.CylinderGeometry(r*.79,r*1.33,.37,14),finish,[x,y,z-.045]);m.rotation.x=PI/2+side*.21;mark('engine',m,'gimbal-bell');
    const gimbal=add(new THREE.TorusGeometry(r*1.36,.025,7,20),graphite,[x,y,z-.19]);mark('engine',gimbal,'pivot-ring');
    for(const sign of[-1,1]){
     const flap=add(new THREE.BoxGeometry(.052,.20,.42),coloured,[x+sign*r*1.18,y,z-.12]);
     flap.rotation.y=sign*.22;mark('engine',flap,'vector-flap');
    }
    bracket('engine',[x,y-.08,z-.25],[x+side*.07,y-.11,z+.15],.046,graphite);
   }else if(c.engine===4){
    for(const sign of[-1,1]){
     const shield=add(new THREE.BoxGeometry(.085,.23,.60),sign===1?finish:graphite,[x+sign*r*1.10,y,z-.26]);
     shield.rotation.z=sign*.12;mark('engine',shield,'split-armour');
     mark('engine',add(new THREE.CylinderGeometry(.054,.066,.15,12),coloured,[x+sign*.075,y+.11,z+.04]),'mini-thruster');
    }
    mark('engine',add(new THREE.BoxGeometry(r*1.95,.052,.43),graphite,[x,y+.16,z-.21]),'split-overhead-brace');
   }
  }
 }
 // Canopy: different physical surrounds, ridges and shell treatments.
 if(c.canopy>0){
  const z0=CANOPY_Z0[index],z1=CANOPY_Z1[index];
  const lead=z0+.21,tail=z1-.10;
  for(const side of[-1,1]){
   const x=side*.166;
   if(c.canopy===1){ // smoked low-profile visor with thick side sill
    bracket('canopy',[x,.25,lead],[x,.265,tail],.085,graphite);
    mark('canopy',layer([[.10,z0+.12],[.21,z0+.22],[.22,z1-.08],[.10,z1-.02]],graphite,.314,.012,side),'overhanging-visor');
   }else if(c.canopy===2){ // prismatic crystal roof with segmented ribs
    bracket('canopy',[side*.11,.32,lead],[side*.13,.365,tail],.058,coloured);
    for(let i=0;i<3;i++)bracket('canopy',[side*.02,.345,z0+.30+i*.20],[side*.18,.34,z0+.28+i*.20],.032,polished);
   }else if(c.canopy===3){ // armoured cockpit, recessed sight slit
    mark('canopy',layer([[.06,z0+.14],[.25,z0+.29],[.24,z1-.03],[.10,z1+.02]],finish,.337,.032,side),'armour-hood');
    bracket('canopy',[side*.21,.31,lead],[side*.20,.29,tail],.07,graphite);
   }else if(c.canopy===4){ // tall bubble with illuminated root rails
    if(side===1)mark('canopy',hullMesh([[z0+.16,.005,.004,.25],[z0+.34,.13,.10,.29],[z0+.57,.17,.135,.32],[z1-.05,.11,.07,.29],[z1+.08,.012,.012,.24]],glass,0,0,14),'raised-glass-bubble');
    bracket('canopy',[side*.16,.29,lead],[side*.14,.33,tail],.048,coloured);
   }
  }
  if(c.canopy===2||c.canopy===4)ornament('canopy',[[0,.32,lead],[0,.34,tail]],1,0,bright,.007);
 }
 // Fins: tail layout changes count, cant, height and overall 3D attitude.
 if(c.fin>0){
  if(c.fin===3){
   const fin=mountedFin(1,.075,.54,.082,.46,index===3?ceramic:finish,.42,.07);
   mark('fin',fin,'tall-centre-dorsal');
  }else{
   const heights=[0,.23,.37,.43,.34],positions=[0,.33,.46,.09,.35],leans=[0,.06,.14,.07,.25];
   for(const side of[-1,1]){
    const fin=mountedFin(side,positions[c.fin],c.fin===2?.72:.56,.07,heights[c.fin],index===3?ceramic:finish,.34,leans[c.fin]);
    mark('fin',fin,c.fin===4?'canted-v-tail':c.fin===2?'split-long-tail':'twin-blade');
   }
  }
 }
 // Liveries: actual painted armour pieces and luminous panel graphics, not tiny lines.
 if(c.livery>0){
  const y=WING_TOP[index]+.048;
  for(const side of[-1,1]){
   if(c.livery===1){
    mark('livery',layer([[.31,-.33],[.41,-.48],[.90,.20],[.79,.38]],coloured,y,.014,side),'full-racing-stripe');
    ornament('livery',[[.32,.05,-.35],[.42,.05,-.47],[.85,.04,.33]],side,y,bright,.010);
   }else if(c.livery===2){
    mark('livery',layer([[.39,-.22],[.69,-.41],[.79,-.09],[.48,.13]],graphite,y,.018,side),'tech-circuit-panel');
    for(let k=0;k<3;k++)ornament('livery',[[.45,.04,-.16+k*.16],[.68,.04,-.16+k*.16],[.74,.04,-.13+k*.16]],side,y,bright,.006);
   }else if(c.livery===3){
    for(let k=0;k<2;k++)mark('livery',layer([[.34+k*.13,-.21],[.48+k*.13,-.13],[.71+k*.11,.21],[.56+k*.12,.28]],coloured,y+k*.007,.018,side),'painted-chevron');
   }else if(c.livery===4){
    mark('livery',layer([[.24,-.29],[.52,-.34],[.60,.49],[.40,.55]],coloured,y,.017,side),'full-spine-livery');
    ornament('livery',[[.30,.055,-.35],[.55,.055,.12],[.59,.055,.49]],side,y,bright,.010);
   }
  }
  if(c.livery===4)mark('livery',add(new THREE.BoxGeometry(.095,.018,.94),coloured,[0,.235,-.07]),'painted-central-spine');
 }
 const signature=['wing',c.wing,'engine',c.engine,'canopy',c.canopy,'fin',c.fin,'livery',c.livery].join('-');
 return{counts,signature,pieceCount:parts.length};
}
