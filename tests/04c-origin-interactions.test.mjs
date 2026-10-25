import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createOrigin} from '../src/character-origin-04b.js';
import {ORIGIN_INTERACTIONS,availableOriginInteractions,resolveOriginInteraction} from '../src/origin-interactions-04c.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const preferences={getItem:()=>null,setItem:()=>{}};
const make=()=>createMainV2Inventory([{id:'test:stone',name:'돌',group:'재료',qty:1,tags:[]}],{progression04A:true,preferences});
test('04-C has unique contextual recognition for each of 16 backgrounds',()=>{
 assert.equal(ORIGIN_INTERACTIONS.length,16);assert.equal(new Set(ORIGIN_INTERACTIONS.map(i=>i.backgroundId)).size,16);
 for(const item of ORIGIN_INTERACTIONS){
  const owner=createOrigin('human',item.backgroundId);
  assert.equal(resolveOriginInteraction(owner,item.region,item.id).ok,true);
  assert.equal(availableOriginInteractions(owner,item.region).length,1);
  const notOwner=createOrigin('human',item.backgroundId==='farmer'?'miner':'farmer');
  assert.equal(resolveOriginInteraction(notOwner,item.region,item.id).reason,'EXCLUSIVE_BACKGROUND');
  assert.equal(resolveOriginInteraction(owner,'다른 지역',item.id).reason,'NOT_IN_REGION');
 }
});
test('04-C context action uses dispatcher clock and non-repeatable flags',()=>{
 const g=make();g.chooseOrigin04B('human','cook');
 const first=g.dispatch('origin.insight',{interactionId:'origin:insight/cook'});
 assert.equal(first.accepted,true);
 assert.equal(g.current().clock.elapsedUnits,60);
 assert.equal(g.current().flags['origin-insight:origin:insight/cook'],true);
 const before=g.current();
 const again=g.dispatch('origin.insight',{interactionId:'origin:insight/cook'});
 assert.equal(again.accepted,false);
 assert.deepEqual(g.current(),before);
});
test('04-C no origin and cross-background actions cannot grant recognition',()=>{
 const g=make();
 const first=g.current();
 assert.equal(g.dispatch('origin.insight',{interactionId:'origin:insight/cook'}).accepted,false);
 assert.deepEqual(g.current(),first);
 g.chooseOrigin04B('human','farmer');
 assert.equal(g.dispatch('origin.insight',{interactionId:'origin:insight/cook'}).accepted,false);
});
