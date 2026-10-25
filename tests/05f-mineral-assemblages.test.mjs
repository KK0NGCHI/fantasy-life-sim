import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REAL_ATLAS_05E,EXOTIC_ATLAS_05E} from '../src/mineral-atlas-05e.js';
import {ASSEMBLAGE_TYPES_05F,MATERIAL_ASSEMBLAGES_05F,mineralAssemblage05F,assemblageForDeposit05F} from '../src/mineral-assemblages-05f.js';
import {createMineralDeposits05E,validateMineralDeposits05E,mineMineral05E,prospectMineral05E} from '../src/mineral-deposits-05e.js';
test('all 94 real candidates map to known assemblage types, without generating cosmic deposits',()=>{
 assert.equal(MATERIAL_ASSEMBLAGES_05F.length,94);
 assert.equal(new Set(MATERIAL_ASSEMBLAGES_05F.map(x=>x.materialId)).size,94);
 const ids=new Set(REAL_ATLAS_05E.map(x=>x.id));
 for(const entry of MATERIAL_ASSEMBLAGES_05F){
  assert.ok(ASSEMBLAGE_TYPES_05F[entry.assemblageId]);
  assert.equal(entry.spawnEnabled,false);
  assert.equal(entry.stockCoupled,false);
  assert.ok(entry.associatedMaterialIds.every(x=>ids.has(x)&&x!==entry.materialId));
 }
 for(const entry of EXOTIC_ATLAS_05E)assert.equal(mineralAssemblage05F(entry.id),null);
});
test('assemblage lookup does not change stock or save-ledger shape',()=>{
 const before=createMineralDeposits05E();
 const id=REAL_ATLAS_05E.find(x=>x.en==='chalcopyrite').id;
 const prospect=prospectMineral05E(before,'광산',id);
 assert.equal(prospect.ok,true);
 const link=assemblageForDeposit05F(prospect.deposits[prospect.siteId]);
 assert.equal(link.depositId,prospect.siteId);
 assert.equal(link.remaining,4);
 assert.ok(link.associatedMaterialIds.length>0);
 const mined=mineMineral05E(prospect.deposits,'광산',prospect.siteId,{toolPower:1,roll:0});
 assert.equal(mined.remaining,3);
 assert.equal(validateMineralDeposits05E(mined.deposits),true);
 const others=Object.keys(before).filter(key=>key!==prospect.siteId);
 assert.ok(others.every(key=>JSON.stringify(before[key])===JSON.stringify(mined.deposits[key])));
});
