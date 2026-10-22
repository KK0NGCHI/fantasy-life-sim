import type { GameStateV2 } from '../save/save-v2.js';
import type { ItemRegistry } from '../data/item-registry.js';
import { validateItemWorld } from '../data/item-world.js';

export interface ItemSelection { readonly itemId:string; readonly quantity:number }
export interface DiscardPreview {
 readonly turn:number;
 readonly fingerprint:string;
 readonly selections:readonly ItemSelection[];
 readonly count:number;
}
/** Snapshot signature is for stale-preview detection, not cryptographic integrity. */
const fingerprint=(state:GameStateV2):string=>JSON.stringify(state.itemWorld);
const validId=(x:unknown):x is string=>typeof x==='string'&&x.trim().length>0;
const positive=(x:unknown):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>0;
export type DiscardResult =
 | {readonly accepted:true;readonly outcome:'success'|'failed';readonly turnsSpent:1;readonly nextState:GameStateV2;readonly events:readonly {type:string;payload:Readonly<Record<string,unknown>>}[]}
 | {readonly accepted:false;readonly reason:'INVALID_COMMAND'|'INVALID_STATE'|'CONFIRMATION_REQUIRED'|'STALE_PREVIEW';readonly turnsSpent:0};

const belongs=(id:string,state:GameStateV2):boolean=>{
 const where=new Map(state.itemWorld.placements.map(p=>[p.itemId,p.location]));
 const visited=new Set<string>();let current=id;
 while(!visited.has(current)){
  visited.add(current);
  const loc=where.get(current);
  if(loc?.kind==='inventory'||loc?.kind==='equipped')return loc.ownerId===state.player.id;
  if(loc?.kind!=='container')return false;
  current=loc.containerId;
 }
 return false;
};
/** Preview is the only way to authorize discard. Invalid selections leave state unchanged. */
export function prepareBulkDiscard(state:GameStateV2,selections:readonly ItemSelection[],registry:ItemRegistry):
 {readonly ok:true;readonly preview:DiscardPreview}|{readonly ok:false;readonly reason:string} {
 if(state.schemaVersion!==2||validateItemWorld(state.itemWorld,registry).length)return {ok:false,reason:'INVALID_STATE'};
 if(!Array.isArray(selections)||selections.length===0)return {ok:false,reason:'INVALID_COMMAND'};
 const used=new Set<string>();let count=0;
 for(const selection of selections){
  if(!selection||!validId(selection.itemId)||!positive(selection.quantity)||used.has(selection.itemId))return {ok:false,reason:'INVALID_COMMAND'};
  used.add(selection.itemId);
  const item=state.itemWorld.items.find(i=>i.id===selection.itemId);
  if(!item||selection.quantity>item.quantity||!belongs(item.id,state))return {ok:false,reason:'INVALID_COMMAND'};
  // A nonempty container cannot be destroyed with its contents invisibly.
  if(state.itemWorld.containers.some(c=>c.containerId===item.id&&c.itemIds.length>0))return {ok:false,reason:'CONTAINER_NOT_EMPTY'};
  count+=selection.quantity;
  if(!Number.isSafeInteger(count))return {ok:false,reason:'INVALID_COMMAND'};
 }
 return {ok:true,preview:{turn:state.turn,fingerprint:fingerprint(state),selections:structuredClone(selections),count}};
}
/** Call only from explicit confirm button of a modal dialog. One batch = one turn. */
export function confirmBulkDiscard(state:GameStateV2,preview:DiscardPreview,registry:ItemRegistry):DiscardResult{
 if(!preview||!Array.isArray(preview.selections))return {accepted:false,reason:'CONFIRMATION_REQUIRED',turnsSpent:0};
 if(state.turn!==preview.turn||fingerprint(state)!==preview.fingerprint)return {accepted:false,reason:'STALE_PREVIEW',turnsSpent:0};
 if(!Number.isSafeInteger(state.turn)||state.turn>=Number.MAX_SAFE_INTEGER)return {accepted:false,reason:'INVALID_STATE',turnsSpent:0};
 const check=prepareBulkDiscard(state,preview.selections,registry);
 if(!check.ok)return {accepted:false,reason:'INVALID_COMMAND',turnsSpent:0};
 if(JSON.stringify(check.preview)!==JSON.stringify(preview))return {accepted:false,reason:'STALE_PREVIEW',turnsSpent:0};
 const items=state.itemWorld.items.map(i=>({...i}));
 const removedIds=new Set<string>();
 for(const selection of preview.selections){
  const item=items.find(i=>i.id===selection.itemId)!;
  item.quantity-=selection.quantity;
  if(item.quantity===0)removedIds.add(item.id);
 }
 const nextWorld={
  items:items.filter(i=>!removedIds.has(i.id)),
  placements:state.itemWorld.placements.filter(p=>!removedIds.has(p.itemId)),
  containers:state.itemWorld.containers.filter(c=>!removedIds.has(c.containerId)).map(c=>({...c,itemIds:c.itemIds.filter(id=>!removedIds.has(id))}))
 };
 if(validateItemWorld(nextWorld,registry).length)return {accepted:false,reason:'INVALID_STATE',turnsSpent:0};
 return {accepted:true,outcome:'success',turnsSpent:1,nextState:{...state,turn:state.turn+1,itemWorld:nextWorld},
 events:[{type:'item.discarded',payload:{count:preview.count,itemIds:preview.selections.map(s=>s.itemId)}}]};
}
export type PickupResult=
 | {readonly accepted:true;readonly outcome:'success'|'failed';readonly turnsSpent:1;readonly nextState:GameStateV2}
 | {readonly accepted:false;readonly reason:'INVALID_COMMAND'|'INVALID_STATE';readonly turnsSpent:0};
/** Picking up an already spawned world instance never duplicates it or draws RNG. */
export function pickupWorldItem(state:GameStateV2,itemId:string,locationId:string,registry:ItemRegistry):PickupResult{
 if(state.schemaVersion!==2||validateItemWorld(state.itemWorld,registry).length)return {accepted:false,reason:'INVALID_STATE',turnsSpent:0};
 if(!validId(itemId)||!validId(locationId)||state.turn>=Number.MAX_SAFE_INTEGER)return {accepted:false,reason:'INVALID_COMMAND',turnsSpent:0};
 const index=state.itemWorld.placements.findIndex(p=>p.itemId===itemId);
 if(index<0)return {accepted:false,reason:'INVALID_COMMAND',turnsSpent:0};
 const loc=state.itemWorld.placements[index]!.location;
 if(loc.kind!=='world'||loc.regionId!==state.player.regionId||loc.locationId!==locationId)
  return {accepted:true,outcome:'failed',turnsSpent:1,nextState:{...state,turn:state.turn+1}};
 const placements=state.itemWorld.placements.map((p,i)=>i===index?{itemId,location:{kind:'inventory' as const,ownerId:state.player.id}}:p);
 return {accepted:true,outcome:'success',turnsSpent:1,nextState:{...state,turn:state.turn+1,itemWorld:{...state.itemWorld,placements}}};
}
