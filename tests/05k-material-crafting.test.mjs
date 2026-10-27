import {test} from 'node:test';
import assert from 'node:assert/strict';
import {craftWithAllocatedMaterials} from '../src/material-crafting-05k.js';
import {refineMineral05H} from '../src/mineral-refining-05h.js';
const world=(items,owner='p')=>({items:items.map(([id,definitionId,quantity])=>({id,definitionId,quantity})),placements:items.map(([id])=>({itemId:id,location:{kind:'inventory',ownerId:owner}}))});
test('05-K exact old recipe keeps output identity, consumes and credits atomically',()=>{
 const start=world([['a','item05a:copper-ore',2]]);
 const result=refineMineral05H(start,'p','refine05h:copper');
 assert.equal(result.ok,true);
 assert.equal(result.itemWorld.items.find(i=>i.definitionId==='item05h:copper-ingot').quantity,1);
 assert.equal(start.items[0].quantity,2);
});
test('05-K exact and flexible inputs cannot allocate same stock twice',()=>{
 const start=world([['oak','oak-plank',2],['birch','birch-plank',2]]);
 const recipe={output:'furniture:chair',outputQty:1,inputs:[{material:{family:'wood',form:'plank'},quantity:2},{itemId:'oak-plank',quantity:2}]};
 const definitions={'oak-plank':{family:'wood',form:'plank'},'birch-plank':{family:'wood',form:'plank'}};
 const made=craftWithAllocatedMaterials(start,'p',recipe,definitions);
 assert.equal(made.ok,true);
 assert.deepEqual(made.allocations.filter(x=>x.slotId==='slot:1'),[{slotId:'slot:1',itemId:'oak',quantity:2}]);
 assert.equal(made.itemWorld.items.find(i=>i.definitionId==='furniture:chair').quantity,1);
 assert.equal(start.items.length,2);
});
test('05-K shortage rejects with zero changes',()=>{
 const start=world([['a','item05a:iron-ore',1]]);
 const before=structuredClone(start);
 const result=refineMineral05H(start,'p','refine05h:iron');
 assert.equal(result.ok,false);
 assert.equal(result.reason,'INSUFFICIENT_MATERIAL');
 assert.deepEqual(start,before);
});
test('05-K respects ownership and existing output stack',()=>{
 const start=world([['a','item05a:stone',2],['refined05h:item05h:cut-stone','item05h:cut-stone',4]]);
 const made=refineMineral05H(start,'p','refine05h:stone');
 assert.equal(made.ok,true);
 assert.equal(made.itemWorld.items.find(i=>i.definitionId==='item05h:cut-stone').quantity,5);
 const outsider=world([['a','item05a:stone',2]],'other');
 assert.equal(refineMineral05H(outsider,'p','refine05h:stone').reason,'INSUFFICIENT_MATERIAL');
});
