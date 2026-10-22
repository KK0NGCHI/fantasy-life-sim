import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildItemRegistry,validateItemInstances,canStackItems,mergeItemStacks } from '../dist/engine/data/item-registry.js';
const catalog=()=>({
 categories:['core:material','core:weapon'],rarities:['core:common','core:rare'],
 items:[
 {id:'core:iron_sword',nameKey:'item.sword',categoryId:'core:weapon',tags:['weapon:sword'],capabilities:['equip'],allowsMaterial:true,defaultMaterialId:'core:iron'},
 {id:'core:wheat',nameKey:'item.wheat',categoryId:'core:material',tags:['edible'],capabilities:['eat']}
 ],
 materials:[{id:'core:iron',nameKey:'mat.iron',tags:['metal'],properties:{hardness:1}}],
 effects:[{id:'core:glow',nameKey:'effect.glow',tags:[]}],
 recipes:[{id:'core:smith',stationTags:['anvil'],resultDefinitionId:'core:iron_sword',ingredients:[{quantity:1,anyOf:[{kind:'material',materialId:'core:iron'},{kind:'item',definitionId:'core:wheat'}]}]}]
});
const sword=(id='a')=>({id,definitionId:'core:iron_sword',quantity:1,materialId:'core:iron',quality:2,rarityId:'core:common',enhancementLevel:0,effects:[{definitionId:'core:glow',level:1}]});
const valid=()=>{const r=buildItemRegistry(catalog());assert.deepEqual(r.issues,[]);assert.ok(r.registry);return r.registry;};
test('valid definitions and recipe references form a registry',()=>{const r=valid();assert.equal(r.items.size,2);assert.equal(r.recipes.size,1);});
test('duplicate definition IDs and unknown categories/materials/recipe references rejected',()=>{
 const c=catalog();c.items.push({...c.items[0]});c.items[1].categoryId='missing';c.recipes[0].resultDefinitionId='missing';c.materials=[];
 const result=buildItemRegistry(c);
 assert.equal(result.registry,null);
 assert.ok(result.issues.some(i=>i.code==='DUPLICATE_ID'));
 assert.ok(result.issues.some(i=>i.code==='UNKNOWN_CATEGORY'));
 assert.ok(result.issues.some(i=>i.code==='UNKNOWN_MATERIAL'));
 assert.ok(result.issues.some(i=>i.code==='UNKNOWN_ITEM'));
});
test('quality, rarity and enhancement are separate validated attributes',()=>{
 const r=valid();const a=sword();assert.deepEqual(validateItemInstances([a],r),[]);
 assert.deepEqual(validateItemInstances([{...a,quality:1,rarityId:'core:rare',enhancementLevel:2}],r),[]);
 assert.ok(validateItemInstances([{...a,rarityId:'missing'}],r).some(i=>i.code==='UNKNOWN_RARITY'));
 assert.ok(validateItemInstances([{...a,quality:Infinity}],r).some(i=>i.code==='INVALID_QUALITY'));
});
test('material only allowed on opted-in definitions',()=>{
 const r=valid();const wheat={id:'w',definitionId:'core:wheat',quantity:1,materialId:'core:iron'};
 assert.ok(validateItemInstances([wheat],r).some(i=>i.code==='MATERIAL_NOT_ALLOWED'));
 assert.deepEqual(validateItemInstances([{id:'w',definitionId:'core:wheat',quantity:1}],r),[]);
});
test('stacking only identical gameplay attributes; no silent data loss',()=>{
 const r=valid(),a=sword('a'),b=sword('b');
 assert.equal(canStackItems(a,b,r),true);
 assert.deepEqual(mergeItemStacks(a,b,r),{...a,quantity:2});
 for(const difference of [{quality:3},{rarityId:'core:rare'},{enhancementLevel:1},{materialId:undefined},{effects:[]},{condition:{freshness:1}},{unknownBonus:3}]){
  assert.equal(canStackItems(a,{...b,...difference},r),false);
 }
 assert.equal(mergeItemStacks(a,{...b,quality:3},r),null);
});
test('invalid quantities and duplicated instance IDs are rejected',()=>{
 const r=valid();assert.ok(validateItemInstances([sword('a'),sword('a')],r).some(i=>i.code==='DUPLICATE_ID'));
 assert.ok(validateItemInstances([{...sword(),quantity:0}],r).some(i=>i.code==='INVALID_QUANTITY'));
});
