// CI-only view controls, appended to a served engine copy; never shipped.
window.__shiftlineGlowTest={
 show(fraction,enabled=true){
  paused=true;state='race';countdown=0;$('#count').classList.add('off');
  const o=specs.reduce((best,o)=>Math.abs(o.s-track.length*fraction)<Math.abs(best.s-track.length*fraction)?o:best,specs[0]);
  along=Math.max(0,o.s-25);time=17.2;dead=0;impactStarted=-10;boost=false;speed=84;x=y=vx=vy=bank=0;target={x:0,y:0};visualPrevious=null;accumulator=0;firstPerson=false;cameraFollow={x:0,y:.8};cameraDistance=3.8;boostShake=0;
  for(const r of rivals)r.s=along-250;
  for(const s of specs)s.material.userData.hazardGlowStrength.value=enabled?1:0;
  const F=track.frame(along);camera.position.copy(track.pose(Math.max(0,along-3.8),0,.8));camera.up.copy(F.u);camera.lookAt(track.pose(along+12));camera.fov=78;camera.updateProjectionMatrix();render(1/60);
  return {id:o.id,kind:o.kind,course,enabled,lit:specs.every(s=>s.material.userData.hazardGlow155),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,ratio:renderer.getPixelRatio(),quality:$('#quality').value,lost:renderer.getContext().isContextLost()};
 }
};
