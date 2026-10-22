import {test} from 'node:test';import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const fixtures=[{id:'test:berry',name:'열매',group:'식재료',qty:2,tags:[]}];
test('03-B main adapter preview is free; tick charges one turn and updates region',()=>{
 const a=createMainV2Inventory(fixtures,{preferences:{getItem:()=>null,setItem:()=>{}}});
 const before=a.current(),result=a.routePreview('숲');
 assert.equal(result.ok,true);assert.deepEqual(a.current(),before);
 assert.equal(a.travelBegin(result.plan),true);assert.equal(a.travelResume(),true);
 const first=a.travelTick();assert.equal(first.accepted,true);assert.equal(first.nextState.turn,1);
 assert.equal(first.nextState.clock.elapsedUnits,3);assert.equal(a.current().world.runtime.region,'초원·농경지');
 const second=a.travelTick();assert.equal(second.accepted,true);
 assert.equal(a.current().world.runtime.region,'숲');assert.equal(a.travelState().progress,null);
 assert.equal(a.current().clock.elapsedUnits,6);
});
test('03-B pause and save-state snapshot preserve progress without time passing',()=>{
 const a=createMainV2Inventory(fixtures,{preferences:{getItem:()=>null,setItem:()=>{}}});
 const plan=a.routePreview('광산').plan;
 assert.equal(a.travelBegin(plan),true);
 const paused=a.current();assert.equal(a.travelTick().accepted,false);
 assert.equal(a.travelPause(),true);assert.deepEqual(a.current().clock,paused.clock);
 assert.equal(a.travelResume(),true);
 assert.equal(a.travelTick().accepted,true);
 const snapshot=structuredClone(a.current());
 assert.equal(snapshot.world.runtime.travel03B.progress.edgeIndex,1);
 assert.equal(snapshot.world.runtime.travel03B.progress.status,'moving');
});
