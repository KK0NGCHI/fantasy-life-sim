import test from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';

test('M1 town controls dispatch through active game bridge and charge global clock exactly once',()=>{
 const bridge=createMainV2Inventory([{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}],{worldSeed:'m1-test-seed'});
 const initial=bridge.current();
 assert.equal(initial.world.runtime.m1Life,undefined);
 const bought=bridge.m1Action({type:'trade.buy',item:'m1:seed:wheat',quantity:1});
 assert.equal(bought.accepted,true,JSON.stringify(bought));
 assert.equal(bridge.current().turn,initial.turn+1);
 assert.equal(bridge.current().clock.elapsedUnits,initial.clock.elapsedUnits+60);
 assert.equal(bridge.m1Life().inventory['m1:seed:wheat'],1);
 const planted=bridge.m1Action({type:'farm.plant',crop:'wheat',plot:0});
 assert.equal(planted.accepted,true,JSON.stringify(planted));
 const advance=bridge.m1Action({type:'time.advance',seconds:86400});
 assert.equal(advance.accepted,true,JSON.stringify(advance));
 assert.equal(bridge.current().clock.elapsedUnits,initial.clock.elapsedUnits+120+86400);
 assert.equal(bridge.m1Life().now,bridge.current().clock.elapsedUnits);
 const harvested=bridge.m1Action({type:'farm.harvest',plot:0});
 assert.equal(harvested.accepted,true,JSON.stringify(harvested));
 assert.equal(bridge.m1Life().inventory['m1:crop:wheat'],3);
 assert.equal(bridge.m1Life().turn,bridge.current().turn);
});
