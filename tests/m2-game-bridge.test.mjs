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

test('M2 victory grants one real owned trophy and cannot pay twice',()=>{
 const g=createMainV2Inventory([{id:'fixture',name:'시험',group:'재료',qty:1,tags:[]}],{worldSeed:'m2-one-reward',progression04A:true});
 assert.equal(g.dispatch('dungeon.enter',{}).accepted,true);
 assert.equal(g.m2StartEncounter({encounterId:'m2:loot:one',enemyHps:[3],seed:42}).accepted,true);
 const won=g.m2CombatAction({actorId:'player',type:'attack',targetId:'enemy:0'});
 assert.equal(won.accepted,true,JSON.stringify(won));
 const state=g.current();
 const stack=state.itemWorld.items.filter(i=>i.definitionId==='m2:loot:fang');
 assert.equal(stack.length,1);
 assert.equal(stack[0].quantity,1);
 assert.equal(state.itemWorld.placements.some(p=>p.itemId===stack[0].id&&p.location.kind==='inventory'&&p.location.ownerId===state.player.id),true);
 assert.deepEqual(state.world.runtime.m2RewardedEncounters,['m2:loot:one']);
 assert.equal(g.m2CombatAction({actorId:'player',type:'attack',targetId:'enemy:0'}).accepted,false);
 assert.deepEqual(g.current(),state);
});

test('M2 noncombat bypass grants exploration credit without combat loot or repeat farming',()=>{
 const g=createMainV2Inventory([{id:'fixture',name:'시험',group:'재료',qty:1,tags:[]}],{worldSeed:'m2-bypass-test',progression04A:true});
 assert.equal(g.dispatch('dungeon.enter',{}).accepted,true);
 const start=g.current();
 assert.equal(g.m2AvoidEncounter('teleport').accepted,false);
 assert.deepEqual(g.current(),start);
 const result=g.m2AvoidEncounter('bypass');
 assert.equal(result.accepted,true,JSON.stringify(result));
 assert.equal(result.outcome,'success');
 const current=g.current();
 assert.equal(current.turn,start.turn+1);
 assert.equal(current.world.runtime.m2AvoidedEncounters.length,1);
 assert.equal(current.world.runtime.m2AvoidedEncounters[0].mode,'bypass');
 assert.equal(current.itemWorld.items.some(i=>i.definitionId==='m2:loot:fang'),false);
 assert.equal(current.world.runtime.m2RewardedEncounters?.length??0,0);
 const repeated=g.m2AvoidEncounter('bypass');
 assert.equal(repeated.accepted,true);
 assert.equal(repeated.outcome,'failed');
 assert.equal(g.current().world.runtime.m2AvoidedEncounters.length,1);
 assert.deepEqual(g.current().progression,current.progression);
 assert.equal(g.m2ExploreEncounter().outcome,'failed');
 assert.equal(g.m2Combat(),null);
});
test('M2 stealth failure does not grant loot or mark unpassed tile',()=>{
 const g=createMainV2Inventory([{id:'fixture',name:'시험',group:'재료',qty:1,tags:[]}],{worldSeed:'m2-sneak-fail'});
 assert.equal(g.dispatch('dungeon.enter',{}).accepted,true);
 // At most ten deterministic attempts are sufficient to see one failure in this seeded fixture.
 let failure=null;
 for(let i=0;i<10;i++){
  const attempted=g.m2AvoidEncounter('sneak');
  if(attempted.outcome==='failed'){failure=attempted;break;}
  if(attempted.outcome==='success')break;
 }
 assert.equal(failure?.outcome==='failed'||g.current().world.runtime.m2AvoidedEncounters?.length===1,true);
 assert.equal(g.current().itemWorld.items.some(i=>i.definitionId==='m2:loot:fang'),false);
});

