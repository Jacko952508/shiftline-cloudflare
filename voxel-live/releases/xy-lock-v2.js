export function installXYLock(panel,onChange=()=>{}) {
 let locked=false;
 const old={touchAction:panel.style.touchAction,overscrollBehavior:panel.style.overscrollBehavior};
 const prevent=e=>{if(locked&&e.cancelable)e.preventDefault();};
 // Never stop propagation: Three.js relies on pointerdown/move/up reaching its canvas.
 panel.addEventListener('touchmove',prevent,{capture:true,passive:false});
 panel.addEventListener('gesturestart',prevent,{capture:true,passive:false});
 panel.addEventListener('gesturechange',prevent,{capture:true,passive:false});
 function setLocked(v){locked=!!v;panel.style.touchAction=locked?'none':old.touchAction;panel.style.overscrollBehavior=locked?'none':old.overscrollBehavior;onChange(locked);}
 return {setLocked,get locked(){return locked;},destroy(){setLocked(false);for(const t of ['touchmove','gesturestart','gesturechange'])panel.removeEventListener(t,prevent,true);}};
}
// IMPORTANT: The engine's #vxCanvas must be a hit-testable child of #vxStage,
// not covered by a full-screen #vxStage overlay. Place controls above canvas,
// but use pointer-events:none on non-interactive HUD elements.
