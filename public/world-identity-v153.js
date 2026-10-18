import * as THREE from 'three';
// Assemblies are baked into the existing instanced draws. Coordinates stay
// within each replaced form's envelope; there are no new scene objects/lights.
export function bake(parts,name='biome assembly'){
 const p=[],n=[],uv=[],c=[];
 for(const [source,scale=[1,1,1],position=[0,0,0],rotation=[0,0,0]] of parts){
  const g=source.index?source.toNonIndexed():source.clone();
  g.scale(...scale);g.rotateX(rotation[0]);g.rotateY(rotation[1]);g.rotateZ(rotation[2]);g.translate(...position);
  const a=g.attributes;
  p.push(...a.position.array);n.push(...a.normal.array);
  for(let i=0;i<a.position.count;i++){uv.push(a.uv?.getX(i)||0,a.uv?.getY(i)||0);const shade=.79+.18*THREE.MathUtils.clamp(a.position.getY(i)+.5,0,1);c.push(shade*.94,shade,shade*.86);}
  g.dispose();source.dispose();
 }
 const g=new THREE.BufferGeometry();g.name=name;
 g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeBoundingSphere();return g;
}
const box=()=>new THREE.BoxGeometry(1,1,1);
const tube=(top=.5,bottom=.5,sides=8)=>new THREE.CylinderGeometry(top,bottom,1,sides);
const rock=(detail=0)=>new THREE.IcosahedronGeometry(1,detail);
export function reefShelf(low=false){
 return bake([[rock(low?0:1),[.94,.46,.83],[0,-.12,0]],[rock(),[.73,.24,.66],[.12,.37,.04]],[rock(),[.55,.21,.51],[-.24,.66,-.12]]],'eroded reef shelves');
}
export function coralBranches(low=false){
 const parts=[[tube(.11,.23,low?5:7),[1,.9,1],[0,-.05,0]]];
 for(let k=0;k<5;k++){const a=k*2.39996,x=Math.cos(a),z=Math.sin(a),h=.14+k*.12;parts.push([tube(.035,.10,5),[1,.46,1],[x*.17,h,z*.17],[z*.65,0,-x*.65]]);parts.push([rock(),[.10,.07,.10],[x*.31,h+.16,z*.31]]);}
 return bake(parts,'branching cold-water coral');
}
export function basaltMass(low=false){
 const parts=[];for(let i=0;i<7;i++){const a=i*2.39996,r=i?.48:0,h=i?.55+(i%3)*.13:1;parts.push([tube(.23,.32,6),[1,h*1.3,1],[Math.cos(a)*r,-.4+h*.65,Math.sin(a)*r]]);}
 return bake(parts,'columnar basalt escarpment');
}
export function ventStack(low=false){
 const s=low?6:10,parts=[[tube(.29,.51,s),[1,1,1]],[tube(.37,.37,s),[1,.10,1],[0,.43,0]],[tube(.47,.47,s),[1,.10,1],[0,-.32,0]]];
 for(const x of[-.33,.33])parts.push([box(),[.09,.7,.09],[x,0,0]]);
 return bake(parts,'armoured geothermal chimney');
}
export function ancientTrunk(low=false){
 const parts=[[tube(.30,.58,low?6:9),[1,1,1]]];
 // Buttress roots and forks remain inside the old trunk radius.
 for(let i=0;i<4;i++){const a=i*Math.PI/2;parts.push([tube(.08,.24,5),[1,.24,1],[Math.cos(a)*.38,-.27,Math.sin(a)*.38],[Math.sin(a)*.48,0,-Math.cos(a)*.48]]);}
 for(const x of[-1,1])parts.push([tube(.09,.17,6),[1,.38,1],[x*.24,.24,0],[0,0,-x*.48]]);
 return bake(parts,'buttressed ancient trunk');
}
export function forestCrown(low=false){
 // Overlapping flattened lobes produce an open, spreading crown instead of
 // vertically stretched capsules, while keeping the original unit bounds.
 const parts=[[rock(low?0:1),[.71,.55,.65],[0,.15,0]]];
 for(let i=0;i<4;i++){const a=i*2.39996;parts.push([rock(),[.55,.35,.51],[Math.cos(a)*.41,-.12+(i%2)*.15,Math.sin(a)*.41]]);}
 return bake(parts,'layered broadleaf crown');
}
export function miningHabitat(low=false){
 return bake([[box(),[1.22,.24,.78],[0,-.33,0]],[tube(.30,.30,low?6:10),[1,.83,1],[0,.02,0],[0,0,Math.PI/2]],[box(),[.27,.22,.69],[-.43,.12,0]],[box(),[.19,.25,.62],[.49,.01,0]],[box(),[.75,.055,.75],[0,.34,0]]],'pressurised lunar mining habitat');
}
export function quarryCrane(){
 return bake([[box(),[.22,.95,.22],[0,0,0]],[box(),[1.45,.12,.23],[.30,.40,0]],[box(),[.18,.48,.19],[.9,.11,0]],[box(),[.46,.20,.42],[-.43,.33,0]]],'excavator gantry');
}
export function lunarRubble(low=false){
 return bake([[rock(low?0:1),[.88,.42,.82],[0,-.16,0]],[rock(),[.49,.37,.43],[.35,.27,-.12]],[rock(),[.38,.29,.42],[-.46,-.03,.23]]],'impact fractured regolith');
}
export function drillHead(low=false){
 const parts=[[tube(.18,.32,low?6:10),[1,.8,1]]];
 for(let i=0;i<3;i++)parts.push([tube(.38,.25,6),[1,.12,1],[0,-.28+i*.22,0]]);
 return bake(parts,'rotary quarry drill');
}
export function servicePanel(course){
 const parts=[],add=(s,p)=>parts.push([box(),s,p]);
 if(course===1){add([.12,1.45,5.2],[0,0,0]);for(const y of[-.53,.53])add([.035,.10,4.5],[-.075,y,0]);}
 if(course===2){add([.10,1.35,4.9],[0,0,0]);for(const z of[-1.8,0,1.8])add([.12,1.45,.13],[-.06,0,z]);}
 if(course===3){add([.10,1.4,5.1],[0,0,0]);for(let i=0;i<6;i++)add([.12,.95,.16],[-.04,0,(i-2.5)*.72]);}
 if(course===4){add([.12,1.45,5.2],[0,0,0]);for(const z of[-1.7,1.7])add([.08,1.1,.20],[-.04,0,z]);}
 if(course===5){add([.10,.86,5.1],[0,0,0]);for(const y of[-.56,.56])add([.08,.16,5.1],[0,y,0]);}
 if(course===6){add([.10,1.4,5.1],[0,0,0]);for(const z of[-1.65,1.65])add([.12,1.25,.33],[-.04,0,z]);}
 return bake(parts,'course '+course+' service fittings');
}
