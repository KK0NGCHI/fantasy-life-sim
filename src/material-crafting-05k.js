import {planMaterialAllocation} from './material-compatibility-05j.js';

/** Pure 05-K inventory craft transaction. No duration, UI, or save mutations.
 * Inputs are immutable server-side recipe definitions; metadata is resolved by
 * trusted caller. Returned itemWorld is committed only after full validation.
 */
export function craftWithAllocatedMaterials(itemWorld,ownerId,recipe,definitions={}){
 if(!itemWorld||!Array.isArray(itemWorld.items)||!Array.isArray(itemWorld.placements)||
  typeof ownerId!=='string'||!ownerId||!recipe||typeof recipe.output!=='string'||
  !Number.isSafeInteger(recipe.outputQty)||recipe.outputQty<1)
  return {ok:false,reason:'INVALID_RECIPE'};
 const inputs=recipe.inputs??(recipe.input?[{itemId:recipe.input,quantity:recipe.inputQty}]:null);
 if(!Array.isArray(inputs)||!inputs.length)return {ok:false,reason:'INVALID_RECIPE'};
 const slots=inputs.map((x,i)=>({
  slotId:'slot:'+i,quantity:x.quantity,
  ...(x.itemId?{exactId:x.itemId}:{material:x.material})
 }));
 const owned=new Set(itemWorld.placements.filter(p=>p.location?.kind==='inventory'&&p.location.ownerId===ownerId).map(p=>p.itemId));
 const stocks=itemWorld.items.filter(i=>owned.has(i.id)&&i.quantity>0).map(i=>({
  ...i,...(definitions[i.definitionId]??{})
 }));
 const plan=planMaterialAllocation(stocks,slots);
 if(!plan.ok)return {ok:false,reason:plan.reason==='INVALID_MATERIAL_PLAN'?'INVALID_RECIPE':plan.reason};
 const spent=new Map();
 for(const allocation of plan.allocations)spent.set(allocation.itemId,(spent.get(allocation.itemId)??0)+allocation.quantity);
 const remaining=itemWorld.items.map(i=>({...i,quantity:i.quantity-(spent.get(i.id)??0)}));
 if(remaining.some(i=>i.quantity<0))return {ok:false,reason:'INSUFFICIENT_MATERIAL'};
 const exhausted=new Set(remaining.filter(i=>i.quantity===0).map(i=>i.id));
 let items=remaining.filter(i=>i.quantity>0);
 const placements=itemWorld.placements.filter(p=>!exhausted.has(p.itemId));
 const outputId='refined05h:'+recipe.output;
 const prev=items.find(i=>i.id===outputId);
 if(prev&&(
  prev.definitionId!==recipe.output||
  !placements.some(p=>p.itemId===outputId&&p.location?.kind==='inventory'&&p.location.ownerId===ownerId)
 ))return {ok:false,reason:'OUTPUT_NOT_OWNED'};
 if(prev&&!Number.isSafeInteger(prev.quantity+recipe.outputQty))return {ok:false,reason:'OUTPUT_OVERFLOW'};
 if(prev)items=items.map(i=>i.id===outputId?{...i,quantity:i.quantity+recipe.outputQty}:i);
 else items=[...items,{id:outputId,definitionId:recipe.output,quantity:recipe.outputQty}];
 const nextPlacements=prev?placements:[...placements,{itemId:outputId,location:{kind:'inventory',ownerId}}];
 return {ok:true,itemWorld:{...itemWorld,items,placements:nextPlacements},recipe,allocations:plan.allocations};
}
