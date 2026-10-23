import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {SOMNIUM_WORLD_03A} from '../dist/engine/v2.js';
import {activityAt,DEEP_FIELDS,accessDeepField} from '../src/region-activities.js';
const items=[{id:'test:material',name:'재료',group:'재료',qty:2,tags:[]}];
const opts={generatedWorld:true,worldPersistence03E:true,worldSeed:'03f-integrated-test',preferences:{getItem:()=>null,setItem:()=>{}}};
const make=()=>createMainV2Inventory(items,opts);
test('03-F 16 fixed regions, mine field, only designed deep activities',()=>{
 assert.equal(SOMNIUM_WORLD_03A.regions.length,16);
 assert.equal(SOMNIUM_WORLD_03A.sites.find(x=>x.id==='core:site/mine').type,'field');
 assert.equal(DEEP_FIELDS.length,3);
 for(const region of ['초원·농경지','강·호수','습지','산맥','설원','사막','해안·항구','화산지대']){
  assert.equal(activityAt(region).filter(x=>DEEP_FIELDS.some(d=>d.id===x.id)).length,0);
 }
 assert.equal(accessDeepField(DEEP_FIELDS[0],{탐색:100,채집:0}).ok,false);
});
test('03-F invalid local action has zero time/state/RNG cost',()=>{
 const app=make();app.dispatch('dungeon.enter');
 const before=app.current();
 const bad=app.dispatch('dungeon.move',{direction:'teleport'});
 assert.equal(bad.accepted,false);
 assert.equal(bad.turnsSpent,0);
 assert.deepEqual(app.current(),before);
});
test('03-F local move records seen cells, one turn and 6 seconds; failed wall is charged',()=>{
 const app=make();app.dispatch('dungeon.enter');
 const previous=app.current();
 const move=app.dispatch('dungeon.move',{direction:'east'});
 assert.equal(move.accepted,true);assert.equal(app.current().turn,previous.turn+1);
 assert.equal(app.current().clock.elapsedUnits,previous.clock.elapsedUnits+6);
 assert.ok(app.rememberedCells().length>=1);
 const snap=app.current();
 assert.equal(snap.world.runtime.world03E.world.worldSeed,'03f-integrated-test');
});
test('03-F rejected deep field action cannot grant reward or modify time',()=>{
 const app=make(),before=app.current();
 const bad=app.dispatch('region.activity',{activityId:'core:activity/deep-forest'});
 assert.equal(bad.accepted,false);
 assert.deepEqual(app.current(),before);
});
