
export async function mount(root){
const $=x=>root.querySelector('#'+x),canvas=$('canvas'),loader=$('load');
try{
const T=await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
const mobile=/iPhone|Android|iPad/i.test(navigator.userAgent),scene=new T.Scene(),camera=new T.PerspectiveCamera(58,1,.1,680),clock=new T.Clock();
const ren=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
let active=true;
ren.outputColorSpace=T.SRGBColorSpace;ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=1.1;ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFSoftShadowMap;
const mat=(c,m=0,r=.7)=>new T.MeshStandardMaterial({color:c,metalness:m,roughness:r}),stone=mat(0xbcc6c2,.12,.7),dark=mat(0x233d49,.74,.31),brass=mat(0xc7ae8b,.85,.22),rock=mat(0x52616a,.03,.95),pale=mat(0xe0e8df,.28,.36),floor=mat(0x899da2,.58,.21),glass=new T.MeshPhysicalMaterial({color:0x8ed8e4,metalness:.18,roughness:.07,transparent:true,opacity:.3,depthWrite:false,side:T.DoubleSide,clearcoat:1}),cyan=new T.MeshBasicMaterial({color:0x6bf2ff,toneMapped:false}),red=new T.MeshBasicMaterial({color:0xff304d,toneMapped:false}),fabric=mat(0x315861,0,.85),wood=mat(0x94765b,0,.52);
function add(g,m,x,y,z,p=scene){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.receiveShadow=true;p.add(o);return o}
const box=(w,h,d,m,x,y,z,p=scene)=>add(new T.BoxGeometry(w,h,d),m,x,y,z,p),cyl=(a,b,h,m,x,y,z,p=scene,n=20)=>add(new T.CylinderGeometry(a,b,h,n),m,x,y,z,p),ball=(r,m,x,y,z,p=scene)=>add(new T.SphereGeometry(r,16,10),m,x,y,z,p);
function line(a,b,r,m,p=scene){const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A);const o=add(new T.CylinderGeometry(r,r,d.length(),8),m,...A.add(B).multiplyScalar(.5).toArray(),p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}
const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{high:{value:new T.Color('#286486')},low:{value:new T.Color('#ebbea2')},time:{value:0},night:{value:0}},
vertexShader:`varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`uniform vec3 high,low;uniform float time,night;varying vec3 p;float h(vec2 q){return fract(sin(dot(q,vec2(12.7,83.3)))*43758.545);}void main(){vec3 d=normalize(p);vec3 c=mix(low,high,smoothstep(-.15,.83,d.y));float s=pow(max(dot(d,normalize(vec3(-.6,.4,.7))),0.),500.);c+=vec3(1.,.76,.54)*s*2.;float cloud=sin(d.x*31.+time*.016)*sin(d.z*22.+d.y*6.);c*=1.-smoothstep(.52,.89,cloud)*.11;s=step(.9992,h(floor(d.xz*1150.+d.y*320.)));c+=vec3(.7,.8,1.)*s*night*smoothstep(.2,.4,d.y);gl_FragColor=vec4(c,1.);}`});
add(new T.SphereGeometry(800,32,16),skyMat,0,0,0);
const seaMat=new T.ShaderMaterial({uniforms:{time:{value:0},a:{value:new T.Color('#123d55')},b:{value:new T.Color('#8ac4c2')},storm:{value:0}},
vertexShader:`uniform float time,storm;varying vec3 wp,nw;varying float height;float wave(vec2 p){return(sin(p.x*.17+time*.68+sin(p.y*.13))*.52+sin(p.y*.26-time*.83+p.x*.12)*.36+sin(dot(p,vec2(.6,.8))*1.15+time*1.31)*.2)*(1.+storm*.85);}void main(){vec3 p=position;p.z=wave(p.xy);float dx=(wave(p.xy+vec2(.12,0.))-p.z)/.12,dy=(wave(p.xy+vec2(0.,.12))-p.z)/.12;nw=normalize(mat3(modelMatrix)*vec3(-dx,-dy,1.));height=p.z;wp=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,
fragmentShader:`uniform float time,storm;uniform vec3 a,b;varying vec3 wp,nw;varying float height;void main(){vec3 n=normalize(nw),V=normalize(cameraPosition-wp);float fres=pow(1.-max(dot(n,V),0.),3.);vec3 L=normalize(vec3(-.6,.72,.7));float s=pow(max(dot(reflect(-L,n),V),0.),155.);float foam=smoothstep(.67,1.1,height);vec3 c=mix(a,b,.13+.69*fres)+vec3(1.,.78,.52)*s*1.9+vec3(.7,.9,.95)*foam*(.14+storm*.32);gl_FragColor=vec4(c,1.);}`});
const sea=add(new T.PlaneGeometry(1300,1300,120,120),seaMat,0,-2.4,0);sea.rotation.x=-Math.PI/2;
function island(cx,cz,rx,rz,top,seed){const n=48,L=8,h=[-13,-10,-7,-3,1,4,6,top],q=[.44,.61,.78,.93,1,1.05,.97,.92],v=[],idx=[];for(let j=0;j<L;j++)for(let i=0;i<=n;i++){let a=i/n*Math.PI*2,w=1+.09*Math.sin(a*9+seed)+.06*Math.cos(a*17-seed);v.push(cx+Math.cos(a)*rx*q[j]*w,h[j]+Math.sin(a*13+j*1.7)*.22,cz+Math.sin(a)*rz*q[j]*w)}for(let j=0;j<L-1;j++)for(let i=0;i<n;i++){let a=j*(n+1)+i,b=a+n+1;idx.push(a,b,a+1,b,b+1,a+1)}v.push(cx,top,cz);let c=v.length/3-1;for(let i=0;i<n;i++)idx.push(c,(L-1)*(n+1)+i,(L-1)*(n+1)+i+1);let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();add(g,rock,0,0,0)}
island(0,0,34,29,9,2);island(-78,-105,38,30,15,5);island(85,-120,40,31,12,3);
// Cantilever structure, tall glazed facade, furnishings and roof glazing.
box(36,1.2,28,stone,0,9.5,0);box(35,.16,27,floor,0,10.2,0);
for(const x of [-15,15])for(const z of [-11,11])cyl(.8,1.1,11,dark,x,4,z);
box(31,.6,20,stone,-1,11.1,-3);box(32,.55,21,dark,-1,18.6,-3);
box(31,.09,20,floor,-1,11.53,-3);
for(const x of [-16,14]){box(.65,7,20,stone,x,15,-3);box(.075,6.5,19,glass,x,15,-3)}
box(31,7,.6,dark,-1,15,-12.7);
for(const z of [-12,6.2]){box(31,.2,.25,brass,-1,11.9,z);box(31,.2,.25,brass,-1,18.2,z);for(let x=-15.5;x<14;x+=2.8){box(.12,6.4,.15,dark,x,15,z);if(z>0)box(2.65,6.35,.05,glass,x+1.4,15,z)}}
for(let x=-13;x<14;x+=4)box(2.6,.075,19,dark,x,19,-3);
box(43,.6,10,stone,0,10.7,17);box(42,.12,9.5,floor,0,11.04,17);
for(let x=-20;x<=20;x+=1.7)box(.09,1.38,.09,dark,x,11.8,21.6);line([-20.5,12.55,21.6],[20.5,12.55,21.6],.09,brass);
for(let x=-12;x<=12;x+=6){box(3,.12,1.3,wood,x,12.2,-4);box(1.4,.9,.09,dark,x,13.05,-4.55);box(1.25,.7,.04,cyan,x,13.05,-4.48);box(.8,.16,.8,fabric,x,11.7,-2)}
for(let x=-10;x<=10;x+=5)box(2.4,1.4,.1,dark,x,14.4,-12.2);
// Dome, air bridge and tower.
const dome=add(new T.SphereGeometry(4.5,28,14,0,Math.PI*2,0,Math.PI/2),glass,-8,19.2,0);
for(let i=0;i<12;i++){let a=i*Math.PI/6;line([-8+Math.cos(a)*4.5,19.2,Math.sin(a)*4.5],[-8,23.7,0],.045,brass)}
box(19,.7,4.1,dark,24,13.25,-3);box(18.5,.11,3.8,stone,24,13.65,-3);
for(let x=15;x<33;x+=2)for(const z of [-4.9,-1.1])box(.08,1.25,.08,dark,x,14.3,z);
for(const z of [-4.9,-1.1])line([14,15,z],[34,15,z],.07,brass);
cyl(5.5,6.1,14,stone,34,13,-3);cyl(5.9,5.9,.3,brass,34,20,-3);cyl(4.8,4.8,4.25,glass,34,22.3,-3,scene,32);cyl(5.9,5.9,.5,dark,34,24.6,-3);cyl(.16,.16,6,dark,34,27.3,-3);
const radar=new T.Group();radar.position.set(34,27,-3);scene.add(radar);const dish=add(new T.SphereGeometry(2.4,24,12,0,Math.PI),pale,0,.7,0,radar);dish.scale.z=.14;dish.rotation.x=-.3;
// Helipad and flying drone.
cyl(4.5,4.5,.13,dark,6,18.9,-2,scene,48);cyl(4,4,.04,brass,6,19,-2,scene,48);box(2,.05,.15,pale,6,19.04,-2);box(.15,.05,2,pale,6,19.04,-2);
const drone=new T.Group();scene.add(drone);box(1.6,.31,.8,dark,0,0,0,drone);ball(.28,glass,0,-.18,.4,drone);for(const x of [-1.1,1.1])for(const z of [-.8,.8]){line([0,0,0],[x,0,z],.05,brass,drone);cyl(.35,.35,.025,cyan,x,.16,z,drone)}
// V6 SKYFALL: animated atmospheric aurora curtains and a patrolling scientific craft.
const auroraMat=new T.ShaderMaterial({
  transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
  uniforms:{time:{value:0},opacity:{value:.78}},
  vertexShader:`uniform float time;varying vec2 uvv;varying float fade;
  void main(){uvv=uv;vec3 p=position;
  p.y+=sin(p.x*.11+time*.6)*2.2+cos(p.x*.21-time*.4)*1.2;
  p.z+=sin(p.x*.16+p.y*.18+time*.5)*3.;
  fade=1.-abs(uv.y-.5)*.5;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform float time,opacity;varying vec2 uvv;varying float fade;
  void main(){float band=sin(uvv.x*24.+sin(uvv.y*11.+time*.26)*2.+time*.24);
  float detail=sin(uvv.x*76.-uvv.y*15.+time*.45)*.5+.5;
  float streak=pow(max(0.,band*.5+.5),3.)*(.42+.58*detail);
  float edge=smoothstep(0.,.14,uvv.y)*smoothstep(0.,.23,1.-uvv.y);
  edge*=smoothstep(0.,.12,uvv.x)*smoothstep(0.,.1,1.-uvv.x);
  vec3 a=vec3(.02,.9,.83),b=vec3(.65,.18,1.);
  vec3 col=mix(a,b,.5+.5*sin(uvv.x*7.+time*.19));
  gl_FragColor=vec4(col*1.55,streak*edge*fade*opacity);}`
});
const auroraSheets=[];
for(let i=0;i<3;i++){
 const sheet=add(new T.PlaneGeometry(64,14,48,12),auroraMat,2,37+i*5,-34-i*5);
 sheet.rotation.y=.1+i*.17;auroraSheets.push(sheet);
}
const scout=new T.Group();scene.add(scout);
const scoutHull=new T.MeshStandardMaterial({color:0xdbedf1,metalness:.72,roughness:.18});
const scoutEngine=new T.MeshBasicMaterial({color:0x6dffff,toneMapped:false});
const fuselage=add(new T.SphereGeometry(1,22,14),scoutHull,0,0,0,scout);
fuselage.scale.set(3.3,.68,.95);
const cockpit=add(new T.SphereGeometry(1,16,12),glass,-.35,.5,0,scout);
cockpit.scale.set(1.25,.52,.76);
for(const z of [-1,1]){
 const wing=box(2.3,.15,3.6,scoutHull,-.35,-.12,z*2,scout);
 wing.rotation.x=z*.09;
 const engine=add(new T.CylinderGeometry(.3,.43,1.15,16),dark,1,-.15,z*2.7,scout);
 engine.rotation.z=Math.PI/2;
 const flame=add(new T.SphereGeometry(.31,12,8),scoutEngine,1.65,-.15,z*2.7,scout);
 flame.scale.x=.6;
}
const scoutLight=new T.PointLight(0x4deeff,12,16);scout.add(scoutLight);
const landingRings=[];
for(let i=0;i<3;i++){
 const ring=add(new T.TorusGeometry(4.4+i*.7,.09,8,96),i%2?cyan:brass,6,19.16,-2);
 ring.rotation.x=Math.PI/2;landingRings.push(ring);
}
// V5 visual update: pulsing observatory beacon array and magnetic suspended rings.
const auroraGroup=new T.Group();auroraGroup.position.set(0,27,5);scene.add(auroraGroup);
const auroraRings=[];
for(let i=0;i<6;i++){
 const ring=add(new T.TorusGeometry(4.2+i*.75,.075,8,100),i%2?brass:cyan,0,0,0,auroraGroup);
 ring.rotation.set(i*.25,.12+i*.27,i*.38);auroraRings.push(ring);
}
const auroraCrystal=add(new T.IcosahedronGeometry(1.15,3),cyan,0,0,0,auroraGroup);
const v5Lights=[];
for(let i=0;i<14;i++){
 const a=i*Math.PI*2/14,x=32*Math.cos(a),z=28*Math.sin(a);
 const bulb=ball(.16,i%2?cyan:red,x,10.5,z);
 v5Lights.push(bulb);
}
// V2: animated survey vessel, coast marker lights and a gigantic scanning ring.
const vessel=new T.Group();scene.add(vessel);
box(6,.7,2.25,dark,0,0,0,vessel);box(4.2,.55,1.8,pale,0,.52,-.08,vessel);
box(1.8,1.3,1.45,glass,-.5,1.28,0,vessel);box(.12,2,.12,brass,2.15,1.6,0,vessel);
const scanRing=add(new T.TorusGeometry(6.6,.13,12,116),brass,-24,14,-16);scanRing.rotation.y=.35;
const innerRing=add(new T.TorusGeometry(5.45,.045,8,116),cyan,-24,14,-16);innerRing.rotation.y=.35;
const markers=[];for(const [x,z] of [[-35,19],[27,42],[48,-42]]){const g=new T.Group();g.position.set(x,-.4,z);scene.add(g);cyl(.34,.47,1.3,dark,0,0,0,g);ball(.2,red,0,.9,0,g);markers.push(g)}


// V7: H-07 — mobile flyable helicopter, articulated rotors and two cameras.
const heliWhite=new T.MeshPhysicalMaterial({color:0xd9e4e9,metalness:.7,roughness:.23,clearcoat:1});
const heliNavy=new T.MeshPhysicalMaterial({color:0x1c4358,metalness:.76,roughness:.23,clearcoat:1});
const heliBlack=new T.MeshStandardMaterial({color:0x101b24,metalness:.57,roughness:.36});
const heliWindow=new T.MeshPhysicalMaterial({color:0x6abed9,metalness:.26,roughness:.1,transparent:true,opacity:.75,clearcoat:1,depthWrite:false});
const heliBlade=new T.MeshStandardMaterial({color:0x222c34,metalness:.49,roughness:.44,side:T.DoubleSide});
const heliGreen=new T.MeshBasicMaterial({color:0x6affc9,toneMapped:false});
const helicopter=new T.Group();scene.add(helicopter);
const heliTilt=new T.Group();helicopter.add(heliTilt);
const hBody=add(new T.SphereGeometry(1,28,20),heliWhite,0,.0,.1,heliTilt);hBody.scale.set(1.12,.86,3.03);
const hCabin=add(new T.SphereGeometry(1,28,18),heliNavy,0,.22,-1.2,heliTilt);hCabin.scale.set(1.17,.91,1.65);
const hCanopy=add(new T.SphereGeometry(1,28,18),heliWindow,0,.4,-1.6,heliTilt);hCanopy.scale.set(1.11,.78,1.47);
for(const x of [-1,1]){
  line([x*.8,-.2,-2.7],[x*.99,.75,-1.7],.053,heliBlack,heliTilt);
  line([x*.99,.75,-1.7],[x*.87,.1,-.43],.045,heliBlack,heliTilt);
  box(.11,.45,1.6,heliNavy,x,-.3,-.2,heliTilt);
  const exhaust=add(new T.CylinderGeometry(.21,.25,1.1,14),heliBlack,x*.77,.53,.5,heliTilt);
  exhaust.rotation.x=Math.PI/2;
  line([x*.87,-.66,-1.72],[x*.87,-1.28,-1.6],.07,heliBlack,heliTilt);
  line([x*.87,-.66,1.38],[x*.87,-1.28,1.6],.07,heliBlack,heliTilt);
  box(.14,.13,5.25,heliBlack,x*.87,-1.27,-.1,heliTilt);
  ball(.13,heliWhite,x*.87,-1.27,-2.69,heliTilt);
}
const hBoom=box(.58,.56,5.7,heliWhite,0,.12,4.4,heliTilt);
box(2.4,.14,.56,heliNavy,0,.24,6.35,heliTilt);
box(.13,1.4,.6,heliNavy,0,.72,6.83,heliTilt);
const tailSpin=new T.Group();tailSpin.position.set(-.18,.8,6.68);heliTilt.add(tailSpin);
for(let i=0;i<4;i++){
 const blade=box(.08,1.48,.15,heliBlade,0,.74*Math.cos(i*Math.PI/2),.74*Math.sin(i*Math.PI/2),tailSpin);
 blade.rotation.x=i*Math.PI/2;
}
box(1.15,.22,1.1,heliNavy,0,.92,.12,heliTilt);
const hRotor=new T.Group();hRotor.position.y=1.56;heliTilt.add(hRotor);
add(new T.CylinderGeometry(.32,.32,.3,16),heliBlack,0,0,0,hRotor);
for(let i=0;i<5;i++){
  const a=i*2*Math.PI/5;
  const blade=box(.43,.055,4.6,heliBlade,-2.28*Math.sin(a),.06,-2.28*Math.cos(a),hRotor);
  blade.rotation.y=a;
}
const hRotorBlur=add(new T.CircleGeometry(4.6,48),new T.MeshBasicMaterial({color:0xd6f6ff,transparent:true,opacity:.06,side:T.DoubleSide,depthWrite:false}),0,1.59,0,heliTilt);
hRotorBlur.rotation.x=-Math.PI/2;
const hInstrument=new T.Group();heliTilt.add(hInstrument);
box(1.9,.43,.68,heliBlack,0,-.11,-2.42,hInstrument);
for(const x of [-.48,.48]){
  box(.7,.35,.02,new T.MeshBasicMaterial({color:0x40bcc7,toneMapped:false}),x,.08,-2.78,hInstrument);
  line([x*1.9,-.25,-2.78],[x*1.9,.75,-2.14],.065,heliBlack,hInstrument);
}
line([-.96,.8,-2.13],[.96,.8,-2.13],.07,heliBlack,hInstrument);
hInstrument.visible=false;
const hRed=ball(.13,red,-1.21,.38,-.4,heliTilt);
const hGreen=ball(.13,heliGreen,1.21,.38,-.4,heliTilt);
const hSpot=new T.SpotLight(0xe2f9ff,25,100,Math.PI/9,.35,1.5);
hSpot.position.set(0,-.5,-2.1);const hSpotTarget=new T.Object3D();hSpotTarget.position.set(0,-12,-38);
helicopter.add(hSpot,hSpotTarget);hSpot.target=hSpotTarget;
const hState={p:new T.Vector3(6,28,-2),heading:0,speed:0,vertical:0,yawRate:0};
helicopter.position.copy(hState.p);
const flightHud=document.createElement('div');
flightHud.style.cssText='position:absolute;right:10px;top:96px;z-index:2;pointer-events:none;color:#d2faff;background:#071e2bbb;border:1px solid #86d6e477;border-radius:8px;padding:6px 9px;font:10px/1.55 ui-monospace,monospace;white-space:pre';
root.appendChild(flightHud);
const flightBar=document.createElement('div');
flightBar.className='controls';
flightBar.style.cssText='position:absolute;left:auto;right:10px;bottom:104px;width:auto;display:flex;gap:5px;background:#071b2be8;padding:6px;z-index:3';
flightBar.innerHTML='<button id="heliUp">▲ CLIMB</button><button id="heliDown">▼ DESCEND</button><button id="heliHold">HOVER</button><button id="heliCamera">COCKPIT</button>';
root.appendChild(flightBar);
let hCollective=0,hCameraReady=false;
function hHold(id,dir){
 const el=$(id);
 el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();hCollective=dir;el.setPointerCapture(e.pointerId)});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,()=>{if(hCollective===dir)hCollective=0});
}
hHold('heliUp',1);hHold('heliDown',-1);
$('heliHold').onclick=()=>{hState.speed=0;hState.vertical=0;hState.yawRate=0;joystick.x=joystick.y=0;nub.style.transform='translate(0,0)'};
$('heliCamera').onclick=()=>{$('view').value=view==='heli'?'cockpit':'heli';resetView($('view').value)};
$('view').insertAdjacentHTML('afterbegin','<option value="heli">🚁 Fly helicopter</option><option value="cockpit">🚁 Cockpit</option>');
function hFlight(dt,t){
 const flying=view==='heli'||view==='cockpit';
 flightHud.style.display=flying?'block':'none';flightBar.style.display=flying?'flex':'none';
 hInstrument.visible=view==='cockpit';hBody.visible=hCabin.visible=hCanopy.visible=view!=='cockpit';
 hRotor.rotation.y+=dt*33;tailSpin.rotation.x+=dt*39;
 hRed.visible=Math.sin(t*7)>0;hGreen.visible=Math.sin(t*4)>0;
 if(!flying)return;
 hState.yawRate=T.MathUtils.damp(hState.yawRate,joystick.x*1.6,3,dt);
 hState.heading+=hState.yawRate*dt;
 hState.speed=T.MathUtils.damp(hState.speed,joystick.y*25,1.55,dt);
 hState.vertical=T.MathUtils.damp(hState.vertical,hCollective*9,2.7,dt);
 hState.p.x-=Math.sin(hState.heading)*hState.speed*dt;
 hState.p.z-=Math.cos(hState.heading)*hState.speed*dt;
 hState.p.y+=hState.vertical*dt;
 hState.p.x=T.MathUtils.clamp(hState.p.x,-240,240);
 hState.p.z=T.MathUtils.clamp(hState.p.z,-240,240);
 const nearRoof=Math.abs(hState.p.x)<21&&Math.abs(hState.p.z)<14;
 hState.p.y=T.MathUtils.clamp(hState.p.y,nearRoof?23:5,130);
 helicopter.position.copy(hState.p);helicopter.rotation.y=hState.heading;
 heliTilt.rotation.z=T.MathUtils.damp(heliTilt.rotation.z,-joystick.x*.16,3.6,dt);
 heliTilt.rotation.x=T.MathUtils.damp(heliTilt.rotation.x,-joystick.y*.15,3.6,dt);
 const heading=String(Math.round((360+hState.heading*180/Math.PI)%360)).padStart(3,'0');
 flightHud.textContent='H-07  •  NIMBUS AIR\nALT '+String(Math.round(hState.p.y)).padStart(3,'0')+' m  SPD '+String(Math.round(Math.abs(hState.speed)*3.6)).padStart(3,'0')+' km/h\nHDG '+heading+'°  '+(hCollective>0?'CLIMB':hCollective<0?'DESCENT':Math.abs(hState.speed)>1?'CRUISE':'HOVER');
}
function hCamera(dt){
 const a=hState.heading+ang;
 if(view==='cockpit'){
  const eyePoint=helicopter.localToWorld(new T.Vector3(0,.5,-1.22));
  camera.position.copy(eyePoint);
  camera.lookAt(eyePoint.clone().add(new T.Vector3(-Math.sin(a)*Math.cos(pitch),Math.sin(pitch),-Math.cos(a)*Math.cos(pitch)).multiplyScalar(30)));
 } else {
  const wanted=hState.p.clone().add(new T.Vector3(Math.sin(a)*distance*Math.cos(pitch),3+Math.sin(pitch)*distance,Math.cos(a)*distance*Math.cos(pitch)));
  if(!hCameraReady){camera.position.copy(wanted);hCameraReady=true}
  camera.position.lerp(wanted,1-Math.exp(-dt*4.6));
  camera.lookAt(hState.p.clone().add(new T.Vector3(0,1.1,0)));
 }
}

