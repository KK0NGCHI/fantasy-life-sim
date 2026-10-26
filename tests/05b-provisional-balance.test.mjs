import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FUNGAL_WET_DAY_COST_05B} from '../src/balance-fungi-05b.js';
import {FUNGAL_SPECIES_05B,FUNGAL_ECOLOGY_MAP_05B,createFungalEcology05B,fungalReconcile05B} from '../src/fungal-ecology-05b.js';
test('fungal provisional wet-day recovery thresholds preserve previous values for all species',()=>{
 assert.deepEqual(FUNGAL_WET_DAY_COST_05B,{rare:5,uncommon:3,common:2});
 for(const species of FUNGAL_SPECIES_05B){
  assert.equal(species.regrowRainDays,FUNGAL_WET_DAY_COST_05B[species.encounterClass],species.id);
 }
});
test('fungal 224-day reconciliation remains daily-vs-leap identical under extracted settings',()=>{
 for(const original of Object.values(createFungalEcology05B())){
  const definition=FUNGAL_ECOLOGY_MAP_05B.get(original.speciesId);
  const initial={...original,remaining:0};
  let daily=initial;
  for(let day=1;day<=224;day++)daily=fungalReconcile05B(daily,definition,day*86400,'balance-fungi');
  const leap=fungalReconcile05B(initial,definition,224*86400,'balance-fungi');
  assert.deepEqual(daily,leap,original.id);
  assert.ok(leap.remaining>=0&&leap.remaining<=definition.capacity);
 }
});
