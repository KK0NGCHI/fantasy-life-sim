import {test} from 'node:test';import assert from 'node:assert/strict';
import {buildItemRegistry,createRandomState,previewDiscard,discardSelected,pickUpItem} from '../dist/engine/index.js';
const registry=buildItemRegistry({items:[
{id:'ore',nameKey:'ore',categoryId:'resource',tags:[],capabilities:[]},
{id:'box',nameKey:'box',categoryId:'storage',tags:[],capabilities:['storage']}],
materials:[],effects:[],categories:['resource','storage'],rarities:[]}).registry;
const state=()=>({schemaVersion:2,turn:3,clock:{elapsedUnits:10},rng:createRandomState('x'),
player:{id:'p',regionId:'camp',currentHp:10,currentMp:10,hunger:1,statusEffects:[]},
world:{activeRegionId:'camp'},progression:{skillExperience:{}},flags:{},
itemWorld:{items:[{id:'a',definitionId:'ore',quantity:3},{id:'b',definitionId:'ore',quantity:2},
{id:'ground',definitionId:'ore',quantity:1}],placements:[
{itemId:'a',location:{kind:'inventory',ownerId:'p'}},
{itemId:'b',location:{kind:'inventory',ownerId:'p'}},
{itemId:'ground',location:{kind:'world',regionId:'camp',locationId:'tile-1'}}],containers:[]}});
test('bulk discard requires approval; no state mutation and just one turn for batch',()=>{
const s=state(),selections=[{itemId:'a',quantity:2},{itemId:'b',quantity:2}];
assert.equal(previewDiscard(s,selections).ok,true);
assert.equal(discardSelected(s,selections,registry,null).reason,'CONFIRMATION_REQUIRED');
const r=discardSelected(s,selections,registry,{turn:s.turn,selections});
assert.equal(r.accepted,true);assert.equal(r.nextState.turn,4);
assert.deepEqual(r.nextState.itemWorld.items.map(x=>[x.id,x.quantity]),[['a',1],['ground',1]]);
assert.equal(r.nextState.itemWorld.placements.some(x=>x.itemId==='b'),false);
assert.deepEqual(s.itemWorld.items.map(x=>x.quantity),[3,2,1]);
});
test('stale or changed approval cannot discard items',()=>{
 const s=state(),chosen=[{itemId:'a',quantity:1}];
 assert.equal(discardSelected(s,chosen,registry,{turn:2,selections:chosen}).accepted,false);
 assert.equal(discardSelected(s,chosen,registry,{turn:3,selections:[{itemId:'a',quantity:2}]}).accepted,false);
});
test('invalid batch is wholly rejected, ground items cannot be discarded',()=>{
 const s=state();
 for(const rows of [[{itemId:'a',quantity:10}],[{itemId:'a',quantity:1},{itemId:'a',quantity:1}],
 [{itemId:'ground',quantity:1}]])assert.equal(previewDiscard(s,rows).ok,false);
});
test('pickup moves item from world to inventory without weight',()=>{
 const s=state(),r=pickUpItem(s,'ground',registry);
 assert.equal(r.accepted,true);assert.equal(r.nextState.turn,4);
 assert.deepEqual(r.nextState.itemWorld.placements.find(p=>p.itemId==='ground').location,{kind:'inventory',ownerId:'p'});
 assert.equal(s.itemWorld.placements.find(p=>p.itemId==='ground').location.kind,'world');
});
