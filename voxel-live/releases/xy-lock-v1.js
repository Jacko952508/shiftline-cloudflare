export function installXYLock(panel, onChange = () => {}) {
  if (!panel) throw new Error("Game panel required");
  let locked = false;
  const previous = {touchAction:panel.style.touchAction,overscrollBehavior:panel.style.overscrollBehavior,webkitUserSelect:panel.style.webkitUserSelect};
  const stop = e => {if(locked && e.cancelable) e.preventDefault();};
  const opts = {passive:false,capture:true};
  panel.addEventListener("touchmove",stop,opts);
  panel.addEventListener("gesturestart",stop,opts);
  panel.addEventListener("gesturechange",stop,opts);
  panel.addEventListener("contextmenu",stop,opts);
  function setLocked(next) {
    locked=!!next;
    panel.style.touchAction=locked?"none":previous.touchAction;
    panel.style.overscrollBehavior=locked?"none":previous.overscrollBehavior;
    panel.style.webkitUserSelect=locked?"none":previous.webkitUserSelect;
    onChange(locked);
  }
  return {setLocked,get locked(){return locked;},destroy(){setLocked(false);for(const type of ["touchmove","gesturestart","gesturechange","contextmenu"])panel.removeEventListener(type,stop,true);}};
}
