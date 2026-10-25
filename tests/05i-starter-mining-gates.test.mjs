import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REFINING_RECIPES_05H} from '../src/mineral-refining-05h.js';
import {MINERAL_BY_ID_05E} from '../src/mineral-deposits-05e.js';

const byOutput=new Map(REFINING_RECIPES_05H.map(r=>[r.output,r]));
const ingredients=r=>r.inputs??[{itemId:r.input,quantity:r.inputQty}];
function rawInputs(itemId,quantity=1,seen=new Set()){
 const recipe=byOutput.get(itemId);
 if(!recipe)return {[itemId]:quantity};
 assert.ok(!seen.has(itemId),'RECIPE_CYCLE '+itemId);
 const counts={};
 const batches=Math.ceil(quantity/recipe.outputQty);
 for(const input of ingredients(recipe)){
  const parts=rawInputs(input.itemId,input.quantity*batches,new Set([...seen,itemId]));
  for(const [id,count] of Object.entries(parts))counts[id]=(counts[id]??0)+count;
 }
 return counts;
}
test('every implemented copper/iron/bronze tool chain reports raw ore grade gates',()=>{
 const starterRank=1;
 const toolRecipes=REFINING_RECIPES_05H.filter(r=>r.id.startsWith('craft05i:')&&/-(pickaxe|axe)$/.test(r.id));
 assert.equal(toolRecipes.length,6);
 const report=toolRecipes.map(r=>{
  const inputs=rawInputs(r.output);
  const blocked=Object.entries(inputs).map(([itemId,qty])=>{
   const mineral=MINERAL_BY_ID_05E.get(itemId);
   return {itemId,qty,hardness:mineral?.hardness??null,
    blocked:mineral?mineral.hardness>starterRank:true};
  }).filter(x=>x.blocked);
  return {recipe:r.id,blocked,raw:inputs};
 });
 for(const row of report){
  assert.ok(row.blocked.length>0,row.recipe+' unexpectedly available from starter mining alone');
  assert.ok(row.blocked.some(x=>x.itemId.endsWith('ore')),'missing ore grade gate');
 }
 console.log('STARTER_MINING_GATES '+JSON.stringify({starterRank:1,toolRecipes:report}));
});
