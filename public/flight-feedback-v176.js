const clamp=v=>Math.max(0,Math.min(1,v));
export function flightPressure(speed){const t=clamp((speed-84)/39);return t*t*(3-2*t);}
export function flightShake(speed,reduced=false,impact=false){return reduced||impact?0:flightPressure(speed);}
