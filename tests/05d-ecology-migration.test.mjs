import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {previewEcologyUpgrade05D,upgradeEcologyWorld05D} from '../src/ecology-upgrade-05d.js';
import {ACTIVITY_TABLES_05A} from '../src/activity-tables-05a.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const opts={worldSeed:'05d-old',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,
 incidentalTables05A:ACTIVITY_TABLES_05A,preferences:{getItem:()=>null,setItem:()=>{}}};
const make=()=>createMainV2Inventory([{id:'test:starter',name:'시작',group:'재료',qty:1,tags:[]}],opts);
const meta={slotId:'migration-test',worldId:'world',kind:'manual',label:'migration',savedAt:'2026-10-25T00:00:00Z',revision:0};
test('legacy world migration requires explicit approval and never mutates input',()=>{
 const game=make();for(let i=0;i<8;i++)assert.equal(game.dispatch('life.activity',{name:'휴식한다'}).accepted,true);
 const old=game.current(),copy=structuredClone(old),preview=previewEcologyUpgrade05D(old);
 assert.equal(preview.ok,true);assert.equal(preview.required,true);
 assert.deepEqual(preview.missing,['ecologySites','ecologySubstrates','ecologyClimateSeed','woodland05C']);
 assert.throws(()=>upgradeEcologyWorld05D(old,{seed:'05d-old'}),/APPROVAL/);
 const result=upgradeEcologyWorld05D(old,{approved:true,seed:'05d-old'});
 assert.deepEqual(old,copy);
 const r=result.state.world.runtime.resource05A;
 assert.ok(Object.keys(r.ecologySites).length>80);
 assert.ok(Object.keys(r.ecologySubstrates).length>0);
 assert.equal(r.ecologyClimateSeed,'05d-old');
 assert.equal(r.woodland05C.day,Math.floor((old.clock.elapsedUnits+28800)/86400));
 assert.deepEqual(upgradeEcologyWorld05D(result.state,{approved:true,seed:'05d-old'}).state,result.state);
});
test('upgraded world passes strict save v3 and roundtrip without silently modifying legacy save',()=>{
 const g=make(),old=g.current();
 const upgraded=upgradeEcologyWorld05D(old,{approved:true,seed:'05d-old'}).state;
 const v2=createSaveV2(upgraded,meta,'test',g.registry);
 const converted=prepareSecondsV2ToV3(v2,g.registry);assert.equal(converted.ok,true);
 const saved=createSaveV3(converted.state,meta,'test',g.registry);
 assert.equal(decodeSaveV3(saved,g.registry).ok,true);
 assert.equal(previewEcologyUpgrade05D(old).required,true);
 const restored=make();restored.applyApprovedSave(saved);
 assert.deepEqual(restored.current().world.runtime.resource05A,upgraded.world.runtime.resource05A);
});
