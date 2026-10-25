import {BOTANICAL_ITEMS_05A} from './botanical-species-05a.js';
import {RESOURCE_SPECIES_05A,RESOURCE_DEPTHS_05A,RESOURCE_REGIONS_05A,CATALOG_ITEMS_05A} from './resource-catalog-05a.js';

/** Experimental B-slice. Standalone source-node rules; NOT wired into v3 saves/UI. */
const TEST_SOURCES=Object.freeze({
 'source05a:blueberry':{activity:'gather',capacity:4,outputs:['item05a:blueberry'],renewable:true},
 'source05a:reed':{activity:'gather',capacity:5,outputs:['item05a:reed'],renewable:true},
 'source05a:quartz':{activity:'mining',capacity:3,outputs:['item05a:quartz'],renewable:false},
 'source05a:mussel':{activity:'gather',capacity:4,outputs:['item05a:mussel'],renewable:true},
 'source05a:marsh-bell':{activity:'gather',capacity:2,outputs:['item05a:marsh-bell-mushroom'],renewable:true},
 'source05a:sacred-oak':{activity:'logging',capacity:1,outputs:['item05a:sacred-oak-log'],renewable:false}
});
export const SOURCE_WORK_RULES_05A=TEST_SOURCES;
const DAY=86400, SEASON=28*DAY, YEAR=4*SEASON;
/** Candidate recovery uses elapsed game seconds only. Each season may have different productivity.
 * Multipliers are prototype values, not published economy balance. */
export const CANDIDATE_REGEN_05A=Object.freeze({
 'source05a:blueberry':{seconds:DAY,units:2,seasons:[1,2,1,0]},
 'source05a:reed':{seconds:DAY,units:2,seasons:[1,2,1,0]},
 'source05a:mussel':{seconds:2*DAY,units:2,seasons:[1,1,1,1]},
 'source05a:marsh-bell':{seconds:3*DAY,units:1,seasons:[1,1,2,0.5]}
});
function growthUntil(t,multipliers){
 const absolute=t+28800;
 const years=Math.floor(absolute/YEAR),remainder=absolute%YEAR;
 const yearly=multipliers.reduce((acc,v)=>acc+v*SEASON,0);
 return years*yearly+multipliers.reduce((acc,v,i)=>acc+v*Math.max(0,Math.min(SEASON,remainder-i*SEASON)),0);
}
export function reconcileCandidateSite05A(site,seconds){
 if(!site||!Number.isSafeInteger(seconds)||seconds<0||seconds<(site.lastSecond??0))throw Error('INVALID_CANDIDATE_TIME');
 const config=CANDIDATE_REGEN_05A[site.sourceId],rule=TEST_SOURCES[site.sourceId];
 if(!rule)throw Error('INVALID_CANDIDATE_SOURCE');
 const last=site.lastSecond??0, next={...site,lastSecond:seconds};
 if(!config){next.recoveryProgress=0;return next;}
 if(site.remaining>=rule.capacity){next.recoveryProgress=0;return next;}
 const elapsed=growthUntil(seconds,config.seasons)-growthUntil(last,config.seasons);
 const accumulated=(site.recoveryProgress??0)+elapsed;
 const cycles=Math.floor(accumulated/config.seconds);
 next.remaining=Math.min(rule.capacity,site.remaining+cycles*config.units);
 next.recoveryProgress=next.remaining>=rule.capacity?0:accumulated%config.seconds;
 return next;
}

const species=new Map(RESOURCE_SPECIES_05A.map(x=>[x.id,x]));
const items=new Set([...CATALOG_ITEMS_05A,...BOTANICAL_ITEMS_05A].map(x=>x.id));
export function createCandidateSites05A(){
 const result={};
 for(const [sourceId,rule] of Object.entries(TEST_SOURCES)){
  const s=species.get(sourceId);
  if(!s)throw Error('UNKNOWN_SPECIES');
  for(const region of s.regions){
   const id='site05a:'+sourceId.slice('source05a:'.length)+':'+region;
   result[id]={sourceId,region,remaining:rule.capacity,discovered:false,lastSecond:0,recoveryProgress:0};
  }
 }
 return result;
}
export function discoverCandidateSite05A(nodes,id,region){
 const site=nodes?.[id],spec=species.get(site?.sourceId);
 if(!site||!spec||site.region!==region||!spec.regions.includes(region))return {ok:false,reason:'WRONG_SITE'};
 if(site.discovered)return {ok:false,reason:'ALREADY_DISCOVERED'};
 return {ok:true,nodes:{...nodes,[id]:{...site,discovered:true}}};
}
/** Works in a single pure transition. Callers must commit result via their authoritative
 * dispatch/save layer; direct mutations and free loot are not allowed. */
