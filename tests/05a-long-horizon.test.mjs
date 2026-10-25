import {test} from 'node:test';
import assert from 'node:assert/strict';
import {simulate05A} from './05a-long-horizon.mjs';
test('05-A 28/112/224-day activity and XP scenarios',()=>{
 for(const kind of ['casual','specialist','intensive']){
  let previous={totalItems:0,totalXp:0};
  for(const days of [28,112,224]){
   const result=simulate05A(days,kind);
   console.log('SIM05A '+JSON.stringify(result));
   assert.ok(result.metrics.work>0);
   assert.ok(result.totalItems>=previous.totalItems);
   assert.ok(result.totalXp>=previous.totalXp);
   assert.ok(result.metrics.seconds<=days*6*3600);
   assert.ok(result.nodes<=6000);
   previous=result;
  }
 }
});
