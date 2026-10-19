import {handlingProfile} from './ship-handling-v177.js?v=177';
import {MASTERY_GOALS,availableTitles,pilotTitle,masteryState,masteryCount,equipTitle} from './mastery-v177.js?v=177';
import {courseSectors,sectorKey} from './race-sectors-v176.js?v=177';
import {createTrack} from './race-track.js?v=175';
import {FLEET_EDITIONS,fleetEdition,fleetFinishLabel,editionIndex,equipEdition} from './fleet-designs-v162.js?v=163';
import {MODELS} from './ship-catalog.js?v=163';
import {TRACKS,readProgress,saveProgress,selectShip,formatTime} from './progress.js?v=177';
import {GAME_MODES,modeDetails,createMenuFlow} from './menu-flow-v164.js?v=164';

const $=selector=>document.querySelector(selector),flow=createMenuFlow(),menu=$('#menu');
const pageIds={home:'homePage',modes:'modePage',levels:'racePage',demo:'demoPage',garage:'garagePage',records:'recordsPage'};
const tags=['','ORBITAL ENGINE','ABYSSAL CITY','VOLCANIC FOUNDRY','STORM MOUNTAINS','FOREST VALLEY','LUNAR MINES'];
const paths=['','M20 60C40 0 140 0 160 60S80 120 70 65S180 10 220 62','M20 36C100 0 210 8 205 60S60 125 45 78S165 16 220 94','M20 100L50 20L95 90L130 30L175 70L220 10','M20 78C40 0 85 0 90 60S130 135 160 64S205 0 220 45','M20 60Q40 5 80 30T135 85T200 50L220 20','M20 80L55 20L85 55L115 20L165 95L185 40L220 80'];
const icons={flag:'<path d="M8 30V5m0 1h8l4 4h9v13h-9l-4-4H8"/><path d="M16 6v13m4-9v13M8 12h8m4 4h9"/>',clock:'<circle cx="18" cy="19" r="12"/><path d="M18 12v8l5 3M14 3h8m-4 0v4m9 1 3 3"/>',target:'<circle cx="18" cy="18" r="11"/><circle cx="18" cy="18" r="4"/><path d="M18 2v7m0 18v7M2 18h7m18 0h7"/>',film:'<rect x="4" y="6" width="28" height="24" rx="2"/><path d="M10 6v24m16-24v24M4 12h6m-6 12h6m16-12h6m-6 12h6"/><path d="m15 13 7 5-7 5z"/>'};
$('#gameModes').innerHTML=GAME_MODES.map(m=>'<button type="button" class="modeChoice" data-mode="'+m.id+'"><span class="modeIcon" aria-hidden="true"><svg viewBox="0 0 36 36">'+icons[m.icon]+'</svg></span><span class="modeArrow" aria-hidden="true">↗</span><strong>'+m.name+'</strong>'+(m.id==='tour'?'<small class="modeTag">DISPLAY RIDE</small>':'')+'</button>').join('');
function refresh(){
 const p=readProgress(),state=flow.state,mode=modeDetails(state.mode),track=TRACKS[state.course];
 document.documentElement.style.setProperty('--accent',track.color);
 $('#pilotXP').textContent=p.xp.toLocaleString()+' XP';$('#pilotRank').textContent=pilotTitle(p);
 $('#trackTitle').textContent=track.name;$('#demoModeLabel').textContent='/ '+mode.name;$('#levelModeLabel').textContent=mode.name;
 document.querySelectorAll('button[data-mode]').forEach(b=>{const chosen=b.dataset.mode===state.mode;b.classList.toggle('selected',chosen);b.setAttribute('aria-pressed',String(chosen));});
 $('.flowLevels').innerHTML=TRACKS.slice(1).map((t,i)=>{const id=i+1;return'<button type="button" class="levelChoice'+(state.course===id?' selected':'')+'" data-course="'+id+'" style="--level-accent:'+t.color+'"><span class="levelNumber">0'+id+'</span><svg class="levelArt" viewBox="0 0 240 120" aria-hidden="true"><path d="'+paths[id]+'"/></svg><span class="levelArrow" aria-hidden="true">↗</span><strong>'+t.name+'</strong><small class="levelTag">'+tags[id]+'</small><span class="levelBest">'+(p.records[id]?(p.recordVersions?.[id]===176?'BEST / ':'LEGACY BEST / ')+formatTime(p.records[id]):'')+'</span><span id="medal'+id+'" hidden>'+(p.medals[id]||'—')+'</span></button>';}).join('');
 $('#recordsList').innerHTML=TRACKS.slice(1).map((t,i)=>'<div class="recordRow"><span>0'+(i+1)+'</span><b>'+t.name+'</b><strong>'+formatTime(p.records[i+1])+'</strong><em>'+(p.medals[i+1]||'UNRACED')+'</em></div>').join('');
 renderMastery(p,state.course);$('#practiceOptions').classList.toggle('off',state.mode!=='trial');if(state.screen==='demo'&&state.mode==='trial'){$('#practiceSectors').replaceChildren();for(const sector of courseSectors(state.course,createTrack(state.course).length)){const b=document.createElement('button');b.type='button';b.dataset.sector=sector.index;b.textContent=sector.name+' / '+formatTime(p.sectorBests?.[sectorKey(state.course,true)]?.[sector.index]?.ms);$('#practiceSectors').append(b);}}renderGarageOptions(p);
}
function showScreen(){
 const s=flow.state;menu.dataset.screen=s.screen;menu.dataset.currentMode=s.mode;menu.dataset.currentCourse=s.course;
 for(const [key,id]of Object.entries(pageIds))$('#'+id).classList.toggle('off',key!==s.screen);
 document.body.classList.toggle('garageOpen',s.screen==='garage');document.body.classList.toggle('menuDemo',s.screen==='demo');
 $('#menuBack').hidden=s.screen==='home'||s.screen==='demo';$('#flowCrumb').textContent={home:'ANTI-GRAVITY RACING',modes:'SOLO / GAME MODE',levels:'SOLO / LEVEL SELECT',garage:'FLIGHTWORKS / COLLECTION',records:'PILOT / RECORDS'}[s.screen]||'';
 menu.scrollTop=0;refresh();
 if(s.screen==='demo'){$('#demoLoading').classList.remove('off');$('#launch').disabled=true;}
 else {$('#demoLoading').classList.add('off');$('#launch').disabled=false;}
 window.dispatchEvent(new CustomEvent('shiftline-menu-screen',{detail:{...s}}));
 if(location.search.includes('menuqa=1'))window.__shiftlineMenuQA={...s};
}
function back(){const records=flow.state.screen==='records';flow.back();showScreen();if(records)$('#settingsBtn').click();}
$('#menuBack').onclick=back;$('#demoBack').onclick=back;
$('[data-home="solo"]').onclick=()=>{flow.solo();showScreen();};$('[data-home="garage"]').onclick=()=>{flow.garage();showScreen();};
$('#gameModes').addEventListener('click',event=>{const b=event.target.closest('[data-mode]');if(b){flow.mode(b.dataset.mode);showScreen();}});
$('.flowLevels').addEventListener('click',event=>{const b=event.target.closest('[data-course]');if(b){flow.level(+b.dataset.course);showScreen();}});
$('#practiceSectors').onclick=e=>{const b=e.target.closest('[data-sector]');if(!b||!window.shiftlineReady||$('#launch').disabled)return;window.dispatchEvent(new CustomEvent('shiftline-launch',{detail:{course:flow.state.course,mode:'practice',sector:+b.dataset.sector}}));};
$('#launch').onclick=()=>{if(!window.shiftlineReady||$('#launch').disabled)return;window.dispatchEvent(new CustomEvent('shiftline-launch',{detail:{course:flow.state.course,mode:flow.state.mode}}));};
$('#recordsBtn').onclick=()=>{$('#settings').classList.add('off');menu.classList.remove('off');flow.records();showScreen();};
window.addEventListener('shiftline-menu',()=>{flow.home();showScreen();});
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.classList.contains('off')&&flow.state.screen!=='home'){event.preventDefault();back();}});
function updateBuild(mutator){const p=readProgress();mutator(p);const saved=saveProgress(p);refresh();$('#garageNote').textContent=saved?'Your selected ship and edition save automatically.':'Browser storage is unavailable. This choice will last for this session.';window.dispatchEvent(new Event('shiftline-customisation'));}
$('#retryLoad').onclick=()=>location.reload();$('#errorBack').onclick=()=>{$('#loadError').classList.add('off');$('#menuNotice').textContent='3D GRAPHICS UNAVAILABLE IN THIS BROWSER';};
try{$('#sensitivity').value=localStorage.getItem('shiftlineSensitivity')||100;$('#quality').value=localStorage.getItem('eclipseQualityV1')||'auto';$('#reducedMotion').checked=localStorage.getItem('shiftlineMotion')==='1';}catch{}
function sensitivity(){const el=$('#sensitivity');$('#sensitivityVal').textContent=el.value+'%';try{localStorage.setItem('shiftlineSensitivity',el.value);}catch{}}
$('#sensitivity').oninput=sensitivity;sensitivity();$('#quality').onchange=()=>{try{localStorage.setItem('eclipseQualityV1',$('#quality').value);}catch{}window.dispatchEvent(new Event('shiftline-quality'));};$('#reducedMotion').onchange=()=>{try{localStorage.setItem('shiftlineMotion',$('#reducedMotion').checked?'1':'0');}catch{}};

