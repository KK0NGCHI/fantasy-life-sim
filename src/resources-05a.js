import {RESOURCE_BALANCE_ROWS_05A} from './balance-resources-05a.js';
/** 05-A resource catalogue; content candidate values are not final economy balance.
 * Resource origin and properties are independent; do not infer cosmic provenance from region. */
export const RESOURCES_05A=Object.freeze(RESOURCE_BALANCE_ROWS_05A.map(([key,name,activity,region,capacity,regenDays,xp])=>
 Object.freeze({id:'resource05a:'+key,name,activity,region,capacity,regenDays,xp,itemId:'item05a:'+key,
 materialOrigin:'mundane',traits:Object.freeze([])})));
export const RESOURCE_MAP_05A=new Map(RESOURCES_05A.map(r=>[r.id,r]));
export function createResourceNodes05A(){
 const counts={'wild-herb':18,mushroom:12,grass:20,'oak-log':18,'pine-log':14,stone:6,coal:3,'copper-ore':4,'iron-ore':3,'small-fish':3,carp:3,trout:3};
 return Object.fromEntries(RESOURCES_05A.flatMap(r=>Array.from({length:counts[r.id.split(':')[1]]},(_,i)=>{
  const id=r.id+':'+String(i+1).padStart(2,'0');
  return [id,{resourceId:r.id,remaining:r.capacity,progress:0,lastSecond:0,recoveryProgress:0,discovered:i<2,cycle:0}];
 })));
}
const DAY=86400,SEASON_SECONDS=28*DAY,YEAR_SECONDS=4*SEASON_SECONDS;
export const RESOURCE_CALENDAR_05A=Object.freeze({schema:1,daysPerSeason:28,seasons:['spring','summer','autumn','winter']});
const activeSeasons=(def)=>def.activity==='fishing'||def.activity==='mining'?[0,1,2,3]:
 def.id==='resource05a:mushroom'?[0,1,2]:[0,1,2];
/** Active seconds between two elapsed-second instants, including season boundaries.
 * Uses closed-form years; no loops over skipped days or real wall-clock time. */
export function activeResourceSeconds05A(def,from,to){
 if(!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<0||to<from)throw Error('INVALID_SEASON_TIME');
 const seasons=activeSeasons(def);
 const until=t=>{
  const absolute=t+28800; // Day 1 starts at 08:00:00
  const years=Math.floor(absolute/YEAR_SECONDS),partial=absolute%YEAR_SECONDS;
  return years*seasons.length*SEASON_SECONDS+
   seasons.reduce((sum,i)=>sum+Math.max(0,Math.min(SEASON_SECONDS,partial-i*SEASON_SECONDS)),0);
 };
 return until(to)-until(from);
}
export function resourceAt05A(node,definition,seconds){
 if(!node||!definition||!Number.isSafeInteger(seconds)||seconds<node.lastSecond)throw Error('INVALID_RESOURCE_TIME');
 const next={...node},elapsed=activeResourceSeconds05A(definition,next.lastSecond,seconds);
 const step=definition.regenDays*DAY;
 if(step>0&&next.remaining<definition.capacity){
  const total=(next.recoveryProgress??0)+elapsed;
  const units=Math.floor(total/step);
  next.recoveryProgress=total%step;
  if(definition.activity==='logging'||definition.id==='resource05a:stone'){
   if(units>0&&next.remaining===0){next.remaining=definition.capacity;next.progress=0;next.cycle=(next.cycle??0)+1;
    next.recoveryProgress=0;}
  }else if(units>0&&definition.activity!=='logging'&&definition.id!=='resource05a:stone')next.remaining=Math.min(definition.capacity,next.remaining+units);
 }else if(next.remaining>=definition.capacity)next.recoveryProgress=0;
 next.lastSecond=seconds;
 return next;
}
/** Only the manually valid short gather cycle is live in this first slice.
 * Other activities remain catalogue definitions until multi-step progress,
 * gear, season and population simulation have test coverage. */
export function gatherResource05A(nodes,nodeId,region,seconds){
 const node=nodes?.[nodeId],resource=RESOURCE_MAP_05A.get(node?.resourceId);
 if(!resource||resource.activity!=='gather'||resource.region!==region)return {ok:false,reason:'NOT_GATHERABLE'};
 if(!node.discovered)return {ok:false,reason:'UNDISCOVERED'};
 const current=resourceAt05A(node,resource,seconds);
 if(current.remaining<1)return {ok:false,reason:'DEPLETED'};
 return {ok:true,resource,node:{...current,remaining:current.remaining-1,lastSecond:seconds,recoveryProgress:0}};
}

/** 05-A engine work contract. An action advances one bounded piece of real work.
 * Outputs are only granted after completion/catch. No cosmetic fake rewards. */
