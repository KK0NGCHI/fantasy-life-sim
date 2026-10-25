import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildItemRegistry,createRandomState,createSaveV2,decodeSaveV2,exportBackupV2,parseBackupV2,migrateV1ToV2} from '../dist/engine/index.js';
const registry=buildItemRegistry({
 items:[{id:'core:chest',nameKey:'chest',categoryId:'core:furniture',tags:[],capabilities:['storage']},
 {id:'core:sword',nameKey:'sword',categoryId:'core:equipment',tags:['weapon:sword'],capabilities:['equip'],allowsMaterial:true}],
 materials:[{id:'core:iron',nameKey:'iron',tags:['metal'],properties:{hardness:1}}],
 effects:[{id:'core:glow',nameKey:'glow',tags:[]}],
 categories:['core:furniture','core:equipment'],rarities:['core:rare']
}).registry;
assert.ok(registry);
const v1=()=>({schemaVersion:1,turn:12,clock:{elapsedUnits:55},rng:createRandomState('seed'),
 player:{id:'player',regionId:'camp',currentHp:10,currentMp:2,hunger:4,statusEffects:[]},
 inventory:{items:[{id:'s1',definitionId:'core:sword',quantity:1}]},
 world:{activeRegionId:'camp'},progression:{skillExperience:{}},flags:{}});
const slot={slotId:'manual-1',worldId:'world-1',kind:'manual',label:'before dungeon',savedAt:'2026-10-22T01:00:00Z',revision:0};
function richState(){
 const base=v1();const {inventory,schemaVersion,...common}=base;
 return {...common,schemaVersion:2,itemWorld:{
 items:[{id:'c1',definitionId:'core:chest',quantity:1},
 {id:'s1',definitionId:'core:sword',quantity:1,materialId:'core:iron',quality:5,rarityId:'core:rare',enhancementLevel:2,effects:[{definitionId:'core:glow',level:3}],condition:{durability:20}}],
 placements:[{itemId:'c1',location:{kind:'inventory',ownerId:'player'}},{itemId:'s1',location:{kind:'container',containerId:'c1'}}],
 containers:[{containerId:'c1',itemIds:['s1']}] }};
}
test('v2 JSON round-trip retains quality, material, rarity, enchantments, containers, time, RNG',()=>{
 const state=richState();const save=createSaveV2(state,slot,'test-content',registry);
 const result=parseBackupV2(exportBackupV2(save,registry),registry);
 assert.equal(result.ok,true);assert.deepEqual(result.save.state,state);
 state.itemWorld.items[1].quality=999;
 assert.equal(result.save.state.itemWorld.items[1].quality,5);
});
test('v2 rejects orphan, duplicate, and circular storage references',()=>{
 const save=createSaveV2(richState(),slot,'test',registry);
 const bad=structuredClone(save);bad.state.itemWorld.placements[1].location.containerId='missing';
 assert.equal(decodeSaveV2(bad,registry).ok,false);
 const cycle=structuredClone(save);cycle.state.itemWorld.placements[0].location={kind:'container',containerId:'c1'};
 cycle.state.itemWorld.containers[0].itemIds.push('c1');
 assert.equal(decodeSaveV2(cycle,registry).ok,false);
});
test('v2 rejects missing definition, new unknown fields, future version and v1 without migration',()=>{
 const save=createSaveV2(richState(),slot,'test',registry);
 assert.equal(decodeSaveV2({...save,saveVersion:3},registry).ok,false);
 assert.equal(decodeSaveV2({...save,state:{...save.state,itemWorld:{...save.state.itemWorld,items:[{...save.state.itemWorld.items[0],newMagic:7}]}}},registry).ok,false);
 const bad=structuredClone(save);bad.state.itemWorld.items[0].definitionId='missing';
 assert.equal(decodeSaveV2(bad,registry).ok,false);
 assert.equal(decodeSaveV2({format:'somnium-save',saveVersion:1,state:v1()},registry).ok,false);
});
test('v1 migration is explicit, nonmutating and checked against content registry',()=>{
 const old=v1(),before=JSON.stringify(old);
 const migrated=migrateV1ToV2(old,registry);
 assert.equal(migrated.ok,true);assert.equal(migrated.state.schemaVersion,2);
 assert.deepEqual(migrated.state.itemWorld.placements,[{itemId:'s1',location:{kind:'inventory',ownerId:'player'}}]);
 assert.equal(JSON.stringify(old),before);
 assert.equal(createSaveV2(migrated.state,slot,'test',registry).state.itemWorld.items.length,1);
 const invalid=v1();invalid.inventory.items[0].definitionId='unknown';
 assert.equal(migrateV1ToV2(invalid,registry).ok,false);
});
