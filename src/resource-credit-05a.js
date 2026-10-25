/** Pure player-owned resource credit for ecology and incidental rewards.
 * Fixed stack IDs must never silently increase a foreign-owned/misidentified item.
 */
export function creditOwnedResource05A(itemWorld,ownerId,stackId,definitionId,quantity){
 if(!itemWorld||!Array.isArray(itemWorld.items)||!Array.isArray(itemWorld.placements)||
  typeof ownerId!=='string'||!ownerId||typeof stackId!=='string'||!stackId||
  typeof definitionId!=='string'||!definitionId||
  !Number.isSafeInteger(quantity)||quantity<=0)throw Error('INVALID_RESOURCE_CREDIT');
 const existing=itemWorld.items.find(item=>item.id===stackId);
 if(existing){
  if(existing.definitionId!==definitionId||
   !itemWorld.placements.some(p=>p.itemId===stackId&&p.location.kind==='inventory'&&p.location.ownerId===ownerId))
   throw Error('RESOURCE_STACK_NOT_OWNED');
  if(!Number.isSafeInteger(existing.quantity+quantity))throw Error('RESOURCE_STACK_OVERFLOW');
  return {...itemWorld,items:itemWorld.items.map(item=>item.id===stackId?{...item,quantity:item.quantity+quantity}:item)};
 }
 return {...itemWorld,
  items:[...itemWorld.items,{id:stackId,definitionId,quantity}],
  placements:[...itemWorld.placements,{itemId:stackId,location:{kind:'inventory',ownerId}}]};
}
