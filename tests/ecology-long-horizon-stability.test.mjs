import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBotanicalEcology05A,BOTANICAL_ECOLOGY_MAP_05A} from '../src/botanical-ecology-adapter-05a.js';
import {ecologyReconcile} from '../src/ecology-core-05a.js';
import {createFungalEcology05B,FUNGAL_ECOLOGY_MAP_05B,fungalReconcile05B} from '../src/fungal-ecology-05b.js';

const DAY=86400,SEED='ecology-long-horizon-check';
test('depleted botanical patches reconcile identically in one leap or daily steps across 224 days',()=>{
 const sites=Object.values(createBotanicalEcology05A()).slice(0,24);
 for(const original of sites){
  const def=BOTANICAL_ECOLOGY_MAP_05A.get(original.speciesId);
  const start={...original,remaining:0};
  let stepped=start;
  for(let d=1;d<=224;d++)stepped=ecologyReconcile(stepped,def,d*DAY);
  const leap=ecologyReconcile(start,def,224*DAY);
  assert.deepEqual(stepped,leap,original.id);
  assert.ok(leap.remaining>=0&&leap.remaining<=def.capacity,original.id);
  assert.deepEqual(ecologyReconcile(leap,def,224*DAY),leap,'same timestamp cannot duplicate stock');
 }
});
test('fungal wet-day credit and regrowth are invariant under 224 daily steps versus one leap',()=>{
 const sites=Object.values(createFungalEcology05B());
 for(const original of sites){
  const def=FUNGAL_ECOLOGY_MAP_05B.get(original.speciesId);
  const start={...original,remaining:0};
  let stepped=start;
  for(let d=1;d<=224;d++)stepped=fungalReconcile05B(stepped,def,d*DAY,SEED);
  const leap=fungalReconcile05B(start,def,224*DAY,SEED);
  assert.deepEqual(stepped,leap,original.id);
  assert.ok(leap.remaining>=0&&leap.remaining<=def.capacity,original.id);
  assert.deepEqual(fungalReconcile05B(leap,def,224*DAY,SEED),leap,
   'same timestamp cannot duplicate mushrooms');
 }
});
