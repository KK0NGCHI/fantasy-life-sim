import {test} from 'node:test';import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const fixtures=()=>[
{id:'mock:ore',name:'광석',group:'광석',qty:5,tags:['ore'],quality:'보통',material:'광물'},
{id:'mock:berry',name:'열매',group:'식재료',qty:3,tags:['food'],quality:'보통',material:'식물'}
];
test('main UI projects canonical v2 item state and refuses discard without confirmation',()=>{
 const adapter=createMainV2Inventory(fixtures());
 const before=adapter.projected();
 const p=adapter.prepareDiscard([{itemId:'mock:ore',quantity:5},{itemId:'mock:berry',quantity:3}]);
 assert.equal(p.ok,true);assert.deepEqual(adapter.projected(),before);
 const r=adapter.confirmDiscard(p.preview);
 assert.equal(r.accepted,true);assert.equal(adapter.projected().length,0);
 assert.equal(adapter.current().turn,1);
});
test('main UI v2 adapter rejects stale modal and preserves data',()=>{
 const adapter=createMainV2Inventory(fixtures());
 const p=adapter.prepareDiscard([{itemId:'mock:ore',quantity:1}]);assert.equal(p.ok,true);
 const advanced=adapter.dispatch('life.activity',{name:'휴식한다'});
 assert.equal(advanced.accepted,true);
 assert.throws(()=>adapter.confirmDiscard(p.preview));
 assert.equal(adapter.projected()[0].qty,5);
});
test('main UI fixture catalog keeps no weight in v2 definition or instance',()=>{
 const adapter=createMainV2Inventory(fixtures());
 for(const item of adapter.current().itemWorld.items)assert.equal('weight' in item,false);
 for(const definition of adapter.registry.items.values())assert.equal('weight' in definition,false);
});
