import * as THREE from 'three';
import {poseObject} from './race-track.js?v=58';

// Exterior life is kept beyond every part of the racing corridor, including bends.
export function createOceanVista(root,track,stone,coral,seabed){
  const chunks=[],kelp=new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{time:{value:0},tide:{value:0}},vertexShader:`uniform float time;uniform float tide;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;float tip=uv.y*uv.y;p.x+=sin(time*.65+position.y*.7)*tip*(.35+tide*.25);p.z+=cos(time*.42+position.y*.6)*tip*.25;
#ifdef USE_INSTANCING
p=(instanceMatrix*vec4(p,1.)).xyz;
#endif
gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec2 vUv;void main(){vec3 c=mix(vec3(.025,.12,.095),vec3(.17,.46,.24),vUv.y);float vein=1.-smoothstep(.01,.055,abs(vUv.x-.5));c+=vein*vec3(.08,.16,.06);gl_FragColor=vec4(c,1.);}`});
  const rockGeo=new THREE.IcosahedronGeometry(1,2),bladeGeo=new THREE.PlaneGeometry(.65,5,4,18);bladeGeo.translate(0,2.5,0);
  bladeGeo.userData.groundKind='kelp';rockGeo.userData.groundKind='rock';const pos=rockGeo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),n=1+.1*Math.sin(x*11+y*7+z*13);pos.setXYZ(i,x*n,y*n,z*n)}rockGeo.computeVertexNormals();
  const rockMat=stone.clone();rockMat.color.setHex(0x456b70);rockMat.emissive.setHex(0x102c33);rockMat.emissiveIntensity=.4;
  const coralMat=coral.clone();coralMat.color.setHex(0xca9172);coralMat.emissive.setHex(0x38251c);coralMat.emissiveIntensity=.25;
  const branchGeo=new THREE.CylinderGeometry(.12,.25,3,8,3),capGeo=new THREE.SphereGeometry(.65,16,10);
  const frames=track.frames.filter((_,i)=>i%3===0);
  function outside(mesh){mesh.updateWorldMatrix(true,false);mesh.geometry.computeBoundingSphere();const sphere=mesh.geometry.boundingSphere.clone().applyMatrix4(mesh.matrixWorld);return frames.every(f=>f.p.distanceTo(sphere.center)>10+sphere.radius+(mesh.material===kelp?.7:0))}
  for(let s=80,index=0;s<track.loopStart-140;s+=90,index++){
    const g=new THREE.Group(),F=track.frame(s),right=F.r.clone().setY(0).normalize(),forward=F.f.clone().setY(0).normalize();g.position.copy(F.p);root.add(g);const add=(geo,mat,x,y,z,sx=1,sy=sx,sz=sx)=>{const m=new THREE.Mesh(geo,mat);const point=F.p.clone().addScaledVector(right,x).addScaledVector(forward,z);const floor=seabed.heightAt(point.x,point.z);const offset=mat===kelp?-.15:geo===branchGeo?1.5*sy-.15:geo===capGeo?y:sy*.25;m.position.copy(point).sub(g.position);m.position.y=floor+offset-g.position.y;m.scale.set(sx,sy,sz);g.add(m);if(!outside(m)){g.remove(m);return null}return m};
    for(const side of[-1,1]){
      // Layered basalt reefs create parallax immediately beyond the windows.
      for(let k=0;k<5;k++)add(rockGeo,rockMat,side*(16+k*2.8),-12-k*.8,(k-2)*8,3+k*.4,2.4+k*.5,4+k*.4);
      if(index%3===0)add(rockGeo,rockMat,side*39,-12,12,8,15,7);if(index%4===0)add(rockGeo,rockMat,side*62,-12,-15,12,20+index%3*6,10);
      for(let k=0;k<9;k++){const blade=add(bladeGeo,kelp,side*(14.5+k%3*1.3),-10.5,(k-4)*2.8);if(blade)blade.rotation.y=k*.8+index*.6}
      if(s>track.length*.18&&s<track.length*.51)for(let k=0;k<6;k++){const x=side*(15+k%3*1.4),z=(k-3)*4;add(branchGeo,coralMat,x,-8.5,z,.8,1+k%3*.25,.8);add(capGeo,coralMat,x,3*(1+k%3*.25)-.25,z,1.1,.35,1.1)}
    }
    // One draw per repeated exterior material/shape in each culled chunk.
    const batches=new Map();for(const m of [...g.children]){const key=m.geometry.uuid+':'+m.material.uuid;let list=batches.get(key);if(!list)batches.set(key,list=[]);list.push(m)}
    for(const list of batches.values()){const batch=new THREE.InstancedMesh(list[0].geometry,list[0].material,list.length);list.forEach((m,i)=>{m.updateMatrix();batch.setMatrixAt(i,m.matrix);g.remove(m)});batch.computeBoundingSphere();g.add(batch)}
    chunks.push({g,s});
  }
  // A luminous water gradient replaces the flat dark void beyond distant scenery.
  const waterMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 direction;uniform float time;void main(){vec3 d=normalize(direction);float top=smoothstep(-.45,.75,d.y);vec3 c=mix(vec3(.006,.026,.065),vec3(.065,.24,.31),top);float shaft=pow(max(0.,sin(d.x*24.+d.z*16.+time*.015)),18.)*top*.035;c+=shaft*vec3(.25,.6,.55);gl_FragColor=vec4(c,1.);}`});
  const water=new THREE.Mesh(new THREE.SphereGeometry(900,40,24),waterMat);water.frustumCulled=false;water.renderOrder=-10;root.add(water);
  return{chunks,kelp,water,track,seabed};
}
export function updateOceanVista(v,s,time,tide){v.kelp.uniforms.time.value=time;v.kelp.uniforms.tide.value=tide;v.water.material.uniforms.time.value=time;v.water.position.copy(v.track.pose(s));const viewer=v.track.pose(s);for(const a of v.seabed.anchors)a.m.visible=a.g.visible;for(const c of v.seabed.tiles)c.mesh.visible=c.bounds.distanceToPoint(viewer)<850;for(const c of v.chunks)c.g.visible=Math.abs(c.s-s)<650;}


// One world-space height field: it stays below the route and never rotates with the loop.
export function createSeabed(root,track){
  const samples=track.frames.filter((_,i)=>i%8===0),cache=new Map(),tiles=[],step=8;
  function sample(ix,iz){const key=ix+':'+iz;if(cache.has(key))return cache.get(key);const x=ix*step,z=iz*step;let h=Infinity;for(const F of samples)h=Math.min(h,F.p.y-18+Math.hypot(x-F.p.x,z-F.p.z)*.1);h+=Math.sin(x*.09)*Math.cos(z*.06)*1.8+Math.sin(x*.21+z*.08)*.5;cache.set(key,h);return h}
  function heightAt(x,z){const ix=Math.floor(x/step),iz=Math.floor(z/step),u=x/step-ix,v=z/step-iz,a=sample(ix,iz),b=sample(ix+1,iz),c=sample(ix,iz+1),d=sample(ix+1,iz+1);return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v)}
  const xs=samples.map(F=>F.p.x),zs=samples.map(F=>F.p.z),loX=Math.floor((Math.min(...xs)-110)/step),hiX=Math.ceil((Math.max(...xs)+110)/step),loZ=Math.floor((Math.min(...zs)-100)/step),hiZ=Math.ceil((Math.max(...zs)+100)/step),nx=hiX-loX;
  const material=new THREE.MeshStandardMaterial({color:0x74988a,vertexColors:true,roughness:1,emissive:0x08272a,emissiveIntensity:.3,side:THREE.DoubleSide});
  for(let iz=loZ;iz<hiZ;iz+=10){const nz=Math.min(10,hiZ-iz),p=[],color=[],uv=[],index=[];for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=(loX+i)*step,z=(iz+j)*step,y=sample(loX+i,iz+j),n=.66+.12*Math.sin(x*.07+z*.035);p.push(x,y,z);color.push(n*.82,n,n*.94);uv.push(x/12,z/12)}for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;index.push(a,b,a+1,b,b+1,a+1)}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(color,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();geo.computeBoundingBox();const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=true;root.add(mesh);tiles.push({mesh,bounds:geo.boundingBox.clone()})}
  const anchors=[];
  function support(g,x,z,material){g.updateWorldMatrix(true,false);const top=g.localToWorld(new THREE.Vector3(x,-.1,z)),bottom=top.clone();bottom.y=heightAt(top.x,top.z)-.5;const height=top.y-bottom.y;if(height<1)return;const axis=top.clone().sub(bottom).normalize();for(const F of track.frames){const t=THREE.MathUtils.clamp(F.p.clone().sub(bottom).dot(axis),0,height);if(bottom.clone().addScaledVector(axis,t).distanceTo(F.p)<9.7)return}const m=new THREE.Mesh(new THREE.CylinderGeometry(.55,.9,height,10,1),material);m.position.copy(top).add(bottom).multiplyScalar(.5);m.castShadow=m.receiveShadow=true;root.add(m);anchors.push({m,bottom,top,g})}
  function plant(g,mesh){g.updateWorldMatrix(true,false);mesh.updateMatrix();const p=mesh.getWorldPosition(new THREE.Vector3());p.y=heightAt(p.x,p.z)+.25;mesh.position.copy(g.worldToLocal(p));mesh.quaternion.copy(g.getWorldQuaternion(new THREE.Quaternion()).invert());}
  return{heightAt,tiles,anchors,support,plant};
}
