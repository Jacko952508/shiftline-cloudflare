import * as THREE from 'three';
import {fleetFinish} from './fleet-designs-v162.js?v=163';

const COATINGS={
 metallic:{metalness:.78,roughness:.24,clearcoat:1,clearcoatRoughness:.10,envMapIntensity:1.12,iridescence:0,grain:.045},
 chrome:{metalness:1,roughness:.12,clearcoat:.8,clearcoatRoughness:.07,envMapIntensity:1.18,iridescence:0,grain:.006},
 pearl:{metalness:.32,roughness:.23,clearcoat:1,clearcoatRoughness:.09,envMapIntensity:1.08,iridescence:.68,iridescenceIOR:1.33,iridescenceThicknessRange:[220,390],grain:.018}
};

// Filtered object-space flake: no bitmap seams, downloads, or sparkling subpixels.
export function surfaceFinish(color,metalness,roughness,coat=.6){
 const m=new THREE.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:coat,clearcoatRoughness:.12,envMapIntensity:1.05});
 m.userData.flake=.014;
 m.onBeforeCompile=s=>{
  s.uniforms.fleetFlake={value:m.userData.flake};
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 finishPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nfinishPosition=position;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 finishPosition;uniform float fleetFlake;').replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   vec3 flakeCell=finishPosition*310.;
   float flakeFilter=1.-smoothstep(.45,1.8,length(fwidth(flakeCell)));
   float flake=fract(sin(dot(floor(flakeCell),vec3(12.9898,78.233,37.719)))*43758.5453);
   roughnessFactor=clamp(roughnessFactor+(flake-.5)*fleetFlake*flakeFilter,.055,1.);`);
 };
 m.customProgramCacheKey=()=> 'fleet-filtered-flake-v163';return m;
}
export function fleetPaint(color,model,custom){
 const kind=fleetFinish(model,custom),profile=COATINGS[kind],{grain,...physical}=profile;
 const m=surfaceFinish(color,profile.metalness,profile.roughness,profile.clearcoat);Object.assign(m,physical);m.userData.flake=grain;m.userData.fleetFinish=kind;
 return m;
}

// Small linear-HDR light stage, prefiltered once by Three.js. Long softboxes
// provide readable bright/dark reflections on chrome and coloured clearcoat.
export function fleetEnvironment(){
 const w=512,h=256,data=new Uint16Array(w*h*4),direction=new THREE.Vector3();
 const boxes=[
  {n:[0,1,0],r:[1,0,0],size:[.32,1.8],c:[3.8,4.2,4.6]},
  {n:[-1,.28,.20],r:[0,0,1],size:[.17,1.7],c:[4.5,5.2,6]},
  {n:[1,.15,-.35],r:[0,0,1],size:[.23,1.9],c:[4.7,3.9,3.1]},
  {n:[0,.3,-1],r:[1,0,0],size:[1.3,.14],c:[2.7,3.5,4.2]}
 ].map(b=>{const n=new THREE.Vector3(...b.n).normalize(),r=new THREE.Vector3(...b.r).normalize(),u=new THREE.Vector3().crossVectors(n,r).normalize();r.crossVectors(u,n);return{...b,n,r,u};});
 const edge=(x,limit)=>1-THREE.MathUtils.smoothstep(Math.abs(x),limit*.88,limit*1.06);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const theta=(y+.5)/h*Math.PI,phi=(x+.5)/w*Math.PI*2;direction.set(Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi));
  const sky=Math.max(0,direction.y),i=(y*w+x)*4,rgb=[.075+sky*.20,.09+sky*.23,.12+sky*.28];
  for(const b of boxes){const front=direction.dot(b.n);if(front<=.03)continue;const strength=edge(direction.dot(b.r)/front,b.size[0])*edge(direction.dot(b.u)/front,b.size[1]);for(let c=0;c<3;c++)rgb[c]+=b.c[c]*strength;}
  for(let c=0;c<3;c++)data[i+c]=THREE.DataUtils.toHalfFloat(rgb[c]);data[i+3]=THREE.DataUtils.toHalfFloat(1);
 }
 const texture=new THREE.DataTexture(data,w,h,THREE.RGBAFormat,THREE.HalfFloatType);texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.LinearSRGBColorSpace;texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}
