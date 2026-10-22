import type { DefinitionId } from '../core/contracts.js';
import type { ItemDefinition, MaterialDefinition, EffectDefinition, ItemInstanceDraft, RecipeDefinition } from './item-model.js';

export interface ItemCatalog {
  readonly items: readonly ItemDefinition[];
  readonly materials: readonly MaterialDefinition[];
  readonly effects: readonly EffectDefinition[];
  readonly categories: readonly DefinitionId[];
  readonly rarities: readonly DefinitionId[];
  readonly recipes?: readonly RecipeDefinition[];
}
export interface ValidationIssue {
  readonly path: string;
  readonly code: string;
}
export interface ItemRegistry {
  readonly items: ReadonlyMap<string, ItemDefinition>;
  readonly materials: ReadonlyMap<string, MaterialDefinition>;
  readonly effects: ReadonlyMap<string, EffectDefinition>;
  readonly categories: ReadonlySet<string>;
  readonly rarities: ReadonlySet<string>;
  readonly recipes: ReadonlyMap<string, RecipeDefinition>;
}
const record = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const id = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const integer = (v: unknown): v is number => Number.isSafeInteger(v);
const issue = (issues: ValidationIssue[], path: string, code: string): void => { issues.push({ path, code }); };
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(id);
const entries = (v: unknown): [string, unknown][] => record(v) ? Object.entries(v) : [];
function ids<T extends { readonly id: string }>(values: readonly T[], path: string, issues: ValidationIssue[]): Map<string, T> {
  const out = new Map<string, T>();
  if (!Array.isArray(values)) { issue(issues,path,'NOT_ARRAY'); return out; }
  values.forEach((entry, i) => {
    if (!record(entry) || !id(entry.id)) { issue(issues,`${path}[${i}].id`,'INVALID_ID'); return; }
    if (out.has(entry.id)) issue(issues,`${path}[${i}].id`,'DUPLICATE_ID');
    else out.set(entry.id,entry as T);
  });
  return out;
}
export function buildItemRegistry(catalog: ItemCatalog): { registry: ItemRegistry | null; issues: readonly ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const items=ids(catalog.items,'items',issues), materials=ids(catalog.materials,'materials',issues);
  const effects=ids(catalog.effects,'effects',issues), recipes=ids(catalog.recipes??[],'recipes',issues);
  const categories=new Set<string>(), rarities=new Set<string>();
  for (const [key,arr,target] of [['categories',catalog.categories,categories],['rarities',catalog.rarities,rarities]] as const) {
    if (!strings(arr)) { issue(issues,key,'INVALID_IDS'); continue; }
    for (const [i,x] of arr.entries()) { if (target.has(x)) issue(issues,`${key}[${i}]`,'DUPLICATE_ID'); target.add(x); }
  }
  for(const [itemId, item] of items) {
    const path=`items.${itemId}`;
    if(!id(item.nameKey)||!strings(item.tags)||!strings(item.capabilities)) issue(issues,path,'INVALID_DEFINITION');
    if(!categories.has(item.categoryId)) issue(issues,path+'.categoryId','UNKNOWN_CATEGORY');
    if(item.allowsMaterial !== undefined && typeof item.allowsMaterial !== 'boolean') issue(issues,path+'.allowsMaterial','INVALID_POLICY');
    if(item.defaultMaterialId !== undefined) {
      if(item.allowsMaterial !== true) issue(issues,path+'.defaultMaterialId','MATERIAL_NOT_ALLOWED');
      if(!materials.has(item.defaultMaterialId)) issue(issues,path+'.defaultMaterialId','UNKNOWN_MATERIAL');
    }
    if(item.data !== undefined && (!record(item.data) || entries(item.data).some(([,v])=> !(typeof v === 'string' || typeof v === 'boolean' || finite(v))))) issue(issues,path+'.data','INVALID_DATA');
  }
  for(const [kind,defs] of [['materials', materials], ['effects',effects]] as const) {
    for (const [key,val] of defs) {
      const path=`${kind}.${key}`;
      if(!id(val.nameKey)||!strings(val.tags)) issue(issues,path,'INVALID_DEFINITION');
      if(kind==='materials') {
        const props=(val as MaterialDefinition).properties;
        if(!record(props)||entries(props).some(([,v])=>!finite(v))) issue(issues,path+'.properties','INVALID_PROPERTIES');
      }
    }
  }
  for(const [key,recipe] of recipes) {
    const path=`recipes.${key}`;
    if(!id(recipe.resultDefinitionId) || !items.has(recipe.resultDefinitionId)) issue(issues,path+'.resultDefinitionId','UNKNOWN_ITEM');
    if(!strings(recipe.stationTags)||!Array.isArray(recipe.ingredients)) { issue(issues,path,'INVALID_RECIPE'); continue; }
    recipe.ingredients.forEach((req,i)=>{
      const p=`${path}.ingredients[${i}]`;
      if(!record(req)||!integer(req.quantity)||req.quantity<1||!Array.isArray(req.anyOf)||req.anyOf.length===0) { issue(issues,p,'INVALID_INGREDIENT'); return; }
      if(req.optional!==undefined&&typeof req.optional!=='boolean') issue(issues,p,'INVALID_OPTIONAL');
      req.anyOf.forEach((matcher,j)=>{
        const q=`${p}.anyOf[${j}]`;
        if(!record(matcher)) { issue(issues,q,'INVALID_MATCHER');return; }
        if(matcher.kind==='item' && (!id(matcher.definitionId) || !items.has(matcher.definitionId))) issue(issues,q,'UNKNOWN_ITEM');
        else if(matcher.kind==='material' && (!id(matcher.materialId) || !materials.has(matcher.materialId))) issue(issues,q,'UNKNOWN_MATERIAL');
        else if(matcher.kind==='category' && (!id(matcher.categoryId) || !categories.has(matcher.categoryId))) issue(issues,q,'UNKNOWN_CATEGORY');
        else if(matcher.kind==='tag'&&!id(matcher.tag)) issue(issues,q,'INVALID_TAG');
        else if(!['item','material','category','tag'].includes(String(matcher.kind))) issue(issues,q,'INVALID_MATCHER');
      });
    });
  }
  const registry: ItemRegistry={items,materials,effects,categories,rarities,recipes};
  return {registry:issues.length?null:registry,issues};
}
export function validateItemInstances(instances: readonly ItemInstanceDraft[], registry: ItemRegistry): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [], seen=new Set<string>();
  if(!Array.isArray(instances)) return [{path:'instances',code:'NOT_ARRAY'}];
  instances.forEach((item,i)=>{
    const p=`instances[${i}]`;
    if(!record(item)||!id(item.id)||!id(item.definitionId)) { issue(issues,p,'INVALID_INSTANCE');return; }
    if(seen.has(item.id)) issue(issues,p+'.id','DUPLICATE_ID'); else seen.add(item.id);
    const definition=registry.items.get(item.definitionId);
    if(!definition) issue(issues,p+'.definitionId','UNKNOWN_ITEM');
    if(!integer(item.quantity)||item.quantity<1) issue(issues,p+'.quantity','INVALID_QUANTITY');
    if(item.materialId!==undefined) {
      if(!id(item.materialId) || !registry.materials.has(item.materialId)) issue(issues,p+'.materialId','UNKNOWN_MATERIAL');
      if(definition?.allowsMaterial!==true) issue(issues,p+'.materialId','MATERIAL_NOT_ALLOWED');
    }
    if(item.quality!==undefined&&!finite(item.quality)) issue(issues,p+'.quality','INVALID_QUALITY');
    if(item.enhancementLevel!==undefined&&!integer(item.enhancementLevel)) issue(issues,p+'.enhancementLevel','INVALID_ENHANCEMENT');
    if(item.rarityId!==undefined && (!id(item.rarityId) || !registry.rarities.has(item.rarityId))) issue(issues,p+'.rarityId','UNKNOWN_RARITY');
    if(item.effects!==undefined){
      if(!Array.isArray(item.effects)) issue(issues,p+'.effects','INVALID_EFFECTS');
      else item.effects.forEach((e,j)=>{
        const q=`${p}.effects[${j}]`;
        if(!record(e) || !id(e.definitionId) || !registry.effects.has(e.definitionId)) issue(issues,q,'UNKNOWN_EFFECT');
        else if(e.level!==undefined&&!finite(e.level)) issue(issues,q+'.level','INVALID_EFFECT_LEVEL');
      });
    }
    if(item.condition!==undefined&&(!record(item.condition)||entries(item.condition).some(([,v])=>!(typeof v==='string'||typeof v==='boolean'||finite(v))))) issue(issues,p+'.condition','INVALID_CONDITION');
    // Unknown fields are deliberately rejected: they could affect stacking or gameplay.
    for(const key of Object.keys(item)) if(!['id','definitionId','quantity','materialId','quality','rarityId','enhancementLevel','effects','condition'].includes(key)) issue(issues,p+'.'+key,'UNKNOWN_FIELD');
  });
  return issues;
}
/** Conservative equivalence: all non-identity, non-quantity attributes must match.
 * Effects arrays retain their order until effect ordering semantics are decided.
 * Objects have canonical key order; never drop unknown gameplay attributes.
 */
function canonical(value: unknown): string {
  if(Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if(record(value)) return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
export function canStackItems(a: ItemInstanceDraft,b: ItemInstanceDraft,registry:ItemRegistry): boolean {
  if(validateItemInstances([a],registry).length || validateItemInstances([b],registry).length) return false;
  const signature=(item: ItemInstanceDraft): string => {
    const {id: _id,quantity: _quantity,...properties}=item;
    return canonical(properties);
  };
  return signature(a)===signature(b);
}
export function mergeItemStacks(a:ItemInstanceDraft,b:ItemInstanceDraft,registry:ItemRegistry):ItemInstanceDraft|null {
  if(!canStackItems(a,b,registry)||a.id===b.id||!Number.isSafeInteger(a.quantity+b.quantity)) return null;
  return {...a,quantity:a.quantity+b.quantity};
}
