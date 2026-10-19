// Same speed, fuel, collision envelope and steering range for every airframe.
// Response changes the spring; damping controls how firmly lateral motion settles.
export const HANDLING=Object.freeze([
 {name:'BALANCED',spring:70,damping:14,response:3,grip:3,description:'Even response and predictable glide. The all-rounder.'},
 {name:'POINT & SHOOT',spring:88,damping:17,response:5,grip:4,description:'Quick turn-in and firm braking. Best for rapid line changes.'},
 {name:'PRECISION',spring:62,damping:15,response:2,grip:5,description:'Measured response and very little drift. Set your line early.'},
 {name:'GLIDER',spring:58,damping:12,response:2,grip:2,description:'Flowing transitions and longer glide. Reward smooth steering.'},
 {name:'PLANTED',spring:76,damping:18,response:3,grip:5,description:'Firm lateral braking and stable holds. Deliberate corner entry.'},
 {name:'AGILE',spring:92,damping:14,response:5,grip:2,description:'Fast response with a looser tail. Precise corrections matter.'}
].map(p=>Object.freeze(p)));
export function handlingProfile(model,assisted=false){return HANDLING[assisted?0:model]||HANDLING[0];}
