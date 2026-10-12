import * as THREE from 'three';
export function setNameTag(mesh,value){
 const name=String(value||'RACER').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,14)||'RACER';let tag=mesh.userData.nameTag;
 if(tag?.name===name)return;
 if(!tag){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:true,depthWrite:false,toneMapped:false,fog:false});const sprite=new THREE.Sprite(material);sprite.position.set(0,1.3,0);sprite.scale.set(3.6,.9,1);mesh.add(sprite);tag=mesh.userData.nameTag={canvas,texture,sprite,name:''};}
 const ctx=tag.canvas.getContext('2d');ctx.clearRect(0,0,512,128);ctx.fillStyle='#071520e8';ctx.fillRect(8,18,496,92);ctx.fillStyle='#75e9ee';ctx.fillRect(8,18,496,4);ctx.font='700 50px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#efffff';ctx.fillText(name,256,66,460);tag.name=name;tag.texture.needsUpdate=true;
}
export function updateNameTag(mesh,camera,active){const tag=mesh.userData.nameTag;if(!tag)return;const distance=mesh.position.distanceTo(camera.position);tag.sprite.visible=!!active&&mesh.visible&&distance<120;if(!tag.sprite.visible)return;const size=THREE.MathUtils.clamp(distance*.24,3.6,22);tag.sprite.scale.set(size,size*.25,1);tag.sprite.material.opacity=1-THREE.MathUtils.smoothstep(distance,80,120);}
export function disposeNameTag(mesh){const tag=mesh.userData.nameTag;if(!tag)return;mesh.remove(tag.sprite);tag.texture.dispose();tag.sprite.material.dispose();delete mesh.userData.nameTag;}
