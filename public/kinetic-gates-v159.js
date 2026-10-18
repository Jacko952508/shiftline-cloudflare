// Authored racing mechanisms. Solids, drive axes and clear openings are shared
// by rendering, AI and player collision; decorative light never defines a hit.
export const isKineticGate=family=>family==='dock-clamps'||family==='pressure-bulkhead'||family==='security-segments'||family==='discharge-gate';
export function kineticGateSolids(family,variant=0){
 const solids=[],shutter=/clamps|bulkhead/.test(family),direction=variant===1?-1:1;
 const poly=(points,x,y,a,drive,role,style)=>solids.push({type:'polygon',points,x,y,a,z:0,hz:shutter?.48:.36,drive,role,signalStyle:style});
 if(shutter){
  // Open-sided truss jaws: tapered fingers and deep scallops replace slabs.
  const jaw=[[-1.12,-4.65],[-.28,-4.65],[.58,-3.75],[.12,-2.7],[.88,-1.65],[1.08,-.62],[.46,0],[1.08,.62],[.88,1.65],[.12,2.7],[.58,3.75],[-.28,4.65],[-1.12,4.65],[-1.38,3.8],[-.83,2.55],[-1.32,1.55],[-1.08,0],[-1.32,-1.55],[-.83,-2.55],[-1.38,-3.8]];
  for(const side of[-1,1]){
   // Both carriages close together and dwell at their travel limits. The
   // narrowest central lane remains 4.64 m wide before encounter offsets.
   poly(jaw.map(p=>[...p]),side*4.85,0,side<0?0:Math.PI,{x:-side*(1.35+variant*.06),y:0,phase:0},'truss-jaw',1);
   solids.push({type:'box',x:side*6.55,y:0,hx:.19,hy:2.65,hz:.55,a:0,role:'guide-stator',signalStyle:1});
  }
 }else{
  // Three hooked crescents form one rotor, leaving a single 120-degree
  // opening. Each is keyed to the same axle, not independently wobbling.
  for(let k=0;k<3;k++){
   const start=k*1.43,span=1.31,points=[],n=18;
   for(let j=0;j<=n;j++){const u=j/n,a=start+span*u,r=6.65-.16*Math.sin(Math.PI*u)**2;points.push([Math.cos(a)*r,Math.sin(a)*r]);}
   for(let j=n;j>=0;j--){const u=j/n,a=start+span*u,r=5.25-2.90*Math.sin(Math.PI*u)**8;points.push([Math.cos(a)*r,Math.sin(a)*r]);}
   poly(points,0,0,variant*.20,{turn:direction*.19,phase:0},'orbital-petal',2);
  }
  // A visible axle blocks the uninteresting straight-through centre while
  // leaving the broad sector and the inner curved line available to race.
  solids.push({type:'sphere',x:0,y:0,r:.94,role:'selector-core',signalStyle:2});
 }
 solids.push({type:'torus',x:0,y:0,R:6.91,tube:.17,role:'orbital-raceway',signalStyle:shutter?1:2});
 return solids;
}
