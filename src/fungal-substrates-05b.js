import {FUNGAL_SPECIES_05B} from './fungal-ecology-05b.js';

/** World-owned substrate ledger, separate from fungal mycelia.
 * Each region/substrate is stable and can host multiple fungal species.
 * Tree products add deadwood only through successful world logging.
 */
export const SUBSTRATE_TYPES_05B=Object.freeze(['deadwood','hardwood','living-tree-roots','grassland-soil','leaf-litter','rich-soil']);
const bounded=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000;
export const substrateId05B=(region,type)=>'substrate05b:'+encodeURIComponent(region)+':'+type;
export function createSubstrateWorld05B(){
 const set=new Map();
 for(const f of FUNGAL_SPECIES_05B)for(const region of f.regions){
  const id=substrateId05B(region,f.substrate);
  if(!set.has(id))set.set(id,{id,region,type:f.substrate,remaining:100,updatedAt:0});
 }
 return Object.fromEntries(set);
}
export function validateSubstrateWorld05B(sites){
 if(!sites||typeof sites!=='object'||Array.isArray(sites)||Object.keys(sites).length>100)return false;
 return Object.entries(sites).every(([id,s])=>s&&typeof s==='object'&&!Array.isArray(s)&&
  Object.keys(s).every(k=>['id','region','type','remaining','updatedAt'].includes(k))&&
  typeof s.region==='string'&&s.region.length>0&&s.region.length<80&&
  SUBSTRATE_TYPES_05B.includes(s.type)&&id===s.id&&id===substrateId05B(s.region,s.type)&&
  bounded(s.remaining)&&Number.isSafeInteger(s.updatedAt)&&s.updatedAt>=0);
}
export function changeSubstrate05B(world,id,delta,second){
 if(!validateSubstrateWorld05B(world)||!Number.isSafeInteger(delta)||!Number.isSafeInteger(second)||second<0)throw Error('INVALID_SUBSTRATE_ACTION');
 const site=world[id];
 if(!site||second<site.updatedAt)throw Error('UNKNOWN_SUBSTRATE');
 return {...world,[id]:{...site,remaining:Math.min(1000,Math.max(0,site.remaining+delta)),updatedAt:second}};
}
export function substrateForFungus05B(world,site){
 if(!world)return null;
 const id=substrateId05B(site.region,site.substrate);
 return world[id]??null;
}
export function consumeFungalSubstrate05B(world,site,second){
 const shared=substrateForFungus05B(world,site);
 if(!shared||shared.remaining<5)return {ok:false,reason:'SUBSTRATE_EXHAUSTED'};
 return {ok:true,world:changeSubstrate05B(world,shared.id,-5,second)};
}
export function addLoggingDeadwood05B(world,region,itemId,quantity,second){
 if(!world||quantity<=0||!['item05a:oak-log','item05a:pine-log'].includes(itemId))return world;
 const id=substrateId05B(region,'deadwood');
 return world[id]?changeSubstrate05B(world,id,Math.min(quantity*5,50),second):world;
}
