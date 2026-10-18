// Added only to a CI-served engine copy. No testing controls ship in public/.
window.__shiftlineFamilyTest={
 list(){return [...new Set(specs.map(o=>o.family))];},
 show(family,clock=17.2,distance=24){
  const o=specs.find(o=>o.family===family&&!o.forceDodge)||specs.find(o=>o.family===family);if(!o)throw Error('Missing family '+family);
  paused=true;state='race';countdown=0;$('#count').classList.add('off');along=o.s-distance;time=clock;dead=0;impactStarted=-10;boost=false;speed=84;x=y=vx=vy=bank=0;target={x:0,y:0};visualPrevious=null;accumulator=0;firstPerson=false;cameraFollow={x:0,y:.8};cameraDistance=3.8;boostShake=0;
  for(const r of rivals)r.s=along-250;
  const F=track.frame(along);camera.position.copy(track.pose(along-3.8,0,.8));camera.up.copy(F.u);camera.lookAt(track.pose(along+12));camera.fov=78;camera.updateProjectionMatrix();
  render(1/60);render(1/60);render(1/60);
  const st=obstacleState(o,time);let error=0;
  for(let i=0;i<o.pieces.length;i++){const j=i*6,node=o.pieces[i];error=Math.max(error,Math.abs(node.position.x-st.pieces[j]),Math.abs(node.position.y-st.pieces[j+1]),Math.abs(node.position.z-st.pieces[j+2]),Math.abs(node.rotation.z-st.pieces[j+3]));}
  return {family,id:o.id,poses:[...st.pieces],poseError:error,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,ratio:renderer.getPixelRatio(),quality:$('#quality').value,lost:renderer.getContext().isContextLost()};
 }
};
