import * as THREE from 'three';
export const PALETTES=[null,{name:'STORM DOCK',base:0x5deaff,shift:0xffb75e,metal:0x8197ac},{name:'PRISM CONDUIT',base:0x969eff,shift:0x50ffe3,metal:0xb0b7cf},{name:'ORBITAL HELIX',base:0xffc77a,shift:0x83b6ff,metal:0x8794a9},{name:'HELIX ENGINE',base:0xff715b,shift:0xffd986,metal:0x947d7b}];
export const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*v*(v*(v*6-15)+10)};
export function shiftState(time){const cycle=Math.floor(Math.max(0,time)/30),elapsed=Math.max(0,time)-cycle*30;if(!cycle)return{amount:0,cycle:0,transition:0};const transition=smooth(elapsed/5),amount=cycle%2?transition:1-transition;return{amount,cycle,transition}}
export function section(s,length){return s/length<.18?1:s/length<.47?2:s/length<.76?3:4}
export function themeColor(index,time,out=new THREE.Color()){const p=PALETTES[index];return out.setHex(p.base).lerp(new THREE.Color(p.shift),shiftState(time).amount)}

export function themeColorAt(s,length,time,out=new THREE.Color()){const n=section(s,length),bounds=[0,.18,.47,.76,1];themeColor(n,time,out);for(let k=1;k<4;k++){const b=bounds[k]*length;if(Math.abs(s-b)<100){const left=themeColor(k,time),right=themeColor(k+1,time);return out.copy(left).lerp(right,smooth((s-b+100)/200))}}return out}
