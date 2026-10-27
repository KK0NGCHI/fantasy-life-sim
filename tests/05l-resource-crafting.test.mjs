import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REFINING_BY_ID_05H,REFINED_ITEMS_05H,refineMineral05H} from '../src/mineral-refining-05h.js';
import {CRAFTING_RECIPES_05L} from '../src/resource-crafting-05l.js';
const make=spec=>({items:spec.map(([id,definitionId,quantity])=>({id,definitionId,quantity})),placements:spec.map(([id])=>({itemId:id,location:{kind:'inventory',ownerId:'player'}}))});
test('05-L recipes and outputs are registered',()=>{
 for(const r of CRAFTING_RECIPES_05L){assert.equal(REFINING_BY_ID_05H.get(r.id),r);assert.ok(REFINED_ITEMS_05H.some(x=>x.id===r.output));}
});
test('grass rope and generic wood-plank basket actually consume and credit inventory',()=>{
 const start=make([['g','item05a:grass',3],['w','item05h:oak-planks',2]]);
 const rope=refineMineral05H(start,'player','craft05l:grass-rope');
 assert.equal(rope.ok,true);
 assert.equal(rope.itemWorld.items.find(x=>x.definitionId==='item05l:grass-rope').quantity,1);
 const basket=refineMineral05H(rope.itemWorld,'player','craft05l:wood-basket');
 assert.equal(basket.ok,true);
 assert.equal(basket.itemWorld.items.find(x=>x.definitionId==='item05l:wood-basket').quantity,1);
 assert.equal(basket.itemWorld.items.some(x=>x.definitionId==='item05l:grass-rope'),false);
 assert.equal(basket.itemWorld.items.some(x=>x.definitionId==='item05h:oak-planks'),false);
 assert.equal(start.items.length,2);
});
test('wrong material, shortage and foreign ownership leave original state unchanged',()=>{
 const fixtures=[
  [make([['g','item05a:grass',2]]),'craft05l:grass-rope','player'],
  [make([['s','item05h:cut-stone',2],['r','item05l:grass-rope',1]]),'craft05l:wood-basket','player'],
  [make([['w','item05h:oak-planks',2],['r','item05l:grass-rope',1]]),'craft05l:wood-basket','other']
 ];
 for(const [world,id,owner] of fixtures){const before=structuredClone(world);const result=refineMineral05H(world,owner,id);assert.equal(result.ok,false);assert.equal(result.reason,'INSUFFICIENT_MATERIAL');assert.deepEqual(world,before);}
});
