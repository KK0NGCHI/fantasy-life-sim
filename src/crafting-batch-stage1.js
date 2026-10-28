import {REFINING_BY_ID_05H,refineMineral05H} from './mineral-refining-05h.js';
import {CRAFTING_MATERIALS_05L} from './resource-crafting-05l.js';
import {FOREST_MATERIALS_05M} from './forest-resources-05m.js';
import {FIBER_MATERIALS_05M} from './fiber-crafting-05m.js';
import {planMaterialAllocation} from './material-compatibility-05j.js';

export const CRAFTING_DEFINITIONS_1=Object.freeze({...CRAFTING_MATERIALS_05L,...FOREST_MATERIALS_05M,...FIBER_MATERIALS_05M});
export const CRAFTING_BATCH_LIMIT_1=20;
export function craftPreview1(itemWorld,ownerId,recipeId,choices={},stackChoices={}){
 const recipe=REFINING_BY_ID_05H.get(recipeId);
 if(!recipe)return {ok:false,reason:'UNKNOWN_RECIPE'};
 const inputs=recipe.inputs??[{itemId:recipe.input,quantity:recipe.inputQty}];
 if(!choices||typeof choices!=='object'||Array.isArray(choices)||Object.entries(choices).some(([k,v])=>
  !/^(0|[1-9][0-9]*)$/.test(k)||Number(k)>=inputs.length||typeof v!=='string'||!v||inputs[Number(k)].itemId))
  return {ok:false,reason:'INVALID_MATERIAL_CHOICE'};
 if(!stackChoices||typeof stackChoices!=='object'||Array.isArray(stackChoices)||Object.entries(stackChoices).some(([k,v])=>
  !/^(0|[1-9][0-9]*)$/.test(k)||Number(k)>=inputs.length||typeof v!=='string'||!v))
  return {ok:false,reason:'INVALID_STACK_CHOICE'};
 const slots=inputs.map((x,i)=>({
  slotId:'slot:'+i,quantity:x.quantity,...(stackChoices[i]?{allowedItemId:stackChoices[i]}:{}),...(x.itemId?{exactId:x.itemId}:{material:x.material,...(choices[i]?{allowedDefinitionId:choices[i]}:{})})
 }));
 const owned=new Set(itemWorld.placements.filter(p=>p.location?.kind==='inventory'&&p.location.ownerId===ownerId).map(p=>p.itemId));
 const stocks=itemWorld.items.filter(i=>owned.has(i.id)&&i.quantity>0).map(i=>({...i,...(CRAFTING_DEFINITIONS_1[i.definitionId]??{})}));
 return {...planMaterialAllocation(stocks,slots),slots};
}
/** Atomic bulk craft: all results commit together; shortage rejects without spending turns.
 * Same sequential algorithm as manual, so receipts and stack identities stay identical.
 */
export function craftBatch1(itemWorld,ownerId,recipeId,count,choices={}){
 if(!Number.isSafeInteger(count)||count<1||count>CRAFTING_BATCH_LIMIT_1)
  return {ok:false,reason:'INVALID_BATCH_COUNT'};
 const recipe=REFINING_BY_ID_05H.get(recipeId);
 if(!recipe)return {ok:false,reason:'UNKNOWN_RECIPE'};
 if(!Number.isSafeInteger(recipe.seconds)||recipe.seconds<1||!Number.isSafeInteger(recipe.seconds*count))
  return {ok:false,reason:'INVALID_RECIPE'};
 let current=itemWorld;
 for(let i=0;i<count;i++){
  const result=refineMineral05H(current,ownerId,recipeId,choices,stackChoices);
  if(!result.ok)return {ok:false,reason:result.reason,failedAt:i+1};
  current=result.itemWorld;
 }
 return {ok:true,itemWorld:current,recipe,count,seconds:recipe.seconds*count};
}
