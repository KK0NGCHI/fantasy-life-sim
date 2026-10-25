import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildItemRegistry,createRandomState,prepareBulkDiscard,confirmBulkDiscard,pickupWorldItem} from '../dist/engine/index.js';
const reg=buildItemRegistry({items:[
{id:'berry',nameKey:'berry',categoryId:'food',tags:[],capabilities:['eat']},
{id:'box',nameKey:'box',categoryId:'box',tags:[],capabilities:['storage']}],
materials:[],effects:[],categories:['food','box'],rarities:[]}).registry;
assert.ok(reg);
const state=()=>({schemaVersion:2,turn:3,clock:{elapsedUnits:0},rng:createRandomState('a'),player:{id:'p',regionId:'r',currentHp:10,currentMp:10,hunger:0,statusEffects:[]},world:{activeRegionId:'r'},progression:{skillExperience:{}},flags:{},itemWorld:{
items:[{id:'a',definitionId:'berry',quantity:5},{id:'b',definitionId:'berry',quantity:2},{id:'box1',definitionId:'box',quantity:1},{id:'ground',definitionId:'berry',quantity:1}],
placements:[{itemId:'a',location:{kind:'inventory',ownerId:'p'}},{itemId:'b',location:{kind:'inventory',ownerId:'p'}},{itemId:'box1',location:{kind:'inventory',ownerId:'p'}},{itemId:'ground',location:{kind:'world',regionId:'r',locationId:'tile1'}}],
containers:[] }});
test('batch discard deletes multiple stacks without leaving world items; one turn',()=>{
 const s=state(),before=JSON.stringify(s);const result=prepareBulkDiscard(s,[{itemId:'a',quantity:3},{itemId:'b',quantity:2}],reg);
 assert.equal(result.ok,true);assert.equal(JSON.stringify(s),before);
 const confirmed=confirmBulkDiscard(s,result.preview,reg);assert.equal(confirmed.accepted,true);
 assert.equal(confirmed.nextState.turn,4);
 assert.equal(confirmed.nextState.itemWorld.items.find(i=>i.id==='a').quantity,2);
 assert.equal(confirmed.nextState.itemWorld.items.some(i=>i.id==='b'),false);
 assert.equal(confirmed.nextState.itemWorld.placements.some(p=>p.itemId==='b'),false);
 assert.equal(confirmed.nextState.itemWorld.placements.filter(p=>p.location.kind==='world').length,1);
});
test('cancel means no confirmation call and thus no change; stale preview is rejected',()=>{
 const s=state(),prepared=prepareBulkDiscard(s,[{itemId:'a',quantity:1}],reg);assert.equal(prepared.ok,true);
 const stale=confirmBulkDiscard({...s,turn:s.turn+1},prepared.preview,reg);
 assert.deepEqual(stale,{accepted:false,reason:'STALE_PREVIEW',turnsSpent:0});
 assert.equal(s.itemWorld.items.find(i=>i.id==='a').quantity,5);
});
test('duplicate selections, invalid quantity and foreign item are rejected',()=>{
 const s=state();
 assert.equal(prepareBulkDiscard(s,[{itemId:'a',quantity:1},{itemId:'a',quantity:1}],reg).ok,false);
 assert.equal(prepareBulkDiscard(s,[{itemId:'ground',quantity:1}],reg).ok,false);
 assert.equal(prepareBulkDiscard(s,[{itemId:'a',quantity:999}],reg).ok,false);
});
test('world pickup moves single instance to player inventory',()=>{
 const s=state();const got=pickupWorldItem(s,'ground','tile1',reg);
 assert.equal(got.accepted,true);assert.equal(got.outcome,'success');
 assert.deepEqual(got.nextState.itemWorld.placements.find(p=>p.itemId==='ground').location,{kind:'inventory',ownerId:'p'});
 assert.equal(s.itemWorld.placements.find(p=>p.itemId==='ground').location.kind,'world');
 const failed=pickupWorldItem(s,'ground','wrong',reg);
 assert.equal(failed.accepted,true);assert.equal(failed.outcome,'failed');
});
test('cannot discard a container until emptied',()=>{
 const s=state();s.itemWorld.placements.find(p=>p.itemId==='a').location={kind:'container',containerId:'box1'};
 s.itemWorld.containers=[{containerId:'box1',itemIds:['a']}];
 assert.equal(prepareBulkDiscard(s,[{itemId:'box1',quantity:1}],reg).ok,false);
});
