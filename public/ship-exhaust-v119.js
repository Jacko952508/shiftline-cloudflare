import * as THREE from 'three';
// SHIFTLINE V119: two animated thrusters per ship, with a persistent idle wake,
// long boost plumes, soft particles and five real-time selectable trail colours.
// Installed AFTER wing normalization so the common hitbox and span stay intact.
const PALETTE=[0x65eaff,0xff873c,0xbc8dff,0x72ffd1,0xff89cf];
// Each trail has different width, length, turbulence and flicker, not just tint.
const TRAIL_STYLES=[
 {name:'Ice Plasma',width:.94,length:1,turb:.50,flicker:.055,sparks:.70},
 {name:'Solar Flare',width:1.33,length:.94,turb:1.25,flicker:.22,sparks:1.42},
 {name:'Violet Pulse',width:1.09,length:1.12,turb:1.05,flicker:.17,sparks:1.15},
 {name:'Emerald Ion',width:.76,length:1.26,turb:.30,flicker:.035,sparks:.65},
 {name:'Rose Plasma',width:1.16,length:1.11,turb:.76,flicker:.13,sparks:1.00}
];
const ENGINE_PROFILES=[
 {name:'turbine',radius:1,length:1,core:1},
 {name:'armoured',radius:1.22,length:.94,core:1.10},
 {name:'ion-collar',radius:.87,length:1.23,core:1.17},
 {name:'vector-nozzle',radius:1.08,length:1.13,core:1.06},
 {name:'split-shroud',radius:1.30,length:.96,core:.89}
];
const LOCATIONS=[
 [[-.77,.055,.855],[.77,.055,.855]],
 [[-.46,.025,.865],[.46,.025,.865]],
 [[-.23,-.02,.82],[.23,-.02,.82]],
 [[-.39,-.03,.765],[.39,-.03,.765]],
 [[-.79,.07,.975],[.79,.07,.975]],
 [[-.28,.02,.90],[.28,.02,.90]]
];
const vertex=[
 'precision mediump float;',
 'uniform float uTime;',
 'uniform float uPower;',
 'uniform float uTurbulence;',
 'varying vec2 vUv;',
 'void main(){',
 ' vUv=uv;',
 ' vec3 p=position;',
 ' float t=uv.y;',
 ' float wobble=(sin(uTime*13.0+t*32.0+uv.x*6.2831)*0.027+sin(uTime*19.0-t*47.0+uv.x*11.0)*0.014)*t*t;',
 ' p.x+=wobble*(0.6+uPower*0.4)*uTurbulence;',
 ' p.y+=cos(uTime*14.0+t*31.0+uv.x*8.0)*0.024*t*t*uTurbulence;',
 ' gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);',
 '}'
].join('\n');
const fragment=[
 'precision mediump float;',
 'uniform vec3 uTint;',
 'uniform float uTime;',
 'uniform float uPower;',
 'uniform float uOpacity;',
 'uniform float uTurbulence;',
 'varying vec2 vUv;',
 'void main(){',
 ' float t=clamp(vUv.y,0.0,1.0);',
 ' float edge=pow(1.0-t,0.95);',
 ' float noise=0.84+0.16*sin(uTime*(22.0+uTurbulence*6.0)-t*(44.0+uTurbulence*9.0)+sin(vUv.x*23.0)*4.0);',
 ' float waves=0.87+0.13*sin(t*82.0-uTime*31.0+vUv.x*20.0);',
 ' float fade=pow(edge,0.72)*(0.65+0.35*smoothstep(0.0,0.13,t));',
 ' float a=fade*noise*waves*uOpacity*(0.68+uPower*0.32);',
 ' vec3 col=mix(uTint,vec3(0.92,0.98,1.0),pow(1.0-t,3.5)*0.48)*(1.5+uPower*0.54);',
 ' gl_FragColor=vec4(col,a);',
 '}'
].join('\n');
function plumeGeometry(radius,flare=1){
 const segments=10,rings=15,vertices=[],uv=[],idx=[];
 for(let i=0;i<=rings;i++){
  const t=i/rings,r=radius*(1+flare*Math.sin(Math.PI*t)*.55)*Math.pow(1-t,.56)+.0025;
  for(let k=0;k<=segments;k++){
   const a=k/segments*Math.PI*2;
   vertices.push(Math.cos(a)*r,Math.sin(a)*r,t);uv.push(k/segments,t);
  }
 }
 for(let i=0;i<rings;i++)for(let k=0;k<segments;k++){
  const a=i*(segments+1)+k,b=a+segments+1;idx.push(a,a+1,b,a+1,b+1,b);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setIndex(idx);g.computeVertexNormals();return g;
}
function plasmaMaterial(tint,opacity,style){
 return new THREE.ShaderMaterial({
  vertexShader:vertex,fragmentShader:fragment,
  uniforms:{uTint:{value:new THREE.Color(tint)},uTime:{value:0},uPower:{value:.15},uOpacity:{value:opacity},uTurbulence:{value:style?.turb??.5}},
  transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,
  blending:THREE.AdditiveBlending,toneMapped:false
 });
}
function particlesMaterial(color){
 return new THREE.ShaderMaterial({
  uniforms:{uColor:{value:new THREE.Color(color)},uOpacity:{value:.6},uLength:{value:2.25}},
  vertexShader:[
   'precision mediump float;',
   'attribute float aPointSize;',
   'varying float vFade;',
   'uniform float uLength;',
   'void main(){',
   ' vFade=clamp(1.0-position.z/max(0.1,uLength),0.0,1.0);',
   ' vec4 mvPosition=modelViewMatrix*vec4(position,1.0);',
   ' gl_PointSize=clamp(aPointSize*200.0/max(0.4,-mvPosition.z),1.0,8.0);',
   ' gl_Position=projectionMatrix*mvPosition;',
   '}'
  ].join('\n'),
  fragmentShader:[
   'precision mediump float;',
   'uniform vec3 uColor;',
   'uniform float uOpacity;',
   'varying float vFade;',
   'void main(){',
   ' vec2 p=gl_PointCoord*2.0-1.0;',
   ' float alpha=smoothstep(1.0,0.1,length(p))*vFade*uOpacity;',
   ' gl_FragColor=vec4(uColor*1.8,alpha);',
   '}'
  ].join('\n'),
  transparent:true,depthTest:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false
 });
}
const rand=i=>((Math.sin(i*127.1+45.97)*43758.5453)%1+1)%1;
export function installShipExhaust(ship,root,index,custom,high=true){
 const colour=PALETTE[custom.trail|0]||PALETTE[0];
 const style=TRAIL_STYLES[custom.trail|0]||TRAIL_STYLES[0];
 const engineProfile=ENGINE_PROFILES[custom.engine|0]||ENGINE_PROFILES[0];
 const positions=LOCATIONS[index]||LOCATIONS[0];
 const fxGroup=new THREE.Group();fxGroup.name='dynamic-rocket-trails';root.add(fxGroup);
 const outerMat=plasmaMaterial(colour,high?.48:.28,style),innerMat=plasmaMaterial(colour,high?.82:.42,style);
 const coreMat=plasmaMaterial(0xf6ffff,high?.95:.68,style),particleMat=particlesMaterial(colour);
 const outerGeo=plumeGeometry(.13*engineProfile.radius,1.8),innerGeo=plumeGeometry(.068*engineProfile.radius,1),coreGeo=plumeGeometry(.024*engineProfile.core,.5);
 const particles=high?24:10,actors=[];
 for(let e=0;e<positions.length;e++){
  const [x,y,z]=positions[e];
  const anchor=new THREE.Group();anchor.name='rocket-trail-emitter-'+e;
  anchor.position.set(x,y,z);fxGroup.add(anchor);
  const outer=new THREE.Mesh(outerGeo,outerMat),inner=new THREE.Mesh(innerGeo,innerMat),core=new THREE.Mesh(coreGeo,coreMat);
  for(const mesh of [outer,inner,core]){
   mesh.frustumCulled=false;mesh.renderOrder=15;
   mesh.castShadow=false;mesh.receiveShadow=false;mesh.name='animated-rocket-plume';anchor.add(mesh);
  }
  inner.position.z=.001;core.position.z=.002;
  // Rivals retain visible bright rocket cores without the full alpha overdraw.
  inner.visible=high;
  const geometry=new THREE.BufferGeometry(),coords=new Float32Array(particles*3),sizes=new Float32Array(particles);
  for(let i=0;i<particles;i++)sizes[i]=.035+rand(i+e*41)*.07;
  geometry.setAttribute('position',new THREE.BufferAttribute(coords,3));
  geometry.setAttribute('aPointSize',new THREE.BufferAttribute(sizes,1));
  const pts=new THREE.Points(geometry,particleMat);pts.name='rocket-spark-wake';
  pts.frustumCulled=false;pts.renderOrder=18;pts.visible=high;anchor.add(pts);
  const throat=new THREE.Mesh(new THREE.CircleGeometry(.069*engineProfile.radius,18),
   new THREE.MeshBasicMaterial({color:colour,transparent:true,opacity:.9,side:THREE.DoubleSide,
    blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  throat.name='lit-rocket-throat';throat.position.z=.015;throat.material.opacity=high?.90:.57;anchor.add(throat);
  const shockRings=[];
  if(high){
   const ringMat=new THREE.MeshBasicMaterial({color:colour,opacity:.23,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
   for(let k=0;k<2;k++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry((.065+k*.023)*engineProfile.radius,.010,5,20),ringMat);
    ring.name='boost-shock-diamond';ring.renderOrder=16;ring.visible=false;anchor.add(ring);shockRings.push(ring);
   }
  }
  actors.push({anchor,outer,inner,core,pts,geometry,count:particles,shockRings});
 }
 const fx={name:'SHIFTLINE-ROCKET-V121',ship,index,colour,custom,engineProfile,actors,materials:[outerMat,innerMat,coreMat,particleMat],length:1.15,power:.20,boost:false,lastTime:0,hasPlumes:true,
  update(time,boost=false,reduced=false){
   if(!Number.isFinite(time))time=0;
   const targetPower=boost?1:.27;
   const raceView=!!this.racing;
   const targetLen=(boost?(raceView?2.85:4.35):(reduced?1.25:raceView?1.65:2.25))*style.length*engineProfile.length;
   const dt=Math.min(.1,Math.max(.008,time-this.lastTime));this.lastTime=time;
   const response=1-Math.exp(-dt*(boost?17:10));
   this.length+=(targetLen-this.length)*response;
   this.power+=(targetPower-this.power)*response;
   this.boost=!!boost;
   for(const mat of this.materials){if(mat.uniforms.uTime)mat.uniforms.uTime.value=time;if(mat.uniforms.uPower)mat.uniforms.uPower.value=this.power;if(mat.uniforms.uLength)mat.uniforms.uLength.value=this.length}
   for(let e=0;e<this.actors.length;e++){
    const a=this.actors[e],flicker=1+Math.sin(time*(28+style.turb*5)+e*2.7)*style.flicker;
    a.outer.scale.z=this.length*flicker;
    a.inner.scale.z=this.length*.85*(1+Math.cos(time*32+e)*.035);
    a.core.scale.z=this.length*.70*flicker;
    a.outer.scale.x=a.outer.scale.y=style.width*(boost?1.15:1)*(raceView?.78:1);
    a.inner.scale.x=a.inner.scale.y=style.width*.95*(raceView?.77:1);
    a.core.scale.x=a.core.scale.y=style.width*(boost?1.04:.93)*(raceView?.82:1);
    // Short, shimmering nozzle glow, not an expensive fullscreen post-process.
    const throat=a.anchor.getObjectByName('lit-rocket-throat');
    if(throat){throat.material.opacity=(high?.65:.39)+(boost?.25:0);throat.scale.setScalar(style.width*(1+(boost?.15:0)));}
    for(let k=0;k<a.shockRings.length;k++){
    const ring=a.shockRings[k];ring.visible=boost&&!reduced;
    if(ring.visible){ring.position.z=this.length*(.23+k*.19);ring.scale.setScalar((1+.09*Math.sin(time*21+k*2.6))*style.width);}
   }
   a.pts.visible=high&&!reduced;
    if(!high)continue;
    const coords=a.geometry.getAttribute('position');
    for(let i=0;i<a.count;i++){
     const cycle=((rand(i+e*97)+time*(boost?.54:.24))%1+1)%1;
     const angle=rand(i*11+e*23)*Math.PI*2+time*(.3+.12*this.power);
     const spread=(.017+cycle*(.10+.06*this.power))*style.width*style.sparks;
     coords.setXYZ(i,Math.cos(angle)*spread,Math.sin(angle)*spread,.15+cycle*.85*this.length);
    }
    coords.needsUpdate=true;
   }
   if(high&&typeof location!=='undefined'&&location.search.includes('shipqa=1')){
    window.__shiftlineTrailQA={ship:index,emitters:this.actors.length,colour:this.colour,style:style.name,engine:engineProfile.name,raceView:!!this.racing,shockRings:this.actors[0]?.shockRings.length||0,length:+this.length.toFixed(3),power:+this.power.toFixed(3),boost:this.boost,visible:true};
   }
  }
 };
 ship.userData.exhaustFX=fx;fx.update(.02,false,true);return fx;
}
export const SHIP_EXHAUST_PALETTE=PALETTE;
export const SHIP_EXHAUST_STYLES=TRAIL_STYLES;
