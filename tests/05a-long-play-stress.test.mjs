import {test} from 'node:test';
import assert from 'node:assert/strict';
import {simulate05A} from './05a-long-horizon.mjs';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
import {RESOURCE_MAP_05A} from '../src/resources-05a.js';

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
 const seed='long-play-reproducible',game=newGame(seed);
 const tasks=[
  ['숲','resource05a:grass:01'],
  ['숲','resource05a:wild-herb:01'],
  ['숲','resource05a:oak-log:01'],
  ['강·호수','resource05a:small-fish:01']
 ];
 let completed=0,failed=0,saved=0,workedSeconds=0;
 for(let i=0;i<160;i++){
  const [region,nodeId]=tasks[i%tasks.length];
  const travel=game.dispatch('world.travel',{region});
  assert.equal(travel.accepted,true);
  const before=game.current().clock.elapsedUnits;
  const outcome=game.workUntil05A(nodeId,8);
  if(outcome.accepted)completed++;else failed++;
  workedSeconds+=game.current().clock.elapsedUnits-before;
  assertLedger(game,'action '+i);
  if(i%20===19){saveRestore(game,seed);saved++;}
 }
 assert.ok(completed>0,'no live resource action succeeded');
 assert.ok(workedSeconds>0);
 assertLedger(game,'final');
 console.log('LONG_PLAY_DISPATCH '+JSON.stringify({
  attemptedJobs:160,completed,failed,saveRestores:saved,workedSeconds,
  elapsedGameSeconds:game.current().clock.elapsedUnits,
  inventoryStacks:game.current().itemWorld.items.length
 }));
});