const MODEL_SHAPES=['M24 3 L29 19 L44 37 L35 40 L27 30 L24 43 L21 30 L13 40 L4 37 L19 19Z','M24 2 L28 31 L39 6 L44 41 L27 36 L24 44 L21 36 L4 41 L9 6 L20 31Z','M24 3 L45 36 L35 41 L24 35 L13 41 L3 36Z','M24 8 Q35 4 45 10 Q41 23 32 39 L24 32 L16 39 Q7 23 3 10 Q13 4 24 8Z','M24 11 L29 38 L24 44 L19 38Z M8 3 L15 5 L16 40 L7 43Z M40 3 L33 5 L32 40 L41 43Z M12 19 L36 19 M12 33 L36 33','M24 2 L29 30 L24 44 L19 30Z M12 12 L5 5 L10 40 L20 32Z M36 12 L43 5 L38 40 L28 32Z'];
const hex=n=>'#'+n.toString(16).padStart(6,'0');
function renderGarageOptions(p){
 const d=fleetEdition(p.craft,p.custom),selected=editionIndex(p.custom);
 $('#garagePage').style.setProperty('--fleet-accent',hex(d.accent));
 $('#garageFinishLabel').textContent=d.name;
 $('#garageFinishDescription').textContent=fleetFinishLabel(p.craft,p.custom)+' · '+d.description.split(' · ').slice(1).join(' · ');
 $('#garageDescription').textContent=MODELS[p.craft].tag;const h=handlingProfile(p.craft);$('#shipHandling').textContent=h.name+' / RESPONSE '+h.response+'/5 · GRIP '+h.grip+'/5';$('#shipHandlingDescription').textContent=h.description+' All ships share the same top speed, boost and collision envelope.';
 $('#garageBuildBadge').textContent='EQUIPPED';
 $('#garageCategoryTitle').textContent='CHOOSE YOUR EDITION';
 $('#garageCategorySubtitle').textContent='Metallic, chrome and pearlescent factory finishes.';
 $('#fleetShips').innerHTML=MODELS.map((m,i)=>'<button type="button" class="fleetShip'+(p.craft===i?' selected':'')+'" data-fleet-ship="'+i+'" aria-pressed="'+(p.craft===i)+'"><span class="fleetNumber">0'+(i+1)+'</span><svg viewBox="0 0 48 48" aria-hidden="true"><path d="'+MODEL_SHAPES[i]+'"/></svg><strong>'+m.name+'</strong><small>'+m.tag+'</small></button>').join('');
 $('#garageOptionRail').innerHTML=FLEET_EDITIONS[p.craft].map((e,i)=>'<button type="button" class="fleetEdition'+(selected===i?' selected':'')+'" data-fleet-edition="'+i+'" aria-pressed="'+(selected===i)+'"><span class="editionSwatches"><i style="background:'+hex(e.body)+'"></i><i style="background:'+hex(e.secondary)+'"></i><i style="background:'+hex(e.accent)+'"></i></span><strong>'+e.name+'</strong><small>'+fleetFinishLabel(p.craft,{edition:i})+'</small></button>').join('');
 $('#garageNote').textContent='Your selected ship and edition save automatically.';
}
$('#fleetShips').addEventListener('click',e=>{const b=e.target.closest('[data-fleet-ship]');if(!b)return;updateBuild(p=>selectShip(p,+b.dataset.fleetShip));});
$('#garageOptionRail').addEventListener('click',e=>{const b=e.target.closest('[data-fleet-edition]');if(!b)return;updateBuild(p=>equipEdition(p,+b.dataset.fleetEdition));});
$('#garageLighting').addEventListener('click',e=>{const b=e.target.closest('[data-garage-light]');if(!b)return;document.querySelectorAll('[data-garage-light]').forEach(item=>item.setAttribute('aria-pressed',String(item===b)));window.dispatchEvent(new CustomEvent('shiftline-garage-light',{detail:{mode:b.dataset.garageLight}}));});

