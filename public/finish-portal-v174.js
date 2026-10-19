import * as THREE from 'three';

// V174 — the finish itself is a full-bore interdimensional destination.
// Shader animation runs entirely on GPU; the six courses each have a palette.
// Nothing here affects racing collisions, physics, matchmaking or finish time.
export const FINISH_PORTAL_COLORS=[
 null,
 [0x70e9ff,0x4774ff,0xd5faff], // Eclipse / orbital
 [0x48f4d5,0x197aeb,0xb6ffee], // Leviathan / underwater
 [0xffb369,0xff4b70,0xffefac], // Cinder / plasma
 [0x9cd8ff,0x6656ef,0xffffff], // Storm / prism
 [0xbaf48a,0x2ebd83,0xf4ffbd], // Forest / bioenergy
 [0xe7a2ff,0x8958ff,0xffddf9]  // Lunar / rift
];
const vert=`varying vec2 vUV;
void main(){vUV=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const vortexFrag=`varying vec2 vUV;
uniform float uTime;uniform float uApproach;uniform float uPhase;
uniform vec3 uPrimary;uniform vec3 uSecondary;uniform vec3 uCore;
void main(){
 vec2 p=vUV;float r=length(p);if(r>1.0)discard;
 float a=atan(p.y,p.x);
 float twist=a*7.0-r*32.0+uTime*(2.0+uPhase*.36)+3.0/(r+.16);
 float veins=pow(.5+.5*sin(twist),4.0);
 float spirals=pow(.5+.5*sin(twist*.47+r*13.0-uTime*.72),7.0);
 float bands=pow(.5+.5*cos(r*56.0-uTime*2.4+uPhase),10.0);
 float depth=1.0-smoothstep(.02,.68,r);
 float rim=smoothstep(.66,.87,r)*(1.0-smoothstep(.92,1.0,r));
 float mouth=1.0-smoothstep(.05,.27,r);
 vec3 dark=mix(vec3(.008,.015,.035),uSecondary*.15,depth);
 vec3 c=dark+uPrimary*(veins*.58+spirals*.34)*(.35+.65*r)
  +uSecondary*(bands*.22+spirals*.37)+uCore*(rim*.97+mouth*.45);
 float bright=1.0+uApproach*.68;
 c*=bright;
 float opacity=clamp(.95+rim*.05,0.0,1.0);
 gl_FragColor=vec4(c,opacity);
}`;
const auroraFrag=`varying vec2 vUV;uniform float uTime;uniform float uApproach;
uniform vec3 uPrimary;uniform vec3 uSecondary;
void main(){
 vec2 p=vUV;float r=length(p);if(r>1.0)discard;
 float a=atan(p.y,p.x);
 float w=pow(.5+.5*sin(a*10.0-r*39.0+uTime*3.3),8.0);
 float rings=pow(.5+.5*sin(r*57.0-uTime*4.1),14.0);
 float fade=smoothstep(.20,.48,r)*(1.0-smoothstep(.82,1.0,r));
 float alpha=(w*.45+rings*.18)*fade*(.70+uApproach*.75);
 gl_FragColor=vec4(mix(uSecondary,uPrimary,w)*(1.25+uApproach),alpha);
}`;
function shader(fragment,colors){
 return new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uApproach:{value:0},uPhase:{value:.75},
   uPrimary:{value:new THREE.Color(colors[0])},uSecondary:{value:new THREE.Color(colors[1])},
   uCore:{value:new THREE.Color(colors[2])}},
  vertexShader:vert,fragmentShader:fragment,side:THREE.DoubleSide,
  transparent:true,depthWrite:false,blending:THREE.NormalBlending,
  toneMapped:false
 });
}
function emissiveRing(radius,tube,color,opacity=1){
 const material=new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,
  toneMapped:false,depthWrite:opacity===1,blending:opacity<1?THREE.AdditiveBlending:THREE.NormalBlending});
 const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,8,96),material);
 ring.castShadow=ring.receiveShadow=false;return ring;
}
function sparks(colors){
 const count=68,positions=new Float32Array(count*3);
 // Fixed golden-angle seeds: no random costs, geometry rebuilt only per race.
 for(let i=0;i<count;i++){
  const t=(i+.5)/count,a=i*2.3999632297;
  const r=3.0+3.85*Math.sqrt(t);
  positions[i*3]=Math.cos(a)*r;
  positions[i*3+1]=Math.sin(a)*r;
  positions[i*3+2]=-.22-1.5*t;
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const material=new THREE.PointsMaterial({color:colors[2],size:.16,transparent:true,
  opacity:.82,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true,
  toneMapped:false});
 const points=new THREE.Points(geometry,material);points.name='wormhole / inward sparks';
 points.frustumCulled=false;return points;
}
export function createFinishPortal(course=1){
 const colors=FINISH_PORTAL_COLORS[course]||FINISH_PORTAL_COLORS[1];
 const root=new THREE.Group();root.name='SHIFT LINE / FINISH WORMHOLE';
 const frame=emissiveRing(7.22,.20,colors[2]);frame.name='wormhole / architectural rim';
 const outer=emissiveRing(7.06,.065,colors[0]);outer.name='wormhole / blue energy lip';
 const halo=emissiveRing(7.30,.29,colors[0],.16);halo.name='wormhole / luminous halo';
 const filament=emissiveRing(6.55,.027,colors[1],.85);filament.name='wormhole / rotating inner ribbon';
 const spiral=new THREE.Mesh(new THREE.CircleGeometry(6.88,96),shader(vortexFrag,colors));
 spiral.name='wormhole / deep rotating singularity';spiral.position.z=-.18;
 const aura=new THREE.Mesh(new THREE.CircleGeometry(6.65,80),shader(auroraFrag,colors));
 aura.name='wormhole / travelling energy trails';aura.position.z=.025;
 const motes=sparks(colors);motes.position.z=-.10;
 root.add(spiral,aura,frame,outer,halo,filament,motes);
 const portal={version:174,course,colors,spiral,aura,frame,outer,halo,filament,motes,
  apertureRadius:6.88,ringRadius:7.22,lastDistance:Infinity};
 root.userData.finishPortal=portal;root.visible=false;
 return root;
}
export function updateFinishPortal(root,time,distance,boost=false){
 const p=root?.userData.finishPortal;if(!p)return;
 const d=Math.max(0,distance),visible=d<650;
 root.visible=visible;p.lastDistance=d;
 if(!visible)return;
 const approach=THREE.MathUtils.clamp(1-d/380,0,1),speed=1+approach*.95;
 p.spiral.material.uniforms.uTime.value=time*speed;
 p.spiral.material.uniforms.uApproach.value=approach;
 p.aura.material.uniforms.uTime.value=time*speed;
 p.aura.material.uniforms.uApproach.value=approach;
 p.aura.rotation.z=-time*.33;
 p.filament.rotation.z=time*.64;
 p.halo.rotation.z=time*.10;
 p.motes.rotation.z=-time*.18;
 p.motes.material.opacity=.57+approach*.37;
 p.halo.material.opacity=.14+approach*.23;
 p.outer.scale.setScalar(1+Math.sin(time*3.7)*.008*(.5+approach));
 // Subtle warp-up inside the final 65 metres, never a new light or post-pass.
 p.aura.scale.setScalar(1+Math.sin(time*4.5)*.012*approach);
 if(boost)p.aura.material.uniforms.uApproach.value=Math.min(1,approach+.12);
 if(typeof window!=='undefined'&&typeof location!=='undefined'&&location.search.includes('portalqa=1'))
  window.__shiftlineFinishPortalQA={version:p.version,course:p.course,distance:d,visible:root.visible,
   apertureRadius:p.apertureRadius,ringRadius:p.ringRadius,approach,passes:0};
}
export function disposeFinishPortal(scene,root){
 if(!root)return;
 scene?.remove(root);
 const geometries=new Set(),materials=new Set();
 root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);
  if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);
 });
 for(const g of geometries)g.dispose();
 for(const m of materials)m.dispose();
 root.clear();
}
