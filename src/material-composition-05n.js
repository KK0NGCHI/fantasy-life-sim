/** Minimal ingredients used in the most recent craft, NOT a provenance chain.
 * Stored as a validated string in existing ItemInstance.condition.
 */
export const MATERIALS_CONDITION_05N='materials05n';
export function craftMaterialReceipt05N(itemWorld,allocations){
 if(!Array.isArray(allocations)||!allocations.length)return null;
 const defs=new Map(itemWorld.items.map(i=>[i.id,i.definitionId]));
 const quantities=new Map();
 for(const a of allocations){
  const def=defs.get(a.itemId);
  if(!def||!Number.isSafeInteger(a.quantity)||a.quantity<1)return null;
  quantities.set(def,(quantities.get(def)??0)+a.quantity);
 }
 const rows=[...quantities].sort(([a],[b])=>a.localeCompare(b)).map(([definitionId,quantity])=>({definitionId,quantity}));
 const serialized=JSON.stringify(rows);
 return serialized.length<=4096?serialized:null;
}
export function readCraftMaterials05N(instance){
 const encoded=instance?.condition?.[MATERIALS_CONDITION_05N];
 if(typeof encoded!=='string'||encoded.length>4096)return null;
 try{
  const rows=JSON.parse(encoded);
  if(!Array.isArray(rows)||rows.length<1||rows.length>64)return null;
  const seen=new Set();
  for(const row of rows){
   if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).sort().join(',')!=='definitionId,quantity'||
    typeof row.definitionId!=='string'||!row.definitionId||seen.has(row.definitionId)||
    !Number.isSafeInteger(row.quantity)||row.quantity<1)return null;
   seen.add(row.definitionId);
  }
  return rows;
 }catch{return null;}
}
export const TRACKED_RECIPES_05N=recipe=>/^craft05l:|^craft05m:|^refine05m:/.test(recipe.id??'');
