import * as THREE from 'three';

// Reflection lighting is deliberately softer than the old studio environment.
// Each course keeps a different cool sky / warm bounce palette. The native
// iPhone path receives the same materials, without an offscreen effect pass.
const PROFILES={
 1:{name:'orbital alloy',sky:[.32,.47,.66],bounce:[.23,.15,.12],rim:[.43,.76,.92]},
 2:{name:'tidal bronze',sky:[.25,.53,.54],bounce:[.11,.27,.25],rim:[.39,.79,.65]},
 3:{name:'foundry steel',sky:[.32,.36,.45],bounce:[.39,.16,.075],rim:[.77,.45,.24]},
 4:{name:'storm titanium',sky:[.42,.55,.68],bounce:[.22,.23,.29],rim:[.65,.77,.93]},
 5:{name:'forest bio-alloy',sky:[.39,.55,.43],bounce:[.21,.25,.11],rim:[.75,.74,.41]},
 6:{name:'rift ceramic alloy',sky:[.37,.39,.59],bounce:[.24,.16,.30],rim:[.66,.46,.88]}
};
export function courseEnvironment(course){
 const p=PROFILES[course];if(!p)throw Error('Unknown reflection course '+course);
 const width=256,height=128,data=new Uint16Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const theta=(y+.5)/height*Math.PI,phi=(x+.5)/width*Math.PI*2;
  const dy=Math.cos(theta),dx=Math.sin(theta)*Math.cos(phi),dz=Math.sin(theta)*Math.sin(phi);
  const upper=THREE.MathUtils.smoothstep(dy,-.45,.75);
  const softbox=Math.pow(Math.max(0,-dx*.53+dy*.74+dz*.41),18);
  const rim=Math.exp(-(((dy-.12)*5.5)**2))*Math.pow(Math.max(0,Math.cos(phi*2+.5)),4);
  const i=(y*width+x)*4;
  for(let c=0;c<3;c++){
   const value=.075+p.bounce[c]*(1-upper)*.62+p.sky[c]*(.24+upper*.64)
    +p.sky[c]*softbox*1.25+p.rim[c]*rim*.46;
   data[i+c]=THREE.DataUtils.toHalfFloat(value);
  }
  data[i+3]=THREE.DataUtils.toHalfFloat(1);
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.HalfFloatType);
 texture.mapping=THREE.EquirectangularReflectionMapping;
 texture.colorSpace=THREE.LinearSRGBColorSpace;
 texture.minFilter=texture.magFilter=THREE.LinearFilter;
 texture.name='V147 / '+p.name;texture.needsUpdate=true;
 return texture;
}

function satinFinish(material){
 if(!material||material.userData.satin147)return;
 material.userData.satin147=true;
 const previous=material.onBeforeCompile,oldKey=material.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  // Filter specular detail where a texture's normal changes faster than a
  // screen pixel. This acts in the existing material draw, including WebKit.
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`
   #include <normal_fragment_maps>
   vec3 finishDx=dFdx(normal),finishDy=dFdy(normal);
   float finishVariance=max(dot(finishDx,finishDx),dot(finishDy,finishDy));
   roughnessFactor=clamp(roughnessFactor+min(.17,finishVariance*.28),.43,.96);
  `);
 };
 material.customProgramCacheKey=()=>oldKey+'/satin-147';
 material.needsUpdate=true;
}
export function attachRaceFinish(scene,w,course){
 const materials=w.materials||{},structural=[];
 for(const name of ['titanium','bronze','steel','dark']){
  const m=materials[name];if(!m)continue;
  // A coated alloy has enough diffuse response to read in shadow. Preserve
  // the course's paint, existing panel maps and all animated theme colours.
  m.metalness=Math.min(m.metalness,name==='dark'?.38:course===2?.67:.73);
  m.envMapIntensity=Math.max(m.envMapIntensity,.64);
  if(name==='dark')m.color.lerp(new THREE.Color(course===2?0x557e7d:0x697885),.10);
  satinFinish(m);structural.push(m);
 }
 w.fixturePower=.86;if(w.kind==='expansion')w.key.intensity*=w.fixturePower;
 // Same light count, shadow map and range as V146. Lift the broad ground
 // bounce rather than putting another point light on the moving player.
 for(const light of w.root.children)if(light.isHemisphereLight){
  light.groundColor.lerp(new THREE.Color(course===3?0x674333:course===5?0x526244:0x526174),.22);
 }
 w.raceFinish={version:147,course,profile:PROFILES[course].name,materials:structural.length,
  reflectionSize:[256,128],addedDrawCalls:0,addedLights:0,addedPasses:0};
 if(typeof window!=='undefined'&&typeof location!=='undefined'&&location.search.includes('graphicsqa=1'))
  window.__shiftlineGraphicsQA={...window.__shiftlineGraphicsQA,...w.raceFinish};
 return w;
}

// Rounded, irregular canopy lobes replace twenty-triangle gem-like crowns.
// They remain opaque, instanced, inside their original unit-radius bounds.
export function canopyGeometry(detail=1){
 const g=new THREE.IcosahedronGeometry(1,detail),pos=g.attributes.position,norm=g.attributes.normal;
 const colors=new Float32Array(pos.count*3);
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),length=Math.hypot(x,y,z);
  const nx=x/length,ny=y/length,nz=z/length;
  const lobe=.93+.035*Math.sin(nx*7+ny*3)*Math.cos(nz*6-ny*2)+.025*Math.sin(ny*9+nz*4);
  pos.setXYZ(i,nx*lobe,ny*lobe,nz*lobe);norm.setXYZ(i,nx,ny,nz);
  const light=.78+.18*(ny*.5+.5)+.04*Math.sin(nx*9+nz*7);
  colors.set([light*.95,light,light*.88],i*3);
 }
 g.setAttribute('color',new THREE.BufferAttribute(colors,3));
 g.computeBoundingSphere();g.userData.roundedCanopy147=true;return g;
}
