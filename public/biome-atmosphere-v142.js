import * as THREE from 'three';
import {atmosphereChapters} from './far-scenery-v129.js?v=153';
// V142 reuses pre-existing scene fog and the authored sky shaders.
// Never allocates meshes, lights, postprocess targets or colliders.
const STYLES={
 1:{fog:[0x0b1a2a,0x171c38,0x2b242e,0x2f2028],sky:[0x123654,0x373a77,0x6f3e4e,0x823c37],density:[.00030,.00035,.00023,.00033]},
 2:{fog:[0x0b3c50,0x0e4e51,0x142e50,0x14525a],sky:[0x145369,0x2a786c,0x253d73,0x428d7e],density:[.00148,.00136,.00172,.00143]},
 3:{fog:[0x252634,0x3b292c,0x542b24,0x493029],sky:[0x354356,0x7a3526,0xb05127,0x914328],density:[.00022,.00029,.00036,.00030]},
 4:{fog:[0x1b2c44,0x303b50,0x26394d,0x41505d],sky:[0x3c5d7b,0x56617d,0x3c627f,0x708c97],density:[.000105,.00015,.000125,.000175]},
 5:{fog:[0x15352c,0x1c4543,0x3c4730,0x303948],sky:[0x234d38,0x25665c,0x6b663e,0x53576c],density:[.00016,.00023,.00021,.000265]},
 6:{fog:[0x14182b,0x1a2644,0x302545,0x3a2848],sky:[0x3f3b5e,0x334e77,0x5c487e,0x804874],density:[.00010,.00013,.00017,.00014]}
};
export function attachBiomeAtmosphere(scene,w,track,course){
 const x=STYLES[course];if(!x)throw Error('Unsupported chapter atmosphere '+course);
 w.biomeAtmosphere={scene,course,length:track.length,lastS:-Infinity,lastFog:null,lastLow:null,
  fogColors:x.fog.map(v=>new THREE.Color(v)),skies:x.sky.map(v=>new THREE.Color(v)),densities:x.density,
  fogColor:new THREE.Color(),skyColor:new THREE.Color(),
  skyOriginal:w.farScenery?.baseSky?.clone()||w.skyMat?.uniforms?.base?.value?.clone()||null,
  density:0,blend:{from:0,to:0,t:0},updates:0};
 return w;
}
export function updateBiomeAtmosphere(w,s){
 const a=w?.biomeAtmosphere;if(!a)return;
 const fog=a.scene.fog,low=!!w.lowDetail;
 if(Math.abs(s-a.lastS)<9&&fog===a.lastFog&&low===a.lastLow)return;
 a.lastS=s;a.lastFog=fog;a.lastLow=low;a.updates++;
 const b=atmosphereChapters(s/Math.max(1,a.length));a.blend=b;
 a.fogColor.copy(a.fogColors[b.from]).lerp(a.fogColors[b.to],b.t);
 a.skyColor.copy(a.skies[b.from]).lerp(a.skies[b.to],b.t);
 a.density=THREE.MathUtils.lerp(a.densities[b.from],a.densities[b.to],b.t)*(low?.78:1);
 if(fog?.isFogExp2){fog.color.copy(a.fogColor);fog.density=a.density;}
 const sky=w.skyMat?.uniforms;
 if(sky?.chapterTint)sky.chapterTint.value.copy(a.skyColor);
 if(sky?.base&&a.skyOriginal)sky.base.value.copy(a.skyOriginal).lerp(a.skyColor,low?.095:.17);
 const sea=w.vista?.water?.material?.uniforms;
 if(sea?.chapterTint)sea.chapterTint.value.copy(a.skyColor);
 if(a.scene.background?.isColor&&a.course===2)a.scene.background.copy(a.fogColor).multiplyScalar(.26);
 if(typeof window!=='undefined'&&typeof location!=='undefined'&&location.search.includes('atmosqa=1'))
 window.__shiftlineAtmosphereQA={course:a.course,from:b.from,to:b.to,t:b.t,
  fog:'#'+a.fogColor.getHexString(),density:a.density,sky:'#'+a.skyColor.getHexString(),
  low,updates:a.updates,addedPasses:0,addedGeometry:0,version:142};
}
export function disposeBiomeAtmosphere(w){if(w?.biomeAtmosphere)w.biomeAtmosphere=null;}
