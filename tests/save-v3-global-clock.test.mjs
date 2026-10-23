import {test} from 'node:test';import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,createSaveV3,decodeSaveV3,exportBackupV3,parseBackupV3,
 prepareV2ToV3Migration,prepareSecondsV2ToV3} from '../dist/engine/v2.js';
const item=[{id:'test:apple',name:'사과',group:'식재료',qty:2,tags:[]}];
const preferences={getItem:()=>null,setItem:()=>{}};
const create=()=>createMainV2Inventory(item,{preferences});
const slot={slotId:'manual-v3',worldId:'main-world',kind:'manual',label:'월드',savedAt:'2026-10-23T00:00:00Z',revision:0};
function v2save(marker=true){
 const a=create(),raw=a.current();
 if(!marker)delete raw.world.runtime.timeBasis;
 return {a,save:createSaveV2(raw,slot,'main-prototype',a.registry)};
}
test('v3 clock seconds and item/RNG/region survive export-import without mutation',()=>{
 const {a,save}=v2save();
 const prepared=prepareSecondsV2ToV3(save,a.registry);
 assert.equal(prepared.ok,true);
 const v3=createSaveV3(prepared.state,slot,'main-prototype',a.registry);
 assert.equal(v3.saveVersion,3);assert.equal(v3.state.schemaVersion,3);
 assert.deepEqual(v3.state.clock,{elapsedSeconds:0,calendarId:'somnium-calendar-v1',startSecondOfDay:28800});
 const text=exportBackupV3(v3,a.registry),decoded=parseBackupV3(text,a.registry);
 assert.equal(decoded.ok,true);assert.deepEqual(decoded.save,v3);
 assert.deepEqual(decoded.save.state.itemWorld,save.state.itemWorld);
 assert.deepEqual(decoded.save.state.rng,save.state.rng);
 assert.notEqual(decoded.save.state,prepared.state);
});
test('legacy abstract time requires explicit approval and resets to first day without changing source',()=>{
 const {a,save}=v2save(false);save.state.clock.elapsedUnits=58;
 const original=structuredClone(save);
 assert.equal(prepareV2ToV3Migration(save,a.registry,false).reason,'APPROVAL_REQUIRED');
 const migrated=prepareV2ToV3Migration(save,a.registry,true);
 assert.equal(migrated.ok,true);assert.equal(migrated.state.clock.elapsedSeconds,0);
 assert.equal(migrated.state.world.runtime.timeBasis,'seconds-v1');
 assert.deepEqual(migrated.state.rng,save.state.rng);
 assert.deepEqual(save,original);
});
test('active legacy travel cannot be silently reset, and future versions are rejected',()=>{
 const {a,save}=v2save(false);
 save.state.world.runtime.travel03B={progress:{status:'moving'}};
 assert.equal(prepareV2ToV3Migration(save,a.registry,true).reason,'ACTIVE_TRAVEL');
 const valid=v2save();
 const converted=prepareSecondsV2ToV3(valid.save,valid.a.registry);
 const v3=createSaveV3(converted.state,slot,'main-prototype',valid.a.registry);
 assert.equal(decodeSaveV3({...v3,saveVersion:4},valid.a.registry).ok,false);
 assert.equal(decodeSaveV3({...v3,state:{...v3.state,clock:{elapsedSeconds:5,calendarId:'unknown',startSecondOfDay:28800}}},valid.a.registry).ok,false);
 assert.equal(decodeSaveV3({...v3,state:{...v3.state,clock:{...v3.state.clock,extra:5}}},valid.a.registry).ok,false);
});
test('v3 restore uses approved snapshot, old v2 direct restore fails with unchanged state',()=>{
 const {a,save}=v2save();const before=a.current();
 assert.throws(()=>a.applyApprovedSave(save));
 assert.deepEqual(a.current(),before);
 const migration=prepareSecondsV2ToV3(save,a.registry);
 const v3=createSaveV3(migration.state,slot,'main-prototype',a.registry);
 a.applyApprovedSave(v3);
 assert.equal(a.gameTime().hour,8);
 assert.deepEqual(a.current().rng,before.rng);
});
