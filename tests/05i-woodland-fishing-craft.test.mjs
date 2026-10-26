import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';

const make=()=>createMainV2Inventory([{id:'starter:wood',name:'시작',group:'재료',qty:1,tags:[]}],{
 worldSeed:'woodland-fishing-tools',generatedWorld:true,worldPersistence03E:true,progression04A:true,
 resources05A:true,ecology05A:true,fungi05B:true,woodland05C:true,minerals05E:true,
 preferences:{getItem:()=>null,setItem:()=>{}}
});
const meta={slotId:'woodland-fishing',worldId:'world',kind:'manual',label:'woodland',savedAt:'2026-10-26T00:00:00Z',revision:0};
const amount=(g,id)=>g.current().itemWorld.items.filter(x=>x.definitionId===id).reduce((n,x)=>n+x.quantity,0);
test('forest logging and gathering supply a rank-2 fishing rod through live town crafting and save',()=>{
 const g=make();
 assert.equal(g.dispatch('world.travel',{region:'숲'}).accepted,true);
 for(const [nodeId,itemId] of [
  ['resource05a:oak-log:01','item05a:oak-log'],
  ['resource05a:grass:01','item05a:grass']
 ]){
  for(let tries=0;amount(g,itemId)<2&&tries<12;tries++){
   const result=g.workUntil05A(nodeId,50);
   assert.equal(result.accepted,true,JSON.stringify({nodeId,result}));
  }
  assert.ok(amount(g,itemId)>=2,nodeId+' did not yield materials');
 }
 assert.equal(g.dispatch('world.travel',{region:'거점 마을'}).accepted,true);
 const initialWood=amount(g,'item05a:oak-log'),initialGrass=amount(g,'item05a:grass');
 const planks=g.dispatch('mineral.refine',{recipeId:'refine05h:oak-planks'});
 assert.equal(planks.accepted,true,JSON.stringify(planks));
 assert.equal(amount(g,'item05h:oak-planks'),2);
 assert.equal(amount(g,'item05a:oak-log'),initialWood-2);
 const rod=g.dispatch('mineral.refine',{recipeId:'craft05i:processed-wood-rod'});
 assert.equal(rod.accepted,true,JSON.stringify(rod));
 assert.equal(amount(g,'tool05a:rod:processedWood'),1);
 assert.equal(amount(g,'item05h:oak-planks'),0);
 assert.equal(amount(g,'item05a:grass'),initialGrass-2);
 assert.ok(g.availableTools05A('fishing').some(x=>x.id==='tool05a:rod:processedWood'));
 const converted=prepareSecondsV2ToV3(createSaveV2(g.current(),meta,'test',g.registry),g.registry);
 assert.equal(converted.ok,true);
 const saved=createSaveV3(converted.state,meta,'test',g.registry);
 assert.equal(decodeSaveV3(saved,g.registry).ok,true);
 const restored=make();restored.applyApprovedSave(saved);
 assert.deepEqual(restored.current(),g.current());
});

test('repeat real gather -> process -> fishing tool craft across reload without duplicating supplies',()=>{
 const seed='woodland-fishing-tools';
 let g=make(),crafted=0,loads=0;
 assert.equal(g.dispatch('world.travel',{region:'숲'}).accepted,true);
 for(let cycle=0;cycle<2;cycle++){
  for(const [nodeId,itemId,required] of [
   ['resource05a:oak-log:01','item05a:oak-log',2],
   ['resource05a:grass:01','item05a:grass',2]
  ]){
   for(let tries=0;amount(g,itemId)<required&&tries<16;tries++){
    const state=g.current(),node=state.world.runtime.resource05A.nodes[nodeId];
    const chosen=node.remaining>0?nodeId:nodeId.replace(':01',':02');
    const result=g.workUntil05A(chosen,50);
    assert.equal(result.accepted,true,JSON.stringify({cycle,nodeId,chosen,result}));
   }
   assert.ok(amount(g,itemId)>=required,itemId);
  }
  assert.equal(g.dispatch('world.travel',{region:'거점 마을'}).accepted,true);
  const logs=amount(g,'item05a:oak-log'),grass=amount(g,'item05a:grass');
  assert.equal(g.dispatch('mineral.refine',{recipeId:'refine05h:oak-planks'}).accepted,true);
  assert.equal(g.dispatch('mineral.refine',{recipeId:'craft05i:processed-wood-rod'}).accepted,true);
  crafted++;
  assert.equal(amount(g,'item05a:oak-log'),logs-2);
  assert.equal(amount(g,'item05a:grass'),grass-2);
  assert.equal(amount(g,'item05h:oak-planks'),0);
  assert.equal(amount(g,'tool05a:rod:processedWood'),crafted);
  const checkpoint=g.current();
  const migrated=prepareSecondsV2ToV3(createSaveV2(checkpoint,meta,'test',g.registry),g.registry);
  assert.equal(migrated.ok,true);
  const saved=createSaveV3(migrated.state,meta,'test',g.registry);
  const restored=make();restored.applyApprovedSave(saved);
  assert.deepEqual(restored.current(),checkpoint);
  g=restored;loads++;
  assert.equal(g.dispatch('world.travel',{region:'숲'}).accepted,true);
 }
 assert.equal(crafted,2);
 assert.equal(loads,2);
 console.log('LONG_PLAY_CRAFT_CYCLE '+JSON.stringify({crafted,loads,elapsedSeconds:g.current().clock.elapsedUnits,
  rods:amount(g,'tool05a:rod:processedWood')}));
});
