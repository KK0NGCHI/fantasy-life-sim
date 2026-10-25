import {MINERAL_BY_ID_05E,mineralDepositId05E,validateMineralDeposits05E} from './mineral-deposits-05e.js';
import {mineralAssemblage05F} from './mineral-assemblages-05f.js';

/** Read-only migration planning: no storage writes or RNG draws.
 * Every 05-E site remains an independent finite reserve. A geological group
 * is a view, not a newly spendable second stock pool.
 */
export function previewDepositMigration05F(deposits){
 if(!validateMineralDeposits05E(deposits))return {ok:false,reason:'INVALID_MINERAL_WORLD'};
 const groups=new Map();
 let totalRemaining=0,totalCapacity=0;
 for(const [key,site] of Object.entries(deposits).sort(([a],[b])=>a.localeCompare(b))){
  const def=MINERAL_BY_ID_05E.get(site.itemId);
  if(!def||key!==mineralDepositId05E(site.region,site.itemId,site.index))return {ok:false,reason:'INVALID_SITE'};
  const composition=mineralAssemblage05F(site.itemId);
  const formation=composition?.assemblageId??'legacy';
  const id='group05f:'+encodeURIComponent(site.region)+':'+formation;
  if(!groups.has(id))groups.set(id,{id,region:site.region,formation,sites:[],remaining:0,capacity:0});
  const group=groups.get(id);
  group.sites.push({siteId:key,itemId:site.itemId,remaining:site.remaining,capacity:def.stock,discovered:site.discovered});
  group.remaining+=site.remaining;
  group.capacity+=def.stock;
  totalRemaining+=site.remaining;
  totalCapacity+=def.stock;
 }
 const result=[...groups.values()].map(g=>({...g,sites:g.sites.map(s=>({...s}))}));
 return {ok:true,groups:result,sourceSiteCount:Object.keys(deposits).length,
  groupedSiteCount:result.reduce((n,g)=>n+g.sites.length,0),
  totalRemaining,totalCapacity,mode:'READ_ONLY_NO_SHARED_STOCK'};
}
export function validateDepositMigrationPreview05F(deposits,preview){
 if(!preview?.ok||!validateMineralDeposits05E(deposits)||preview.mode!=='READ_ONLY_NO_SHARED_STOCK')return false;
 const actual=previewDepositMigration05F(deposits);
 if(!actual.ok||actual.sourceSiteCount!==preview.sourceSiteCount||
  actual.groupedSiteCount!==preview.groupedSiteCount||
  actual.totalRemaining!==preview.totalRemaining||actual.totalCapacity!==preview.totalCapacity)return false;
 // Compare exact site membership and balances, not only summed totals.
 const flatten=p=>p.groups.flatMap(g=>g.sites.map(s=>[g.id,s.siteId,s.itemId,s.remaining,s.capacity,s.discovered].join('|'))).sort();
 return JSON.stringify(flatten(actual))===JSON.stringify(flatten(preview));
}
