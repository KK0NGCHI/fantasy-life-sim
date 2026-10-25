import {test} from 'node:test';
import assert from 'node:assert/strict';
import {simulate05A} from './05a-long-horizon.mjs';
import {REFINING_RECIPES_05H} from '../src/mineral-refining-05h.js';

const raw=['refine05h:copper','refine05h:iron','refine05h:stone'];
test('28/112/224-day provisional supply can be compared to actual recipe input costs',()=>{
 for(const scenario of ['casual','specialist','intensive']){
  let previous={items:0,possible:0};
  for(const days of [28,112,224]){
   const sim=simulate05A(days,scenario);
   const demand=Object.fromEntries(raw.map(id=>{
    const recipe=REFINING_RECIPES_05H.find(r=>r.id===id);
    const produced=sim.items['resource05a:'+recipe.input.split(':')[1]]??0;
    return [id,{available:produced,inputPerBatch:recipe.inputQty,
     potentialBatches:Math.floor(produced/recipe.inputQty)}];
   }));
   const potential=Object.values(demand).reduce((total,r)=>total+r.potentialBatches,0);
   assert.ok(sim.totalItems>=previous.items,'simulation production monotone');
   assert.ok(potential>=previous.possible,'potential recipe supply monotone');
   for(const row of Object.values(demand)){
    assert.ok(row.potentialBatches*row.inputPerBatch<=row.available);
    assert.ok((row.potentialBatches+1)*row.inputPerBatch>row.available);
   }
   console.log('ECONOMY_SUPPLY_DEMAND '+JSON.stringify({scenario,days,items:sim.totalItems,
    work:sim.metrics.work,xp:sim.totalXp,recipes:demand}));
   previous={items:sim.totalItems,possible:potential};
  }
 }
});
