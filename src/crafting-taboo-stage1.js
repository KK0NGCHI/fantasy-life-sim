/** Stage I: narrow crafting taboo. Origin is sourced only from trusted material
 * definitions, never from the action payload or player supplied attributes.
 * Sacred-tree logging and sacred-aquatic capture are separate action policies.
 */
export const TABOO_ORIGIN_CLASS_STAGE1='alien';
export function checkCraftingTabooStage1(recipe,allocations,itemWorld,definitions={}){
 if(!recipe||!Array.isArray(allocations)||!itemWorld||!Array.isArray(itemWorld.items))
  return {ok:false,reason:'INVALID_MATERIAL_PLAN'};
 const isEquipment=recipe.equipmentOutput===true||
  (typeof recipe.output==='string'&&recipe.output.startsWith('tool05a:'));
 if(!isEquipment)return {ok:true};
 const byId=new Map(itemWorld.items.map(i=>[i.id,i.definitionId]));
 for(const allocation of allocations){
  const itemDef=byId.get(allocation.itemId);
  if(!itemDef)return {ok:false,reason:'INVALID_MATERIAL_PLAN'};
  if(definitions[itemDef]?.originClass===TABOO_ORIGIN_CLASS_STAGE1)
   return {ok:false,reason:'ALIEN_EQUIPMENT_TABOO'};
 }
 return {ok:true};
}
