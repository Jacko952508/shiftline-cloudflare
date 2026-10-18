// CI only. Freeze the real race; these controls are never included in public/.
window.__shiftlineReadabilityTest={
 gate:null,
 show(family,clock=17.2,distance=38){
  const result=window.__shiftlineFamilyTest.show(family,clock,distance);this.gate=specs.find(o=>o.id===result.id);
  return {...result,sky:world.skyVisibility,glow:this.gate.material.userData.hazardGlowStrength.value,fog:this.gate.material.fog};
 },
 hideHazard(hidden=true){this.gate.rig.visible=!hidden;effects.render(scene,camera,time,false,$('#quality').value,true);},
 sky(){
  const sky=world.sky||world.vista?.water,temporary=new THREE.Scene();
  for(const source of [sky,world.stars].filter(Boolean)){
   const copy=source.clone();copy.matrix.copy(source.matrixWorld);copy.matrixAutoUpdate=false;copy.position.set(0,0,0);temporary.add(copy);
  }
  renderer.setRenderTarget(null);renderer.render(temporary,camera);
  return {stars:world.stars?.geometry.attributes.position.count||0,converted:sky.material.userData.display157===true};
 }
};
