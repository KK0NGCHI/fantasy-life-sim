/** 05-E geological resources: non-renewable deposits, never biological regrowth.
 * Provisional grades and yields; all randomness is injected by the caller.
 */
export const MINERAL_DEFINITIONS_05E=Object.freeze([
 {id:'item05a:tin-ore',name:'주석광석',regions:['광산','산맥'],stock:6,grade:2,hardness:2},
 {id:'item05a:silver-ore',name:'은광석',regions:['광산','산맥'],stock:5,grade:2,hardness:2},
 {id:'item05a:gold-ore',name:'금광석',regions:['광산','산맥'],stock:4,grade:3,hardness:2},
 {id:'item05a:limestone',name:'석회암',regions:['광산','산맥'],stock:10,grade:1,hardness:1},
 {id:'item05a:clay',name:'점토',regions:['광산','산맥'],stock:12,grade:1,hardness:1},
 {id:'item05a:silica-sand',name:'석영사',regions:['광산','산맥'],stock:9,grade:1,hardness:1},
 {id:'item05a:gypsum',name:'석고',regions:['광산','산맥'],stock:8,grade:1,hardness:1},
 {id:'item05a:sulfur',name:'황',regions:['광산','산맥'],stock:6,grade:2,hardness:2},
 {id:'item05a:stone',name:'일반 돌',regions:['광산','산맥'],stock:16,grade:1,hardness:1},
 {id:'item05a:coal',name:'석탄',regions:['광산','산맥'],stock:10,grade:1,hardness:2},
 {id:'item05a:copper-ore',name:'구리광석',regions:['광산','산맥'],stock:8,grade:2,hardness:2},
 {id:'item05a:iron-ore',name:'철광석',regions:['광산','산맥'],stock:7,grade:2,hardness:3},
 {id:'item05a:quartz',name:'수정 원석',regions:['광산','산맥'],stock:5,grade:3,hardness:2}
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
 if(!deposits||typeof deposits!=='object'||Array.isArray(deposits)||Object.keys(deposits).length>100)return false;
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
