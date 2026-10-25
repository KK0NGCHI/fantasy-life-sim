import {test} from 'node:test';import assert from 'node:assert/strict';
import {SOMNIUM_WORLD_03A,SOMNIUM_REGION_IDS,buildWorldRegistry,validateWorldDefinition,validatePlayerLocation,deriveSiteSeed,createSiteLifecycle,advanceSiteLifecycle,createRandomState} from '../dist/engine/v2.js';
const clone=x=>structuredClone(x);
test('03-A fixture has 16 named regions, unique IDs and valid references',()=>{
 const r=buildWorldRegistry(SOMNIUM_WORLD_03A);
 assert.equal(r.ok,true,JSON.stringify(r.issues));
 assert.equal(SOMNIUM_REGION_IDS.length,16);
 assert.equal(new Set(SOMNIUM_REGION_IDS).size,16);
 assert.equal(r.registry.sites.size,16);
});
test('03-A registry rejects duplicate IDs, dangling routes and map tiles',()=>{
 const a=clone(SOMNIUM_WORLD_03A);a.regions.push(clone(a.regions[0]));
 assert.ok(validateWorldDefinition(a).some(e=>e.code==='DUPLICATE_ID'));
 const b=clone(SOMNIUM_WORLD_03A);b.routes[0].toSiteId='missing';
 assert.ok(validateWorldDefinition(b).some(e=>e.code==='ROUTE_REF'));
 const c=clone(SOMNIUM_WORLD_03A);c.maps[0].tiles[1]='bad';
 assert.ok(validateWorldDefinition(c).some(e=>e.code==='MAP_SIZE'||e.code==='TILE_REF'));
});
test('03-A local coordinates disallow walls, outside tiles and invalid floors',()=>{
 const r=buildWorldRegistry(SOMNIUM_WORLD_03A).registry;
 const siteId=SOMNIUM_WORLD_03A.initialSiteId;
 assert.equal(validatePlayerLocation(r,{siteId,floor:0,x:1,y:1}),true);
 assert.equal(validatePlayerLocation(r,{siteId,floor:0,x:0,y:0}),false);
 assert.equal(validatePlayerLocation(r,{siteId,floor:0,x:9,y:1}),false);
 assert.equal(validatePlayerLocation(r,{siteId,floor:-1,x:1,y:1}),false);
});
test('03-A site seed is stable and visit order does not consume game RNG',()=>{
 const rng=createRandomState('world-abc'),before=JSON.stringify(rng);
 const id='core:site/forest';
 const value=deriveSiteSeed('world-abc',1,id,0);
 assert.equal(value,deriveSiteSeed('world-abc',1,id,0));
 assert.notEqual(value,deriveSiteSeed('world-abc',1,id,1));
 assert.notEqual(value,deriveSiteSeed('world-abc',2,id,0));
 assert.equal(JSON.stringify(rng),before);
});
test('03-A temporary site expiration defers while occupied then expires on exit',()=>{
 const policy={kind:'temporary',lifetimeUnits:100};
 const site=createSiteLifecycle('core:site/temp',policy,20);
 assert.equal(site.expiresAt,120);
 const pending=advanceSiteLifecycle(site,policy,121,false,true);
 assert.equal(pending.action,'defer');assert.equal(pending.state.status,'expiration_pending');
 const ended=advanceSiteLifecycle(pending.state,policy,125,false,false);
 assert.equal(ended.action,'expire');assert.equal(ended.state.status,'expired');
});
test('03-A renewable sites retain their map; repeated sites renew without visit-based resets',()=>{
 const p={kind:'renewable',renewalUnits:10};
 const s=createSiteLifecycle('core:site/forest',p,0);
 assert.equal(advanceSiteLifecycle(s,p,9,false,false).action,'none');
 const renew=advanceSiteLifecycle(s,p,37,false,false);
 assert.equal(renew.action,'renew');assert.equal(renew.state.renewAt,40);
 assert.equal(renew.state.generationIndex,0);
 const repeat={kind:'repeatable',regenerationUnits:7};
 const rep=advanceSiteLifecycle(createSiteLifecycle('core:site/dungeon',repeat,0),repeat,21,false,false);
 assert.equal(rep.action,'regenerate');assert.equal(rep.state.generationIndex,3);
});
test('03-A permanent sites never expire and policy rejects invalid intervals',()=>{
 const p={kind:'permanent'},s=createSiteLifecycle('core:site/town',p,0);
 assert.equal(advanceSiteLifecycle(s,p,10_000,false,false).action,'none');
 const bad=clone(SOMNIUM_WORLD_03A);
 bad.sites[0].lifecycle={kind:'permanent',lifetimeUnits:2};
 assert.ok(validateWorldDefinition(bad).some(e=>e.code==='LIFECYCLE'));
});
