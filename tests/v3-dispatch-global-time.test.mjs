import {test} from 'node:test';
import assert from 'node:assert/strict';
import {V3ActionDispatcher} from '../dist/engine/v3.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3} from '../dist/engine/v2.js';
const a=createMainV2Inventory([{id:'test:grain',name:'곡식',group:'식재료',qty:2,tags:[]}],{preferences:{getItem:()=>null,setItem:()=>{}}});
const slot={slotId:'v3',worldId:'world',kind:'manual',label:'v3',savedAt:'2026-10-23T00:00:00Z',revision:0};
const old=createSaveV2(a.current(),slot,'main-prototype',a.registry);
const state=prepareSecondsV2ToV3(old,a.registry).state;
const handlers=new Map([['life.activity',(snapshot)=>({outcome:'success',nextState:snapshot,events:[]})]]);
test('v3 dispatcher charges exactly one turn and 60 seconds',()=>{
 const d=new V3ActionDispatcher(a.registry,handlers),before=structuredClone(state);
 const result=d.dispatch(state,{type:'life.activity',actorId:'main-player',payload:{name:'휴식'}});
 assert.equal(result.accepted,true);assert.equal(result.nextState.turn,1);
 assert.equal(result.nextState.clock.elapsedSeconds,60);assert.equal(result.nextState.schemaVersion,3);
 assert.deepEqual(state,before);
});
test('invalid actions never change the v3 clock',()=>{
 const d=new V3ActionDispatcher(a.registry,handlers);
 const result=d.dispatch(state,{type:'unknown',actorId:'main-player',payload:{}});
 assert.equal(result.accepted,false);assert.equal(state.clock.elapsedSeconds,0);
});
test('configured long actions can use multiple turns and independent seconds',()=>{
 const d=new V3ActionDispatcher(a.registry,handlers,()=>({turns:3,elapsedSeconds:900}));
 const result=d.dispatch(state,{type:'life.activity',actorId:'main-player',payload:{name:'긴 작업'}});
 assert.equal(result.accepted,true);assert.equal(result.nextState.turn,3);
 assert.equal(result.nextState.clock.elapsedSeconds,900);
});
