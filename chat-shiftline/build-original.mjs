// Package the original SHIFT LINE source for ChatGPT without changing public/ or main.
// Only chat-shiftline/dist/index.html on shiftline-chat-isolated is generated.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {build} from 'esbuild';

const source='public', out='chat-shiftline/dist';
const base='https://cdn.jsdelivr.net/gh/Jacko952508/shiftline-cloudflare@3bf6e8d8d317eba49dec145de6091fd117205f8b/public/';
await fs.mkdir(out,{recursive:true});
const html=await fs.readFile(path.join(source,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
const files=scripts.map(m=>m[1].split('?')[0]).filter(p=>p.endsWith('.js'));
const entry=path.join(os.tmpdir(),'shiftline-chat-entry-'+process.pid+'.mjs');
const modulePath=p=>JSON.stringify(path.resolve(source,p).replaceAll('\\','/'));
const imports=files.map(f=>'import '+modulePath(f)+';').join('\n');
const chatAudioHook='\nimport {audioResume as chatResume, __chatAudioInfo as chatStatus} from '+modulePath('audio.js')+';\nwindow.__shiftlineChatAudio={resume:chatResume,status:chatStatus};\n';
await fs.writeFile(entry,imports+chatAudioHook);
try {
  const result=await build({
    entryPoints:[entry],bundle:true,write:false,format:'iife',
    platform:'browser',target:'es2020',
    loader:{'.png':'dataurl','.jpg':'dataurl','.svg':'dataurl'},
    alias:{three:path.resolve(source,'vendor/three.module.js')},
    logLevel:'warning',
    plugins:[{
      name:'chat-soundtrack-paths',
      setup(b){
        b.onLoad({filter:/[/\\]audio\.js$/},async args=>{
          const original=await fs.readFile(args.path,'utf8');
          // Exact original MP3s, pinned to the known-good production revision.
          const patched=original.replaceAll("'./music/","'"+base+"music/");
          const diagnostics='\nexport function __chatAudioInfo(){return {state:ctx?.state??"not-created",volume:userVolume,track,playing:!!src,missing:[...missingRecordings],pending:[...pending.keys()]};}\n';
          return {loader:'js',contents:patched+diagnostics};
        });
      }
    }]
  });
  const js=result.outputFiles.find(f=>f.path.endsWith('.js'))?.text??result.outputFiles[0]?.text;
  if(!js)throw new Error('esbuild returned no JavaScript output');
  let page=html.replace(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*><\/script>/gi,'')
    .replace(/<script type="importmap">[\s\S]*?<\/script>/gi,'');
  const cssTags=[...page.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)];
  for(const match of cssTags){
    const file=match[0].match(/href=["']([^"']+)/)?.[1]?.split('?')[0];
    if(!file)continue;
    const css=await fs.readFile(path.join(source,file),'utf8');
    page=page.replace(match[0],'<style>'+css.replace(/<\/style/gi,'<\\/style')+'</style>');
  }
  page=page.replace(/<head>/i,'<head><base href="'+base+'">');
  page=page.replace(/<\/body>/i,'<script>'+js.replace(/<\/script/gi,'<\\/script')+'</script></body>');
  await fs.writeFile(path.join(out,'index.html'),page);
  if(!page.includes('window.__shiftlineChatAudio'))throw new Error('Audio activation API missing');
  if(!page.includes(base+'music/m1.mp3'))throw new Error('Absolute menu soundtrack URL missing');
  if(!page.includes('id="game"'))throw new Error('Original canvas missing');
  console.log('Built original game package:',Buffer.byteLength(page),'bytes; audio urls present');
} finally {
  await fs.unlink(entry).catch(()=>{});
}
