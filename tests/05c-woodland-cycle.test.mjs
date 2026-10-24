import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTreeWorld05C,createWoodlandSubstrates05C,advanceWoodland05C,validateTreeWorld05C} from '../src/woodland-cycle-05c.js';
import {createSubstrateWorld05B,substrateId05B} from '../src/fungal-substrates-05b.js';
import {createFungalEcology05B} from '../src/fungal-ecology-05b.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {ACTIVITY_TABLES_05A} from '../src/activity-tables-05a.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const DAY=86400;
const initial=()=>({trees:createTreeWorld05C(),substrates:createWoodlandSubstrates05C(createSubstrateWorld05B()),sites:createFungalEcology05B(),day:0});
const make=()=>createMainV2Inventory([{id:'test:starter',name:'기본',group:'재료',qty:1,tags:[]}],{
 worldSeed:'woodland-cycle',generatedWorld:true,worldPersistence03E:true,progression04A:true,
 resources05A:true,ecology05A:true,fungi05B:true,woodland05C:true,incidentalTables05A:ACTIVITY_TABLES_05A,
 preferences:{getItem:()=>null,setItem:()=>{}}
});
const meta={slotId:'05c-test',worldId:'world',kind:'manual',label:'test',savedAt:'2026-10-25T00:00:00Z',revision:0};
test('tree definitions initialize independently, with bounded and valid persistent states',()=>{
 const trees=createTreeWorld05C();
 assert.equal(validateTreeWorld05C(trees),true);
 assert.ok(Object.keys(trees).length>=5);
 assert.ok(Object.values(trees).some(t=>t.speciesId==='oak'));
 assert.ok(Object.values(trees).some(t=>t.speciesId==='pine'));
});
test('full-day woodland transitions generate litter, soil and eventual deadwood',()=>{
 const w=initial(),leaf=substrateId05B('숲','leaf-litter'),soil=substrateId05B('숲','rich-soil'),dead=substrateId05B('숲','deadwood');
 const one=advanceWoodland05C(w,DAY,'cycle-seed');
 assert.equal(one.day,1);
 assert.ok(one.substrates[leaf].remaining>w.substrates[leaf].remaining);
 assert.ok(one.substrates[soil].remaining>w.substrates[soil].remaining);
 const long=advanceWoodland05C(w,520*DAY,'cycle-seed');
 assert.equal(long.day,520);
 assert.ok(Object.values(long.trees).every(t=>!t.alive));
 assert.ok(long.substrates[dead].remaining>=w.substrates[dead].remaining);
});
test('daily advancement is split-action invariant and satellite patches stay bounded',()=>{
 const start=initial();
 const all=advanceWoodland05C(start,112*DAY,'cycle-seed');
 let chunks=start;
 for(let day=1;day<=112;day++)chunks=advanceWoodland05C(chunks,day*DAY,'cycle-seed');
 assert.deepEqual(chunks,all);
 assert.ok(Object.values(all.sites).some(s=>s.patch===1));
 assert.ok(Object.values(all.sites).filter(s=>s.patch===1).length<=20);
});
test('new game tree worlds coexist with fungi and round-trip with save-v3',()=>{
 const g=make(),state=g.current();
 const resource=state.world.runtime.resource05A;
 assert.ok(resource.woodland05C);
 assert.ok(resource.ecologySubstrates);
 const v2=createSaveV2(state,meta,'test',g.registry);
 const converted=prepareSecondsV2ToV3(v2,g.registry);
 assert.equal(converted.ok,true);
 const save=createSaveV3(converted.state,meta,'test',g.registry);
 assert.equal(decodeSaveV3(save,g.registry).ok,true);
 const restored=make();restored.applyApprovedSave(save);
 assert.deepEqual(restored.current().world.runtime.resource05A.woodland05C,resource.woodland05C);
});
