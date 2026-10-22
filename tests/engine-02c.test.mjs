import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildItemRegistry,createRandomState,V2ActionDispatcher,prepareBulkDiscard,prepareV2Load,createSaveV2,createSave,prepareLegacyGameState,V2SaveSession} from '../dist/engine/index.js';
const catalog={items:[{id:'core:berry',nameKey:'berry',categoryId:'food',tags:[],capabilities:['eat']}],categories:['food'],rarities:[],materials:[],effects:[]};
const registry=buildItemRegistry(catalog).registry;assert.ok(registry);
const state=()=>({schemaVersion:2,turn:1,clock:{elapsedUnits:4},rng:createRandomState('v2'),
 player:{id:'hero',regionId:'camp',currentHp:10,currentMp:10,hunger:1,statusEffects:[]},
 world:{activeRegionId:'camp'},progression:{skillExperience:{}},flags:{},
 itemWorld:{items:[{id:'berry',definitionId:'core:berry',quantity:3}],placements:[{itemId:'berry',location:{kind:'inventory',ownerId:'hero'}}],containers:[]}});
const send=(type,payload={})=>({type,actorId:'hero',payload});
const slot={slotId:'s',worldId:'w',kind:'manual',label:'',savedAt:'2026-10-22T00:00:00Z',revision:0};
test('v2 dispatcher item action commits one turn and world unit',()=>{
 const initial=state();const dispatcher=new V2ActionDispatcher(registry);
 const result=dispatcher.dispatch(initial,send('item.consume',{itemId:'berry',quantity:1}));
 assert.equal(result.accepted,true);assert.equal(result.turnsSpent,1);
 assert.equal(result.nextState.turn,2);assert.equal(result.nextState.clock.elapsedUnits,5);
 assert.equal(result.nextState.itemWorld.items[0].quantity,2);
 assert.equal(initial.itemWorld.items[0].quantity,3);
});
test('custom nonitem handler runs under same v2 commit boundary',()=>{
 const handlers=new Map([['camp.rest',(s)=>({outcome:'success',nextState:{...s,player:{...s.player,currentHp:s.player.currentHp+1}},events:[{type:'camp.rested',payload:{}}]})]]);
 const d=new V2ActionDispatcher(registry,handlers,()=>({turns:3,worldUnits:5}));
 const r=d.dispatch(state(),send('camp.rest'));
 assert.equal(r.accepted,true);assert.equal(r.nextState.turn,4);assert.equal(r.nextState.clock.elapsedUnits,9);
});
test('failed, invalid and unauthorized actions do not partially commit',()=>{
 const d=new V2ActionDispatcher(registry);
 const before=state();
 const failed=d.dispatch(before,send('item.consume',{itemId:'berry',quantity:99}));
 assert.equal(failed.accepted,true);assert.equal(failed.outcome,'failed');
 assert.deepEqual(failed.nextState.itemWorld,before.itemWorld);
 assert.equal(d.dispatch(before,{...send('item.consume',{itemId:'berry',quantity:1}),actorId:'intruder'}).accepted,false);
 assert.equal(d.dispatch(before,send('item.unknown')).accepted,false);
});
test('confirmed discard passes only through v2 dispatcher',()=>{
 const s=state();const prepared=prepareBulkDiscard(s,[{itemId:'berry',quantity:2}],registry);
 assert.equal(prepared.ok,true);
 const d=new V2ActionDispatcher(registry);
 const result=d.dispatch(s,send('item.discard.confirm',{preview:prepared.preview}));
 assert.equal(result.accepted,true);assert.equal(result.nextState.turn,2);
 assert.equal(result.nextState.itemWorld.items[0].quantity,1);
 assert.equal(d.dispatch({...s,turn:2},send('item.discard.confirm',{preview:prepared.preview})).accepted,false);
});
test('legacy conversion preflight keeps original and explicitly requires approval',()=>{
 const initial=state();
 const v1={schemaVersion:1,turn:initial.turn,clock:initial.clock,rng:initial.rng,player:initial.player,
  world:initial.world,progression:initial.progression,flags:initial.flags,inventory:{items:initial.itemWorld.items}};
 const original=JSON.stringify(v1);
 const legacySave=createSave(v1,slot,'demo');
 const prepared=prepareV2Load(legacySave,registry);
 assert.equal(prepared.ok,true);assert.equal(prepared.originalVersion,1);
 assert.equal(JSON.stringify(v1),original);
 const session=new V2SaveSession(initial,registry);
 assert.equal(session.replaceAfterApproval(prepared,false),false);
 assert.equal(session.replaceAfterApproval(prepared,true),true);
 assert.equal(prepareLegacyGameState({...v1,inventory:{items:[{id:'x',definitionId:'missing',quantity:1}]}},registry).ok,false);
 assert.equal(prepareV2Load(createSaveV2(initial,slot,'demo',registry),registry).originalVersion,2);
});

test('canonical v2 entrypoint identifies 02-C and schema v2',async()=>{
 const api=await import('../dist/engine/v2.js');
 assert.equal(api.ENGINE_STAGE_V2,'02-C');
 assert.equal(api.ACTIVE_GAME_STATE_SCHEMA_VERSION,2);
 assert.equal(typeof api.V2ActionDispatcher,'function');
});
