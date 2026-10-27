import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createResourceNodes05A,RESOURCES_05A,workResource05A} from '../src/resources-05a.js';
import {REFINING_BY_ID_05H,REFINED_ITEMS_05H,refineMineral05H,REFINING_RECIPES_05H} from '../src/mineral-refining-05h.js';
import {validateResourceCatalog05A} from '../src/resource-catalog-05a.js';
const stock=(input,plank)=>({
 items:[{id:'log',definitionId:input,quantity:2},{id:'grass-rope',definitionId:'item05l:grass-rope',quantity:1}],
 placements:[{itemId:'log',location:{kind:'inventory',ownerId:'p'}},{itemId:'grass-rope',location:{kind:'inventory',ownerId:'p'}}]
});
test('05-M birch and willow source nodes exist and yield wood only after logging work',()=>{
 const nodes=createResourceNodes05A();
 for(const [suffix,region] of [['birch-log','숲'],['willow-log','습지']]){
  const id='resource05a:'+suffix+':01';
  assert.ok(nodes[id]);
  const result=workResource05A(nodes,id,region,100,{toolKind:'axe',toolRank:1});
  assert.equal(result.ok,true);
  assert.equal(result.qty,0);
  assert.equal(result.resource.itemId,'item05a:'+suffix);
 }
 assert.ok(RESOURCES_05A.some(x=>x.id==='resource05a:birch-log'));
 assert.ok(validateResourceCatalog05A());
});
test('05-M both tree logs become distinct planks and satisfy one generic basket recipe',()=>{
 for(const [species,input,output] of [
  ['birch','item05a:birch-log','item05m:birch-planks'],
  ['willow','item05a:willow-log','item05m:willow-planks']
 ]){
  const first=stock(input);
  const plan=refineMineral05H(first,'p','refine05m:'+species+'-planks');
  assert.equal(plan.ok,true,species+' plank recipe');
  assert.equal(plan.itemWorld.items.find(x=>x.definitionId===output)?.quantity,2);
  const basket=refineMineral05H(plan.itemWorld,'p','craft05l:wood-basket');
  assert.equal(basket.ok,true,species+' basket recipe');
  assert.equal(basket.itemWorld.items.find(x=>x.definitionId==='item05l:wood-basket')?.quantity,1);
  assert.equal(first.items.find(x=>x.definitionId===input).quantity,2);
 }
});
test('05-M invalid plank materials cannot be substituted',()=>{
 const initial=stock('item05a:stone');
 const start=structuredClone(initial);
 const result=refineMineral05H(initial,'p','craft05l:wood-basket');
 assert.equal(result.ok,false);
 assert.equal(result.reason,'INSUFFICIENT_MATERIAL');
 assert.deepEqual(initial,start);
});
test('05-M legacy recipe set remains 17 while integrated registry includes two new recipes',()=>{
 assert.equal(REFINING_RECIPES_05H.length,17);
 assert.ok(REFINING_BY_ID_05H.has('refine05m:birch-planks'));
 assert.ok(REFINING_BY_ID_05H.has('refine05m:willow-planks'));
 assert.ok(REFINED_ITEMS_05H.some(x=>x.id==='item05m:birch-planks'));
 assert.ok(REFINED_ITEMS_05H.some(x=>x.id==='item05m:willow-planks'));
});
