import {test} from 'node:test';
import assert from 'node:assert/strict';
import {craftBatch1,craftPreview1} from '../src/crafting-batch-stage1.js';
import {craftUntilStage1} from '../src/crafting-workshop-stage1.js';
const world=()=>({items:[
 {id:'oak:a',definitionId:'item05h:oak-planks',quantity:2},
 {id:'oak:b',definitionId:'item05h:oak-planks',quantity:4},
 {id:'rope',definitionId:'item05l:grass-rope',quantity:3},
 {id:'foreign',definitionId:'item05h:oak-planks',quantity:9}
],placements:[
 {itemId:'oak:a',location:{kind:'inventory',ownerId:'p'}},
 {itemId:'oak:b',location:{kind:'inventory',ownerId:'p'}},
 {itemId:'rope',location:{kind:'inventory',ownerId:'p'}},
 {itemId:'foreign',location:{kind:'inventory',ownerId:'other'}}
],containers:[]});
const qty=(w,id)=>w.items.find(x=>x.id===id)?.quantity??0;
test('pinned stack consumes selected instance only',()=>{
 const original=world();
 assert.equal(craftPreview1(original,'p','craft05l:wood-basket',{}, {0:'oak:b'}).ok,true);
 const result=craftBatch1(original,'p','craft05l:wood-basket',1,{}, {0:'oak:b'});
 assert.equal(result.ok,true);
 assert.equal(qty(result.itemWorld,'oak:a'),2);
 assert.equal(qty(result.itemWorld,'oak:b'),2);
 assert.equal(qty(result.itemWorld,'foreign'),9);
 assert.deepEqual(original,world());
});
test('other-owner, nonexistent, incompatible and insufficient pin reject atomically',()=>{
 const initial=world();
 for(const [pin,count] of [['foreign',1],['missing',1],['rope',1],['oak:a',2]]){
  const result=craftBatch1(initial,'p','craft05l:wood-basket',count,{}, {0:pin});
  assert.equal(result.ok,false,pin);
  assert.deepEqual(initial,world());
 }
 assert.equal(craftBatch1(initial,'p','craft05l:wood-basket',1,{}, {5:'oak:b'}).reason,'INVALID_STACK_CHOICE');
});
test('stop-on-shortage honors chosen stack; cannot consume another matching stack',()=>{
 const original=world();
 const partial=craftUntilStage1(original,'p','craft05l:wood-basket',5,{}, {0:'oak:b'});
 assert.equal(partial.ok,true);
 assert.equal(partial.completed,2);
 assert.equal(partial.stopReason,'INSUFFICIENT_MATERIAL');
 assert.equal(qty(partial.itemWorld,'oak:a'),2);
 assert.equal(qty(partial.itemWorld,'foreign'),9);
});
test('pinned stack and chosen species must both match',()=>{
 const original=world();
 assert.equal(craftPreview1(original,'p','craft05l:wood-basket',{0:'item05m:birch-planks'},{0:'oak:b'}).ok,false);
 assert.deepEqual(original,world());
});
