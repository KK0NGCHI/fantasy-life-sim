import type { GameStateV2 } from '../save/save-v2.js';
import type { ItemRegistry } from '../data/item-registry.js';
import { validateItemWorld } from '../data/item-world.js';

export interface ItemSelection { readonly itemId: string; readonly quantity: number }
export type TransferResult =
 | {readonly accepted:true;readonly outcome:'success'|'failed';readonly turnsSpent:1;readonly nextState:GameStateV2}
 | {readonly accepted:false;readonly reason:'INVALID_COMMAND'|'INVALID_STATE'|'CONFIRMATION_REQUIRED';readonly turnsSpent:0};

const good=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
const amount=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0;
const reject=(reason:'INVALID_COMMAND'|'INVALID_STATE'|'CONFIRMATION_REQUIRED'):TransferResult=>({accepted:false,reason,turnsSpent:0});
/** Preview is inert: confirmation UI must display the exact selections before authorizing removal. */
export function previewDiscard(state:GameStateV2,selections:readonly ItemSelection[]):{
 readonly ok:boolean;readonly summary:readonly {itemId:string;definitionId:string;quantity:number}[]
} {
 if(!Array.isArray(selections)||!selections.length)return {ok:false,summary:[]};
 const ids=new Set<string>(),summary:{itemId:string;definitionId:string;quantity:number}[]=[];
 for(const row of selections){
  if(!row||!good(row.itemId)||!amount(row.quantity)||ids.has(row.itemId))return {ok:false,summary:[]};
  ids.add(row.itemId);
  const item=state.itemWorld.items.find(i=>i.id===row.itemId);
  const position=state.itemWorld.placements.find(p=>p.itemId===row.itemId)?.location;
  if(!item||item.quantity<row.quantity||!position||
   !((position.kind==='inventory'||position.kind==='equipped')&&position.ownerId===state.player.id))return {ok:false,summary:[]};
  // Entire containers with contents may not be discarded until explicitly emptied.
  if(state.itemWorld.containers.some(c=>c.containerId===row.itemId&&c.itemIds.length>0))return {ok:false,summary:[]};
  summary.push({itemId:row.itemId,definitionId:item.definitionId,quantity:row.quantity});
 }
 return {ok:true,summary};
}
/** Confirmation is mandatory, bound to exact selections and the current state turn.
 * UI must request confirmation in a real modal and call this only after a direct click.
 * No item is dropped into the world: quantities are irrevocably removed.
 */
export function discardSelected(state:GameStateV2,selections:readonly ItemSelection[],registry:ItemRegistry,
 approval:{readonly turn:number;readonly selections:readonly ItemSelection[]}|null):TransferResult {
 if(state.schemaVersion!==2||validateItemWorld(state.itemWorld,registry).length)return reject('INVALID_STATE');
 const preview=previewDiscard(state,selections);
 if(!preview.ok)return reject('INVALID_COMMAND');
 if(!approval||approval.turn!==state.turn||
  JSON.stringify(approval.selections)!==JSON.stringify(selections))return reject('CONFIRMATION_REQUIRED');
 if(!Number.isSafeInteger(state.turn)||state.turn>=Number.MAX_SAFE_INTEGER)return reject('INVALID_STATE');
 const world=structuredClone(state.itemWorld);
 const removed=new Set<string>();
 const items=world.items.flatMap(item=>{
  const row=selections.find(s=>s.itemId===item.id);
  if(!row)return [item];
  if(item.quantity===row.quantity){removed.add(item.id);return [];}
  return [{...item,quantity:item.quantity-row.quantity}];
 });
 const placements=world.placements.filter(p=>!removed.has(p.itemId));
 const containers=world.containers.filter(c=>!removed.has(c.containerId)).map(c=>({...c,itemIds:c.itemIds.filter(id=>!removed.has(id))}));
 const nextWorld={items,placements,containers};
 if(validateItemWorld(nextWorld,registry).length)return reject('INVALID_STATE');
 return {accepted:true,outcome:'success',turnsSpent:1,nextState:{...state,turn:state.turn+1,itemWorld:nextWorld}};
}
/** Pick up a world item that was already placed by the world generator or loot system.
 * This action never generates world items, and there are no weight checks.
 */
export function pickUpItem(state:GameStateV2,itemId:string,registry:ItemRegistry):TransferResult {
 if(state.schemaVersion!==2||validateItemWorld(state.itemWorld,registry).length)return reject('INVALID_STATE');
 if(!good(itemId))return reject('INVALID_COMMAND');
 const item=state.itemWorld.items.find(i=>i.id===itemId);
 const placement=state.itemWorld.placements.find(p=>p.itemId===itemId);
 if(!item||!placement)return reject('INVALID_COMMAND');
 if(state.turn>=Number.MAX_SAFE_INTEGER)return reject('INVALID_STATE');
 if(placement.location.kind!=='world'||placement.location.regionId!==state.player.regionId)
  return {accepted:true,outcome:'failed',turnsSpent:1,nextState:{...state,turn:state.turn+1}};
 const world=structuredClone(state.itemWorld);
 const target=world.placements.findIndex(p=>p.itemId===itemId);
 world.placements[target]={itemId,location:{kind:'inventory',ownerId:state.player.id}};
 return {accepted:true,outcome:'success',turnsSpent:1,nextState:{...state,turn:state.turn+1,itemWorld:world}};
}