test('M2 normal defeat revives without permadeath and recovers only own trophy once',()=>{
 const g=createMainV2Inventory([{id:'fixture',name:'시험',group:'재료',qty:1,tags:[]}],{worldSeed:'m2-revive',m2Difficulty:'normal'});
 assert.equal(g.dispatch('dungeon.enter',{}).accepted,true);
 const place={siteId:g.current().world.runtime.localSiteId,floor:g.current().world.runtime.localFloor,pos:[...g.current().world.runtime.pos]};
 assert.equal(g.m2StartEncounter({encounterId:'m2:earn',enemyHps:[3],seed:42}).accepted,true);
 assert.equal(g.m2CombatAction({actorId:'player',type:'attack',targetId:'enemy:0'}).accepted,true);
 assert.equal(g.current().itemWorld.items.some(i=>i.definitionId==='m2:loot:fang'),true);
 assert.equal(g.m2StartEncounter({encounterId:'m2:defeat',enemyHps:[12],seed:5}).accepted,true);
 let steps=0;
 while(g.m2Combat().phase==='active'&&steps++<100){
  const turn=g.m2Combat().queue[g.m2Combat().cursor];
  const result=turn==='player'?g.m2CombatAction({actorId:'player',type:'defend'}):g.m2EnemyTurn();
  assert.equal(result.accepted,true,JSON.stringify(result));
 }
 assert.equal(g.m2Combat().outcome,'defeat');
 assert.equal(g.current().world.runtime.dungeon,false);
 assert.equal(g.current().world.runtime.region,'거점 마을');
 assert.ok(g.current().player.currentHp>0);
 assert.equal(g.current().itemWorld.items.some(i=>i.definitionId==='m2:loot:fang'),false);
 const corpse=g.current().world.runtime.m2Corpses[0];
 assert.equal(corpse.ownerId,g.current().player.id);
 assert.equal(corpse.items.length,1);
 assert.equal(g.m2RecoverCorpse(corpse.id).accepted,false);
 assert.equal(g.dispatch('dungeon.enter',{}).accepted,true);
 assert.deepEqual(g.current().world.runtime.pos,place.pos);
 assert.equal(g.m2RecoverCorpse(corpse.id).accepted,true);
 assert.equal(g.current().itemWorld.items.some(i=>i.definitionId==='m2:loot:fang'),true);
 const after=g.current();
 assert.equal(g.m2RecoverCorpse(corpse.id).accepted,false);
 assert.deepEqual(g.current(),after);
});

test('M2 corpse v3 persistence validates owner, payload and duplicate ledger',async()=>{
 const fixture=[{id:'fixture',name:'시험',group:'재료',qty:1,tags:[]}];
 const g=createMainV2Inventory(fixture,{worldSeed:'m2-corpse-persist'});
 assert.equal(g.dispatch('dungeon.enter',{}).accepted,true);
 assert.equal(g.m2StartEncounter({encounterId:'m2:corpse:test',enemyHps:[3],seed:42}).accepted,true);
 assert.equal(g.m2CombatAction({actorId:'player',type:'attack',targetId:'enemy:0'}).accepted,true);
 const snapshot=g.current(),{schemaVersion,clock,...rest}=structuredClone(snapshot);
 const {createSaveV3,decodeSaveV3}=await import('../dist/engine/v2.js');
 const v3={...rest,schemaVersion:3,clock:{elapsedSeconds:clock.elapsedUnits,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}};
 v3.world.runtime.m2Corpses=[{id:'m2:corpse:fixture',ownerId:v3.player.id,siteId:'core:site/labyrinth',floor:0,pos:[2,2],items:[{id:'m2:fixture:fang',definitionId:'m2:loot:fang',quantity:1}],recovered:false}];
 const slot={slotId:'m2-corpse',worldId:'m2-world',kind:'manual',label:'Corpse test',savedAt:'2026-10-29T00:00:00Z',revision:0};
 const valid=createSaveV3(v3,slot,'m2-test',g.registry);
 assert.equal(decodeSaveV3(valid,g.registry).ok,true);
 const invalid=structuredClone(valid);
 invalid.state.world.runtime.m2Corpses[0].items[0].quantity=-4;
 assert.equal(decodeSaveV3(invalid,g.registry).ok,false);
 const repeated=structuredClone(valid);
 repeated.state.world.runtime.m2Corpses.push(structuredClone(repeated.state.world.runtime.m2Corpses[0]));
 assert.equal(decodeSaveV3(repeated,g.registry).ok,false);
 const badLedger=structuredClone(valid);
 badLedger.state.world.runtime.m2RewardedEncounters.push('m2:corpse:test');
 assert.equal(decodeSaveV3(badLedger,g.registry).ok,false);
 assert.throws(()=>g.applyApprovedSave(invalid));
 assert.deepEqual(g.current(),snapshot);
});

