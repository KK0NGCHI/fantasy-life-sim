import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createSave,decodeSave,parseBackup,exportBackup,prepareLoad,shouldAutoSave,createRandomState} from '../dist/engine/index.js';
const state=()=>({schemaVersion:1,turn:7,clock:{elapsedUnits:40},rng:createRandomState('seed'),
 player:{id:'p',regionId:'camp',currentHp:9,currentMp:4,hunger:2,statusEffects:[]},
 inventory:{items:[{id:'i1',definitionId:'core:ore',quantity:2}]},world:{activeRegionId:'camp'},
 progression:{skillExperience:{}},flags:{}});
const slot=()=>({slotId:'manual-a',worldId:'world-a',kind:'manual',label:'before mine',savedAt:'2026-10-22T00:00:00Z',revision:0});
test('snapshot is a clone; valid backups preserve turn, inventory and two RNG streams',()=>{
 const s=state(),save=createSave(s,slot(),'prototype');
 s.inventory.items[0].quantity=99;
 assert.equal(save.state.inventory.items[0].quantity,2);
 assert.deepEqual(parseBackup(exportBackup(save)),{ok:true,save});
});
test('invalid and future versions are rejected without replacing live state',()=>{
 const live=state(),good=createSave(live,slot(),'prototype');
 for(const raw of [{...good,saveVersion:2},{...good,state:{...good.state,schemaVersion:2}}]){
  const r=prepareLoad(raw,live);assert.equal(r.ok,false);assert.equal(r.unchanged,live);
 }
 const bad={...good,state:{...good.state,inventory:{items:[{id:'a',definitionId:'a',quantity:-10}]}}};
 assert.equal(decodeSave(bad).ok,false);
 assert.equal(prepareLoad(bad,live).unchanged,live);
});
test('damaged and oversized imports are refused',()=>{
 assert.equal(parseBackup('{bad').ok,false);
 assert.equal(parseBackup(' '.repeat(100),10).ok,false);
});
test('no silent migration of unknown state roots',()=>{
 const save=createSave(state(),slot(),'prototype');
 assert.equal(decodeSave({...save,state:{...save.state,itemWorld:{items:[]}}}).ok,false);
});
test('autosave combines configurable actions and event triggers',()=>{
 const policy={everyActions:20,eventTypes:['region.entered','dungeon.entered']};
 assert.equal(shouldAutoSave(19,[],policy),false);
 assert.equal(shouldAutoSave(20,[],policy),true);
 assert.equal(shouldAutoSave(0,[{type:'region.entered',payload:{}}],policy),true);
 assert.throws(()=>shouldAutoSave(0,[],{...policy,everyActions:0}));
});

test('legacy save v1 refuses detailed 02-A item fields until explicit migration',()=>{
 const save=createSave(state(),slot(),'prototype');
 const enriched={...save,state:{...save.state,inventory:{items:[{...save.state.inventory.items[0],quality:3,materialId:'core:iron'}]}}};
 assert.equal(decodeSave(enriched).ok,false);
 assert.equal(prepareLoad(enriched,state()).ok,false);
});
