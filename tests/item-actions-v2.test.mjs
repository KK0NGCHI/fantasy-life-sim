import {test} from 'node:test';import assert from 'node:assert/strict';
import {buildItemRegistry,createRandomState,dispatchItemAction,createSaveV2,decodeSaveV2} from '../dist/engine/index.js';
const registry=buildItemRegistry({items:[
 {id:'core:box',nameKey:'box',categoryId:'box',tags:[],capabilities:['storage']},
 {id:'core:berry',nameKey:'berry',categoryId:'food',tags:['food'],capabilities:['eat']},
 {id:'core:ore',nameKey:'ore',categoryId:'ore',tags:[],capabilities:[],allowsMaterial:true},
 {id:'core:sword',nameKey:'sword',categoryId:'equipment',tags:[],capabilities:['equip'],allowsMaterial:true}],
 categories:['box','food','ore','equipment'],rarities:['rare'],materials:[{id:'iron',nameKey:'iron',tags:[],properties:{}}],
 effects:[],recipes:[{id:'craft:sword',stationTags:[],resultDefinitionId:'core:sword',
 ingredients:[{quantity:2,anyOf:[{kind:'item',definitionId:'core:ore'}]}]}]}).registry;assert.ok(registry);
const state=()=>({schemaVersion:2,turn:2,clock:{elapsedUnits:0},rng:createRandomState('test'),
 player:{id:'player',regionId:'camp',currentHp:10,currentMp:5,hunger:1,statusEffects:[]},
 world:{activeRegionId:'camp'},progression:{skillExperience:{}},flags:{},
 itemWorld:{items:[{id:'box',definitionId:'core:box',quantity:1},{id:'ore',definitionId:'core:ore',quantity:3,materialId:'iron'},
 {id:'berry',definitionId:'core:berry',quantity:2}],placements:[
 {itemId:'box',location:{kind:'inventory',ownerId:'player'}},
 {itemId:'ore',location:{kind:'inventory',ownerId:'player'}},
 {itemId:'berry',location:{kind:'inventory',ownerId:'player'}}],containers:[]}});
const run=(s,command)=>dispatchItemAction(s,command,registry);
test('moving into a container and back preserves v2 save roundtrip',()=>{
 const base=state(),m=run(base,{type:'item.move',itemId:'ore',to:{kind:'container',containerId:'box'}});
 assert.equal(m.accepted,true);assert.equal(m.nextState.turn,3);assert.equal(base.itemWorld.containers.length,0);
 assert.equal(m.nextState.itemWorld.containers[0].itemIds[0],'ore');
 const slot={slotId:'a',worldId:'w',kind:'manual',label:'a',savedAt:'2026-10-22',revision:0};
 assert.equal(decodeSaveV2(createSaveV2(m.nextState,slot,'test',registry),registry).ok,true);
 const back=run(m.nextState,{type:'item.move',itemId:'ore',to:{kind:'inventory',ownerId:'player'}});
 assert.equal(back.accepted,true);assert.equal(back.nextState.itemWorld.containers[0].itemIds.length,0);
});
test('consumption takes one turn, failure takes one turn, bad command zero',()=>{
 const s=state(),r=run(s,{type:'item.consume',itemId:'berry',quantity:1});
 assert.equal(r.accepted,true);assert.equal(r.nextState.itemWorld.items.find(i=>i.id==='berry').quantity,1);
 const fail=run(s,{type:'item.consume',itemId:'ore',quantity:1});
 assert.equal(fail.accepted,true);assert.equal(fail.outcome,'failed');assert.equal(fail.nextState.turn,3);
 assert.deepEqual(run(s,{type:'item.consume',itemId:'berry',quantity:0}),{accepted:false,reason:'INVALID_COMMAND',turnsSpent:0});
});
test('crafting consumes selected ingredients, produces a plain instance without fabricated quality',()=>{
 const s=state(),result=run(s,{type:'item.craft',recipeId:'craft:sword',selections:[{itemId:'ore',quantity:2}],resultId:'new-sword'});
 assert.equal(result.accepted,true);assert.equal(result.nextState.itemWorld.items.find(i=>i.id==='ore').quantity,1);
 assert.deepEqual(result.nextState.itemWorld.items.find(i=>i.id==='new-sword'),{id:'new-sword',definitionId:'core:sword',quantity:1});
 assert.equal(result.nextState.turn,3);
});
test('invalid ingredient failure does not consume inventory',()=>{
 const s=state(),r=run(s,{type:'item.craft',recipeId:'craft:sword',selections:[{itemId:'berry',quantity:2}],resultId:'sword-new'});
 assert.equal(r.accepted,true);assert.equal(r.outcome,'failed');assert.deepEqual(r.nextState.itemWorld.items,s.itemWorld.items);
});
test('equipment requires equip capability',()=>{
 const s=state(),fail=run(s,{type:'item.move',itemId:'berry',to:{kind:'equipped',ownerId:'player',slotId:'hand'}});
 assert.equal(fail.outcome,'failed');
});
