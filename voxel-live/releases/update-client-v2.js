// Reality Engine updater v2: resilient iOS-friendly discovery for external in-chat viewers.
// Install in the viewer itself; publishing this file does not automatically alter an existing AppBlock.
const OWNER='Jacko952508', REPO='shiftline-cloudflare',BRANCH='nimbus-chat-live';
const root=OWNER+'/'+REPO;
const indexPath='voxel-live/releases/index.json';
export const knownRelease={version:14,engineCommit:'e8597256949a5261c3e6b53b6292cdf3e7fd2cba',engineFile:'engine-v14.js'};
const candidates=[
  'https://cdn.jsdelivr.net/gh/'+root+'@'+BRANCH+'/'+indexPath,
  'https://raw.githubusercontent.com/'+root+'/'+BRANCH+'/'+indexPath
];
function validate(release){
  return release && Number.isSafeInteger(release.version) && release.version>=1 &&
    /^[a-f0-9]{40}$/i.test(release.engineCommit) &&
    /^engine-v[0-9]+\.js$/.test(release.engineFile);
}
async function fetchIndex(url,timeoutMs=8000){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const reply=await fetch(url+(url.includes('?')?'&':'?')+'t='+Date.now(),{
      signal:controller.signal,cache:'no-store',mode:'cors'
    });
    if(!reply.ok)throw new Error('Index '+reply.status);
    const json=await reply.json();
    if(json?.schema!=='reality.engine/releases/1'||!Array.isArray(json.releases))
      throw new Error('Unsupported release index');
    const releases=json.releases.filter(validate).sort((a,b)=>b.version-a.version);
    if(!releases.length)throw new Error('Release index is empty');
    return releases[0];
  }finally{clearTimeout(timeout)}
}
export async function discoverRelease(currentVersion=0,onStatus=()=>{}){
  const errors=[];
  for(const url of candidates){
    try{
      const release=await fetchIndex(url);
      onStatus('Release index available');
      return {release,source:url,online:true,isNew:release.version>currentVersion};
    }catch(error){
      errors.push(String(error?.message||error));
    }
  }
  // Failure to contact GitHub Raw/API must not block a known immutable V13 build.
  onStatus('Index service unavailable; pinned V14 recovery available');
  return {
    release:knownRelease,source:'pinned-recovery',online:false,
    isNew:knownRelease.version>currentVersion,diagnostic:errors.join(' | ')
  };
}
export async function importEngine(release=knownRelease){
  if(!validate(release))throw new Error('Invalid release metadata');
  const url='https://cdn.jsdelivr.net/gh/'+root+'@'+release.engineCommit+
    '/voxel-live/'+release.engineFile;
  const module=await import(/* webpackIgnore: true */ url);
  if(typeof module.mount!=='function')throw new Error('Engine does not export mount()');
  return {module,url};
}
