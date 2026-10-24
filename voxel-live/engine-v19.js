// REALITY ENGINE V19 — hard-stop lifecycle around V18 Living World
// The in-chat player controls when mount() happens. No rendering before user presses Play.
import {mount as mountV18} from './engine-v18.js';
export async function mount(root,resume=null){
 let instance=null,stopped=false;
 const canvas=root.querySelector('#vxCanvas');
 try{
   instance=await mountV18(root,resume);
 }catch(e){
   try{forceRelease(canvas)}catch(_){}
   throw e;
 }
 function forceRelease(canvas){
   if(!canvas)return;
   try{
     let gl=null;
     try{gl=canvas.getContext('webgl2')}catch(_){}
     if(!gl)try{gl=canvas.getContext('webgl')}catch(_){}
     const ext=gl?.getExtension?.('WEBGL_lose_context');
     ext?.loseContext?.();
   }catch(error){console.warn('V19 GPU release was unavailable',error)}
   try{canvas.width=1;canvas.height=1;canvas.remove()}catch(_){}
 }
 const runtime={
   getRenderedFrames(){return stopped?0:instance?.getRenderedFrames?.()||0},
   getLivingState(){return stopped?null:instance?.getLivingState?.()||null},
   runExperiment(action,sector=null){
     if(stopped)throw Error('V19 engine has been stopped; press Play to reload');
     return instance.runExperiment(action,sector);
   },
   snapshot(){
     if(stopped)return resume||null;
     return instance?.snapshot?.()||resume||null;
   },
   dispose(){
     if(stopped)return;
     stopped=true;
     try{instance?.dispose?.()}
     finally{
       forceRelease(canvas);
       try{delete root.__livingLabWorld;delete root.__realityLivingBridge;delete root.__livingLab3D;}catch(_){}
       root.removeAttribute('data-living-lab-ready');
       root.dataset.engineStopped='1';
       instance=null;
     }
   }
 };
 root.dataset.engineVersion='19';
 root.dataset.hardStopSupported='1';
 return runtime;
}
