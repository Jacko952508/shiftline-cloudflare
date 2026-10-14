import * as THREE from 'three';
import{fleetSurfaceMaps}from'./fleet-materials-v118.js?v=118';
import{installShipExhaust}from'./ship-exhaust-v119.js?v=119';
import{addFleetUpgrades}from'./fleet-upgrades-v119.js?v=119';
// SHIFTLINE 117 — six deliberately different, complete airframes. All geometry
// points toward local -Z; wingspan is normalised to 2.08 local units.
// The gameplay collision envelope is controlled elsewhere and is unchanged.
const NAMES=['VECTOR','RAZOR','PHANTOM','MANTA','GEMINI','SPECTRE'];
const SPAN=2.08;
const PI=Math.PI;

function loft(stations,sides=16){
 const p=[],uv=[],idx=[];
 for(let i=0;i<stations.length;i++){
  const [z,rx,ry,cy=0]=stations[i];
  for(let k=0;k<=sides;k++){
   const t=k/sides*PI*2;
   p.push(Math.cos(t)*rx,cy+Math.sin(t)*ry,z);
   uv.push(k/sides,i/(stations.length-1));
  }
 }
 for(let i=0;i<stations.length-1;i++)for(let k=0;k<sides;k++){
  const a=i*(sides+1)+k,b=a+sides+1;
  idx.push(a,a+1,b,a+1,b+1,b);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);
 geo.computeVertexNormals();return geo;
}
function plate(points,thickness=.03,bevel=.012){
 const s=new THREE.Shape();
 points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();
 const g=new THREE.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel*.6,bevelSegments:2,steps:1,curveSegments:8});
 g.rotateX(-PI/2);return g;
}
function crescentGeometry(){
 const s=new THREE.Shape();
 s.moveTo(.20,.28);
 s.bezierCurveTo(.40,.55,.79,.93,1.00,.91);
 s.bezierCurveTo(1.10,.85,.95,.42,.80,.14);
 s.bezierCurveTo(.61,-.12,.66,-.42,.90,-.69);
 s.bezierCurveTo(.72,-.66,.50,-.49,.41,-.17);
 s.bezierCurveTo(.30,-.05,.27,.12,.20,.28);
 const g=new THREE.ExtrudeGeometry(s,{depth:.065,steps:1,curveSegments:18,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2});
 g.rotateX(-PI/2);return g;
}
function bladeGeometry(side){
 // A genuinely raised, tapered triangular stabiliser, not a horizontal wing.
 const v=[[side*.31,.08,-.51],[side*.90,.75,.26],[side*.96,.07,.89],
          [side*.39,.05,.61],[side*.78,.55,.34],[side*.74,.07,.81]];
 const index=[0,1,2,0,2,3,0,4,1,4,5,2,3,2,5];
 const geo=new THREE.BufferGeometry(),pos=[];
 for(let i of index)pos.push(...v[i]);
 geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 geo.computeVertexNormals();return geo;
}
let ceramicTiles=null;
function podTileTexture(){
 if(ceramicTiles)return ceramicTiles;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#586b7d';ctx.fillRect(0,0,128,128);
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const x=col*16,y=row*16;
  ctx.fillStyle=((row*11+col*7)%4===0)?'#697989':'#566879';ctx.fillRect(x+1,y+1,14,14);
  ctx.fillStyle='#283543';ctx.fillRect(x+1,y+14,14,1);ctx.fillRect(x+14,y+1,1,13);
  ctx.fillStyle='rgba(190,216,232,.16)';ctx.fillRect(x+2,y+2,12,1);
 }
 ceramicTiles=new THREE.CanvasTexture(canvas);ceramicTiles.colorSpace=THREE.SRGBColorSpace;
 ceramicTiles.wrapS=ceramicTiles.wrapT=THREE.RepeatWrapping;ceramicTiles.repeat.set(3,5);
 ceramicTiles.anisotropy=2;return ceramicTiles;
}
function enginePod(stations,mat,x,y,add,sides=16){return add(loft(stations,sides),mat,[x,y,0]);}
function builder(ship,index,c,m,high=true){
 const root=new THREE.Group();root.name='SHIFTLINE_V117_'+NAMES[index];ship.add(root);
 const owned=[];
 const material=(opts)=>{const o=new THREE.MeshPhysicalMaterial(opts);owned.push(o);return o;};
 const basic=(hex)=>{const o=new THREE.MeshBasicMaterial({color:hex,toneMapped:false,side:THREE.DoubleSide});owned.push(o);return o;};
 const {hull,carbon,trim,glass,white,premium}=m;
 if(!premium&&c.finish===0){
  hull.color.setHex([0xc4d3dc,0x99172a,0x34404e,0xe5eff4,0xb9c7d2,0xc8d3df][index]);
  hull.roughness=[.27,.23,.52,.20,.34,.26][index];
 }
 const polished=material({...fleetSurfaceMaps('brushed'),bumpScale:.007,color:premium?hull.color.clone():new THREE.Color(index===1?0xa61c35:index===3?0xeaf2fb:0xc3d6e0),metalness:.9,roughness:.31,clearcoat:1,clearcoatRoughness:.13,side:THREE.DoubleSide});
 const graphite=material({...fleetSurfaceMaps('industrial'),bumpScale:.009,color:0x263745,metalness:.63,roughness:.67,side:THREE.DoubleSide});
 const tiledPod=material({...fleetSurfaceMaps('pod'),bumpScale:.015,color:0xa5bdce,metalness:.62,roughness:.6,clearcoat:.26,side:THREE.DoubleSide});
 const stealth=material({...fleetSurfaceMaps('stealth'),bumpScale:.005,color:0x374b5c,metalness:.58,roughness:.70,side:THREE.DoubleSide});
 const ceramic=material({...fleetSurfaceMaps('ceramic'),bumpScale:.003,color:0xf4fbff,metalness:.26,roughness:.39,clearcoat:1,side:THREE.DoubleSide});
 const shade=material({color:0x071522,metalness:.38,roughness:.7,side:THREE.DoubleSide});
 const accentHex=index===1?0xff2d54:index===4?0x8deeff:0x61dcff;
 const glow=basic(premium?0xf4fcff:accentHex);
 const purple=basic([0xbf87ff,0xff4261,0x5bbfff,0x4bffe7,0xb77dff,0x64c9ff][c.trail]||0xb784ff);
 const exhaust=basic([0x82eaff,0xff955b,0xbd8bff,0x70ffd4,0xff9bc5][c.trail]||0x82eaff);
 const paint=trim;
 const add=(geo,mat,xyz=[0,0,0],parent=root)=>{
  const o=new THREE.Mesh(geo,mat);o.position.set(...xyz);
  o.castShadow=high;o.receiveShadow=high;parent.add(o);return o;
 };
 const hullMesh=(st,mat=hull,x=0,y=0,n=16)=>{const o=enginePod(st,mat,x,y,add,n);o.userData.structuralHull=true;return o;};
 const layer=(pts,mat=hull,y=.08,th=.025,side=1)=>{
  const o=add(plate(pts,th),mat,[0,y,0]);o.scale.x=side;return o;
 };
 const line=(points,mat=glow,r=.006)=>{
  const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(10,points.length*4),r,5,false);
  const o=add(g,mat);o.castShadow=false;return o;
 };
 const bar=(a,b,width=.055,depth=.055,mat=hull)=>{
  const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b);
  const d=vb.clone().sub(va),o=add(new THREE.BoxGeometry(width,depth,d.length()),mat);
  o.position.copy(va.add(vb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),d.normalize());return o;
 };
 const cap=(x,y,z,rad,mat=exhaust)=>{
  const disk=add(new THREE.CircleGeometry(rad*.76,16),mat,[x,y,z]);
  disk.castShadow=false;
  const ring=add(new THREE.TorusGeometry(rad,.018,7,20),polished,[x,y,z]);ring.castShadow=false;
  return disk;
 };
 const vane=(x,y,z,width=.12)=>{
  const o=add(new THREE.BoxGeometry(width,.013,.055),graphite,[x,y,z]);o.rotation.y=x<0?-.14:.14;return o;
 };
 const spine=(len=1.4,mat=polished)=>hullMesh([[-len,.006,.007,-.01],[-len*.78,.075,.05,.005],[-.54,.15,.11,.015],[-.12,.19,.14,.025],[.48,.16,.12,.01],[.82,.12,.07,.0],[.95,.02,.02,0]],mat);
 const canopy=(zFront=-.66,zBack=.43,width=.19,height=.13)=>{
  const arr=[[zFront,.01,.008,.18],[zFront+.16,width*.60,height*.63,.18],[zFront+.41,width,height,.19],[zBack-.17,width*.92,height*.93,.19],[zBack,.015,.008,.17]];
  const o=hullMesh(arr,glass,0,0,20);o.userData.partRole='canopy';
  line([[0,.22,zFront+.02],[0,.31,zFront+.40],[0,.30,zBack-.20]],polished,.005);
  return o;
 };
 const wingScale=[.99,1.02,.95,.96,1][c.wing],sweep=[0,-.10,.08,-.10,.14][c.wing];
 const eng=[1,1.13,.92,1.1,.87][c.engine];
 const finHeight=[.16,.30,.23,.43,.34][c.fin];
 const wingPoly=(points,side,mat=hull,y=.065)=>{
  const remap=points.map(([x,z])=>[x*wingScale,z+(x>.35?sweep*(x-.35):0)]);
  const o=layer(remap,mat,y,.040,side);o.userData.structuralHull=true;return o;
 };
 const finishDetail=(side)=>{
  if(c.livery===0)return;
  const xx=side*(.16+(c.livery===2?.055:0));
  if(c.livery===1)line([[xx,.16,-.45],[xx*1.1,.17,.43]],paint,.011);
  else if(c.livery===2){for(let i=0;i<3;i++)vane(side*(.26+i*.035),.17,.32+i*.13,.05);}
  else if(c.livery===3)line([[side*.23,.15,.13],[side*.45,.15,.52],[side*.29,.15,.76]],paint,.008);
  else line([[side*.13,.18,-.65],[side*.15,.20,.55]],paint,.011);
 };
 const finMounts=[];root.userData.finMounts=finMounts;
 const mountedFin=(side,x,z,baseY,height,skin=polished,chord=.36,lean=.10)=>{
  // Solid welded stabiliser: bottom edge starts WITHIN the wing/deck.
  // A physical root shoe and sloping gussets overlap both the fin and chassis.
  const half=.019,outline=[
   [x,baseY,z-chord*.56],
   [x,baseY,z+chord*.54],
   [x+lean,baseY+height,z+chord*.17],
   [x+lean*.83,baseY+height,z-chord*.12]
  ],positions=[],uvs=[],indices=[];
  for(let face=0;face<2;face++)for(const [px,py,pz]of outline){
   positions.push(side*(px+(face===0?-half:half)),py,pz);
   uvs.push(pz-z+.5,py-baseY);
  }
  indices.push(0,1,2,0,2,3,4,6,5,4,7,6);
  for(let j=0;j<4;j++){const k=(j+1)%4;indices.push(j,k,k+4,j,k+4,j+4);}
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);geo.computeVertexNormals();
  const fin=add(geo,skin);fin.name='connected-fin-'+index+'-'+side;
  // Root shoe intersects the underside of the fin and the actual wing skin.
  const shoe=add(new THREE.BoxGeometry(.17,.12,chord*.83),graphite,[side*x,baseY-.023,z]);
  shoe.name='fin-root-shoe-'+index+'-'+side;
  bar([side*(x-.075),baseY-.045,z-chord*.28],[side*(x+lean*.23),baseY+height*.36,z-chord*.13],.063,.054,skin).name='fin-front-gusset';
  bar([side*(x-.067),baseY-.045,z+chord*.29],[side*(x+lean*.32),baseY+height*.28,z+chord*.11],.055,.045,graphite).name='fin-rear-gusset';
  if(high)line([[side*x,baseY+.036,z-chord*.43],[side*(x+lean*.86),baseY+height*.90,z-chord*.10]],glow,.005);
  finMounts.push({side,model:index,baseY,shoeBottom:baseY-.083,shoeTop:baseY+.037,footX:x,footZ:z,kind:'structural'});
  return fin;
 };
 const aftFins=(offset=.28,z=.59)=>{
  for(const side of[-1,1]){
   mountedFin(side,offset+.045,z,.059,.18+finHeight*.57,c.fin===0?graphite:polished,.33,.105);
  }
 };
 const podBands=(x,y,zs,radius,mat=polished)=>{
  if(!high)return;
  const g=new THREE.TorusGeometry(radius,.008,4,14),inst=new THREE.InstancedMesh(g,mat,zs.length),dummy=new THREE.Object3D();
  for(let i=0;i<zs.length;i++){dummy.position.set(x,y,zs[i]);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix)}
  inst.instanceMatrix.needsUpdate=true;root.add(inst);
 };
 const thruster=(x,y,z,r=.14,theme=purple)=>{
  const o=add(new THREE.CylinderGeometry(r*1.13,r,.11,16),graphite,[x,y,z-.05]);o.rotation.x=PI/2;
  cap(x,y,z+.02,r*.80,theme);
  cap(x,y,z+.04,r*.47,exhaust);
 };
 // Everything above provides manufacturing vocabulary, not a shared airframe.
 switch(index){
 case 0: { // VECTOR: polished slim interceptor, independent long tapered torpedo nacelles
  spine(1.46,(premium||c.finish!==0)?hull:polished);canopy(-.67,.39,.18,.13);
  for(const side of[-1,1]){
   wingPoly([[.15,-.23],[.45,-.40],[.68,-.31],[.69,.46],[.37,.51],[.15,.27]],side,(premium||c.finish!==0)?hull:polished,.02);
   const x=side*.77,rad=.172*eng;
   hullMesh([[-1.30,.004,.004,0],[-1.05,rad*.44,rad*.46,0],[-.62,rad,rad*.85,0],[.16,rad*1.1,rad,.01],[.65,rad*.83,rad*.9,0],[.83,rad*.76,rad*.75,0]],tiledPod,x,.055,20);
   hullMesh([[-.93,.01,.01,.13],[-.60,rad*.35,.023,.13],[.26,rad*.32,.030,.14],[.68,.015,.02,.12]],carbon,x,0,16);
   bar([side*.29,.03,-.18],[side*.67,.03,-.18],.10,.07,polished);
   bar([side*.33,.03,.38],[side*.69,.03,.39],.12,.07,hull);
   line([[side*.30,.08,-.24],[side*.56,.08,-.24],[side*.67,.08,-.19]],glow,.012);
   line([[side*.37,.08,.42],[side*.65,.08,.42]],glow,.011);
   thruster(x,.055,.83,rad*.80);
   podBands(x,.055,[-.60,-.42,-.24,-.06,.12,.3,.5,.66],rad*.88);
   for(let k=0;k<3;k++)vane(side*(.39+k*.09),.125,.30,.05);
   finishDetail(side);
  }
  aftFins(.31,.46);break;
 }
 case 1:{ // RAZOR: open trident channels with three complete, sharply forward prongs
  const red=(premium||c.finish!==0)?hull:polished;
  hullMesh([[-1.61,.003,.003,0],[-1.26,.072,.05,.004],[-.82,.15,.085,.004],[-.26,.19,.12,0],[.45,.19,.12,0],[.86,.09,.06,0]],red,0,0,14);
  canopy(-.67,.38,.135,.105);
  for(const side of[-1,1]){
   wingPoly([[.20,-.18],[.60,-1.43],[.89,-1.51],[.92,-.32],[.89,.54],[.37,.63]],side,red,.035);
   layer([[.38,-.24],[.71,-1.17],[.82,-1.35],[.75,-.07],[.65,.33],[.42,.45]],graphite,.106,.020,side);
   hullMesh([[-1.49,.003,.003,.04],[-1.20,.032,.055,.045],[-.72,.085,.068,.055],[-.25,.085,.063,.05],[.51,.10,.06,.03]],red,side*.70,0,12);
   line([[side*.67,.117,-1.30],[side*.68,.12,-.88],[side*.73,.124,-.27],[side*.80,.12,.40]],glow,.009);
   for(let k=0;k<4;k++)vane(side*(.42+k*.07),.13,.20+k*.13,.07);
   mountedFin(side,.70,.54,.064,.21+finHeight*.68,red,.42,.14);
   finishDetail(side);thruster(side*.46,.025,.85,.075,exhaust);
  }
  // Exposed mechanics behind the black canopy
  for(let k=0;k<4;k++)bar([-.12,.16,.48+k*.10],[.12,.16,.48+k*.10],.035,.028,graphite);
  line([[0,.18,-1.46],[0,.25,-1.02],[0,.27,-.70]],glow,.009);
  break;
 }
 case 2:{ // PHANTOM: one continuous, broad, almost flat stealth-delta airframe
  const stealthShell=(premium||c.finish!==0)?hull:stealth;
  hullMesh([[-1.31,.008,.013,-.025],[-.95,.13,.05,-.005],[-.52,.21,.07,0],[.25,.27,.085,0],[.76,.23,.06,-.01]],(premium||c.finish!==0)?hull:graphite);
  const plan=[[.07,-1.03],[.37,-.74],[1.03,.17],[1.02,.58],[.70,.72],[.35,.57],[.05,.85]];
  for(const side of[-1,1]){
   wingPoly(plan,side,stealthShell,.015);
   layer([[.18,-.66],[.52,-.42],[.90,.22],[.74,.52],[.38,.24]],graphite,.080,.018,side);
   layer([[.26,-.55],[.58,-.21],[.82,.22],[.52,.06]],c.finish===0?stealth:hull,.10,.011,side);
   line([[side*.31,.11,-.46],[side*.70,.113,.04],[side*.99,.095,.50]],glow,.005);
   for(let k=0;k<3;k++)vane(side*(.48+k*.085),.117,.37+k*.12,.10);
   mountedFin(side,.70,.60,.055,.10+finHeight*.48,graphite,.31,.085);
   finishDetail(side);
  }
  canopy(-.72,.21,.16,.078);
  thruster(-.23,-.02,.79,.12,exhaust);thruster(.23,-.02,.79,.12,exhaust);
  break;
 }
 case 3:{ // MANTA: white biomorphic crescent, with genuine cut-outs/open air under each arm
  hullMesh([[-1.47,.004,.01,0],[-1.16,.07,.045,.01],[-.64,.19,.11,.03],[-.05,.24,.14,.04],[.42,.20,.12,.035],[.76,.095,.06,.02]],(premium||c.finish!==0)?hull:ceramic,0,0,20);
  canopy(-.73,.40,.215,.13);
  for(const side of[-1,1]){
   const w=add(crescentGeometry(),(premium||c.finish!==0)?hull:ceramic,[0,.025,0]);w.scale.x=side*wingScale;w.userData.structuralHull=true;
   // The wing's concavity is deliberately left empty, unlike a normal delta wing.
   const cavity=layer([[.39,-.14],[.60,-.30],[.72,.03],[.48,.34]],graphite,.069,.016,side);
   cavity.visible=high;
   const offset=side;
   line([[offset*.27,.092,-.30],[offset*.66,.10,-.73],[offset*.90,.07,-.83]],glow,.007);
   line([[offset*.60,.095,-.07],[offset*.73,.082,.25],[offset*.76,.07,.55]],glow,.006);
   const vent=add(new THREE.TorusGeometry(.078,.013,6,16),graphite,[offset*.39,-.016,.48]);vent.rotation.x=.36;
   cap(side*.39,-.03,.75,.10,exhaust);
   finishDetail(side);
  }
  line([[0,.12,-1.28],[0,.18,-1.06],[0,.19,-.78]],glow,.008);
  mountedFin(1,.09,.54,.108,.12+finHeight*.47,(premium||c.finish!==0)?hull:ceramic,.30,.045);
  break;
 }
 case 4:{ // GEMINI: three boxier industrial hulls and exposed heavy-duty crossbeams
  hullMesh([[-1.21,.009,.01,0],[-.94,.09,.07,0],[-.50,.17,.11,.025],[.25,.18,.12,.025],[.78,.135,.09,0]],hull);
  canopy(-.65,.24,.153,.12);
  for(const side of[-1,1]){
   const x=side*.79,rad=.215*eng;
   hullMesh([[-1.16,.018,.018,0],[-.98,rad*.7,rad*.64,0],[-.52,rad,rad*.90,0],[.40,rad,rad*.92,.01],[.77,rad*.94,rad*.85,.01],[.94,rad*.84,rad*.76,0]],tiledPod,x,.07,12);
   const upper=layer([[.61,-.76],[.95,-.76],[.97,.65],[.65,.65]],carbon,.25,.025,side);
   // Open truss lattice connects the three bodies, not shallow shared wings.
   for(const z of[-.44,.10,.56]){
    bar([side*.20,.035,z],[side*.59,.035,z],.085,.075,polished);
    bar([side*.28,.03,z-.13],[side*.55,.12,z+.10],.028,.022,carbon);
   }
   bar([side*.33,.13,-.18],[side*.72,.13,-.18],.06,.055,graphite);
   if(high)for(let k=0;k<6;k++){
    const z=-.53+k*.19;
    const tile=add(new THREE.BoxGeometry(.31,.009,.085),k%2?graphite:carbon,[x,.255,z]);
    tile.rotation.y=side*.025;
   }
   podBands(x,.07,[-.65,-.35,-.05,.25,.55,.77],rad*.96);
   for(let k=0;k<4;k++)vane(x,.25,-.55+k*.28,.12);
   thruster(x,.07,.96,rad*.84,purple);
   line([[x,.24,-.76],[x,.265,-.20],[x,.255,.63]],glow,.006);
   finishDetail(side);
  }
  aftFins(.18);break;
 }
 case 5:{ // SPECTRE: super-slim spear body between two truly vertical sword-like wings
  hullMesh([[-1.73,.003,.005,-.015],[-1.43,.045,.05,0],[-.78,.118,.09,.015],[-.14,.17,.14,.02],[.51,.165,.11,.018],[.93,.10,.06,0]],(premium||c.finish!==0)?hull:polished);
  canopy(-.79,.28,.145,.115);
  for(const side of[-1,1]){
   wingPoly([[.13,-.37],[.45,-.64],[.91,-.75],[.98,.84],[.45,.62],[.23,.73]],side,graphite,.005);
   const blade=add(bladeGeometry(side),(premium||c.finish!==0)?hull:polished,[0,0,0]);
   blade.scale.y=1+[0,.20,.12,.34,.26][c.fin];blade.scale.z=1+sweep*.52;
   blade.material.side=THREE.DoubleSide;
   const rootFront=bar([side*.37,.012,-.37],[side*.54,.29,.12],.11,.077,graphite);
   rootFront.name='spectre-forward-blade-root';
   const rootRear=bar([side*.74,.012,.71],[side*.78,.28,.46],.10,.07,polished);
   rootRear.name='spectre-rear-blade-root';
   const seat=add(new THREE.BoxGeometry(.20,.095,.35),graphite,[side*.47,.046,.03]);seat.name='spectre-blade-foot';
   finMounts.push({side,model:index,baseY:.045,shoeBottom:-.02,shoeTop:.115,footX:.45,footZ:.05,kind:'sword-blade'});
   line([[side*.32,.10,-.47],[side*.79,.67,.26],[side*.95,.1,.83]],glow,.013);
   layer([[.30,-.25],[.81,-.60],[.77,.15],[.41,.21]],carbon,.073,.023,side);
   for(let k=0;k<4;k++)vane(side*(.32+k*.09),.17,.32+k*.09,.063);
   thruster(side*.28,.02,.88,.12,exhaust);
   finishDetail(side);
  }
  line([[0,.10,-1.69],[0,.13,-1.32],[0,.16,-.95]],glow,.008);
  break;
 }
 }
 // Every engine variant is a visible, real 3D assembly on every chassis.
 // The housings are deliberately specific to the exhaust location of each ship.
 if(c.engine!==0){
  const xs=[.77,.46,.23,.39,.79,.28],ys=[.055,.025,-.02,-.03,.07,.02],zs=[.83,.85,.79,.75,.96,.88];
  for(const side of[-1,1]){
   const x=side*xs[index],y=ys[index],z=zs[index],r=index===4?.15:index===0?.12:.086;
   if(c.engine===1){const shroud=add(new THREE.CylinderGeometry(r*1.18,r*.96,.26,12,1,true),polished,[x,y,z-.13]);shroud.rotation.x=PI/2;}
   if(c.engine===2){for(let k=0;k<3;k++){const ring=add(new THREE.TorusGeometry(r*(.9+k*.09),.012,6,16),glow,[x,y,z-.06+k*.07]);ring.castShadow=false;}}
   if(c.engine===3){const pivot=add(new THREE.CylinderGeometry(r*.75,r*1.26,.19,10),graphite,[x,y,z+.02]);pivot.rotation.x=PI/2;
    for(const sign of[-1,1]){const flap=add(new THREE.BoxGeometry(.028,.11,.21),polished,[x+sign*r*.75,y,z]);flap.rotation.z=sign*.22;}}
   if(c.engine===4){for(const sign of[-1,1]){const shield=add(new THREE.BoxGeometry(.045,r*1.6,.29),polished,[x+sign*r*.95,y,z-.11]);shield.rotation.z=sign*.16;}}
  }
 }
 if(index===4 && c.wing!==0){
  for(const side of[-1,1]){
   wingPoly([[.22,-.34+sweep],[.58,-.53+sweep],[.72,.30],[.44,.65]],side,polished,.015);
  }
 }
 // Large, ship-specific optional kits: real geometry for every visual category.
 const installedKits=addFleetUpgrades(index,c,{add,layer,line,bar,mountedFin,hullMesh,owned,
  materials:{hull,carbon,trim,polished,graphite,ceramic,glass,glow,premium}});
 ship.userData.fleetUpgradeSignature=installedKits.signature;
 // Accent paint remains visible even when livery = CLEAN, and is saved per ship.
 for(const side of[-1,1]){
  line([[side*.21,.14,-.42],[side*.29,.15,.14],[side*.35,.13,.45]],paint,.008);
 }
 // Equal-width garage/race geometry independent of wing option or chosen airframe.
 root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(root);
 const w=box.max.x-box.min.x;
 const scale=SPAN/Math.max(.01,w);
 root.scale.x*=scale;root.updateMatrixWorld(true);
 const finalBox=new THREE.Box3().setFromObject(root);
 const actualSpan=finalBox.max.x-finalBox.min.x;
 installShipExhaust(ship,root,index,c,high);
 root.userData.designId=NAMES[index];
 root.userData.wingspan=SPAN;
 root.userData.wingspanBeforeScale=w;
 root.userData.customised={wing:c.wing,engine:c.engine,fin:c.fin,livery:c.livery};
 ship.userData.sculptMaterials=owned;
 ship.userData.designId=NAMES[index];
 ship.userData.modelWidth=SPAN;
 ship.userData.designOptions={wing:c.wing,engine:c.engine,fin:c.fin,livery:c.livery};
 // An optional diagnostic for browser tests: no gameplay state is exposed.
 if(typeof window!=='undefined'&&location.search.includes('shipqa=1')){
  let textured=0,finShoes=0;
  root.traverse(o=>{if(o.isMesh&&o.material?.map)textured++;if(o.name?.includes('fin-root-shoe')||o.name==='spectre-blade-foot')finShoes++;});
  const members=root.children.filter(o=>o.userData.structuralHull);
  const contacts=finMounts.map(({side,kind},i)=>{
    const shoe=kind==='sword-blade'?root.children.find(o=>o.name==='spectre-blade-foot'&&Math.sign(o.position.x)===side):root.getObjectByName('fin-root-shoe-'+index+'-'+side);
    const fin=kind==='sword-blade'?root.children.find(o=>o.name==='spectre-forward-blade-root'&&Math.sign(o.position.x)===side):root.getObjectByName('connected-fin-'+index+'-'+side);
    if(!shoe||!fin)return{side,shoeFin:false,shoeHull:false};
    const shoeBox=new THREE.Box3().setFromObject(shoe);
    return{side,shoeFin:shoeBox.intersectsBox(new THREE.Box3().setFromObject(fin)),shoeHull:members.some(o=>shoeBox.intersectsBox(new THREE.Box3().setFromObject(o)))};
  });
  window.__shiftlineModelQA={id:NAMES[index],span:SPAN,measuredSpan:actualSpan,unscaled:w,parts:root.children.length,options:ship.userData.designOptions,finMounts,finShoes,contacts,texturedMeshes:textured,upgradeCounts:installedKits.counts,upgradeSignature:installedKits.signature,exhaustEmitters:ship.userData.exhaustFX?.actors?.length||0};
 }
 return root;
}
export const SHIP_TARGET_WINGSPAN=SPAN;
export const SHIP_DESIGNS=NAMES;
export {builder as sculptFleetCraft};
