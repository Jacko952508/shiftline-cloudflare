import * as THREE from 'three';
// SHIFTLINE V119: two animated thrusters per ship, with a persistent idle wake,
// long boost plumes, soft particles and five real-time selectable trail colours.
// Installed AFTER wing normalization so the common hitbox and span stay intact.
const PALETTE=[0x65eaff,0xff873c,0xbc8dff,0x72ffd1,0xff89cf];
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
 'varying vec2 vUv;',
 'void main(){',
 ' vUv=uv;',
 ' vec3 p=position;',
 ' float t=uv.y;',
 ' float wobble=(sin(uTime*13.0+t*32.0+uv.x*6.2831)*0.027+sin(uTime*19.0-t*47.0+uv.x*11.0)*0.014)*t*t;',
 ' p.x+=wobble*(0.7+uPower*0.3);',
 ' p.y+=cos(uTime*14.0+t*31.0+uv.x*8.0)*0.026*t*t;',
 ' gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);',
 '}'
].join('\n');
const fragment=[
 'precision mediump float;',
 'uniform vec3 uTint;',
 'uniform float uTime;',
 'uniform float uPower;',
 'uniform float uOpacity;',
 'varying vec2 vUv;',
 'void main(){',
 ' float t=clamp(vUv.y,0.0,1.0);',
 ' float edge=pow(1.0-t,0.95);',
 ' float noise=0.84+0.16*sin(uTime*25.0-t*47.0+sin(vUv.x*23.0)*4.0);',
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
function plasmaMaterial(tint,opacity){
 return new THREE.ShaderMaterial({
  vertexShader:vertex,fragmentShader:fragment,
  uniforms:{uTint:{value:new THREE.Color(tint)},uTime:{value:0},uPower:{value:.15},uOpacity:{value:opacity}},
  transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,
  blending:THREE.AdditiveBlending,toneMapped:false
 });
}
function particlesMaterial(color){
 return new THREE.ShaderMaterial({
  uniforms:{uColor:{value:new THREE.Color(color)},uOpacity:{value:.6}},
  vertexShader:[
   'precision mediump float;',
   'attribute float aPointSize;',
   'varying float vFade;',
   'void main(){',
   ' vFade=clamp(1.0-position.z,0.0,1.0);',
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
 const positions=LOCATIONS[index]||LOCATIONS[0];
 const fxGroup=new THREE.Group();fxGroup.name='dynamic-rocket-trails';root.add(fxGroup);
 const outerMat=plasmaMaterial(colour,.48),innerMat=plasmaMaterial(colour,.82);
 const coreMat=plasmaMaterial(0xf6ffff,.95),particleMat=particlesMaterial(colour);
 const outerGeo=plumeGeometry(.13,1.8),innerGeo=plumeGeometry(.068,1),coreGeo=plumeGeometry(.024,.5);
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
  const geometry=new THREE.BufferGeometry(),coords=new Float32Array(particles*3),sizes=new Float32Array(particles);
  for(let i=0;i<particles;i++)sizes[i]=.035+rand(i+e*41)*.07;
  geometry.setAttribute('position',new THREE.BufferAttribute(coords,3));
  geometry.setAttribute('aPointSize',new THREE.BufferAttribute(sizes,1));
  const pts=new THREE.Points(geometry,particleMat);pts.name='rocket-spark-wake';
  pts.frustumCulled=false;pts.renderOrder=18;anchor.add(pts);
  const throat=new THREE.Mesh(new THREE.CircleGeometry(.069,18),
   new THREE.MeshBasicMaterial({color:colour,transparent:true,opacity:.9,side:THREE.DoubleSide,
    blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  throat.name='lit-rocket-throat';throat.position.z=.015;anchor.add(throat);
  actors.push({anchor,outer,inner,core,pts,geometry,count:particles});
 }
 const fx={name:'SHIFTLINE-ROCKET-V119',ship,index,colour,custom,actors,materials:[outerMat,innerMat,coreMat,particleMat],length:0,power:0,boost:false,lastTime:0,hasPlumes:true,
  update(time,boost=false,reduced=false){
   if(!Number.isFinite(time))time=0;
   const targetPower=boost?1:.27;
   const targetLen=boost?4.35:(reduced?1.25:2.25);
   const dt=Math.min(.1,Math.max(.008,time-this.lastTime));this.lastTime=time;
   const response=1-Math.exp(-dt*(boost?17:10));
   this.length+=(targetLen-this.length)*response;
   this.power+=(targetPower-this.power)*response;
   this.boost=!!boost;
   for(const mat of this.materials){if(mat.uniforms.uTime)mat.uniforms.uTime.value=time;if(mat.uniforms.uPower)mat.uniforms.uPower.value=this.power}
   for(let e=0;e<this.actors.length;e++){
    const a=this.actors[e],flicker=1+Math.sin(time*29+e*2.7)*.08;
    a.outer.scale.z=this.length*flicker;
    a.inner.scale.z=this.length*.85*(1+Math.cos(time*32+e)*.035);
    a.core.scale.z=this.length*.70*flicker;
    a.outer.scale.x=a.outer.scale.y=boost?1.24:1;
    const coords=a.geometry.getAttribute('position');
    for(let i=0;i<a.count;i++){
     const cycle=((rand(i+e*97)+time*(boost?.54:.24))%1+1)%1;
     const angle=rand(i*11+e*23)*Math.PI*2+time*(.3+.12*this.power);
     const spread=.017+cycle*(.10+.06*this.power);
     coords.setXYZ(i,Math.cos(angle)*spread,Math.sin(angle)*spread,.15+cycle*.85*this.length);
    }
    coords.needsUpdate=true;
   }
   if(typeof location!=='undefined'&&location.search.includes('shipqa=1')){
    window.__shiftlineTrailQA={ship:index,emitters:this.actors.length,colour:this.colour,length:+this.length.toFixed(3),power:+this.power.toFixed(3),boost:this.boost,visible:true};
   }
  }
 };
 ship.userData.exhaustFX=fx;fx.update(.02,false,true);return fx;
}
export const SHIP_EXHAUST_PALETTE=PALETTE;
