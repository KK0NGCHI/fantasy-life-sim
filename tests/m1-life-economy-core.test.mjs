import test from 'node:test';
import assert from 'node:assert/strict';
import {newM1LifeState,runM1LifeAction,validateM1LifeState} from '../src/m1-life-economy-core.js';
const doAction=(s,a)=>{const r=runM1LifeAction(s,a);assert.equal(r.ok,true,JSON.stringify(r));return r.state;};

test('seed purchase, planting, growth, harvest, cooking, eating, sale and reinvestment',()=>{
 let s=newM1LifeState(),origin=s;
 s=doAction(s,{type:'trade.buy',item:'m1:seed:wheat',quantity:2});
 assert.equal(s.gold,16);assert.equal(origin.gold,20);
 s=doAction(s,{type:'farm.plant',plot:0,crop:'wheat'});
 assert.equal(s.inventory['m1:seed:wheat'],1);
 const blocked=runM1LifeAction(s,{type:'farm.harvest',plot:0});
 assert.equal(blocked.ok,false);assert.equal(blocked.reason,'NOT_RIPE');assert.equal(s.turn,2);
 s=doAction(s,{type:'time.advance',seconds:86400});
 s=doAction(s,{type:'farm.harvest',plot:0});
 assert.equal(s.inventory['m1:crop:wheat'],3);
 s=doAction(s,{type:'food.cook',recipe:'m1:food:bread'});
 assert.equal(s.inventory['m1:crop:wheat'],1);
 s=doAction(s,{type:'food.eat',item:'m1:food:bread'});
 assert.equal(s.hunger,100);
 s=doAction(s,{type:'trade.sell',item:'m1:crop:wheat',quantity:1});
 assert.equal(s.gold,19);
 s=doAction(s,{type:'trade.buy',item:'m1:seed:potato',quantity:1});
 assert.equal(s.gold,17);
 s=doAction(s,{type:'home.expand'});
 assert.equal(s.plots.length,3);assert.equal(s.gold,7);
 assert.equal(validateM1LifeState(s),true);
 assert.equal(JSON.stringify(JSON.parse(JSON.stringify(s))),JSON.stringify(s));
});
test('field crop over-ripens, harvested food does not spoil',()=>{
 let s=newM1LifeState();
 s=doAction(s,{type:'trade.buy',item:'m1:seed:potato',quantity:2});
 s=doAction(s,{type:'farm.plant',plot:0,crop:'potato'});
 s=doAction(s,{type:'time.advance',seconds:172801});
 assert.equal(s.plots[0],null);
 assert.equal(s.events.at(-1).type,'crop.overripe');
 s=doAction(s,{type:'farm.plant',plot:1,crop:'potato'});
 s=doAction(s,{type:'time.advance',seconds:86400});
 s=doAction(s,{type:'farm.harvest',plot:1});
 s=doAction(s,{type:'time.advance',seconds:200*86400});
 assert.equal(s.inventory['m1:crop:potato'],2);
});
test('repeated harvest is finite and each crop regrows',()=>{
 let s=newM1LifeState();
 s=doAction(s,{type:'trade.buy',item:'m1:seed:strawberry',quantity:1});
 s=doAction(s,{type:'farm.plant',plot:0,crop:'strawberry'});
 for(let i=0;i<3;i++){s=doAction(s,{type:'time.advance',seconds:86400});s=doAction(s,{type:'farm.harvest',plot:0});}
 assert.equal(s.inventory['m1:crop:strawberry'],6);
 assert.equal(s.plots[0],null);
 assert.equal(runM1LifeAction(s,{type:'farm.harvest',plot:0}).ok,false);
});
test('bad actions do not alter state or charge a turn',()=>{
 const s=newM1LifeState(),snapshot=JSON.stringify(s);
 for(const a of [
  {type:'farm.plant',plot:0,crop:'wheat'},
  {type:'trade.sell',item:'m1:crop:wheat',quantity:1},
  {type:'trade.buy',item:'m1:seed:wheat',quantity:-2},
  {type:'trade.buy',item:'m1:seed:wheat',quantity:1.5},
  {type:'food.cook',recipe:'m1:food:bread'},
  {type:'food.eat',item:'m1:crop:wheat'},
  {type:'farm.harvest',plot:40},
  {type:'time.advance',seconds:-1},
  {type:'unknown'}
 ])assert.equal(runM1LifeAction(s,a).ok,false);
 assert.equal(JSON.stringify(s),snapshot);
});
test('invalid persisted values are rejected',()=>{
 const s=newM1LifeState();
 for(const corrupted of [{...s,gold:-1},{...s,hunger:101},{...s,plots:[{}]},{...s,inventory:{'fake':2}}])
  assert.equal(validateM1LifeState(corrupted),false);
});

test('merchant restock is world-time based, bounded and identical for split/whole advances',()=>{
 const bought=doAction(newM1LifeState(),{type:'trade.buy',item:'m1:seed:wheat',quantity:3});
 assert.equal(bought.merchant.stock['m1:seed:wheat'],5);
 const whole=doAction(bought,{type:'time.advance',seconds:14*86400});
 let split=bought;
 for(let i=0;i<14;i++)split=doAction(split,{type:'time.advance',seconds:86400});
 assert.equal(whole.merchant.stock['m1:seed:wheat'],8);
 assert.equal(split.merchant.stock['m1:seed:wheat'],8);
 assert.equal(whole.merchant.lastRestock,split.merchant.lastRestock);
 assert.equal(whole.merchant.lastRestock,14*86400);
 assert.equal(doAction(whole,{type:'time.advance',seconds:60}).merchant.stock['m1:seed:wheat'],8);
});

