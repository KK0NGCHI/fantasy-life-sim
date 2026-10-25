import {test} from 'node:test';import assert from 'node:assert/strict';
import {resolveLocalStep,localArrival,recordLocalVisit} from '../dist/engine/v3.js';
import {buildWorldRegistry,SOMNIUM_WORLD_03A,createInitialWorldRuntime03A} from '../dist/engine/v2.js';
const result=buildWorldRegistry(SOMNIUM_WORLD_03A);assert.equal(result.ok,true);
const registry=result.registry;
test('03-C arrival uses site entry, not 4x4 UI position',()=>{
 const entry=localArrival(registry,'core:site/forest');
 assert.deepEqual(entry,{siteId:'core:site/forest',floor:0,x:2,y:2});
});
test('03-C move cardinally in bounded local grid, wall attempts consume one turn',()=>{
 const from=localArrival(registry,'core:site/town'),copy=structuredClone(from);
 const step=resolveLocalStep(registry,from,'east');
 assert.equal(step.status,'moved');assert.equal(step.turns,1);assert.equal(step.elapsedSeconds,6);
 assert.equal(step.location.x,3);assert.deepEqual(from,copy);
 const blocked=resolveLocalStep(registry,step.location,'east');
 assert.equal(blocked.status,'blocked');assert.equal(blocked.turns,1);
 assert.deepEqual(blocked.location,step.location);
});
test('03-C invalid direction costs nothing; known hazards pause before entering',()=>{
 const from=localArrival(registry,'core:site/town');
 assert.equal(resolveLocalStep(registry,from,'diagonal').turns,0);
 const definition=structuredClone(SOMNIUM_WORLD_03A);
 const ground=definition.terrains.find(t=>t.id==='core:terrain/ground');
 ground.hazardTags=['fire'];
 const modified=buildWorldRegistry(definition);assert.equal(modified.ok,true);
 const step=resolveLocalStep(modified.registry,from,'east',new Set(['fire']));
 assert.equal(step.status,'hazard');assert.equal(step.turns,0);assert.deepEqual(step.location,from);
});
test('03-C visited cells are remembered, idempotent and never mutate world',()=>{
 const world=createInitialWorldRuntime03A(registry,'local-seed');
 const before=structuredClone(world);
 const entered=resolveLocalStep(registry,world.location,'east');
 const first=recordLocalVisit(world,registry,entered.location);
 assert.equal(first.newlySeen,true);
 assert.equal(first.world.seenCells['core:map/town'].length,2);
 const again=recordLocalVisit(first.world,registry,entered.location);
 assert.equal(again.newlySeen,false);assert.equal(again.world.seenCells['core:map/town'].length,2);
 assert.deepEqual(world,before);
});
