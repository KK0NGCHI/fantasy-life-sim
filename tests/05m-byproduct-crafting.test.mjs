import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BYPRODUCT_CRAFT_ITEMS_05M,BYPRODUCT_CRAFT_RECIPES_05M} from '../src/byproduct-crafting-05m.js';
import {REFINING_RECIPES_05H,REFINING_BY_ID_05H,REFINED_ITEMS_05H,refineMineral05H} from '../src/mineral-refining-05h.js';
import {TREE_BYPRODUCTS_05M} from '../src/tree-byproducts-05m.js';
const make=(entries)=>({items:entries.map(([definitionId,quantity],i)=>({id:'test:'+i,definitionId,quantity})),placements:entries.map((_,i)=>({itemId:'test:'+i,location:{kind:'inventory',ownerId:'p'}}))});
const amount=(w,id)=>w.items.filter(x=>x.definitionId===id).reduce((n,x)=>n+x.quantity,0);
test('five new recipes and outputs are registered without changing 05-H/I',()=>{
 assert.equal(REFINING_RECIPES_05H.length,17);
 assert.equal(BYPRODUCT_CRAFT_RECIPES_05M.length,5);
 assert.equal(BYPRODUCT_CRAFT_ITEMS_05M.length,5);
 for(const recipe of BYPRODUCT_CRAFT_RECIPES_05M){assert.equal(REFINING_BY_ID_05H.get(recipe.id),recipe);assert.ok(REFINED_ITEMS_05H.some(i=>i.id===recipe.output));}
});
test('all raw resource inputs originate in the live tree byproduct list',()=>{
 const obtained=new Set(Object.values(TREE_BYPRODUCTS_05M).flat().map(x=>x.itemId));
 for(const id of ['item05m:pine-resin','item05m:willow-branch','item05m:birch-bark'])assert.ok(obtained.has(id));
});
test('pine resin processing and waterproof basket finish use actual output items',()=>{
 const original=make([['item05m:pine-resin',2],['item05l:wood-basket',1]]);
 const processed=refineMineral05H(original,'p','refine05m:pine-resin');
 assert.equal(processed.ok,true);
 assert.equal(amount(processed.itemWorld,'item05m:refined-pine-resin'),1);
 const finished=refineMineral05H(processed.itemWorld,'p','craft05m:resin-sealed-basket');
 assert.equal(finished.ok,true);
 assert.equal(amount(finished.itemWorld,'item05m:resin-sealed-basket'),1);
 assert.equal(amount(finished.itemWorld,'item05l:wood-basket'),0);
 assert.equal(amount(original,'item05m:pine-resin'),2);
});
test('willow and birch processing combine to make lined basket',()=>{
 let w=make([['item05m:willow-branch',2],['item05m:birch-bark',2],['item05l:wood-basket',1]]);
 for(const recipe of ['refine05m:willow-strips','refine05m:birch-bark-sheet']){const result=refineMineral05H(w,'p',recipe);assert.equal(result.ok,true);w=result.itemWorld;}
 const made=refineMineral05H(w,'p','craft05m:bark-lined-basket');
 assert.equal(made.ok,true);
 assert.equal(amount(made.itemWorld,'item05m:bark-lined-basket'),1);
 assert.equal(amount(made.itemWorld,'item05m:willow-strips'),0);
});
test('shortage and unrelated materials reject without mutating state',()=>{
 const w=make([['item05m:willow-branch',1],['item05l:wood-basket',1]]);
 const before=structuredClone(w);
 assert.equal(refineMineral05H(w,'p','refine05m:willow-strips').reason,'INSUFFICIENT_MATERIAL');
 assert.equal(refineMineral05H(w,'p','craft05m:bark-lined-basket').reason,'INSUFFICIENT_MATERIAL');
 assert.deepEqual(w,before);
});
