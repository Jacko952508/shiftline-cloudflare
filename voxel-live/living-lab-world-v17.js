// REALITY ENGINE V17 / LIVING WORLD 3D
// Real 3D civilisation scene rendered by the existing core WebGL renderer.
// The old ASTRAEUS and terrestrial scenes are not updated or rendered while open.
export function mountLivingWorld3D(root, sim) {
  const bridge=root.__realityLivingBridge;
  if(!bridge?.T||!bridge.renderer)throw Error('V17 shared-renderer bridge missing');
  const {T,renderer}=bridge,stage=root.querySelector('#vxStage'),canvas=root.querySelector('#vxCanvas');
  if(!stage||!canvas)throw Error('No Reality Engine stage/canvas');
  const state=sim.getState(),W=24,H=18,CELL=6.2,HALFW=W*CELL*.5,HALFH=H*CELL*.5;
  const rand=(n)=>{const x=Math.sin(n*127.1+41.7)*43758.5453;return x-Math.floor(x)};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const toX=x=>(x+.5)*CELL-HALFW,toZ=y=>(y+.5)*CELL-HALFH;
  const terrainAt=(x,y)=>{
    const i=clamp(Math.floor(x),0,W-1)+W*clamp(Math.floor(y),0,H-1);
    const t=state.tiles[i];
    return t.water?.65:3.0+Math.max(-1,Math.min(1.4,t.height))*2.1;
  };
  let active=false,disposed=false,mode='orbit',yaw=.55,pitch=.91,distance=158,zoomTarget=158,selected=sim.getSelected?.()||0;
  let panX=0,panZ=0,last=0,lastRefresh=0,lastDisplay=0,paused=false,interaction='navigate',initUI=false;
  let msgUntil=0,messages=[],restoreViews=new Map(),renderFailures=0,frameCount=0,lastFrameAt=performance.now();
  const world=new T.Scene();
  world.background=new T.Color('#a2c8d9');
  world.fog=new T.FogExp2(0xa2c8d9,.0033);
  const camera=new T.PerspectiveCamera(59,1,.1,1400);
  const ambient=new T.HemisphereLight(0xe6f5ff,0x536f73,2.45);world.add(ambient);
  const sun=new T.DirectionalLight(0xffe3ac,3.0);sun.position.set(-82,126,50);world.add(sun);
  const edgeLight=new T.DirectionalLight(0xa9daff,1.1);edgeLight.position.set(90,34,-70);world.add(edgeLight);
  const makeMat=(color,metal=.05,rough=.72,emissive=0x000000,intensity=0)=>
    new T.MeshStandardMaterial({color,metalness:metal,roughness:rough,emissive,emissiveIntensity:intensity});
  const matSoil=makeMat(0x344b38,.03,.85);
  const matIsland=makeMat(0x29483e,.09,.73);
  const matRoad=makeMat(0x3d5660,.16,.6);
  const matWater=new T.MeshPhysicalMaterial({color:0x276984,metalness:.32,roughness:.24,clearcoat:.45,clearcoatRoughness:.3,transparent:true,opacity:.96,side:T.DoubleSide});
  const matWood=makeMat(0x735941),matCanopy=makeMat(0x2d937b,0,.87);
  const matGlow=makeMat(0x81f8d2,.15,.3,0x4be5b6,.7);
  const matPylon=makeMat(0x9ecbc4,.52,.3,0x236e5f,.18);
  const matCrystal=new T.MeshStandardMaterial({color:0x93c9ff,metalness:.45,roughness:.17,emissive:0x1c81ec,emissiveIntensity:.65});
  const matRoof=new T.MeshStandardMaterial({color:0xb1ddc6,metalness:.46,roughness:.33});
  const matGroundMarker=new T.MeshBasicMaterial({color:0xe0ffa9,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide});
  const disposable=[];
  function track(x){disposable.push(x);return x}
  const sea=track(new T.Mesh(new T.PlaneGeometry(W*CELL+320,H*CELL+320),matWater));
  sea.rotation.x=-Math.PI/2;sea.position.y=.42;world.add(sea);
  const seabed=track(new T.Mesh(new T.BoxGeometry(W*CELL+2,2,H*CELL+2),matSoil));
  seabed.position.y=-1.85;world.add(seabed);
  const island=track(new T.Mesh(new T.BoxGeometry(W*CELL+2,4,H*CELL+2),matIsland));
  island.position.y=-.35;world.add(island);
  const pos=[],colors=[],indices=[],tileColor=new T.Color();
  const corners=(x,y)=>{
    let total=0,count=0;
    for(let xx=x-1;xx<=x;xx++)for(let yy=y-1;yy<=y;yy++){
      if(xx>=0&&xx<W&&yy>=0&&yy<H){total+=terrainAt(xx,yy);count++}
    }
    return count?total/count:2;
  };
  for(let y=0;y<=H;y++)for(let x=0;x<=W;x++){
    let h=corners(x,y);
    pos.push(x*CELL-HALFW,h,y*CELL-HALFH);
    const t=state.tiles[clamp(y,0,H-1)*W+clamp(x,0,W-1)];
    if(t.water)tileColor.set('#438a90');
    else if(t.forest)tileColor.set('#428b6b');
    else if(t.fertility>.66)tileColor.set('#86a77a');
    else tileColor.set('#9da288');
    const grain=.85+.17*rand(x*81+y*701);tileColor.multiplyScalar(grain);
    colors.push(tileColor.r,tileColor.g,tileColor.b);
  }
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const a=y*(W+1)+x,b=a+1,c=a+W+1,d=c+1;
    indices.push(a,c,b,b,c,d);
  }
  const geom=track(new T.BufferGeometry());
  geom.setIndex(indices);
  geom.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  geom.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geom.computeVertexNormals();
  const land=track(new T.Mesh(geom,new T.MeshStandardMaterial({vertexColors:true,roughness:.96,metalness:0,side:T.DoubleSide})));
  world.add(land);
  const skirt=track(new T.Mesh(new T.BoxGeometry(W*CELL,2.5,H*CELL),matIsland));skirt.position.y=-.4;world.add(skirt);

  // Low-cost instanced forests: hundreds of trees in only two draw calls.
  const treeLoc=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const t=state.tiles[y*W+x];
    if(t.water||!t.forest)continue;
    const near=state.sectors.some(s=>Math.hypot(x-s.x,y-s.y)<1.9);
    if(near)continue;
    const count=1+Math.floor(rand(x*17+y*53)*3);
    for(let k=0;k<count;k++)treeLoc.push([x+(rand(x*14+y*48+k*5)-.5)*.75,y+(rand(x*66+y*9+k*3)-.5)*.8,.68+rand(x*19+y*37+k)*.84]);
  }
  const treeG=track(new T.ConeGeometry(1,3,5)),woodG=track(new T.CylinderGeometry(.24,.37,1,5));
  const crowns=track(new T.InstancedMesh(treeG,matCanopy,treeLoc.length));
  const trunks=track(new T.InstancedMesh(woodG,matWood,treeLoc.length));
  const dummy=new T.Object3D(),tc=new T.Color();
  treeLoc.forEach(([x,y,s],i)=>{
    const wx=toX(x),wz=toZ(y),h=terrainAt(x,y);
    dummy.position.set(wx,h+.75*s,wz);dummy.rotation.set(0,rand(i*117)*6.3,0);dummy.scale.set(.88*s,s,.88*s);dummy.updateMatrix();
    crowns.setMatrixAt(i,dummy.matrix);
    crowns.setColorAt(i,tc.setHSL(.42+rand(i*41)*.05,.37,.27+rand(i*73)*.2));
    dummy.position.set(wx,h+.17*s,wz);dummy.rotation.set(0,0,0);dummy.scale.set(s,.9*s,s);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
  });
  crowns.instanceMatrix.needsUpdate=true;trunks.instanceMatrix.needsUpdate=true;
  world.add(trunks,crowns);

  // Physical roadways connecting all eight communities.
  const connections=[[0,1],[1,2],[2,3],[4,5],[5,6],[6,7],[0,4],[1,5],[2,6],[3,7]];
  const roadMesh=[];
  for(const [a,b] of connections){
    const from=state.sectors[a],to=state.sectors[b];
    const points=[];
    for(let j=0;j<=24;j++){
      const t=j/24,x=from.x+(to.x-from.x)*t,y=from.y+(to.y-from.y)*t;
      points.push(new T.Vector3(toX(x),terrainAt(x,y)+.37,toZ(y)));
    }
    const ribbon=track(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.57,5,false),matRoad));
    world.add(ribbon);roadMesh.push(ribbon);
  }

  // GPU-instanced buildings and rooftops react to civilisation growth.
  const MAX_BUILDINGS=220;
  const houseGeometry=track(new T.BoxGeometry(1,1,1));
  const roofGeometry=track(new T.ConeGeometry(1,1,4));
  roofGeometry.rotateY(Math.PI*.25);
  const buildings=track(new T.InstancedMesh(houseGeometry,makeMat(0xc9dace,.4,.43),MAX_BUILDINGS));
  const roofs=track(new T.InstancedMesh(roofGeometry,matRoof,MAX_BUILDINGS));
  buildings.count=0;roofs.count=0;world.add(buildings,roofs);
  buildings.frustumCulled=false;roofs.frustumCulled=false;
  const settlementMarkers=[],settlementLabels=[];
  function textSprite(label){
    const cvs=document.createElement('canvas');cvs.width=512;cvs.height=96;
    const c=cvs.getContext('2d');c.clearRect(0,0,512,96);
    c.font='700 35px system-ui';c.textAlign='center';c.fillStyle='#021c23';
    c.fillText(label,258,49);c.fillStyle='#d7ffef';c.fillText(label,256,46);
    const tex=track(new T.CanvasTexture(cvs));tex.colorSpace=T.SRGBColorSpace;
    const material=track(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,depthTest:false}));
    const sp=new T.Sprite(material);sp.scale.set(19,3.6,1);
    return sp;
  }
  for(const s of state.sectors){
    const x=toX(s.x),z=toZ(s.y),h=terrainAt(s.x,s.y);
    const rootS=new T.Group();rootS.position.set(x,h,z);
    const plinth=track(new T.Mesh(new T.CylinderGeometry(6.7,7.15,.65,10),matPylon));plinth.position.y=.12;rootS.add(plinth);
    const tower=track(new T.Mesh(new T.CylinderGeometry(.88,2.1,9.1,7),matPylon));
    tower.position.y=5;rootS.add(tower);
    const spire=track(new T.Mesh(new T.OctahedronGeometry(2.0),matCrystal));spire.position.y=10.5;rootS.add(spire);
    const halo=track(new T.Mesh(new T.TorusGeometry(4.8,.16,5,40),matGlow));halo.rotation.x=Math.PI/2;halo.position.y=.46;rootS.add(halo);
    const label=textSprite(s.name.toUpperCase());label.position.y=18;rootS.add(label);
    const beacon=track(new T.PointLight(0x82ffee,2.2,22,2));beacon.position.y=10;rootS.add(beacon);
    rootS.userData={s,tower,spire,halo,beacon};world.add(rootS);
    settlementMarkers.push(rootS);
    settlementLabels.push(label);
  }

  // Residents have distinct appearances and animated walking, not drawn map pixels.
  const MAX_PEOPLE=500;
  const personGeo=track(new T.CapsuleGeometry(.28,.7,3,6)),headGeo=track(new T.SphereGeometry(.24,7,5));
  const citizenMat=makeMat(0xffffff,.13,.72),headMat=makeMat(0xe2c8a2,.0,.85);
  const people=track(new T.InstancedMesh(personGeo,citizenMat,MAX_PEOPLE));
  const heads=track(new T.InstancedMesh(headGeo,headMat,MAX_PEOPLE));
  people.frustumCulled=false;heads.frustumCulled=false;
  world.add(people,heads);
  const citizenPos=new Map(),personColor=new T.Color(),personTint=['#c8e6db','#a7d9ef','#ffd3a2','#eed0f6','#e6ffb2','#ffffff'];
  const crystalG=track(new T.OctahedronGeometry(.6));
  const energyCrystals=track(new T.InstancedMesh(crystalG,matCrystal,90));energyCrystals.count=0;world.add(energyCrystals);

  // A textured illuminated sky and orbiting atmosphere enhance depth without extra render targets.
  const starsPos=[],starsColor=[];
  for(let j=0;j<300;j++){
    const a=rand(j*13)*Math.PI*2,h=.06+rand(j*71)*.9,r=460;
    starsPos.push(Math.cos(a)*r,Math.sin(h*Math.PI*.5)*r,Math.sin(a)*r);
    starsColor.push(.45+rand(j*41)*.55,.7+rand(j*93)*.3,1);
  }
  const starsGeom=track(new T.BufferGeometry());starsGeom.setAttribute('position',new T.Float32BufferAttribute(starsPos,3));starsGeom.setAttribute('color',new T.Float32BufferAttribute(starsColor,3));
  const starsMaterial=track(new T.PointsMaterial({size:2.4,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.7,depthWrite:false}));
  const stars=track(new T.Points(starsGeom,starsMaterial));world.add(stars);

  // A desktop-like tool ribbon, but leaves virtually the entire display for the 3D terrain.
  const ui=document.createElement('div');ui.className='lab3d';
  ui.innerHTML='<style>'+
  '.lab3d{position:absolute;inset:0;z-index:16;pointer-events:none;color:#e8fff8;font:11px/1.38 system-ui,-apple-system,sans-serif}'+
  '.lab3d *{box-sizing:border-box}.lab3d button{border:1px solid #7da8a2;background:#0b3345e9;color:#e8fff8;border-radius:8px;padding:7px 8px;font:700 10px system-ui;touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer}'+
  '.lab3d .lab3d-top{pointer-events:auto;position:absolute;top:8px;left:7px;right:7px;display:flex;flex-wrap:wrap;gap:5px;align-items:center;justify-content:space-between}'+
  '.lab3d .lab3d-top strong{display:inline-block;padding:6px 8px;border:1px solid #80dcc1;background:#092e38d9;border-radius:7px;color:#9effd5;letter-spacing:1.1px;font-size:11px}'+
  '.lab3d .lab3d-nav{display:flex;flex-wrap:wrap;gap:4px}'+
  '.lab3d .lab3d-mid{position:absolute;pointer-events:none;top:54px;left:8px;right:8px;display:flex;justify-content:space-between;align-items:flex-start;gap:6px}'+
  '.lab3d .lab3d-info{pointer-events:none;background:#061d2ad8;border:1px solid #477c79;border-radius:8px;padding:8px 9px;max-width:67%;line-height:1.5;text-shadow:0 1px 2px #0008}'+
  '.lab3d .lab3d-info b{font-size:12px;color:#d1ffb3}.lab3d .lab3d-info span{color:#b0d6d2}'+
  '.lab3d .lab3d-badge{background:#16473ae9;color:#e3ffe9;padding:5px;border:1px solid #69ad87;border-radius:6px;white-space:nowrap;font:700 9px ui-monospace,monospace}'+
  '.lab3d .lab3d-actions{position:absolute;bottom:15px;left:8px;right:8px;pointer-events:auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}'+
  '.lab3d .lab3d-actions button{min-height:40px;padding:6px 2px;font-size:10px;background:#082a38ef}'+
  '.lab3d .lab3d-actions button[data-act="experiment"]{background:#275c44ee;border-color:#9cdfbf}'+
  '.lab3d .lab3d-menu{position:absolute;left:8px;right:8px;bottom:64px;z-index:19;display:none;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:8px;background:#071f2cf3;border:1px solid #72b9b6;border-radius:9px;pointer-events:auto}'+
  '.lab3d .lab3d-menu.open{display:grid}.lab3d .lab3d-menu button{font-size:9px;padding:7px 3px;line-height:1.2}'+
  '.lab3d .lab3d-news{position:absolute;left:8px;right:8px;bottom:65px;display:none;pointer-events:none;text-align:center;background:#0a2636d9;border:1px solid #426f80;border-radius:7px;padding:6px;font:10px ui-monospace,monospace;color:#b8e3d5;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}'+
  '.lab3d .lab3d-help{display:none;position:absolute;left:8px;right:8px;top:50%;transform:translateY(-50%);pointer-events:auto;background:#092a3af4;border:1px solid #93e2bf;border-radius:12px;padding:12px;text-align:center}'+
  '.lab3d .lab3d-help.open{display:block}'+
  '</style>'+
  '<div class="lab3d-top"><strong>◈ LIVING WORLD 3D</strong><div class="lab3d-nav"><button data-act="help">?</button><button data-act="back">↩ ORIGINAL WORLD</button></div></div>'+
  '<div class="lab3d-mid"><div class="lab3d-info" data-info>Building three-dimensional civilisation...</div><span class="lab3d-badge" data-fps>LIVE 3D</span></div>'+
  '<div class="lab3d-news" data-news></div>'+
  '<div class="lab3d-menu" data-menu>'+
  '<button data-exp="energy">⚡ ENERGY</button><button data-exp="rains">🌧 RAIN</button><button data-exp="mineral">💎 MINERALS</button><button data-exp="disaster">☄ METEOR</button>'+
  '<button data-exp="migration">🧭 MIGRATION</button><button data-exp="peace">🕊 PEACE</button><button data-exp="fertility">🌿 FERTILITY</button><button data-exp="isolation">🌀 ISOLATION</button>'+
  '</div>'+
  '<div class="lab3d-help" data-help><b>THE LIVING WORLD</b><p>Drag the 3D scene to orbit · pinch to zoom · tap a settlement to select it · watch buildings and residents evolve as time advances. The game uses the existing Three.js renderer, not a second canvas.</p><button data-act="closehelp">BACK TO WORLD</button></div>'+
  '<div class="lab3d-actions"><button data-act="map">▦ ATLAS / DATA</button><button data-act="time">⏩ 1× TIME</button><button data-act="focus">⌖ VISIT</button><button data-act="experiment">⚡ EXPERIMENT</button></div>';
  stage.appendChild(ui);
  const el=name=>ui.querySelector('[data-'+name+']');
  const info=el('info'),fps=el('fps'),menu=el('menu'),news=el('news');
  const originalToggle=root.querySelector('.ll-toggle');if(originalToggle)originalToggle.style.display='none';
  const labPanel=root.querySelector('.ll-panel');
  // Independent original world view switch is present when 3D Lab is closed.
  const entry=document.createElement('button');entry.textContent='🧬 ENTER 3D LAB';
  entry.style.cssText='position:absolute;top:160px;right:8px;z-index:21;display:none;background:#194b4de8;color:#e5fff2;border:1px solid #95e8c5;border-radius:9px;padding:9px;font:750 11px system-ui;touch-action:manipulation';
  stage.appendChild(entry);
  function hideEngineControls(){
    restoreViews.clear();
    for(const el of stage.children){
      if(el===canvas||el===ui||el===entry||el.classList?.contains('ll-shell'))continue;
      restoreViews.set(el,el.style.display);
      el.style.display='none';
    }
  }
  function restoreEngineControls(){
    for(const [el,v] of restoreViews)if(el.isConnected)el.style.display=v;
    restoreViews.clear();
  }
  function setActive(next){
    next=!!next;
    if(next===active)return;
    active=next;
    hook.active=active;
    if(next){
      sim.close?.();
      hideEngineControls();
      ui.style.display='block';entry.style.display='none';
      root.__livingLab3D=hook;
      last=performance.now();
      updateHud();
    }else{
      sim.close?.();
      root.__livingLab3D=hook;hook.active=false;
      ui.style.display='none';entry.style.display='block';
      restoreEngineControls();
    }
  }
  function setCamera(){
    const ratio=Math.max(.2,stage.clientWidth/Math.max(1,stage.clientHeight));
    if(Math.abs(camera.aspect-ratio)>.002){camera.aspect=ratio;camera.updateProjectionMatrix()}
    const s=state.sectors[selected], tx=toX(s.x),tz=toZ(s.y);
    panX+=(cameraTargetX-panX)*.065;panZ+=(cameraTargetZ-panZ)*.065;
    distance+=(zoomTarget-distance)*.13;
    camera.position.set(panX+Math.sin(yaw)*Math.sin(pitch)*distance,8+Math.cos(pitch)*distance,
      panZ+Math.cos(yaw)*Math.sin(pitch)*distance);
    camera.lookAt(panX,0,panZ);
  }
  let cameraTargetX=0,cameraTargetZ=0;
  function focusSector(){
    const s=state.sectors[selected];
    cameraTargetX=toX(s.x);cameraTargetZ=toZ(s.y);
    zoomTarget=clamp(47+7*rand(selected*73),38,70);
    updateHud();
  }
  function overview(){cameraTargetX=cameraTargetZ=0;zoomTarget=161;updateHud()}
  function updateHud(){
    const s=state.sectors[selected],p=state.people.filter(p=>p.sector===selected).length;
    info.innerHTML='<b>'+s.name.toUpperCase()+'</b><div><span>RESIDENTS </span>'+p+
      ' <span>· TECH </span>'+s.tech+' <span>· TRUST </span>'+Math.round(s.trust*100)+'%'+
      '</div><div><span>FOOD </span>'+Math.floor(s.stock.food)+' <span>· POWER </span>'+Math.floor(s.stock.power)+
      ' <span>· BUILDINGS </span>'+s.structures+'</div><div style="margin-top:4px;color:#9affce">'+state.people.length+
      ' CITIZENS · '+state.sectors.reduce((a,x)=>a+x.tech,0)+' DISCOVERIES · DAY '+state.day+'</div>';
    const sp=[1,3,10,30];
    el('menu').classList.contains('open');
    ui.querySelector('[data-act="time"]').textContent=(state.paused?'▶ RESUME':'⏩ '+state.speed+'× TIME');
    if(state.log.length)news.textContent=state.log[0].text;
  }
  function syncCities(){
    let j=0,energyN=0;
    for(const s of state.sectors){
      const center=settlementMarkers[s.id],tower=center.userData.tower,halo=center.userData.halo,spire=center.userData.spire;
      tower.scale.y=1+s.tech*.09;tower.position.y=5*tower.scale.y;
      spire.position.y=9.5*tower.scale.y+1.3;
      halo.material===matGlow;
      const n=clamp(Math.floor(s.structures+s.tech*.42),3,23);
      for(let k=0;k<n&&j<MAX_BUILDINGS;k++,j++){
        const radius=9.3+Math.floor(k/8)*5.4,ang=k*2.39996+s.id*.29;
        const x=s.x+Math.cos(ang)*radius/CELL,y=s.y+Math.sin(ang)*radius/CELL;
        const wx=toX(x),wz=toZ(y),h=terrainAt(x,y);
        const height=2.8+rand(k*71+s.id*509)*5.7+s.tech*.22;
        const width=2.25+rand(k*4+s.id)*1.75;
        dummy.position.set(wx,h+height*.5,wz);
        dummy.rotation.set(0,rand(k*13+s.id)*1.8,0);dummy.scale.set(width,height,width);
        dummy.updateMatrix();buildings.setMatrixAt(j,dummy.matrix);
        buildings.setColorAt(j,personColor.setHSL(.39+rand(s.id*93+k)*.13,.11+rand(k*24)*.3,.49+rand(k*32)*.22));
        dummy.position.set(wx,h+height+.6,wz);dummy.scale.set(width*.93,1.2,width*.93);dummy.updateMatrix();
        roofs.setMatrixAt(j,dummy.matrix);
      }
      const t=state.tiles[Math.floor(s.y)*W+Math.floor(s.x)];
      if(t.energy>.12||s.stock.power>15){
        const n=Math.min(11,2+Math.round(t.energy*8));
        for(let k=0;k<n&&energyN<90;k++,energyN++){
          const a=k*2.4,r=3+2.4*Math.floor(k/3);
          dummy.position.set(toX(s.x)+Math.cos(a)*r,terrainAt(s.x,s.y)+1+rand(k+s.id*9)*2,toZ(s.y)+Math.sin(a)*r);
          dummy.rotation.set(rand(k+s.id)*.5,rand(k*7+s.id)*6.3,0);
          dummy.scale.set(.55,.55,.55);dummy.updateMatrix();energyCrystals.setMatrixAt(energyN,dummy.matrix);
        }
      }
    }
    buildings.count=j;roofs.count=j;energyCrystals.count=energyN;
    buildings.instanceMatrix.needsUpdate=true;roofs.instanceMatrix.needsUpdate=true;energyCrystals.instanceMatrix.needsUpdate=true;
    if(buildings.instanceColor)buildings.instanceColor.needsUpdate=true;
  }
  let visiblePeople=0;
  function updateResidents(t,dt){
    const n=Math.min(state.people.length,MAX_PEOPLE);
    for(let i=0;i<n;i++){
      const p=state.people[i],targetX=toX(p.x),targetZ=toZ(p.y);
      let loc=citizenPos.get(p.id);
      if(!loc){loc={x:targetX,z:targetZ};citizenPos.set(p.id,loc)}
      loc.x+=(targetX-loc.x)*Math.min(1,dt*2.3);
      loc.z+=(targetZ-loc.z)*Math.min(1,dt*2.3);
      const y=terrainAt(p.x,p.y);
      const swing=.11*Math.sin(t*2.4+i);
      dummy.position.set(loc.x,y+.77+swing,loc.z);
      dummy.scale.set(.68,.92,.68);dummy.rotation.set(0,Math.sin(i*22.4+t*.1)*.15,0);dummy.updateMatrix();
      people.setMatrixAt(i,dummy.matrix);
      people.setColorAt(i,personColor.set(personTint[p.skill%personTint.length]));
      dummy.position.set(loc.x,y+1.43+swing,loc.z);
      dummy.scale.set(.88,.88,.88);dummy.updateMatrix();
      heads.setMatrixAt(i,dummy.matrix);
      heads.setColorAt(i,personColor.setHSL(.06+rand(p.id*31)*.08,.32,.58+rand(p.id*43)*.13));
    }
    people.count=n;heads.count=n;
    people.instanceMatrix.needsUpdate=true;heads.instanceMatrix.needsUpdate=true;
    if(people.instanceColor)people.instanceColor.needsUpdate=true;
    if(heads.instanceColor)heads.instanceColor.needsUpdate=true;
    visiblePeople=n;
  }
  function render(dt,now){
    if(!active||disposed)return;
    setCamera();
    const t=now*.001;
    const sunAngle=(state.day%365)/365*Math.PI*2+t*.017;
    sun.position.set(Math.cos(sunAngle)*125,88+Math.sin(sunAngle*.4)*32,70+Math.sin(sunAngle)*45);
    for(let i=0;i<settlementMarkers.length;i++){
      const s=settlementMarkers[i];
      s.userData.spire.rotation.y+=dt*.22;
      s.userData.halo.rotation.z+=dt*.15;
      s.userData.halo.material.opacity=.7;
    }
    updateResidents(t,dt);
    sea.position.y=.42+Math.sin(t*.65)*.06;
    if(now-lastRefresh>2200){
      lastRefresh=now;
      syncCities();
      updateHud();
      news.style.display=menu.classList.contains('open')?'none':'block';
    }
    const exposure=renderer.toneMappingExposure;
    renderer.setRenderTarget(null);
    renderer.toneMappingExposure=1.22;
    renderer.render(world,camera);
    renderer.toneMappingExposure=exposure;
    frameCount++;
    if(now-lastDisplay>1200){
      const fpsRate=Math.round(frameCount*1000/Math.max(1,now-lastFrameAt));
      frameCount=0;lastFrameAt=now;lastDisplay=now;
      fps.textContent=fpsRate+' FPS · '+visiblePeople+' AGENTS · 3D WORLD';
    }
  }
  function onRenderError(error){
    renderFailures++;
    fps.textContent='RENDER ERROR · '+String(error?.message||error).slice(0,60);
    // Keep original world functional if the 3D scene cannot render.
    setActive(false);
  }
  const hook={active:false,frame:render,onRenderError};
  entry.onclick=()=>setActive(true);
  ui.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    const exp=b.dataset.exp;
    if(exp){sim.setSelected(selected);sim.experiment(exp);menu.classList.remove('open');updateHud();syncCities();return}
    switch(b.dataset.act){
      case 'back':setActive(false);break;
      case 'map':sim.setSelected(selected);sim.open();menu.classList.remove('open');break;
      case 'experiment':menu.classList.toggle('open');news.style.display='none';break;
      case 'time':{
        if(state.paused){state.paused=false;state.speed=1}
        else if(state.speed>=30){state.paused=true}
        else{state.speed=[1,3,10,30][([1,3,10,30].indexOf(state.speed)+1)%4]}
        updateHud();break;
      }
      case 'focus':focusSector();break;
      case 'help':el('help').classList.add('open');break;
      case 'closehelp':el('help').classList.remove('open');break;
    }
  });
  // Capture pointers before the old ASTRAEUS steering handlers.
  const pointers=new Map();let gestureLast=null,pressStart=null;
  function onDown(e){
    if(!active)return;
    e.preventDefault();e.stopImmediatePropagation();
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===1)pressStart={x:e.clientX,y:e.clientY,t:performance.now()};
    if(pointers.size===2)gestureLast=null;
    try{canvas.setPointerCapture(e.pointerId)}catch(e){}
  }
  function onMove(e){
    if(!active||!pointers.has(e.pointerId))return;
    e.preventDefault();e.stopImmediatePropagation();
    const old=pointers.get(e.pointerId),dx=e.clientX-old.x,dy=e.clientY-old.y;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===1){
      yaw-=dx*.0075;pitch=clamp(pitch+dy*.0068,.23,1.46);
    }else if(pointers.size===2){
      const pts=[...pointers.values()];
      const d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
      if(gestureLast)zoomTarget=clamp(zoomTarget+(gestureLast-d)*.28,23,285);
      gestureLast=d;
    }
  }
  function onUp(e){
    if(!active)return;
    e.preventDefault();e.stopImmediatePropagation();
    const point=pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if(!pointers.size)gestureLast=null;
    if(pressStart&&point&&Math.hypot(e.clientX-pressStart.x,e.clientY-pressStart.y)<12&&performance.now()-pressStart.t<420){
      const r=canvas.getBoundingClientRect();
      const mx=(e.clientX-r.left)/r.width*2-1,my=-((e.clientY-r.top)/r.height*2-1);
      const candidate=new T.Vector3(),tmp=new T.Vector3();
      let best=-1,dist=Infinity;
      for(const s of state.sectors){
        tmp.set(toX(s.x),terrainAt(s.x,s.y)+11,toZ(s.y));
        tmp.project(camera);
        const d=(tmp.x-mx)**2+(tmp.y-my)**2;
        if(d<dist){dist=d;best=s.id}
      }
      if(best>=0&&dist<.1){selected=best;sim.setSelected(best);updateHud();focusSector()}
    }
    pressStart=null;
  }
  canvas.addEventListener('pointerdown',onDown,true);
  canvas.addEventListener('pointermove',onMove,true);
  canvas.addEventListener('pointerup',onUp,true);
  canvas.addEventListener('pointercancel',onUp,true);
  const preventWheel=e=>{if(!active)return;e.preventDefault();e.stopImmediatePropagation();zoomTarget=clamp(zoomTarget+Math.sign(e.deltaY)*10,23,285)};
  canvas.addEventListener('wheel',preventWheel,{passive:false,capture:true});
  const preventTouch=e=>{if(active&&e.cancelable)e.preventDefault()};
  canvas.addEventListener('touchmove',preventTouch,{passive:false,capture:true});
  syncCities();
  updateResidents(0,.016);
  // Start with the actual 3D living world. Core ASTRAEUS remains paused
  // and is resumed only after the user chooses ORIGINAL WORLD.
  setActive(true);
  function dispose(){
    disposed=true;setActive(false);
    canvas.removeEventListener('pointerdown',onDown,true);
    canvas.removeEventListener('pointermove',onMove,true);
    canvas.removeEventListener('pointerup',onUp,true);
    canvas.removeEventListener('pointercancel',onUp,true);
    canvas.removeEventListener('wheel',preventWheel,true);
    canvas.removeEventListener('touchmove',preventTouch,true);
    ui.remove();entry.remove();
    const geometries=new Set(),materials=new Set(),textures=new Set();
    for(const obj of disposable){
      if(obj?.isBufferGeometry)geometries.add(obj);
      if(obj?.isMaterial)materials.add(obj);
      if(obj?.isTexture)textures.add(obj);
      if(obj?.isObject3D)obj.traverse(child=>{
        if(child.geometry)geometries.add(child.geometry);
        if(child.material){
          if(Array.isArray(child.material))child.material.forEach(m=>materials.add(m));
          else materials.add(child.material);
        }
      });
    }
    for(const g of geometries)g.dispose?.();
    for(const m of materials){if(m.map)textures.add(m.map);m.dispose?.()}
    for(const tex of textures)tex.dispose?.();
    if(root.__livingLab3D===hook)delete root.__livingLab3D;
  }
  return {get active(){return active},get renderedFrames(){return frameCount},setActive,dispose,focusSector,overview};
}