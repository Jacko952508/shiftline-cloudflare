// REALITY ENGINE V16: LIVING LAB, running on the pinned V15 Three.js engine.
// The original engine remains intact; the civilisation observatory is a sibling layer.
const CORE_URL='https://cdn.jsdelivr.net/gh/Jacko952508/shiftline-cloudflare@44824f16cf50e1e982e9a0da8e0351a7a7936a49/voxel-live/engine-v15.js';
export async function mount(root,resume=null){
  const coreModule=await import(CORE_URL);
  if(typeof coreModule.mount!=='function')throw Error('Pinned V15 core module did not export mount()');
  const core=await coreModule.mount(root,resume);
  let lab=null;
  try {
    const addon=await import('./living-lab-v1.js');
    if(typeof addon.mountLivingLab!=='function')throw Error('Living Lab addon missing mountLivingLab()');
    lab=addon.mountLivingLab(root,resume);
    root.dataset.livingLabReady='1';
    root.dataset.engineVersion='16';
  } catch(error){
    try{core.dispose()}catch(e){}
    throw new Error('V16 Living Lab addon failed: '+String(error?.stack||error));
  }
  return {
    snapshot(){
      const save=core.snapshot?.()||{};
      save.livingLab=lab.snapshot();
      return save;
    },
    dispose(){
      try{lab?.dispose()}finally{core.dispose()}
    }
  };
}