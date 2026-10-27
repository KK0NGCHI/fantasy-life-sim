import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RESOURCES_05A,RESOURCE_MAP_05A,createResourceNodes05A,gatherResource05A} from '../src/resources-05a.js';
import {REFINING_RECIPES_05H,REFINING_BY_ID_05H,REFINED_ITEMS_05H,refineMineral05H} from '../src/mineral-refining-05h.js';
import {FIBER_ITEMS_05M,FIBER_RECIPES_05M,FIBER_MATERIALS_05M} from '../src/fiber-crafting-05m.js';
const world=(entries)=>({items:entries.map(([definitionId,quantity],i)=>({id:'stack:'+i,definitionId,quantity})),placements:entries.map((_,i)=>({itemId:'stack:'+i,location:{kind:'inventory',ownerId:'player'}}))});
const qty=(w,id)=>w.items.filter(i=>i.definitionId===id).reduce((sum,i)=>sum+i.quantity,0);
test('all three plants have region-specific, harvestable, deterministic resource nodes',()=>{
 const nodes=createResourceNodes05A();
 for(const [key,region] of [['reed','습지'],['flax','초원·농경지'],['nettle','숲']]){
  const id='resource05a:'+key+':01';
  assert.ok(nodes[id],id);
  const result=gatherResource05A(nodes,id,region,0);
  assert.equal(result.ok,true,id);
  assert.equal(result.resource.itemId,'item05a:'+key);
  assert.equal(result.node.remaining,nodes[id].remaining-1);
  assert.equal(gatherResource05A(nodes,id,'거점 마을',0).ok,false);
 }
 assert.equal(RESOURCES_05A.length,17);
});
test('fiber content registers alongside unchanged 17 legacy crafting recipes',()=>{
 assert.equal(REFINING_RECIPES_05H.length,17);
 assert.equal(FIBER_ITEMS_05M.length,6);
 assert.equal(FIBER_RECIPES_05M.length,6);
 for(const recipe of FIBER_RECIPES_05M){
  assert.equal(REFINING_BY_ID_05H.get(recipe.id),recipe);
  assert.ok(REFINED_ITEMS_05H.some(i=>i.id===recipe.output));
 }
});
test('each species can enter the same generic spinning and weaving recipe',()=>{
 for(const key of ['reed','flax','nettle']){
  let state=world([['item05a:'+key,4]]);
  const separated=refineMineral05H(state,'player','refine05m:'+key+'-fiber');
  assert.equal(separated.ok,true,key);
  assert.equal(qty(separated.itemWorld,'item05m:'+key+'-fiber'),2);
  const spun=refineMineral05H(separated.itemWorld,'player','refine05m:plant-yarn');
  assert.equal(spun.ok,true,key);
  assert.equal(qty(spun.itemWorld,'item05m:plant-yarn'),2);
  assert.equal(qty(state,'item05a:'+key),4);
 }
 let flax=world([['item05m:plant-yarn',3]]);
 const cloth=refineMineral05H(flax,'player','refine05m:plant-cloth');
 assert.equal(cloth.ok,true);
 assert.equal(qty(cloth.itemWorld,'item05m:plant-cloth'),1);
});
test('mixed fiber stacks satisfy shared slots without overspending',()=>{
 const start=world([['item05m:reed-fiber',1],['item05m:flax-fiber',1]]);
 const result=refineMineral05H(start,'player','refine05m:plant-yarn');
 assert.equal(result.ok,true);
 assert.equal(qty(result.itemWorld,'item05m:plant-yarn'),2);
 assert.equal(qty(start,'item05m:reed-fiber'),1);
});
test('unrelated or missing inputs reject without mutating inventory',()=>{
 for(const initial of [[['item05a:grass',2]],[['item05m:reed-fiber',1]],[['item05m:plant-yarn',2]]]){
  const state=world(initial),before=structuredClone(state);
  const id=initial[0][0]==='item05m:plant-yarn'?'refine05m:plant-cloth':'refine05m:plant-yarn';
  const outcome=refineMineral05H(state,'player',id);
  assert.equal(outcome.ok,false);
  assert.equal(outcome.reason,'INSUFFICIENT_MATERIAL');
  assert.deepEqual(state,before);
 }
});
