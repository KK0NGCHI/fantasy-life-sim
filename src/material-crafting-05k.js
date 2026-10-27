import {MATERIALS_CONDITION_05N,craftMaterialReceipt05N,TRACKED_RECIPES_05N} from './material-composition-05n.js';
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
 const receipt=TRACKED_RECIPES_05N(recipe)?craftMaterialReceipt05N(itemWorld,plan.allocations):null;
 if(TRACKED_RECIPES_05N(recipe)&&!receipt)return {ok:false,reason:'INVALID_MATERIAL_PLAN'};
 const condition=receipt?{[MATERIALS_CONDITION_05N]:receipt}:undefined;
 // Existing exact-ID 05-H/I outputs keep their legacy fixed stack IDs.
 // For new recipes, a material-specific stack can only merge with an identical receipt.
 const matches=items.filter(i=>i.definitionId===recipe.output&&
  (receipt?i.condition?.[MATERIALS_CONDITION_05N]===receipt:i.id===outputId)&&
  placements.some(p=>p.itemId===i.id&&p.location?.kind==='inventory'&&p.location.ownerId===ownerId));
 const prev=matches[0];
 if(prev&&!Number.isSafeInteger(prev.quantity+recipe.outputQty))return {ok:false,reason:'OUTPUT_OVERFLOW'};
 if(prev)items=items.map(i=>i.id===prev.id?{...i,quantity:i.quantity+recipe.outputQty}:i);
 else {
  let nextId=outputId;
  if(receipt){
   let index=1;
   while(itemWorld.items.some(i=>i.id===outputId+':materials:'+index))index++;
   nextId=outputId+':materials:'+index;
  }
  if(items.some(i=>i.id===nextId)||placements.some(p=>p.itemId===nextId))
   return {ok:false,reason:'OUTPUT_NOT_OWNED'};
  items=[...items,{id:nextId,definitionId:recipe.output,quantity:recipe.outputQty,...(condition?{condition}:{})}];
 }
 const nextPlacements=prev?placements:[...placements,{itemId:items.at(-1).id,location:{kind:'inventory',ownerId}}];
 return {ok:true,itemWorld:{...itemWorld,items,placements:nextPlacements},recipe,allocations:plan.allocations};
}
