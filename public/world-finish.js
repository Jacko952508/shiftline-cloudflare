import {alpineRidgeGeometry,alpineSurface} from './alpine-v150.js?v=150';
import * as THREE from 'three';
import {finishSurface} from './art-direction-v148.js?v=150';
import {canopyGeometry} from './race-finish-v147.js?v=147';
import{installBiomeFloor}from'./biome-floor-v140.js?v=140';
import{trackClearance}from'./scenery-clearance.js?v=51';
const noiseGLSL=`float wfHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float wfNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(wfHash(i),wfHash(i+vec2(1.,0.)),f.x),mix(wfHash(i+vec2(0.,1.)),wfHash(i+1.),f.x),f.y);}`;
function surface(material,course,terrain=false){
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=shader=>{previous?.call(material,shader);
 shader.vertexShader='varying vec2 wfUv;varying vec3 wfWorld;varying vec3 wfNormal;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nwfUv=uv;vec4 wfP=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nwfP=instanceMatrix*wfP;\n#endif\nwfWorld=(modelMatrix*wfP).xyz;wfNormal=inverseTransformDirection(transformedNormal,viewMatrix);');
 shader.fragmentShader='varying vec2 wfUv;varying vec3 wfWorld;varying vec3 wfNormal;\n'+noiseGLSL+'\n'+shader.fragmentShader;
 // V141 larger geological colour families: broad biomes remain readable
 // from the exterior camera, while slope-dependent soil/snow stays subtle.
 const terrainColor=course===3
  ?'mix(vec3(.05,.052,.065),vec3(.33,.162,.075),smoothstep(.20,.79,wfRock*.70+wfMacro*.30))+vec3(.11,.035,.007)*smoothstep(.52,.74,wfRock)*smoothstep(.47,.81,wfStrata)'
  :course===4
  ?'mix(mix(vec3(.10,.135,.18),vec3(.45,.47,.49),smoothstep(.26,.78,wfRock*.72+wfMacro*.28)),vec3(.79,.83,.85),smoothstep(110.,320.,wfWorld.y)*smoothstep(.25,.81,wfNormal.y))'
  :course===5
  ?'mix(mix(vec3(.055,.105,.041),vec3(.29,.38,.10),smoothstep(.22,.78,wfMacro)),mix(vec3(.14,.086,.048),vec3(.37,.21,.098),wfRock),clamp((.53-wfNormal.y)*.80+smoothstep(.49,.77,wfRock)*.53,0.,.68))*(.77+.33*wfStrata)'
  :course===6
  ?'mix(mix(vec3(.10,.115,.18),vec3(.43,.405,.51),smoothstep(.21,.77,wfMacro)),vec3(.28,.26,.37),wfRock*.5)+vec3(.055,.026,.084)*smoothstep(.55,.82,wfRock)*smoothstep(.49,.86,wfStrata)'
  :'mix(vec3(.20,.19,.22),vec3(.38,.36,.35),wfRock*.6+wfStrata*.22)';
 const macro='float wfMacro=wfNoise(wfWorld.xz*.0038);';
 const detail=terrain?`float wfRock=wfNoise(wfWorld.xz*.013)*.6+wfNoise(wfWorld.xz*.075)*.3+wfNoise(wfWorld.xz*.37)*.1;float wfStrata=.5+.5*sin(wfWorld.y*.15+wfNoise(wfWorld.xz*.016)*5.);${macro}diffuseColor.rgb=mix(diffuseColor.rgb,${terrainColor},.82);float wfGrain=mix(.5,wfNoise(wfWorld.xz*.8),1.-smoothstep(.35,1.,length(fwidth(wfWorld.xz*.8))));diffuseColor.rgb*=.83+.17*wfGrain;`:`vec2 wfGrid=wfUv*vec2(6.,3.);vec2 wfCell=fract(wfGrid);float wfAA=clamp(max(fwidth(wfGrid.x),fwidth(wfGrid.y)),.001,.5);float wfEdge=min(min(wfCell.x,1.-wfCell.x),min(wfCell.y,1.-wfCell.y));float wfPanel=mix(smoothstep(.012-wfAA,.035+wfAA,wfEdge),.94,smoothstep(.12,.35,wfAA));float wfBrushFade=1.-smoothstep(.1,.6,length(fwidth(wfUv*vec2(240.,14.))));float wfBrushed=mix(.5,wfNoise(wfUv*vec2(240.,14.)),wfBrushFade);float wfDirt=wfNoise(wfUv*vec2(7.,17.));diffuseColor.rgb*=mix(.52,1.,wfPanel)*(.91+.09*wfBrushed)*(.92+.08*wfDirt);diffuseColor.rgb+=vec3(.025)*wfPanel;`;
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n'+detail);
 if(!terrain)shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(1.-wfPanel)*.15+(wfDirt-.5)*.08,.48,.98);');
 };
 material.customProgramCacheKey=()=> 'world-finish-141-'+course+'-'+terrain;
}
export function installWorldFinish(root,track,course,materials,ground){
 for(const m of [materials.steel,materials.dark])if(m)surface(m,course);
 if(materials.rock){surface(materials.rock,course,true);finishSurface(materials.rock,'landscape',course);}
 const detail=new THREE.Group();detail.name='biome-exterior-detail';root.add(detail);
 const clearance=trackClearance(track),bounds=[],dummy=new THREE.Object3D(),rockMat=materials.rock;
 const rockGeo=course===4?alpineRidgeGeometry(false,false,-1.25):new THREE.IcosahedronGeometry(1,2),positions=rockGeo.attributes.position;
 if(course!==4)for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),k=1+.14*Math.sin(x*9+y*7+z*11)+.07*Math.sin(y*17-z*13);positions.setXYZ(i,x*k,y*k,z*k);}rockGeo.computeVertexNormals();
 const rocks=new THREE.InstancedMesh(rockGeo,rockMat,72);let count=0;
 for(let i=0;i<72;i++){const F=track.frame(track.length*(i+.5)/72),a=i*2.399963,r=(course===4?230:course===3?120:75)+(i%7)*28,x=F.p.x+Math.cos(a)*r,z=F.p.z+Math.sin(a)*r,y=ground(x,z),width=course===4?65+i%4*24:course===3?16+i%4*8:course===5?12+i%4*5:23+i%4*12,height=course===4?120+i%5*32:course===3?35+i%5*15:course===5?15+i%4*7:35+i%5*18;
 const box=clearance.bounds(x,y+height*.4,z,width*1.25,height*.85,width*1.25);if(!clearance.boxClear(box))continue;bounds.push(box);dummy.position.set(x,y+height*.28,z);dummy.rotation.set(0,i*1.71,0);dummy.scale.set(width,height*.58,width*.8);dummy.updateMatrix();rocks.setMatrixAt(count++,dummy.matrix);}
 rocks.count=count;rocks.instanceMatrix.needsUpdate=true;rocks.receiveShadow=true;detail.add(rocks);
 if(course===5){const leaf=new THREE.MeshStandardMaterial({color:0x416b35,vertexColors:true,roughness:.94}),bark=new THREE.MeshStandardMaterial({color:0x40372c,roughness:.97}),crowns=new THREE.InstancedMesh(canopyGeometry(),leaf,144),trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.7,1.6,1,9),bark,48);let trees=0,c=0;
 for(let i=0;i<48;i++){const F=track.frame(track.length*(i+.5)/48),a=i*2.399963,r=95+i%5*23,x=F.p.x+Math.cos(a)*r,z=F.p.z+Math.sin(a)*r,y=ground(x,z),h=65+i%5*10,box=clearance.bounds(x,y+h*.5,z,30,h*.55+12,30);if(!clearance.boxClear(box))continue;bounds.push(box);dummy.position.set(x,y+h*.5,z);dummy.rotation.set(0,i,0);dummy.scale.set(1,h,1);dummy.updateMatrix();trunks.setMatrixAt(trees++,dummy.matrix);for(let k=0;k<3;k++){dummy.position.set(x+Math.sin(i+k*2)*9,y+h-8+k*4,z+Math.cos(i+k*2)*9);dummy.scale.set(14+k*2,8+k,12+k*2);dummy.updateMatrix();crowns.setMatrixAt(c++,dummy.matrix);}}
 finishSurface(leaf,'canopy',course);finishSurface(bark,'organic',course);crowns.count=c;trunks.count=trees;crowns.instanceMatrix.needsUpdate=trunks.instanceMatrix.needsUpdate=true;detail.add(crowns,trunks);
 }
 if(course===4)alpineSurface(rockMat);
 const floor=installBiomeFloor(detail,track,course,ground,clearance);
 return{bounds,detail,floor};
}