export function harvestCandidateSite05A(nodes,id,region,activity,{toolRank=0,seconds=0}={}){
 const site=nodes?.[id],spec=species.get(site?.sourceId),rule=TEST_SOURCES[site?.sourceId];
 if(!site||!spec||!rule||site.region!==region||!spec.regions.includes(region))return {ok:false,reason:'WRONG_SITE'};
 if(!site.discovered)return {ok:false,reason:'UNDISCOVERED'};
 const reconciled=reconcileCandidateSite05A(site,seconds);
 if(reconciled.remaining<1)return {ok:false,reason:'DEPLETED'};
 if(activity!==rule.activity)return {ok:false,reason:'WRONG_ACTIVITY'};
 if((activity==='mining'||activity==='logging')&&(!Number.isSafeInteger(toolRank)||toolRank<1))return {ok:false,reason:'TOOL_REQUIRED'};
 if(!rule.outputs.every(x=>items.has(x)))throw Error('INVALID_OUTPUT');
 return {ok:true,nodes:{...nodes,[id]:{...reconciled,remaining:reconciled.remaining-1,recoveryProgress:0}},
  rewards:rule.outputs.map(itemId=>({itemId,quantity:1,sourceId:site.sourceId,region:site.region,traits:[]}))};
}
export function resolveQualityPolicy05A(activity,itemId){
 // Policy is action-first, with per-output exclusions. Numeric grades remain unapproved.
 const eligible={gather:true,logging:true,mining:false,fishing:true};
 if(!Object.hasOwn(eligible,activity))throw Error('INVALID_ACTIVITY');
 const excluded=new Set(['item05a:reed','item05a:stone','item05a:coal']);
 return eligible[activity]&&!excluded.has(itemId)&&items.has(itemId);
}
export function acquiredCompendium05A(existing,rewards){
 if(!Array.isArray(rewards)||!rewards.every(r=>items.has(r.itemId)&&Number.isSafeInteger(r.quantity)&&r.quantity>0))throw Error('INVALID_REWARDS');
 const sources=new Set(existing?.sourceIds??[]),obtained=new Set(existing?.itemIds??[]);
 for(const r of rewards){
  obtained.add(r.itemId);
  // Register a species ONLY when that source actually yielded a validated output.
  if(r.sourceId&&species.get(r.sourceId)?.outputs.includes(r.itemId))sources.add(r.sourceId);
 }
 return {sourceIds:[...sources].sort(),itemIds:[...obtained].sort()};
}

/** Unlimited-total quartz prospecting: 600s per attempt in dispatcher.
 * It reveals hidden veins first; a new finite vein may be found only once the
 * last one was depleted and at least a day elapsed since the previous find.
 * No lifetime or week-based ore quota. Stored sites remain bounded by save cap. */
export function prospectCandidateQuartz05A(nodes,region,seconds){
 if(region!=='광산'&&region!=='산맥')return {ok:false,reason:'WRONG_REGION'};
 if(!Number.isSafeInteger(seconds)||seconds<0)return {ok:false,reason:'INVALID_TIME'};
 const entries=Object.entries(nodes).filter(([,s])=>s.sourceId==='source05a:quartz'&&s.region===region);
 const hidden=entries.find(([,s])=>!s.discovered);
 if(hidden)return {ok:true,nodes:{...nodes,[hidden[0]]:{...hidden[1],discovered:true}},nodeId:hidden[0],newSite:false};
 if(entries.some(([,s])=>s.remaining>0))return {ok:false,reason:'VEIN_REMAINS'};
 const latest=Math.max(...entries.map(([,s])=>s.lastSecond??0));
 if(entries.length&&seconds-latest<DAY)return {ok:false,reason:'PROSPECT_COOLDOWN'};
 if(Object.keys(nodes).length>=100)return {ok:false,reason:'SITE_STORAGE_LIMIT'};
 const index=entries.length+1,id='site05a:quartz:'+region+':prospect:'+String(index).padStart(4,'0');
 if(Object.hasOwn(nodes,id))return {ok:false,reason:'DUPLICATE_SITE'};
 return {ok:true,nodeId:id,newSite:true,nodes:{...nodes,[id]:{
 sourceId:'source05a:quartz',region,remaining:TEST_SOURCES['source05a:quartz'].capacity,
 discovered:true,lastSecond:seconds,recoveryProgress:0
 }}};
}
