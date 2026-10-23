import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';

const fixture=[{id:'test:berry',name:'열매',group:'식재료',qty:2,tags:[]}];
const create=()=>createMainV2Inventory(fixture,{preferences:{getItem:()=>null,setItem:()=>{}}});

test('03-C dungeon uses registered labyrinth map and declared entry',()=>{
 const game=create();
 const map=game.localMap();
 assert.equal(map.siteId,'core:site/labyrinth');
 const enter=game.dispatch('dungeon.enter');
 assert.equal(enter.accepted,true);
 assert.deepEqual(game.current().world.runtime.pos,[2,2]);
});
test('03-C cardinal move commits location, one turn and six seconds exactly once',()=>{
 const game=create();game.dispatch('dungeon.enter');
 const before=game.current();
 const result=game.dispatch('dungeon.move',{direction:'east'});
 assert.equal(result.accepted,true);
 assert.equal(result.outcome,'success');
 assert.equal(result.turnsSpent,1);
 assert.deepEqual(game.current().world.runtime.pos,[3,2]);
 assert.equal(game.current().turn,before.turn+1);
 assert.equal(game.current().clock.elapsedUnits,before.clock.elapsedUnits+6);
});
test('03-C wall attempt costs one turn and six seconds, invalid direction costs zero',()=>{
 const game=create();game.dispatch('dungeon.enter');game.dispatch('dungeon.move',{direction:'east'});
 const before=game.current();
 const blocked=game.dispatch('dungeon.move',{direction:'east'});
 assert.equal(blocked.accepted,true);assert.equal(blocked.outcome,'failed');
 assert.deepEqual(game.current().world.runtime.pos,before.world.runtime.pos);
 assert.equal(game.current().turn,before.turn+1);
 assert.equal(game.current().clock.elapsedUnits,before.clock.elapsedUnits+6);
 const after=game.current();
 const invalid=game.dispatch('dungeon.move',{direction:'diagonal'});
 assert.equal(invalid.accepted,false);assert.equal(invalid.turnsSpent,0);
 assert.deepEqual(game.current(),after);
});
test('03-C movement while outside dungeon rejects without state change',()=>{
 const game=create(),before=game.current();
 const result=game.dispatch('dungeon.move',{direction:'east'});
 assert.equal(result.accepted,false);assert.equal(result.turnsSpent,0);
 assert.deepEqual(game.current(),before);
});
