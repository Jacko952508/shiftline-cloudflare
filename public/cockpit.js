import{craft,disposeCraft}from'./race-craft.js?v=107';
import * as THREE from 'three';
import{appearance,MODELS}from'./ship-catalog.js?v=107';
function glassPatch(radius,center,span,height,y,uv){const p=[],t=[],ix=[],n=24;for(let j=0;j<=1;j++)for(let i=0;i<=n;i++){const a=center+(i/n-.5)*span;p.push(Math.sin(a)*radius,y+(j-.5)*height,-Math.cos(a)*radius);t.push(uv[0]+i/n*uv[2],uv[1]+j*uv[3]);}for(let i=0;i<n;i++)ix.push(i,i+1,i+n+1,i+1,i+n+2,i+n+1);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(t,2));g.setIndex(ix);g.computeVertexNormals();return g;}
export function createCockpit(custom={},model=0,color=0x72efff){
 const a=appearance(custom),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(60,1,.05,10),root=new THREE.Group();scene.add(root);
 const tone=[0x72efff,0xffbd78,0xa6ffcb][a.instrument],shell=new THREE.MeshStandardMaterial({color:[0x20313f,0x444b53,0x342b24][a.cabin],roughness:a.cabin===2?.88:.52,metalness:a.cabin===2?0:.5}),rubber=new THREE.MeshStandardMaterial({color:0x090e14,roughness:.9}),trim=new THREE.MeshStandardMaterial({color:tone,emissive:tone,emissiveIntensity:.18,roughness:.6,metalness:.25});
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
 // Reuse the real chassis; the cockpit never invents a second ship shape.
 const nose=new THREE.Group();nose.position.set(0,-.61,-.22);scene.add(nose);
 const forebody=craft(nose,color,model,false,custom);nose.scale.setScalar(1);forebody.updateMatrixWorld(true);
 const clip=new THREE.Plane(new THREE.Vector3(0,0,-1),.1);
 forebody.traverse(o=>{if(o.userData.partRole==='canopy'||o.userData.flame||o.isLight||o.isInstancedMesh)o.visible=false;if(o.material){o.material.clippingPlanes=[clip];o.castShadow=false;}if(o.geometry){o.geometry.computeBoundingBox();const box=o.geometry.boundingBox.clone().applyMatrix4(o.matrix);if(box.min.z>.1)o.visible=false;}});
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
 const result={scene,camera,root,hud,panels,stick,rightStick,nose,forebody,clip,button,cap,ring,trim,canvas,ctx,texture,custom:a,model,lastPaint:-1,pitch:0,roll:0,scratch:new THREE.Vector3(),viewport:[],signature:''};return result;
}
export function updateCockpit(c,dt,data,rect,width,height){
 c.hud.children[0].material.uniforms.time.value=data.time||0;c.hud.children[0].material.uniforms.boost.value=data.boost?1:0;const aspect=width/Math.max(1,height),fov=THREE.MathUtils.clamp(data.fov||78,66,88);
 if(Math.abs(c.camera.aspect-aspect)>.001||Math.abs(c.camera.fov-fov)>.15){c.camera.aspect=aspect;c.camera.fov=fov;c.camera.updateProjectionMatrix();}
 c.root.scale.x=THREE.MathUtils.clamp(aspect*(fov/60),.58,1.7);
 const fit=Math.min(1,aspect/.55);c.hud.scale.set(fit,fit,1);
 const sway=1-Math.exp(-Math.min(.1,Math.max(0,dt))*14);
 const lateral=THREE.MathUtils.clamp(data.lateral||0,-15,15),vertical=THREE.MathUtils.clamp(data.vertical||0,-15,15);
 const bank=THREE.MathUtils.clamp(data.bank||0,-1.1,1.1);
 c.root.rotation.z+=(THREE.MathUtils.clamp(-lateral*.0022-bank*.026,-.09,.09)-c.root.rotation.z)*sway;
 c.root.rotation.x+=(THREE.MathUtils.clamp(vertical*.004,-.075,.075)-c.root.rotation.x)*sway;
 c.root.position.y+=(THREE.MathUtils.clamp(-Math.abs(vertical)*.0015,-.025,0)-c.root.position.y)*sway;
 c.hud.rotation.z+=(c.root.rotation.z*.62-c.hud.rotation.z)*sway;
 c.hud.rotation.x+=(c.root.rotation.x*.56-c.hud.rotation.x)*sway;
 c.nose.rotation.x+=(THREE.MathUtils.clamp(vertical*.004,-.08,.08)-c.nose.rotation.x)*sway;
 c.nose.rotation.z+=(THREE.MathUtils.clamp(-lateral*.0025-bank*.027,-.1,.1)-c.nose.rotation.z)*sway;
 c.nose.updateMatrixWorld(true);c.clip.set(new THREE.Vector3(0,0,-1),.1).applyMatrix4(c.forebody.matrixWorld);
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
export function renderCockpit(c,renderer){const auto=renderer.autoClear,tone=renderer.toneMapping,shadow=renderer.shadowMap?.enabled,clipping=renderer.localClippingEnabled;try{renderer.setRenderTarget(null);renderer.autoClear=false;renderer.localClippingEnabled=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;if(renderer.shadowMap)renderer.shadowMap.enabled=false;renderer.clearDepth();renderer.render(c.scene,c.camera);}finally{renderer.autoClear=auto;renderer.localClippingEnabled=clipping;renderer.toneMapping=tone;if(renderer.shadowMap)renderer.shadowMap.enabled=shadow;}}
export function disposeCockpit(c){if(!c)return;disposeCraft(c.nose,c.forebody);const geometry=new Set(),materials=new Set();c.scene.traverse(o=>{if(o.geometry)geometry.add(o.geometry);if(o.material)materials.add(o.material)});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());c.texture.dispose();c.scene.clear();}