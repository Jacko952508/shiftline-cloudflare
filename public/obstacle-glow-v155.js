import * as THREE from 'three';
// Keep illumination in the solid hazard draw: no lights, overlay meshes,
// bloom dependency or changes to geometry/colliders. Analytic bands remain
// readable on the native iPhone framebuffer and are filtered at a distance.
export function markHazardGeometry(geometry,shape){
 const type=shape.type==='box'?1:(shape.type==='torus'||shape.type==='arc')?2:shape.type==='sphere'?3:0;
 const parameters=type===1?[shape.hx,shape.hy,shape.hz,1]:type===2?[shape.R,shape.tube,0,2]:type===3?[shape.r,0,0,3]:[0,0,0,0];
 const data=new Float32Array(geometry.attributes.position.count*4);
 for(let i=0;i<data.length;i+=4)data.set(parameters,i);
 geometry.setAttribute('hazardShape',new THREE.BufferAttribute(data,4));
 if(!geometry.attributes.hazardLight)geometry.setAttribute('hazardLight',new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count),1));
 const drive=shape.drive,flow=new Float32Array(geometry.attributes.position.count*3),axis=[drive?.x||0,drive?.y||0,drive?.turn||drive?.rock||0];
 for(let i=0;i<flow.length;i+=3)flow.set(axis,i);geometry.setAttribute('hazardFlow',new THREE.BufferAttribute(flow,3));return geometry;
}
export function illuminateHazard(material){
 if(material.userData.hazardGlow155)return material;
 material.userData.hazardGlow155=true;
 const strength=material.userData.hazardGlowStrength={value:1};
 const clock=material.userData.hazardTime={value:0};
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  shader.uniforms.hazardGlowStrength=strength;
  shader.uniforms.hazardTime=clock;
  shader.vertexShader='attribute vec4 hazardShape;attribute float hazardLight;attribute vec3 hazardFlow;varying float hazardEnergy;varying vec3 hazardDrive;varying vec4 hazardProfile;varying vec3 hazardPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nhazardProfile=hazardShape;hazardPosition=position;hazardEnergy=hazardLight;hazardDrive=hazardFlow;');
  shader.fragmentShader='uniform float hazardGlowStrength;uniform float hazardTime;varying float hazardEnergy;varying vec3 hazardDrive;varying vec4 hazardProfile;varying vec3 hazardPosition;\n'+shader.fragmentShader;
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
   // An independent luminous face stays readable without bloom, lights or
   // an emissive texture. Recesses remain dark; complete baked contours
   // identify the actual silhouette of polygon machinery as well as rings.
   vec3 hazardFaceColor=vec3(1.);
   #ifdef USE_COLOR
    hazardFaceColor=pow(max(vColor.rgb,vec3(.01)),vec3(.85));
   #endif
   hazardTint=mix(hazardTint,vec3(1.),.12);
   vec2 hazardAxis=length(hazardDrive.xy)>.01?normalize(hazardDrive.xy):vec2(.55,.84);
   float hazardTravel=dot(hazardPosition.xy,hazardAxis);
   if(abs(hazardDrive.z)>.01)hazardTravel=atan(hazardPosition.y,hazardPosition.x)*2.*sign(hazardDrive.z);
   float hazardWave=.5+.5*sin(hazardTravel*3.2-hazardTime*2.4);
   float hazardScan=smoothstep(.87,.98,hazardWave);
   vec3 hazardFace=hazardFaceColor*(.72+hazardScan*.16);
   float hazardTrace=max(hazardBand,hazardEnergy);
   vec3 hazardCore=mix(hazardTint,vec3(1.),.30)*hazardTrace*(2.65+hazardWave*.55);
   totalEmissiveRadiance+=(hazardTint*(hazardFace+hazardRim*.48)+hazardCore)*hazardGlowStrength;
  `);
 };
 material.customProgramCacheKey=()=>key+'/hazard-light-157';material.needsUpdate=true;return material;
}
