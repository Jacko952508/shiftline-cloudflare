import * as THREE from 'three';

// Art detail lives on the actual surfaces, in their existing draw calls.
// There are no transparent decals, added lights or screen-space depth effects.
const accent=[0,0x79d7f0,0x75c9b4,0xd69965,0xa7c8e4,0xa7bf78,0xafa4d6];
const noise=`
float adHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float adNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(adHash(i),adHash(i+vec2(1.,0.)),f.x),mix(adHash(i+vec2(0.,1.)),adHash(i+1.),f.x),f.y);}
float adLine(float x,float width){float a=max(fwidth(x),.0005);return 1.-smoothstep(width-a,width+a,abs(x));}
`;

export function finishSurface(material,role='tunnel',course=1){
 if(!material||material.isMeshBasicMaterial||material.isShaderMaterial)return material;
 const mirror=role==='ship'&&material.metalness>.96&&material.roughness<.2;
 const signature=role+'-'+course+(mirror?'-mirror':'');
 if(material.userData.art148===signature)return material;
 if(material.userData.art148)throw Error('Material has incompatible art roles');
 material.userData.art148=signature;
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 const c=new THREE.Color(accent[course]||accent[1]);
 const tint=`vec3(${c.r.toFixed(5)},${c.g.toFixed(5)},${c.b.toFixed(5)})`;
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  shader.vertexShader='varying vec3 adWorld;varying vec3 adLocal;varying vec2 adUv;varying vec3 adSurfaceNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
   adLocal=transformed;adUv=uv;adSurfaceNormal=inverseTransformDirection(transformedNormal,viewMatrix);
   vec4 adPosition=vec4(transformed,1.);
   #ifdef USE_INSTANCING
    adPosition=instanceMatrix*adPosition;
   #endif
   adWorld=(modelMatrix*adPosition).xyz;
   #include <project_vertex>
  `);
  shader.fragmentShader='varying vec3 adWorld;varying vec3 adLocal;varying vec2 adUv;varying vec3 adSurfaceNormal;\n'+noise+shader.fragmentShader;
  let color='',normal='',emission='';
  if(role==='canopy'||role==='organic'){
   color=`vec2 adP=adLocal.xz*7.+adLocal.y*vec2(2.7,1.3);
    float adLeaves=adNoise(adP)*.65+adNoise(adP*2.9)*.35;
    float adFilter=1.-smoothstep(.12,.85,length(fwidth(adP)));
    float adMottle=mix(.55,adLeaves,adFilter);
    diffuseColor.rgb*=.63+.57*adMottle;
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.13,1.08,.78),smoothstep(.58,.85,adMottle)*.40);`;
  }else if(role==='landscape'){
   color=`vec3 adN=abs(normalize(adSurfaceNormal));
    vec2 adRockUV=adN.y>.65?adWorld.xz:adN.x>adN.z?adWorld.zy:adWorld.xy;
    vec2 adRockP=adRockUV*.11;
    float adRock=adNoise(adRockP)*.65+adNoise(adRockP*3.1)*.35;
    float adSediment=.5+.5*sin(adWorld.y*.23+adNoise(adWorld.xz*.028)*5.);
    float adDetailFade=1.-smoothstep(.15,.9,length(fwidth(adRockP)));
    diffuseColor.rgb*=mix(1.,.73+.34*adRock+.13*adSediment,adDetailFade);
    diffuseColor.rgb+=${tint}*.012*adSediment;`;
   normal=`vec2 adDeriv=vec2(dFdx(adRock),dFdy(adRock))*adDetailFade;
    vec3 adDx=dFdx(-vViewPosition),adDy=dFdy(-vViewPosition);
    vec3 adCrossX=cross(adDy,normal),adCrossY=cross(normal,adDx);
    float adDet=dot(adDx,adCrossX);
    normal=normalize((abs(adDet)+1.e-7)*normal-sign(adDet)*(adDeriv.x*adCrossX+adDeriv.y*adCrossY)*.10);`;
  }else if(role==='city'){
   color=`vec2 adGrid=vec2(adWorld.x+adWorld.z,adWorld.y)*vec2(.14,.22);
    vec2 adCell=fract(adGrid),adFoot=max(fwidth(adGrid),vec2(.002));
    vec2 adFrame=smoothstep(vec2(.18)-adFoot,vec2(.24)+adFoot,adCell)*(1.-smoothstep(vec2(.70)-adFoot,vec2(.80)+adFoot,adCell));
    float adWindow=adFrame.x*adFrame.y;
    float adFace=1.-smoothstep(.25,.75,abs(normalize(adSurfaceNormal).y));
    float adLit=step(.52,adHash(floor(adGrid)));
    float adVisible=1.-smoothstep(.20,.65,max(adFoot.x,adFoot.y));
    diffuseColor.rgb*=1.-adWindow*adFace*.33*adVisible;`;
   emission=`totalEmissiveRadiance+=${tint}*adWindow*adFace*adLit*adVisible*.26;`;
  }else{
   const ship=role==='ship',obstacle=role==='obstacle';
   color=`vec2 adGrid=adUv*vec2(${ship?'3.,5.':obstacle?'4.,3.':'4.,6.'});
    vec2 adCell=fract(adGrid),adFoot=max(fwidth(adGrid),vec2(.001));
    float adFade=1.-smoothstep(.13,.42,max(adFoot.x,adFoot.y));
    float adGap=min(min(adCell.x,1.-adCell.x),min(adCell.y,1.-adCell.y));
    float adSeam=1.-smoothstep(.010-max(adFoot.x,adFoot.y),.024+max(adFoot.x,adFoot.y),adGap);
    float adBevel=adLine(adGap-.037,.010)*adFade;
    float adWear=adNoise(adUv*vec2(17.,29.));
    float adVent=adLine(adCell.y-.73,.11)*adLine(adCell.x-.5,.22);
    float adSlots=.5+.5*cos(adCell.x*75.4);
    adVent*=smoothstep(.52,.70,adSlots)*adFade;
    float adMark=adLine(adCell.x-.15,.016)*adLine(adCell.y-.30,.15)*adFade;
    diffuseColor.rgb*=1.-adSeam*adFade*${ship?'.09':'.24'}-adVent*${ship?'.07':'.16'};
    diffuseColor.rgb+=vec3(.027)*adBevel;
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*${tint},adMark*${ship?'.24':'.36'});
    diffuseColor.rgb*=.95+.05*adWear;`;
   normal=`roughnessFactor=clamp(roughnessFactor+adSeam*adFade*.10+(adWear-.5)*.055,${ship?(mirror?'.07':'.22'):'.40'},.96);`;
  }
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n'+color);
  if(normal)shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+normal);
  if(emission)shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n'+emission);
 };
 material.customProgramCacheKey=()=>key+'/art-148-'+signature;
 material.needsUpdate=true;return material;
}

// Bevels are inset: the original collider/decoration bounds still enclose
// every vertex, including the extruded end caps.
export function bevelBox(width,height,depth,bevel=.04){
 const b=Math.min(bevel,width*.23,height*.23,depth*.23);
 const shape=new THREE.Shape(),x=width*.5-b,y=height*.5-b;
 shape.moveTo(-x,-y);shape.lineTo(x,-y);shape.lineTo(x,y);shape.lineTo(-x,y);shape.closePath();
 const g=new THREE.ExtrudeGeometry(shape,{depth:depth-2*b,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:1,steps:1,curveSegments:1});
 g.translate(0,0,-depth*.5+b);g.computeBoundingBox();return g;
}

export function weatheredRock(detail=1,smooth=false){
 const g=new THREE.IcosahedronGeometry(1,detail),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=Math.hypot(x,y,z);
  const k=(.86+.075*Math.sin(x*9+y*4)*Math.cos(z*7)+.05*Math.sin(y*13-z*5))/r;
  p.setXYZ(i,x*k,y*k,z*k);
 }
 g.computeVertexNormals();if(smooth){const n=g.attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=Math.hypot(x,y,z);n.setXYZ(i,x/r,y/r,z/r);}}g.computeBoundingSphere();return g;
}

export function skylineBlock(){
 const g=new THREE.BoxGeometry(1,1,1,1,8,1),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const y=p.getY(i),setback=y>.34?.68:y>.17?.82:1;
  p.setX(i,p.getX(i)*setback);p.setZ(i,p.getZ(i)*setback);
 }
 g.computeVertexNormals();return g;
}

export function refineAlpineGeology(root){
 const seen=new Set();
 root.traverse(o=>{
  const g=o.geometry,m=o.material;
  if(!g||g.type!=='IcosahedronGeometry'||!m||m.isMeshBasicMaterial||m.isShaderMaterial)return;
  if(!seen.has(g)){
   seen.add(g);const p=g.attributes.position,n=g.attributes.normal;
   for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=Math.max(1.e-6,Math.hypot(x,y,z));
    n.setXYZ(i,x/r,y/r,z/r);
   }
   n.needsUpdate=true;
  }
  m.flatShading=false;m.needsUpdate=true;
 });
}

export function installShipFinish(ship,root,index,cosmetics,materials,high){
 const seen=new Set();
 root.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material])){
  if(!m||seen.has(m)||m===materials.glass||m.transparent||(!m.isMeshStandardMaterial&&!m.isMeshPhysicalMaterial))continue;
  seen.add(m);finishSurface(m,'ship',index+1);
 }});
 if(!materials.premium){
  materials.hull.clearcoat=Math.max(materials.hull.clearcoat,cosmetics.finish===2?.12:.46);
  materials.hull.clearcoatRoughness=cosmetics.finish===2?.38:.19;
 }
 ship.userData.artFinish={version:148,model:index,materials:seen.size,high:!!high};
 if(high&&typeof window!=='undefined'&&typeof location!=='undefined'&&location.search.includes('graphicsqa=1'))
  window.__shiftlineShipArtQA={...ship.userData.artFinish};
}
