
export async function mount(root){
const $=s=>root.querySelector('#'+s),canvas=$('vxCanvas'),stage=$('vxStage');
const T=await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
const mobile=/iPhone|iPad|Android/i.test(navigator.userAgent),W=64,D=64,H=38,S=16;
const voxel=new Uint8Array(W*D*H),meshes=new Map(),callbacks=[],disposers=[],saved=new Map(),blockNames=['Air','Grass','Dirt','Stone','Sand','Pine','Leaves','Planks','Bricks','Copper','Glass','Glow','Snow','Cobble','Moss','Slate'],palette=[1,2,3,5,7,10,11,8];
const inside=(x,y,z)=>x>=0&&z>=0&&y>=0&&x<W&&z<D&&y<H,index=(x,y,z)=>(y*D+z)*W+x;
const get=(x,y,z)=>inside(x,y,z)?voxel[index(x,y,z)]:y<0?3:0;
const put=(x,y,z,id)=>{if(inside(x,y,z))voxel[index(x,y,z)]=id};
const hash=(x,z,s=1)=>{let a=Math.sin(x*127.1+z*311.7+s*53.3)*43758.545;return a-Math.floor(a)};
const interp=t=>t*t*(3-2*t);
function noise(x,z,s=1){let a=Math.floor(x),b=Math.floor(z),u=interp(x-a),v=interp(z-b);
return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b,s),hash(a+1,b,s),u),T.MathUtils.lerp(hash(a,b+1,s),hash(a+1,b+1,s),u),v)}
function height(x,z){return Math.max(6,Math.min(26,Math.floor(8+noise(x*.075,z*.075,2)*6+noise(x*.19,z*.19,7)*3+Math.max(0,(22-z)/22)*11*noise(x*.08,z*.08,11))))}
for(let x=0;x<W;x++)for(let z=0;z<D;z++){
let h=height(x,z);for(let y=0;y<=h;y++)put(x,y,z,y===h?(h<10?4:h>22?12:1):y>h-4?2:(hash(x+y*.1,z+y*.4,18)>.972?9:3));
}
for(let x=3;x<W-3;x++)for(let z=3;z<D-3;z++){
const h=height(x,z);
if(h<11||h>22||(x>21&&x<49&&z>23&&z<43))continue;
if(hash(x,z,23)>.972){
const trunk=3+Math.floor(hash(x,z,30)*3);
for(let y=1;y<=trunk;y++)put(x,h+y,z,5);
for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
if(Math.abs(dx)+Math.abs(dz)+Math.abs(dy)*.65>3.8)continue;
if(hash(x+dx+dy,z+dz,34)<.12)continue;
if(get(x+dx,h+trunk+dy,z+dz)===0)put(x+dx,h+trunk+dy,z+dz,6)}
}
}
const hx=42,hz=32,hy=Math.min(26,Math.max(...[38,39,40,41,42,43,44].map(x=>height(x,32)))+2);
for(let x=36;x<=47;x++)for(let z=26;z<=39;z++){
for(let y=hy;y<H;y++)put(x,y,z,0);
for(let y=height(x,z)+1;y<hy;y++)put(x,y,z,3);
}
for(let x=37;x<=46;x++)for(let z=27;z<=38;z++)put(x,hy,z,7);
for(let y=hy+1;y<=hy+4;y++){
for(let x=38;x<=45;x++)for(const z of [28,37])put(x,y,z,x===38||x===45?5:7);
for(let z=28;z<=37;z++)for(const x of [38,45])put(x,y,z,z===28||z===37?5:7);
}
for(let y=hy+1;y<=hy+3;y++)for(const x of [40,41])put(x,y,37,0);
for(let x=39;x<=43;x++)for(let y=hy+2;y<=hy+3;y++)put(x,y,28,10);
for(let k=0;k<3;k++)for(let x=37+k;x<=46-k;x++)for(let z=27-k;z<=38+k;z++)put(x,hy+5+k,z,k===2?15:7);
for(let z=38;z<=41;z++)for(let x=39;x<=42;x++)put(x,hy,z,7);
for(let x=39;x<=42;x++)for(let y=height(x,40)+1;y<hy;y++)put(x,y,40,7);
const saveKey='voxel-vale-world-1';try{let a=JSON.parse(localStorage.getItem(saveKey)||'[]');if(Array.isArray(a))for(const [key,id] of a.slice(0,20000)){let [x,y,z]=key.split(',').map(Number);if(inside(x,y,z)&&Number.isInteger(id)&&id>=0&&id<=15){put(x,y,z,id);saved.set(key,id)}}}catch(e){}
const ren=new T.WebGLRenderer({canvas,antialias:!mobile,powerPreference:'high-performance'});
ren.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.15:1.6));
ren.outputColorSpace=T.SRGBColorSpace;ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=1.16;
ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.fog=new T.FogExp2(0xa3c7d5,.013);
const camera=new T.PerspectiveCamera(76,1,.07,260);camera.rotation.order='YXZ';
const hemisphere=new T.HemisphereLight(0xb9e8ff,0x53684c,2.1);scene.add(hemisphere);
const sun=new T.DirectionalLight(0xffeacb,3.3);sun.position.set(90,94,65);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:1536,mobile?1024:1536);sun.shadow.camera.left=-70;sun.shadow.camera.right=70;sun.shadow.camera.top=70;sun.shadow.camera.bottom=-70;sun.shadow.camera.far=260;sun.shadow.normalBias=.04;sun.target.position.set(32,12,32);scene.add(sun,sun.target);
const sky=new T.Mesh(new T.SphereGeometry(200,24,14),new T.MeshBasicMaterial({color:0x78b0d5,side:T.BackSide,fog:false}));scene.add(sky);
const AC=document.createElement('canvas');AC.width=AC.height=256;
const ctx=AC.getContext('2d'),pixels=ctx.createImageData(256,256);
const colors=[[78,160,69],[103,138,76],[116,82,56],[127,136,141],[206,182,126],[113,81,49],[153,111,69],[70,137,70],[161,117,75],[155,82,64],[143,205,219],[120,224,226],[211,222,227],[105,107,114],[84,132,77],[75,92,119]];
for(let tile=0;tile<16;tile++){
const c=colors[tile],ox=(tile%4)*64,oy=Math.floor(tile/4)*64;
for(let yy=0;yy<64;yy++)for(let xx=0;xx<64;xx++){
let grain=(hash(xx+tile*57,yy,70)-.5)*41+(hash(Math.floor(xx/6),Math.floor(yy/6),tile)-.5)*17;
if(tile===1&&yy<12)grain-=35;
if(tile===5||tile===6)grain+=Math.sin(xx*.3+Math.sin(yy*.09))*23;
if(tile===7)grain+=Math.sin(xx*.28+yy*.33)*15;
if(tile===8)grain+=yy%21<2?-46:Math.sin(xx*.1)*10;
if(tile===9&&(yy%28<3||(xx+(Math.floor(yy/28)%2)*14)%28<3))grain=-95;
if(tile===11)grain+=39;
if(tile===12)grain+=16;
if(tile===15)grain+=Math.sin(xx*.11+yy*.33)*20;
const q=((oy+yy)*256+ox+xx)*4;
for(let k=0;k<3;k++)pixels.data[q+k]=Math.max(0,Math.min(255,c[k]+grain));pixels.data[q+3]=255;
}}
ctx.putImageData(pixels,0,0);
const atlas=new T.CanvasTexture(AC);atlas.colorSpace=T.SRGBColorSpace;atlas.magFilter=T.NearestFilter;atlas.minFilter=T.NearestMipmapLinearFilter;atlas.anisotropy=Math.min(4,ren.capabilities.getMaxAnisotropy());
const material=new T.MeshStandardMaterial({map:atlas,vertexColors:true,roughness:.85,side:T.FrontSide});
const def=[
{n:[1,0,0],c:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],s:.8},
{n:[-1,0,0],c:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]],s:.76},
{n:[0,1,0],c:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],s:1},
{n:[0,-1,0],c:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],s:.57},
{n:[0,0,1],c:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],s:.9},
{n:[0,0,-1],c:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],s:.71}
];
const faceTile=(id,dir)=>id===1?dir===2?0:dir===3?2:1:id===5?(dir===2||dir===3?6:5):id===6?7:id===7?8:id===8?9:id===9?10:id===10?10:id===11?11:id===12?12:id===13?13:id===14?14:id===15?15:id===4?4:id===2?2:3;
function chunk(cx,cz){
const key=cx+','+cz,old=meshes.get(key);if(old){scene.remove(old);old.geometry.dispose();meshes.delete(key)}
const p=[],norm=[],uv=[],col=[],ix=[];let vert=0;
for(let x=cx*S;x<Math.min(W,(cx+1)*S);x++)for(let z=cz*S;z<Math.min(D,(cz+1)*S);z++)for(let y=0;y<H;y++){
const id=get(x,y,z);if(!id)continue;
for(let fi=0;fi<6;fi++){
const f=def[fi],n=f.n,other=get(x+n[0],y+n[1],z+n[2]);
if(other&&!(id!==6&&id!==10&&(other===6||other===10)))continue;
const ti=faceTile(id,fi),u0=(ti%4)/4+.004,u1=(ti%4+1)/4-.004,v0=1-(Math.floor(ti/4)+1)/4+.004,v1=1-Math.floor(ti/4)/4-.004;
const uvFace=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]],shade=f.s*(.93+hash(x,z,y)*.07)*(id===11?1.17:1);
for(let k=0;k<4;k++){
const pt=f.c[k];p.push(x+pt[0],y+pt[1],z+pt[2]);norm.push(...n);uv.push(...uvFace[k]);col.push(shade,shade,shade);
}
ix.push(vert,vert+1,vert+2,vert,vert+2,vert+3);vert+=4;
}}
if(!ix.length)return;
const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(ix);g.computeBoundingSphere();
const mesh=new T.Mesh(g,material);mesh.receiveShadow=true;mesh.castShadow=true;scene.add(mesh);meshes.set(key,mesh);
}
for(let a=0;a<4;a++)for(let b=0;b<4;b++)chunk(a,b);
const water=new T.Mesh(new T.PlaneGeometry(64,64,16,16),new T.MeshPhysicalMaterial({color:0x3c9cb6,metalness:.28,roughness:.12,transparent:true,opacity:.65,depthWrite:false,side:T.DoubleSide,clearcoat:1}));
water.rotation.x=-Math.PI/2;water.position.set(32,9.54,32);water.renderOrder=3;scene.add(water);
const cloudMat=new T.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.82,depthWrite:false});
const clouds=[];
for(let i=0;i<13;i++){const group=new T.Group();group.position.set(hash(i,2)*84-10,34+hash(i,3)*13,hash(i,4)*80-8);
for(let j=0;j<4;j++){const b=new T.Mesh(new T.BoxGeometry(5+j*1.1,1.5+j*.25,3.4+j*.4),cloudMat);b.position.set(j*2.8,Math.sin(j)*.5,j%2);group.add(b)}
scene.add(group);clouds.push(group)}
const lantern=new T.Mesh(new T.BoxGeometry(.9,.9,.9),new T.MeshBasicMaterial({color:0xffd38d}));lantern.position.set(41,hy+1.5,40);scene.add(lantern);
const lanternLight=new T.PointLight(0xffbf78,12,14,2);lanternLight.position.copy(lantern.position);scene.add(lanternLight);
const outline=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.02,1.02,1.02)),new T.LineBasicMaterial({color:0xffeaa8,transparent:true,opacity:.94,depthTest:false}));outline.visible=false;outline.renderOrder=20;scene.add(outline);
const ray=new T.Raycaster();ray.far=7.4;
const user={x:29.5,z:32.5,feet:height(29,32)+1,vy:0,ground:false,fly:false},input={mx:0,my:0,lx:0,ly:0};
let yaw=-1.55,pitch=-.09,selected=0,time=.26,active=true,mineHeld=false,placeHeld=false,lastAction=0,last=performance.now(),dayPause=false,saveTimer=null,hit=null;
const listen=(el,type,fn,opts)=>{el.addEventListener(type,fn,opts);disposers.push(()=>el.removeEventListener(type,fn,opts))};
const message=t=>{$('vxAction').textContent=t};
const slots=$('vxSlots');slots.innerHTML='';
const swatches=[];
for(let i=0;i<8;i++){
let id=palette[i],b=document.createElement('button');b.type='button';b.className='vxSlot';
b.innerHTML='<span class="swatch"></span><small>'+blockNames[id]+'</small>';
b.querySelector('.swatch').style.background='rgb('+colors[id].join(',')+')';
b.onclick=()=>{selected=i;swatches.forEach((s,j)=>s.classList.toggle('chosen',j===i));message('SELECTED '+blockNames[id].toUpperCase())};
swatches.push(b);slots.appendChild(b)
}
swatches[0].classList.add('chosen');
function save(){try{localStorage.setItem(saveKey,JSON.stringify([...saved]))}catch(e){}}
function write(x,y,z,id){
if(!inside(x,y,z)||y<1)return false;
put(x,y,z,id);saved.set(x+','+y+','+z,id);
const cx=Math.floor(x/S),cz=Math.floor(z/S);chunk(cx,cz);
if(x%S===0&&cx>0)chunk(cx-1,cz);if(x%S===S-1&&cx<3)chunk(cx+1,cz);
if(z%S===0&&cz>0)chunk(cx,cz-1);if(z%S===S-1&&cz<3)chunk(cx,cz+1);
if(saveTimer)clearTimeout(saveTimer);saveTimer=setTimeout(save,2500);
return true;
}
function aim(){
ray.setFromCamera(new T.Vector2(0,0),camera);
const hits=ray.intersectObjects([...meshes.values()],false);
hit=null;
for(const h of hits){
const n=h.face?.normal;if(!n)continue;
const x=Math.floor(h.point.x-n.x*.01),y=Math.floor(h.point.y-n.y*.01),z=Math.floor(h.point.z-n.z*.01);
if(inside(x,y,z)&&get(x,y,z)){hit={x,y,z,id:get(x,y,z),nx:n.x,ny:n.y,nz:n.z};break}
}
outline.visible=!!hit;
if(hit){outline.position.set(hit.x+.5,hit.y+.5,hit.z+.5);$('vxTarget').textContent=blockNames[hit.id]+' · '+hit.x+','+hit.y+','+hit.z}
else $('vxTarget').textContent='Explore • Mine • Build';
}
function action(type){
aim();if(!hit){message('AIM AT A NEARBY BLOCK');return}
if(type==='mine'){if(write(hit.x,hit.y,hit.z,0))message('MINED '+blockNames[hit.id].toUpperCase())}
else{
const x=hit.x+hit.nx,y=hit.y+hit.ny,z=hit.z+hit.nz;
if(!inside(x,y,z)||get(x,y,z)){message('SPACE OCCUPIED');return}
if(Math.abs(user.x-x-.5)<.65&&Math.abs(user.z-z-.5)<.65&&y<user.feet+1.8&&y+1>user.feet){message('TOO CLOSE TO PLAYER');return}
if(write(x,y,z,palette[selected]))message('PLACED '+blockNames[palette[selected]].toUpperCase())
}}
function bindAction(id,type){
const el=$(id);let pid=null;
listen(el,'pointerdown',e=>{e.preventDefault();e.stopPropagation();pid=e.pointerId;el.setPointerCapture(pid);if(type==='mine')mineHeld=true;else placeHeld=true;action(type)});
const end=e=>{if(e.pointerId===pid){pid=null;if(type==='mine')mineHeld=false;else placeHeld=false}};
for(const k of ['pointerup','pointercancel','lostpointercapture'])listen(el,k,end);
}
bindAction('vxMine','mine');bindAction('vxPlace','place');
for(const [id,prefix] of [['vxMove','m'],['vxLook','l']]){
const el=$(id),nub=el.querySelector('.vxNub');let pid=null;
const change=e=>{const rect=el.getBoundingClientRect(),dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2,length=Math.max(1,Math.hypot(dx,dy)),max=rect.width*.32,k=Math.min(max,length)/length;
input[prefix+'x']=dx*k/max;input[prefix+'y']=-dy*k/max;
nub.style.transform='translate('+input[prefix+'x']*max+'px,'+(-input[prefix+'y']*max)+'px)'};
listen(el,'pointerdown',e=>{e.preventDefault();e.stopPropagation();pid=e.pointerId;el.setPointerCapture(pid);change(e)});
listen(el,'pointermove',e=>{if(e.pointerId===pid){e.preventDefault();change(e)}});
const end=e=>{if(e.pointerId===pid){pid=null;input[prefix+'x']=input[prefix+'y']=0;nub.style.transform='translate(0,0)'}};
for(const k of ['pointerup','pointercancel','lostpointercapture'])listen(el,k,end);
}
const keys=new Set(),jump=()=>{if(user.fly)user.feet=Math.min(35,user.feet+1.6);else if(user.ground){user.vy=9;user.ground=false}};
listen($('vxJump'),'pointerdown',e=>{e.preventDefault();e.stopPropagation();jump()});
$('vxFly').onclick=()=>{user.fly=!user.fly;user.vy=0;$('vxFly').textContent=user.fly?'FLY ON':'FLY OFF';$('vxFly').classList.toggle('active',user.fly)};
listen(stage,'keydown',e=>{keys.add(e.key.toLowerCase());if(e.key===' '){e.preventDefault();jump()}if(/^[1-8]$/.test(e.key))swatches[Number(e.key)-1].click();if(e.key.toLowerCase()==='e')action('place')});
listen(stage,'keyup',e=>keys.delete(e.key.toLowerCase()));
let drag=null;
listen(canvas,'pointerdown',e=>{stage.focus({preventScroll:true});drag=[e.pointerId,e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);if(e.pointerType==='mouse'&&e.shiftKey)action('mine')});
listen(canvas,'pointermove',e=>{if(!drag||drag[0]!==e.pointerId)return;yaw-=(e.clientX-drag[1])*.0048;pitch=T.MathUtils.clamp(pitch+(e.clientY-drag[2])*.004,-1.4,1.4);drag=[e.pointerId,e.clientX,e.clientY]});
for(const ev of ['pointerup','pointercancel'])listen(canvas,ev,e=>{if(drag&&drag[0]===e.pointerId)drag=null});
listen(canvas,'contextmenu',e=>e.preventDefault());
listen(window,'pagehide',save);
function collision(x,y,z){return [y+.05,y+.8,y+1.53].some(h=>{let id=get(Math.floor(x),Math.floor(h),Math.floor(z));return id!==0&&id!==6&&id!==10})}
function playerTick(dt){
const key=k=>keys.has(k);
yaw-=input.lx*dt*2.45;pitch=T.MathUtils.clamp(pitch+input.ly*dt*1.9,-1.4,1.4);
let f=input.my+(key('w')||key('arrowup')?1:0)-(key('s')||key('arrowdown')?1:0);
let r=input.mx+(key('d')||key('arrowright')?1:0)-(key('a')||key('arrowleft')?1:0);
const len=Math.max(1,Math.hypot(f,r));f/=len;r/=len;
const speed=key('shift')?8.2:5.3;
const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)*speed*dt,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)*speed*dt;
for(const [axis,d] of [['x',dx],['z',dz]]){
const next=T.MathUtils.clamp(user[axis]+d,.7,63.3),x=axis==='x'?next:user.x,z=axis==='z'?next:user.z;
if(!collision(x,user.feet,z))user[axis]=next;
else if(user.ground&&!collision(x,user.feet+1,z)){user[axis]=next;user.feet+=1}
}
if(user.fly){user.feet+=((key(' ')||key('space')?1:0)-(key('c')?1:0))*dt*7;user.feet=T.MathUtils.clamp(user.feet,2,34)}
else{
user.vy=Math.max(-35,user.vy-23*dt);
let next=user.feet+user.vy*dt;
if(user.vy<=0&&get(Math.floor(user.x),Math.floor(next-.05),Math.floor(user.z))&&!([6,10].includes(get(Math.floor(user.x),Math.floor(next-.05),Math.floor(user.z))))){
user.feet=Math.floor(next-.05)+1;user.vy=0;user.ground=true
}else{user.feet=next;user.ground=false}
if(user.feet<1){user.feet=height(Math.floor(user.x),Math.floor(user.z))+2;user.vy=0}
}
camera.position.set(user.x,user.feet+1.63,user.z);camera.rotation.set(pitch,yaw,0,'YXZ');
}
const world={scene,THREE:T,player:user,blocks:blockNames,getBlock:get,setBlock:write,addObject:o=>scene.add(o),onTick:fn=>{if(typeof fn==='function')callbacks.push(fn)},notify:message,setTime:t=>{time=((Number(t)%1)+1)%1},getTime:()=>time,save};
function resize(){const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();ren.setSize(w,h,false)}
resize();const obs=new ResizeObserver(resize);obs.observe(stage);
const clock=new T.Clock();let fpsStart=performance.now(),fpsFrames=0,slow=0,lastTick=performance.now();
function frame(){
if(!active||!root.isConnected)return;requestAnimationFrame(frame);
const now=performance.now(),dt=Math.min(.05,(now-lastTick)/1000),t=clock.getElapsedTime();lastTick=now;
playerTick(dt);
time=(time+dt/850)%1;
const a=time*Math.PI*2,alt=Math.sin(a),day=T.MathUtils.smoothstep(alt,-.2,.15);
sun.position.set(32+Math.cos(a)*92,20+alt*111,32+Math.sin(a*.7)*45);
sun.intensity=.15+3.2*day;hemisphere.intensity=.4+1.7*day;
sky.material.color.setRGB(.06+.44*day,.13+.54*day,.25+.55*day);
scene.fog.color.setRGB(.1+.52*day,.16+.59*day,.25+.56*day);
lanternLight.intensity=5+12*(1-day);
for(const c of clouds){c.position.x+=dt*.29;if(c.position.x>100)c.position.x=-20}
$('vxTime').textContent=String(Math.floor(time*24)).padStart(2,'0')+':'+String(Math.floor(time*24%1*60)).padStart(2,'0');
if(now-lastAction>230&&(mineHeld||placeHeld)){action(mineHeld?'mine':'place');lastAction=now}
aim();for(const f of callbacks){try{f(dt,t)}catch(e){console.warn(e)}}
ren.render(scene,camera);fpsFrames++;
if(now-fpsStart>1500){const fps=Math.round(fpsFrames*1000/(now-fpsStart));$('vxFps').textContent=fps+' FPS';$('vxCoords').textContent='X '+Math.floor(user.x)+'  Y '+Math.floor(user.feet)+'  Z '+Math.floor(user.z);
fpsFrames=0;fpsStart=now;if(fps<24&&ren.getPixelRatio()>.75){slow++;if(slow>1){ren.setPixelRatio(Math.max(.75,ren.getPixelRatio()-.12));resize();slow=0}}else slow=0}
}
requestAnimationFrame(frame);
return {api:world,dispose(){active=false;obs.disconnect();if(saveTimer)clearTimeout(saveTimer);save();for(const d of disposers)d();ren.dispose();for(const m of meshes.values())m.geometry.dispose();atlas.dispose()}};
}
