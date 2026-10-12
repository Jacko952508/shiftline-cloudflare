// Predict arrival through both boost acceleration and automatic fuel exhaustion.
// Speed approaches its requested value with the same 5/s response as the engine.
export function cinematicArrival(distance,speed,boost,energy){
  if(distance<=0)return 0;
  const burn=boost&&energy>0?energy/24:0;
  const integrate=(v,w,t)=>w*t+(v-w)*(-Math.expm1(-5*t))/5;
  const boostedDistance=burn?integrate(speed,102,burn):0;
  const exitSpeed=burn?102+(speed-102)*Math.exp(-5*burn):speed;
  let t=distance/(burn?102:60);
  for(let i=0;i<6;i++){
    const inBoost=t<burn,elapsed=inBoost?t:t-burn;
    const v=inBoost?speed:exitSpeed,w=inBoost?102:60;
    const travelled=(inBoost?0:boostedDistance)+integrate(v,w,Math.max(0,elapsed));
    const velocity=w+(v-w)*Math.exp(-5*Math.max(0,elapsed));
    t=Math.max(0,t-(travelled-distance)/Math.max(1,velocity));
  }
  return t;
}

// Continuous, map-specific scenic paths. The engine blends these into safe racing
// lines well before each obstacle, so choreography never replaces collision checks.
export function cinematicScenic(time,course,reduced=false){
  const a=reduced?.35:1;
  if(course===2)return{x:a*(2.2*Math.sin(time*.31)+.4*Math.sin(time*.62)),y:a*(1.55*Math.sin(time*.24+.7)+.3*Math.cos(time*.48))};
  if(course===3)return{x:a*(2.65*Math.sin(time*.5)+.35*Math.sin(time*.9)),y:a*(Math.sin(time*.36+.7)+.45*Math.cos(time*.72))};
  return{x:a*(2.4*Math.sin(time*.43)+.45*Math.sin(time*.81)),y:a*(1.3*Math.sin(time*.31+.7)+.35*Math.cos(time*.67))};
}
