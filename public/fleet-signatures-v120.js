import * as THREE from 'three';
// V120 model-specific exterior kits. A VECTOR nacelle kit must never become a
// RAZOR prong kit, and a MANTA crescent must not inherit fighter-jet rectangles.
export function addSignatureKits(index,c,api){
 const {add,bar,layer,line,hullMesh,materials,high}=api;
 const {hull,polished,graphite,carbon,glass,glow,premium}=materials;
 if(!high)return{count:0,model:index,shape:'race-lite'};
 let count=0;
 const signature=(m,name)=>{if(m){m.name='signature-'+index+'-'+name;m.userData.signature=true;count++;}return m;};
 const mirrored=(fn)=>{for(const side of[-1,1])fn(side)};
 const structural=(a,b,w,mat,name)=>signature(bar(a,b,w,w*.8,mat),name);
 const curve=(pts,mat,r,name)=>signature(line(pts.map(p=>p),mat,r),name);
 switch(index){
 case 0: // VECTOR — narrow F1 cockpit carried between independently dressed pods
  if(c.engine>0)mirrored(side=>{
   const x=side*.77;
   const cover=signature(hullMesh([[-.65,.04,.04,.17],[-.47,.116,.048,.17],[.22,.14,.050,.18],[.55,.085,.03,.17]],c.engine===2?graphite:polished,x,0,12),'nacelle-interlock');
   structural([side*.38,.070,-.24],[side*.65,.155,-.32],.049,polished,'forward-pod-brace');
   structural([side*.39,.064,.43],[side*.65,.164,.46],.05,carbon,'rear-pod-brace');
  });
  if(c.wing>0)mirrored(side=>{
   structural([side*.24,.041,-.30],[side*.60,.048,-.50],.045,polished,'race-wing-strut');
   curve([[side*.34,.088,-.25],[side*.55,.09,-.46],[side*.68,.11,-.43]],glow,.007,'race-illumination');
  });
  break;
 case 1: // RAZOR — forward triple lance assembly, no boxy side pods
  if(c.wing>0)mirrored(side=>{
   const x=side*.70;
   const spear=signature(hullMesh([[-1.71,.001,.002,.07],[-1.38,.038,.03,.075],[-.93,.085,.047,.067],[-.42,.064,.041,.06]],c.wing===3?carbon:hull,x,0,8),'detachable-outer-lance');
   structural([side*.55,.085,-.74],[side*.76,.106,-.94],.042,graphite,'lance-root');
   curve([[side*.71,.119,-1.40],[side*.72,.129,-1.04],[side*.74,.127,-.75]],glow,.008,'lance-red-groove');
  });
  if(c.fin>0)mirrored(side=>structural([side*.40,.085,.40],[side*.70,.178,.61],.055,hull,'aft-rudder-truss'));
  break;
 case 2: // PHANTOM — embedded stealth skin, flush sharp facet divisions
  if(c.wing>0)mirrored(side=>{
   signature(layer([[.28,-.42],[.67,-.36],[.96,.31],[.72,.50],[.40,.27]],graphite,.064,.017,side),'detachable-stealth-facet');
   signature(layer([[.44,-.16],[.73,.01],[.82,.32],[.60,.19]],hull,.093,.014,side),'stealth-facet-inset');
  });
  if(c.engine>0)mirrored(side=>{
   signature(layer([[.21,.27],[.44,.32],[.54,.72],[.33,.67]],graphite,.049,.025,side),'recessed-engine-cloak');
   curve([[side*.30,.06,.40],[side*.47,.064,.59],[side*.49,.07,.71]],glow,.004,'engine-cloak-seam');
  });
  break;
 case 3: // MANTA — sweeping organic crescent shell with curved load-bearing ribs
  if(c.wing>0)mirrored(side=>{
   curve([[side*.33,.112,-.28],[side*.52,.112,-.49],[side*.74,.10,-.67],[side*.96,.075,-.74]],polished,.030,'smooth-crescent-spar');
   curve([[side*.53,.08,.16],[side*.65,.088,.44],[side*.80,.06,.69]],glow,.007,'organic-edge');
  });
  if(c.livery>0)mirrored(side=>{
   curve([[side*.21,.145,-.16],[side*.33,.154,.04],[side*.31,.148,.40]],glow,.009,'bio-composite-spine');
  });
  break;
 case 4: // GEMINI — reinforced triple hull, visible industrial machinery
  if(c.engine>0)mirrored(side=>{
   const x=side*.79;
   signature(hullMesh([[-.76,.025,.025,.235],[-.48,.13,.048,.25],[.18,.158,.055,.25],[.68,.110,.040,.24]],graphite,x,0,12),'industrial-overpod-armour');
   for(let k=0;k<3;k++)structural([x-side*.10,.238,-.40+k*.36],[x+side*.11,.238,-.34+k*.36],.026,polished,'pod-heat-bars');
  });
  if(c.wing>0)mirrored(side=>{
   structural([side*.18,.03,-.30],[side*.72,.13,-.37],.08,polished,'heavy-crossbeam');
   structural([side*.20,.03,.32],[side*.70,.12,.48],.080,graphite,'rear-industrial-crossbeam');
  });
  break;
 case 5: // SPECTRE — elevated cutting-blade root and precision spar
  if(c.fin>0)mirrored(side=>{
   structural([side*.52,.078,-.41],[side*.82,.49,.36],.046,polished,'blade-stressed-spar');
   curve([[side*.62,.25,-.19],[side*.81,.50,.38],[side*.90,.28,.62]],glow,.008,'knife-edge-energy');
  });
  if(c.wing>0)mirrored(side=>{
   signature(layer([[.35,-.33],[.69,-.65],[.92,-.24],[.51,.04]],carbon,.080,.020,side),'swept-edge-loadplate');
   structural([side*.34,.05,.31],[side*.78,.16,.57],.050,polished,'rear-blade-tie');
  });
  break;
 }
 return{count,model:index,shape:['pods','prongs','facets','crescent','triple-hull','blades'][index]};
}
