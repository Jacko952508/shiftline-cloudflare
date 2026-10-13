// Target clean display-sync frame cadences instead of 18/24fps stutter.
// The 60fps high-quality mode can retreat to 30fps after sustained slow frames
// without touching the player's racing graphics, save state or frame limiter.
export function menuFrameProfile(quality,deviceRatio=1.5,width=390,height=844){
 const ratio=quality==='high'?1.5:quality==='low'?1:1.28;
 const pixels=quality==='high'?1700000:quality==='low'?550000:1050000;
 return {
  fps:quality==='high'?60:quality==='low'?20:30,
  pixelRatio:Math.min(Math.max(1,deviceRatio),ratio,Math.sqrt(pixels/Math.max(1,width*height)))
 };
}
export function createMenuFrameGovernor(){
 let highFPS=60,pressure=0,recovery=0;
 const target=quality=>quality==='high'?highFPS:quality==='low'?20:30;
 function observe(quality,elapsedSeconds,renderMilliseconds){
  if(quality!=='high'){pressure=0;recovery=0;highFPS=60;return target(quality);}
  if(highFPS===60){
   const missed=elapsedSeconds>.03||renderMilliseconds>20;
   pressure=Math.max(0,Math.min(10,pressure+(missed?1:-.55)));
   if(pressure>=6){highFPS=30;pressure=0;recovery=0;}
  }else{
   const good=renderMilliseconds<11&&elapsedSeconds<.055;
   recovery=good?recovery+elapsedSeconds:Math.max(0,recovery-elapsedSeconds*2);
   if(recovery>12){highFPS=60;recovery=0;pressure=0;}
  }
  return highFPS;
 }
 return {target,observe,reset(){highFPS=60;pressure=0;recovery=0;}};
}
