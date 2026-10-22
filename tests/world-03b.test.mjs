import {test} from 'node:test';import assert from 'node:assert/strict';
import {SOMNIUM_WORLD_03A,buildWorldRegistry,planTravel,beginTravel,resumeTravel,pauseTravel,advanceTravel,cancelTravel,validateTravelState} from '../dist/engine/v2.js';
const reg=buildWorldRegistry(SOMNIUM_WORLD_03A).registry;
const knownSites=new Set(SOMNIUM_WORLD_03A.sites.map(s=>s.id));
const access={knownSites,knownHazards:new Set(),allowedRequirements:new Set()};
test('03-B route chooses deterministic lowest world-unit path',()=>{
 const p=planTravel(reg,'core:site/town','core:site/forest','fast',access);
 assert.equal(p.ok,true);assert.deepEqual(p.plan.siteIds,['core:site/town','core:site/forest']);
 assert.equal(p.plan.totalTurns,3);assert.equal(p.plan.totalWorldUnits,6);
});
test('03-B excludes unvisited and expired destinations, and respects directional paths',()=>{
 const denied=planTravel(reg,'core:site/town','core:site/forest','fast',{knownSites:new Set(['core:site/town'])});
 assert.equal(denied.reason,'UNDISCOVERED');
 assert.equal(planTravel(reg,'core:site/town','core:site/forest','fast',{...access,expiredSites:new Set(['core:site/forest'])}).ok,false);
 assert.equal(planTravel(reg,'core:site/town','core:site/plains','fast',{...access,blockedEdges:new Set(['core:route/town-plains','core:route/plains-forest','core:route/plains-river'])}).reason,'UNREACHABLE');
});
test('03-B pause/resume ticks charge once and restore travel progress',()=>{
 const p=planTravel(reg,'core:site/town','core:site/forest','fast',access).plan;
 const started=beginTravel(p);assert.equal(started.position.siteId,'core:site/town');
 assert.equal(advanceTravel(started,reg,access).reason,'PAUSED');
 let st=resumeTravel(started);
 const one=advanceTravel(st,reg,access);assert.equal(one.ok,true);
 assert.equal(one.turns,1);assert.equal(one.worldUnits,2);assert.equal(one.arrived,false);
 assert.equal(one.state.position.kind,'travel');
 st=pauseTravel(one.state);assert.equal(advanceTravel(st,reg,access).reason,'PAUSED');
 assert.equal(validateTravelState(st,reg),true);
 const again=advanceTravel(resumeTravel(structuredClone(st)),reg,access);
 assert.equal(again.ok,true);assert.equal(again.arrived,false);assert.ok(again.state.progress);
 assert.equal(again.state.position.kind,'travel');
});
test('03-B rejects route changes before advancing and preserves original',()=>{
 const p=planTravel(reg,'core:site/town','core:site/plains','fast',access).plan;
 const old=resumeTravel(beginTravel(p)),json=JSON.stringify(old);
 const step=advanceTravel(old,reg,{...access,blockedEdges:new Set(['core:route/town-plains'])});
 assert.equal(step.reason,'ROUTE_CHANGED');assert.equal(JSON.stringify(old),json);
});
test('03-B uneven travel duration sums to edge world units, no midpoint cancel teleport',()=>{
 const def=structuredClone(SOMNIUM_WORLD_03A);def.routes[0].turns=2;def.routes[0].worldUnits=5;
 const custom=buildWorldRegistry(def).registry;
 const p=planTravel(custom,'core:site/town','core:site/plains','fast',access).plan;
 const first=advanceTravel(resumeTravel(beginTravel(p)),custom,access);
 assert.equal(first.worldUnits,2);assert.equal(first.state.position.kind,'travel');
 assert.throws(()=>cancelTravel(first.state),/Cannot cancel/);
 const second=advanceTravel(first.state,custom,access);
 assert.equal(second.worldUnits,3);assert.equal(second.arrived,true);
});
