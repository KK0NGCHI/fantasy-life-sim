import {test} from 'node:test';
import assert from 'node:assert/strict';
import {localVisibility,localPortal,safeLocalRoute,rememberLocalVision} from '../dist/engine/v3.js';
import {buildWorldRegistry,SOMNIUM_WORLD_03A,createInitialWorldRuntime03A} from '../dist/engine/v2.js';
const built=buildWorldRegistry(SOMNIUM_WORLD_03A);assert.equal(built.ok,true);
const registry=built.registry,position={siteId:'core:site/town',floor:0,x:2,y:2};
test('03-C visibility sees blocking cells but not tiles behind walls',()=>{
 const view=localVisibility(registry,position,[],6);
 assert.equal(view.visible.length,25);
 assert.equal(view.remembered.length,25);
 assert.deepEqual(localVisibility(registry,position,view.remembered,0).visible,[12]);
 assert.equal(localVisibility(registry,position,view.remembered,0).remembered.length,25);
});
test('03-C visibility does not mutate remembered cells',()=>{
 const prior=[0,2];const snap=[...prior];
 const view=localVisibility(registry,position,prior);
 assert.deepEqual(prior,snap);
 const world=createInitialWorldRuntime03A(registry,'vision-test');
 const updated=rememberLocalVision(world,view);
 assert.equal(updated.seenCells[view.mapId].length,25);
 assert.equal(world.seenCells[view.mapId].length,1);
});
test('03-C only known cells can be routed, walls and unknown destinations are excluded',()=>{
 const known=new Set([12,13,18]);
 const goal={...position,x:3,y:3};
 assert.deepEqual(safeLocalRoute(registry,position,goal,known),['east','south']);
 assert.deepEqual(safeLocalRoute(registry,position,{...goal,x:4},known),[]);
 assert.deepEqual(safeLocalRoute(registry,position,goal,new Set([12])),[]);
});
test('03-C portal requires bidirectional linkage, not an implicit floor teleport',()=>{
 assert.equal(localPortal(registry,position),null);
 const definition=structuredClone(SOMNIUM_WORLD_03A);
 const town=definition.sites.find(s=>s.id==='core:site/town');
 town.floors=[0,-1];
 const surface=definition.maps.find(m=>m.id==='core:map/town');
 surface.entrances.push({id:'core:entry/town-down',x:3,y:2,destinationSiteId:'core:site/town',destinationFloor:-1,destinationEntryId:'core:entry/town-up'});
 definition.maps.push({...structuredClone(surface),id:'core:map/town-basement',floor:-1,entrances:[
 {id:'core:entry/town-up',x:1,y:2,destinationSiteId:'core:site/town',destinationFloor:0,destinationEntryId:'core:entry/town-down'}]});
 const rebuilt=buildWorldRegistry(definition);assert.equal(rebuilt.ok,true);
 assert.deepEqual(localPortal(rebuilt.registry,{...position,x:3}),{siteId:'core:site/town',floor:-1,x:1,y:2});
 assert.deepEqual(localPortal(rebuilt.registry,{...position,floor:-1,x:1}),{siteId:'core:site/town',floor:0,x:3,y:2});
});
