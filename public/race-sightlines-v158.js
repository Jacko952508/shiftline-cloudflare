// Portrait framing leaves room above and around the airframe to read a gate.
// Reuse the caller's result object on the render path.
export function chaseProfile(aspect,boost=false,reduced=false,out={}){
 const t=Math.max(0,Math.min(1,(1/Math.max(.1,aspect)-1.1)/.65)),portrait=t*t*(3-2*t);
 out.distance=3.8+portrait*1.05+(boost&&!reduced?.55:0);
 out.height=.8+portrait*.32;out.lookAhead=12+portrait*2;return out;
}

function depthCue(material){
 if(material.userData.sightline158)return material;
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  shader.vertexShader='varying float routeGuideDepth;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nrouteGuideDepth=max(0.,-mvPosition.z);');
  shader.fragmentShader='varying float routeGuideDepth;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   // A lower nearby peak and a longer low-level tail prevents the sharp
   // contrast between the current tunnel and the unexplored road.
   float routeGuideVisible=1.-smoothstep(22.,490.,routeGuideDepth);
   diffuseColor.rgb*=.16+.69*routeGuideVisible;
  `);
 };
 material.customProgramCacheKey=()=>key+'/route-depth-158';material.userData.sightline158=true;material.needsUpdate=true;return material;
}

export function attachSightlines(world){
 const targets=new Set();
 if(world.ribLight)targets.add(world.ribLight);
 for(const chunk of world.chunks||[])chunk.g.traverse(o=>{
  const p=o.geometry?.parameters;
  if(o.isMesh&&o.material?.isMeshBasicMaterial&&o.geometry.type==='TorusGeometry'&&p.radius>=7&&p.radius<=8&&p.tube<.1)targets.add(o);
 });
 const users=new Map(),selected=new Map();
 world.root.traverse(o=>{if(o.material)users.set(o.material,(users.get(o.material)||0)+1);});
 for(const o of targets){const m=o.material;if(!selected.has(m))selected.set(m,[]);selected.get(m).push(o);}
 for(const [source,nodes]of selected){
  const material=nodes.length===users.get(source)?source:source.clone();
  if(material!==source){
   material.onBeforeCompile=source.onBeforeCompile;material.customProgramCacheKey=source.customProgramCacheKey.bind(source);
   // Chapter colour animation remains live on the shared colour object.
   material.color=source.color;
  }
  depthCue(material);for(const o of nodes)o.material=material;
 }
 world.sightlines={version:158,guides:targets.size,materials:selected.size,addedDraws:0};return world;
}
