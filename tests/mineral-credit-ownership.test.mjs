import {test} from 'node:test';
import assert from 'node:assert/strict';
import {creditMineralOutputs05E} from '../src/mineral-credit-05e.js';
const reward=[{itemId:'item05a:stone',quantity:2}];
const stack=(owner='player',definitionId='item05a:stone')=>({
 items:[{id:'mineral05e:item05a:stone',definitionId,quantity:1}],
 placements:[{itemId:'mineral05e:item05a:stone',location:{kind:'inventory',ownerId:owner}}],
 containers:[]
});
test('mineral extraction credits a new owned stack without mutating input',()=>{
 const initial={items:[],placements:[],containers:[]};
 const result=creditMineralOutputs05E(initial,'player',reward);
 assert.equal(result.items[0].quantity,2);
 assert.equal(result.placements[0].location.ownerId,'player');
 assert.deepEqual(initial,{items:[],placements:[],containers:[]});
});
test('mineral extraction accumulates into an already owned stack and keeps identity',()=>{
 const initial=stack(),before=structuredClone(initial);
 const result=creditMineralOutputs05E(initial,'player',reward);
 assert.equal(result.items.length,1);
 assert.equal(result.items[0].quantity,3);
 assert.deepEqual(initial,before);
});
test('foreign-owned and misidentified mineral stack IDs fail closed without mutation',()=>{
 for(const initial of [stack('other'),stack('player','item05a:coal')]){
  const before=structuredClone(initial);
  assert.throws(()=>creditMineralOutputs05E(initial,'player',reward),/MINERAL_OUTPUT_NOT_OWNED/);
  assert.deepEqual(initial,before);
 }
});
test('invalid mineral outputs cannot partially credit earlier rewards',()=>{
 const original={items:[],placements:[],containers:[]};
 assert.throws(()=>creditMineralOutputs05E(original,'player',[...reward,{itemId:'item05a:coal',quantity:0}]),/INVALID_MINERAL_OUTPUT/);
 assert.deepEqual(original,{items:[],placements:[],containers:[]});
});
