// Isolated in-chat SHIFT LINE prototype. No imports from production game code.
export async function mount(root){
 const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
 const canvas=root.querySelector('canvas');const scene=new THREE.Scene();scene.background=new THREE.Color(0x030719);scene.fog=new THREE.FogExp2(0x030719,.009);
 const camera=new THREE.PerspectiveCamera(74,1,.1,450);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance',alpha:false});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.4));renderer.outputColorSpace=THREE.SRGBColorSpace;
 scene.add(new THREE.HemisphereLight(0x89baff,0x070b20,2.1));
 const light=new THREE.PointLight(0x47caff,95,45);scene.add(light);
 const world=new THREE.Group();scene.add(world);
 const ringGeo=new THREE.TorusGeometry(9.5,.18,7,64);
 const tubeMat=new THREE.MeshStandardMaterial({color:0x122a5c,metalness:.65,roughness:.3,side:THREE.DoubleSide,transparent:true,opacity:.52});
 const edgeMat=new THREE.MeshBasicMaterial({color:0x35caff});
 const magMat=new THREE.MeshBasicMaterial({color:0xff47d5});
 for(let i=0;i<64;i++){
   const z=-i*9;
   const ring=new THREE.Mesh(ringGeo,i%5===0?magMat:edgeMat);ring.position.z=z;world.add(ring);
   if(i%2===0){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(9.7,9.7,8.8,20,1,true),tubeMat);mesh.rotation.x=Math.PI/2;mesh.position.z=z-4.4;world.add(mesh)}
   for(let j=0;j<8;j++){const a=j*Math.PI/4;const m=new THREE.Mesh(new THREE.BoxGeometry(.22,.24,8.5),j%2?magMat:edgeMat);m.position.set(Math.sin(a)*9.4,Math.cos(a)*9.4,z-4.5);m.rotation.z=-a;world.add(m)}
 }
 const ship=new THREE.Group();scene.add(ship);
 const hull=new THREE.Mesh(new THREE.ConeGeometry(1.4,5,4),new THREE.MeshStandardMaterial({color:0xd7e8ff,metalness:.8,roughness:.16,flatShading:true}));hull.rotation.x=-Math.PI/2;ship.add(hull);
 for(const x of [-1,1]){const wing=new THREE.Mesh(new THREE.BoxGeometry(2.8,.12,1.9),new THREE.MeshStandardMaterial({color:0x177bb8,metalness:.7,roughness:.22}));wing.position.set(x*1.35,-.3,.7);wing.rotation.z=x*.18;ship.add(wing);const glow=new THREE.Mesh(new THREE.SphereGeometry(.35,10,8),new THREE.MeshBasicMaterial({color:0x3fefff}));glow.position.set(x*.65,0,2.1);ship.add(glow)}
 let x=0,y=0,speed=22,boost=false,alive=true,last=performance.now(),distance=0,steerX=0,steerY=0,frames=0,fps=0,acc=0;
 const resize=()=>{const w=canvas.clientWidth||320,h=canvas.clientHeight||420;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 const joy=root.querySelector('[data-joy]'),nub=root.querySelector('[data-nub]');let joyId=null;
 function joyMove(e){const b=joy.getBoundingClientRect(),dx=(e.clientX-b.left-b.width/2)/(b.width*.38),dy=(e.clientY-b.top-b.height/2)/(b.height*.38);steerX=THREE.MathUtils.clamp(dx,-1,1);steerY=THREE.MathUtils.clamp(-dy,-1,1);nub.style.transform='translate('+steerX*35+'px,'+(-steerY*35)+'px)'}
 joy.addEventListener('pointerdown',e=>{e.preventDefault();joyId=e.pointerId;joy.setPointerCapture(joyId);joyMove(e)});
 joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e)});
 const stop=e=>{if(e.pointerId===joyId){joyId=null;steerX=steerY=0;nub.style.transform=''}};
 for(const t of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(t,stop);
 const boostButton=root.querySelector('[data-boost]');boostButton.onclick=()=>{boost=!boost;boostButton.textContent=boost?'BOOST ON':'BOOST';boostButton.classList.toggle('active',boost)};
 const hud=root.querySelector('[data-hud]');
 function frame(now){if(!alive)return;const dt=Math.min((now-last)/1000,.045);last=now;acc+=dt;frames++;if(acc>=.8){fps=Math.round(frames/acc);acc=0;frames=0}
 const target=boost?47:24;speed+=(target-speed)*Math.min(1,dt*2.5);distance+=speed*dt;
 x=THREE.MathUtils.clamp(x+steerX*dt*12,-7.5,7.5);y=THREE.MathUtils.clamp(y+steerY*dt*12,-7.5,7.5);
 ship.position.set(x,y,-6);ship.rotation.z=-steerX*.32;ship.rotation.x=steerY*.17;
 camera.position.lerp(new THREE.Vector3(x*.3,y*.3+2.3,8),Math.min(1,dt*3));camera.lookAt(x*.55,y*.55,-28);
 world.position.z=distance%576;
 light.position.set(x,y,-8);
 hud.textContent='SHIFT LINE · '+Math.round(speed*11)+' KM/H · '+fps+' FPS';
 renderer.render(scene,camera);requestAnimationFrame(frame)}
 requestAnimationFrame(frame);
 return {dispose(){alive=false;observer.disconnect();renderer.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.dispose()}})}};
}