export const RESOURCE_TOOL_KINDS=Object.freeze({
 gather:null,logging:'axe',mining:'pickaxe',fishing:'rod'
});
export const RESOURCE_TOOL_RANK=Object.freeze({
 stone:1,copper:2,iron:3,steel:4,wood:1,processedWood:2,reinforcedWood:3
});
export function workDuration05A(activity,roll){
 const bases={gather:50,logging:65,mining:70,fishing:60};
 const spreads={gather:5,logging:10,mining:10,fishing:10};
 if(!Object.hasOwn(bases,activity)||typeof roll!=='number'||roll<0||roll>=1)throw Error('INVALID_WORK_DURATION');
 // Triangular centered duration, driven by the authoritative action RNG value.
 // Deterministic and rounded, with no real-time waiting.
 const shape=roll<0.5?Math.sqrt(2*roll)-1:1-Math.sqrt(2-2*roll);
 return bases[activity]+Math.round(spreads[activity]*shape);
}
export function minimumToolRank05A(definition){
 if(definition.activity==='mining'&&definition.id==='resource05a:iron-ore')return 2;
 return definition.activity==='gather'?0:1;
}
export function workResource05A(nodes,nodeId,region,seconds,{toolKind=null,toolRank=0,outcomeRoll=0.5}={}){
 const node=nodes?.[nodeId],def=RESOURCE_MAP_05A.get(node?.resourceId);
 if(!def||def.region!==region)return {ok:false,reason:'WRONG_RESOURCE_REGION'};
 if(!node.discovered)return {ok:false,reason:'UNDISCOVERED'};
 const needKind=RESOURCE_TOOL_KINDS[def.activity];
 if(needKind!==null&&(toolKind!==needKind||toolRank<minimumToolRank05A(def)))return {ok:false,reason:'TOOL_REQUIRED'};
 if(typeof outcomeRoll!=='number'||outcomeRoll<0||outcomeRoll>=1)return {ok:false,reason:'INVALID_RANDOM_DRAW'};
 const current=resourceAt05A(node,def,seconds);
 if(current.remaining===0)return {ok:false,reason:'DEPLETED'};
 const changes={...current};
 let qty=0,earned=0,progress=changes.progress??0;
 if(def.activity==='gather'){
  qty=1;earned=def.xp;changes.remaining--;
 }else if(def.activity==='logging'){
  // Wood is recovered only upon completion of a tree, then the site is a stump.
  const threshold=def.id==='resource05a:oak-log'?42:36;
  progress+=Math.max(1,toolRank);
  if(progress>=threshold){qty=changes.remaining;earned=def.xp;progress=0;changes.remaining=0;}
 }else if(def.activity==='mining'){
  const perOre={'resource05a:stone':9,'resource05a:coal':14,'resource05a:copper-ore':16,'resource05a:iron-ore':20};
  progress+=Math.max(1,toolRank);
  if(progress>=perOre[def.id]){progress-=perOre[def.id];qty=1;earned=def.xp;changes.remaining--;}
 }else if(def.activity==='fishing'){
  const catchChance={'resource05a:small-fish':0.08,'resource05a:carp':0.065,'resource05a:trout':0.05};
  if(outcomeRoll<catchChance[def.id]){qty=1;earned=def.xp;changes.remaining--;}
 }
 changes.progress=progress;
 // A successful harvest resets the per-node recovery timer. Work progress on
 // non-harvest attempts is retained, but does not reset recovery.
 if(qty>0){changes.lastSecond=seconds;changes.recoveryProgress=0;}
 return {ok:true,resource:def,node:changes,qty,xp:earned,activity:def.activity};
}

/** Deterministic, demand-driven regional prospecting. Nonrenewing metal veins
 * are NEVER reset. Fresh nodes get new IDs and distinct remaining quantities.
 * Quotas are game-day based; repeated searching cannot bypass them. */
export function discoverResource05A(nodes,resourceId,region,seconds){
 const def=RESOURCE_MAP_05A.get(resourceId);
 if(!def||region!==def.region||!Number.isSafeInteger(seconds)||seconds<0)return {ok:false,reason:'INVALID_PROSPECT'};
 const oldId=Object.keys(nodes).sort().find(key=>nodes[key].resourceId===resourceId&&!nodes[key].discovered);
 if(oldId)return {ok:true,nodeId:oldId,nodes:{...nodes,[oldId]:{...nodes[oldId],discovered:true}},newSite:false};
 if(def.activity!=='mining'||def.id==='resource05a:stone'&&seconds<DAY)return {ok:false,reason:'NO_DISCOVERABLE_SITES'};
 const initialCounts={'resource05a:stone':6,'resource05a:coal':3,'resource05a:copper-ore':4,'resource05a:iron-ore':3};
 const initial=initialCounts[resourceId];
 if(!initial)return {ok:false,reason:'NO_DISCOVERABLE_SITES'};
 const day=Math.floor(seconds/DAY);
 const week=Math.floor(day/7);
 const perPeriod=resourceId==='resource05a:iron-ore'?1:2;
 const extra=resourceId==='resource05a:stone'?day*2:week*perPeriod;
 const known=Object.values(nodes).filter(x=>x.resourceId===resourceId).length;
 if(known>=initial+extra)return {ok:false,reason:'SUPPLY_NOT_READY'};
 if(Object.keys(nodes).length>=6000)return {ok:false,reason:'RESOURCE_HISTORY_LIMIT'};
 const id=resourceId+':prospect:'+String(known-initial+1).padStart(5,'0');
 if(Object.hasOwn(nodes,id))return {ok:false,reason:'DUPLICATE_SITE'};
 return {ok:true,nodeId:id,newSite:true,nodes:{...nodes,[id]:{
  resourceId,remaining:def.capacity,progress:0,lastSecond:seconds,recoveryProgress:0,discovered:true,cycle:0
 }}};
}
