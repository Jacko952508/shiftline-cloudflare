// CI only. Measure the real airframe in the actual chase camera.
window.__shiftlineSightlineTest={
 view(family,distance=38){
  const view=window.__shiftlineReadabilityTest.show(family,17.2,distance),p=new THREE.Vector3();let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity;
  player.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  player.traverseVisible(o=>{
   if(!o.isMesh||Array.isArray(o.material)||o.material.transparent||o.material.isShaderMaterial)return;
   o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;
   for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
    p.set(x,y,z).applyMatrix4(o.matrixWorld).project(camera);left=Math.min(left,p.x);right=Math.max(right,p.x);bottom=Math.min(bottom,p.y);top=Math.max(top,p.y);
   }
  });
  return {...view,airframe:{width:(right-left)/2,height:(top-bottom)/2,top:(1-top)/2},cameraDistance,cameraHeight:cameraFollow.y,guides:world.sightlines||null};
 }
};
