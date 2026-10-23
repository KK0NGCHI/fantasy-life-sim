import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildWorldRegistry,SOMNIUM_WORLD_03A,createInitialWorldRuntime03A} from '../dist/engine/v2.js';
import {createWorldSnapshot03E,validateWorldSnapshot03E,withGeneratedMap,recordWorldSight,withWorldDelta,restoreWorldSnapshot03E,generateLocalMap} from '../dist/engine/v3.js';
const b=buildWorldRegistry(SOMNIUM_WORLD_03A);assert.equal(b.ok,true);const registry=b.registry;
const initial=()=>createWorldSnapshot03E(createInitialWorldRuntime03A(registry,'test-seed'),registry);
test('03-E preserves immutable discovery/deltas through JSON round-trip',()=>{
 const origin=initial();
 const seen=recordWorldSight(origin,'core:map/town',[6,7,8],registry);
 const updated=withWorldDelta(seen,'core:site/town','door/open',true,registry);
 const round=restoreWorldSnapshot03E(JSON.parse(JSON.stringify(updated)),registry);
 assert.deepEqual(round,updated);
 assert.equal(round.deltas['core:site/town']['door/open'],true);
 assert.equal(origin.deltas['core:site/town'],undefined);
 assert.deepEqual(origin.world.seenCells['core:map/town'],[12]);
});
test('03-E rejects unknown map mutation, bad cells and unknown keys',()=>{
 const base=initial();
 assert.throws(()=>recordWorldSight(base,'core:map/town',[-1],registry));
 assert.throws(()=>withWorldDelta(base,'core:site/nonexistent','door/open',true,registry));
 assert.ok(validateWorldSnapshot03E({...base,unexpected:true},registry).includes('UNKNOWN_FIELD'));
 assert.throws(()=>restoreWorldSnapshot03E({...base,generatedMaps:{'core:map/false':{}}},registry));
});
test('03-E keeps generated map snapshot stable even when caller mutates their copy',()=>{
 const base=initial();
 const p={id:'core:generator/dungeon',version:1,algorithm:'dungeon',width:24,height:24,siteId:'core:site/labyrinth',floor:0,maxAttempts:4};
 const gen=generateLocalMap(registry,p,'test-seed');
 const snap=withGeneratedMap(base,gen.map,registry);
 assert.equal(snap.generatedMaps[gen.map.id].width,24);
 assert.equal(base.generatedMaps[gen.map.id],undefined);
 assert.throws(()=>withGeneratedMap(snap,gen.map,registry));
 assert.deepEqual(restoreWorldSnapshot03E(JSON.parse(JSON.stringify(snap)),registry),snap);
});
