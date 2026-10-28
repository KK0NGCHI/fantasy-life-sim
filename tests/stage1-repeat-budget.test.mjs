import {test} from 'node:test';
import assert from 'node:assert/strict';
import {craftUntilStage1} from '../src/crafting-workshop-stage1.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const makeWorld=()=>({items:[{id:'wood',definitionId:'item05h:oak-planks',quantity:8},{id:'rope',definitionId:'item05l:grass-rope',quantity:4}],placements:['wood','rope'].map(itemId=>({itemId,location:{kind:'inventory',ownerId:'p'}})),containers:[]});
const make=()=>createMainV2Inventory([{id:'starter:stone',name:'시작',group:'재료',qty:1,tags:[]}],{worldSeed:'stage1-safety',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,preferences:{getItem:()=>null,setItem:()=>{}}});
const meta={slotId:'safety',worldId:'world',kind:'manual',label:'safety',savedAt:'2026-10-28T00:00:00Z',revision:0};
function gameWithStock(){
 const g=make(),raw=createSaveV2(g.current(),meta,'test',g.registry),v3=prepareSecondsV2ToV3(raw,g.registry);assert.equal(v3.ok,true);
 const save=createSaveV3(v3.state,meta,'test',g.registry),stock=makeWorld();
 save.state.itemWorld={...save.state.itemWorld,items:[...save.state.itemWorld.items,...stock.items],placements:[...save.state.itemWorld.placements,...stock.placements.map(p=>({...p,location:{kind:'inventory',ownerId:save.state.player.id}}))]};
 const restored=make();restored.applyApprovedSave(save);return restored;
}
test('bounded repeat completes only work that fits in game time budget',()=>{
 const world=makeWorld(),original=structuredClone(world);
 const result=craftUntilStage1(world,'p','craft05l:wood-basket',4,{}, {},{maxSeconds:1200});
 assert.equal(result.ok,true);assert.equal(result.completed,2);assert.equal(result.seconds,1200);
 assert.equal(result.stopReason,'TIME_BUDGET_REACHED');
 assert.equal(result.itemWorld.items.find(x=>x.definitionId==='item05l:wood-basket').quantity,2);
 assert.deepEqual(world,original);
});
test('budget lower than a single craft rejects without mutating',()=>{
 const world=makeWorld(),before=structuredClone(world);
 const result=craftUntilStage1(world,'p','craft05l:wood-basket',4,{}, {},{maxSeconds:599});
 assert.equal(result.ok,false);assert.equal(result.completed,0);assert.equal(result.reason,'TIME_BUDGET_REACHED');
 assert.deepEqual(world,before);
});
test('invalid policy keys or malformed time caps are rejected',()=>{
 for(const policy of [{maxSeconds:0},{maxSeconds:1.1},{maxSeconds:'600'},{maxSeconds:90000},{unknown:true},null]){
  const r=craftUntilStage1(makeWorld(),'p','craft05l:wood-basket',1,{}, {},policy);
  assert.equal(r.ok,false);assert.equal(r.reason,'INVALID_REPEAT_POLICY');
 }
});
test('live craft.until charges only completed work then preserves result through save v3',()=>{
 const g=gameWithStock(),before=g.current();
 const result=g.dispatch('craft.until',{recipeId:'craft05l:wood-basket',count:4,policy:{maxSeconds:1200}});
 assert.equal(result.accepted,true,JSON.stringify(result));assert.equal(result.turnsSpent,2);
 assert.equal(result.events[0].payload.stopReason,'TIME_BUDGET_REACHED');
 const after=g.current();assert.equal(after.turn,before.turn+2);
 assert.equal(after.clock.elapsedUnits,before.clock.elapsedUnits+1200);
 const migrated=prepareSecondsV2ToV3(createSaveV2(after,meta,'test',g.registry),g.registry);assert.equal(migrated.ok,true);
 const save=createSaveV3(migrated.state,meta,'test',g.registry);assert.equal(decodeSaveV3(save,g.registry).ok,true);
 const restored=make();restored.applyApprovedSave(save);assert.deepEqual(restored.current(),after);
});
test('failed live budget attempt charges no turns or inventory',()=>{
 const g=gameWithStock(),before=g.current();
 const result=g.dispatch('craft.until',{recipeId:'craft05l:wood-basket',count:2,policy:{maxSeconds:100}});
 assert.equal(result.accepted,false);assert.equal(result.turnsSpent,0);assert.deepEqual(g.current(),before);
});
