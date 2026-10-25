import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {ACTIVITY_TABLES_05A} from '../src/activity-tables-05a.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const opts={worldSeed:'05d-parity',generatedWorld:true,worldPersistence03E:true,progression04A:true,
 resources05A:true,ecology05A:true,fungi05B:true,woodland05C:true,
 incidentalTables05A:ACTIVITY_TABLES_05A,preferences:{getItem:()=>null,setItem:()=>{}}};
const make=()=>createMainV2Inventory([{id:'test:starter',name:'기본',group:'재료',qty:1,tags:[]}],opts);
const meta={slotId:'05d-parity',worldId:'world',kind:'manual',label:'test',savedAt:'2026-10-25T00:00:00Z',revision:0};
function transfer(from,to){
 const v2=createSaveV2(from.current(),meta,'test',from.registry);
 const candidate=prepareSecondsV2ToV3(v2,from.registry);
 assert.equal(candidate.ok,true,JSON.stringify(candidate));
 const saved=createSaveV3(candidate.state,meta,'test',from.registry);
 assert.equal(decodeSaveV3(saved,from.registry).ok,true);
 to.applyApprovedSave(saved);
}
const doRest=(game,count)=>{
 for(let i=0;i<count;i++){
  const result=game.dispatch('life.activity',{name:'휴식한다'});
  assert.equal(result.accepted,true);
  assert.deepEqual(result.nextState,game.current(),'response must include final integrated state');
 }
};
test('mid-simulation save/reload produces identical ecology state and time as uninterrupted run',()=>{
 const uninterrupted=make(),resumed=make();
 doRest(uninterrupted,40);
 doRest(resumed,18);
 transfer(resumed,make());
 const loaded=make();transfer(resumed,loaded);
 doRest(resumed,22);doRest(loaded,22);
 assert.deepEqual(loaded.current(),uninterrupted.current());
 assert.deepEqual(loaded.current(),resumed.current());
});
test('pause/resume/cancel do not advance ecological time; skip dispatch reconciles correctly',()=>{
 const game=make();
 const candidate=game.worldRegions().map(r=>game.routePreview(r.name))
  .find(result=>result.ok&&result.plan&&result.plan.totalTurns>0);
 assert.ok(candidate,'fixture requires a usable travel route');
 const start=game.current().clock.elapsedUnits;
 assert.equal(game.travelBegin(candidate.plan),true);
 assert.equal(game.travelPause(),true);
 assert.equal(game.travelResume(),true);
 assert.equal(game.current().clock.elapsedUnits,start);
 assert.equal(game.travelCancel(),true);
 assert.equal(game.current().clock.elapsedUnits,start);
 const restart=game.routePreview(candidate.plan.destinationSiteId);
 // plan may use named regions; the original validated plan is still safe after cancel.
 assert.equal(game.travelBegin(candidate.plan),true);
 const travel=game.travelSkip();
 assert.equal(travel.accepted,true,JSON.stringify(travel));
 assert.deepEqual(travel.nextState,game.current());
 assert.ok(game.current().clock.elapsedUnits>start);
});
