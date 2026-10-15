import * as THREE from 'three';
// V121 final-fit airframes: welded interfaces, recessed mechanical joinery and
// model-specific surface grammar. Detail only: no collisions, physics or saves.
const NAMES=['VECTOR','RAZOR','PHANTOM','MANTA','GEMINI','SPECTRE'];
const EXHAUST=[[.77,.055,.83],[.46,.025,.85],[.23,-.02,.79],[.39,-.03,.75],[.79,.07,.96],[.28,.02,.88]];
const DECK=[.13,.115,.068,.133,.267,.107];
const PI=Math.PI;
export function installFleetPrecision(ship,root,index,c,api){
 const {hull,polished,graphite,carbon,trim,glow,premium}=api.materials;
 const {high,owned}=api;
 const stats={model:NAMES[index],engineSockets:0,structuralJoins:0,surfaceMarks:0,finFillets:0,highDetail:!!high};
 const bright=new THREE.MeshBasicMaterial({color:premium?0xffffff:trim.color.clone(),toneMapped:false,side:THREE.DoubleSide});
 const seal=new THREE.MeshStandardMaterial({color:0x0a1520,metalness:.52,roughness:.69,side:THREE.DoubleSide});
 const titanium=new THREE.MeshPhysicalMaterial({color:premium?hull.color.clone():[0xbedce8,0xd36a75,0x607888,0xe5f6fa,0x9baebf,0xc8dae1][index],metalness:.82,roughness:.35,clearcoat:.68,clearcoatRoughness:.17,side:THREE.DoubleSide});
 owned.push(bright,seal,titanium);
 const add=(geometry,material,xyz,name)=>{
  const o=new THREE.Mesh(geometry,material);o.position.set(...xyz);o.name='precision-'+index+'-'+name;
  o.castShadow=false;o.receiveShadow=false;root.add(o);return o;
 };
 const bar=(a,b,r,mat=polished,name='welded-brace')=>{
  const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b);
  const d=vb.clone().sub(va),m=add(new THREE.CylinderGeometry(r*.9,r,d.length()+r*.30,8),mat,va.clone().add(vb).multiplyScalar(.5).toArray(),name);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());stats.structuralJoins++;return m;
 };
 const band=(x,y,z,w,d,material=graphite,name='body-clamp')=>{
  const o=add(new THREE.BoxGeometry(w,.026,d),material,[x,y,z],name);stats.surfaceMarks++;return o;
 };
 const seam=(points,r=.006,mat=bright,name='manufactured-seam')=>{
  const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));
  const o=add(new THREE.TubeGeometry(curve,Math.max(8,points.length*5),r,5,false),mat,[0,0,0],name);
  stats.surfaceMarks++;return o;
 };
 // A real welded mounting cradle links each thruster to its local airframe.
 // Unlike a purely painted nozzle ring, these arms bury their ends in the hull.
 const [engineX,engineY,engineZ]=EXHAUST[index];
 for(const side of[-1,1]){
  const x=side*engineX, y=engineY, z=engineZ;
  const r=index===4?.157:index===0?.136:index===3?.097:.105;
  const collar=add(new THREE.CylinderGeometry(r*1.12,r*.99,.17,14),titanium,[x,y,z-.105],'load-bearing-nozzle-collar');
  collar.rotation.x=PI/2;
  const dark=add(new THREE.CylinderGeometry(r*.92,r*.94,.025,14),seal,[x,y,z-.009],'recessed-nozzle-neck');
  dark.rotation.x=PI/2;
  const bridgeStart=index===4?[side*.53,.14,.53]:index===0?[side*.49,.05,.48]:index===3?[side*.22,.035,.54]:index===2?[side*.16,.045,.48]:index===1?[side*.30,.035,.47]:[side*.20,.035,.52];
  bar(bridgeStart,[x,y,z-.19],index===4?.065:.044,index===2?graphite:polished,'full-depth-engine-mount');
  if(high){
   // Engine option is legible in the nozzle itself, even in rear chase view.
   const detailCount=c.engine===4?4:c.engine===2?3:2;
   for(let k=0;k<detailCount;k++){
    const a=(k+.5)/detailCount*2*PI;
    const px=x+Math.cos(a)*r*.95,py=y+Math.sin(a)*r*.95;
    const rivet=add(new THREE.SphereGeometry(.013,7,5),c.engine===3?bright:graphite,[px,py,z+.018],'nozzle-ceramic-lock');
    rivet.scale.z=.62;
   }
  }
  stats.engineSockets++;
 }
 // Fin boots bridge the underside of every tail to the actual wing/deck.
 // Mount records are made by mountedFin() and also cover the tall SPECTRE blade.
 for(const f of root.userData.finMounts||[]){
  const x=f.side*f.footX,y=f.baseY,z=f.footZ;
  const shoe=add(new THREE.BoxGeometry(f.kind==='sword-blade'?.21:.155,.056,.255),graphite,[x,y+.003,z],'fin-root-cast-shoe');
  shoe.rotation.z=f.side*(f.kind==='sword-blade'?.07:.04);
  const tip=add(new THREE.BoxGeometry(.09,.03,.186),titanium,[x,y+.04,z-.015],'fin-root-fillet-cap');
  tip.rotation.z=f.side*.08;stats.finFillets++;
 }
 // Different surface language for each craft. These aren't the same plates
 // rescaled or re-coloured across six models.
 if(high){
  switch(index){
   case 0: // VECTOR: long exposed nacelles, narrow nose and floating-deck rigidity
    for(const side of[-1,1]){
     bar([side*.33,.070,-.48],[side*.68,.09,-.72],.034,polished,'forward-nacelle-tie');
     band(side*.77,.218,.18,.225,.27,titanium,'long-pod-machined-lid');
     seam([[side*.68,.210,-.50],[side*.69,.227,-.12],[side*.69,.218,.45]],.007,seal,'pod-panel-parting-line');
    }break;
   case 1: // RAZOR: crisp forward prongs and red mechanical tracks
    for(const side of[-1,1]){
     seam([[side*.66,.084,-1.35],[side*.69,.105,-.99],[side*.71,.115,-.65]],.010,bright,'twin-lance-lit-recess');
     band(side*.69,.11,-.46,.14,.29,graphite,'prong-locking-plate');
     bar([side*.44,.060,-.60],[side*.71,.067,-.85],.028,polished,'lance-internal-rib');
    }break;
   case 2: // PHANTOM: low radar-absorbing facets, no external tubing
    for(const side of[-1,1]){
     const p=band(side*.62,.073,-.03,.28,.31,graphite,'stealth-inset-chevron');
     p.rotation.y=side*.46;
     seam([[side*.31,.068,-.40],[side*.62,.071,-.18],[side*.87,.064,.31]],.005,seal,'flush-panel-split');
    }break;
   case 3: // MANTA: smooth living crescent, never fill its open centre
    for(const side of[-1,1]){
     seam([[side*.31,.107,-.32],[side*.55,.102,-.59],[side*.82,.077,-.79]],.012,titanium,'crescent-leading-sweep');
     bar([side*.22,.048,.37],[side*.35,-.016,.65],.022,titanium,'rear-crescent-thrust-strut');
    }break;
   case 4: // GEMINI: load-bearing rig and armoured industrial aft platforms
    for(const side of[-1,1]){
     band(side*.79,.292,.35,.30,.32,titanium,'industrial-top-service-door');
     bar([side*.41,.10,.40],[side*.72,.18,.54],.046,polished,'rear-lattice-tie');
     seam([[side*.68,.280,-.47],[side*.68,.287,.05],[side*.68,.285,.49]],.006,seal,'pod-armour-weld');
    }break;
   case 5: // SPECTRE: slender sharp surfaces, with a dark blade fillet
    for(const side of[-1,1]){
     bar([side*.36,.09,-.22],[side*.68,.43,.27],.032,graphite,'high-load-blade-web');
     seam([[side*.51,.17,-.22],[side*.73,.51,.24],[side*.82,.32,.49]],.008,bright,'hardened-blade-edge');
    }break;
  }
 }
 ship.userData.fleetPrecision=stats;
 if(typeof window!=='undefined'&&location.search.includes('shipqa=1'))window.__shiftlinePrecisionQA=stats;
 return stats;
}
