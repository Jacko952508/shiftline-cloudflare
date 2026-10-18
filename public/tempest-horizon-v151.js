import * as THREE from 'three';
// Preserve the detailed course terrain verbatim. Eight low-resolution rings
// continue its exact border to a perimeter beyond both racing and survey cameras.
export const TEMPEST_HORIZON_PADDING=26000;
export const TEMPEST_HORIZON_RINGS=[0,160,480,1200,3000,6500,13500,TEMPEST_HORIZON_PADDING];
export function tempestHorizonGeometry(terrain,ground){
 const {widthSegments:nx,heightSegments:nz}=terrain.parameters;
 if(!Number.isInteger(nx)||!Number.isInteger(nz))throw Error('Tempest terrain grid required');
 terrain.computeBoundingBox();
 const box=terrain.boundingBox,cx=(box.min.x+box.max.x)*.5,cz=(box.min.z+box.max.z)*.5;
 const hx=(box.max.x-box.min.x)*.5,hz=(box.max.z-box.min.z)*.5;
 const p=terrain.attributes.position,n=terrain.attributes.normal,uv=terrain.attributes.uv;
 const border=[];
 for(let x=0;x<nx;x++)border.push(x);
 for(let z=0;z<nz;z++)border.push(z*(nx+1)+nx);
 for(let x=nx;x>0;x--)border.push(nz*(nx+1)+x);
 for(let z=nz;z>0;z--)border.push(z*(nx+1));
 const positions=[],uvs=[],indices=[],count=border.length;
 for(const offset of TEMPEST_HORIZON_RINGS)for(const id of border){
  const x=cx+(p.getX(id)-cx)*(1+offset/hx),z=cz+(p.getZ(id)-cz)*(1+offset/hz);
  // Distant connected foothills and ridges replace a flat rectangular shelf.
  // At the join the analytic heightfield is exactly unchanged.
  const blend=THREE.MathUtils.smoothstep(offset,300,1800);
  const ridge=Math.abs(Math.sin(x*.00063+Math.sin(z*.00041)*.65));
  const massif=.5+.5*Math.sin(z*.00091-x*.00027);
  const relief=blend*(100+Math.pow(ridge,2.5)*(450+massif*750));
  positions.push(x,offset===0?p.getY(id):ground(x,z)+relief,z);
  uvs.push(offset===0?uv.getX(id):(x-box.min.x)/(hx*2),offset===0?uv.getY(id):1-(z-box.min.z)/(hz*2));
 }
 for(let ring=0;ring<TEMPEST_HORIZON_RINGS.length-1;ring++)for(let i=0;i<count;i++){
  const j=(i+1)%count,a=ring*count+i,b=(ring+1)*count+i,c=ring*count+j,d=(ring+1)*count+j;
  indices.push(a,c,b,c,d,b);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
 // Identical positions, UVs AND lighting normals avoid tracing the old edge.
 for(let i=0;i<count;i++){const id=border[i];geo.attributes.normal.setXYZ(i,n.getX(id),n.getY(id),n.getZ(id));}
 geo.computeBoundingBox();geo.computeBoundingSphere();
 geo.userData.tempestHorizon151={version:151,padding:TEMPEST_HORIZON_PADDING,rings:TEMPEST_HORIZON_RINGS.length,seamVertices:count,triangles:indices.length/3,extraDrawCalls:1};
 return geo;
}
export function attachTempestHorizon(root,terrain,material,ground){
 const geometry=tempestHorizonGeometry(terrain,ground),mesh=new THREE.Mesh(geometry,material);
 mesh.name='TEMPEST / continuous mountain horizon';mesh.castShadow=false;mesh.receiveShadow=false;root.add(mesh);
 const stats={...geometry.userData.tempestHorizon151};
 if(typeof window!=='undefined'&&typeof location!=='undefined'&&location.search.includes('sceneryqa=1'))window.__shiftlineHorizonQA=stats;
 return {mesh,stats};
}
