// REALITY ENGINE V18: CINEMATIC 3D LIVING CIVILISATION, SHARED WEBGL CONTEXT
// Retains V15 worlds; wraps persistent V16 simulation in an exclusive 3D view.
import {mount as mountCore} from './engine-core-v17.js';
import {mountLivingLab} from './living-lab-sim-v18.js';
import {mountLivingWorld3D} from './living-lab-world-v18.js';
export async function mount(root,resume=null){
  const core=await mountCore(root,resume);
  let sim=null,world=null;
  try{
    sim=mountLivingLab(root,resume);
    world=mountLivingWorld3D(root,sim);
    root.__livingLabWorld=world;
    root.dataset.livingLabReady='v18-effects';
    root.dataset.engineVersion='18';
  }catch(error){
    try{world?.dispose()}catch(e){}
    try{sim?.dispose()}catch(e){}
    try{core.dispose()}catch(e){}
    throw new Error('V18 Cinematic Living World failed to mount: '+String(error?.stack||error));
  }
  return {
    getRenderedFrames(){return world?.renderedFrames||0},
    snapshot(){
      const result=core.snapshot?.()||{};
      result.livingLab=sim.snapshot();
      result.livingLab3D={active:world.active};
      return result;
    },
    dispose(){
      try{world?.dispose()}finally{
        try{sim?.dispose()}finally{
          core.dispose();
          try{delete root.__livingLabWorld;delete root.__realityLivingBridge;}catch(e){}
        }
      }
    }
  };
}
