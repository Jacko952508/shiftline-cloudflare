import * as THREE from 'three';
import {actAt,RADIUS} from './race-track.js?v=58';
import {specifications} from './course-colliders.js?v=67';

// Observatory: a lightweight 3D diorama built from the SAME route and obstacle
// specifications used in races, without loading the heavy gameplay world.
const TAU=Math.PI*2,clamp=THREE.MathUtils.clamp;
const THEMES={
  1:{bg:0x050e1d,metal:0x263b53,glow:0x7fe8ff,ground:0x111a31},
  2:{bg:0x041c24,metal:0x24535c,glow:0x78f9dd,ground:0x112e35},
  3:{bg:0x1a1017,metal:0x594349,glow:0xffae6a,ground:0x37232e},
  4:{bg:0x0b162b,metal:0x35516b,glow:0xa3d8ff,ground:0x243448},
  5:{bg:0x071d1a,metal:0x3b5a47,glow:0xaaf1b1,ground:0x1d4035},
  6:{bg:0x0c1022,metal:0x514b65,glow:0xf7c299,ground:0x303048}
};
const point=(e,s,x=0,y=0)=>e.track.pose(clamp(s,0,e.track.length),x,y).sub(e.center).multiplyScalar(e.scale);
const local=(e,s)=>e.track.frame(clamp(s,0,e.track.length));
const orient=(group,F)=>group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(F.r,F.u,F.f.clone().negate()));
function pushTube(scene,points,radius,color,emissive=0,opacity=1){
  if(points.length<2)return null;
  const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
  const geo=new THREE.TubeGeometry(curve,Math.max(8,points.length*2),radius,5,false);
  const mat=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:emissive,roughness:.38,metalness:.5,transparent:opacity<1,opacity,depthWrite:opacity===1});
  const mesh=new THREE.Mesh(geo,mat);scene.add(mesh);return mesh;
}
function detail(e){
  if(!e.detailRoot)return;
  e.detailRoot.clear();
  // Reuse a small fixed geometry pool. No assets or shaders are allocated here.
  const s=e.progress*e.track.length,limit=190;
  let shown=0;
  for(const o of e.obstacles){
    if(Math.abs(o.s-s)>limit||shown++>7)continue;
    const frame=local(e,o.s),g=new THREE.Group();
    g.position.copy(point(e,o.s));orient(g,frame);
    const size=e.widthScale,material=e.detailMat;
    for(const solid of o.solids.slice(0,9)){
      let mesh;
      if(solid.type==='torus'){
        mesh=new THREE.Mesh(e.ringGeo,material);
        mesh.scale.setScalar(Math.max(.1,solid.R)*size/.13);
        mesh.position.set((solid.x||0)*size,(solid.y||0)*size,0);
      }else if(solid.type==='box'){
        mesh=new THREE.Mesh(e.boxGeo,material);
        mesh.scale.set(Math.max(.12,solid.hx*2)*size,Math.max(.12,solid.hy*2)*size,Math.max(.1,(solid.hz||.4)*2)*size);
        mesh.position.set((solid.x||0)*size,(solid.y||0)*size,0);
        mesh.rotation.z=solid.a||0;
      }else if(solid.type==='sphere'){
        mesh=new THREE.Mesh(e.sphereGeo,material);
        mesh.scale.setScalar(Math.max(.2,solid.r||.7)*size);
        mesh.position.set((solid.x||0)*size,(solid.y||0)*size,0);
      }else continue;
      g.add(mesh);
    }
    e.detailRoot.add(g);
  }
}
export function createTrackExplorer(track){
  const theme=THEMES[track.course]||THEMES[1],scene=new THREE.Scene();
  scene.background=new THREE.Color(theme.bg);
  scene.fog=new THREE.FogExp2(theme.bg,.055);
  scene.add(new THREE.HemisphereLight(0xbadfff,0x0a1521,2.2));
  const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,7,5);scene.add(key);
  const fill=new THREE.DirectionalLight(theme.glow,1.8);fill.position.set(-5,2,-3);scene.add(fill);
  const bounds=new THREE.Box3().setFromPoints(track.frames.map(f=>f.p));
  const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  const scale=5.1/Math.max(1,size.x,size.y,size.z);
  const e={scene,track,center,scale,theme,camera:new THREE.PerspectiveCamera(50,1,.003,65),mode:'orbit',
    yaw:.95,pitch:.73,zoom:.9,pan:new THREE.Vector3(),progress:.08,uiProgress:.08,
    pointers:new Map(),widthScale:.13/RADIUS,detailRoot:new THREE.Group(),look:new THREE.Vector3(),
    cameraGoal:new THREE.Vector3(),cameraTarget:new THREE.Vector3(),hasCamera:false,glide:.08,
    obstacles:specifications(track.course,track.length),lastDetail:-1,ringGeo:new THREE.TorusGeometry(.13,.022,6,20),
    boxGeo:new THREE.BoxGeometry(1,1,1),sphereGeo:new THREE.IcosahedronGeometry(1,1),
    detailMat:new THREE.MeshStandardMaterial({color:theme.glow,emissive:theme.glow,emissiveIntensity:.35,metalness:.45,roughness:.4}),
    marker:null,markerRing:null,paused:false};
  scene.add(e.detailRoot);
  // Real flight corridor represented by a subtly faceted metallic shell, not an opaque neon pipe.
  const n=Math.min(720,Math.max(200,Math.ceil(track.length/19))),pts=[],left=[],right=[];
  for(let i=0;i<=n;i++){
    const s=track.length*i/n,F=local(e,s),p=point(e,s);
    pts.push(p);const offset=Math.max(.112,RADIUS*e.scale);
    left.push(p.clone().addScaledVector(F.r,offset));
    right.push(p.clone().addScaledVector(F.r,-offset));
  }
  const core=pushTube(scene,pts,.086,theme.metal,.045);
  core.material.roughness=.54;
  for(let a=0;a<4;a++){
    const start=Math.floor(n*a/4),end=Math.min(n,Math.floor(n*(a+1)/4)+1);
    const color=actAt(track.length*(a+.3)/4,track.length,track.course).color;
    pushTube(scene,pts.slice(start,end+1),.059,color,.75,.98);
  }
  // Continuous guide rails convey curvature and track orientation.
  pushTube(scene,left,.013,theme.glow,1.35,.95);
  pushTube(scene,right,.013,theme.glow,1.35,.95);
  // Thin parallel seams and regular structural ribs use shared geometry/instancing.
  const ribGeo=new THREE.TorusGeometry(.112,.009,4,16);
  const ribMat=new THREE.MeshStandardMaterial({color:theme.metal,metalness:.72,roughness:.38,emissive:theme.glow,emissiveIntensity:.13});
  const count=Math.min(190,Math.ceil(track.length/105));
  const ribs=new THREE.InstancedMesh(ribGeo,ribMat,count),dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){const s=(i+.5)/count*track.length,F=local(e,s);dummy.position.copy(point(e,s));orient(dummy,F);dummy.updateMatrix();ribs.setMatrixAt(i,dummy.matrix);}
  ribs.instanceMatrix.needsUpdate=true;ribs.frustumCulled=false;scene.add(ribs);
  // Start/finish and four chapter beacons, with a vertical light post.
  const stem=new THREE.CylinderGeometry(.006,.014,.35,7),stemMat=new THREE.MeshBasicMaterial({color:theme.glow});
  for(let i=0;i<=4;i++){
    const s=track.length*i/4,F=local(e,s),p=point(e,s),col=i===0?0xa5ffd3:i===4?0xffb282:actAt(s+1,track.length,track.course).color;
    const beacon=new THREE.Group();beacon.position.copy(p);orient(beacon,F);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.20,.017,6,28),new THREE.MeshBasicMaterial({color:col,toneMapped:false}));beacon.add(ring);
    const pillar=new THREE.Mesh(stem,stemMat);pillar.position.set(0,.29,0);beacon.add(pillar);
    const head=new THREE.Mesh(new THREE.OctahedronGeometry(.043),new THREE.MeshBasicMaterial({color:col,toneMapped:false}));head.position.y=.49;beacon.add(head);
    scene.add(beacon);
  }
  // Obstacle icons are sampled from live collision specifications (not random props).
  const picks=e.obstacles.filter((_,i)=>i%3===0),geom=new THREE.OctahedronGeometry(.048,0),mat=new THREE.MeshBasicMaterial({color:theme.glow,toneMapped:false});
  const spots=new THREE.InstancedMesh(geom,mat,picks.length);
  picks.forEach((o,i)=>{const F=local(e,o.s);dummy.position.copy(point(e,o.s).addScaledVector(F.u,.095));dummy.quaternion.identity();dummy.scale.setScalar(1);dummy.updateMatrix();spots.setMatrixAt(i,dummy.matrix);});
  spots.instanceMatrix.needsUpdate=true;spots.frustumCulled=false;scene.add(spots);
  // Low-draw-call structural supports: a floating manufactured circuit, not a loose line.
  const supportCount=24,supportGeo=new THREE.CylinderGeometry(.012,.021,1,6),
    supportMat=new THREE.MeshStandardMaterial({color:theme.metal,metalness:.68,roughness:.48}),
    supports=new THREE.InstancedMesh(supportGeo,supportMat,supportCount);
  for(let i=0;i<supportCount;i++){
    const s=(i+.4)*track.length/supportCount,p=point(e,s);
    const floorY=bounds.min.y*scale-center.y*scale-.63,span=Math.min(.19,Math.max(.08,p.y-floorY));
    dummy.position.set(p.x,p.y-span*.5,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,span,1);dummy.updateMatrix();
    supports.setMatrixAt(i,dummy.matrix);
  }
  supports.instanceMatrix.needsUpdate=true;supports.frustumCulled=false;scene.add(supports);
  // Tiny, intentionally stylised biome landmarks; the route and hazard positions stay exact.
  const sceneryGeo=track.course===5?new THREE.ConeGeometry(.075,.22,6):
    track.course===2?new THREE.IcosahedronGeometry(.09,0):
    track.course===6?new THREE.BoxGeometry(.13,.18,.13):
    track.course===3?new THREE.ConeGeometry(.075,.22,5):
    new THREE.CylinderGeometry(.042,.059,.19,6);
  const sceneryColor=track.course===5?0x6fac76:track.course===2?0x68d8bf:track.course===3?0xe88252:
    track.course===6?0x9b95ae:track.course===4?0x83a9c5:0x7799b5;
  const sceneryMat=new THREE.MeshStandardMaterial({color:sceneryColor,emissive:sceneryColor,emissiveIntensity:.10,metalness:.32,roughness:.7}),
    sceneryCount=35,scenery=new THREE.InstancedMesh(sceneryGeo,sceneryMat,sceneryCount);
  for(let i=0;i<sceneryCount;i++){
    const s=(i+.24)*track.length/sceneryCount,F=local(e,s),p=point(e,s),
      side=i%2?1:-1,spread=.21+(i%5)*.047;
    dummy.position.copy(p).addScaledVector(F.r,side*spread);
    dummy.position.y-=.12+(i%3)*.045;
    dummy.rotation.set(0,i*2.39996,0);dummy.scale.setScalar(.85+(i%5)*.13);
    dummy.updateMatrix();scenery.setMatrixAt(i,dummy.matrix);
  }
  scenery.instanceMatrix.needsUpdate=true;scenery.frustumCulled=false;scene.add(scenery);
  // A thematic display grid beneath the route with minimal GPU/texture cost.
  const floor=bounds.min.y*scale-center.y*scale-.65;
  const grid=new THREE.GridHelper(7,24,theme.glow,0x254052);grid.position.y=floor;grid.material.transparent=true;grid.material.opacity=.19;scene.add(grid);
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(3.25,3.35,.13,72),new THREE.MeshStandardMaterial({color:theme.ground,metalness:.45,roughness:.72}));
  plinth.position.y=floor-.16;scene.add(plinth);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(3.29,.027,5,80),new THREE.MeshBasicMaterial({color:theme.glow,toneMapped:false,transparent:true,opacity:.54}));
  rim.rotation.x=Math.PI/2;rim.position.y=floor-.11;scene.add(rim);
  // Camera focus marker, animated at the currently selected course position.
  const marker=new THREE.Group();marker.add(new THREE.Mesh(new THREE.SphereGeometry(.083,10,8),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false})));
  const markerRing=new THREE.Mesh(new THREE.TorusGeometry(.15,.012,6,30),new THREE.MeshBasicMaterial({color:theme.glow,toneMapped:false}));
  marker.add(markerRing);scene.add(marker);
  e.marker=marker;e.markerRing=markerRing;detail(e);
  return e;
}
export function resetExplorer(e){if(!e)return;e.mode='orbit';e.yaw=.95;e.pitch=.73;e.zoom=.9;e.pan.set(0,0,0);e.hasCamera=false;e.pointers.clear();}
export function setExplorerMode(e,mode){if(!e||!['orbit','overhead','chase','fly'].includes(mode))return;e.mode=mode;e.hasCamera=false;e.yaw=.4;e.pitch=.22;if(mode==='orbit'||mode==='overhead')e.zoom=1;else e.zoom=.85;}
export function seekExplorer(e,fraction){if(!e)return;e.progress=clamp(Number(fraction)||0,0,.9999);if(Math.abs(e.progress-e.lastDetail)>.009){e.lastDetail=e.progress;detail(e);}}
export function zoomExplorer(e,factor){if(e)e.zoom=clamp(e.zoom*factor,e.mode==='orbit'||e.mode==='overhead'?.38:.35,e.mode==='orbit'||e.mode==='overhead'?2.6:3.6);}
export function advanceExplorer(e,dt){if(e?.mode==='fly'&&!e.paused){let next=e.progress+Math.min(.07,Math.max(0,dt))*85/e.track.length;if(next>=.998)next=.02;seekExplorer(e,next);}}
export function renderTrackExplorer(e,renderer,rect,dt=.033){
 if(!e||!rect||rect.width<1||rect.height<1||rect.bottom<=0||rect.top>=innerHeight)return;
 const camera=e.camera;camera.aspect=rect.width/rect.height;
 const aspectScale=Math.max(1,Math.sqrt(1/Math.max(.45,camera.aspect)));
 const fraction=e.progress,s=fraction*e.track.length,F=local(e,s),p=point(e,s);
 e.marker.position.copy(p);orient(e.marker,F);e.markerRing.rotation.z+=Math.min(.06,dt*.8);
 const near=e.mode==='chase'||e.mode==='fly',up=new THREE.Vector3(),position=new THREE.Vector3(),target=new THREE.Vector3();
 if(near){
   // Scene coordinates are scaled, so a detail camera stays within a few units.
   const distance=(e.mode==='fly'?.57:.9)*e.zoom;
   const yaw=e.mode==='fly'?e.yaw*.45:e.yaw,pitch=e.pitch;
   target.copy(p).addScaledVector(F.f,.22);
   position.copy(p).addScaledVector(F.f,-Math.cos(yaw)*distance)
     .addScaledVector(F.r,Math.sin(yaw)*distance)
     .addScaledVector(F.u,.17+Math.sin(pitch)*distance*.67);
   up.copy(F.u);camera.fov=59;
 }else{
   const distance=7.3*e.zoom*aspectScale;
   target.copy(e.pan);
   if(e.mode==='overhead'){
     position.copy(target).add(new THREE.Vector3(Math.sin(e.yaw)*.001,distance,Math.cos(e.yaw)*.001));
     up.set(Math.sin(e.yaw),0,-Math.cos(e.yaw));camera.fov=49;
   }else{
     position.set(Math.sin(e.yaw)*Math.cos(e.pitch)*distance,Math.sin(e.pitch)*distance,Math.cos(e.yaw)*Math.cos(e.pitch)*distance).add(target);
     up.set(0,1,0);camera.fov=48;
   }
 }
 const smooth=e.hasCamera?1-Math.exp(-Math.min(.08,Math.max(.004,dt))*10):1;
 e.cameraGoal.lerp(position,smooth);e.cameraTarget.lerp(target,smooth);
 camera.position.copy(e.cameraGoal);camera.up.copy(up);camera.lookAt(e.cameraTarget);camera.updateProjectionMatrix();e.hasCamera=true;
 e.detailRoot.visible=near;
 e.markerRing.visible=e.mode!=='fly';
 const oldAuto=renderer.autoClear,oldTone=renderer.toneMapping,oldColor=renderer.getClearColor(new THREE.Color()),oldAlpha=renderer.getClearAlpha();
 renderer.setRenderTarget(null);renderer.setScissorTest(true);renderer.setViewport(rect.left,innerHeight-rect.bottom,rect.width,rect.height);
 renderer.setScissor(rect.left,innerHeight-rect.bottom,rect.width,rect.height);
 renderer.autoClear=true;
 try{renderer.setClearColor(e.theme.bg);renderer.clear(true,true,true);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.render(e.scene,camera);}
 finally{renderer.setClearColor(oldColor,oldAlpha);renderer.toneMapping=oldTone;renderer.autoClear=oldAuto;renderer.setScissorTest(false);renderer.setViewport(0,0,innerWidth,innerHeight);}
}
export function bindExplorer(pad,getExplorer){
 pad.addEventListener('pointerdown',event=>{const e=getExplorer();if(!e||event.target.closest('button,input'))return;event.preventDefault();e.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});pad.setPointerCapture?.(event.pointerId);});
 pad.addEventListener('pointermove',event=>{
  const e=getExplorer(),p=e?.pointers.get(event.pointerId);if(!p)return;event.preventDefault();
  const dx=event.clientX-p.x,dy=event.clientY-p.y;
  if(e.pointers.size===1){
    e.yaw-=dx*.0085;e.pitch=clamp(e.pitch+dy*.0065,e.mode==='overhead'?-1.5:-1.2,1.3);
    if(e.mode==='overhead')e.pitch=1.48;
  }else{
    const other=[...e.pointers.entries()].find(([id])=>id!==event.pointerId)?.[1];
    if(other){
      const previous=Math.hypot(p.x-other.x,p.y-other.y),next=Math.hypot(event.clientX-other.x,event.clientY-other.y);
      if(previous>12&&next>12)zoomExplorer(e,previous/next);
      if(e.mode==='orbit'||e.mode==='overhead'){
        const move=new THREE.Vector3(-dx*.005*e.zoom,dy*.005*e.zoom,0).applyQuaternion(e.camera.quaternion);
        e.pan.add(move);e.pan.clampLength(0,2.8);
      }
    }
  }
  p.x=event.clientX;p.y=event.clientY;
 });
 for(const type of['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,event=>getExplorer()?.pointers.delete(event.pointerId));
 pad.addEventListener('wheel',event=>{const e=getExplorer();if(e){event.preventDefault();zoomExplorer(e,Math.exp(clamp(event.deltaY,-100,100)*.003));}},{passive:false});
}
export function disposeTrackExplorer(e){
 if(!e)return;e.pointers.clear();
 const geos=new Set(),mats=new Set();
 e.scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)for(const mat of(Array.isArray(o.material)?o.material:[o.material]))mats.add(mat);});
 for(const g of[e.ringGeo,e.boxGeo,e.sphereGeo,...geos])g.dispose();
 for(const m of[e.detailMat,...mats])m.dispose();
 e.scene.clear();
}