// Compile and upload first-use race resources before the countdown is released.
// The actual renderer, materials, shadow settings and resolution are retained.
const yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0));
export async function prepareRaceGraphics(renderer,scene,camera,pool,draw,{valid=()=>true,target=null,toneMapping=renderer.toneMapping}={}){
 const savedTarget=renderer.getRenderTarget(),savedTone=renderer.toneMapping;
 const masks=[],textures=new Set();let uploaded=0;
 scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)for(const value of Object.values(m))if(value?.isTexture)textures.add(value);});
 if(scene.environment)textures.add(scene.environment);
 try{
  for(const texture of textures){if(!valid())return null;renderer.initTexture(texture);if(++uploaded%6===0)await yieldTask();}
  if(!valid())return null;
  // Opacity is a uniform: zeroing it prepares the identical impact programs
  // and vertex buffers without showing a fake crash on the starting grid.
  for(const slot of pool.slots)for(const object of[slot.sparks,slot.shards]){masks.push([object,object.visible,object.material.opacity]);object.visible=true;object.material.opacity=0;}
  renderer.setRenderTarget(target);renderer.toneMapping=toneMapping;
  if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);
  renderer.setRenderTarget(savedTarget);renderer.toneMapping=savedTone;
  if(!valid())return null;
  draw();await yieldTask();
  return {textures:uploaded,impactPools:pool.slots.length,programs:renderer.info.programs?.length||0};
 }finally{
  renderer.setRenderTarget(savedTarget);renderer.toneMapping=savedTone;
  for(const [object,visible,opacity]of masks){object.visible=visible;object.material.opacity=opacity;}
 }
}
