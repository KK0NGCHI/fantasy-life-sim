import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildItemRegistry,validateItemWorld,prepareInventoryMigration } from '../dist/engine/index.js';
const registry=buildItemRegistry({items:[
{id:'core:box',nameKey:'box',categoryId:'core:container',tags:[],capabilities:['storage']},
{id:'core:ore',nameKey:'ore',categoryId:'core:resource',tags:[],capabilities:[]}],
materials:[],effects:[],categories:['core:container','core:resource'],rarities:[]}).registry;
assert.ok(registry);
const items=[{id:'box',definitionId:'core:box',quantity:1},{id:'ore',definitionId:'core:ore',quantity:2}];
const placed=[{itemId:'box',location:{kind:'inventory',ownerId:'player'}},
{itemId:'ore',location:{kind:'container',containerId:'box'}}];
const containers=[{containerId:'box',itemIds:['ore']}];
const check=(w)=>validateItemWorld(w,registry).map(x=>x.code);
test('valid container with one location per item',()=>assert.deepEqual(check({items,placements:placed,containers}),[]));
test('duplicate location, missing location and dangling refs fail',()=>{
 assert.ok(check({items,placements:[...placed,placed[1]],containers}).includes('DUPLICATE_PLACEMENT'));
 assert.ok(check({items,placements:placed.slice(0,1),containers}).includes('MISSING_PLACEMENT'));
 assert.ok(check({items,placements:placed,containers:[{containerId:'box',itemIds:['notfound']}]}).includes('UNKNOWN_CHILD_ITEM'));
});
test('bidirectional container relation required',()=>{
 assert.ok(check({items,placements:placed,containers:[]}).includes('CONTAINER_LINK_MISMATCH'));
});
test('self-containing item is rejected as cycle',()=>{
 const p=[{itemId:'box',location:{kind:'container',containerId:'box'}},{itemId:'ore',location:{kind:'inventory',ownerId:'player'}}];
 assert.ok(check({items,placements:p,containers:[{containerId:'box',itemIds:['box']}]}).includes('CONTAINER_CYCLE'));
});
test('migration preflight does not change current state',()=>{
 const state={inventory:{items:[{id:'ore',definitionId:'core:ore',quantity:2}]}};
 const before=JSON.stringify(state);
 const result=prepareInventoryMigration(state,registry);
 assert.equal(result.ok,true);assert.deepEqual(result.items,state.inventory.items);
 assert.equal(JSON.stringify(state),before);
 const invalid=prepareInventoryMigration({inventory:{items:[{id:'a',definitionId:'missing',quantity:1}]}},registry);
 assert.equal(invalid.ok,false);
});
