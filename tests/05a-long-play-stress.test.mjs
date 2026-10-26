import {test} from 'node:test';
import assert from 'node:assert/strict';
import {simulate05A} from './05a-long-horizon.mjs';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
import {RESOURCE_MAP_05A,resourceAt05A} from '../src/resources-05a.js';

const DAY=86400;
const meta={slotId:'long-play',worldId:'world',kind:'manual',label:'long-play',savedAt:'2026-10-26T00:00:00Z',revision:0};
const newGame=seed=>createMainV2Inventory([{id:'starter:long-play',name:'시작',group:'재료',qty:1,tags:[]}],{
 worldSeed:seed,generatedWorld:true,worldPersistence03E:true,progression04A:true,
 resources05A:true,ecology05A:true,fungi05B:true,woodland05C:true,minerals05E:true,
 preferences:{getItem:()=>null,setItem:()=>{}}
});
function assertLedger(g,label){
 const state=g.current(),items=state.itemWorld.items,placements=state.itemWorld.placements;
 const ids=new Set();
 for(const item of items){
  assert.ok(!ids.has(item.id),'duplicate item instance: '+label+' '+item.id);
  ids.add(item.id);
  assert.ok(Number.isSafeInteger(item.quantity)&&item.quantity>0,'invalid item qty '+item.id);
  assert.ok(placements.some(p=>p.itemId===item.id),'orphan item placement '+item.id);
 }
 for(const p of placements)assert.ok(ids.has(p.itemId),'orphan placement '+p.itemId);
 const resources=state.world.runtime.resource05A;
 for(const node of Object.values(resources.nodes)){
  const def=RESOURCE_MAP_05A.get(node.resourceId);
  assert.ok(def&&node.remaining>=0&&node.remaining<=def.capacity,'invalid node stock '+node.id);
 }
 for(const site of Object.values(resources.mineralDeposits05E)){
  assert.ok(Number.isSafeInteger(site.remaining)&&site.remaining>=0,'invalid mineral stock '+site.id);
 }
}
function saveRestore(g,seed){
 const state=g.current();
 const converted=prepareSecondsV2ToV3(createSaveV2(state,meta,'test',g.registry),g.registry);
 assert.equal(converted.ok,true,JSON.stringify(converted));
 const saved=createSaveV3(converted.state,meta,'test',g.registry);
 assert.equal(decodeSaveV3(saved,g.registry).ok,true);
 const restored=newGame(seed);
 restored.applyApprovedSave(saved);
 assert.deepEqual(restored.current(),state,'v3 roundtrip must preserve whole long-play state');
 return restored;
}

