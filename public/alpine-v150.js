import * as THREE from 'three';
// Shared indexed ridge mesh. Its footprint and top stay inside the existing
// clearance envelopes; only the interior silhouette changes.
export function alpineRidgeGeometry(low=false,grounded=false){
 const segments=low?18:32,vertices=[],uv=[],indices=[];
 for(let z=0;z<=segments;z++)for(let x=0;x<=segments;x++){
  const px=x/segments*2-1,pz=z/segments*2-1;
  const edge=Math.max(0,1-Math.max(Math.abs(px),Math.abs(pz))**3);
  const spine=pz+.15*Math.sin(px*4.1);
  const peaks=Math.max(Math.exp(-((px-.23)**2/.17+spine**2/.12)),.77*Math.exp(-((px+.43)**2/.19+(spine+.12)**2/.18)));
  const erosion=(.025*Math.sin(px*29+pz*19)+.018*Math.sin(px*47-pz*31))*edge;
  const h=THREE.MathUtils.clamp((.25*edge+.76*peaks)*edge+erosion,0,1);
  vertices.push(px,grounded?h:-.48+h*1.48,pz);uv.push(x/segments,z/segments);
 }
 for(let z=0;z<segments;z++)for(let x=0;x<segments;x++){
  const a=z*(segments+1)+x,b=a+1,c=a+segments+1,d=c+1;
  indices.push(a,c,b,b,c,d);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();g.userData.alpine150=true;return g;
}
const noise=`float alpHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float alpNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(alpHash(i),alpHash(i+vec2(1.,0.)),f.x),mix(alpHash(i+vec2(0.,1.)),alpHash(i+1.),f.x),f.y);}`;
export function alpineSurface(material){
 if(!material||material.userData.alpine150||material.isMeshBasicMaterial)return;
 material.userData.alpine150=true;material.flatShading=false;
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  shader.vertexShader='varying vec3 alpWorld;varying vec3 alpNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 alpP=vec4(transformed,1.);
   #ifdef USE_INSTANCING
    alpP=instanceMatrix*alpP;
   #endif
   alpWorld=(modelMatrix*alpP).xyz;alpNormal=inverseTransformDirection(transformedNormal,viewMatrix);
   #include <project_vertex>`);
  shader.fragmentShader='varying vec3 alpWorld;varying vec3 alpNormal;\n'+noise+'\n'+shader.fragmentShader;
  // Insert before lighting, after all older albedo hooks. Dark exposed cliffs
  // and wind-scoured snow replace the all-white, marshmallow-like boulders.
  shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>',`#include <alphamap_fragment>
   vec3 alpN=normalize(alpNormal);vec3 alpA=abs(alpN);
   vec2 alpUV=alpA.y>.65?alpWorld.xz:alpA.x>alpA.z?alpWorld.zy:alpWorld.xy;
   float alpBroad=alpNoise(alpWorld.xz*.024);
   float alpStone=alpNoise(alpUV*.16)*.65+alpNoise(alpUV*.49)*.35;
   float alpStrata=.5+.5*sin(alpWorld.y*.19+alpNoise(alpWorld.xz*.036)*4.);
   float alpSnow=smoothstep(.30,.78,alpN.y+(alpBroad-.5)*.24)*smoothstep(105.,290.,alpWorld.y+alpBroad*45.);
   vec3 alpRock=mix(vec3(.075,.105,.145),vec3(.29,.32,.35),alpStone*.64+alpStrata*.36);
   vec3 alpIce=mix(vec3(.48,.61,.70),vec3(.85,.90,.94),.58+.42*alpBroad);
   diffuseColor.rgb=mix(alpRock,alpIce,alpSnow);
  `);
 };
 material.customProgramCacheKey=()=>key+'/alpine-150';material.needsUpdate=true;
}
