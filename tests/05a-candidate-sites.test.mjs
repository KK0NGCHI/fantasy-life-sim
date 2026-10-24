import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCandidateSites05A,discoverCandidateSite05A,harvestCandidateSite05A,resolveQualityPolicy05A,acquiredCompendium05A} from '../src/resource-sites-05a.js';
test('candidate sites are stable, region bounded, undiscovered and opt-in',()=>{
 const a=createCandidateSites05A(); assert.deepEqual(a,createCandidateSites05A());
 assert.ok(Object.keys(a).length>=6);assert.ok(Object.values(a).every(x=>!x.discovered));
 const id='site05a:blueberry:숲';
 assert.equal(discoverCandidateSite05A(a,id,'습지').ok,false);
 assert.equal(harvestCandidateSite05A(a,id,'숲','gather').reason,'UNDISCOVERED');
});
test('candidate harvest depletes only validated source and never mutates input',()=>{
 const nodes=createCandidateSites05A(),id='site05a:blueberry:숲';
 const discovered=discoverCandidateSite05A(nodes,id,'숲');
 assert.equal(discovered.ok,true);
 let n=discovered.nodes;const before=n[id].remaining;
 for(let i=0;i<before;i++){const r=harvestCandidateSite05A(n,id,'숲','gather');assert.equal(r.ok,true);assert.equal(r.rewards[0].itemId,'item05a:blueberry');n=r.nodes;}
 assert.equal(harvestCandidateSite05A(n,id,'숲','gather').reason,'DEPLETED');
 assert.equal(nodes[id].remaining,before);
});
test('rare quartz requires correct region, activity and tool rank',()=>{
 const start=createCandidateSites05A(),id='site05a:quartz:광산';
 const n=discoverCandidateSite05A(start,id,'광산').nodes;
 assert.equal(harvestCandidateSite05A(n,id,'산맥','mining',{toolRank:1}).reason,'WRONG_SITE');
 assert.equal(harvestCandidateSite05A(n,id,'광산','gather',{toolRank:1}).reason,'WRONG_ACTIVITY');
 assert.equal(harvestCandidateSite05A(n,id,'광산','mining').reason,'TOOL_REQUIRED');
 assert.equal(harvestCandidateSite05A(n,id,'광산','mining',{toolRank:1}).rewards[0].itemId,'item05a:quartz');
});
test('quality policy uses activity then output exception; compendium records only yielded items',()=>{
 assert.equal(resolveQualityPolicy05A('gather','item05a:blueberry'),true);
 assert.equal(resolveQualityPolicy05A('gather','item05a:reed'),false);
 assert.equal(resolveQualityPolicy05A('mining','item05a:quartz'),false);
 assert.deepEqual(acquiredCompendium05A(null,[]),{sourceIds:[],itemIds:[]});
 const id='site05a:blueberry:숲',nodes=discoverCandidateSite05A(createCandidateSites05A(),id,'숲').nodes;
 const rewards=harvestCandidateSite05A(nodes,id,'숲','gather').rewards;
 assert.deepEqual(acquiredCompendium05A(null,rewards),{sourceIds:['source05a:blueberry'],itemIds:['item05a:blueberry']});
 assert.throws(()=>acquiredCompendium05A(null,[{itemId:'item05a:blueberry',quantity:0}]));
});
