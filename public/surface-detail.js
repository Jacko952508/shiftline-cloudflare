// Physical material detail in the existing lighting pass: no additional lights,
// render targets, or screen-space depth sampling.
export function glassDetail(material){
 material.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   float grazing=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),3.);
   diffuseColor.a*=.55+grazing*2.4;
   outgoingLight+=vec3(.035,.07,.085)*grazing;
   #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=> 'shiftline-glass-v38';
 material.forceSinglePass=true;
 return material;
}
export function hullDetail(material,uniforms){
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='varying vec3 hullWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 detailPosition=vec4(transformed,1.);
#ifdef USE_INSTANCING
detailPosition=instanceMatrix*detailPosition;
#endif
hullWorld=(modelMatrix*detailPosition).xyz;\n#include <project_vertex>`);
  shader.fragmentShader='varying vec3 hullWorld;uniform float hullTime;uniform float hullWater;uniform float hullHeat;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   if(hullWater>.5){vec2 q=hullWorld.xz*.85;
   float a=sin(q.x+sin(q.y*1.3+hullTime*.55));
   float b=sin(q.y+sin(q.x*1.5-hullTime*.4));
   float caustic=pow(max(0.,1.-abs(a+b)*.75),7.);
   outgoingLight+=diffuseColor.rgb*vec3(.025,.11,.09)*caustic*hullWater*max(inverseTransformDirection(normal,viewMatrix).y,0.);}
   outgoingLight+=diffuseColor.rgb*vec3(.09,.025,.004)*hullHeat;
   #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=> 'shiftline-hull-v38';
 return material;
}
// Smooth proximity to repeated tunnel fixtures; bounded, never flashes or jumps
// at a fixture boundary. Reuses the existing local light and shadow budget.
export function fixtureLighting(w,s,base,spacing=48){
 const phase=s/spacing*Math.PI*2;
 w.key.intensity=base*(w.fixturePower||1)*(.88+.12*Math.cos(phase));
 w.fill.intensity=(w.kind==='leviathan'?17:w.kind==='cinder'?9:14)*(.8+.2*Math.sin(phase-.7));
}