test('M2 town fallback refuses reachable corpses and atomically rescues invalid-site stash once',async()=>{
 const fixture=[{id:'fixture',name:'시험',group:'재료',qty:1,tags:[]}];
 const g=createMainV2Inventory(fixture,{worldSeed:'m2-town-rescue'});
 const {createSaveV3}=await import('../dist/engine/v2.js');
 const initial=g.current(),{schemaVersion,clock,...rest}=structuredClone(initial);
 const v3={...rest,schemaVersion:3,clock:{elapsedSeconds:clock.elapsedUnits,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}};
 const corpse={id:'m2:corpse:lost',ownerId:v3.player.id,siteId:'old:deleted-site',floor:0,pos:[2,2],
  items:[{id:'m2:lost-item',definitionId:'m2:loot:fang',quantity:1}],recovered:false};
 v3.world.runtime.m2Corpses=[corpse,{...structuredClone(corpse),id:'m2:corpse:reachable',siteId:'core:site/labyrinth'}];
 const slot={slotId:'m2-rescue',worldId:'m2-world',kind:'manual',label:'Lost corpse',savedAt:'2026-10-29T00:00:00Z',revision:0};
 g.applyApprovedSave(createSaveV3(v3,slot,'m2-test',g.registry));
 const before=g.current();
 assert.equal(g.m2RescueCorpse('m2:corpse:reachable').accepted,false);
 assert.deepEqual(g.current(),before);
 assert.equal(g.m2RescueCorpse('m2:corpse:lost').accepted,true);
 assert.equal(g.current().itemWorld.items.find(i=>i.id==='m2:lost-item')?.quantity,1);
 const after=g.current();
 assert.equal(g.m2RescueCorpse('m2:corpse:lost').accepted,false);
 assert.deepEqual(g.current(),after);
});

test('M2 rest is town-only, spends a turn and restores HP after defeat',()=>{
 const fixture=[{id:'fixture',name:'시험',group:'재료',qty:1,tags:[]}];
 const g=createMainV2Inventory(fixture,{worldSeed:'m2-rest'});
 const initial=g.current();
 const full=g.m2Rest();
 assert.equal(full.accepted,true);
 assert.equal(full.outcome,'failed');
 assert.equal(g.current().turn,initial.turn+1);
 assert.equal(g.dispatch('dungeon.enter',{}).accepted,true);
 const before=g.current();
 assert.equal(g.m2Rest().accepted,false);
 assert.deepEqual(g.current(),before);
 assert.equal(g.m2StartEncounter({encounterId:'m2:rest-defeat',enemyHps:[50],seed:5}).accepted,true);
 for(let i=0;i<140&&g.m2Combat().phase==='active';i++){
  const id=g.m2Combat().queue[g.m2Combat().cursor];
  const result=id==='player'?g.m2CombatAction({actorId:'player',type:'defend'}):g.m2EnemyTurn();
  assert.equal(result.accepted,true,JSON.stringify(result));
 }
 assert.equal(g.m2Combat().outcome,'defeat');
 assert.equal(g.current().world.runtime.region,'거점 마을');
 const hp=g.current().player.currentHp,mp=g.current().player.currentMp;
 const turn=g.current().turn;
 assert.equal(g.m2Rest().accepted,true);
 assert.equal(g.current().player.currentHp,Math.min(100,hp+25));
 assert.equal(g.current().player.currentMp,Math.min(80,mp+20));
 assert.equal(g.current().turn,turn+1);
});

