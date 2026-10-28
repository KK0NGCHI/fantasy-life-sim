import test from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
test('M2 combat is dispatched from dungeon and cannot move battle position',()=>{
 const g=createMainV2Inventory([{id:'fixture',name:'시험',group:'재료',qty:1,tags:[]}],{worldSeed:'m2-bridge'});
 assert.equal(g.m2StartEncounter({encounterId:'illegal',enemyHps:[7]}).accepted,false);
 assert.equal(g.dispatch('dungeon.enter',{}).accepted,true);
 const before=structuredClone(g.current().world.runtime.pos);
 const started=g.m2StartEncounter({encounterId:'m2:bridge:1',enemyHps:[3],seed:1});
 assert.equal(started.accepted,true,JSON.stringify(started));
 assert.equal(g.m2Combat().queue[g.m2Combat().cursor],'player');
 assert.deepEqual(g.current().world.runtime.pos,before);
 const fail=g.m2CombatAction({actorId:'enemy:0',type:'attack',targetId:'player'});
 assert.equal(fail.accepted,false);
 const moved=g.m2CombatAction({actorId:'player',type:'move'});
 assert.equal(moved.accepted,false);
 const attacked=g.m2CombatAction({actorId:'player',type:'attack',targetId:'enemy:0'});
 assert.equal(attacked.accepted,true,JSON.stringify(attacked));
 assert.equal(g.m2Combat().outcome,'victory');
 assert.deepEqual(g.current().world.runtime.pos,before);
 assert.equal(g.m2CombatAction({actorId:'player',type:'attack',targetId:'enemy:0'}).accepted,false);
});

test('M2 exploration encounter is consumed once per dungeon tile and enemy turn follows AI',()=>{
 const g=createMainV2Inventory([{id:'fixture',name:'시험',group:'재료',qty:1,tags:[]}],{worldSeed:'m2-explore'});
 assert.equal(g.m2ExploreEncounter().accepted,false);
 assert.equal(g.dispatch('dungeon.enter',{}).accepted,true);
 const pos=structuredClone(g.current().world.runtime.pos);
 const began=g.m2ExploreEncounter();
 assert.equal(began.accepted,true,JSON.stringify(began));
 assert.equal(g.m2Combat().participants.length,2);
 const first=g.m2CombatAction({actorId:'player',type:'defend'});
 assert.equal(first.accepted,true);
 const enemy=g.m2EnemyTurn();
 assert.equal(enemy.accepted,true,JSON.stringify(enemy));
 assert.deepEqual(g.current().world.runtime.pos,pos);
 assert.equal(g.m2EnemyTurn().accepted,false);
 let outcome=g.m2Combat().phase;
 for(let i=0;i<24&&outcome==='active';i++){
  const action=g.m2Combat().queue[g.m2Combat().cursor]==='player'?
   g.m2CombatAction({actorId:'player',type:'retreat'}):g.m2EnemyTurn();
  assert.equal(action.accepted,true,JSON.stringify(action));
  outcome=g.m2Combat().phase;
 }
 assert.equal(outcome,'resolved');
 const before=structuredClone(g.current().world.runtime.m2EncounterTiles);
 const again=g.m2ExploreEncounter();
 assert.equal(again.outcome,'failed');
 assert.deepEqual(g.current().world.runtime.m2EncounterTiles,before);
 assert.deepEqual(g.current().world.runtime.pos,pos);
});

test('M2 mid-combat v3 roundtrip preserves initiative, HP and one-time outcome',async()=>{
 const fixture=[{id:'fixture',name:'시험',group:'재료',qty:1,tags:[]}];
 const g=createMainV2Inventory(fixture,{worldSeed:'m2-v3-roundtrip'});
 assert.equal(g.dispatch('dungeon.enter',{}).accepted,true);
 assert.equal(g.m2StartEncounter({encounterId:'save-combat',enemyHps:[8],seed:42}).accepted,true);
 assert.equal(g.m2CombatAction({actorId:'player',type:'defend'}).accepted,true);
 const before=g.current();
 const {createSaveV3,decodeSaveV3}=await import('../dist/engine/v2.js');
 const {schemaVersion,clock,...rest}=structuredClone(before);
 const v3={...rest,schemaVersion:3,clock:{elapsedSeconds:clock.elapsedUnits,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}};
 const slot={slotId:'m2-in-combat',worldId:'m2-world',kind:'manual',label:'M2 combat',savedAt:'2026-10-29T00:00:00Z',revision:0};
 const valid=createSaveV3(v3,slot,'m2-test',g.registry);
 const restored=createMainV2Inventory(fixture,{worldSeed:'m2-v3-roundtrip'});
 restored.applyApprovedSave(structuredClone(valid));
 assert.deepEqual(restored.current(),before);
 assert.equal(restored.m2Combat().queue[restored.m2Combat().cursor],'enemy:0');
 assert.equal(restored.m2EnemyTurn().accepted,true);
 const corrupted=structuredClone(valid);
 corrupted.state.world.runtime.m2Combat.cursor=999;
 assert.equal(decodeSaveV3(corrupted,g.registry).ok,false);
 assert.throws(()=>g.applyApprovedSave(corrupted));
 assert.deepEqual(g.current(),before);
});
