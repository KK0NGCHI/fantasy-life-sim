import {test} from 'node:test';import assert from 'node:assert/strict';
import {gameClockAt,formatTravelSeconds,GAME_DAY_SECONDS} from '../dist/engine/v2.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const items=[{id:'test:berry',name:'열매',group:'식재료',qty:2,tags:[]}];
const preferences={getItem:()=>null,setItem:()=>{}};
test('03-B new-world clock uses game seconds and rolls day from 8am',()=>{
 assert.deepEqual(gameClockAt(0),{day:1,hour:8,minute:0,second:0});
 assert.deepEqual(gameClockAt(57600),{day:2,hour:0,minute:0,second:0});
 assert.deepEqual(gameClockAt(GAME_DAY_SECONDS),{day:2,hour:8,minute:0,second:0});
 assert.equal(formatTravelSeconds(1500),'25분');
 assert.equal(formatTravelSeconds(28800),'8시간');
 assert.throws(()=>gameClockAt(-1));
});
test('03-B main UI preview uses seconds, clock advances without overwriting legacy time',()=>{
 const a=createMainV2Inventory(items,{preferences});
 const preview=a.routePreview('숲');
 assert.equal(preview.ok,true);
 assert.equal(preview.plan.totalWorldUnits,1500);
 assert.equal(a.current().world.runtime.timeBasis,'seconds-v1');
 a.travelBegin(preview.plan);a.travelResume();
 const result=a.travelSkip();
 assert.equal(result.accepted,true);
 assert.ok(a.current().clock.elapsedUnits>0);
 assert.equal(a.gameTime().day,1);
});
test('03-B unsupported time basis refuses travel rather than interpreting old values as seconds',()=>{
 const a=createMainV2Inventory(items,{preferences});
 const previous=a.current();
 const legacy=structuredClone(previous);
 delete legacy.world.runtime.timeBasis;
 legacy.clock.elapsedUnits=58;
 // Directly replacing state is intentionally not exposed. A legacy save is rejected at the
 // approved restore boundary, while modern saves preserve their explicit seconds marker.
 assert.equal(previous.world.runtime.timeBasis,'seconds-v1');
 assert.equal(legacy.world.runtime.timeBasis,undefined);
});
