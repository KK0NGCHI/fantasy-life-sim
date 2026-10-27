import {test} from 'node:test';
import assert from 'node:assert/strict';
import {materialMatches,planMaterialAllocation} from '../src/material-compatibility-05j.js';

const wood=(id,definitionId,quantity,traits=[])=>({
 id,definitionId,quantity,family:'wood',form:'plank',grade:1,traits,originClass:'mundane'
});
test('flexible material selection does not steal a required exact species',()=>{
 const inventory=[wood('oak','oak-plank',2,['hard']),wood('birch','birch-plank',2,['light'])];
 const before=structuredClone(inventory);
 const result=planMaterialAllocation(inventory,[
  {slotId:'flexible',quantity:2,material:{family:'wood',form:'plank'}},
  {slotId:'exact',quantity:2,exactId:'oak-plank'}
 ]);
 assert.equal(result.ok,true);
 assert.deepEqual(result.allocations.filter(x=>x.slotId==='exact'),[{slotId:'exact',itemId:'oak',quantity:2}]);
 assert.deepEqual(result.allocations.filter(x=>x.slotId==='flexible'),[{slotId:'flexible',itemId:'birch',quantity:2}]);
 assert.deepEqual(inventory,before);
});
test('material family, form, grade, traits and origin restrictions',()=>{
 const item=wood('m','moon-plank',1,['glow','dream']);item.grade=3;item.originClass='otherworld';
 assert.equal(materialMatches(item,{material:{family:'wood',form:'plank',minGrade:2,requiredTraits:['dream'],allowedOrigins:['otherworld']}}),true);
 assert.equal(materialMatches(item,{material:{family:'wood',requiredTraits:['hard']}}),false);
 assert.equal(materialMatches(item,{material:{family:'wood',excludedTraits:['glow']}}),false);
 assert.equal(materialMatches(item,{material:{family:'wood',allowedOrigins:['mundane']}}),false);
});
test('allocation cannot double spend and failure is atomic',()=>{
 const inventory=[wood('one','oak-plank',2)],before=structuredClone(inventory);
 const result=planMaterialAllocation(inventory,[
  {slotId:'one',quantity:2,material:{family:'wood'}},
  {slotId:'two',quantity:2,material:{family:'wood'}}
 ]);
 assert.deepEqual(result,{ok:false,reason:'INSUFFICIENT_MATERIAL'});
 assert.deepEqual(inventory,before);
});
test('duplicate identities and malformed slots rejected',()=>{
 assert.equal(planMaterialAllocation([wood('x','oak',1),wood('x','birch',1)],[{slotId:'a',quantity:1,material:{family:'wood'}}]).reason,'INVALID_MATERIAL_PLAN');
 assert.equal(planMaterialAllocation([wood('x','oak',2)],[{slotId:'a',quantity:1,material:{family:'wood'}},{slotId:'a',quantity:1,material:{family:'wood'}}]).reason,'INVALID_MATERIAL_PLAN');
 assert.equal(planMaterialAllocation([wood('x','oak',1)],[{slotId:'a',quantity:1,exactId:'oak',material:{family:'wood'}}]).reason,'INVALID_MATERIAL_PLAN');
});
test('several source stacks can jointly fill one material slot',()=>{
 const result=planMaterialAllocation([wood('a','oak',1),wood('b','oak',2)],[{slotId:'wood',quantity:3,material:{family:'wood',form:'plank'}}]);
 assert.equal(result.ok,true);
 assert.equal(result.allocations.reduce((n,x)=>n+x.quantity,0),3);
});
