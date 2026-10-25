import {test} from 'node:test';import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const items=[{id:'ore',name:'광석',group:'광석',qty:4,tags:[],quality:'보통',material:'광물'}];
test('region, dungeon enter/move/leave and life action use unified v2 dispatcher',()=>{
 const a=createMainV2Inventory(items);
 const initial=a.current();
 const travel=a.dispatch('world.travel',{region:'숲'});
 assert.equal(travel.accepted,true);assert.equal(travel.nextState.turn,1);
 assert.equal(a.current().world.activeRegionId,'숲');
 assert.equal(a.current().player.regionId,'숲');
 const entered=a.dispatch('dungeon.enter',{});assert.equal(entered.accepted,true);
 assert.equal(a.current().world.runtime.dungeon,true);
 const moved=a.dispatch('dungeon.move',{direction:'east'});assert.equal(moved.accepted,true);
 assert.deepEqual(a.current().world.runtime.pos,[3,2]);
 assert.equal(a.dispatch('life.activity',{name:'휴식한다'}).accepted,true);
 assert.equal(a.dispatch('dungeon.leave',{}).accepted,true);
 assert.equal(a.current().world.runtime.dungeon,false);
 assert.equal(a.current().turn,5);assert.equal(a.current().clock.elapsedUnits,986);
 assert.equal(initial.turn,0);assert.deepEqual(initial.world.runtime.pos,[2,2]);
});
test('invalid dungeon target or unknown action has no effect',()=>{
 const a=createMainV2Inventory(items),before=a.current();
 assert.equal(a.dispatch('dungeon.move',{direction:'diagonal'}).accepted,false);
 assert.equal(a.dispatch('unknown.action',{}).accepted,false);
 assert.deepEqual(a.current(),before);
});
test('v2 saved state includes region, dungeon position, item world and RNG unchanged by dispatch',()=>{
 const a=createMainV2Inventory(items),before=a.current();
 a.dispatch('world.travel',{region:'초원·농경지'});
 a.dispatch('dungeon.enter',{});
 a.dispatch('dungeon.move',{direction:'east'});
 a.dispatch('dungeon.move',{direction:'south'});
 const after=a.current();
 assert.equal(after.world.runtime.region,'초원·농경지');
 assert.deepEqual(after.world.runtime.pos,[3,3]);
 assert.deepEqual(after.itemWorld.items,before.itemWorld.items);
 assert.deepEqual(after.rng,before.rng);
});
