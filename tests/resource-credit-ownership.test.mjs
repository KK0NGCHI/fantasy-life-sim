import {test} from 'node:test';
import assert from 'node:assert/strict';
import {creditOwnedResource05A} from '../src/resource-credit-05a.js';
const id='ecology05a:item05a:plantago-major',def='item05a:plantago-major';
const state=(owner='p',definitionId=def)=>({items:[{id,definitionId,quantity:2}],
 placements:[{itemId:id,location:{kind:'inventory',ownerId:owner}}],containers:[]});
test('ecology credits create and increment owned inventory stacks without mutating snapshots',()=>{
 const empty={items:[],placements:[],containers:[]};
 const first=creditOwnedResource05A(empty,'p',id,def,1);
 assert.equal(first.items[0].quantity,1);
 assert.equal(first.placements[0].location.ownerId,'p');
 assert.equal(empty.items.length,0);
 const twice=creditOwnedResource05A(first,'p',id,def,2);
 assert.equal(twice.items[0].quantity,3);
 assert.equal(first.items[0].quantity,1);
});
test('ecology stack collisions cannot credit other owners or different items',()=>{
 for(const before of [state('foreign'),state('p','item05a:blueberry')]){
  const snapshot=structuredClone(before);
  assert.throws(()=>creditOwnedResource05A(before,'p',id,def,1),/RESOURCE_STACK_NOT_OWNED/);
  assert.deepEqual(before,snapshot);
 }
});
test('incidental and ecology reward stacks use separate stable identifiers',()=>{
 const starting={items:[],placements:[],containers:[]};
 const harvested=creditOwnedResource05A(starting,'p',id,def,1);
 const observed=creditOwnedResource05A(harvested,'p','incidental05a:'+def,def,1);
 assert.equal(observed.items.length,2);
 assert.equal(observed.items.reduce((n,x)=>n+x.quantity,0),2);
});
test('invalid quantities and overflow cannot mutate resources',()=>{
 const original=state(),snapshot=structuredClone(original);
 for(const amount of [0,-1,1.2,Number.MAX_SAFE_INTEGER]){
  assert.throws(()=>creditOwnedResource05A(original,'p',id,def,amount));
  assert.deepEqual(original,snapshot);
 }
});
