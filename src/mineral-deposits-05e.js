import {ATLAS_MINERAL_BALANCE_05E,NAMED_MINERAL_BALANCE_05E} from './balance-minerals-05e.js';
import {REAL_ATLAS_05E} from './mineral-atlas-05e.js';
/** 05-E geological resources: non-renewable deposits, never biological regrowth.
 * Provisional grades and yields; all randomness is injected by the caller.
 */
// Atlas additions use conservative placeholder resource rules until geology is modeled.
const NAMED_MINERAL_NAMES_05E=Object.freeze({
 'item05a:tin-ore':'주석광석','item05a:silver-ore':'은광석','item05a:gold-ore':'금광석',
 'item05a:limestone':'석회암','item05a:clay':'점토','item05a:silica-sand':'석영사',
 'item05a:gypsum':'석고','item05a:sulfur':'황','item05a:stone':'일반 돌',
 'item05a:coal':'석탄','item05a:copper-ore':'구리광석','item05a:iron-ore':'철광석',
 'item05a:quartz':'수정 원석'
});
export const ATLAS_DEPOSIT_DEFINITIONS_05E=Object.freeze(REAL_ATLAS_05E.map(entry=>({
 id:entry.id,name:entry.name,regions:['광산','산맥'],...ATLAS_MINERAL_BALANCE_05E,
 atlasCategory:entry.category
})));
export const MINERAL_DEFINITIONS_05E=Object.freeze([
 ...ATLAS_DEPOSIT_DEFINITIONS_05E,
 ...Object.entries(NAMED_MINERAL_BALANCE_05E).map(([id,balance])=>({
  id,name:NAMED_MINERAL_NAMES_05E[id],regions:['광산','산맥'],...balance
 }))
]);
export const MINERAL_BY_ID_05E=new Map(MINERAL_DEFINITIONS_05E.map(x=>[x.id,x]));
export function mineralDepositId05E(region,itemId,index=0){
 if(typeof region!=='string'||!region||typeof itemId!=='string'||!itemId||!Number.isSafeInteger(index)||index<0)throw Error('INVALID_DEPOSIT_ID');
 return 'mineral05e:'+encodeURIComponent(region)+':'+encodeURIComponent(itemId)+':'+index;
}
export function createMineralDeposits05E(){
 return Object.fromEntries(MINERAL_DEFINITIONS_05E.flatMap(def=>def.regions.map(region=>{
  const id=mineralDepositId05E(region,def.id);
  return [id,{id,region,itemId:def.id,index:0,remaining:def.stock,grade:def.grade,discovered:false}];
 })));
}
export function validateMineralDeposits05E(deposits){
 if(!deposits||typeof deposits!=='object'||Array.isArray(deposits)||Object.keys(deposits).length>400)return false;
 return Object.entries(deposits).every(([id,site])=>{
  const def=MINERAL_BY_ID_05E.get(site?.itemId);
  return !!def&&site.id===id&&site.id===mineralDepositId05E(site.region,site.itemId,site.index)&&
   Object.keys(site).every(x=>['id','region','itemId','index','remaining','grade','discovered'].includes(x))&&
   def.regions.includes(site.region)&&Number.isSafeInteger(site.index)&&site.index>=0&&site.index<=10&&
   Number.isSafeInteger(site.remaining)&&site.remaining>=0&&site.remaining<=def.stock&&
   site.grade===def.grade&&typeof site.discovered==='boolean';
 });
}
export function prospectMineral05E(deposits,region,itemId){
 if(!validateMineralDeposits05E(deposits))throw Error('INVALID_MINERAL_WORLD');
 const def=MINERAL_BY_ID_05E.get(itemId);
 if(!def?.regions.includes(region))return {ok:false,reason:'NO_LOCAL_DEPOSIT'};
 const key=mineralDepositId05E(region,itemId),site=deposits[key];
 if(!site||site.remaining===0)return {ok:false,reason:'DEPOSIT_EXHAUSTED'};
 if(site.discovered)return {ok:false,reason:'ALREADY_DISCOVERED'};
 return {ok:true,deposits:{...deposits,[key]:{...site,discovered:true}},siteId:key};
}
export function mineMineral05E(deposits,region,siteId,{toolPower=1,roll=0}={}){
 if(!validateMineralDeposits05E(deposits)||!Number.isFinite(roll)||roll<0||roll>=1)throw Error('INVALID_MINERAL_ACTION');
 const site=deposits[siteId],def=MINERAL_BY_ID_05E.get(site?.itemId);
 if(!site||site.region!==region||!site.discovered)return {ok:false,reason:'DEPOSIT_NOT_KNOWN'};
 if(site.remaining===0)return {ok:false,reason:'DEPOSIT_EXHAUSTED'};
 if(!Number.isFinite(toolPower)||toolPower<def.hardness)return {ok:false,reason:'TOOL_TOO_WEAK'};
 // Grade influences yield probability, not renewable output.
 const produced=roll<0.5+0.1*site.grade;
 const newSite={...site,remaining:site.remaining-1};
 return {ok:true,deposits:{...deposits,[siteId]:newSite},
  outputs:produced?[{itemId:site.itemId,quantity:1,grade:site.grade}]:[],
  consumed:1,remaining:newSite.remaining};
}

/** Bridge older resource.work mining into the same finite geological stock.
 * A legacy-discovered site counts as discovering its underlying deposit.
 */
export function consumeLegacyMineral05E(deposits,region,itemId,quantity){
 if(!validateMineralDeposits05E(deposits)||!Number.isSafeInteger(quantity)||quantity<0)throw Error('INVALID_LEGACY_MINERAL');
 const def=MINERAL_BY_ID_05E.get(itemId);
 if(!def)return {ok:true,deposits};
 if(!def.regions.includes(region))return {ok:false,reason:'NO_LOCAL_DEPOSIT'};
 const id=mineralDepositId05E(region,itemId);
 const site=deposits[id];
 if(!site||site.remaining<quantity)return {ok:false,reason:'DEPOSIT_EXHAUSTED'};
 return {ok:true,deposits:{...deposits,[id]:{...site,remaining:site.remaining-quantity,discovered:true}}};
}
