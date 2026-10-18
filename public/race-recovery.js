import {collisionAt} from './race-obstacles.js?v=159';
// Rejoin immediately beyond the hit gate, on a clear centre line. Probe the
// complete ship envelope so recovery does not drop a wing into moving geometry.
export function recoveryPose(track,specs,along,time,hit=null){
 const limit=Math.max(0,track.length-1);
 const start=Math.min(limit,Math.max(along+8,hit?hit.s+9:0));
 for(let extra=0;extra<=18;extra+=2){
  const s=Math.min(limit,start+extra);
  if([0,2,4].every(d=>!collisionAt(track,specs,Math.min(limit,s+d),0,0,time+d/84,0)))return{s,x:0,y:0};
  if(s===limit)break;
 }
 // Course gates are far apart. A bounded forward search avoids skipping the
 // next challenge or granting temporary collision immunity.
 return null;
}
export function racerInView(s,along,ahead=585){return s>=along-90&&s<=along+ahead;}
