// Visual-only hazard guidance. Physics, AI and hitboxes never change.
const clamp=n=>Math.min(1,Math.max(0,n));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
export const CUE_RANGE=390;
export function upcomingHazard(specs,along){
 let lo=0,hi=specs.length;
 while(lo<hi){const mid=(lo+hi)>>>1;if(specs[mid].s<along-4)lo=mid+1;else hi=mid;}
 return specs[lo]||null;
}
export function cueEnvelope(distance,time=0,seed=0){
 // Moving segments ignite first, then the full rim locks on during approach.
 const wake=1-smooth(170,CUE_RANGE,distance);
 const lock=1-smooth(48,185,distance);
 const energy=wake*smooth(-8,2,distance);
 const pulse=.9+.1*Math.sin(time*4.8+seed*.47);
 return {energy,lock,ring:energy*(.20+.53*lock)*pulse,
  sweep:energy*(.76-.32*lock),glow:.48+1.10*energy,
  indicators:(.72+2.05*energy)*pulse};
}
export function idleHazardGlow(distance){
 return .44+.12*(1-smooth(135,520,Math.max(0,distance)));
}
