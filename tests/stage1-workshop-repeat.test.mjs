import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkWorkshopStage1,craftUntilStage1} from '../src/crafting-workshop-stage1.js';
import {craftBatch1} from '../src/crafting-batch-stage1.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const makeWorld=entries=>({items:entries.map(([definitionId,quantity],i)=>({id:'material:'+i,definitionId,quantity})),placements:entries.map((_,i)=>({itemId:'material:'+i,location:{kind:'inventory',ownerId:'p'}})),containers:[]});
const create=()=>createMainV2Inventory([{id:'starter:wood',name:'시작',group:'재료',qty:1,tags:[]}],{worldSeed:'stage1-repeat-check',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,preferences:{getItem:()=>null,setItem:()=>{}}});
const slot={slotId:'stage1-repeat',worldId:'world',kind:'manual',label:'repeat',savedAt:'2026-10-27T00:00:00Z',revision:0};
function inject(g,entries){
 const cur=g.current(),v2=createSaveV2(cur,slot,'test',g.registry),v3=prepareSecondsV2ToV3(v2,g.registry);
 assert.equal(v3.ok,true);
 const save=createSaveV3(v3.state,slot,'test',g.registry),owner=cur.player.id;
 const more=makeWorld(entries);
 save.state.itemWorld={...save.state.itemWorld,items:[...save.state.itemWorld.items,...more.items],placements:[...save.state.itemWorld.placements,...more.placements.map(p=>({...p,location:{...p.location,ownerId:owner}}))]};
 const next=create();next.applyApprovedSave(save);return next;
}
test('workbench and furnace policies distinguish stations and reject unavailable region',()=>{
 assert.equal(checkWorkshopStage1({region:'거점 마을',dungeon:false},'craft05l:wood-basket').stationId,'workbench');
 assert.equal(checkWorkshopStage1({region:'거점 마을',dungeon:false},'refine05h:copper').stationId,'furnace');
 assert.equal(checkWorkshopStage1({region:'숲',dungeon:false},'refine05h:copper').reason,'WORKSTATION_REQUIRED');
 assert.equal(checkWorkshopStage1({region:'거점 마을',dungeon:true},'craft05l:wood-basket').reason,'WORKSTATION_REQUIRED');
 assert.equal(checkWorkshopStage1({region:'거점 마을',dungeon:false},'unknown').reason,'UNKNOWN_RECIPE');
});
test('stop-on-shortage repeat preserves completed results while atomic batch rejects all',()=>{
 const world=makeWorld([['item05h:oak-planks',4],['item05l:grass-rope',2]]);
 const all=craftBatch1(world,'p','craft05l:wood-basket',3);
 assert.equal(all.ok,false);assert.deepEqual(world,makeWorld([['item05h:oak-planks',4],['item05l:grass-rope',2]]));
 const partial=craftUntilStage1(world,'p','craft05l:wood-basket',3);
 assert.equal(partial.ok,true);assert.equal(partial.completed,2);assert.equal(partial.stopReason,'INSUFFICIENT_MATERIAL');
 assert.equal(partial.seconds,1200);assert.equal(partial.itemWorld.items.find(x=>x.definitionId==='item05l:wood-basket').quantity,2);
 assert.equal(craftUntilStage1(world,'p','craft05l:wood-basket',2).stopReason,null);
});
test('real stop-on-shortage dispatch charges only completed work and survives save roundtrip',()=>{
 const g=inject(create(),[['item05h:oak-planks',4],['item05l:grass-rope',2]]),before=g.current();
 const res=g.dispatch('craft.until',{recipeId:'craft05l:wood-basket',count:5});
 assert.equal(res.accepted,true,JSON.stringify(res));
 assert.equal(res.turnsSpent,2);
 const after=g.current();assert.equal(after.turn,before.turn+2);assert.equal(after.clock.elapsedUnits,before.clock.elapsedUnits+1200);
 assert.equal(res.events[0].payload.stopReason,'INSUFFICIENT_MATERIAL');
 const converted=prepareSecondsV2ToV3(createSaveV2(after,slot,'test',g.registry),g.registry);assert.equal(converted.ok,true);
 const save=createSaveV3(converted.state,slot,'test',g.registry);assert.equal(decodeSaveV3(save,g.registry).ok,true);
 const restore=create();restore.applyApprovedSave(save);assert.deepEqual(restore.current(),after);
});
test('zero completions, invalid count and region reject with no turns or inventory writes',()=>{
 const g=inject(create(),[['item05h:oak-planks',2],['item05l:grass-rope',1]]);
 const before=g.current();
 for(const count of [0,21,2]){
  const denied=g.dispatch('craft.until',{recipeId:'craft05l:wood-basket',count});
  if(count===2)continue;
  assert.equal(denied.accepted,false);assert.deepEqual(g.current(),before);
 }
 const forest=create();assert.equal(forest.dispatch('world.travel',{region:'숲'}).accepted,true);
 const prior=forest.current(),blocked=forest.dispatch('craft.until',{recipeId:'craft05l:wood-basket',count:1});
 assert.equal(blocked.accepted,false);assert.deepEqual(forest.current(),prior);
});