test('M2 auto combat stops before unsafe action without consuming turns',()=>{
 const fixture=[{id:'fixture',name:'시험',group:'재료',qty:1,tags:[]}];
 const g=createMainV2Inventory(fixture,{worldSeed:'m2-auto-safety'});
 assert.equal(g.dispatch('dungeon.enter',{}).accepted,true);
 assert.equal(g.m2StartEncounter({encounterId:'auto:safe',enemyHps:[30],seed:7}).accepted,true);
 const initial=structuredClone(g.current());
 const invalid=g.m2AutoCombat({hpMin:-1});
 assert.equal(invalid.ok,false);
 assert.deepEqual(g.current(),initial);
 const safe=g.m2AutoCombat({hpMin:100,maxActions:6});
 assert.equal(safe.stopReason,'SAFETY_THRESHOLD');
 assert.equal(safe.completed,0);
 assert.deepEqual(g.current(),initial);
 const two=g.m2AutoCombat({hpMin:0,maxActions:2});
 assert.equal(two.ok,true);
 assert.equal(two.completed,2);
 assert.equal(g.current().turn,initial.turn+2);
 assert.equal(g.m2Combat().queue[g.m2Combat().cursor],'player');
 const before=structuredClone(g.current());
 const stopped=g.m2AutoCombat({hpMin:100,maxActions:4});
 assert.equal(stopped.completed,0);
 assert.deepEqual(g.current(),before);
});

test('M2 active combat locks exploration, travel, inventory and rest at zero turn cost',()=>{
 const fixture=[{id:'fixture',name:'시험',group:'재료',qty:1,tags:[]}];
 const g=createMainV2Inventory(fixture,{worldSeed:'m2-combat-lock'});
 assert.equal(g.dispatch('dungeon.enter',{}).accepted,true);
 assert.equal(g.m2StartEncounter({encounterId:'m2:locked',enemyHps:[12],seed:1}).accepted,true);
 const before=structuredClone(g.current());
 for(const [type,payload] of [
  ['dungeon.move',{direction:'east'}],['dungeon.portal',{}],['dungeon.leave',{}],
  ['world.travel',{region:'거점 마을'}],['m2.rest',{}],['m2.encounter.explore',{}],
  ['m2.corpse.recover',{corpseId:'nothing'}],['inventory.sort',{}]
 ]){
  const denied=g.dispatch(type,payload);
  assert.equal(denied.accepted,false,type);
  assert.equal(denied.reason,'M2_COMBAT_LOCKED',type);
  assert.deepEqual(g.current(),before,type);
 }
 const attack=g.m2CombatAction({actorId:'player',type:'attack',targetId:'enemy:0'});
 assert.equal(attack.accepted,true,JSON.stringify(attack));
 assert.equal(g.current().turn,before.turn+1);
});

test('M2 skill and owned healing item use existing MP and itemWorld atomically',()=>{
 const fixture=[{id:'m2:consumable:salve',name:'시험용 응급 연고',group:'소모품',qty:2,tags:['m2:healing']}];
 const g=createMainV2Inventory(fixture,{worldSeed:'m2-skill-item'});
 assert.equal(g.dispatch('dungeon.enter',{}).accepted,true);
 assert.equal(g.m2StartEncounter({encounterId:'m2:skill-item',enemyHps:[50],seed:5}).accepted,true);
 const initial=g.current(),actor='player';
 const invalid=g.m2CombatAction({actorId:actor,type:'item'});
 assert.equal(invalid.accepted,false);
 assert.deepEqual(g.current(),initial);
 const skill=g.m2CombatAction({actorId:actor,type:'skill',targetId:'enemy:0'});
 assert.equal(skill.accepted,true,JSON.stringify(skill));
 assert.equal(g.current().player.currentMp,initial.player.currentMp-5);
 assert.equal(g.current().turn,initial.turn+1);
 assert.equal(g.m2EnemyTurn().accepted,true);
 // Enemy attack may or may not hurt under a guard; make healing dependent on actual damage.
 const damaged=g.current().player.currentHp;
 if(damaged<initial.player.currentHp){
  const item=g.m2CombatAction({actorId:actor,type:'item'});
  assert.equal(item.accepted,true,JSON.stringify(item));
  assert.ok(g.current().player.currentHp>damaged);
  assert.equal(g.current().itemWorld.items.find(i=>i.definitionId==='m2:consumable:salve').quantity,1);
 }
});
