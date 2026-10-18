// Whole airframes which straddle the chase camera must not fill the foreground
// with clipped nacelles. This affects drawing only; every opponent keeps racing.
export function clearOfFleetCamera(s,along,chaseDistance,firstPerson=false){
 const cameraAlong=firstPerson?along+.65:Math.max(0,along-chaseDistance);
 return s>=cameraAlong+(firstPerson?1.15:1.7);
}
