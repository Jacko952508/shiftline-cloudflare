import * as THREE from 'three';
import {fleetEdition,editionIndex} from './fleet-designs-v162.js?v=162';
import {batchStaticAirframe} from './fleet-batching-v152.js?v=152';
import {installShipExhaust} from './ship-exhaust-v119.js?v=162';

// Closed, capped surfaces. Every aerodynamic panel has thickness; all roots
// deliberately penetrate the structure they attach to, including the underside.
export function sealedLoft(stations,sides=32){
 const p=[],uv=[],ix=[],tau=Math.PI*2;
 for(let i=0;i<stations.length;i++){
  const [z,rx,ry,cy=0]=stations[i];
  for(let k=0;k<=sides;k++){const a=k/sides*tau;p.push(Math.cos(a)*rx,cy+Math.sin(a)*ry,z);uv.push(k/sides,i/(stations.length-1));}
 }
 for(let i=0;i<stations.length-1;i++)for(let k=0;k<sides;k++){const a=i*(sides+1)+k,b=a+sides+1;ix.push(a,a+1,b,a+1,b+1,b);}
 for(const end of[0,stations.length-1]){
  const [z,rx,ry,cy=0]=stations[end],center=p.length/3;p.push(0,cy,z);uv.push(.5,.5);
  for(let k=0;k<=sides;k++){const a=k/sides*tau;p.push(Math.cos(a)*rx,cy+Math.sin(a)*ry,z);uv.push(.5+Math.cos(a)*.5,.5+Math.sin(a)*.5);}
  for(let k=0;k<sides;k++){const a=center+1+k,b=a+1;ix.push(center,...(end===0?[b,a]:[a,b]));}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.userData.sealed=true;return g;
}
function aerofoil(points,depth=.075,rounded=false){
 const shape=new THREE.Shape();
 if(rounded){
  const count=points.length,mid=(a,b)=>[(a[0]+b[0])/2,-(a[1]+b[1])/2];
  shape.moveTo(...mid(points.at(-1),points[0]));
  for(let i=0;i<count;i++)shape.quadraticCurveTo(points[i][0],-points[i][1],...mid(points[i],points[(i+1)%count]));
 }else points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));
 shape.closePath();
 const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.018,bevelThickness:.014,bevelSegments:3,steps:1,curveSegments:8});g.rotateX(-Math.PI/2);g.userData.sealed=true;return g;
}
function finish(color,metalness,roughness,coat=.6){
 const m=new THREE.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:coat,clearcoatRoughness:.19,envMapIntensity:1.05});
 // Object-space micrograin needs no UV atlas, eliminating texture seams across
 // end caps and bevels. Broad highlights remain clean even at phone resolution.
 m.onBeforeCompile=s=>{
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 finishPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nfinishPosition=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 finishPosition;').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nfloat grain=fract(sin(dot(floor(finishPosition*540.0),vec3(12.9898,78.233,37.719)))*43758.5453);roughnessFactor=clamp(roughnessFactor+(grain-.5)*.024,.15,1.);');
 };
 m.customProgramCacheKey=()=> 'fleet-micrograin-v162';return m;
}
const NAMES=['VECTOR','RAZOR','PHANTOM','MANTA','GEMINI','SPECTRE'];
const PLANS=[
 [[.08,-.49],[.30,-.66],[.52,-.42],[1.04,.52],[.88,.74],[.40,.46],[.10,.65]],
 [[.08,-.24],[.40,-.51],[.79,-1.29],[.94,-1.15],[.85,.41],[1.03,.68],[.37,.65]],
 [[.06,-1.15],[.26,-.99],[1.04,.43],[1.00,.73],[.71,.65],[.51,.84],[.24,.62],[.06,.78]],
 [[.05,-.44],[.35,-.65],[.77,-1.10],[1.14,-.92],[1.02,-.42],[.72,.15],[.47,.77],[.16,.76]],
 [[.08,-.37],[.70,-.45],[.86,-.23],[.72,-.08],[.12,-.10],[.12,.32],[.80,.29],[.86,.52],[.69,.67],[.08,.55]],
 [[.08,-.47],[.38,-.66],[.92,-.83],[1.04,.66],[.86,.78],[.38,.46],[.08,.69]]
];
export function buildFleetSculpture(ship,index,custom={},high=true,options={}){
 const e=editionIndex(custom),design=fleetEdition(index,custom),root=new THREE.Group();root.name='FLIGHTWORKS / '+NAMES[index]+' / '+design.name;ship.add(root);
 const body=finish(design.body,.48,.29),dark=finish(design.secondary,.5,.42,.24),titanium=finish(design.metal,.86,.25,.32),glass=finish(design.glass,.42,.13,.95);
 glass.iridescence=.16;glass.iridescenceThicknessRange=[180,320];
 const light=new THREE.MeshBasicMaterial({color:new THREE.Color(design.accent).multiplyScalar(1.45),toneMapped:false});
 const nozzleMat=finish(0x101b26,.72,.45,.1),materials=[body,dark,titanium,glass,light,nozzleMat];
 ship.userData.sculptMaterials=materials;
 const structural=[];
 const add=(geometry,material,position=[0,0,0],name='surface',structure=false)=>{
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(...position);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
  if(structure){mesh.userData.structural=true;structural.push(mesh);}return mesh;
 };
 const hull=(st,mat=body,x=0,y=0,name='sealed fuselage')=>add(sealedLoft(st,high?32:20),mat,[x,y,0],name,true);
 const crossbeam=(a,b,width=.12,height=.10,mat=body)=>{
  const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),mesh=add(new THREE.BoxGeometry(width,height,d.length()+.065),mat,[0,0,0],'integral structural bridge',true);
  mesh.position.copy(A.add(B).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),d.normalize());return mesh;
 };
 const stroke=(points,mat=light,r=.007)=>add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),points.length*6,r,6,false),mat,[0,0,0],'inlaid running light');
 const width=index===4?.205:index===2?.27:index===3?.235:.23;
 const front=[-1.49,-1.67,-1.22,-1.38,-.98,-1.70][index],rear=index===4?.70:.86;
 const stations=[[front,.012,.018,-.014],[front+.28,width*.32,.055,0],[-.60,width*.76,.105,.015],[-.24,width,.16,.023],[.22,width*.96,.145,.018],[.57,width*.72,.11,0],[rear,width*.42,.075,-.012]];
 // The two main nacelles lead GEMINI's cockpit, giving a recognisable catamaran.
 hull(stations);hull(stations.map(([z,rx,ry,cy])=>[z,rx*.91,ry*.58,cy-.055]),dark,0,0,'continuous lower keel');
 const shell=(points,side,mat=body,top=.012,thickness=.085)=>add(aerofoil(points.map(([x,z])=>[side*x,z]),thickness,index===3),mat,[0,top,0],'integrated wing',true);
 for(const side of[-1,1]){
  const points=PLANS[index].map(([x,z],k)=>{
   // Editions have their own complete wing sweep and trailing edge, not loose kits.
   const delta=e===1?(.18*(x-.1)):(e===2?-.16*(x-.1):0);
   return[x,z+delta+(e===2&&k===pointsLength(index)-2?.10:0)];
  });
  shell(points,side);
  // Fitted contrasting upper skins are inset from the silhouette and seated in
  // the wing thickness; these never float above a cut-out or bridge empty space.
  if(index!==4){
   const inset=points.map(([x,z])=>[.12+(x-.12)*.77,z*.83]);
   shell(inset,side,dark,.078,.022);
  }
  if(index===4){
   for(const z of[-.32,.34,.56])crossbeam([side*.10,.025,z],[side*.78,.025,z],.15,.12,z===.34?titanium:body);
  }
 }
 const podX=[.64,.48,.31,.30,.76,.255][index],podY=index===4?.02:-.025,podRear=[.94,.88,.77,.78,1.02,.90][index];
 const podFront=index===4?-1.43:index===0?-.47:-.32;
 const radius=index===4?.205:index===0?.165:.135;
 const exhaustAnchors=[];
 for(const side of[-1,1]){
  const px=podX*side;
  hull([[podFront,.022,.025,0],[podFront+.21,radius*.72,radius*.72,0],[-.10,radius,radius*.88,0],[podRear-.24,radius,radius*.86,0],[podRear-.04,radius*.82,radius*.78,0],[podRear,radius*.77,radius*.75,0]],index===4?body:dark,px,podY,'sealed turbine nacelle');
  // A closed nozzle fits inside its nacelle, with metal lip and luminous throat.
  const noz=add(new THREE.CylinderGeometry(radius*.66,radius*.75,.13,24),nozzleMat,[px,podY,podRear-.015],'seated engine nozzle',true);noz.rotation.x=Math.PI/2;
  add(new THREE.TorusGeometry(radius*.68,.014,8,32),titanium,[px,podY,podRear+.05],'machined nozzle lip');
  const throat=add(new THREE.CircleGeometry(radius*.56,24),light,[px,podY,podRear+.056],'engine throat');throat.material.side=THREE.DoubleSide;
  exhaustAnchors.push([px,podY,podRear+.06]);
  if(index===4){
   // One broad top saddle continues around the nacelle and joins the bridges.
   hull([[-1.12,.02,.01,.13],[-.87,.14,.025,.14],[.40,.15,.026,.14],[.75,.055,.015,.12]],dark,px,podY,'recessed nacelle saddle');
   stroke([[px,podY+.175,-.94],[px,podY+.20,-.62],[px,podY+.20,.35],[px,podY+.17,.75]],light,.008);
  }
 }
 // Solid moulded canopy surrounds: the larger socket overlaps the fuselage,
 // and the glass overlaps the socket, including front and rear end caps.
 const canopyFront=index===4?-.56:-.72,canopyBack=index===2?.20:.36,cw=index===3?.172:index===4?.135:.146;
 const canopyShape=[[canopyFront,.015,.012,.15],[canopyFront+.20,cw*.78,.105,.17],[-.18,cw,.135,.17],[canopyBack-.12,cw*.72,.095,.16],[canopyBack,.015,.012,.13]];
 hull(canopyShape.map(([z,x,y,c])=>[z,x+.026,y+.012,c-.026]),titanium,0,0,'continuous canopy gasket');
 const canopy=hull(canopyShape,glass,0,0,'sealed wraparound canopy');canopy.userData.partRole='canopy';
 const spine=stroke([[0,.171,canopyFront+.04],[0,.278,canopyFront+.25],[0,.309,-.18],[0,.239,canopyBack-.10]],titanium,.008);spine.name='fitted canopy spine';
 // Light rails follow the central hull's shoulder station coordinates.
 for(const side of[-1,1]){
  stroke([[side*.07,.055,front+.32],[side*(width*.69),.105,-.56],[side*(width*.95),.10,-.22],[side*(width*.90),.10,.22],[side*(width*.58),.065,.62]],light,.007);
  for(let k=0;k<4;k++){
   const z=.34+k*.065,mesh=add(new THREE.BoxGeometry(.092,.015,.025),nozzleMat,[side*.17,.126-k*.010,z],'inset cooling vent');mesh.rotation.y=side*.12;
  }
 }
 const fin=(side,x,z,height,lean=.14)=>{
  const shape=new THREE.Shape();shape.moveTo(z-.23,.068);shape.lineTo(z+.25,.068);shape.lineTo(z+.12,height);shape.lineTo(z-.04,height+.035);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSize:.012,bevelThickness:.009,bevelSegments:2,steps:1});
  const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const Z=p.getX(i),Y=p.getY(i),X=p.getZ(i);p.setXYZ(i,side*(x+X-.0225+(Y-.068)*lean),Y,Z);}
  // The coordinate transform changes handedness on one side.
  if(side===1){const attrs=Object.values(geo.attributes);for(let i=0;i<p.count;i+=3)for(const a of attrs)for(let k=0;k<a.itemSize;k++){const b=(i+1)*a.itemSize+k,c=(i+2)*a.itemSize+k,t=a.array[b];a.array[b]=a.array[c];a.array[c]=t;}}
  geo.computeVertexNormals();geo.userData.sealed=true;add(geo,index===5?body:titanium,[0,0,0],'welded stabiliser',true);
  add(new THREE.BoxGeometry(.13,.07,.43),body,[side*x,.076,z],'integral fin foot',true);
 };
 if(index===0||index===1||index===2)for(const side of[-1,1])fin(side,index===2?.56:.42,.48,index===2?.22:e===1?.39:.31,e===2?-.22:.15);
 if(index===3&&e===1)fin(1,0,.46,.27,0);
 if(index===5)for(const side of[-1,1])fin(side,.46,.25,e===1?.60:e===2?.48:.54,e===2?-.23:.35);
 if(index===4&&e!==2)for(const side of[-1,1])fin(side,.76,.50,e===1?.35:.25,.05);
 root.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(root),scale=2.08/(bounds.max.x-bounds.min.x);root.scale.x=scale;root.updateMatrixWorld(true);
 const parts=structural.map(mesh=>({name:mesh.name,box:new THREE.Box3().setFromObject(mesh)}));
 ship.userData.fleet162={version:162,index,edition:e,name:design.name,parts:parts.length,span:2.08,structure:parts.map(p=>({name:p.name,min:p.box.min.toArray(),max:p.box.max.toArray()}))};
 root.userData.exhaustAnchors=exhaustAnchors;root.userData.exhaustColor=design.accent;
 if(options.batchStatic!==false)ship.userData.airframeBatch=batchStaticAirframe(root);
 installShipExhaust(ship,root,index,{...custom,engine:0,trail:e},high);
 ship.userData.designId=NAMES[index];ship.userData.modelWidth=2.08;ship.userData.appearance={model:index,custom:{...custom,edition:e}};
 if(typeof window!=='undefined'&&typeof location!=='undefined'&&location.search.includes('shipqa=1'))window.__shiftlineFleetQA=ship.userData.fleet162;
 return root;
}
function pointsLength(index){return PLANS[index].length;}
