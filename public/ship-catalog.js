export const SHIP_SCALE=.83;
export const MODELS=[
{name:'VECTOR',tag:'Precision interceptor',xp:0,desc:'Sculpted titanium fuselage and swept aerofoils.'},
{name:'RAZOR',tag:'Needle chassis',xp:0,desc:'A spear nose, clipped wings and low canopy.'},
{name:'PHANTOM',tag:'Stealth delta',xp:0,desc:'A flattened composite delta with recessed engines.'},
{name:'MANTA',tag:'Crescent racer',xp:500,desc:'A curved flying wing with a short teardrop hull and wide crescent shoulders.'},
{name:'GEMINI',tag:'Twin hull',xp:1500,desc:'Two sculpted outriggers joined by a narrow cockpit spine and swept bridge wings.'},
{name:'SPECTRE',tag:'Final prototype',xp:3000,desc:'Our sleekest craft: a razor-thin spear hull, recessed canopy and sharply swept knife wings.'}
];
export const PARTS={cabin:['Carbon cabin','Brushed alloy','Warm leather'],instrument:['Ice cyan','Amber aviation','Mint phosphor'],stick:['Flight grip','Compact yoke','Split grip'],finish:['Titanium','Ceramic white','Graphite','Pearl silver','Midnight satin'],wing:['Swept','Delta','Scimitar','Arrow','Crescent'],engine:['Turbine','Armoured','Ion collar','Vector nozzle','Split shroud'],canopy:['Ocean glass','Smoked amber','Violet crystal','Silver smoke','Emerald glass'],fin:['Low profile','Twin blades','Split tail','Dorsal blade','V-tail'],livery:['Clean','Racing stripes','Circuit marks','Twin chevrons','Spine stripe'],trail:['Ice plasma','Solar flare','Violet pulse','Emerald ion','Rose plasma']};
export const COLORS=['#72efff','#ff6a37','#a6ff75','#c995ff','#f7dc8b','#eff5ff','#b5f8ee','#ffbd55','#ff8dc8'];
export function appearance(input={}){const result={};for(const key of Object.keys(PARTS))result[key]=Number.isInteger(input?.[key])&&input[key]>=0&&input[key]<PARTS[key].length?input[key]:0;return result;}
export function modelUnlocked(p,i){return !!MODELS[i]&&(Number(p?.xp)||0)>=MODELS[i].xp;}
export const BUILDS=[{name:'FACTORY',parts:{}},{name:'SOLAR RACING',parts:{finish:1,wing:1,engine:2,canopy:1,fin:1,livery:1,trail:1}},{name:'VOID SPEC',parts:{finish:2,wing:2,engine:1,canopy:2,fin:2,livery:2,trail:2}},{name:'PEARL GT',parts:{finish:3,wing:3,engine:3,canopy:3,fin:3,livery:3,trail:0}},{name:'NIGHT RUNNER',parts:{finish:4,wing:4,engine:4,canopy:4,fin:4,livery:4,trail:4}}];
