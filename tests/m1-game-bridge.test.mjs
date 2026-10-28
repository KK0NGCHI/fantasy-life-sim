import {createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';

test('M1 town controls dispatch through active game bridge and charge global clock exactly once',()=>{
 const bridge=createMainV2Inventory([{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}],{worldSeed:'m1-test-seed'});
 const initial=bridge.current();
 assert.equal(initial.world.runtime.m1Life,undefined);
 const bought=bridge.m1Action({type:'trade.buy',item:'m1:seed:wheat',quantity:1});
 assert.equal(bought.accepted,true,JSON.stringify(bought));
 assert.equal(bridge.current().turn,initial.turn+1);
 assert.equal(bridge.current().clock.elapsedUnits,initial.clock.elapsedUnits+60);
 assert.equal(bridge.m1Life().inventory['m1:seed:wheat'],1);
 const planted=bridge.m1Action({type:'farm.plant',crop:'wheat',plot:0});
 assert.equal(planted.accepted,true,JSON.stringify(planted));
 const advance=bridge.m1Action({type:'time.advance',seconds:86400});
 assert.equal(advance.accepted,true,JSON.stringify(advance));
 assert.equal(bridge.current().clock.elapsedUnits,initial.clock.elapsedUnits+120+86400);
 assert.equal(bridge.m1Life().now,bridge.current().clock.elapsedUnits);
 const harvested=bridge.m1Action({type:'farm.harvest',plot:0});
 assert.equal(harvested.accepted,true,JSON.stringify(harvested));
 assert.equal(bridge.m1Life().inventory['m1:crop:wheat'],3);
 const cooked=bridge.m1Action({type:'food.cook',recipe:'m1:food:bread'});
 assert.equal(cooked.accepted,true,JSON.stringify(cooked));
 const eaten=bridge.m1Action({type:'food.eat',item:'m1:food:bread'});
 assert.equal(eaten.accepted,true,JSON.stringify(eaten));
 assert.equal(bridge.current().player.hunger,100);
 assert.equal(bridge.m1Life().turn,bridge.current().turn);
});

test('M1 opt-in life extension survives strict v3 save roundtrip and rejects corruption',()=>{
 const bridge=createMainV2Inventory([{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}],{worldSeed:'m1-save-seed'});
 assert.equal(bridge.m1Action({type:'trade.buy',item:'m1:seed:potato',quantity:1}).accepted,true);
 assert.equal(bridge.m1Action({type:'farm.plant',plot:0,crop:'potato'}).accepted,true);
 const current=bridge.current();
 const {schemaVersion,clock,...rest}=structuredClone(current);
 const v3={...rest,schemaVersion:3,clock:{elapsedSeconds:clock.elapsedUnits,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}};
 const slot={slotId:'m1-test',worldId:'m1-world',kind:'manual',label:'M1',savedAt:'2026-10-28T00:00:00.000Z',revision:0};
 const save=createSaveV3(v3,slot,'m1-test',bridge.registry);
 const parsed=decodeSaveV3(JSON.parse(JSON.stringify(save)),bridge.registry);
 assert.equal(parsed.ok,true,JSON.stringify(parsed));
 assert.deepEqual(parsed.save.state.world.runtime.m1Life,current.world.runtime.m1Life);
 const bad=structuredClone(save);
 bad.state.world.runtime.m1Life.gold=-1;
 assert.deepEqual(decodeSaveV3(bad,bridge.registry),{ok:false,reason:'INVALID_DATA'});
});

test('M1 real failed harvest spends one turn without granting crops',()=>{
 const b=createMainV2Inventory([{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}],{worldSeed:'m1-failed-seed'});
 const before=b.current();
 const result=b.m1Action({type:'farm.harvest',plot:0});
 assert.equal(result.accepted,true);
 assert.equal(result.outcome,'failed');
 assert.equal(b.current().turn,before.turn+1);
 assert.equal(b.current().clock.elapsedUnits,before.clock.elapsedUnits+60);
 assert.equal(b.m1Life().inventory['m1:crop:wheat']??0,0);
 const malformed=b.m1Action({type:'farm.harvest',plot:-1});
 assert.equal(malformed.accepted,false);
 assert.equal(b.current().turn,before.turn+1);
});

test('M1 purchase, harvest and food use the existing owner-scoped itemWorld',()=>{
 const b=createMainV2Inventory([{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}],{worldSeed:'m1-ledger-seed'});
 const owned=id=>b.current().itemWorld.items.filter(i=>i.definitionId===id&&b.current().itemWorld.placements.some(p=>
  p.itemId===i.id&&p.location.kind==='inventory'&&p.location.ownerId===b.current().player.id))
  .reduce((sum,i)=>sum+i.quantity,0);
 assert.equal(b.m1Action({type:'trade.buy',item:'m1:seed:wheat',quantity:1}).accepted,true);
 assert.equal(owned('m1:seed:wheat'),1);
 assert.equal(b.current().world.runtime.m1Life.inventory['m1:seed:wheat']??0,0);
 assert.equal(b.m1Action({type:'farm.plant',plot:0,crop:'wheat'}).accepted,true);
 assert.equal(owned('m1:seed:wheat'),0);
 assert.equal(b.m1Action({type:'time.advance',seconds:86400}).accepted,true);
 assert.equal(b.m1Action({type:'farm.harvest',plot:0}).accepted,true);
 assert.equal(owned('m1:crop:wheat'),3);
 assert.equal(b.m1Action({type:'food.cook',recipe:'m1:food:bread'}).accepted,true);
 assert.equal(owned('m1:crop:wheat'),1);
 assert.equal(owned('m1:food:bread'),1);
 assert.equal(b.m1Action({type:'food.eat',item:'m1:food:bread'}).accepted,true);
 assert.equal(owned('m1:food:bread'),0);
 assert.equal(b.m1Action({type:'trade.sell',item:'m1:crop:wheat',quantity:1}).accepted,true);
 assert.equal(owned('m1:crop:wheat'),0);
});

test('merchant restocks after 7 in-game days across authoritative world clock and saves checkpoint',()=>{
 const b=createMainV2Inventory([{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}],{worldSeed:'m1-restock-seed'});
 assert.equal(b.m1Action({type:'trade.buy',item:'m1:seed:wheat',quantity:2}).accepted,true);
 assert.equal(b.m1Life().merchant.stock['m1:seed:wheat'],6);
 for(let day=0;day<7;day++){
  const result=b.m1Action({type:'time.advance',seconds:86400});
  assert.equal(result.accepted,true,JSON.stringify(result));
 }
 assert.equal(b.m1Life().merchant.stock['m1:seed:wheat'],8);
 assert.equal(b.m1Life().merchant.lastRestock,7*86400);
 assert.equal(b.current().world.runtime.m1Life.merchant.lastRestock,7*86400);
});

test('M1 automatic plan matches manual actions for turns, clock, items and RNG',()=>{
 const fixture=[{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}];
 const options={worldSeed:'m1-parity-seed'};
 const manual=createMainV2Inventory(fixture,options);
 const automated=createMainV2Inventory(fixture,options);
 const actions=[
  {type:'trade.buy',item:'m1:seed:wheat',quantity:1},
  {type:'farm.plant',plot:0,crop:'wheat'},
  {type:'time.advance',seconds:86400},
  {type:'farm.harvest',plot:0},
  {type:'food.cook',recipe:'m1:food:bread'},
  {type:'food.eat',item:'m1:food:bread'},
  {type:'trade.sell',item:'m1:crop:wheat',quantity:1}
 ];
 for(const action of actions)assert.equal(manual.m1Action(action).accepted,true);
 const result=automated.m1RunPlan(actions,{hungerMin:1});
 assert.equal(result.ok,true);
 assert.equal(result.completed,actions.length);
 assert.equal(result.stopReason,'COMPLETED');
 assert.deepEqual(automated.current(),manual.current());
});
test('M1 automatic safety stops before consuming any turn and valid failed attempt stops after one turn',()=>{
 const fixture=[{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}];
 const a=createMainV2Inventory(fixture,{worldSeed:'m1-safety-seed'});
 const first=a.m1RunPlan([{type:'farm.harvest',plot:0}],{hungerMin:90});
 assert.equal(first.stopReason,'SAFETY_THRESHOLD');
 assert.equal(first.completed,0);
 assert.equal(a.current().turn,0);
 const second=a.m1RunPlan([{type:'farm.harvest',plot:0},{type:'time.advance',seconds:86400}]);
 assert.equal(second.stopReason,'ACTION_FAILED');
 assert.equal(second.completed,1);
 assert.equal(a.current().turn,1);
 assert.equal(a.current().clock.elapsedUnits,60);
 const invalid=a.m1RunPlan([{type:'time.advance',seconds:86400}],{hungerMin:-1});
 assert.equal(invalid.ok,false);
 assert.equal(a.current().turn,1);
});

test('M1 uses legacy oak-plank processing to construct a one-time functional shed',()=>{
 const fixture=[
  {id:'item05a:oak-log',name:'참나무 원목',group:'재료',qty:2,tags:[]}
 ];
 const b=createMainV2Inventory(fixture,{worldSeed:'m1-wood-shed'});
 const owned=id=>b.current().itemWorld.items.filter(i=>i.definitionId===id&&b.current().itemWorld.placements.some(p=>
  p.itemId===i.id&&p.location.kind==='inventory'&&p.location.ownerId===b.current().player.id)).reduce((n,i)=>n+i.quantity,0);
 const before=b.current().turn;
 const tooSoon=b.m1BuildWoodShed();
 assert.equal(tooSoon.accepted,true);
 assert.equal(tooSoon.outcome,'failed');
 assert.equal(b.current().turn,before+1);
 const crafted=b.dispatch('mineral.refine',{recipeId:'refine05h:oak-planks'});
 assert.equal(crafted.accepted,true,JSON.stringify(crafted));
 assert.equal(owned('item05a:oak-log'),0);
 assert.equal(owned('item05h:oak-planks'),2);
 const built=b.m1BuildWoodShed();
 assert.equal(built.accepted,true,JSON.stringify(built));
 assert.equal(built.outcome,'success');
 assert.equal(owned('item05h:oak-planks'),0);
 assert.equal(b.m1Life().plots.length,3);
 assert.equal(b.m1Life().facilities.woodShed,true);
 const duplicate=b.m1BuildWoodShed();
 assert.equal(duplicate.outcome,'failed');
 assert.equal(b.m1Life().plots.length,3);
});

test('E2E-04: actual forest logging, town plank refining, functional shed, and v3 restore',()=>{
 const fixture=[{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}];
 const options={worldSeed:'m1-forest-to-home',resources05A:true,progression04A:true,preferences:{getItem:()=>null,setItem:()=>{}}};
 const b=createMainV2Inventory(fixture,options);
 const owned=id=>b.current().itemWorld.items.filter(i=>i.definitionId===id&&b.current().itemWorld.placements.some(p=>
  p.itemId===i.id&&p.location.kind==='inventory'&&p.location.ownerId===b.current().player.id)).reduce((n,i)=>n+i.quantity,0);
 assert.equal(b.dispatch('world.travel',{region:'숲'}).accepted,true);
 const logged=b.workUntil05A('resource05a:oak-log:01',50);
 assert.equal(logged.accepted,true,JSON.stringify(logged));
 assert.ok(owned('item05a:oak-log')>=2);
 assert.equal(b.dispatch('world.travel',{region:'거점 마을'}).accepted,true);
 assert.equal(b.dispatch('mineral.refine',{recipeId:'refine05h:oak-planks'}).accepted,true);
 assert.ok(owned('item05h:oak-planks')>=2);
 const built=b.m1BuildWoodShed();
 assert.equal(built.accepted,true,JSON.stringify(built));
 assert.equal(built.outcome,'success');
 assert.equal(b.m1Life().facilities.woodShed,true);
 assert.equal(b.m1Life().plots.length,3);
 const {schemaVersion,clock,...rest}=structuredClone(b.current());
 const snapshot={...rest,schemaVersion:3,clock:{elapsedSeconds:clock.elapsedUnits,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}};
 const slot={slotId:'m1-forest-home',worldId:'m1-world',kind:'manual',label:'M1 forest',savedAt:'2026-10-28T00:00:00Z',revision:0};
 const save=createSaveV3(snapshot,slot,'m1-test',b.registry);
 assert.equal(decodeSaveV3(JSON.parse(JSON.stringify(save)),b.registry).ok,true);
 const restored=createMainV2Inventory(fixture,options);
 restored.applyApprovedSave(save);
 assert.equal(restored.m1Life().facilities.woodShed,true);
 assert.deepEqual(restored.current().itemWorld,b.current().itemWorld);
 assert.deepEqual(restored.current().world.runtime.m1Life,b.current().world.runtime.m1Life);
});

test('M1 28/112/224-day save restoration conserves owned crops and merchant time',()=>{
 const fixture=[{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}];
 for(const days of [28,112,224]){
  const options={worldSeed:'m1-horizon-'+days};
  const game=createMainV2Inventory(fixture,options);
  assert.equal(game.m1Action({type:'trade.buy',item:'m1:seed:potato',quantity:1}).accepted,true);
  assert.equal(game.m1Action({type:'farm.plant',plot:0,crop:'potato'}).accepted,true);
  for(let d=0;d<days;d++){
   const progressed=game.m1Action({type:'time.advance',seconds:86400});
   assert.equal(progressed.accepted,true,JSON.stringify({days,d,progressed}));
  }
  assert.equal(game.m1Life().plots[0],null,'unharvested field over-ripens');
  const life=game.m1Life();
  assert.equal(life.merchant.stock['m1:seed:potato'],8);
  assert.ok(life.merchant.lastRestock>=28*86400);
  const before=game.current();
  const {schemaVersion,clock,...rest}=structuredClone(before);
  const snapshot={...rest,schemaVersion:3,clock:{elapsedSeconds:clock.elapsedUnits,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}};
  const slot={slotId:'m1-horizon-'+days,worldId:'m1-world',kind:'manual',label:'long-horizon',savedAt:'2026-10-28T00:00:00Z',revision:0};
  const saved=createSaveV3(snapshot,slot,'m1-test',game.registry);
  assert.equal(decodeSaveV3(saved,game.registry).ok,true);
  const restored=createMainV2Inventory(fixture,options);
  restored.applyApprovedSave(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(restored.current(),game.current());
 }
});

test('E2E-04 processed-wood fishing rod is crafted from actual forest resources and used',()=>{
 const fixture=[{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}];
 const options={worldSeed:'m1-tool-forest',resources05A:true,progression04A:true,preferences:{getItem:()=>null,setItem:()=>{}}};
 const b=createMainV2Inventory(fixture,options);
 const owned=id=>b.current().itemWorld.items.filter(i=>i.definitionId===id&&b.current().itemWorld.placements.some(p=>
  p.itemId===i.id&&p.location.kind==='inventory'&&p.location.ownerId===b.current().player.id))
  .reduce((n,i)=>n+i.quantity,0);
 assert.equal(b.dispatch('world.travel',{region:'숲'}).accepted,true);
 const logged=b.workUntil05A('resource05a:oak-log:01',50);
 assert.equal(logged.accepted,true,JSON.stringify(logged));
 assert.ok(owned('item05a:oak-log')>=2);
 const grass1=b.workUntil05A('resource05a:grass:01',10);
 assert.equal(grass1.accepted,true,JSON.stringify(grass1));
 const grass2=b.workUntil05A('resource05a:grass:01',10);
 assert.equal(grass2.accepted,true,JSON.stringify(grass2));
 assert.ok(owned('item05a:grass')>=2);
 assert.equal(b.dispatch('world.travel',{region:'거점 마을'}).accepted,true);
 assert.equal(b.dispatch('mineral.refine',{recipeId:'refine05h:oak-planks'}).accepted,true);
 const crafted=b.dispatch('mineral.refine',{recipeId:'craft05i:processed-wood-rod'});
 assert.equal(crafted.accepted,true,JSON.stringify(crafted));
 assert.equal(owned('tool05a:rod:processedWood'),1);
 assert.equal(owned('item05h:oak-planks'),0);
 assert.ok(b.availableTools05A('fishing').some(t=>t.id==='tool05a:rod:processedWood'));
 assert.equal(b.dispatch('world.travel',{region:'강·호수'}).accepted,true);
 const turn=b.current().turn;
 const used=b.dispatch('resource.work',{nodeId:'resource05a:small-fish:01',toolId:'tool05a:rod:processedWood'});
 assert.equal(used.accepted,true,JSON.stringify(used));
 assert.equal(b.current().turn,turn+1);
 assert.equal(owned('tool05a:rod:processedWood'),1);
});


test('M1 cooking stores only actually consumed immediate ingredients and survives v3 restore',()=>{
 const fixture=[{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}];
 const options={worldSeed:'m1-food-receipt'};
 const g=createMainV2Inventory(fixture,options);
 assert.equal(g.m1Action({type:'trade.buy',item:'m1:seed:wheat',quantity:1}).accepted,true);
 assert.equal(g.m1Action({type:'farm.plant',plot:0,crop:'wheat'}).accepted,true);
 assert.equal(g.m1Action({type:'time.advance',seconds:86400}).accepted,true);
 assert.equal(g.m1Action({type:'farm.harvest',plot:0}).accepted,true);
 assert.equal(g.m1Action({type:'food.cook',recipe:'m1:food:bread'}).accepted,true);
 const bread=g.current().itemWorld.items.find(i=>i.definitionId==='m1:food:bread');
 assert.ok(bread);
 assert.deepEqual(JSON.parse(bread.condition.materials05n),[{definitionId:'m1:crop:wheat',quantity:2}]);
 assert.equal(g.m1Life().inventory['m1:crop:wheat'],1);
 const before=structuredClone(g.current());
 const {schemaVersion,clock,...rest}=before;
 const state={...rest,schemaVersion:3,clock:{elapsedSeconds:clock.elapsedUnits,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}};
 const slot={slotId:'m1-food-receipt',worldId:'m1-world',kind:'manual',label:'receipt',savedAt:'2026-10-28T00:00:00Z',revision:0};
 const saved=createSaveV3(state,slot,'m1-test',g.registry);
 assert.equal(decodeSaveV3(saved,g.registry).ok,true);
 const restored=createMainV2Inventory(fixture,options);
 restored.applyApprovedSave(JSON.parse(JSON.stringify(saved)));
 assert.deepEqual(restored.current().itemWorld,g.current().itemWorld);
 assert.equal(restored.m1Action({type:'food.eat',item:'m1:food:bread'}).accepted,true);
 assert.equal(restored.m1Life().inventory['m1:food:bread']??0,0);
 assert.equal(restored.m1Action({type:'food.eat',item:'m1:food:bread'}).outcome,'failed');
});

test('M1 grants farming and cooking XP on completed actions, not failed attempts',()=>{
 const fixture=[{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}];
 const g=createMainV2Inventory(fixture,{worldSeed:'m1-real-skills',progression04A:true});
 const xp=id=>g.current().progression.system04A.skills[id];
 const initialFarm=xp('skill-13'),initialCook=xp('skill-18');
 assert.equal(g.m1Action({type:'farm.harvest',plot:0}).outcome,'failed');
 assert.equal(xp('skill-13'),initialFarm);
 assert.equal(g.m1Action({type:'trade.buy',item:'m1:seed:wheat',quantity:1}).accepted,true);
 assert.equal(g.m1Action({type:'farm.plant',plot:0,crop:'wheat'}).accepted,true);
 assert.equal(xp('skill-13'),initialFarm+3);
 assert.equal(g.m1Action({type:'farm.harvest',plot:0}).outcome,'failed');
 assert.equal(xp('skill-13'),initialFarm+3);
 assert.equal(g.m1Action({type:'time.advance',seconds:86400}).accepted,true);
 assert.equal(g.m1Action({type:'farm.harvest',plot:0}).accepted,true);
 assert.equal(xp('skill-13'),initialFarm+8);
 assert.equal(g.m1Action({type:'food.cook',recipe:'m1:food:bread'}).accepted,true);
 assert.equal(xp('skill-18'),initialCook+4);
 assert.equal(g.m1Action({type:'food.cook',recipe:'m1:food:bread'}).outcome,'failed');
 assert.equal(xp('skill-18'),initialCook+4);
});

test('M1 rejects corrupted save without changing live state or owner inventory',()=>{
 const fixture=[{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}];
 const options={worldSeed:'m1-corrupt-atomicity'};
 const g=createMainV2Inventory(fixture,options);
 assert.equal(g.m1Action({type:'trade.buy',item:'m1:seed:wheat',quantity:1}).accepted,true);
 const before=structuredClone(g.current());
 const {schemaVersion,clock,...rest}=before;
 const snapshot={...rest,schemaVersion:3,clock:{elapsedSeconds:clock.elapsedUnits,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}};
 const slot={slotId:'m1-damaged',worldId:'m1-world',kind:'manual',label:'damaged',savedAt:'2026-10-28T00:00:00Z',revision:0};
 const valid=createSaveV3(snapshot,slot,'m1-test',g.registry);
 for(const mutate of [
  x=>{x.state.world.runtime.m1Life.merchant.stock['m1:seed:wheat']=-1;},
  x=>{x.state.world.runtime.m1Life.plots=[{crop:'missing',readyAt:1,spoilsAt:2,remainingHarvests:1},null];},
  x=>{x.saveVersion=99;},
  x=>{x.state.world.runtime.m1Life.merchant.lastRestock=x.state.clock.elapsedSeconds+1;}
 ]){
  const bad=structuredClone(valid);mutate(bad);
  assert.equal(decodeSaveV3(bad,g.registry).ok,false);
  assert.throws(()=>g.applyApprovedSave(bad));
  assert.deepEqual(g.current(),before);
 }
});
test('M1 rejects ownerless and foreign-owned items rather than granting free cooking materials',()=>{
 const fixture=[{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}];
 const g=createMainV2Inventory(fixture,{worldSeed:'m1-owner-check'});
 assert.equal(g.m1Action({type:'food.cook',recipe:'m1:food:bread'}).outcome,'failed');
 assert.equal(g.m1Life().inventory['m1:food:bread']??0,0);
 assert.equal(g.m1Action({type:'trade.sell',item:'m1:crop:wheat',quantity:1}).outcome,'failed');
 assert.equal(g.m1Life().inventory['m1:crop:wheat']??0,0);
});

test('M1 requestId deduplicates accepted purchases before and after v3 restore',()=>{
 const fixture=[{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}];
 const opts={worldSeed:'m1-request-id'};
 const g=createMainV2Inventory(fixture,opts);
 const cmd={type:'trade.buy',item:'m1:seed:wheat',quantity:1,requestId:'buy-wheat-0001'};
 assert.equal(g.m1Action(cmd).accepted,true);
 const before=structuredClone(g.current());
 assert.equal(g.m1Action(cmd).reason,'DUPLICATE_REQUEST');
 assert.deepEqual(g.current(),before);
 const {schemaVersion,clock,...rest}=before;
 const state={...rest,schemaVersion:3,clock:{elapsedSeconds:clock.elapsedUnits,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}};
 const slot={slotId:'m1-request-id',worldId:'m1-world',kind:'manual',label:'request',savedAt:'2026-10-28T00:00:00Z',revision:0};
 const saved=createSaveV3(state,slot,'m1-test',g.registry);
 const restored=createMainV2Inventory(fixture,opts);
 restored.applyApprovedSave(JSON.parse(JSON.stringify(saved)));
 assert.equal(restored.m1Action(cmd).reason,'DUPLICATE_REQUEST');
 assert.deepEqual(restored.current(),before);
 assert.equal(restored.m1Action({...cmd,requestId:'buy-wheat-0002'}).accepted,true);
 assert.equal(restored.m1Life().inventory['m1:seed:wheat'],2);
});

test('M1 E2E-07 request-keyed manual and auto remain identical after interruption and save',()=>{
 const fixture=[{id:'m1-fixture',name:'시험 물품',group:'재료',qty:1,tags:[]}];
 const opts={worldSeed:'m1-final-parity',progression04A:true};
 const manual=createMainV2Inventory(fixture,opts),automatic=createMainV2Inventory(fixture,opts);
 const first=[
  {type:'trade.buy',item:'m1:seed:wheat',quantity:1,requestId:'final-buy'},
  {type:'farm.plant',plot:0,crop:'wheat',requestId:'final-plant'},
  {type:'time.advance',seconds:86400,requestId:'final-day'},
  {type:'farm.harvest',plot:0,requestId:'final-harvest'}
 ];
 for(const a of first)assert.equal(manual.m1Action(a).accepted,true);
 const batch=automatic.m1RunPlan(first,{hungerMin:1});
 assert.equal(batch.completed,4);assert.equal(batch.stopReason,'COMPLETED');
 assert.deepEqual(automatic.current(),manual.current());
 const before=structuredClone(automatic.current());
 assert.equal(automatic.m1Action(first[0]).reason,'DUPLICATE_REQUEST');
 assert.deepEqual(automatic.current(),before);
 const {schemaVersion,clock,...rest}=before;
 const state={...rest,schemaVersion:3,clock:{elapsedSeconds:clock.elapsedUnits,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}};
 const slot={slotId:'m1-final-parity',worldId:'m1-world',kind:'manual',label:'parity',savedAt:'2026-10-28T00:00:00Z',revision:0};
 const saved=createSaveV3(state,slot,'m1-test',automatic.registry);
 const resumed=createMainV2Inventory(fixture,opts);
 resumed.applyApprovedSave(JSON.parse(JSON.stringify(saved)));
 assert.equal(resumed.m1Action(first[3]).reason,'DUPLICATE_REQUEST');
 assert.deepEqual(resumed.current(),manual.current());
 const final=[
  {type:'food.cook',recipe:'m1:food:bread',requestId:'final-cook'},
  {type:'food.eat',item:'m1:food:bread',requestId:'final-eat'},
  {type:'trade.sell',item:'m1:crop:wheat',quantity:1,requestId:'final-sale'},
  {type:'trade.buy',item:'m1:seed:potato',quantity:1,requestId:'final-reinvest'}
 ];
 for(const a of final)assert.equal(manual.m1Action(a).accepted,true);
 const second=resumed.m1RunPlan(final,{hungerMin:1});
 assert.equal(second.completed,4);assert.equal(second.stopReason,'COMPLETED');
 assert.deepEqual(resumed.current(),manual.current());
 assert.equal(resumed.m1Life().inventory['m1:seed:potato'],1);
});
