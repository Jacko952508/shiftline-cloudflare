import * as THREE from 'three';
// Keep illumination in the solid hazard draw: no lights, overlay meshes,
// bloom dependency or changes to geometry/colliders. Analytic bands remain
// readable on the native iPhone framebuffer and are filtered at a distance.
export function markHazardGeometry(geometry,shape){
 const type=shape.type==='box'?1:shape.type==='torus'?2:shape.type==='sphere'?3:0;
 const parameters=type===1?[shape.hx,shape.hy,shape.hz,1]:type===2?[shape.R,shape.tube,0,2]:type===3?[shape.r,0,0,3]:[0,0,0,0];
 const data=new Float32Array(geometry.attributes.position.count*4);
 for(let i=0;i<data.length;i+=4)data.set(parameters,i);
 geometry.setAttribute('hazardShape',new THREE.BufferAttribute(data,4));return geometry;
}
export function illuminateHazard(material){
 if(material.userData.hazardGlow155)return material;
 material.userData.hazardGlow155=true;
 const strength=material.userData.hazardGlowStrength={value:1};
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  shader.uniforms.hazardGlowStrength=strength;
  shader.vertexShader='attribute vec4 hazardShape;varying vec4 hazardProfile;varying vec3 hazardPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nhazardProfile=hazardShape;hazardPosition=position;');
  shader.fragmentShader='uniform float hazardGlowStrength;varying vec4 hazardProfile;varying vec3 hazardPosition;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   float hazardGap=100.,hazardWidth=.10;
   if(hazardProfile.w>.5&&hazardProfile.w<1.5){
    vec3 hazardHalf=max(hazardProfile.xyz,vec3(.001));
    vec3 hazardQ=abs(hazardPosition)/hazardHalf;
    vec3 hazardD=hazardHalf-abs(hazardPosition);
    hazardGap=hazardQ.z>=max(hazardQ.x,hazardQ.y)?min(hazardD.x,hazardD.y):hazardQ.x>=hazardQ.y?min(hazardD.y,hazardD.z):min(hazardD.x,hazardD.z);
    hazardWidth=clamp(min(hazardHalf.x,hazardHalf.y)*.22,.075,.17);
   }else if(hazardProfile.w>1.5&&hazardProfile.w<2.5){
    hazardGap=abs(abs(length(hazardPosition.xy)-hazardProfile.x)-hazardProfile.y);
    hazardWidth=clamp(hazardProfile.y*.32,.04,.16);
   }
   float hazardAA=max(fwidth(hazardGap),.002);
   float hazardBand=1.-smoothstep(hazardWidth-hazardAA,hazardWidth+hazardAA,hazardGap);
   float hazardRim=pow(1.-clamp(abs(dot(normalize(normal),normalize(vViewPosition))),0.,1.),2.4);
   vec3 hazardTint=emissive/max(max(emissive.r,max(emissive.g,emissive.b)),.001);
   // Constant low fill exposes the solid face; bright bands mark its actual
   // boundary, leaving holes and the clear racing line unpainted.
   totalEmissiveRadiance+=hazardTint*(.15+hazardBand*1.85+hazardRim*.80)*hazardGlowStrength;
  `);
 };
 material.customProgramCacheKey=()=>key+'/hazard-glow-155';material.needsUpdate=true;return material;
}
