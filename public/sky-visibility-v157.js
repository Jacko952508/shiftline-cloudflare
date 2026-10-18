import * as THREE from 'three';

// Custom sky shaders used to send linear light straight to the iPhone's
// display. Use the same output conversion as the rest of the scene; offscreen
// HDR targets correctly leave the conversion to the compositor.
export function atmosphereOutput(material){
 if(!material?.isShaderMaterial||material.userData.display157)return material;
 material.fragmentShader=material.fragmentShader.replace(/}\s*$/, '\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}');
 material.toneMapped=true;material.userData.display157=true;material.needsUpdate=true;return material;
}

export function createStarfield(course=1){
 const positions=[],colors=[],sizes=[],count=3600;
 for(let i=0;i<count;i++){
  const a=i*2.3999632297,y=1-2*(i+.5)/count,r=Math.sqrt(1-y*y);
  positions.push(Math.cos(a)*r*6000,y*6000,Math.sin(a)*r*6000);
  const c=new THREE.Color(i%11===0?0xffd3a2:i%7===0?0x9fcaff:0xe4edff);colors.push(c.r,c.g,c.b);
  sizes.push(i%47===0?5.5:i%9===0?3.6:2.4+(i%5)*.20);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('starSize',new THREE.Float32BufferAttribute(sizes,1));
 const m=atmosphereOutput(new THREE.ShaderMaterial({uniforms:{time:{value:0},pixelRatio:{value:1}},vertexShader:`attribute vec3 color;attribute float starSize;varying vec3 tint;varying float phase;uniform float time;uniform float pixelRatio;
 void main(){phase=dot(position,vec3(.13,.27,.17));tint=color*(.94+.06*sin(time*.3+phase));gl_PointSize=starSize*pixelRatio;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec3 tint;varying float phase;void main(){float r=length(gl_PointCoord-.5);float core=1.-smoothstep(.10,.37,r);float halo=1.-smoothstep(.10,.5,r);gl_FragColor=vec4(tint*(.85+core*.65),max(core,halo*.28)*.95);}`,
 transparent:true,depthWrite:false,fog:false}));
 const stars=new THREE.Points(g,m);stars.name='V157 / resolved orbital stars / '+course;stars.frustumCulled=false;
 stars.onBeforeRender=renderer=>{m.uniforms.pixelRatio.value=renderer.getPixelRatio();};return stars;
}

const riftSky=`varying vec3 ray;uniform float time;uniform vec3 base;
 float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1)),f.x),f.y),f.z);}
 float field(vec3 p){float v=0.,a=.55;for(int i=0;i<4;i++){v+=noise(p)*a;p=p*2.03+vec3(3.7,5.2,1.9);a*=.5;}return v;}
 void main(){vec3 d=normalize(ray);float band=exp(-pow(dot(d,normalize(vec3(.25,.84,.48)))*3.2,2.));float cloud=field(d*4.+vec3(time*.0008,0.,0.));float dust=field(d*13.+cloud*2.);float thread=smoothstep(.34,.68,cloud)*band;
 vec3 c=vec3(.004,.006,.016)+base*.45;c+=mix(vec3(.018,.035,.085),vec3(.095,.031,.102),dust)*thread;c+=vec3(.032,.052,.085)*pow(thread,2.)*(.45+dust);c*=1.-smoothstep(.5,.73,dust)*thread*.40;gl_FragColor=vec4(c,1.);}`;

// A true 3D cloud field has no projection axis, horizon division or mirrored
// underside. Four filtered scales give soft banks and fine wisps in one draw.
const naturalSky=`varying vec3 v;uniform float time,level,shift;uniform vec3 base;
 float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1)),f.x),f.y),f.z);}
 void main(){vec3 d=normalize(v);vec3 q=d*5.4,drift=vec3(time*.006,0.,-time*.004);float broad=noise(q+drift);float middle=noise(q*2.17+drift*.75+3.8);float fine=noise(q*5.3-drift*.4);float wisp=noise(q*12.7+drift*.25);float n=broad*.53+middle*.28+fine*.13+wisp*.06;
 float horizon=pow(1.-clamp(abs(d.y)*3.4,0.,1.),3.);float overhead=smoothstep(-.015,.28,d.y);float cloud=smoothstep(.38,.72,n)*overhead;float sun=pow(max(0.,dot(d,normalize(vec3(-.6,.35,.7)))),12.);
 vec3 c=base*(.72+.48*max(0.,d.y));
 if(level<4.5){
  c+=vec3(.185,.25,.35)*horizon;float shade=clamp(.42+sun*.45+(fine-.5)*.4-broad*.15,0.,1.);vec3 bank=mix(vec3(.055,.075,.115),vec3(.25,.31,.39),shade);c=mix(c,bank,cloud*.84);c+=vec3(.10,.14,.19)*sun*cloud*(1.-cloud)*1.8;float lightning=pow(max(0.,sin(time*.67)+sin(time*1.91)-1.67),2.);c+=vec3(.14,.19,.27)*cloud*lightning;
 }else{
  c+=vec3(.11,.185,.096)*horizon;float shade=clamp(.50+sun*.4+(fine-.5)*.35,0.,1.);vec3 bank=mix(vec3(.07,.115,.105),vec3(.32,.43,.36),shade);c=mix(c,bank,cloud*.72);c+=vec3(.12,.09,.035)*pow(sun,2.)*.45;
 }gl_FragColor=vec4(c,1.);}`;

export function attachSkyVisibility(w,course){
 if(course===6){
  const old=w.skyMat;
  w.skyMat=atmosphereOutput(new THREE.ShaderMaterial({uniforms:{time:{value:0},shift:{value:0},base:{value:old.uniforms.base.value.clone()}},side:THREE.BackSide,depthWrite:false,vertexShader:'varying vec3 ray;void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:riftSky}));
  w.sky.material=w.skyMat;old.dispose();w.stars=createStarfield(course);w.root.add(w.stars);
 }else{
  if(course===4||course===5)w.skyMat.fragmentShader=naturalSky;
  atmosphereOutput(w.skyMat||w.vista?.water?.material);
 }
 if(w.planet)atmosphereOutput(w.planet.material);
 w.skyVisibility={version:157,stars:w.stars?.geometry.attributes.position.count||0,displayCorrect:true};return w;
}

export function updateSkyVisibility(w,s,time){
 // These two cheap draws survive reduced scenery mode as well.
 const sky=w.sky||w.vista?.water;if(sky){sky.position.copy(w.track.pose(s));sky.updateMatrix();}
 if(w.stars){w.stars.position.copy(sky.position);w.stars.material.uniforms.time.value=time;w.stars.updateMatrix();}
 if(w.skyMat?.uniforms.time)w.skyMat.uniforms.time.value=time;
}
