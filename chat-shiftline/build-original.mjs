// Build the unmodified SHIFT LINE production source into a single in-chat HTML document.
// Run on the isolated shiftline-chat-isolated branch only.
// npm install --no-save esbuild && node chat-shiftline/build-original.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {build} from 'esbuild';
const source='public',out='chat-shiftline/dist';
await fs.mkdir(out,{recursive:true});
const html=await fs.readFile(path.join(source,'index.html'),'utf8');
const base='https://cdn.jsdelivr.net/gh/Jacko952508/shiftline-cloudflare@3bf6e8d8d317eba49dec145de6091fd117205f8b/public/';
const scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
const entry=path.join(os.tmpdir(),'shiftline-chat-entry-'+process.pid+'.mjs');
const files=scripts.map(x=>x[1].split('?')[0]).filter(x=>x.endsWith('.js'));
await fs.writeFile(entry,files.map(f=>'import '+JSON.stringify(path.resolve(source,f).replaceAll('\\','/'))+';').join('\n'));
const audioPath=path.resolve(source,'audio.js').replaceAll('\\\\','/');
await fs.appendFile(entry,'\\nimport {audioResume as chatResume, __chatAudioInfo as chatStatus} from '+JSON.stringify(audioPath)+';\\nwindow.__shiftlineChatAudio={resume:chatResume,status:chatStatus};\\n');
const result=await build({entryPoints:[entry],bundle:true,write:false,format:'iife',platform:'browser',target:'es2020',loader:{'.png':'dataurl','.jpg':'dataurl','.svg':'dataurl'},alias:{three:path.resolve(source,'vendor/three.module.js')},logLevel:'warning',plugins:[{
 name:'chat-soundtrack-paths',
 setup(b){b.onLoad({filter:/[/\\\\]public[/\\\\]audio\\.js$/},async args=>{
  const original=await fs.readFile(args.path,'utf8');
  const patched=original.replace(/(['"])\\.\\/music\\/(m1|s[1-6])\\.mp3/g,(_,quote,name)=>quote+base+'music/'+name+'.mp3');
  return {loader:'js',contents:patched+'\\nexport function __chatAudioInfo(){return {state:ctx?.state??"not-created",volume:userVolume,track,playing:!!src,missing:[...missingRecordings],pending:[...pending.keys()]};}\\n'};
 });}
}]} );
await fs.unlink(entry);
const js=result.outputFiles.find(f=>f.path.endsWith('.js'))?.text ?? result.outputFiles[0]?.text;
if(!js)throw new Error('esbuild returned no JavaScript output');
let page=html.replace(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*><\/script>/gi,'').replace(/<script type="importmap">[\s\S]*?<\/script>/gi,'');
const cssTags=[...page.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)];
for(const m of cssTags){const file=m[0].match(/href=["']([^"']+)/)?.[1]?.split('?')[0];if(!file)continue;const css=await fs.readFile(path.join(source,file),'utf8');page=page.replace(m[0],'<style>'+css.replace(/<\/style/gi,'<\\/style')+'</style>');}
page=page.replace(/<head>/i,'<head><base href="'+base+'">');
page=page.replace(/<\/body>/i,'<script>'+js.replace(/<\/script/gi,'<\\/script')+'</script></body>');
await fs.writeFile(path.join(out,'index.html'),page);
console.log('Built original game package:',Buffer.byteLength(page),'bytes');
