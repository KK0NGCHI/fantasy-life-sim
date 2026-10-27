import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REFINING_RECIPES_05H,REFINING_BY_ID_05H,REFINED_ITEMS_05H,refineMineral05H} from '../src/mineral-refining-05h.js';
import {LIFESTYLE_CRAFT_RECIPES_05N,LIFESTYLE_CRAFT_ITEMS_05N} from '../src/lifestyle-crafting-05n.js';
import {readCraftMaterials05N} from '../src/material-composition-05n.js';
const make=xs=>({items:xs.map(([definitionId,quantity],i)=>({id:'s:'+i,definitionId,quantity})),placements:xs.map((_,i)=>({itemId:'s:'+i,location:{kind:'inventory',ownerId:'p'}}))});
const output=(w,id)=>w.items.find(x=>x.definitionId===id);
test('six new recipes and item outputs registered without altering legacy 17',()=>{
 assert.equal(REFINING_RECIPES_05H.length,17);assert.equal(LIFESTYLE_CRAFT_ITEMS_05N.length,6);assert.equal(LIFESTYLE_CRAFT_RECIPES_05N.length,6);
 for(const r of LIFESTYLE_CRAFT_RECIPES_05N){assert.equal(REFINING_BY_ID_05H.get(r.id),r);assert.ok(REFINED_ITEMS_05H.some(i=>i.id===r.output));}
});
test('wooden stool uses multiple species with direct-material receipts and segregated stacks',()=>{
 const first=refineMineral05H(make([['item05m:birch-planks',3],['item05l:grass-rope',1]]),'p','craft05n:wooden-stool');
 assert.equal(first.ok,true);
 assert.deepEqual(readCraftMaterials05N(output(first.itemWorld,'item05n:wooden-stool')),[{definitionId:'item05l:grass-rope',quantity:1},{definitionId:'item05m:birch-planks',quantity:3}]);
 let w={...first.itemWorld,items:[...first.itemWorld.items,{id:'oak',definitionId:'item05h:oak-planks',quantity:3},{id:'rope',definitionId:'item05l:grass-rope',quantity:1}],placements:[...first.itemWorld.placements,{itemId:'oak',location:{kind:'inventory',ownerId:'p'}},{itemId:'rope',location:{kind:'inventory',ownerId:'p'}}]};
 const second=refineMineral05H(w,'p','craft05n:wooden-stool');assert.equal(second.ok,true);
 const stools=second.itemWorld.items.filter(i=>i.definitionId==='item05n:wooden-stool');
 assert.equal(stools.length,2);assert.notEqual(stools[0].condition.materials05n,stools[1].condition.materials05n);
});
test('each new textile and woodworking output consumes exact materials',()=>{
 for(const [recipeId,ingredients,resultId] of [
  ['craft05n:wooden-shelf',[['item05m:willow-planks',4],['item05m:refined-pine-resin',1]],'item05n:wooden-shelf'],
  ['craft05n:cloth-pouch',[['item05m:plant-cloth',2],['item05m:plant-yarn',1]],'item05n:cloth-pouch'],
  ['craft05n:bark-journal-cover',[['item05m:birch-bark-sheet',2],['item05m:plant-yarn',1]],'item05n:bark-journal-cover'],
  ['craft05n:braided-mat',[['item05m:willow-strips',3],['item05m:plant-yarn',2]],'item05n:braided-mat'],
  ['craft05n:resin-wood-tray',[['item05h:oak-planks',2],['item05m:refined-pine-resin',1]],'item05n:resin-wood-tray']
 ]){
  const w=make(ingredients),r=refineMineral05H(w,'p',recipeId);
  assert.equal(r.ok,true,recipeId+':'+r.reason);
  assert.equal(output(r.itemWorld,resultId).quantity,1);
  assert.equal(readCraftMaterials05N(output(r.itemWorld,resultId)).length,ingredients.length);
  assert.ok(ingredients.every(([id])=>!r.itemWorld.items.some(x=>x.definitionId===id)));
  assert.deepEqual(w,make(ingredients));
 }
});
test('failed craft is atomic for missing or incompatible inputs',()=>{
 const w=make([['item05m:plant-cloth',1],['item05h:cut-stone',8]]);
 const before=structuredClone(w);const r=refineMineral05H(w,'p','craft05n:cloth-pouch');
 assert.equal(r.ok,false);assert.equal(r.reason,'INSUFFICIENT_MATERIAL');assert.deepEqual(w,before);
});
