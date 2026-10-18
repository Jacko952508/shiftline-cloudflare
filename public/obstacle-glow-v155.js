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
 geometry.setAttribute('hazardStyle',new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(shape.signalStyle||0),1));
 const drive=shape.drive,flow=new Float32Array(geometry.attributes.position.count*4),axis=[drive?.x||0,drive?.y||0,drive?.turn||0,drive?.rock||0];
 for(let i=0;i<flow.length;i+=4)flow.set(axis,i);geometry.setAttribute('hazardFlow',new THREE.BufferAttribute(flow,4));
 geometry.setAttribute('hazardPhase',new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(drive?.phase||0),1));return geometry;
}
export function illuminateHazard(material,{period=6.8,driveScale=1.8}={}){
 if(material.userData.hazardGlow155)return material;
 material.userData.hazardGlow155=true;
 const strength=material.userData.hazardGlowStrength={value:1};
 const clock=material.userData.hazardTime={value:0};
 const alert=material.userData.hazardAlert={value:0};
 const timing=material.userData.hazardTiming={period:{value:period},scale:{value:driveScale}};
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  shader.uniforms.hazardGlowStrength=strength;
  shader.uniforms.hazardTime=clock;shader.uniforms.hazardAlert=alert;
  shader.uniforms.hazardPeriod=timing.period;shader.uniforms.hazardDriveScale=timing.scale;
  shader.vertexShader='attribute float hazardStyle;varying float hazardMechanism;attribute vec4 hazardShape;attribute float hazardLight;attribute vec4 hazardFlow;attribute float hazardPhase;varying float hazardEnergy;varying float hazardMotionPhase;varying vec4 hazardDrive;varying vec4 hazardProfile;varying vec3 hazardPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nhazardMechanism=hazardStyle;hazardProfile=hazardShape;hazardPosition=position;hazardEnergy=hazardLight;hazardDrive=hazardFlow;hazardMotionPhase=hazardPhase;');
  shader.fragmentShader='varying float hazardMechanism;uniform float hazardGlowStrength;uniform float hazardTime;uniform float hazardAlert;uniform float hazardPeriod;uniform float hazardDriveScale;varying float hazardEnergy;varying float hazardMotionPhase;varying vec4 hazardDrive;varying vec4 hazardProfile;varying vec3 hazardPosition;\n'+shader.fragmentShader;
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
   // The strip advances, pauses and reverses with this piece's actual drive.
   float hazardRaw=.5-.5*cos(hazardTime*6.28318530718/hazardPeriod+hazardMotionPhase);
   float hazardCycle=hazardRaw*hazardRaw*(3.-2.*hazardRaw);
   float hazardOffset=length(hazardDrive.xy)*hazardCycle;
   float hazardAngular=hazardDrive.z*hazardTime*hazardDriveScale+hazardDrive.w*(2.*hazardCycle-1.);
   float hazardWave=.5;
   if(abs(hazardDrive.z)+abs(hazardDrive.w)>.001){hazardTravel=atan(hazardPosition.y,hazardPosition.x)*2.;hazardOffset=hazardAngular*2.;}
   if(length(hazardDrive)>.001)hazardWave=.5+.5*sin((hazardTravel-hazardOffset)*3.2);
   float hazardScan=smoothstep(.87,.98,hazardWave);
   vec3 hazardFace=hazardFaceColor*(.72+hazardScan*.16);
   float hazardTrace=max(hazardBand,hazardEnergy);
   vec3 hazardCore=mix(hazardTint,vec3(1.),.30)*hazardTrace*(2.65+hazardWave*.55);
   vec3 hazardBody=hazardTint*(hazardFace+hazardRim*.48);
   if(hazardMechanism>.5){
    // Cool dark alloy and hot perimeter light have different jobs: lighting
    // the outline must not turn the whole mechanism into a cream sheet.
    totalEmissiveRadiance*=.16;
    hazardBody=vec3(.04,.11,.20)*hazardFaceColor+hazardTint*hazardRim*.22;
   }
   // Amber hazard-chevron channels over dark metal; alternating warning
   // flash is intentionally tied to the NEXT obstacle only. Slow 1.8 Hz,
   // broad contrast (not an extreme white strobe) remains legible on iPhone.
   float warningFlash=0.45+0.55*smoothstep(-.30,.35,sin(hazardTime*11.3));
   float stripe=step(.45,fract((hazardPosition.x*.66+hazardPosition.y*.42)*3.0));
   vec3 warningAmber=mix(vec3(1.,.16,.025),vec3(1.,.66,.07),stripe);
   float outline=max(hazardBand,hazardEnergy);
   float danger=hazardAlert*warningFlash;
   totalEmissiveRadiance+=(hazardBody+hazardCore)*hazardGlowStrength;
   totalEmissiveRadiance+=warningAmber*danger*(.36+2.75*outline+hazardRim*.38);
  `);
 };
 material.customProgramCacheKey=()=>key+'/hazard-light-161';material.needsUpdate=true;return material;
}
