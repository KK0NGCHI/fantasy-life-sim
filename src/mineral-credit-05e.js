/** Atomic mineral-output credit. A fixed stack ID can only be reused if it is
 * already in the receiving player's inventory; never credit someone else's stack.
 * Pure operation: failures never mutate the caller-owned world.
 */
export function creditMineralOutputs05E(itemWorld,ownerId,outputs){
 if(!itemWorld||typeof ownerId!=='string'||!ownerId||!Array.isArray(outputs))throw Error('INVALID_MINERAL_CREDIT');
 let items=itemWorld.items,placements=itemWorld.placements;
 for(const output of outputs){
  if(typeof output.itemId!=='string'||!output.itemId||
   !Number.isSafeInteger(output.quantity)||output.quantity<=0)throw Error('INVALID_MINERAL_OUTPUT');
  const id='mineral05e:'+output.itemId;
  const prior=items.find(item=>item.id===id);
  if(prior){
   if(prior.definitionId!==output.itemId||
    !placements.some(p=>p.itemId===id&&p.location.kind==='inventory'&&p.location.ownerId===ownerId))
    throw Error('MINERAL_OUTPUT_NOT_OWNED');
   if(!Number.isSafeInteger(prior.quantity+output.quantity))throw Error('MINERAL_STACK_OVERFLOW');
   items=items.map(item=>item.id===id?{...item,quantity:item.quantity+output.quantity}:item);
  }else{
   items=[...items,{id,definitionId:output.itemId,quantity:output.quantity}];
   placements=[...placements,{itemId:id,location:{kind:'inventory',ownerId}}];
  }
 }
 return {...itemWorld,items,placements};
}
