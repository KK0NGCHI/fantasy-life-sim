import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOTANICAL_RENEWAL_DAYS_05A,BOTANICAL_PATCH_CAPACITY_05A} from '../src/balance-botany-05a.js';
import {BOTANICAL_PROFILES_05A} from '../src/botanical-profiles-05a.js';
import {botanicalRenewalSeconds05A} from '../src/botanical-lifecycle-05a.js';
import {BOTANICAL_ECOLOGY_MAP_05A} from '../src/botanical-ecology-adapter-05a.js';
test('all botanical species keep original proposed renewal cadence and patch capacities',()=>{
 assert.deepEqual(BOTANICAL_RENEWAL_DAYS_05A,{renewable:2,seasonal:7,slow:21,'rain-pulse':3});
 assert.deepEqual(BOTANICAL_PATCH_CAPACITY_05A,{slow:1,other:3});
 for(const profile of BOTANICAL_PROFILES_05A){
  const def=BOTANICAL_ECOLOGY_MAP_05A.get(profile.id);
  assert.ok(def,profile.id);
  assert.equal(botanicalRenewalSeconds05A(profile),BOTANICAL_RENEWAL_DAYS_05A[profile.renewalClass]*86400);
  assert.equal(def.capacity,profile.renewalClass==='slow'?1:3);
 }
});
