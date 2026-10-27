import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROLE_CRAFT_RECIPES_05N,ROLE_CRAFT_ITEMS_05N} from '../src/material-role-crafting-05n.js';
import {refineMineral05H,REFINING_RECIPES_05H,REFINING_BY_ID_05H} from '../src/mineral-refining-05h.js';
import {readCraftMaterials05N} from '../src/material-composition-05n.js';
const make=xs=>({items:xs.map(([definitionId,quantity],i)=>({id:'stack:'+i,definitionId,quantity})),placements:xs.map((_,i)=>({itemId:'stack:'+i,location:{kind:'inventory',ownerId:'p'}}))});
test('four named material-role crafts registered and legacy catalog is unchanged',()=>{
 assert.equal(REFINING_RECIPES_05H.length,17);
 assert.equal(ROLE_CRAFT_RECIPES_05N.length,4);
 assert.equal(ROLE_CRAFT_ITEMS_05N.length,4);
 for(const recipe of ROLE_CRAFT_RECIPES_05N){
  assert.equal(REFINING_BY_ID_05H.get(recipe.id),recipe);
  assert.ok(recipe.inputs.every(x=>['structural','functional','binding'].includes(x.role)));
 }
});
test('all four new material-role recipes consume and retain their immediate ingredients',()=>{
 const examples=[
 ['craft05n:framed-cloth-panel',[['item05m:willow-planks',2],['item05m:plant-cloth',2],['item05m:plant-yarn',1]]],
 ['craft05n:reed-screen',[['item05h:oak-planks',2],['item05m:reed-fiber',3],['item05m:willow-strips',2]]],
 ['craft05n:wooden-writing-board',[['item05m:birch-planks',2],['item05m:birch-bark-sheet',1],['item05m:refined-pine-resin',1]]],
 ['craft05n:resin-bound-case',[['item05m:birch-planks',2],['item05m:birch-bark-sheet',2],['item05m:refined-pine-resin',1]]]
 ];
 for(const [id,inputs] of examples){
  const world=make(inputs),recipe=REFINING_BY_ID_05H.get(id);
  const res=refineMineral05H(world,'p',id);
  assert.equal(res.ok,true,id+': '+res.reason);
  const out=res.itemWorld.items.find(x=>x.definitionId===recipe.output);
  assert.equal(out.quantity,1);
  assert.deepEqual(readCraftMaterials05N(out),inputs.map(([definitionId,quantity])=>({definitionId,quantity})).sort((a,b)=>a.definitionId.localeCompare(b.definitionId)));
  assert.equal(world.items.length,inputs.length);
 }
});
test('untrusted unrelated material is not a compatible structural plank',()=>{
 const world=make([['item05a:stone',2],['item05m:plant-cloth',2],['item05m:plant-yarn',1]]);
 const before=structuredClone(world),result=refineMineral05H(world,'p','craft05n:framed-cloth-panel');
 assert.equal(result.ok,false);assert.equal(result.reason,'INSUFFICIENT_MATERIAL');
 assert.deepEqual(world,before);
});
