import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const fixture=[{id:'test:wood',name:'나무',group:'재료',qty:1,tags:[]}];
const make=()=>createMainV2Inventory(fixture,{generatedWorld:true,worldSeed:'03d-browser-test',preferences:{getItem:()=>null,setItem:()=>{}}});
test('03-D generated site is activated on opt-in, while legacy fixture stays intact',()=>{
 const generated=make(),legacy=createMainV2Inventory(fixture,{preferences:{getItem:()=>null,setItem:()=>{}}});
 assert.equal(generated.localMap().width,24);
 assert.equal(generated.localMap().height,24);
 assert.equal(legacy.localMap().width,5);
 assert.deepEqual(make().localMap(),generated.localMap());
});
test('03-D generated labyrinth entry and movement use same generated registry',()=>{
 const app=make(),a=app.dispatch('dungeon.enter');
 assert.equal(a.accepted,true);
 assert.deepEqual(app.current().world.runtime.pos,[2,2]);
 const step=app.dispatch('dungeon.move',{direction:'east'});
 assert.equal(step.accepted,true);
 assert.equal(app.current().clock.elapsedUnits,16);
});