test('M1 seasonal gates reject winter planting without charging the pure reducer',()=>{
 let s=newM1LifeState();
 s=doAction(s,{type:'time.advance',seconds:84*86400});
 const before=JSON.stringify(s);
 const result=runM1LifeAction(s,{type:'farm.plant',plot:0,crop:'wheat'});
 assert.equal(result.ok,false);
 assert.equal(result.reason,'WRONG_SEASON');
 assert.equal(JSON.stringify(s),before);
});
test('M1 orchard apple first fruit, yearly repeat and long-time stock conservation',()=>{
 let s=newM1LifeState();
 s=doAction(s,{type:'trade.buy',item:'m1:seed:apple',quantity:1});
 s=doAction(s,{type:'farm.plant',plot:0,crop:'apple'});
 s=doAction(s,{type:'time.advance',seconds:7*86400});
 s=doAction(s,{type:'farm.harvest',plot:0});
 assert.equal(s.inventory['m1:crop:apple'],4);
 assert.equal(s.plots[0].remainingHarvests,2);
 s=doAction(s,{type:'time.advance',seconds:112*86400});
 s=doAction(s,{type:'farm.harvest',plot:0});
 assert.equal(s.inventory['m1:crop:apple'],8);
 assert.equal(s.plots[0].remainingHarvests,1);
});

test('M1 bulk versus split time advances preserve multi-year crop and merchant state',()=>{
 for(const days of [28,112,224]){
  let seed=newM1LifeState();
  seed=doAction(seed,{type:'trade.buy',item:'m1:seed:apple',quantity:1});
  seed=doAction(seed,{type:'farm.plant',plot:0,crop:'apple'});
  seed=doAction(seed,{type:'trade.buy',item:'m1:seed:wheat',quantity:2});
  let bulk=doAction(seed,{type:'time.advance',seconds:days*86400});
  let split=seed;
  for(let d=0;d<days;d++)split=doAction(split,{type:'time.advance',seconds:86400});
  // Number of player actions is deliberately different, but the world ledger
  // at the same elapsed second must not depend on time-step granularity.
  assert.equal(split.now,bulk.now);
  assert.deepEqual(split.plots,bulk.plots);
  assert.deepEqual(split.inventory,bulk.inventory);
  assert.deepEqual(split.merchant,bulk.merchant);
  assert.equal(split.gold,bulk.gold);
  assert.equal(validateM1LifeState(split),true);
  assert.equal(validateM1LifeState(bulk),true);
 }
});
test('M1 stale, malformed and overflow transactions leave source state unchanged',()=>{
 let seed=newM1LifeState();
 seed=doAction(seed,{type:'trade.buy',item:'m1:seed:wheat',quantity:1});
 const original=structuredClone(seed);
 for(const action of [
  {type:'trade.buy',item:'m1:seed:wheat',quantity:0},
  {type:'trade.buy',item:'m1:seed:wheat',quantity:Infinity},
  {type:'trade.sell',item:'m1:crop:wheat',quantity:1},
  {type:'farm.harvest',plot:0},
  {type:'food.cook',recipe:'m1:food:unknown'},
  {type:'time.advance',seconds:0},
  {type:'time.advance',seconds:NaN},
  {type:'farm.plant',plot:100,crop:'wheat'}
 ]){
  const result=runM1LifeAction(seed,action);
  assert.equal(result.ok,false,JSON.stringify(action));
  assert.deepEqual(seed,original);
 }
});

test('M1 orchard yields exactly three seasonal harvests across years, then stops',()=>{
 let state=newM1LifeState();
 state=doAction(state,{type:'trade.buy',item:'m1:seed:apple',quantity:1});
 state=doAction(state,{type:'farm.plant',plot:0,crop:'apple'});
 state=doAction(state,{type:'time.advance',seconds:7*86400});
 for(let year=0;year<3;year++){
  const before=state.inventory['m1:crop:apple']??0;
  state=doAction(state,{type:'farm.harvest',plot:0});
  assert.equal(state.inventory['m1:crop:apple'],before+4);
  const duplicate=runM1LifeAction(state,{type:'farm.harvest',plot:0});
  assert.equal(duplicate.ok,false);
  if(year<2){
   const next=state.plots[0].readyAt;
   assert.equal(next-state.now,112*86400);
   state=doAction(state,{type:'time.advance',seconds:112*86400});
  }
 }
 assert.equal(state.plots[0],null);
 assert.equal(state.inventory['m1:crop:apple'],12);
 assert.equal(runM1LifeAction(state,{type:'farm.harvest',plot:0}).reason,'EMPTY_PLOT');
});

test('M1 legacy state lacking request history stays usable; invalid IDs never mutate state',()=>{
 const old=newM1LifeState();delete old.recentRequests;
 assert.equal(validateM1LifeState(old),true);
 for(const id of ['','bad id','!'.repeat(81)]){
  const result=runM1LifeAction(old,{type:'trade.buy',item:'m1:seed:wheat',quantity:1,requestId:id});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'INVALID_REQUEST_ID');
 }
 assert.equal(old.recentRequests,undefined);
 const first=runM1LifeAction(old,{type:'trade.buy',item:'m1:seed:wheat',quantity:1,requestId:'seed-order-1'});
 assert.equal(first.ok,true);
 assert.deepEqual(first.state.recentRequests,['seed-order-1']);
 const repeated=runM1LifeAction(first.state,{type:'trade.buy',item:'m1:seed:wheat',quantity:1,requestId:'seed-order-1'});
 assert.equal(repeated.reason,'DUPLICATE_REQUEST');
 assert.equal(first.state.inventory['m1:seed:wheat'],1);
});
