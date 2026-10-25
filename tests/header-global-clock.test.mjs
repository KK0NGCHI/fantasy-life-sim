import {test} from 'node:test';import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const fixture=[{id:'test:leaf',name:'약초',group:'약초',qty:1,tags:[]}];
const app=()=>createMainV2Inventory(fixture,{preferences:{getItem:()=>null,setItem:()=>{}}});
test('header source clock advances seconds for short actions and minutes for life actions',()=>{
 const a=app();assert.deepEqual(a.gameTime(),{day:1,hour:8,minute:0,second:0});
 assert.equal(a.dispatch('dungeon.enter',{}).accepted,true);
 assert.deepEqual(a.gameTime(),{day:1,hour:8,minute:0,second:10});
 assert.equal(a.dispatch('dungeon.move',{direction:'east'}).accepted,true);
 assert.deepEqual(a.gameTime(),{day:1,hour:8,minute:0,second:16});
 for(let i=0;i<6;i++)assert.equal(a.dispatch('life.activity',{name:'나뭇가지 줍기'}).accepted,true);
 assert.deepEqual(a.gameTime(),{day:1,hour:8,minute:6,second:16});
});
test('clock reading and UI-only queries do not advance game time',()=>{
 const a=app(),before=a.current();
 a.gameTime();a.projected();a.routePreview('숲');a.gameTime();
 assert.deepEqual(a.current(),before);
});
