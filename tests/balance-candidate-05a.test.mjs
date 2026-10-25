import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CANDIDATE_REGEN_05A as exported,reconcileCandidateSite05A,createCandidateSites05A} from '../src/resource-sites-05a.js';
import {CANDIDATE_REGEN_05A as config} from '../src/balance-candidate-05a.js';

test('05-A candidate regeneration keeps its public identity and the provisional baseline',()=>{
 assert.strictEqual(exported,config);
 assert.deepEqual(Object.fromEntries(Object.entries(config).map(([id,x])=>[id,{seconds:x.seconds,units:x.units,seasons:[...x.seasons]}])),{
  'source05a:blueberry':{seconds:86400,units:2,seasons:[1,2,1,0]},
  'source05a:reed':{seconds:86400,units:2,seasons:[1,2,1,0]},
  'source05a:mussel':{seconds:172800,units:2,seasons:[1,1,1,1]},
  'source05a:marsh-bell':{seconds:259200,units:1,seasons:[1,1,2,0.5]}
 });
 for(const item of Object.values(config)){
  assert.ok(Object.isFrozen(item)&&Object.isFrozen(item.seasons));
  assert.equal(item.seasons.length,4);
 }
});
test('candidate regrowth across 224 days remains partition-independent after parameter extraction',()=>{
 for(const node of Object.values(createCandidateSites05A()).filter(x=>config[x.sourceId])){
  const start={...node,remaining:0};
  let daily=start;
  for(let day=1;day<=224;day++)daily=reconcileCandidateSite05A(daily,day*86400);
  const leap=reconcileCandidateSite05A(start,224*86400);
  assert.deepEqual(daily,leap,node.sourceId+' '+node.region);
  assert.deepEqual(reconcileCandidateSite05A(leap,224*86400),leap);
 }
});
