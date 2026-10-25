import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {ACTIVITY_TABLES_05A} from '../src/activity-tables-05a.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
import {previewDepositMigration05F,approveDepositView05F,restoreDepositView05F,DEPOSIT_VIEW_APPROVAL_05F} from '../src/deposit-migration-05f.js';
const make=()=>createMainV2Inventory([{id:'test:starter',name:'기본',group:'재료',qty:1,tags:[]}],{
 worldSeed:'save-sidecar-05f',generatedWorld:true,worldPersistence03E:true,progression04A:true,
 resources05A:true,ecology05A:true,fungi05B:true,woodland05C:true,minerals05E:true,
 incidentalTables05A:ACTIVITY_TABLES_05A,preferences:{getItem:()=>null,setItem:()=>{}}
});
const slot={slotId:'deposit-parity',worldId:'world',kind:'manual',label:'geology',savedAt:'2026-10-25T00:00:00Z',revision:0};
const ledger=g=>g.current().world.runtime.resource05A.mineralDeposits05E;
const view=deposits=>approveDepositView05F(deposits,previewDepositMigration05F(deposits),{approval:DEPOSIT_VIEW_APPROVAL_05F}).sidecar;
test('real save-v3 roundtrip re-derives exact geology view without duplicate stocks',()=>{
 const source=make();
 assert.equal(source.dispatch('world.travel',{region:'광산'}).accepted,true);
 const p=source.dispatch('mineral.prospect',{itemId:'item05a:stone'});
 assert.equal(p.accepted,true);
 const siteId=p.events.find(e=>e.type==='mineral.discovered').payload.siteId;
 assert.equal(source.dispatch('mineral.extract',{siteId}).accepted,true);
 const originalJSON=JSON.stringify(ledger(source));
 const originalSidecar=view(ledger(source));
 const v2=createSaveV2(source.current(),slot,'test',source.registry);
 const prepared=prepareSecondsV2ToV3(v2,source.registry);
 assert.equal(prepared.ok,true);
 const save=createSaveV3(prepared.state,slot,'test',source.registry);
 const encoded=JSON.stringify(save);
 // Read-only geology views must never create a second spendable ledger inside save-v3.
 assert.equal(encoded.includes('somnium-deposit-view-05f'),false);
 const decoded=decodeSaveV3(JSON.parse(encoded),source.registry);
 assert.equal(decoded.ok,true);
 const loaded=make();
 loaded.applyApprovedSave(decoded.save);
 assert.equal(JSON.stringify(ledger(loaded)),originalJSON);
 assert.equal(JSON.stringify(view(ledger(loaded))),JSON.stringify(originalSidecar));
 assert.equal(restoreDepositView05F(ledger(loaded),JSON.parse(JSON.stringify(originalSidecar))).ok,true);
 // Advancing the real ledger invalidates the old projection.
 assert.equal(loaded.dispatch('mineral.extract',{siteId}).accepted,true);
 assert.equal(restoreDepositView05F(ledger(loaded),originalSidecar).ok,false);
 assert.equal(view(ledger(loaded)).totalRemaining,originalSidecar.totalRemaining-1);
});
test('tampered finite mineral reserve fails save decoding rather than resetting stocks',()=>{
 const source=make();
 const v2=createSaveV2(source.current(),slot,'test',source.registry);
 const prepared=prepareSecondsV2ToV3(v2,source.registry);
 assert.equal(prepared.ok,true);
 const save=JSON.parse(JSON.stringify(createSaveV3(prepared.state,slot,'test',source.registry)));
 const deposits=save.state.world.runtime.resource05A.mineralDeposits05E;
 const siteId=Object.keys(deposits)[0];
 deposits[siteId].remaining=-1;
 assert.equal(decodeSaveV3(save,source.registry).ok,false);
});
