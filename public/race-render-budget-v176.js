import {batchStaticAirframe} from './fleet-batching-v152.js?v=152';
// Batch only static, separately culled chunks. Material identities, vertices,
// texture coordinates, lighting and the High render resolution stay intact.
export function optimiseTunnel(w){const stats={before:0,after:0,saved:0,triangles:0};for(const {g} of w.chunks||[]){const s=batchStaticAirframe(g);for(const k of Object.keys(stats))stats[k]+=s[k];g.traverse(o=>{if(o.name==='batched-airframe'){o.name='batched-tunnel-surfaces';o.updateMatrix();o.matrixAutoUpdate=false;}});}w.renderBudget=stats;return w;}
