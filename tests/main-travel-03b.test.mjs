import {test} from 'node:test';import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const fixtures=[{id:'test:berry',name:'열매',group:'식재료',qty:2,tags:[]}];
const instance=()=>createMainV2Inventory(fixtures,{preferences:{getItem:()=>null,setItem:()=>{}}});
test('03-B travel preview uses narrative geography, no UI tile distances',()=>{
 const a=instance(),before=a.current();
 const forest=a.routePreview('숲'),desert=a.routePreview('사막'),sea=a.routePreview('바다');
 assert.equal(forest.ok,true);assert.equal(desert.ok,true);assert.equal(sea.ok,true);
 assert.ok(desert.plan.totalWorldUnits>forest.plan.totalWorldUnits);
 assert.ok(sea.plan.totalWorldUnits>forest.plan.totalWorldUnits);
 assert.deepEqual(a.current(),before);
});
test('03-B auto-skip commits in v2 until destination or encounter, with no manual travel ticks',()=>{
 const a=instance(),p=a.routePreview('숲').plan;
 assert.equal(a.travelBegin(p),true);assert.equal(a.travelResume(),true);
 const result=a.travelSkip();assert.equal(result.accepted,true);
 assert.ok(result.turnsSpent>0);assert.ok(a.current().clock.elapsedUnits>0);
 const stopped=a.travelState();if(stopped?.progress)assert.equal(stopped.progress.status,'paused');
 else assert.equal(a.current().world.runtime.region,'숲');
 assert.equal(typeof a.travelTick,'undefined');
});
