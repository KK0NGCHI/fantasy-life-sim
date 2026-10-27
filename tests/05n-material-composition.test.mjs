import {test} from 'node:test';
import assert from 'node:assert/strict';
import {refineMineral05H} from '../src/mineral-refining-05h.js';
import {readCraftMaterials05N} from '../src/material-composition-05n.js';
const make=entries=>({items:entries.map(([definitionId,quantity],i)=>({id:'stack:'+i,definitionId,quantity})),placements:entries.map((_,i)=>({itemId:'stack:'+i,location:{kind:'inventory',ownerId:'p'}}))});
const crafted=(world,id)=>world.items.find(x=>x.definitionId===id);
test('exact consumed species is displayed in receipt on hybrid basket',()=>{
 const w=make([['item05m:birch-planks',2],['item05l:grass-rope',1]]);
 const r=refineMineral05H(w,'p','craft05l:wood-basket');
 assert.equal(r.ok,true);
 assert.deepEqual(readCraftMaterials05N(crafted(r.itemWorld,'item05l:wood-basket')),[
  {definitionId:'item05l:grass-rope',quantity:1},{definitionId:'item05m:birch-planks',quantity:2}
 ]);
 assert.deepEqual(w.items[0].quantity,2);
});
test('different material species create separate valid stacks',()=>{
 const first=refineMineral05H(make([['item05m:birch-planks',2],['item05l:grass-rope',1]]),'p','craft05l:wood-basket');
 assert.equal(first.ok,true);
 const supplied={...first.itemWorld,
  items:[...first.itemWorld.items,{id:'new:oak',definitionId:'item05h:oak-planks',quantity:2},{id:'new:rope',definitionId:'item05l:grass-rope',quantity:1}],
  placements:[...first.itemWorld.placements,{itemId:'new:oak',location:{kind:'inventory',ownerId:'p'}},{itemId:'new:rope',location:{kind:'inventory',ownerId:'p'}}]
 };
 const second=refineMineral05H(supplied,'p','craft05l:wood-basket');
 assert.equal(second.ok,true);
 const baskets=second.itemWorld.items.filter(i=>i.definitionId==='item05l:wood-basket');
 assert.equal(baskets.length,2);
 assert.notEqual(baskets[0].condition.materials05n,baskets[1].condition.materials05n);
 assert.equal(new Set(baskets.map(x=>x.id)).size,2);
});
test('identical material receipts stack and old fixed-ID crafting remains compatible',()=>{
 let w=make([['item05h:oak-planks',4],['item05l:grass-rope',2]]);
 const one=refineMineral05H(w,'p','craft05l:wood-basket');assert.equal(one.ok,true);
 const two=refineMineral05H(one.itemWorld,'p','craft05l:wood-basket');assert.equal(two.ok,true);
 const stacks=two.itemWorld.items.filter(i=>i.definitionId==='item05l:wood-basket');
 assert.equal(stacks.length,1);assert.equal(stacks[0].quantity,2);
 const legacy=refineMineral05H(make([['item05a:stone',2]]),'p','refine05h:stone');
 assert.equal(legacy.ok,true);
 assert.equal(crafted(legacy.itemWorld,'item05h:cut-stone').id,'refined05h:item05h:cut-stone');
 assert.equal(readCraftMaterials05N(crafted(legacy.itemWorld,'item05h:cut-stone')),null);
});
test('shortage rejects without changing inventory or recording receipts',()=>{
 const state=make([['item05m:birch-planks',1],['item05l:grass-rope',1]]),before=structuredClone(state);
 const result=refineMineral05H(state,'p','craft05l:wood-basket');
 assert.equal(result.ok,false);assert.deepEqual(state,before);
});
