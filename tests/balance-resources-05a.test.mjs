import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RESOURCE_BALANCE_ROWS_05A} from '../src/balance-resources-05a.js';
import {RESOURCES_05A,RESOURCE_MAP_05A,createResourceNodes05A,resourceAt05A} from '../src/resources-05a.js';

test('provisional resource tuning extraction preserves all twelve original values',()=>{
 const expected={
 'wild-herb':[5,3,7],'mushroom':[4,4,9],'grass':[8,2,3],
 'oak-log':[5,18,30],'pine-log':[4,14,24],
 stone:[12,2,3],coal:[10,0,8],'copper-ore':[12,0,8],'iron-ore':[10,0,11],
 'small-fish':[12,2,10],carp:[8,4,13],trout:[6,5,16]};
 assert.equal(RESOURCE_BALANCE_ROWS_05A.length,12);
 assert.equal(RESOURCES_05A.length,12);
 for(const row of RESOURCE_BALANCE_ROWS_05A){
  assert.ok(Object.isFrozen(row));
  const [key,name,activity,region,capacity,regenDays,xp]=row;
  assert.deepEqual([capacity,regenDays,xp],expected[key]);
  const def=RESOURCE_MAP_05A.get('resource05a:'+key);
  assert.ok(def);
  assert.deepEqual([def.name,def.activity,def.region,def.capacity,def.regenDays,def.xp],[name,activity,region,capacity,regenDays,xp]);
 }
});
test('all initial resource nodes retain same-timestamp and 224-day bounded regrowth',()=>{
 for(const node of Object.values(createResourceNodes05A())){
  const def=RESOURCE_MAP_05A.get(node.resourceId);
  const depleted={...node,remaining:0};
  const end=resourceAt05A(depleted,def,224*86400);
  assert.ok(end.remaining>=0&&end.remaining<=def.capacity,node.resourceId);
  assert.deepEqual(resourceAt05A(end,def,224*86400),end,'same instant cannot duplicate stock');
 }
});