test('2-year equivalent model: 28/112/224/448/896 days, three behavior profiles, bounded nonnegative ledgers',()=>{
 const summary=[];
 for(const kind of ['casual','specialist','intensive']){
  let prev=null;
  for(const days of [28,112,224,448,896]){
   const result=simulate05A(days,kind);
   assert.ok(result.totalItems>=0&&result.totalXp>=0);
   assert.ok(result.metrics.work>=0&&result.metrics.seconds>=0);
   assert.ok(result.totalItems===Object.values(result.items).reduce((a,b)=>a+b,0));
   assert.ok(result.totalXp===Object.values(result.experience).reduce((a,b)=>a+b,0));
   if(prev){
    assert.ok(result.totalItems>=prev.totalItems,'longer scenario must not lose total acquired items');
    assert.ok(result.totalXp>=prev.totalXp,'longer scenario must not lose earned XP');
   }
   summary.push({kind,days,items:result.totalItems,xp:result.totalXp,works:result.metrics.work,
    searches:result.metrics.search,empty:result.metrics.empty,seconds:result.metrics.seconds,nodes:result.nodes});
   prev=result;
  }
 }
 console.log('LONG_PLAY_ECONOMY '+JSON.stringify(summary));
});
test('live dispatcher repeated jobs preserve inventory, finite deposits and save/reload state',()=>{
 const seed='long-play-reproducible';let game=newGame(seed);
 const tasks=[
  ['숲','resource05a:grass:01'],
  ['숲','resource05a:wild-herb:01'],
  ['숲','resource05a:oak-log:01'],
  ['강·호수','resource05a:small-fish:01']
 ];
 let completed=0,failed=0,saved=0,workedSeconds=0;const failureReasons={};const rejectedPreconditions={};let firstFailure=null;
 for(let i=0;i<160;i++){
  const [region,nodeId]=tasks[i%tasks.length];
  const travel=game.dispatch('world.travel',{region});
  assert.equal(travel.accepted,true);
  const beforeState=game.current(),before=beforeState.clock.elapsedUnits;
  const node=beforeState.world.runtime.resource05A.nodes[nodeId];
  const def=RESOURCE_MAP_05A.get(node?.resourceId);
  const current=node&&def?resourceAt05A(node,def,before):null;
  const preflight=!def?'UNKNOWN_RESOURCE':def.region!==region?'WRONG_REGION':!current?.discovered?'UNDISCOVERED':current.remaining===0?'DEPLETED':'AVAILABLE';
  const outcome=game.workUntil05A(nodeId,8);
  if(preflight==='DEPLETED'){
   assert.equal(outcome.last?.reason,'EXECUTION_ERROR');
   assert.equal(outcome.last?.detail,'DEPLETED','expected resource depletion detail must survive dispatcher boundary');
   assert.deepEqual(game.current().world.runtime.resource05A.nodes[nodeId],beforeState.world.runtime.resource05A.nodes[nodeId],
    'depleted work must not mutate resource stock');
  }
  if(outcome.accepted)completed++;else {failed++;if(!firstFailure)firstFailure={nodeId,region,outcome};const reason=outcome.last?.events?.find(e=>e.type==='command.rejected')?.payload?.reason??outcome.last?.events?.find(e=>e.type==='command.failed')?.payload?.reason??outcome.last?.error?.message??outcome.last?.error??outcome.last?.reason??'UNKNOWN';failureReasons[reason]=(failureReasons[reason]??0)+1;rejectedPreconditions[preflight]=(rejectedPreconditions[preflight]??0)+1;}
  workedSeconds+=game.current().clock.elapsedUnits-before;
  if(i===0)console.log('LONG_PLAY_FIRST_ACTION '+JSON.stringify({result:outcome,region,nodeId}));
  assertLedger(game,'action '+i);
  if(i%20===19){game=saveRestore(game,seed);saved++;}
 }
 assert.ok(completed>0,'no live resource action succeeded');
 assert.ok(workedSeconds>0);
 assert.ok(failed===Object.values(rejectedPreconditions).reduce((a,b)=>a+b,0),'rejection classification must cover all denied jobs');
 assert.deepEqual(rejectedPreconditions,{DEPLETED:failed},'fixed-seed replay must never hide an unexpected rejection as ordinary depletion');
 assertLedger(game,'final');
 console.log('LONG_PLAY_DISPATCH '+JSON.stringify({
  attemptedJobs:160,completed,failed,failureReasons,rejectedPreconditions,firstFailure,saveRestores:saved,workedSeconds,
  elapsedGameSeconds:game.current().clock.elapsedUnits,
  inventoryStacks:game.current().itemWorld.items.length
 }));
});

test('adaptive live-game gatherer completes 200 owned-resource jobs with discoveries and eight continued save loads',()=>{
 const seed='adaptive-200-jobs',sequence=['grass','wild-herb','grass','mushroom','grass'];
 let game=newGame(seed),discovered=0,saveLoads=0;
 assert.equal(game.dispatch('world.travel',{region:'숲'}).accepted,true);
 for(let i=0;i<200;i++){
  const type=sequence[i%sequence.length],resourceId='resource05a:'+type;
  const select=()=>{
   const state=game.current();
   return Object.entries(state.world.runtime.resource05A.nodes).find(([,node])=>
    node.resourceId===resourceId&&node.discovered&&
    resourceAt05A(node,RESOURCE_MAP_05A.get(resourceId),state.clock.elapsedUnits).remaining>0)?.[0];
  };
  let nodeId=select();
  if(!nodeId){
   const found=game.dispatch('resource.search',{resourceId});
   assert.equal(found.accepted,true,JSON.stringify({type,i,found}));
   discovered++;
   nodeId=select();
  }
  assert.ok(nodeId,'discovery must expose available resource '+type);
  const before=game.current();
  const beforeCount=before.itemWorld.items.filter(x=>x.definitionId==='item05a:'+type)
   .reduce((sum,item)=>sum+item.quantity,0);
  const result=game.dispatch('resource.work',{nodeId});
  assert.equal(result.accepted,true,JSON.stringify({i,type,nodeId,result}));
  const afterCount=game.current().itemWorld.items.filter(x=>x.definitionId==='item05a:'+type)
   .reduce((sum,item)=>sum+item.quantity,0);
  assert.equal(afterCount,beforeCount+1,'each successful gather must credit exactly one owned resource');
  assertLedger(game,'adaptive action '+i);
  if(i%25===24){game=saveRestore(game,seed);saveLoads++;}
 }
 assert.equal(saveLoads,8);
 console.log('LONG_PLAY_ADAPTIVE '+JSON.stringify({completed:200,failed:0,
  discoveries:discovered,saveRestores:saveLoads,
  elapsedGameSeconds:game.current().clock.elapsedUnits,
  inventoryStacks:game.current().itemWorld.items.length}));
});
