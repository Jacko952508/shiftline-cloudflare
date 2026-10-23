// SHIFT LINE full-build in-chat loader helper; isolated branch only.
// Original source is read-only and pinned to a production commit.
export const SOURCE_COMMIT='3bf6e8d8d317eba49dec145de6091fd117205f8b';
export const SOURCE_BASE='https://cdn.jsdelivr.net/gh/Jacko952508/shiftline-cloudflare@'+SOURCE_COMMIT+'/public/';
export function prepareOriginalHTML(html){
 const base=SOURCE_BASE;
 html=html.replace(/<head>/i,'<head><base href="'+base+'"><style>html,body{overscroll-behavior:none}#game{touch-action:none}</style>');
 // Leave original stylesheet links intact: base href resolves all links, CSS @imports, and url() paths.
 // Absolute module src is necessary for module-relative import resolution.
 html=html.replace(/(<script\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi,(_,a,path,b)=>a+new URL(path,base).href+b);
 html=html.replace(/<script type="importmap">[\s\S]*?<\/script>/i,'<script type="importmap">'+JSON.stringify({imports:{three:base+'vendor/three.module.js'}})+'</script>');
 const diagnostics=`<script>(function(){function send(kind,value){parent.postMessage({shiftChatDiagnostic:{kind,value:String(value)}},"*")}window.addEventListener("error",function(e){send("error",e.message||e.target?.src||e.target?.href||"resource load error")},true);window.addEventListener("unhandledrejection",function(e){send("rejection",e.reason?.stack||e.reason||"unknown")});setTimeout(function(){send("startup",window.shiftlineReady?"ready":"not ready after 15 seconds")},15000)})();<\/script>`;
 return html.replace(/<\/body>/i,diagnostics+'</body>');
}
