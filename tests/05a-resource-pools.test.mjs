import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateResourcePool05A,rollResourcePool05A,resourcePoolProbabilities05A,matchesResourceConditions05A} from '../src/resource-pools-05a.js';
// Fictional IDs and weights here are *test fixtures*, not shipped resource/drop data.
const fixture={
 id:'test:grass',spawnConditions:{regions:['숲'],seasons:['spring','summer']},
 harvestConditions:{dayparts:['day','dusk']},
 regenerationPolicy:{kind:'fixed',intervalSeconds:86400,units:2},
 disappearancePolicy:'dormant',
 tiers:[{id:'common',weight:70,outputs:[
 {itemId:'test:herb',weight:1},{itemId:'test:poison',weight:1},{itemId:'test:dandelion',weight:1}]},
 {id:'advanced',weight:30,outputs:[
 {itemId:'test:crystal',weight:1,conditions:{seasons:['spring']}},
 {itemId:'test:glow',weight:1}]}]
};
const ctx={region:'숲',season:'spring',daypart:'day',weather:'clear'};
test('conditional two-stage pool produces 70%/3 and 30%/2 probabilities',()=>{
 assert.equal(validateResourcePool05A(fixture),true);
 const p=resourcePoolProbabilities05A(fixture,ctx);
 assert.ok(Math.abs(p.items['test:herb']-0.7/3)<1e-12);
 assert.ok(Math.abs(p.items['test:crystal']-0.15)<1e-12);
 assert.ok(Math.abs(p.none)<1e-12);
 assert.equal(rollResourcePool05A(fixture,ctx,{tierRoll:0.1,outputRoll:0.8}).itemId,'test:dandelion');
 assert.equal(rollResourcePool05A(fixture,ctx,{tierRoll:0.9,outputRoll:0.2}).itemId,'test:crystal');
});
test('season restriction is respected without rarity redistribution',()=>{
 const summer={...ctx,season:'summer'};
 const p=resourcePoolProbabilities05A(fixture,summer);
 assert.ok(Math.abs(p.none-0.15)<1e-12);
 assert.equal(p.items['test:crystal'],undefined);
 assert.deepEqual(rollResourcePool05A(fixture,summer,{tierRoll:0.8,outputRoll:0.1}),{ok:true,itemId:null,tierId:'advanced',reason:'OUTPUT_UNAVAILABLE'});
 assert.equal(rollResourcePool05A(fixture,{...ctx,season:'winter'},{tierRoll:0.9,outputRoll:0.9}).reason,'CONDITIONS_UNMET');
});
test('invalid weights, conditions and RNG are rejected',()=>{
 assert.equal(validateResourcePool05A({...fixture,tiers:[{...fixture.tiers[0],weight:0}]}),false);
 assert.equal(validateResourcePool05A({...fixture,spawnConditions:{seasons:['summer','summer']}}),false);
 assert.throws(()=>rollResourcePool05A(fixture,ctx,{tierRoll:1,outputRoll:0}));
 assert.equal(matchesResourceConditions05A({weather:['rain']},ctx),false);
});
test('independent deterministic rolls have stable categories',()=>{
 const sample=Array.from({length:1000},(_,i)=>rollResourcePool05A(fixture,ctx,{tierRoll:(i+0.5)/1000,outputRoll:0.2}));
 assert.equal(sample.filter(x=>x.tierId==='common').length,700);
 assert.equal(sample.filter(x=>x.tierId==='advanced').length,300);
});