// Lights and emergency.
const sun=new T.DirectionalLight(0xffdfbd,3.1);sun.position.set(-37,66,37);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;sun.shadow.camera.far=180;sun.shadow.normalBias=.04;scene.add(sun);
const hemi=new T.HemisphereLight(0xd9edff,0x43565a,1.75);scene.add(hemi);
const internal=new T.PointLight(0xffd3a9,28,28,2);internal.position.set(0,15,0);scene.add(internal);
const warning=new T.PointLight(0xff2637,0,27,2);warning.position.set(0,15,6);scene.add(warning);
// Rainstorm
const N=mobile?350:750,coords=new Float32Array(N*3),seed=new Float32Array(N);for(let i=0;i<N;i++){coords[3*i]=(Math.random()-.5)*100;coords[3*i+1]=Math.random()*50;coords[3*i+2]=(Math.random()-.5)*100;seed[i]=Math.random()}
const rg=new T.BufferGeometry();rg.setAttribute('position',new T.BufferAttribute(coords,3));rg.setAttribute('seed',new T.BufferAttribute(seed,1));
const rm=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`attribute float seed;uniform float time;varying float alpha;void main(){vec3 p=position;p.y=mod(p.y-time*(25.+seed*15.)+1000.,53.)-4.;alpha=.24+seed*.35;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(65./(-gl_Position.z),1.,3.);}`,fragmentShader:`varying float alpha;void main(){gl_FragColor=vec4(.7,.88,1.,alpha);}`});const rain=new T.Points(rg,rm);scene.add(rain);rain.visible=false;
let view='tour',weather='sunset',alarm=false,quality=0,ang=.6,pitch=.16,distance=52,focus=new T.Vector3(2,15,-1),eye=new T.Vector3(-1,13.5,0),pointers=new Map(),pinch=0;
const joystick={x:0,y:0};let joyId=null;
function resetView(v){view=v;const f=v==='heli'||v==='cockpit';root.classList.toggle('walk',v==='walk'||f);$('hint').textContent=f?'Stick: yaw + speed · Swipe: camera · CLIMB/DESCEND':v==='walk'?'Left thumb: walk · Right thumb: look':'Drag: orbit · Pinch: zoom';if(f){ang=0;pitch=v==='cockpit'?.02:.14;distance=17;hCameraReady=false;}if(v==='orbit'){focus.set(3,15,-1);ang=.6;pitch=.18;distance=47}if(v==='sea'){focus.set(8,3,15);ang=.6;pitch=.08;distance=24}if(v==='walk'){eye.set(-1,13.5,0);ang=0;pitch=0}if(v==='tour')focus.set(2,15,-1)}
function setWeather(w){weather=w;let presets={sunset:['#286486','#ebbea2','#123d55','#8ac4c2',3.1,1.75,1.12],day:['#2179a6','#b9e0eb','#175b72','#b4dbe0',3.55,2.25,1.1],storm:['#101f32','#566978','#0a2b3e','#668b9d',.36,.75,.94],night:['#061528','#1c3b5a','#081a32','#507094',.08,.45,1.04]};let a=presets[w];skyMat.uniforms.high.value.set(a[0]);skyMat.uniforms.low.value.set(a[1]);skyMat.uniforms.night.value=w==='night'?1:0;seaMat.uniforms.a.value.set(a[2]);seaMat.uniforms.b.value.set(a[3]);seaMat.uniforms.storm.value=w==='storm'?1:0;sun.intensity=a[4];hemi.intensity=a[5];ren.toneMappingExposure=a[6];scene.fog=new T.FogExp2(a[1],w==='storm'?.008:.004);rain.visible=w==='storm'}
function resize(){let w=Math.max(1,root.clientWidth),h=Math.max(1,root.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();ren.setSize(w,h,false)}
function setQuality(){let values=[mobile?1:1.3,.75,1.1,1.55];quality=(quality+1)%4;ren.setPixelRatio(Math.min(values[quality],window.devicePixelRatio||2));$('quality').textContent=['Quality: Auto','Performance','Balanced','High'][quality];resize()}
$('view').onchange=e=>resetView(e.target.value);$('weather').onchange=e=>setWeather(e.target.value);$('alarm').onclick=()=>{alarm=!alarm;$('alarm').textContent=alarm?'End emergency':'Emergency'};$('quality').onclick=setQuality;
canvas.addEventListener('pointerdown',e=>{if(view==='tour'){$('view').value='orbit';resetView('orbit')}canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY])});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;let old=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);let p=[...pointers.values()];if(p.length>=2&&view!=='walk'){let d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);if(pinch)distance=T.MathUtils.clamp(distance-(d-pinch)*.09,4,95);pinch=d}else{ang-=(e.clientX-old[0])*.0055;pitch=T.MathUtils.clamp(pitch+(e.clientY-old[1])*.0045,-1.1,1.1)}});
for(const ev of ['pointerup','pointercancel'])canvas.addEventListener(ev,e=>{pointers.delete(e.pointerId);pinch=0});
const pad=$('pad'),nub=pad.firstElementChild;
function joy(e){const r=pad.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.max(1,Math.hypot(x,y)),k=Math.min(30,d)/d;joystick.x=x*k/30;joystick.y=-y*k/30;nub.style.transform=`translate(${joystick.x*30}px,${-joystick.y*30}px)`}
pad.onpointerdown=e=>{e.preventDefault();e.stopPropagation();joyId=e.pointerId;pad.setPointerCapture(e.pointerId);joy(e)};pad.onpointermove=e=>{if(e.pointerId===joyId)joy(e)};pad.onpointerup=pad.onpointercancel=()=>{joyId=null;joystick.x=joystick.y=0;nub.style.transform='translate(0,0)'};
$('view').value='heli';resetView('heli');
ren.setPixelRatio(mobile?1:1.3);resize();const observer=new ResizeObserver(resize);observer.observe(root);setWeather('sunset');loader.style.opacity='0';setTimeout(()=>loader.style.display='none',650);
let last=performance.now(),lastF=last,frames=0;
function animate(){if(!active||!root.isConnected)return;requestAnimationFrame(animate);let now=performance.now(),dt=Math.min(.06,(now-last)/1000),t=clock.getElapsedTime();last=now;skyMat.uniforms.time.value=t;seaMat.uniforms.time.value=t;rm.uniforms.time.value=t;auroraMat.uniforms.time.value=t;
scout.position.set(9+Math.sin(t*.22)*20,31+Math.sin(t*.65)*2,7+Math.cos(t*.22)*12);
scout.rotation.y=-t*.22;
scout.rotation.z=Math.sin(t*.85)*.09;
for(let i=0;i<landingRings.length;i++)landingRings[i].rotation.z=t*.17*(i%2?1:-1);
auroraGroup.rotation.y=t*.08;auroraGroup.position.y=27+Math.sin(t*.65)*1.2;auroraCrystal.rotation.y=t*.65;for(let i=0;i<auroraRings.length;i++)auroraRings[i].rotation.z+=dt*.13*(i%2?1:-1);for(let i=0;i<v5Lights.length;i++)v5Lights[i].visible=Math.sin(t*3+i*.7)>.3;radar.rotation.y=t*.35;drone.position.set(7+Math.sin(t*.34)*13,25+Math.sin(t*.7),3+Math.cos(t*.34)*9);drone.rotation.y=-t*.34;scanRing.rotation.z=Math.sin(t*.27)*.16;innerRing.rotation.z=-t*.15;vessel.position.set(-12+Math.sin(t*.14)*18,-.05+Math.sin(t*1.2)*.14,36+Math.cos(t*.14)*9);vessel.rotation.y=t*.14+.6;for(let i=0;i<markers.length;i++)markers[i].position.y=-.4+Math.sin(t*1.1+i)*.15;warning.intensity=alarm&&Math.sin(t*10)>0?25:0;
hFlight(dt,t);
if(view==='heli'||view==='cockpit'){hCamera(dt)}
else if(view==='tour'){let a=t*.06+.6;camera.position.set(Math.sin(a)*52,23+Math.sin(t*.2)*3,Math.cos(a)*50+3);camera.lookAt(8,15,-1)}
else if(view==='walk'){let f=joystick.y*dt*5,s=joystick.x*dt*5;eye.x=T.MathUtils.clamp(eye.x+Math.sin(ang)*f+Math.cos(ang)*s,-13,12);eye.z=T.MathUtils.clamp(eye.z+Math.cos(ang)*f-Math.sin(ang)*s,-10,5);camera.position.copy(eye);camera.lookAt(eye.clone().add(new T.Vector3(Math.sin(ang)*Math.cos(pitch),Math.sin(pitch),Math.cos(ang)*Math.cos(pitch))))}
else{camera.position.set(focus.x+Math.sin(ang)*distance*Math.cos(pitch),Math.max(.3,focus.y+Math.sin(pitch)*distance),focus.z+Math.cos(ang)*distance*Math.cos(pitch));camera.lookAt(focus)}
ren.render(scene,camera);frames++;if(now-lastF>1500){$('fps').textContent=Math.round(frames*1000/(now-lastF))+' FPS • HELICOPTER';frames=0;lastF=now}}
requestAnimationFrame(animate);
return {dispose(){active=false;observer.disconnect();flightHud.remove();flightBar.remove();ren.dispose();}};
}catch(e){console.error(e);$('load').querySelector('span').textContent='3D VIEW UNAVAILABLE IN THIS BROWSER';$('fps').textContent='ERROR';throw e;}
}
