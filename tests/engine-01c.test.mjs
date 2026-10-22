import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createRandomState, randomInt, sampleSkilledTurns, dispatchTimedAction, defaultTiming,
  shouldStopAuto, findSafePath, AutoController
} from '../dist/engine/index.js';
const state = () => ({
  schemaVersion:1, turn:10, clock:{elapsedUnits:100}, rng:createRandomState('example-seed'),
  player:{id:'p',regionId:'a',currentHp:10,currentMp:8,hunger:0,statusEffects:[]},
  inventory:{items:[]}, world:{activeRegionId:'a'}, progression:{skillExperience:{}}, flags:{}
});
const action = {type:'test:mine',actorId:'p',payload:{}};
const handlers = new Map([['test:mine',s => ({outcome:'failed',nextState:s,events:[]})]]);
test('reproducible independently advancing world and action RNG streams', () => {
  const start = createRandomState('shared-seed');
  assert.deepEqual(randomInt(start,'action',1,10),randomInt(createRandomState('shared-seed'),'action',1,10));
  const world = randomInt(start,'world',1,10).rng;
  assert.equal(randomInt(world,'action',1,100).value, randomInt(start,'action',1,100).value);
  assert.equal(randomInt(start,'action',1,10).rng.state[0],start.state[0]);
});
test('skill reduces both endpoints; turns always within configured range', () => {
  const config={noviceMin:6,noviceMax:10,masteryMin:2,masteryMax:4};
  assert.equal(sampleSkilledTurns(config,0,createRandomState('x')).turns>=6,true);
  for(const skill of [0,0.2,0.5,0.8,1]) {
    let rng=createRandomState('test');
    const min=Math.ceil(6+(2-6)*skill), max=Math.ceil(10+(4-10)*skill);
    for(let n=0;n<40;n++) {
      const result=sampleSkilledTurns(config,skill,rng);
      assert.ok(result.turns>=min && result.turns<=max);
      rng=result.rng;
    }
  }
  assert.throws(()=>sampleSkilledTurns({noviceMin:1,noviceMax:4,masteryMin:2,masteryMax:2},1,createRandomState('x')));
});
test('timed failed activity consumes multiple turns but advances world time separately', () => {
  const s=state();
  const policy=(current)=>{const r=sampleSkilledTurns({noviceMin:3,noviceMax:3,masteryMin:2,masteryMax:2},0,current.rng);return {turns:r.turns,worldUnits:9,rng:r.rng};};
  const r=dispatchTimedAction(s,action,handlers,policy);
  assert.equal(r.accepted,true);
  assert.equal(r.outcome,'failed');
  assert.equal(r.turnsSpent,3);
  assert.equal(r.nextState.turn,13);
  assert.equal(r.nextState.clock.elapsedUnits,109);
  assert.equal(s.turn,10);
  assert.deepEqual(s.rng,createRandomState('example-seed'));
});
test('invalid command and timing policy never modify state or RNG', () => {
  const s=state();
  assert.deepEqual(dispatchTimedAction(s,{...action,type:'unknown'},handlers,()=>{throw Error('should not run');}),
    {accepted:false,reason:'INVALID_COMMAND',turnsSpent:0});
  assert.deepEqual(dispatchTimedAction(s,action,handlers,()=>({turns:0,worldUnits:1,rng:s.rng})),
    {accepted:false,reason:'EXECUTION_ERROR',turnsSpent:0});
  assert.equal(s.turn,10);
});
test('ordinary action default timing = one turn and abstract world unit',()=>{
  const s=state();const r=dispatchTimedAction(s,action,handlers,defaultTiming);
  assert.equal(r.turnsSpent,1); assert.equal(r.nextState.clock.elapsedUnits,101);
});
test('percentage threshold and danger stopping',()=>{
  const limits={hpPercent:30,mpPercent:20,hungerPercent:80};
  const s={hpPercent:40,mpPercent:50,hungerPercent:20,dangerVisible:false,incapacitated:false};
  assert.equal(shouldStopAuto(s,limits),null);
  assert.equal(shouldStopAuto({...s,hpPercent:30},limits),'threshold');
  assert.equal(shouldStopAuto({...s,mpPercent:10},limits),'threshold');
  assert.equal(shouldStopAuto({...s,hungerPercent:80},limits),'threshold');
  assert.equal(shouldStopAuto({...s,dangerVisible:true},limits),'danger');
});
test('DCSS-like safe route never enters known hazardous tiles',()=>{
  const graph=new Map([
    ['start',{id:'start',walkable:true,hazardous:false,neighbours:['trap','detour']}],
    ['trap',{id:'trap',walkable:true,hazardous:true,neighbours:['goal']}],
    ['detour',{id:'detour',walkable:true,hazardous:false,neighbours:['goal']}],
    ['goal',{id:'goal',walkable:true,hazardous:false,neighbours:[]}]
  ]);
  assert.deepEqual(findSafePath(graph,'start','goal'),['start','detour','goal']);
  graph.delete('detour');assert.equal(findSafePath(graph,'start','goal'),null);
});
test('auto tick runs only one action then pauses on panel without implicit restart',()=>{
  const auto=new AutoController(),s=state();
  const sensors={hpPercent:100,mpPercent:100,hungerPercent:0,dangerVisible:false,incapacitated:false};
  const limits={hpPercent:10,mpPercent:10,hungerPercent:90};
  let calls=0;
  const execute=(st,act)=>{calls++;return dispatchTimedAction(st,act,handlers,defaultTiming);};
  auto.start();
  assert.equal(auto.tick(s,sensors,limits,()=>action,execute).accepted,true);
  assert.equal(calls,1);
  auto.onInformationPanelOpen();
  assert.equal(auto.status.reason,'information-panel');
  assert.equal(auto.tick(s,sensors,limits,()=>action,execute),null);
  assert.equal(calls,1);
  auto.start();
  assert.equal(auto.tick(s,{...sensors,hpPercent:5},limits,()=>action,execute),null);
  assert.equal(auto.status.reason,'threshold');
  assert.equal(calls,1);
});
