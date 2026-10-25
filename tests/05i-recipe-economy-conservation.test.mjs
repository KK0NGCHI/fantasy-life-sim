import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REFINING_RECIPES_05H,refineMineral05H} from '../src/mineral-refining-05h.js';

const requirements=r=>r.inputs??[{itemId:r.input,quantity:r.inputQty}];
function initialWorld(recipe){
 const req=requirements(recipe);
 return {items:req.map((x,i)=>({id:'input'+i,definitionId:x.itemId,quantity:x.quantity*2})),
  placements:req.map((x,i)=>({itemId:'input'+i,location:{kind:'inventory',ownerId:'owner'}})),containers:[]};
}
function amount(world,owner,id){
 return world.items.filter(x=>x.definitionId===id&&world.placements.some(p=>p.itemId===x.id&&p.location.kind==='inventory'&&p.location.ownerId===owner))
  .reduce((n,x)=>n+x.quantity,0);
}
test('all 12 real processing and tool recipes debit ingredients exactly once on repeated crafting',()=>{
 for(const recipe of REFINING_RECIPES_05H){
  const initial=initialWorld(recipe),snapshot=structuredClone(initial);
  const once=refineMineral05H(initial,'owner',recipe.id);
  assert.equal(once.ok,true,recipe.id+' '+once.reason);
  const twice=refineMineral05H(once.itemWorld,'owner',recipe.id);
  assert.equal(twice.ok,true,recipe.id+' '+twice.reason);
  assert.deepEqual(initial,snapshot,recipe.id+' source mutation');
  for(const req of requirements(recipe)){
   assert.equal(amount(once.itemWorld,'owner',req.itemId),req.quantity,recipe.id+' first debit');
   assert.equal(amount(twice.itemWorld,'owner',req.itemId),0,recipe.id+' second debit');
  }
  assert.equal(amount(once.itemWorld,'owner',recipe.output),recipe.outputQty,recipe.id+' first reward');
  assert.equal(amount(twice.itemWorld,'owner',recipe.output),2*recipe.outputQty,recipe.id+' second reward');
  const denied=refineMineral05H(twice.itemWorld,'owner',recipe.id);
  assert.equal(denied.ok,false,recipe.id+' finite materials');
  assert.deepEqual(twice.itemWorld,structuredClone(twice.itemWorld),recipe.id+' remains serializable');
 }
});
test('all recipes reject one-unit ingredient shortages without partial spending or rewards',()=>{
 for(const recipe of REFINING_RECIPES_05H){
  const req=requirements(recipe);
  for(const short of req){
   const world=initialWorld(recipe);
   world.items.find(x=>x.definitionId===short.itemId).quantity=short.quantity-1;
   const before=structuredClone(world);
   const out=refineMineral05H(world,'owner',recipe.id);
   assert.equal(out.ok,false,recipe.id+' '+short.itemId);
   assert.equal(out.reason,'INSUFFICIENT_MATERIAL');
   assert.deepEqual(world,before,'no partial material consumption');
  }
 }
});
test('other players cannot consume or stack into an owner inventory',()=>{
 for(const recipe of REFINING_RECIPES_05H){
  const world=initialWorld(recipe);
  const denied=refineMineral05H(world,'intruder',recipe.id);
  assert.equal(denied.ok,false,recipe.id);
  assert.equal(denied.reason,'INSUFFICIENT_MATERIAL');
  assert.equal(amount(world,'owner',recipe.output),0);
 }
});
