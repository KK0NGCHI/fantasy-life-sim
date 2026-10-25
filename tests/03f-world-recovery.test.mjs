import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const item=[{id:'test:stone',name:'돌',group:'재료',qty:1,tags:[]}];
const pref={getItem:()=>null,setItem:()=>{}};
const game=(seed='world-A')=>createMainV2Inventory(item,{preferences:pref,generatedWorld:true,worldPersistence03E:true,worldSeed:seed});
const slot={slotId:'03f-recovery',worldId:'main-world',kind:'manual',label:'Restore tests',savedAt:'2026-10-24T00:00:00Z',revision:0};
const envelope=g=>{const p=createSaveV2(g.current(),slot,'main-prototype',g.registry),v=prepareSecondsV2ToV3(p,g.registry);assert.equal(v.ok,true);return createSaveV3(v.state,slot,'main-prototype',g.registry)};
test('03-F loaded map wins over new-session seed; world discovery and clock remain intact',()=>{
 const source=game('first-world');source.dispatch('dungeon.enter');source.dispatch('dungeon.move',{direction:'east'});
 const save=envelope(source),target=game('other-world');
 assert.notDeepEqual(target.localMap().tiles,source.localMap().tiles);
 target.applyApprovedSave(save);
 assert.deepEqual(target.localMap(),source.localMap());
 assert.deepEqual(target.current(),source.current());
 assert.deepEqual(target.rememberedCells(),source.rememberedCells());
});
test('03-F legacy in-dungeon save without map snapshot refuses restore atomically',()=>{
 const source=game();source.dispatch('dungeon.enter');
 const old=envelope(source),damaged=structuredClone(old);
 delete damaged.state.world.runtime.world03E;
 assert.equal(decodeSaveV3(damaged,source.registry).ok,true);
 const target=game('other-world'),before=target.current(),map=target.localMap();
 assert.throws(()=>target.applyApprovedSave(damaged),/지형 스냅샷/);
 assert.deepEqual(target.current(),before);
 assert.deepEqual(target.localMap(),map);
});
test('03-F malformed generated map rejects without mutating current inventory, time or RNG',()=>{
 const source=game();source.dispatch('dungeon.enter');const good=envelope(source);
 const bad=structuredClone(good);bad.state.world.runtime.world03E.generatedMaps['core:map/labyrinth'].entrances[0].x=-99;
 const target=game('other-world'),before=target.current();
 assert.equal(decodeSaveV3(bad,target.registry).ok,false);
 assert.throws(()=>target.applyApprovedSave(bad));
 assert.deepEqual(target.current(),before);
});
