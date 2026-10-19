import * as THREE from 'three';
import{appearance,MODELS,SHIP_SCALE}from'./ship-catalog.js?v=163';
import{pilotRig}from'./pilot-view-v166.js?v=167';
import{fleetEdition,fleetFinish}from'./fleet-designs-v162.js?v=163';
import{fleetPaint}from'./fleet-paint-v163.js?v=163';
// Top-only curved interior coaming; never render the hidden lower half of
// a sealed exterior loft at arm's length from the pilot eye.
function fairingCanopySurface(stations,steps=20){
 const p=[],uv=[],ix=[];
 for(let r=0;r<stations.length;r++){
  const [z,rx,ry,cy]=stations[r];
  for(let k=0;k<=steps;k++){
   const a=Math.PI*k/steps;
   p.push(rx*Math.cos(a),cy+ry*Math.sin(a),z);
   uv.push(k/steps,r/(stations.length-1));
  }
 }
 for(let r=0;r<stations.length-1;r++)for(let k=0;k<steps;k++){
  const a=r*(steps+1)+k,b=a+steps+1;
  ix.push(a,a+1,b,a+1,b+1,b);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(ix);geo.computeVertexNormals();return geo;
}
// Lower semicircular underside running from the actual aft nose ring into
// the cockpit tub. It does not occupy the pilot's forward sightline.
function realNoseUnderside(stations,steps=20){
 const pts=[],uv=[],ix=[];
 for(let j=0;j<stations.length;j++){const [z,rx,ry,cy]=stations[j];
  for(let k=0;k<=steps;k++){const a=Math.PI+k/steps*Math.PI;
   pts.push(rx*Math.cos(a),cy+ry*Math.sin(a),z);uv.push(k/steps,j/(stations.length-1));}}
 for(let j=0;j<stations.length-1;j++)for(let k=0;k<steps;k++){
  const a=j*(steps+1)+k,b=a+steps+1;ix.push(a,b,a+1,a+1,b,b+1);}
 const [z,,,cy]=stations.at(-1),center=pts.length/3;
 pts.push(0,cy,z);uv.push(.5,1);const start=(stations.length-1)*(steps+1);
 for(let k=0;k<steps;k++)ix.push(center,start+k+1,start+k);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
// Factory-specific accent pinstripes follow the original loft station rings.
// Dark upper-facing inner deck closes the gap that a bottom-only shroud
// cannot cover from an elevated pilot eyepoint. The deck drops rapidly
// beneath the nose, then disappears into the seated dashboard enclosure.
function noseInteriorDeck(stations){
 const p=[],uv=[],ix=[];
 for(let j=0;j<stations.length;j++){
  const [z,halfWidth,y]=stations[j];
  p.push(-halfWidth,y,z,halfWidth,y,z);uv.push(0,j/(stations.length-1),1,j/(stations.length-1));
 }
 for(let j=0;j<stations.length-1;j++){
  const a=j*2,b=a+2;ix.push(a,a+1,b,b,a+1,b+1);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setIndex(ix);g.computeVertexNormals();return g;
}
function noseLiveryLines(geometry,color){
 const positions=geometry.attributes.position,rows=new Map();
 for(let i=0;i<positions.count;i++){const z=positions.getZ(i),key=Math.round(z*10000),x=positions.getX(i),y=positions.getY(i);
  let r=rows.get(key);if(!r){r={z,rx:0,low:Infinity,high:-Infinity};rows.set(key,r);}
  r.rx=Math.max(r.rx,Math.abs(x));r.low=Math.min(r.low,y);r.high=Math.max(r.high,y);
 }
 const rings=[...rows.values()].sort((a,b)=>a.z-b.z).filter(r=>r.rx>.007);
 if(rings.length<3)return[];
 return [-1,1].map(side=>{
  const pts=rings.map(r=>new THREE.Vector3(side*r.rx*.44,(r.low+r.high)/2+(r.high-r.low)*.4515+.006,r.z));
  const line=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),Math.max(12,pts.length*5),.0035,5,false),
   new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,toneMapped:false}));
  line.name='factory livery / nose accent';line.renderOrder=2;return line;
 });
}
function glassPatch(radius,center,span,height,y,uv){const p=[],t=[],ix=[],n=24;for(let j=0;j<=1;j++)for(let i=0;i<=n;i++){const a=center+(i/n-.5)*span;p.push(Math.sin(a)*radius,y+(j-.5)*height,-Math.cos(a)*radius);t.push(uv[0]+i/n*uv[2],uv[1]+j*uv[3]);}for(let i=0;i<n;i++)ix.push(i,i+1,i+n+1,i+1,i+n+2,i+n+1);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(t,2));g.setIndex(ix);g.computeVertexNormals();return g;}
export function createCockpit(custom={},model=0,color=0x72efff,environment=null){
 const a=appearance(custom),gold=color===0xffbd55,chrome=color===0xb5f8ee,scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(60,1,.05,10),root=new THREE.Group();scene.add(root);
 scene.environment=environment;scene.environmentIntensity=1.32;
 const tone=(gold||chrome)?0xf0ffff:[0x72efff,0xffbd78,0xa6ffcb][a.instrument],shell=new THREE.MeshStandardMaterial({color:[0x20313f,0x444b53,0x342b24][a.cabin],roughness:a.cabin===2?.88:.52,metalness:a.cabin===2?0:.5}),rubber=new THREE.MeshStandardMaterial({color:0x090e14,roughness:.9}),trim=new THREE.MeshStandardMaterial({color:tone,emissive:tone,emissiveIntensity:.18,roughness:.6,metalness:.25});
 if(gold||chrome){trim.color.setHex(0xf3ffff);trim.emissive.setHex(0xffffff);trim.emissiveIntensity=.45;}
 const metalInset=new THREE.MeshStandardMaterial({color:gold?0xb88b31:chrome?0xc6e4f5:0x526f80,metalness:.94,roughness:gold?.22:.32}),fineLight=new THREE.MeshBasicMaterial({color:gold||chrome?0xf4ffff:tone,toneMapped:false});
 const mesh=(geo,mat,x,y,z,parent=root)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m};
 scene.add(new THREE.HemisphereLight(0xb9d9ec,0x14202a,2));const key=new THREE.DirectionalLight(0xc5e4ff,3);key.position.set(-2,3,2);scene.add(key);

 // Bevelled cowling and curved canopy ribs keep the forward view open.
 const outline=new THREE.Shape();outline.moveTo(-1.16,-1.18);outline.lineTo(1.16,-1.18);outline.lineTo(1.1,-.97);outline.quadraticCurveTo(.72,-.91,.42,-1.05);outline.quadraticCurveTo(0,-1.13,-.42,-1.05);outline.quadraticCurveTo(-.72,-.91,-1.1,-.97);outline.closePath();
 mesh(new THREE.ExtrudeGeometry(outline,{depth:.14,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:3,steps:1}),shell,0,0,-1.8);
 const rib=(points,radius,material)=>{const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(new THREE.TubeGeometry(path,24,radius,8,false),material,0,0,0)};
 for(const side of[-1,1]){
 rib([[side*1.13,-1.05,-1.75],[side*1.28,-.5,-2.05],[side*1.27,.22,-2.42],[side*1.14,.88,-2.62]],.027,shell);
 rib([[side*1.12,-1.01,-1.72],[side*1.27,-.51,-2.03],[side*1.26,.2,-2.4]],.006,trim);
 const sill=mesh(new THREE.CapsuleGeometry(.055,.62,4,12),shell,side*1.05,-.91,-1.38);sill.rotation.x=Math.PI/2;sill.rotation.z=side*.13;
 for(let i=0;i<3;i++)mesh(new THREE.BoxGeometry(.045,.008,.12),rubber,side*(.89+i*.06),-.89,-1.48);
 }
 rib([[-1.14,.88,-2.62],[-.65,1.03,-2.85],[0,1.07,-2.92],[.65,1.03,-2.85],[1.14,.88,-2.62]],.022,shell);
 rib([[-1.11,.855,-2.605],[-.62,1.005,-2.835],[0,1.045,-2.90],[.62,1.005,-2.835],[1.11,.855,-2.605]],.007,fineLight);
 for(const side of[-1,1]){
  const lip=mesh(new THREE.BoxGeometry(.36,.035,.43),metalInset,side*.91,-1.04,-1.55);lip.rotation.z=-side*.15;
  for(let i=0;i<3;i++)mesh(new THREE.BoxGeometry(.09,.008,.025),fineLight,side*(.80+i*.07),-.99,-1.37);
  rib([[side*.56,-1.05,-1.85],[side*.72,-.94,-1.88],[side*.97,-.9,-1.79]],.008,fineLight);
 }
 const centreDash=mesh(new THREE.BoxGeometry(.42,.11,.36),shell,0,-1.08,-1.78);centreDash.rotation.x=-.15;
 const dashGlass=mesh(new THREE.BoxGeometry(.32,.009,.17),metalInset,0,-1.013,-1.79);
 for(let i=-2;i<=2;i++)mesh(new THREE.BoxGeometry(.035,.011,.05),fineLight,i*.064,-1.006,-1.77);
 // Edge-only windshield sheen: no opaque/tinted pane over the racing line.
 const glass=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{tint:{value:new THREE.Color(tone)},time:{value:0},boost:{value:0}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;uniform vec3 tint;uniform float time;uniform float boost;void main(){float e=pow(abs(v.x-.5)*2.,12.);float top=pow(v.y,18.);float drift=sin(time*.14)*.04;float stripe=exp(-pow((v.x+.18*v.y-.83+drift)*47.,2.))*smoothstep(.15,.9,v.y);float horizon=exp(-pow((v.y-.77+sin(v.x*6.+time*.18)*.03)*20.,2.))*.007;float rim=e*.027+top*.019;float a=rim+stripe*(.014+boost*.005)+horizon;a*=smoothstep(.04,.23,v.y);gl_FragColor=vec4(mix(tint,vec3(.73,.88,.98),.67),min(.052,a));}'});
 
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=768;const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;texture.anisotropy=4;
 const hud=new THREE.Group();scene.add(hud);const hudMaterial=new THREE.MeshBasicMaterial({map:texture,toneMapped:false,transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide});const windshield=new THREE.Mesh(glassPatch(1.84,0,1.18,1.86,0,[0,0,1,1]),glass);hud.add(windshield);const panels=[];for(const[angle,y,uv]of[[-.19,.32,[0,.5,.5,.5]],[.19,.32,[.5,.5,.5,.5]],[-.19,-.48,[0,0,.5,.5]],[.19,-.48,[.5,0,.5,.5]]]){const panel=new THREE.Mesh(glassPatch(1.8,angle,.22,.297,y,uv),hudMaterial);panel.renderOrder=3;hud.add(panel);panels.push(panel);}
 // Sculpted side consoles, layered cockpit lining and visible forward deck.
 for(const side of[-1,1]){const console=mesh(new THREE.BoxGeometry(.36,.3,.88),shell,side*.91,-.79,-1.24);console.rotation.z=-side*.2;console.rotation.y=side*.1;const cushion=mesh(new THREE.CapsuleGeometry(.085,.43,4,12),rubber,side*.81,-.66,-1.04);cushion.rotation.x=Math.PI/2;for(let k=0;k<5;k++){const sw=mesh(new THREE.BoxGeometry(.018,.018,.055),trim,side*(.77+k*.037),-.62,-1.48);sw.rotation.z=side*.18;}}
 const deck=mesh(new THREE.SphereGeometry(1,32,12,0,Math.PI*2,0,Math.PI/2),shell,0,-1.34,-1.72);deck.scale.set(1.24,.4,.58);deck.rotation.x=Math.PI;
 const stick=new THREE.Group();stick.position.set(-.67,-.71,-1.5);root.add(stick);
 mesh(new THREE.SphereGeometry(.1,12,8),rubber,0,0,0,stick);mesh(new THREE.CylinderGeometry(.025,.03,.2,10),shell,0,.09,0,stick);
 const grip=mesh(a.stick===1?new THREE.BoxGeometry(.23,.06,.055):new THREE.CapsuleGeometry(.035,.075,3,8),rubber,0,.2,0,stick);if(a.stick!==1)grip.rotation.z=.18;
 if(a.stick===2)for(const side of[-1,1])mesh(new THREE.BoxGeometry(.035,.1,.045),trim,side*.065,.19,0,stick);
 const rightStick=stick.clone();rightStick.position.x=-stick.position.x;root.add(rightStick);
 // Each cockpit is now built around its actual chassis identity: restrained
 // diegetic hardware placed below eye level, never UI boxes across the view.
 const cockpitDesign=['TWIN NACELLE','TRIDENT','STEALTH','ORGANIC','INDUSTRIAL','SPEAR'][model];
 const dashDetails=new THREE.Group();dashDetails.name='cockpit-v120-'+cockpitDesign;root.add(dashDetails);
 const modelPlate=(sx,sy,sz,x,y,z,mat=shell)=>mesh(new THREE.BoxGeometry(sx,sy,sz),mat,x,y,z,dashDetails);
 if(model===0){
  for(const side of[-1,1]){
   modelPlate(.22,.07,.42,side*.53,-1.025,-1.66,metalInset);
   modelPlate(.18,.018,.18,side*.53,-.984,-1.64,fineLight);
   modelPlate(.032,.038,.29,side*.68,-.99,-1.80,rubber);
  }
 }else if(model===1){
  for(const side of[-1,1]){
   const prong=modelPlate(.23,.055,.53,side*.58,-1.035,-1.79,shell);prong.rotation.y=-side*.34;
   const seam=modelPlate(.029,.018,.35,side*.62,-.991,-1.83,fineLight);seam.rotation.y=-side*.34;
  }
  modelPlate(.17,.028,.27,0,-1.005,-1.93,metalInset);
 }else if(model===2){
  for(const side of[-1,1]){
   const eyebrow=modelPlate(.40,.055,.21,side*.58,-1.04,-1.93,metalInset);eyebrow.rotation.y=side*.29;
   const slot=modelPlate(.24,.012,.041,side*.58,-1.003,-1.87,fineLight);slot.rotation.y=side*.29;
  }
 }else if(model===3){
  for(const side of[-1,1]){
   const wingConsole=mesh(new THREE.CapsuleGeometry(.063,.44,4,10),shell,side*.62,-1.005,-1.72,dashDetails);
   wingConsole.rotation.x=Math.PI/2;wingConsole.rotation.z=side*.21;
   modelPlate(.18,.018,.14,side*.59,-.979,-1.66,fineLight);
  }
 }else if(model===4){
  for(const side of[-1,1]){
   modelPlate(.30,.095,.51,side*.63,-1.00,-1.73,metalInset);
   modelPlate(.20,.02,.27,side*.63,-.936,-1.73,rubber);
   for(let k=0;k<3;k++)modelPlate(.11,.011,.014,side*.62,-.921,-1.81+k*.076,fineLight);
  }
 }else{
  for(const side of[-1,1]){
   const blade=modelPlate(.125,.085,.62,side*.49,-1.035,-1.95,metalInset);blade.rotation.y=side*.20;
   const stripe=modelPlate(.019,.019,.49,side*.48,-.98,-1.95,fineLight);stripe.rotation.y=side*.20;
  }
  modelPlate(.12,.034,.42,0,-1.01,-2.02,metalInset);
 }

 // V167: physically enclosed pilot tub, not a transparent dashboard floating
 // in space. Camera-local surfaces are solid and use the selected edition's
 // cockpit trim. Geometry deliberately stays outside the central windshield.
 const tub=new THREE.Group();tub.name='FLIGHTWORKS / sealed seating module';root.add(tub);
 const tubMesh=(geometry,material,x,y,z)=>{
  const m=mesh(geometry,material,x,y,z,tub);m.receiveShadow=false;return m;
 };
 const inside=new THREE.Shape();
 inside.moveTo(-1.42,-1.55);inside.lineTo(1.42,-1.55);
 inside.lineTo(1.27,-.65);inside.lineTo(.94,-.77);
 inside.quadraticCurveTo(.45,-.82,0,-.82);
 inside.quadraticCurveTo(-.45,-.82,-.94,-.77);
 inside.lineTo(-1.27,-.65);inside.closePath();
 // This opaque seat-bulkhead closes the hole visible in the V166 screenshot.
 // It sits behind the instrument deck in apparent depth, masking the cockpit
 // opening with actual interior bodywork.
 const seatBulkhead=tubMesh(new THREE.ExtrudeGeometry(inside,{depth:.14,bevelEnabled:true,bevelSize:.022,bevelThickness:.015,bevelSegments:2}),shell,0,0,-1.32);
 seatBulkhead.name='opaque forward cabin bulkhead';
 // Actual near-field inner cockpit brow: closes the sightline into the
 // fuselage at the pilot's feet. Unlike an overlay black bar it is a solid
 // curved interior wall at the seat eyepoint, in the SAME rendered 3D scene
 // and depth pass as the matching ship nose and the seat.
 const nearWallShape=new THREE.Shape();
 nearWallShape.moveTo(-.99,-1.02);nearWallShape.lineTo(.99,-1.02);
 nearWallShape.lineTo(.91,-.195);nearWallShape.lineTo(.58,-.232);
 nearWallShape.quadraticCurveTo(0,-.273,-.58,-.232);
 nearWallShape.lineTo(-.91,-.195);nearWallShape.closePath();
 const nearWall=tubMesh(new THREE.ExtrudeGeometry(nearWallShape,{depth:.038,bevelEnabled:true,bevelSize:.009,bevelThickness:.007,bevelSegments:2}),shell,0,0,-.385);
 nearWall.name='solid eye-level cockpit interior sill';
 const paddedEdge=tubMesh(new THREE.BoxGeometry(.78,.025,.038),rubber,0,-.256,-.344);
 paddedEdge.name='cockpit forward padded binnacle';
 for(const side of[-1,1]){
  const knee=tubMesh(new THREE.BoxGeometry(.19,.31,.26),shell,side*.65,-.43,-.40);
  knee.rotation.z=side*.24;knee.name='inner knee-panel cowling';
  const joint=tubMesh(new THREE.BoxGeometry(.035,.25,.05),metalInset,side*.53,-.45,-.36);
  joint.rotation.z=side*.24;
 }
 const lowerDeck=tubMesh(new THREE.BoxGeometry(2.28,.10,.94),rubber,0,-1.29,-.98);lowerDeck.name='nontransparent enclosed cabin floor';
 // Side-wall panels connect the instrument board to the seat rather than
 // leaving visible open gaps through the hull.
 for(const side of[-1,1]){
  const wall=tubMesh(new THREE.BoxGeometry(.16,.60,1.42),shell,side*1.13,-.83,-.80);
  wall.rotation.z=side*.11;wall.name='side cockpit inner hull';
  const arm=tubMesh(new THREE.BoxGeometry(.32,.15,.85),metalInset,side*.91,-.94,-.83);
  arm.rotation.z=-side*.09;
  const cushion=tubMesh(new THREE.CapsuleGeometry(.095,.43,3,8),rubber,side*.69,-1.13,-.46);
  cushion.rotation.x=Math.PI/2;cushion.name='seat side bolster';
  const harness=tubMesh(new THREE.BoxGeometry(.055,.27,.22),trim,side*.48,-1.13,-.39);
  harness.rotation.z=side*.24;
  const footwell=tubMesh(new THREE.BoxGeometry(.42,.035,.46),metalInset,side*.50,-1.305,-1.39);
  footwell.rotation.x=-.12;
  for(let i=0;i<3;i++)tubMesh(new THREE.BoxGeometry(.12,.008,.016),rubber,side*.50,-1.278,-1.55+i*.105);
 }
 // Seat's front lip and central structural sill are visible from the pilot
 // eyepoint; the remainder of the seat is underneath and behind the viewer.
 const seatLip=tubMesh(new THREE.BoxGeometry(.80,.13,.33),shell,0,-1.25,-.29);
 seatLip.name='moulded seat base';seatLip.rotation.x=.10;
 const seatPadding=tubMesh(new THREE.BoxGeometry(.74,.047,.29),rubber,0,-1.18,-.26);
 seatPadding.name='pilot seat cushion';
 const cabinCentre=tubMesh(new THREE.BoxGeometry(.29,.10,.67),shell,0,-1.20,-.87);
 cabinCentre.name='central cockpit tunnel';
 const closure=tubMesh(new THREE.BoxGeometry(.52,.13,.43),metalInset,0,-1.09,-1.39);
 closure.rotation.x=-.08;closure.name='lower instrument shroud';
 // Separate camera-mounted authoring branch for the true nose of the current
 // ship. It shares original mesh profiles but NOT world transform or shake.
 const noseCameraRoot=new THREE.Group();noseCameraRoot.name='true-nose cockpit camera fixture';scene.add(noseCameraRoot);
 // True pilot-eye view: the dashboard, canopy frame and side consoles remain
 // present, but NEVER render a second exterior airframe in the cockpit scene.
 // The old forebody clone showed the craft's entire front fuselage through
 // the windscreen, blocked the tunnel and doubled expensive 3D materials.
 // The real gameplay ship is already hidden in first-person by race-engine.
 const forwardView=new THREE.Group();forwardView.name='v165 / clear pilot windscreen';root.add(forwardView);
 // Shallow instrument coaming below the horizon is physically part of the
 // dash, not a false exterior ship nose protruding into the windshield.
 const coaming=mesh(new THREE.BoxGeometry(.44,.035,.075),metalInset,0,-1.015,-1.93,forwardView);
 coaming.rotation.x=-.15;
const button=new THREE.Group();scene.add(button);const base=mesh(new THREE.CylinderGeometry(.14,.16,.045,24),rubber,0,0,0,button);base.rotation.x=Math.PI/2;
 const cap=mesh(new THREE.CylinderGeometry(.112,.125,.028,24),trim,0,0,.036,button);cap.rotation.x=Math.PI/2;
 const ring=mesh(new THREE.TorusGeometry(.135,.009,6,32),new THREE.MeshBasicMaterial({color:tone,toneMapped:false}),0,0,.04,button);
 // Fine cockpit detailing is fixed geometry: no extra per-frame meshes or lights.
 const edgeGeo=new THREE.BoxGeometry(.22,.018,.012),edgeMat=new THREE.MeshBasicMaterial({color:tone,toneMapped:false});
 for(const side of[-1,1]){
   const screen=mesh(new THREE.BoxGeometry(.31,.16,.02),rubber,side*.80,-.63,-1.60);
   screen.rotation.z=-side*.19;
   const insert=mesh(new THREE.PlaneGeometry(.263,.112),new THREE.MeshBasicMaterial({color:0x0b2833,transparent:true,opacity:.85,side:THREE.DoubleSide}),side*.80,-.625,-1.585);insert.rotation.z=-side*.19;
   for(let k=0;k<3;k++){const bar=mesh(edgeGeo,edgeMat,side*.80,-.66+k*.036,-1.574);bar.scale.x=.36+k*.24;bar.rotation.z=-side*.19;}
   for(let k=0;k<3;k++){const rivet=mesh(new THREE.SphereGeometry(.009,6,4),trim,side*(.97+k*.055),-.90,-1.36);rivet.scale.y=.5;}
 }
 // Sparse free-standing lead reticle: forward space remains unobstructed.
 const sightPoints=[-.24,-.035,-.12,-.035,.12,-.035,.24,-.035,0,.085,0,.145,0,-.11,0,-.17];
 const sightGeo=new THREE.BufferGeometry();const positions=[];for(let i=0;i<sightPoints.length;i+=2)positions.push(sightPoints[i],sightPoints[i+1],-1.72);sightGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const sight=new THREE.LineSegments(sightGeo,new THREE.LineBasicMaterial({color:tone,transparent:true,opacity:.53,depthTest:false}));sight.renderOrder=7;hud.add(sight);
 const result={scene,camera,root,hud,panels,stick,rightStick,forwardView,tub,noseCameraRoot,noseMeshes:[],noseFairing:null,noseBelly:null,button,cap,ring,trim,canvas,ctx,texture,custom:a,model,lastPaint:-1,pitch:0,roll:0,scratch:new THREE.Vector3(),viewport:[],signature:''};
 if(typeof window!=='undefined'&&location.search.includes('cockpitqa=1')){
  window.__shiftlineCockpitQA={version:165,model,hasExteriorClone:false,interiorParts:root.children.length,
   windshieldClear:true,view:'pilot-eye',forwardDetail:forwardView.children.length,cabinClosed:true,
   lockedOverlay:true,seatBuilt:true};
 }
 return result;
}
// Build visible real ship sections from the EXACT original authored meshes
// once per race. Their local vertex/profile data and physically based paint
// match the elected factory edition; no synthetic triangle or fake front.
export function attachPilotAirframe(c,ship){
 for(const m of c.noseMeshes){m.removeFromParent();m.traverse(o=>{o.geometry?.dispose();
  if(o.material)for(const mat of Array.isArray(o.material)?o.material:[o.material])mat.dispose();
 });}
 c.noseMeshes=[];
 if(c.noseFairing){
  c.noseFairing.removeFromParent();c.noseFairing.geometry.dispose();
  c.noseFairing.material.dispose();c.noseFairing=null;
 }
 if(c.noseBelly){
  c.noseBelly.removeFromParent();
  c.noseBelly.traverse(o=>{o.geometry?.dispose();
   if(o.material)for(const mat of Array.isArray(o.material)?o.material:[o.material])mat.dispose();
  });
  c.noseBelly=null;
 }
 const rig=pilotRig(ship);
 if(!rig)return null;
 const original=rig.seat.parent;
 const design=fleetEdition(rig.model,{edition:rig.edition});
 const finish=fleetFinish(rig.model,{edition:rig.edition});
 const scale=new THREE.Vector3(SHIP_SCALE*original.scale.x,SHIP_SCALE*original.scale.y,SHIP_SCALE*original.scale.z);
 c.noseCameraRoot.position.set(-rig.eyeLocal[0]*scale.x,-rig.eyeLocal[1]*scale.y,-rig.eyeLocal[2]*scale.z);
 c.noseCameraRoot.scale.copy(scale);
 for(const source of rig.parts){
  // Recreate the ORIGINAL selected factory paint (including metallic,
  // chrome or pearlescent flake shader), then rebalance cockpit exposure.
  // V168's full-bright material clones appeared almost pure white.
  const mat=fleetPaint(design.body,rig.model,{edition:rig.edition});
  mat.name='pilot / '+design.name+' / '+finish;
  mat.color.setHex(design.body).multiplyScalar(.53);
  mat.metalness=finish==='chrome'?.70:finish==='metallic'?.52:.25;
  mat.roughness=finish==='chrome'?.32:finish==='metallic'?.39:.46;
  mat.clearcoat=finish==='chrome'?.65:.55;mat.envMapIntensity=.20;
  mat.userData.factoryBody=design.body;mat.userData.factoryFinish=finish;
  const copy=new THREE.Mesh(source.geometry.clone(),mat);
  copy.name='authentic pilot view / '+source.name;copy.position.copy(source.position);
  copy.quaternion.copy(source.quaternion);copy.scale.copy(source.scale);
  copy.castShadow=false;copy.receiveShadow=false;
  copy.frustumCulled=false;copy.userData.realForwardSection=true;
  if(source===rig.parts[0])for(const stripe of noseLiveryLines(copy.geometry,design.accent))copy.add(stripe);
  c.noseCameraRoot.add(copy);c.noseMeshes.push(copy);
 }
 // Interior-only transition using the actual nose station dimensions.
 // The retained tip remains the original external loft; its root edge now
 // continues into an enclosed, down-turned structural shroud instead of
 // terminating as a floating triangular sheet in front of the instruments.
 // Nothing here appears in chase view or affects collisions.
 const actual=rig.parts[0];
 actual.geometry.computeBoundingBox();
 const box=actual.geometry.boundingBox;
 const end=box.max.z,radius=Math.max(.075,Math.max(Math.abs(box.min.x),Math.abs(box.max.x)));
 // Fit the underside to the REAL last fuselage ring; keep the upper
 // factory-painted nose unchanged and close only the hollow lower half.
 const p=actual.geometry.attributes.position;let low=Infinity,high=-Infinity,rx=0;
 for(let i=0;i<p.count;i++)if(Math.abs(p.getZ(i)-end)<.0005){
  rx=Math.max(rx,Math.abs(p.getX(i)));low=Math.min(low,p.getY(i));high=Math.max(high,p.getY(i));
 }
 rx=Math.max(.05,rx);const cy=(low+high)/2,ry=(high-low)/2;
 const dark=new THREE.Color(design.secondary).lerp(new THREE.Color(design.body),.20);
 const bellyPaint=new THREE.MeshStandardMaterial({color:dark,metalness:.35,roughness:.71,envMapIntensity:.14,side:THREE.DoubleSide});
 const belly=new THREE.Mesh(realNoseUnderside([
  [end-.006,rx,ry,cy],[end+.05,rx*.99,ry*.93,cy-.030],
  [end+.133,rx*.95,ry*.77,cy-.079],[end+.236,rx*.87,ry*.48,cy-.137]
 ]),bellyPaint);
 belly.name='fitted sealed lower-nose / genuine factory profile';belly.castShadow=false;belly.receiveShadow=false;belly.frustumCulled=false;
 // This actual internal connecting panel is narrow and sits BELOW the
 // existing forward nose, rather than covering the tunnel like a fake hood.
 const innerDeck=new THREE.Mesh(noseInteriorDeck([
  [end-.008,rx*.70,cy+ry*.41],
  [end+.037,rx*.73,cy-.015],
  [end+.092,rx*.62,cy-.065],
  [end+.182,rx*.49,cy-.117],
  [end+.250,rx*.35,cy-.148]
 ]),new THREE.MeshStandardMaterial({
  color:dark.clone().lerp(new THREE.Color(0x101922),.28),
  metalness:.31,roughness:.79,envMapIntensity:.09,side:THREE.DoubleSide
 }));
 innerDeck.name='solid cockpit-to-nose interior bridge';
 innerDeck.castShadow=false;innerDeck.receiveShadow=false;innerDeck.frustumCulled=false;
 belly.add(innerDeck);
 c.noseCameraRoot.add(belly);c.noseBelly=belly;
 const innerStations=[[end-.004,radius,.122,cy],[end+.003,radius,.122,cy]];
 const fairingPaint=new THREE.MeshStandardMaterial({color:dark.clone().multiplyScalar(.85),metalness:.28,roughness:.78,envMapIntensity:.12,side:THREE.DoubleSide});
 // A narrow shaded crown finishes the end of the authentic fuselage.
 // The physical seating, cowling, consoles and stick mounts stay visible;
 // no full-width nose panel or artificial inner hull is drawn.
 const fairing=new THREE.Mesh(fairingCanopySurface(innerStations),fairingPaint);
 fairing.name='sealed pilot-side fuselage into seating compartment';
 fairing.castShadow=false;fairing.receiveShadow=false;
 fairing.frustumCulled=false;fairing.renderOrder=0;
 c.noseCameraRoot.add(fairing);c.noseFairing=fairing;
 c.noseCameraRoot.visible=true;
 if(typeof window!=='undefined'&&location.search.includes('cockpitqa=1')&&window.__shiftlineCockpitQA){
  window.__shiftlineCockpitQA.renderNoseInOverlay=true;
  window.__shiftlineCockpitQA.cameraLocked=true;
  window.__shiftlineCockpitQA.noseCount=c.noseMeshes.length;
  window.__shiftlineCockpitQA.cabinFairing=true;
  window.__shiftlineCockpitQA.undersideFilled=true;
  window.__shiftlineCockpitQA.factoryNose=design.name;
  window.__shiftlineCockpitQA.noseFinish=finish;
 }
 return {model:rig.model,edition:rig.edition,count:c.noseMeshes.length};
}
export function updateCockpit(c,dt,data,rect,width,height){
 c.hud.children[0].material.uniforms.time.value=data.time||0;c.hud.children[0].material.uniforms.boost.value=data.boost?1:0;const aspect=width/Math.max(1,height),fov=THREE.MathUtils.clamp(data.fov||78,66,88);
 if(Math.abs(c.camera.aspect-aspect)>.001||Math.abs(c.camera.fov-fov)>.15){c.camera.aspect=aspect;c.camera.fov=fov;c.camera.updateProjectionMatrix();}
 // Device aspect framing may differ, but SPEED/BOOST FOV is never allowed
 // to scale the instrument shell independently of the authentic nose.
 c.root.scale.x=THREE.MathUtils.clamp(aspect*1.30,.58,1.7);
 const fit=Math.min(1,aspect/.55);c.hud.scale.set(fit,fit,1);
 // The windshield frame, pilot seat and real forward ship are a single
 // camera-relative assembly. In particular DO NOT apply spring/sway to the
 // interior separately from the ship or the two will visibly slide apart.
 c.root.rotation.set(0,0,0);c.root.position.set(0,0,0);
 c.hud.rotation.set(0,0,0);
 const k=1-Math.exp(-Math.min(.1,Math.max(0,dt))*24);c.pitch+=(THREE.MathUtils.clamp((data.vertical||0)*.045,-.23,.23)-c.pitch)*k;c.roll+=(THREE.MathUtils.clamp(-(data.lateral||0)*.05,-.24,.24)-c.roll)*k;c.stick.rotation.set(c.pitch,0,c.roll);c.rightStick.rotation.set(c.pitch,0,c.roll);
 c.trim.emissiveIntensity=data.boost?.35:.12;c.cap.position.z=data.boost?.027:.036;c.ring.material.color.setHex(data.boost?0xe4fff5:[0x72efff,0xffbd78,0xa6ffcb][c.custom.instrument]);
 if(rect?.width&&rect?.height){c.camera.updateMatrixWorld();c.scratch.set((rect.left+rect.width/2)/width*2-1,1-(rect.top+rect.height/2)/height*2,.5).unproject(c.camera);c.scratch.multiplyScalar(-1.4/c.scratch.z);c.button.position.copy(c.scratch);const diameter=Math.min(rect.width,rect.height)/height*2*1.4*Math.tan(Math.PI/6);c.button.scale.setScalar(diameter/.3);}
 c.gaugeEnergy=(c.gaugeEnergy??(data.energy||0))+((data.energy||0)-(c.gaugeEnergy??(data.energy||0)))*(1-Math.exp(-Math.min(.1,dt)*15));const s=[Math.round(c.gaugeEnergy*2),Math.round(data.speed||0),Math.round(data.energy||0),!!data.boost,data.weapon||'FLIGHT',data.lock||'',data.ammo||'',Math.round(data.shield??60),Math.round(data.hull??100),data.cooling||''].join('|');if(s===c.signature||data.time-c.lastPaint<.085)return;c.signature=s;c.lastPaint=data.time;

 c.panels.forEach(p=>p.material.opacity=data.cooling?.8:.95);const x=c.ctx,w=1024,h=768,color=['#8be7f1','#ffc58d','#a9ffd1'][c.custom.instrument];x.clearRect(0,0,w,h);
 x.save();x.globalAlpha=.23;x.strokeStyle=color;x.lineWidth=2;x.beginPath();
 for(const [px,py,pw,ph] of [[18,16,575,262],[606,16,400,262],[18,550,550,194],[606,550,400,194]]){
  x.moveTo(px+22,py);x.lineTo(px,py);x.lineTo(px,py+ph);x.moveTo(px+pw-22,py);x.lineTo(px+pw,py);x.lineTo(px+pw,py+ph);}
 x.stroke();x.globalAlpha=.10;
 for(let i=0;i<7;i++){x.fillRect(16+i*57,265,24,2);x.fillRect(610+i*57,265,24,2);}
 x.restore();x.shadowColor=color;x.shadowBlur=4;x.fillStyle=color;x.textAlign='left';x.font='500 38px Arial, sans-serif';x.fillText('SPEED',36,58);x.font='500 104px Arial, sans-serif';x.fillText(String(Math.round(data.speed||0)),32,174);x.font='32px Arial, sans-serif';x.fillText('KM/H',36,215);
 x.textAlign='right';x.font='500 38px Arial, sans-serif';x.fillText('BOOST',988,58);x.font='500 88px Arial, sans-serif';x.fillText(Math.round(data.energy||0)+'%',988,154);
 x.lineWidth=4;x.strokeStyle=color;for(let i=0;i<20;i++){x.globalAlpha=i<c.gaugeEnergy/5?.9:.18;x.beginPath();x.moveTo(630+i*18,189);x.lineTo(630+i*18,205);x.stroke();}x.globalAlpha=1;x.font='30px Arial, sans-serif';if(data.boost)x.fillText('ENGAGED',988,247);
 x.textAlign='left';x.font='500 36px Arial, sans-serif';if(data.combat){x.fillText(data.weapon||'PULSE',36,596);x.textAlign='right';x.fillText(data.ammo||'',988,596);x.textAlign='left';x.font='32px Arial, sans-serif';x.fillText('SHIELD '+Math.round(data.shield||0),36,650);x.textAlign='right';x.fillText('HULL '+Math.round(data.hull||0),988,650);}
 if(data.lock){x.textAlign='center';x.font='500 34px Arial, sans-serif';x.textAlign='left';x.font='500 28px Arial, sans-serif';x.fillText(data.lock.length>23?data.lock.slice(0,22)+'…':data.lock,30,715);}if(data.cooling){x.textAlign='center';x.fillStyle='#ffb079';x.font='34px Arial, sans-serif';x.textAlign='right';x.font='28px Arial, sans-serif';x.fillText(data.cooling,988,715);}x.shadowBlur=0;c.texture.needsUpdate=true;

}
export function renderCockpit(c,renderer){const auto=renderer.autoClear,tone=renderer.toneMapping,shadow=renderer.shadowMap?.enabled,clipping=renderer.localClippingEnabled;try{renderer.setRenderTarget(null);renderer.autoClear=false;renderer.localClippingEnabled=false;renderer.toneMapping=THREE.ACESFilmicToneMapping;if(renderer.shadowMap)renderer.shadowMap.enabled=false;renderer.clearDepth();renderer.render(c.scene,c.camera);}finally{renderer.autoClear=auto;renderer.localClippingEnabled=clipping;renderer.toneMapping=tone;if(renderer.shadowMap)renderer.shadowMap.enabled=shadow;}}
export function disposeCockpit(c){if(!c)return;const geometry=new Set(),materials=new Set();c.scene.traverse(o=>{if(o.geometry)geometry.add(o.geometry);if(o.material)materials.add(o.material)});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());c.texture.dispose();c.scene.clear();}