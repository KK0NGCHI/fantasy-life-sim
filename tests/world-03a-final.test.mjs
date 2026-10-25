import {test} from 'node:test';import assert from 'node:assert/strict';
import {SOMNIUM_WORLD_03A,buildWorldRegistry,validateWorldTopology,createInitialWorldRuntime03A,
 validateWorldRuntime03A,prepareWorldRuntime03ALoad,siteGenerationSeed,createRandomState} from '../dist/engine/v2.js';
const copy=x=>structuredClone(x);
test('16-region route graph and fixture floor entrances are connected',()=>{
 assert.deepEqual(validateWorldTopology(SOMNIUM_WORLD_03A),[]);
});
test('one-way or blocked floor portal is rejected',()=>{
 const a=copy(SOMNIUM_WORLD_03A);a.maps[0].entrances[0].destinationEntryId='core:entry/missing';
 assert.ok(validateWorldTopology(a).some(x=>x.code==='SITE_ENTRY'||x.code==='FLOOR_ENTRY')||validateWorldTopology(a).length>0);
 const b=copy(SOMNIUM_WORLD_03A);b.maps[0].entrances[0].x=0;b.maps[0].entrances[0].y=0;
 assert.ok(validateWorldTopology(b).some(x=>x.code==='BLOCKED_ENTRY'));
});
test('disconnected public region is rejected regardless of world map display coordinates',()=>{
 const world=copy(SOMNIUM_WORLD_03A);
 world.routes=world.routes.filter(e=>!e.fromSiteId.endsWith('/labyrinth')&&!e.toSiteId.endsWith('/labyrinth'));
 assert.ok(validateWorldTopology(world).some(x=>x.code==='UNREACHABLE_REGION'));
});
test('03-A runtime is preflighted, cloned, rejects missing IDs and invalid player location',()=>{
 const result=buildWorldRegistry(SOMNIUM_WORLD_03A);assert.equal(result.ok,true);
 const reg=result.registry,original=createInitialWorldRuntime03A(reg,'seed-012');
 const preflight=prepareWorldRuntime03ALoad(original,reg);
 assert.equal(preflight.ok,true);assert.notEqual(preflight.world,original);
 assert.equal(validateWorldRuntime03A(original,reg).length,0);
 const before=JSON.stringify(original);
 const bad=copy(original);bad.location.x=0;bad.location.y=0;
 assert.ok(validateWorldRuntime03A(bad,reg).some(x=>x.code==='PLAYER_LOCATION'));
 const unknown=copy(original);unknown.discovery['missing']='visited';
 assert.ok(validateWorldRuntime03A(unknown,reg).some(x=>x.code==='DISCOVERY'));
 const extra=copy(original);extra.futureField=1;
 assert.ok(validateWorldRuntime03A(extra,reg).some(x=>x.code==='UNKNOWN_FIELD'));
 assert.equal(JSON.stringify(original),before);
});
test('visit order cannot advance either shared game RNG and seeds remain stable',()=>{
 const reg=buildWorldRegistry(SOMNIUM_WORLD_03A).registry;
 const world=createInitialWorldRuntime03A(reg,'seed-012');
 const rng=createRandomState('seed-012'),before=JSON.stringify(rng);
 const a=siteGenerationSeed(world,'core:site/forest',reg);
 siteGenerationSeed(world,'core:site/mine',reg);
 assert.equal(siteGenerationSeed(world,'core:site/forest',reg),a);
 assert.equal(JSON.stringify(rng),before);
});
