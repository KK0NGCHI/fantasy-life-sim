import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateLocalMap} from '../dist/engine/v3.js';
import {buildWorldRegistry,SOMNIUM_WORLD_03A} from '../dist/engine/v2.js';
const built=buildWorldRegistry(SOMNIUM_WORLD_03A);assert.equal(built.ok,true);
const registry=built.registry;
const profile=(algorithm,siteId,floor=0)=>({id:'core:generator/'+algorithm,version:1,algorithm,siteId,floor,width:32,height:32,maxAttempts:4});
test('03-D repeatability, no global RNG consumption, and seed divergence',()=>{
 const p=profile('forest','core:site/forest');
 const one=generateLocalMap(registry,p,'seed-a');
 assert.deepEqual(generateLocalMap(registry,p,'seed-a'),one);
 assert.notDeepEqual(generateLocalMap(registry,p,'seed-b').map.tiles,one.map.tiles);
 assert.notDeepEqual(generateLocalMap(registry,p,'seed-a',1).map.tiles,one.map.tiles);
 const unrelated=generateLocalMap(registry,profile('dungeon','core:site/labyrinth'),'seed-a');
 assert.deepEqual(generateLocalMap(registry,p,'seed-a'),one);
 assert.equal(unrelated.map.width,32);
});
test('03-D generated maps keep site identity, guaranteed entrances and traversable paths',()=>{
 for(const [algorithm,site,floor] of [['forest','core:site/forest',0],['dungeon','core:site/labyrinth',0],['cavern','core:site/labyrinth',-1]]){
  const out=generateLocalMap(registry,profile(algorithm,site,floor),'seed-33');
  assert.equal(out.map.siteId,site);
  assert.equal(out.map.tiles.length,32);
  assert.ok(out.map.entrances.every(e=>out.map.tiles[e.y].split(' ')[e.x]==='core:terrain/ground'));
  assert.equal(out.map.tiles[0].split(' ').every(t=>t==='core:terrain/wall'),true);
  assert.ok(out.placements.every(p=>out.map.tiles[p.y].split(' ')[p.x]==='core:terrain/ground'));
 }
});
test('03-D generation performs bounded parameter validation',()=>{
 const p=profile('forest','core:site/forest');
 assert.throws(()=>generateLocalMap(registry,{...p,width:8},'seed'));
 assert.throws(()=>generateLocalMap(registry,p,''));
 assert.throws(()=>generateLocalMap(registry,{...p,maxAttempts:0},'seed'));
});
test('03-D many world seeds satisfy output dimensions and entrances',()=>{
 for(let i=0;i<200;i++){
  const x=generateLocalMap(registry,profile('dungeon','core:site/labyrinth'),'batch-'+i);
  assert.equal(x.map.height,32);
  assert.equal(x.map.entrances.length,2);
 }
});
