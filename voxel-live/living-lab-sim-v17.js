// REALITY ENGINE / LIVING LAB V1
// Autonomous civilisation simulation and in-game observatory.
// Designed to mount alongside an existing Reality Engine Three.js runtime.
export function mountLivingLab(root, resume=null) {
  const stage=root.querySelector('#vxStage');
  if(!stage)throw Error('Living Lab needs the Reality Engine stage');
  const KEY='reality-engine-living-lab-v1';
  const W=24,H=18,N=W*H,DAY_MS=1600;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fmt=n=>Math.round(n).toLocaleString('en-GB');
  const rngSeed=(seed)=>()=>{seed=(Math.imul(1664525,seed)+1013904223)|0;return (seed>>>0)/4294967296;};
  let random=rngSeed(167423),alive=true,open=false,selected=0,acc=0,last=performance.now(),lastSave=last,lastPaint=0;
  const habitats=['Dawn Basin','Glass Marsh','Vale Reach','North Ridge','Windward','Pale Estuary','Crater Hollow','Sunfall'];
  const culture=['Explorers','Builders','Scholars','Foragers','Mediators','Inventors'];
  const experiments=[
    ['energy','⚡ New energy'],['rains','🌧 Rainfall'],['mineral','💎 Rich minerals'],
    ['disaster','☄ Meteor strike'],['migration','🧭 Migration'],['peace','🕊 Peace treaty'],
    ['fertility','🌿 Fertile land'],['isolation','🌀 Isolate region']
  ];
  const makeTile=(x,y)=>{
    const a=Math.sin(x*.65+y*.38)*.37+Math.cos(y*.61-x*.22)*.23+random()*.4;
    const water=a<-.15,forest=a>.12&&random()>.3;
    return {x,y,water,forest,height:a,fertility:clamp(.26+random()*.55+(forest?.17:0),.08,1),
      ore:clamp(random()*.8+(a>.4?.2:0),0,1),energy:0,food:clamp(random()*4,0,8),hazard:0,building:0,discovered:false};
  };
  const tiles=Array.from({length:N},(_,i)=>makeTile(i%W,Math.floor(i/W)));
  function locIndex(x,y){return clamp(Math.round(y),0,H-1)*W+clamp(Math.round(x),0,W-1)}
  const sectors=habitats.map((name,i)=>{
    const x=3+(i%4)*6+(random()-.5)*1.5,y=4+Math.floor(i/4)*8+(random()-.5)*2;
    const t=locIndex(x,y);
    tiles[t].water=false;tiles[t].fertility=Math.max(tiles[t].fertility,.6);
    return {id:i,name,x:Math.round(x),y:Math.round(y),stock:{food:24+random()*18,ore:10+random()*16,power:5+random()*5},
      housing:25,research:0,trust:.58+random()*.21,prosperity:.42,tech:0,structures:3,climate:0,faction:i%3,production:0};
  });
  const state={day:0,year:1,speed:1,paused:false,epoch:0,revision:0,eventsSeen:[],people:[],tiles,sectors,log:[],discovery:[],weather:'clear'};
  const namesA=['Ari','Niko','Sol','Mira','Tala','Ryn','Ivo','Ena','Kira','Vale','Eli','Zia','Oren','Luma','Sera','Kael','Nia','Dax'];
  const namesB=['Arden','Voss','Soren','Rune','Moss','Hale','Cairn','Orion','Wren','Vega','Ash','Lowen','Quill','Stone'];
  let nextId=1;
  function sectorAt(x,y){let best=0,bd=Infinity;for(const s of state.sectors){const d=(s.x-x)**2+(s.y-y)**2;if(d<bd){best=s.id;bd=d}}return best}
  function newCitizen(sId,age=18+Math.floor(random()*41)){
    const s=state.sectors[sId],id=nextId++;
    return {id,name:namesA[Math.floor(random()*namesA.length)]+' '+namesB[Math.floor(random()*namesB.length)],
      sector:sId,x:s.x+(random()-.5)*3,y:s.y+(random()-.5)*3,age,health:.55+random()*.45,
      hunger:.2+random()*.4,energy:.45+random()*.55,wealth:2+random()*12,trust:.35+random()*.55,
      skill:Math.floor(random()*6),drive:.3+random()*.7,learning:random()*.16,affinity:Math.floor(random()*6),
      job:random()>.75?'research':'work',days:0};
  }
  for(let i=0;i<125;i++)state.people.push(newCitizen(i%sectors.length));
  function emit(message,type='world'){state.log.unshift({day:state.day,text:message,type});if(state.log.length>95)state.log.length=95}
  emit('Eight settlements establish the first interlinked society.','founding');
  emit('125 independent residents begin working, trading and exploring.','founding');
  let persisted=null;
  try{persisted=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
  const prior=resume?.livingLab||persisted;
  if(prior&&typeof prior==='object'&&Array.isArray(prior.people)&&prior.people.length){
    try{
      state.day=clamp(+prior.day||0,0,999999);state.year=1+Math.floor(state.day/365);
      state.speed=[0,1,3,10,30].includes(+prior.speed)?+prior.speed:1;state.paused=!!prior.paused;
      state.epoch=+prior.epoch||0;state.revision=+prior.revision||0;
      state.eventsSeen=Array.isArray(prior.eventsSeen)?prior.eventsSeen.slice(-300):[];
      state.people=prior.people.slice(0,500).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
      if(Array.isArray(prior.sectors)&&prior.sectors.length===8)for(let i=0;i<8;i++)Object.assign(state.sectors[i],prior.sectors[i]);
      if(Array.isArray(prior.tiles)&&prior.tiles.length===N)for(let i=0;i<N;i++)Object.assign(state.tiles[i],prior.tiles[i]);
      state.log=Array.isArray(prior.log)?prior.log.slice(0,95):state.log;
      state.discovery=Array.isArray(prior.discovery)?prior.discovery.slice(0,80):[];
      state.weather=prior.weather||'clear';
      nextId=Math.max(1,...state.people.map(p=>+p.id||0))+1;
      emit('Living Lab world restored from saved history.','system');
    }catch(e){emit('Previous world save was unreadable; using a fresh simulation.','system')}
  }
  if(prior?.savedAt&&state.speed>0&&!state.paused){
    const elapsed=clamp((Date.now()-Number(prior.savedAt))/1000,0,1800);
    state.pendingDays=Math.min(180,Math.floor(elapsed*state.speed/DAY_MS*1000));
  }
  const shell=document.createElement('div');
  shell.className='ll-shell';
  shell.innerHTML='<style>'+
  '.ll-shell{position:absolute;z-index:22;inset:0;pointer-events:none;font:11px/1.35 system-ui,-apple-system,sans-serif;color:#e9fdf5}'+
  '.ll-shell *{box-sizing:border-box}.ll-shell button{font:inherit;color:#e7fff6;background:#14404a;border:1px solid #5a9b86;border-radius:7px;padding:7px;cursor:pointer;touch-action:manipulation}'+
  '.ll-toggle{position:absolute;top:163px;right:8px;z-index:1;pointer-events:auto;background:#163d4eea!important;border-color:#87e6bf!important;font-weight:800!important;box-shadow:0 4px 16px #001a}'+
  '.ll-panel{position:absolute;inset:8px;z-index:2;pointer-events:auto;display:none;overflow:auto;background:linear-gradient(150deg,#102b38f9,#091a29f9);border:1px solid #85ddc1;border-radius:12px;box-shadow:0 10px 40px #000c;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:10px}'+
  '.ll-panel.ll-open{display:block}.ll-top{display:flex;align-items:center;justify-content:space-between;gap:5px;margin-bottom:7px}.ll-top b{letter-spacing:1.3px;color:#c0ffda;font-size:13px}'+
  '.ll-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.ll-controls button{min-width:0;padding:7px 3px;font-size:10px;font-weight:750}'+
  '.ll-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin:9px 0}.ll-stat{background:#133442;border:1px solid #355d63;border-radius:7px;padding:6px 4px;text-align:center;font:9px ui-monospace,monospace}.ll-stat strong{display:block;font-size:16px;color:#a7f5d2}'+
  '.ll-map{display:block;width:100%;height:200px;touch-action:manipulation;border:1px solid #4d8280;border-radius:8px;background:#0b2733}'+
  '.ll-row{display:flex;justify-content:space-between;align-items:center;gap:5px;margin:7px 0}.ll-row b{font-size:11px;color:#b9f9dc}'+
  '.ll-experiments{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}.ll-experiments button{font-size:9px;padding:6px 2px;line-height:1.25;min-height:36px}'+
  '.ll-ledger{border:1px solid #365865;background:#071f2d;border-radius:8px;padding:7px;max-height:105px;overflow:auto;color:#adc9c8;font:10px/1.48 ui-monospace,monospace}.ll-event{margin-bottom:4px}'+
  '.ll-info{font:10px/1.45 ui-monospace,monospace;color:#91bdbb;margin:5px 0}.ll-pill{color:#a6f9d4;background:#1b5144;border-radius:5px;padding:3px 6px}'+
  '</style>'+
  '<button class="ll-toggle" data-toggle>🧬 LIVING LAB</button>'+
  '<div class="ll-panel" data-panel>'+
  '<div class="ll-top"><b>◈ LIVING LAB · V1</b><button data-close>✕ BACK TO WORLD</button></div>'+
  '<div class="ll-controls"><button data-pause>⏸ PAUSE</button><button data-speed>1× TIME</button><button data-view>◉ RESIDENTS</button><button data-save>▣ SAVE</button></div>'+
  '<div class="ll-stats"><div class="ll-stat">POPULATION<strong data-pop>125</strong></div><div class="ll-stat">SETTLEMENTS<strong data-towns>8</strong></div><div class="ll-stat">TECH INDEX<strong data-tech>0</strong></div><div class="ll-stat">YEAR<strong data-year>1</strong></div></div>'+
  '<canvas class="ll-map" data-map aria-label="Living civilisation interactive map"></canvas>'+
  '<div class="ll-row"><b data-sector>REGION</b><span class="ll-pill" data-day>DAY 0</span></div>'+
  '<div class="ll-info" data-info>Tap a region on the map to inspect it.</div>'+
  '<div class="ll-row"><b>CHANGE THE RULES</b><span class="ll-pill" data-cloud>LOCAL ENGINE</span></div>'+
  '<div class="ll-experiments">'+experiments.map((x,i)=>'<button data-experiment="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
  '<div class="ll-row"><b>EMERGENT WORLD HISTORY</b><span class="ll-pill" data-live>LIVE</span></div>'+
  '<div class="ll-ledger" data-ledger></div>'+
  '<div class="ll-info">Autonomous needs, migration, resource use, inventions and social trust. Time passes while the widget runs; capped offline catch-up occurs when reopened. No server simulation is claimed.</div>'+
  '</div>';
  stage.appendChild(shell);
  const el=name=>shell.querySelector('[data-'+name+']');
  const panel=el('panel'),canvas=el('map'),ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw Error('Canvas 2D unavailable for civilisation observatory');
  let view='residents';
  const speedList=[1,3,10,30];
  function save(){
    const copy={day:state.day,speed:state.speed,paused:state.paused,epoch:state.epoch,revision:state.revision,eventsSeen:state.eventsSeen,
      people:state.people,sectors:state.sectors,tiles:state.tiles,log:state.log,discovery:state.discovery,weather:state.weather,savedAt:Date.now()};
    try{localStorage.setItem(KEY,JSON.stringify(copy))}catch(e){}
    return copy;
  }
  function citizenStep(p,heads){
    const s=state.sectors[p.sector]||state.sectors[0];
    p.age+=1/365;p.days++;
    p.hunger=clamp(p.hunger+.045+random()*.015,0,1);
    p.energy=clamp(p.energy-.017,0,1);
    const workScore=p.energy*.45+p.drive*.3+(s.stock.food<10?.25:0);
    const restScore=(1-p.energy)*.9;
    const eatScore=p.hunger*.95;
    const migrateScore=(1-s.trust)*.43+(s.stock.food<5?.38:0);
    const studyScore=p.skill===4||p.skill===5?p.learning+p.drive*.6:.12;
    const choice=Math.max(workScore,restScore,eatScore,migrateScore,studyScore);
    if(choice===eatScore&&s.stock.food>.12){s.stock.food-=.2;p.hunger=clamp(p.hunger-.49,0,1);p.health=clamp(p.health+.008,0,1)}
    else if(choice===restScore){p.energy=clamp(p.energy+.28,0,1);p.health=clamp(p.health+.003,0,1)}
    else if(choice===migrateScore&&random()<.12){
      const target=state.sectors[(p.sector+1+Math.floor(random()*7))%8];
      if(target.stock.food>s.stock.food*.75||target.trust>s.trust+.1){p.sector=target.id;p.x=target.x+(random()-.5)*2;p.y=target.y+(random()-.5)*2;heads.migrants++}
    }else if(choice===studyScore&&s.stock.food>1){
      s.research+=.16+p.drive*.22;p.learning=clamp(p.learning+.002,0,1);
    }else{
      p.energy=clamp(p.energy-.025,0,1);p.wealth+=.06+p.drive*.12;
      if(p.skill===0||p.skill===1){s.stock.food+=.27+state.tiles[locIndex(p.x,p.y)].fertility*.3;heads.food++}
      else if(p.skill===2){s.stock.ore+=.17+state.tiles[locIndex(p.x,p.y)].ore*.2}
      else if(p.skill===3){s.stock.power+=.13+state.tiles[locIndex(p.x,p.y)].energy*.21}
      else {s.research+=.11+p.drive*.16}
      if(random()<.11){p.x=clamp(p.x+(random()-.5)*1.9,s.x-2.3,s.x+2.3);p.y=clamp(p.y+(random()-.5)*1.9,s.y-2.3,s.y+2.3)}
    }
    if(p.hunger>.94){p.health-=.045;p.trust-=.012}
    if(s.climate>0){p.health-=s.climate*.004;p.trust-=s.climate*.003}
    if(p.health<.17||p.age>83+random()*20)return false;
    return true;
  }
  function step(){
    state.day++;state.year=1+Math.floor(state.day/365);
    let heads={migrants:0,food:0};
    const survivors=[];
    for(const p of state.people)if(citizenStep(p,heads))survivors.push(p);
    state.people=survivors;
    let births=0,innovations=0;
    for(const s of state.sectors){
      const citizens=state.people.filter(p=>p.sector===s.id);
      const total=citizens.length;
      const t=state.tiles[locIndex(s.x,s.y)];
      const harvest=(.9+t.fertility*1.4+(s.tech*.13))*(1-s.climate*.07);
      s.stock.food=clamp(s.stock.food+harvest-total*.035,0,400);
      s.stock.power=clamp(s.stock.power+.3+s.tech*.14-total*.025,0,400);
      s.stock.ore=clamp(s.stock.ore+(.15+t.ore*.3)-s.structures*.018,0,300);
      s.trust=clamp(s.trust+(s.stock.food>total*.4?.001:-.008)+((s.faction===0)?.0005:0),0,1);
      s.prosperity=clamp((s.stock.food/80+s.stock.power/60+s.trust)/3,0,1);
      if(s.research>=15+s.tech*11&&s.tech<18){
        s.research=0;s.tech++;innovations++;
        const topics=['water filtration','solar storage','wind-powered farming','alloy tools','community education','regional navigation','crop selection','adaptive habitats'];
        const topic=topics[(s.tech+Math.floor(random()*topics.length))%topics.length];
        emit(s.name+' develops '+topic+' (technology '+s.tech+').','research');
        state.discovery.push({day:state.day,sector:s.id,technology:topic});
      }
      if(total>s.housing*.84&&s.stock.ore>6&&s.stock.power>4){
        s.housing+=6;s.structures++;s.stock.ore-=6;s.stock.power-=4;t.building++;
        if(random()<.05)emit(s.name+' expands with a new neighbourhood.','build');
      }
      if(total<s.housing*.86&&s.stock.food>total*.4&&s.trust>.38&&random()<.0025){
        const a=citizens[Math.floor(random()*citizens.length)];
        if(a&&a.age>19&&a.age<59){
          const child=newCitizen(s.id,0);child.name=namesA[Math.floor(random()*namesA.length)]+' '+a.name.split(' ')[1];
          state.people.push(child);births++;
        }
      }
      s.climate=clamp(s.climate-.002,0,1);
    }
    if(state.people.length<75&&state.day%10===0)state.people.push(newCitizen(Math.floor(random()*8),18+Math.floor(random()*22)));
    if(state.people.length>450)state.people.length=450;
    if(state.day%18===0&&heads.migrants>0)emit(heads.migrants+' residents relocated in search of resources.','migration');
    if(state.day%90===0){emit('Census: '+state.people.length+' citizens; '+state.sectors.reduce((a,s)=>a+s.tech,0)+' cumulative technology levels.','census')}
    if(state.day%130===0&&random()<.36){
      const s=state.sectors[Math.floor(random()*8)];s.trust=clamp(s.trust+.2,0,1);
      emit('An unexpected cultural movement takes hold in '+s.name+'.','society');
    }
    if(births&&state.day%8===0)emit('New households form as settlements grow.','population');
    if(innovations&&state.day%17===0)emit('New discoveries accelerate trade between regions.','research');
  }
  function experiment(action,remote=false){
    const s=state.sectors[selected],tile=state.tiles[locIndex(s.x,s.y)];
    if(action==='energy'){tile.energy=clamp(tile.energy+.5,0,1);s.stock.power+=20;emit('Unknown energy source appears near '+s.name+'. Its engineers begin testing it.','experiment')}
    if(action==='rains'){for(const t of state.tiles)t.fertility=clamp(t.fertility+.06,0,1);state.weather='rain';emit('Unseasonal rainfall changes farming conditions across the continent.','climate')}
    if(action==='mineral'){tile.ore=1;s.stock.ore+=28;emit('Geologists discover a highly concentrated mineral seam in '+s.name+'.','experiment')}
    if(action==='disaster'){s.stock.food*=.52;s.stock.power*=.35;s.climate=clamp(s.climate+.5,0,1);s.trust=clamp(s.trust-.2,0,1);emit('Meteor strikes '+s.name+'; nearby towns confront resource shortages.','disaster')}
    if(action==='migration'){let moved=0;for(const p of state.people){if(p.sector!==s.id&&random()<.18){p.sector=s.id;p.x=s.x+(random()-.5)*2;p.y=s.y+(random()-.5)*2;moved++}}emit(moved+' residents arrive at '+s.name+' in an unexpected migration wave.','migration')}
    if(action==='peace'){for(const d of state.sectors)d.trust=clamp(d.trust+.12,0,1);emit('Representatives negotiate regional cooperation and resource exchanges.','society')}
    if(action==='fertility'){for(const y of [s.y-1,s.y,s.y+1])for(const x of [s.x-1,s.x,s.x+1]){const t=state.tiles[locIndex(x,y)];t.fertility=1;t.water=false}emit('Experimental soil regeneration transforms agriculture near '+s.name+'.','experiment')}
    if(action==='isolation'){s.trust=clamp(s.trust-.27,0,1);s.climate=clamp(s.climate+.07,0,1);emit(s.name+' becomes isolated; its residents attempt to adapt autonomously.','experiment')}
    state.epoch++;
    if(open)refresh();
  }
  let mutationTimer=null;
  const MUTATION='https://cdn.jsdelivr.net/gh/Jacko952508/shiftline-cloudflare@nimbus-chat-live/voxel-live/living-lab-events.json';
  async function pollMutations(){
    try{
      const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),6500);
      let result;
      try{result=await fetch(MUTATION+'?t='+Date.now(),{signal:ctrl.signal,cache:'no-store'}).finally(()=>clearTimeout(timer))}
      catch(e){throw e}
      if(!result.ok)throw Error('Remote events HTTP '+result.status);
      const data=await result.json();
      if(data.schema!=='reality.living-lab/events/1'||!Array.isArray(data.events))throw Error('Remote event schema mismatch');
      let applied=0;
      for(const e of data.events){
        if(!e||typeof e.id!=='string'||state.eventsSeen.includes(e.id))continue;
        if(experiments.some(x=>x[0]===e.action)){
          if(Number.isInteger(e.sector)&&e.sector>=0&&e.sector<8)selected=e.sector;
          experiment(e.action,true);applied++;
        }
        state.eventsSeen.push(e.id);
      }
      state.eventsSeen=state.eventsSeen.slice(-300);
      el('cloud').textContent='GITHUB CONNECTED'+(applied?' +'+applied:'');
      if(applied)save();
    }catch(e){el('cloud').textContent='LOCAL MODE · GITHUB QUEUED'}
  }
  function draw(){
    const dpr=Math.min(2,window.devicePixelRatio||1),rect=canvas.getBoundingClientRect();
    const cw=Math.max(200,Math.floor(rect.width)),ch=200;
    if(canvas.width!==Math.round(cw*dpr)||canvas.height!==Math.round(ch*dpr)){
      canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const dx=cw/W,dy=ch/H;
    for(let i=0;i<N;i++){
      const t=state.tiles[i];
      const base=t.water?'#174963':t.hazard>0?'#624344':t.forest?'#286455':t.fertility>.65?'#507d56':'#79765a';
      ctx.fillStyle=base;ctx.fillRect(t.x*dx,t.y*dy,Math.ceil(dx+.25),Math.ceil(dy+.25));
      if(view==='resources'){
        ctx.fillStyle=t.ore>.6?'#d1c29e':'#68ba9e';
        ctx.globalAlpha=Math.max(.08,t.ore);ctx.fillRect(t.x*dx+2,t.y*dy+2,dx-4,dy-4);ctx.globalAlpha=1;
      }
    }
    for(const s of state.sectors){
      const count=state.people.filter(p=>p.sector===s.id).length;
      const x=(s.x+.5)*dx,y=(s.y+.5)*dy;
      ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.arc(x,y,10+count*.12,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=s.id===selected?'#e7ff9b':'#9bf3d1';ctx.lineWidth=s.id===selected?2.7:1.3;
      ctx.beginPath();ctx.arc(x,y,6+Math.min(16,count*.27),0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#fff2c5';ctx.fillRect(x-2.5,y-2.5,5,5);
      ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillStyle='#eafff7';ctx.fillText(s.name,x,y-13-Math.min(12,count*.18));
    }
    if(view==='residents'){
      for(const p of state.people){
        ctx.fillStyle=culture[p.affinity%6]&&p.skill>=4?'#f0cefa':'#a7efc7';
        ctx.beginPath();ctx.arc((p.x+.5)*dx,(p.y+.5)*dy,1.35,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.textAlign='left';ctx.fillStyle='rgba(3,19,28,.85)';ctx.fillRect(4,ch-18,108,15);
    ctx.fillStyle='#dfffea';ctx.font='10px system-ui';ctx.fillText(view==='residents'?'◉ ACTIVE RESIDENTS':'◈ ORE DISTRIBUTION',9,ch-7);
  }
  function refresh(){
    el('pop').textContent=fmt(state.people.length);
    el('towns').textContent='8';
    el('tech').textContent=fmt(state.sectors.reduce((a,s)=>a+s.tech,0));
    el('year').textContent=fmt(state.year);
    el('pause').textContent=state.paused?'▶ RESUME':'⏸ PAUSE';
    el('speed').textContent=state.speed+'× TIME';
    el('view').textContent=view==='residents'?'◉ RESIDENTS':'◈ RESOURCES';
    el('day').textContent='DAY '+fmt(state.day);
    const s=state.sectors[selected],n=state.people.filter(p=>p.sector===s.id).length;
    el('sector').textContent=s.name.toUpperCase();
    el('info').textContent='Population '+n+' · trust '+Math.round(s.trust*100)+'% · food '+fmt(s.stock.food)+' · ore '+fmt(s.stock.ore)+' · power '+fmt(s.stock.power)+' · tech '+s.tech+' · housing '+s.housing;
    el('ledger').innerHTML=state.log.slice(0,16).map(x=>'<div class="ll-event"><span style="color:#85dac3">Y'+(1+Math.floor(x.day/365))+' D'+(x.day%365)+'</span> · '+String(x.text).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</div>').join('');
    draw();
  }
  const toggle=()=>{open=!open;panel.classList.toggle('ll-open',open);el('toggle').style.display=open?'none':'block';if(open)refresh()};
  el('toggle').onclick=toggle;el('close').onclick=toggle;
  el('pause').onclick=()=>{state.paused=!state.paused;refresh()};
  el('speed').onclick=()=>{state.speed=speedList[(speedList.indexOf(state.speed)+1)%speedList.length];refresh()};
  el('view').onclick=()=>{view=view==='residents'?'resources':'residents';refresh()};
  el('save').onclick=()=>{save();emit('Simulation saved locally.','system');refresh()};
  panel.addEventListener('click',e=>{const b=e.target.closest('button[data-experiment]');if(b)experiment(b.dataset.experiment)});
  canvas.addEventListener('click',e=>{
    const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;
    selected=sectorAt(x,y);refresh();
  });
  if(state.pendingDays){for(let j=0;j<state.pendingDays;j++)step();emit('Offline elapsed time reconciled ('+state.pendingDays+' simulated days, capped).','system');state.pendingDays=0}
  refresh();
  function frame(now){
    if(!alive||!root.isConnected)return;
    const elapsed=Math.min(5000,now-last);last=now;
    if(!state.paused){
      acc+=elapsed*state.speed;
      let count=0;
      while(acc>=DAY_MS&&count<30){step();acc-=DAY_MS;count++}
    }
    if(now-lastSave>11000){lastSave=now;save()}
    if(open&&now-lastPaint>550){lastPaint=now;refresh()}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  pollMutations();
  mutationTimer=setInterval(pollMutations,30000);
  return {
    snapshot(){return save()},
    dispose(){alive=false;if(mutationTimer)clearInterval(mutationTimer);save();shell.remove()},
    experiment,
    getState(){return state},
    getSelected(){return selected},
    setSelected(n){selected=clamp(Math.floor(n),0,7);if(open)refresh()},
    isOpen(){return open},
    open(){if(!open)toggle()},
    close(){if(open)toggle()}
  };
}
