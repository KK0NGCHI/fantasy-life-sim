import type { GameState } from '../core/contracts.js';
import type { ItemInstanceDraft, ItemLocation, ContainerContents } from './item-model.js';
import type { ItemRegistry, ValidationIssue } from './item-registry.js';
import { validateItemInstances } from './item-registry.js';

/** Inventory representation for next save schema. Not yet serialized by current GameState. */
export interface ItemPlacement { readonly itemId: string; readonly location: ItemLocation; }
export interface ItemWorldSnapshot {
  readonly items: readonly ItemInstanceDraft[];
  readonly placements: readonly ItemPlacement[];
  readonly containers: readonly ContainerContents[];
}
const bad=(path:string,code:string):ValidationIssue=>({path,code});
const id=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
const rec=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function validateItemWorld(world: ItemWorldSnapshot, registry: ItemRegistry): readonly ValidationIssue[] {
  if(!rec(world)||!Array.isArray(world.items)||!Array.isArray(world.placements)||!Array.isArray(world.containers))
    return [bad('itemWorld','INVALID_WORLD')];
  const issues:ValidationIssue[]=[...validateItemInstances(world.items,registry)];
  const items=new Map(world.items.filter(x=>rec(x)&&id(x.id)).map(x=>[x.id,x]));
  const placed=new Map<string,ItemLocation>();
  world.placements.forEach((entry,i)=>{
    const p='placements['+i+']';
    if(!rec(entry)||!id(entry.itemId)||!rec(entry.location)) { issues.push(bad(p,'INVALID_PLACEMENT'));return; }
    if(!items.has(entry.itemId)) issues.push(bad(p+'.itemId','UNKNOWN_ITEM'));
    if(placed.has(entry.itemId)) issues.push(bad(p+'.itemId','DUPLICATE_PLACEMENT'));
    const l=entry.location;
    if(l.kind==='inventory'&&!id(l.ownerId) ||
       l.kind==='equipped'&&(!id(l.ownerId)||!id(l.slotId)) ||
       l.kind==='container'&&!id(l.containerId) ||
       l.kind==='world'&&(!id(l.regionId)||!id(l.locationId)) ||
       !['inventory','equipped','container','world'].includes(String(l.kind))) issues.push(bad(p+'.location','INVALID_LOCATION'));
    placed.set(entry.itemId,entry.location);
  });
  for(const item of items.keys()) if(!placed.has(item)) issues.push(bad('items.'+item,'MISSING_PLACEMENT'));
  const containers=new Map<string,readonly string[]>();
  world.containers.forEach((container,i)=>{
    const p='containers['+i+']';
    if(!rec(container)||!id(container.containerId)||!Array.isArray(container.itemIds)||!container.itemIds.every(id)){issues.push(bad(p,'INVALID_CONTAINER'));return;}
    if(!items.has(container.containerId)) issues.push(bad(p+'.containerId','UNKNOWN_CONTAINER_ITEM'));
    if(containers.has(container.containerId)) issues.push(bad(p+'.containerId','DUPLICATE_CONTAINER'));
    if(new Set(container.itemIds).size!==container.itemIds.length) issues.push(bad(p+'.itemIds','DUPLICATE_CONTENT'));
    containers.set(container.containerId,container.itemIds);
  });
  for(const [itemId,loc] of placed) {
    if(loc.kind==='container') {
      const children=containers.get(loc.containerId);
      if(!children||!children.includes(itemId)) issues.push(bad('placements.'+itemId,'CONTAINER_LINK_MISMATCH'));
    }
  }
  for(const [containerId,children] of containers){
    for(const child of children){
      if(!items.has(child)) issues.push(bad('containers.'+containerId,'UNKNOWN_CHILD_ITEM'));
      const loc=placed.get(child);
      if(loc?.kind!=='container'||loc.containerId!==containerId) issues.push(bad('containers.'+containerId,'CONTAINER_LINK_MISMATCH'));
    }
  }
  // No circular container ownership, including direct self-reference.
  for(const start of containers.keys()){
    const visited=new Set<string>();let node=start;
    while(true){
      if(visited.has(node)){issues.push(bad('containers.'+start,'CONTAINER_CYCLE'));break;}
      visited.add(node);
      const loc=placed.get(node);
      if(loc?.kind!=='container'||!containers.has(loc.containerId)) break;
      node=loc.containerId;
    }
  }
  return issues;
}
/** Explicitly map legacy shape; unknown content definitions fail rather than invent attributes. */
export function prepareInventoryMigration(state: GameState, registry: ItemRegistry):
  { readonly ok:true; readonly items:readonly ItemInstanceDraft[] } |
  { readonly ok:false; readonly issues:readonly ValidationIssue[] } {
  const items=state.inventory.items.map(({id,definitionId,quantity})=>({id,definitionId,quantity}));
  const issues=validateItemInstances(items,registry);
  return issues.length?{ok:false,issues}:{ok:true,items};
}
