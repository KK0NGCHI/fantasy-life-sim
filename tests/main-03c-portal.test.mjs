import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const fixtures=[{id:'test:berry',name:'열매',group:'식재료',qty:2,tags:[]}];
const game=()=>createMainV2Inventory(fixtures,{preferences:{getItem:()=>null,setItem:()=>{}}});
test('03-C actual labyrinth stair transition is reciprocal and costs only one action',()=>{
 const a=game();
 assert.equal(a.dispatch('dungeon.enter').accepted,true);
 assert.equal(a.localFloor(),0);
 assert.equal(a.dispatch('dungeon.move',{direction:'east'}).accepted,true);
 assert.equal(a.dispatch('dungeon.move',{direction:'south'}).accepted,true);
 assert.equal(a.localPortal().floor,-1);
 const before=a.current(),enter=a.dispatch('dungeon.portal');
 assert.equal(enter.accepted,true);assert.equal(enter.turnsSpent,1);
 assert.equal(a.localFloor(),-1);
 assert.deepEqual(a.current().world.runtime.pos,[1,1]);
 assert.equal(a.current().turn,before.turn+1);
 const returnStep=a.dispatch('dungeon.portal');
 assert.equal(returnStep.accepted,true);assert.equal(a.localFloor(),0);
 assert.deepEqual(a.current().world.runtime.pos,[3,3]);
});
test('03-C invalid portal cannot consume time or modify state',()=>{
 const a=game();a.dispatch('dungeon.enter');
 const before=a.current(),bad=a.dispatch('dungeon.portal');
 assert.equal(bad.accepted,false);assert.equal(bad.turnsSpent,0);
 assert.deepEqual(a.current(),before);
});
