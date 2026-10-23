import {test} from 'node:test';import assert from 'node:assert/strict';
import {DEEP_FIELDS,activityAt,accessDeepField,activityPreview} from '../src/region-activities.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const inventory=()=>createMainV2Inventory([{id:'test:twig',name:'나뭇가지',group:'재료',qty:1,tags:[]}],{preferences:{getItem:()=>null,setItem:()=>{}}});
test('mine is a field, not a dungeon; only three chosen deep areas exist',()=>{
 const game=inventory();
 const mine=game.worldRegions().find(r=>r.name==='광산');assert.ok(mine);
 assert.deepEqual(DEEP_FIELDS.map(x=>x.region),['숲','광산','바다']);
 assert.equal(activityAt('초원·농경지').length,0);
 assert.equal(activityAt('고대 유적')[0].kind,'investigate');
 assert.equal(activityAt('폐허·묘지')[0].kind,'salvage');
});
test('deep field needs both exploration and regional mastery',()=>{
 const f=DEEP_FIELDS[0];
 assert.equal(accessDeepField(f,{}).reason,'SKILL_DATA_REQUIRED');
 assert.equal(accessDeepField(f,{탐색:10,채집:9}).reason,'MASTERY_REQUIRED');
 assert.equal(accessDeepField(f,{탐색:9,채집:10}).reason,'MASTERY_REQUIRED');
 assert.equal(accessDeepField(f,{탐색:10,채집:10}).ok,true);
 assert.equal(activityPreview('숲',f.id,{탐색:10,채집:10}).tileTraversal,false);
 assert.equal(activityPreview('광산',f.id,{탐색:10,채집:10}).ok,false);
});
test('special region dispatch is a single timed action without invented battle or loot',()=>{
 const g=inventory();const s=g.current();
 assert.equal(g.dispatch('region.activity',{activityId:'core:activity/ancient-ruins'}).accepted,false);
 assert.deepEqual(g.current(),s);
 // direct state movement is not granted through activity command;
 // region-independent preview remains a pure and side-effect-free rule.
 const preview=activityPreview('폐허·묘지','core:activity/abandoned-graves',{});
 assert.equal(preview.ok,true);assert.equal(preview.encounterEligible,true);
 assert.equal(preview.tileTraversal,false);
});
