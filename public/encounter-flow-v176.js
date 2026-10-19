import {familySpecifications} from './hazard-families-v156.js?v=175';
import {courseSectors} from './race-sectors-v176.js?v=176';
// Retain each world's physical hazard families. Link triples with a shared
// orientation and a recovery beat; leave clear starts/finishes for practice.
export function flowSpecifications(course,length){const original=familySpecifications(course,length),out=[];let source=0;for(const sector of courseSectors(course,length)){let phrase=0,s=sector.start+190;while(s<sector.end-140){for(let beat=0;beat<3&&s<sector.end-140;beat++){
 const base=original[source++%original.length],id=out.length,orientation=[0,.28,-.28,Math.PI/2][phrase%4];
 const o={...base,id,s,theme:sector.index+1,orientation,seed:(sector.index*19+phrase)*.731,phrase:phrase+sector.index*100,beat,revision:176};
 // Two real apertures: precision earns more boost; the wider line is forgiving.
 if(beat===2&&phrase%2===1){o.kind='rings';o.family='flow-choice';o.variant=0;o.orientation=0;o.forceDodge=false;o.choice=true;o.solids=[{type:'torus',x:-3.15,y:0,R:1.55,tube:.18},{type:'torus',x:2.5,y:0,R:2.55,tube:.18}];}
 out.push(o);s+=Math.max(132,172-sector.index*10);}s+=86;phrase++;}}return out;}
