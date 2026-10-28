import {test} from 'node:test';
import assert from 'node:assert/strict';
import {craftUntilStage1} from '../src/crafting-workshop-stage1.js';
import {advanceCraftSurvivalStage1} from '../src/crafting-survival-progress-stage1.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const world=owner=>({items:[{id:'wood',definitionId:'item05h:oak-planks',quantity:10},{id:'rope',definitionId:'item05l:grass-rope',quantity:5}],placements:['wood','rope'].map(itemId=>({itemId,location:{kind:'inventory',ownerId:owner}})),containers:[]});
const player={id:'p',currentHp:100,currentMp:80,hunger:30};
const cfg={worldSeed:'stage1-survival-progress',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,preferences:{getItem:()=>null,setItem:()=>{}}};
const mk=()=>createMainV2Inventory([{id:'starter:stone',name:'시작',group:'재료',qty:1,tags:[]}],cfg);
const meta={slotId:'s1-survival',worldId:'w',kind:'manual',label:'survival',savedAt:'2026-10-28T00:00:00Z',revision:0};
test('repeat evaluates survival floor between completed crafts',()=>{
 const stock=world('p'),original=structuredClone(stock);
 const out=craftUntilStage1(stock,'p','craft05l:wood-basket',5,{}, {},{},player,{minHunger:20},{hunger:-6});
 assert.equal(out.ok,true);assert.equal(out.completed,2);
 assert.equal(out.stopReason,'SURVIVAL_LIMIT_REACHED');
 assert.equal(out.player.hunger,18);assert.equal(out.seconds,1200);
 assert.deepEqual(stock,original);
});
test('invalid positive, non-finite or unrecognized survival changes reject',()=>{
 for(const v of [{hunger:1},{hp:Infinity},{extra:1},{mp:-1001},null])
  assert.equal(advanceCraftSurvivalStage1(player,v).ok,false);
});
test('live dispatch persists bounded survival progression in save v3',()=>{
 const initial=mk(),state=initial.current(),prepared=prepareSecondsV2ToV3(createSaveV2(state,meta,'test',initial.registry),initial.registry);
 assert.equal(prepared.ok,true);
 const save=createSaveV3(prepared.state,meta,'test',initial.registry),owned=world(save.state.player.id);
 save.state.itemWorld={...save.state.itemWorld,items:[...save.state.itemWorld.items,...owned.items],placements:[...save.state.itemWorld.placements,...owned.placements]};
 const g=mk();g.applyApprovedSave(save);const before=g.current();
 const result=g.dispatch('craft.until',{recipeId:'craft05l:wood-basket',count:5,
  survivalLimits:{minHunger:70},survivalDelta:{hunger:-8}});
 assert.equal(result.accepted,true,JSON.stringify(result));assert.equal(result.turnsSpent,2);
 assert.equal(result.events[0].payload.stopReason,'SURVIVAL_LIMIT_REACHED');
 const after=g.current();assert.equal(after.player.hunger,before.player.hunger-16);
 assert.equal(after.clock.elapsedUnits,before.clock.elapsedUnits+1200);
 const converted=prepareSecondsV2ToV3(createSaveV2(after,meta,'test',g.registry),g.registry);assert.equal(converted.ok,true);
 const persisted=createSaveV3(converted.state,meta,'test',g.registry);
 assert.equal(decodeSaveV3(persisted,g.registry).ok,true);
 const copy=mk();copy.applyApprovedSave(persisted);assert.deepEqual(copy.current(),after);
});
