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
