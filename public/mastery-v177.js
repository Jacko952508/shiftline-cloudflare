export const MASTERY_GOALS=Object.freeze([
 {id:'sectors',name:'SECTOR SWEEP',rule:'Finish all four sectors without an impact.'},
 {id:'precision',name:'PRECISION PILOT',rule:'Thread three tight rings in one full race.'},
 {id:'boost',name:'BOOST CONTROL',rule:'Clear six gates while boosting, with no crashes.'},
 {id:'fleet',name:'FLEET EXPLORER',rule:'Finish this course in three different ships.'}
]);
export const MASTERY_TITLES=Object.freeze([{name:'AUTO',label:'XP RANK',stamps:0},{name:'NAVIGATOR',stamps:6},{name:'ACE',stamps:12},{name:'MASTER',stamps:18},{name:'LEGEND',stamps:24}]);
export function masteryState(p){const state=p.mastery177;if(!state||typeof state!=='object'||Array.isArray(state))p.mastery177={courses:{},title:'AUTO'};const m=p.mastery177;m.courses??={};return m;}
export function masteryCount(p){const m=masteryState(p);let n=0;for(let c=1;c<=6;c++)for(const g of MASTERY_GOALS)if(m.courses[c]?.goals?.[g.id])n++;return n;}
export function availableTitles(p){const count=masteryCount(p);return MASTERY_TITLES.filter(t=>count>=t.stamps);}
export function equippedTitle(p){const m=masteryState(p);return availableTitles(p).some(t=>t.name===m.title)?m.title:'AUTO';}
export function pilotTitle(p){const title=equippedTitle(p);return title==='AUTO'?(p.xp>=3000?'ELITE':p.xp>=1500?'ACE':p.xp>=500?'CONTENDER':'ROOKIE'):title;}
export function equipTitle(p,title){if(!availableTitles(p).some(t=>t.name===title))return false;masteryState(p).title=title;return true;}
export function awardMastery(p,run){const {course,mode,variant,ship,completed,crashes,precision=0,boostedPasses=0}=run;if(mode!=='solo'||!['race','trial'].includes(variant)||!Number.isInteger(course)||course<1||course>6||!Number.isInteger(ship)||ship<0||ship>5||!completed||completed.length!==4||!completed.every((s,i)=>s.index===i&&Number.isFinite(s.ms)&&s.ms>0))return {earned:[],xp:0,titles:[]};const before=availableTitles(p).map(t=>t.name),m=masteryState(p),c=m.courses[course]??={goals:{},ships:[]};c.goals??={};c.ships=Array.isArray(c.ships)?[...new Set(c.ships.filter(n=>Number.isInteger(n)&&n>=0&&n<6))]:[];if(!c.ships.includes(ship))c.ships.push(ship);const criteria={sectors:crashes===0&&completed.every(s=>s.clean),precision:precision>=3,boost:crashes===0&&boostedPasses>=6,fleet:c.ships.length>=3},earned=[];for(const g of MASTERY_GOALS)if(criteria[g.id]&&!c.goals[g.id]){c.goals[g.id]=true;earned.push(g.name);}const xp=earned.length*100;p.xp=(p.xp||0)+xp;const titles=availableTitles(p).filter(t=>!before.includes(t.name)).map(t=>t.name);return{earned,xp,titles};}
