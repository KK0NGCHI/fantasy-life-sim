import {test} from 'node:test';import assert from 'node:assert/strict';
import {actionSeconds} from '../dist/engine/world/action-seconds.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {SOMNIUM_WORLD_03A,buildWorldRegistry,createSiteLifecycle,advanceSiteLifecycle,gameClockAt} from '../dist/engine/v2.js';
const prefs={getItem:()=>null,setItem:()=>{}};
const items=[{id:'test:leaf',name:'약초',group:'약초',qty:2,tags:[]}];
test('all used main action kinds have explicit positive seconds durations',()=>{
 for(const type of ['life.activity','world.travel','dungeon.move','dungeon.enter','dungeon.leave','item.move','item.consume','item.merge','item.split','item.pickup','item.discard.confirm','item.craft'])
  assert.ok(actionSeconds(type)>=1);
 assert.throws(()=>actionSeconds('unknown.action'));
});
test('logical turns are independent of game seconds for life and dungeon actions',()=>{
 const a=createMainV2Inventory(items,{preferences:prefs});
 const life=a.dispatch('life.activity',{name:'휴식한다'});
 assert.equal(life.accepted,true);assert.equal(life.nextState.turn,1);
 assert.equal(life.nextState.clock.elapsedUnits,60);
 a.dispatch('dungeon.enter',{});
 assert.equal(a.current().clock.elapsedUnits,70);
 a.dispatch('dungeon.move',{to:[3,2]});
 assert.equal(a.current().turn,3);
 assert.equal(a.current().clock.elapsedUnits,76);
 assert.deepEqual(gameClockAt(76),{day:1,hour:8,minute:1,second:16});
});
test('all 16 fixed public region sites stay anchored, lifecycle renews in seconds',()=>{
 const registry=buildWorldRegistry(SOMNIUM_WORLD_03A);
 assert.equal(registry.ok,true);
 for(const site of SOMNIUM_WORLD_03A.sites)assert.notEqual(site.lifecycle.kind,'temporary');
 const plains=SOMNIUM_WORLD_03A.sites.find(s=>s.id==='core:site/plains');
 assert.equal(plains.lifecycle.renewalUnits,86400);
 const initial=createSiteLifecycle(plains.id,plains.lifecycle,0);
 assert.equal(advanceSiteLifecycle(initial,plains.lifecycle,86399,false,false).action,'none');
 const after=advanceSiteLifecycle(initial,plains.lifecycle,86400,false,false);
 assert.equal(after.action,'renew');assert.equal(after.state.renewAt,172800);
});
