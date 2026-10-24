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
const species=new Map(RESOURCE_SPECIES_05A.map(x=>[x.id,x]));
const items=new Set(CATALOG_ITEMS_05A.map(x=>x.id));
export function createCandidateSites05A(){
 const result={};
 for(const [sourceId,rule] of Object.entries(TEST_SOURCES)){
  const s=species.get(sourceId);
  if(!s)throw Error('UNKNOWN_SPECIES');
  for(const region of s.regions){
   const id='site05a:'+sourceId.slice('source05a:'.length)+':'+region;
   result[id]={sourceId,region,remaining:rule.capacity,discovered:false};
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
export function harvestCandidateSite05A(nodes,id,region,activity,{toolRank=0}={}){
 const site=nodes?.[id],spec=species.get(site?.sourceId),rule=TEST_SOURCES[site?.sourceId];
 if(!site||!spec||!rule||site.region!==region||!spec.regions.includes(region))return {ok:false,reason:'WRONG_SITE'};
 if(!site.discovered)return {ok:false,reason:'UNDISCOVERED'};
 if(site.remaining<1)return {ok:false,reason:'DEPLETED'};
 if(activity!==rule.activity)return {ok:false,reason:'WRONG_ACTIVITY'};
 if((activity==='mining'||activity==='logging')&&(!Number.isSafeInteger(toolRank)||toolRank<1))return {ok:false,reason:'TOOL_REQUIRED'};
 if(!rule.outputs.every(x=>items.has(x)))throw Error('INVALID_OUTPUT');
 return {ok:true,nodes:{...nodes,[id]:{...site,remaining:site.remaining-1}},
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
