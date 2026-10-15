// CI-only import map: use the exact vendored Three.js build shipped by SHIFTLINE.
export function resolve(specifier,context,nextResolve){
 if(specifier==='three')return {url:new URL('../public/vendor/three.module.js',import.meta.url).href,shortCircuit:true};
 return nextResolve(specifier,context);
}
