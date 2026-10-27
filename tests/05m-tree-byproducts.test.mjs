import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createResourceNodes05A,RESOURCE_MAP_05A} from '../src/resources-05a.js';
import {takeTreeByproduct05M,TREE_BYPRODUCTS_05M} from '../src/tree-byproducts-05m.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const item=[{id:'test:stone',name:'돌',group:'재료',qty:1,tags:[]}];
const make=()=>createMainV2Inventory(item,{worldSeed:'05m-sidecar',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,preferences:{getItem:()=>null,setItem:()=>{}}});
test('independent byproduct collection does not deplete or progress logging',()=>{
 const nodes=createResourceNodes05A(),nodeId='resource05a:oak-log:01',original=structuredClone(nodes[nodeId]);
 const first=takeTreeByproduct05M(nodes,{},nodeId,'item05m:oak-acorn','숲',0,RESOURCE_MAP_05A);
 assert.equal(first.ok,true);
 assert.deepEqual(nodes[nodeId],original);
 const second=takeTreeByproduct05M(nodes,first.stocks,nodeId,'item05m:oak-acorn','숲',0,RESOURCE_MAP_05A);
 assert.equal(second.ok,true);
 assert.equal(takeTreeByproduct05M(nodes,second.stocks,nodeId,'item05m:oak-acorn','숲',0,RESOURCE_MAP_05A).reason,'BYPRODUCT_DEPLETED');
 assert.equal(takeTreeByproduct05M(nodes,second.stocks,nodeId,'item05a:oak-sap','숲',0,RESOURCE_MAP_05A).ok,true);
 const later=takeTreeByproduct05M(nodes,second.stocks,nodeId,'item05m:oak-acorn','숲',3*86400,RESOURCE_MAP_05A);
 assert.equal(later.ok,true);
 assert.deepEqual(nodes[nodeId],original);
});
test('source and region restrictions block harvesting',()=>{
 const nodes=createResourceNodes05A();
 assert.equal(takeTreeByproduct05M(nodes,{},'resource05a:pine-log:01','item05m:oak-acorn','숲',0,RESOURCE_MAP_05A).reason,'WRONG_TREE_SOURCE');
 assert.equal(takeTreeByproduct05M(nodes,{},'resource05a:willow-log:01','item05m:willow-branch','숲',0,RESOURCE_MAP_05A).reason,'WRONG_TREE_SOURCE');
 assert.equal(takeTreeByproduct05M(nodes,{},'resource05a:oak-log:03','item05m:oak-acorn','숲',0,RESOURCE_MAP_05A).reason,'UNDISCOVERED');
});
test('live dispatcher grants byproduct without reducing timber stock',()=>{
 const g=make();assert.equal(g.dispatch('world.travel',{region:'숲'}).accepted,true);
 const before=g.current();const nodeId='resource05a:oak-log:01';
 const call=g.dispatch('resource.tree.byproduct',{nodeId,itemId:'item05m:oak-acorn'});
 assert.equal(call.accepted,true,JSON.stringify(call));
 const after=g.current();
 assert.equal(after.world.runtime.resource05A.nodes[nodeId].remaining,before.world.runtime.resource05A.nodes[nodeId].remaining);
 assert.equal(after.world.runtime.resource05A.nodes[nodeId].progress,before.world.runtime.resource05A.nodes[nodeId].progress);
 assert.ok(after.itemWorld.items.some(x=>x.definitionId==='item05m:oak-acorn'&&x.quantity===1));
 assert.ok(after.world.runtime.resource05A.treeByproducts05M);
});
test('four existing trees have one or more distinct byproducts',()=>{
 assert.equal(Object.keys(TREE_BYPRODUCTS_05M).length,4);
 for(const entries of Object.values(TREE_BYPRODUCTS_05M))assert.ok(entries.every(x=>x.capacity===2&&x.regenDays>0));
});
