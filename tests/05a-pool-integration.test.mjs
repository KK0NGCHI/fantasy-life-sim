import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rollAvailableResourcePool05A} from '../src/resource-pools-05a.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const pool={id:'test:blueberry-mixed',spawnConditions:{regions:['숲']},harvestConditions:{seasons:['spring','summer','autumn']},regenerationPolicy:{kind:'fixed',intervalSeconds:86400,units:2},disappearancePolicy:'persist',tiers:[
{id:'common',weight:70,outputs:[{itemId:'item05a:blueberry',weight:1},{itemId:'item05a:reed',weight:1,conditions:{seasons:['summer']}}]},
{id:'rare',weight:30,outputs:[{itemId:'item05a:quartz',weight:1,conditions:{seasons:['autumn']}}]}]};
const context={region:'숲',season:'spring',daypart:'day',weather:'clear'};
test('eligible-only removes seasonal entries and empty tiers rather than failing',()=>{
 const result=rollAvailableResourcePool05A(pool,context,{tierRoll:0.99,outputRoll:0.5});
 assert.equal(result.itemId,'item05a:blueberry');
 const summer=rollAvailableResourcePool05A(pool,{...context,season:'summer'},{tierRoll:0.6,outputRoll:0.75});
 assert.equal(summer.itemId,'item05a:reed');
 assert.equal(rollAvailableResourcePool05A(pool,context,{tierRoll:0.99,outputRoll:0.5,mode:'no-drop'}).itemId,null);
});
const opts={worldSeed:'pool-integration',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,preferences:{getItem:()=>null,setItem:()=>{}},resourcePools05A:{'source05a:blueberry':pool}};
const make=()=>createMainV2Inventory([{id:'test:starter',name:'시험',group:'재료',qty:1,tags:[]}],opts);
const slot={slotId:'pool-test',worldId:'world',kind:'manual',label:'test',savedAt:'2026-10-24T00:00:00Z',revision:0};
test('opt-in pool consumes site and grants item atomically, save restores RNG and inventory',()=>{
 const g=make(),id='site05a:blueberry:숲';
 assert.equal(g.dispatch('world.travel',{region:'숲'}).accepted,true);
 assert.equal(g.dispatch('resource.candidate.discover',{nodeId:id}).accepted,true);
 const before=g.current(),result=g.dispatch('resource.candidate.work',{nodeId:id});
 assert.equal(result.accepted,true,JSON.stringify(result));
 const after=g.current();
 assert.equal(after.world.runtime.resource05A.candidateSites[id].remaining,3);
 assert.equal(after.itemWorld.items.find(x=>x.definitionId==='item05a:blueberry').quantity,1);
 assert.notDeepEqual(after.rng,before.rng);
 const v2=createSaveV2(after,slot,'test',g.registry),prepared=prepareSecondsV2ToV3(v2,g.registry);
 assert.equal(prepared.ok,true);
 const save=createSaveV3(prepared.state,slot,'test',g.registry);
 assert.equal(decodeSaveV3(save,g.registry).ok,true);
 const restore=make();restore.applyApprovedSave(save);
 assert.deepEqual(restore.current().rng,after.rng);
 assert.deepEqual(restore.current().itemWorld,after.itemWorld);
});
test('invalid opt-in content cannot inject unknown item IDs',()=>{
 assert.throws(()=>createMainV2Inventory([],{...opts,resourcePools05A:{'source05a:blueberry':{...pool,tiers:[{id:'invalid',weight:1,outputs:[{itemId:'unregistered:item',weight:1}]}]}}}),/INVALID_RESOURCE_POOL_CONFIG/);
});
