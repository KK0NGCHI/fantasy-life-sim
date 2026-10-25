import {validateMineralDeposits05E,MINERAL_BY_ID_05E} from './mineral-deposits-05e.js';
import {mineralAssemblage05F} from './mineral-assemblages-05f.js';

/** Atomic multi-site extraction. All validation precedes the sole state update.
 * A mineral is only produced by consuming its own real finite reserve.
 * No generic assemblage may mint materials without their own source site.
 */
export function extractAssemblage05G(deposits,region,siteIds,{toolPower=1,roll=0}={}){
 if(!validateMineralDeposits05E(deposits))return {ok:false,reason:'INVALID_MINERAL_WORLD'};
 if(!Array.isArray(siteIds)||siteIds.length<2||siteIds.length>3||
  new Set(siteIds).size!==siteIds.length||siteIds.some(id=>typeof id!=='string'))return {ok:false,reason:'INVALID_SITE_SELECTION'};
 if(!Number.isFinite(roll)||roll<0||roll>=1)return {ok:false,reason:'INVALID_ROLL'};
 const sites=siteIds.map(id=>deposits[id]);
 if(sites.some(site=>!site||site.region!==region||!site.discovered))return {ok:false,reason:'DEPOSIT_NOT_KNOWN'};
 if(sites.some(site=>site.remaining<1))return {ok:false,reason:'DEPOSIT_EXHAUSTED'};
 const defs=sites.map(site=>MINERAL_BY_ID_05E.get(site.itemId));
 if(defs.some(def=>!def||toolPower<def.hardness))return {ok:false,reason:'TOOL_TOO_WEAK'};
 const groups=sites.map(site=>mineralAssemblage05F(site.itemId)?.assemblageId??null);
 if(!groups[0]||groups.some(group=>group!==groups[0]))return {ok:false,reason:'INCOMPATIBLE_ASSEMBLAGE'};
 const next={...deposits},outputs=[];
 for(let i=0;i<sites.length;i++){
  const site=sites[i];
  next[site.id]={...site,remaining:site.remaining-1};
  if(roll<0.5+0.1*site.grade)outputs.push({itemId:site.itemId,quantity:1,grade:site.grade});
 }
 return {ok:true,deposits:next,outputs,consumed:siteIds.length,
  assemblageId:groups[0],remainingBySite:Object.fromEntries(siteIds.map(id=>[id,next[id].remaining]))};
}
