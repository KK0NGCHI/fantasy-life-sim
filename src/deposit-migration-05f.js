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

/** A consciously approved, detached sidecar projection. Not a game save migration.
 * The original finite ledgers remain the only spendable reserves.
 * The preview must match the exact current ledger, preventing stale approvals.
 */
export const DEPOSIT_VIEW_APPROVAL_05F='APPROVE_READ_ONLY_DEPOSIT_VIEW_05F';
export function approveDepositView05F(deposits,preview,{approval}={}){
 if(approval!==DEPOSIT_VIEW_APPROVAL_05F)return {ok:false,reason:'APPROVAL_REQUIRED'};
 if(!validateDepositMigrationPreview05F(deposits,preview))return {ok:false,reason:'STALE_OR_INVALID_PREVIEW'};
 const current=previewDepositMigration05F(deposits);
 const sidecar={
  schema:'somnium-deposit-view-05f',
  version:1,
  mode:'READ_ONLY_NO_SHARED_STOCK',
  sourceSiteCount:current.sourceSiteCount,
  totalRemaining:current.totalRemaining,
  groups:current.groups.map(group=>({
   id:group.id,region:group.region,formation:group.formation,
   remaining:group.remaining,capacity:group.capacity,
   sites:group.sites.map(site=>({...site}))
  }))
 };
 return {ok:true,sidecar};
}
/** Import only as validated read-only presentation data. Never overwrite stocks. */
export function restoreDepositView05F(deposits,sidecar){
 const preview=previewDepositMigration05F(deposits);
 if(!preview.ok||!sidecar||sidecar.schema!=='somnium-deposit-view-05f'||
    sidecar.version!==1||sidecar.mode!=='READ_ONLY_NO_SHARED_STOCK')return {ok:false,reason:'INVALID_VIEW'};
 if(!Array.isArray(sidecar.groups)||sidecar.sourceSiteCount!==preview.sourceSiteCount||
    sidecar.totalRemaining!==preview.totalRemaining)return {ok:false,reason:'STALE_OR_INVALID_VIEW'};
 // Re-derive canonical content, including exact nested keys and group totals.
 const expected=approveDepositView05F(deposits,preview,{approval:DEPOSIT_VIEW_APPROVAL_05F});
 if(JSON.stringify(sidecar)!==JSON.stringify(expected.sidecar))return {ok:false,reason:'STALE_OR_INVALID_VIEW'};
 return {ok:true,sidecar:expected.sidecar};
}
