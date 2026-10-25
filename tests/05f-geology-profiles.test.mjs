import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REAL_ATLAS_05E,EXOTIC_ATLAS_05E} from '../src/mineral-atlas-05e.js';
import {GEOLOGICAL_PROFILES_05F,GEOLOGICAL_SETTINGS_05F,geologyProfile05F} from '../src/mineral-geology-05f.js';
import {createMineralDeposits05E,validateMineralDeposits05E} from '../src/mineral-deposits-05e.js';

test('every real atlas entry has a bounded descriptive geology profile',()=>{
 assert.equal(GEOLOGICAL_PROFILES_05F.length,94);
 assert.equal(new Set(GEOLOGICAL_PROFILES_05F.map(x=>x.materialId)).size,94);
 for(const entry of REAL_ATLAS_05E){
  const profile=geologyProfile05F(entry.id);
  assert.ok(profile,entry.id);
  assert.ok(GEOLOGICAL_SETTINGS_05F[profile.settingId]);
  assert.equal(profile.verifiedForSpawn,false);
  assert.ok(profile.depthBand);
 }
});
test('geological examples do not imply cosmic item provenance or world spawn',()=>{
 for(const entry of EXOTIC_ATLAS_05E)assert.equal(geologyProfile05F(entry.id),null);
 const quartz=REAL_ATLAS_05E.find(x=>x.en==='amethyst');
 assert.equal(geologyProfile05F(quartz.id).settingId,'hydrothermal');
 const before=createMineralDeposits05E();
 assert.equal(validateMineralDeposits05E(before),true);
 assert.equal(Object.keys(before).length,214);
});
