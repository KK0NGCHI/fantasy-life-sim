import {test} from 'node:test';import assert from 'node:assert/strict';
import {gameClockAt,formatTravelSeconds,GAME_DAY_SECONDS,createSaveV2} from '../dist/engine/v2.js';
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
test('legacy v2 is never silently applied to the v3 seconds runtime',()=>{
 const a=createMainV2Inventory(items,{preferences});
 const legacy=structuredClone(a.current());
 delete legacy.world.runtime.timeBasis;
 legacy.clock.elapsedUnits=58;
 const slot={slotId:'legacy',worldId:'main-world',kind:'manual',label:'Legacy time',savedAt:'2026-01-01T00:00:00Z',revision:1};
 const originalSave=createSaveV2(legacy,slot,'main-prototype',a.registry);
 const before=a.current();
 assert.throws(()=>a.applyApprovedSave(originalSave),/v2/);
 assert.deepEqual(a.current(),before);
});
