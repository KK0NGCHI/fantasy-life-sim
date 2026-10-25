/** Shared ecological site kernel. Pure functions, serializable state and externally
 * supplied climate/randomness. Species datasets are adapters, not special cases.
 * No Math.random, wall clock, I/O, or implicit environment fallback.
 */
const isObj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const uint=n=>Number.isSafeInteger(n)&&n>=0;
const validChoices=(x,choices)=>x===undefined||Array.isArray(x)&&x.length>0&&new Set(x).size===x.length&&x.every(v=>choices.includes(v));
export function validateEcologyDefinition(def){
 return isObj(def)&&typeof def.id==='string'&&def.id.length>0&&
 Array.isArray(def.habitats)&&def.habitats.length>0&&def.habitats.every(x=>typeof x==='string'&&x.length>0)&&
 uint(def.capacity)&&def.capacity>0&&uint(def.regrowSeconds)&&def.regrowSeconds>0&&
 validChoices(def.seasons,['spring','summer','autumn','winter'])&&
 validChoices(def.weather,['clear','rain','snow','fog','storm'])&&
 validChoices(def.dayparts,['dawn','day','dusk','night'])&&
 (def.minElevation===undefined||finite(def.minElevation))&&
 (def.maxDepth===undefined||finite(def.maxDepth))&&
 Array.isArray(def.outputs)&&def.outputs.length>0&&new Set(def.outputs.map(o=>o?.id)).size===def.outputs.length&&def.outputs.every(o=>isObj(o)&&typeof o.id==='string'&&o.id&&
 finite(o.weight)&&o.weight>0&&['leaf','flower','stem','root','seed','material'].includes(o.part)&&
 ['any','mature','bloom'].includes(o.stage))&&
 ['gather','observe'].includes(def.mode);
}
export function ecologySiteId(region,speciesId,patch=0){
 if(typeof region!=='string'||!region||typeof speciesId!=='string'||!speciesId||!uint(patch))throw Error('INVALID_SITE_KEY');
 return 'eco05a:'+encodeURIComponent(region)+':'+encodeURIComponent(speciesId)+':'+patch;
}
export function createEcologySite(def,region,patch=0,second=0){
 if(!validateEcologyDefinition(def)||!def.habitats.includes(region)||!uint(second))throw Error('INVALID_ECOLOGY_SITE');
 return {id:ecologySiteId(region,def.id,patch),speciesId:def.id,region,patch,remaining:def.capacity,updatedAt:second,discovered:false};
}
export function validateEcologySite(site,def){
 return validateEcologyDefinition(def)&&isObj(site)&&site.speciesId===def.id&&
 typeof site.region==='string'&&def.habitats.includes(site.region)&&uint(site.patch)&&
 site.id===ecologySiteId(site.region,site.speciesId,site.patch)&&uint(site.remaining)&&
 site.remaining<=def.capacity&&uint(site.updatedAt)&&typeof site.discovered==='boolean';
}
export function ecologyReconcile(site,def,second){
 if(!validateEcologySite(site,def)||!uint(second)||second<site.updatedAt)throw Error('INVALID_ECOLOGY_TIME');
 const cycles=Math.floor((second-site.updatedAt)/def.regrowSeconds);
 if(!cycles)return {...site};
 return {...site,remaining:Math.min(def.capacity,site.remaining+cycles),
  updatedAt:site.updatedAt+cycles*def.regrowSeconds};
}
export function ecologyConditions(def,context){
 if(!validateEcologyDefinition(def))throw Error('INVALID_ECOLOGY_DEF');
 if(!context||!def.habitats.includes(context.region))return {ok:false,reason:'WRONG_HABITAT'};
 if(def.seasons&&!def.seasons.includes(context.season))return {ok:false,reason:'DORMANT'};
 if(def.weather&&!def.weather.includes(context.weather))return {ok:false,reason:'WEATHER_REQUIRED'};
 if(def.dayparts&&!def.dayparts.includes(context.daypart))return {ok:false,reason:'TIME_REQUIRED'};
 if(def.minElevation!==undefined&&(!finite(context.elevation)||context.elevation<def.minElevation))return {ok:false,reason:'ELEVATION_REQUIRED'};
 if(def.maxDepth!==undefined&&(!finite(context.depth)||context.depth>def.maxDepth))return {ok:false,reason:'DEPTH_REQUIRED'};
 return {ok:true,stage:context.bloom===true?'bloom':context.mature===false?'young':'mature'};
}
export function ecologyInteract(site,def,context,{second,roll=0,action='gather'}={}){
 if(!validateEcologySite(site,def)||!uint(second)||!finite(roll)||roll<0||roll>=1)throw Error('INVALID_ECOLOGY_COMMAND');
 if(action!==def.mode)return {ok:false,reason:'WRONG_INTERACTION',site};
 const result=ecologyConditions(def,context);
 if(!result.ok)return {...result,site};
 const current=ecologyReconcile(site,def,second);
 if(action==='observe')return {ok:true,site:{...current,discovered:true},outputs:[],observed:true};
 if(current.remaining===0)return {ok:false,reason:'DEPLETED',site:current};
 const possible=def.outputs.filter(o=>o.stage==='any'||o.stage===result.stage||o.stage==='mature'&&result.stage==='bloom');
 if(!possible.length)return {ok:false,reason:'NOT_READY',site:current};
 const total=possible.reduce((n,o)=>n+o.weight,0);
 let x=roll*total,chosen=possible.at(-1);
 for(const o of possible){x-=o.weight;if(x<0){chosen=o;break}}
 return {ok:true,site:{...current,remaining:current.remaining-1,discovered:true},
  outputs:[{itemId:chosen.id,part:chosen.part,quantity:1}],observed:false};
}
export function ecologyAdvance(sites,defs,seconds){
 if(!uint(seconds)||!isObj(sites))throw Error('INVALID_ECOLOGY_WORLD');
 return Object.fromEntries(Object.entries(sites).map(([id,site])=>{
  const def=defs.get(site.speciesId);
  if(!def)throw Error('UNKNOWN_ECOLOGY_SPECIES');
  return [id,ecologyReconcile(site,def,seconds)];
 }));
}
