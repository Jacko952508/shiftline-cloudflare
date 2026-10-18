import * as THREE from 'three';
import {fleetSurfaceMaps} from './fleet-materials-v118.js?v=150';
import {bevelBox} from './art-direction-v148.js?v=153';
const BODY=[0xb4c3cf,0xa9233e,0x253b50,0xe4eef0,0x7e929f,0xa5b9ce];
export function refineFleetAppearance(ship,root,index,custom,m,high){
 const {hull,polished,graphite,ceramic,glass,premium}=m;
 if(!premium){
  const family=custom.finish===2||index===2?'stealth':index===3?'ceramic':'brushed';
  Object.assign(hull,fleetSurfaceMaps(family));hull.normalMap=null;hull.aoMap=null;hull.bumpScale=.0016;
  if(custom.finish===0){hull.color.setHex(BODY[index]);if(index===1)hull.color.copy(m.trim.color).lerp(new THREE.Color(0x371b28),.18);}
  hull.metalness=custom.finish===1?.20:index===3?.32:index===2?.52:.72;
  hull.roughness=custom.finish===2?.58:index===2?.47:index===3?.26:.29;
  hull.clearcoat=custom.finish===2?.10:index===3?.92:.70;hull.clearcoatRoughness=.15;
 }
 polished.bumpScale=.0014;graphite.bumpScale=.0020;ceramic.bumpScale=.0008;
 polished.roughness=.27;polished.clearcoatRoughness=.16;
 graphite.color.setHex(index===4?0x172d37:0x152534);graphite.metalness=.48;graphite.roughness=.60;
 const materials=new Set(),oldGeometry=new Set();let bevels=0;
 root.traverse(o=>{
  const mat=o.material;
  if(mat&&!materials.has(mat)){
   materials.add(mat);
   if(mat.bumpMap)mat.bumpScale=Math.min(mat.bumpScale,.003);
   if(mat.normalMap&&mat!==hull)mat.normalScale?.set(.22,.22);
   if(mat.isMeshPhysicalMaterial)mat.envMapIntensity=Math.min(mat.envMapIntensity,premium?2.5:1.08);
  }
  // Inset rounded hardware replaces sharp box edges within identical bounds.
  const g=o.geometry,p=g?.parameters;
  if(high&&g?.type==='BoxGeometry'&&p&&Math.min(p.width,p.height,p.depth)>.014&&!o.userData.structuralHull){
   o.geometry=bevelBox(p.width,p.height,p.depth,Math.min(.012,p.height*.20));oldGeometry.add(g);bevels++;
  }
 });
 for(const g of oldGeometry)g.dispose();
 // Distinct smoky windscreen; never alter the cockpit HUD or glass opacity.
 glass.clearcoat=1;glass.clearcoatRoughness=.055;glass.roughness=.085;glass.specularColor?.setHex(0xb4d6e8);
 ship.userData.appearance150={version:150,model:index,bevels,materials:materials.size,high:!!high};
 if(high&&typeof window!=='undefined'&&typeof location!=='undefined'&&location.search.includes('shipqa=1'))window.__shiftlineAppearanceQA={...ship.userData.appearance150};
}