showScreen();

function renderMastery(p,course){const m=masteryState(p),count=masteryCount(p);$('#masterySummary').textContent='PILOT MASTERY / '+count+' OF 24';$('#trackMastery').textContent='MASTERY '+MASTERY_GOALS.filter(g=>m.courses[course]?.goals?.[g.id]).length+'/4 · '+(MASTERY_GOALS.find(g=>!m.courses[course]?.goals?.[g.id])?.rule||'COURSE MASTERED');const list=$('#masteryCourses');list.replaceChildren();for(let id=1;id<=6;id++){const c=m.courses[id]||{},card=document.createElement('div'),title=document.createElement('b');card.className='masteryCourse';title.textContent=TRACKS[id].name;card.append(title);for(const goal of MASTERY_GOALS){const row=document.createElement('p');row.className=c.goals?.[goal.id]?'earned':'';row.textContent=(c.goals?.[goal.id]?'✓ ':'○ ')+goal.name+' / '+goal.rule+(goal.id==='fleet'?' ('+(c.ships?.length||0)+'/3)':'');card.append(row);}list.append(card);}const select=$('#masteryTitle');select.replaceChildren();for(const title of availableTitles(p)){const option=document.createElement('option');option.value=option.textContent=title.name;select.append(option);}select.value=pilotTitle(p);}
$('#masteryTitle').onchange=()=>{const p=readProgress();if(equipTitle(p,$('#masteryTitle').value)){const saved=saveProgress(p);$('#masterySave').textContent=saved?'TITLE EQUIPPED':'SAVE UNAVAILABLE';refresh();}};
