import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MINERAL_BY_ID_05E} from '../src/mineral-deposits-05e.js';
import {REFINING_RECIPES_05H} from '../src/mineral-refining-05h.js';

const byOutput=new Map(REFINING_RECIPES_05H.map(recipe=>[recipe.output,recipe]));
const inputs=r=>r.inputs??[{itemId:r.input,quantity:r.inputQty}];
function rawNeeds(output,count=1,visited=new Set()){
 const recipe=byOutput.get(output);
 if(!recipe)return {[output]:count};
 assert.ok(!visited.has(output),'cyclic refining chain: '+output);
 const batches=Math.ceil(count/recipe.outputQty),result={};
 for(const req of inputs(recipe)){
  const sub=rawNeeds(req.itemId,req.quantity*batches,new Set([...visited,output]));
  for(const [itemId,qty] of Object.entries(sub))result[itemId]=(result[itemId]??0)+qty;
 }
 return result;
}
function mergeNeeds(...parts){
 const needs={};
 for(const part of parts)for(const [id,qty] of Object.entries(part))needs[id]=(needs[id]??0)+qty;
 return needs;
}
test('actual 05-E finite stock can provision the provisional complete rank-1 to rank-3 ladder',()=>{
 const stages=[
  {name:'rank2',output:'tool05a:pickaxe:reinforcedStone'},
  {name:'rank3',output:'tool05a:pickaxe:reinforcedBronze'},
  {name:'firstIronIngot',output:'item05h:iron-ingot'}
 ];
 const needs=mergeNeeds(...stages.map(x=>rawNeeds(x.output)));
 const comparison=Object.entries(needs).map(([itemId,required])=>{
  const def=MINERAL_BY_ID_05E.get(itemId);
  assert.ok(def,'unknown mineral source for '+itemId);
  const available=def.regions.length*def.stock;
  const expectedYields=available*(0.5+0.1*def.grade);
  assert.ok(required<=available,JSON.stringify({itemId,required,available}));
  return {itemId,required,available,expectedYields,hardness:def.hardness};
 });
 assert.equal(MINERAL_BY_ID_05E.get('item05a:iron-ore').hardness,3);
 assert.equal(MINERAL_BY_ID_05E.get('item05a:copper-ore').hardness,2);
 assert.equal(MINERAL_BY_ID_05E.get('item05a:stone').hardness,1);
 console.log('FINITE_GEOLOGY_LADDER '+JSON.stringify({stages,needs,comparison,
  note:'Expected yields are mean estimates; no single world seed or complete crafting plan is guaranteed by this bound.'}));
});
test('every actual 05-I tool recipe has finite raw geology bounds and measurable bottlenecks',()=>{
 for(const recipe of REFINING_RECIPES_05H.filter(r=>r.output.startsWith('tool05a:'))){
  const cost=rawNeeds(recipe.output);
  const limits=Object.entries(cost).map(([itemId,qty])=>{
   const def=MINERAL_BY_ID_05E.get(itemId);
   if(!def)return {itemId,qty,missing:true};
   return {itemId,qty,stock:2*def.stock,
    potentialBatches:Math.floor(2*def.stock/qty),hardness:def.hardness};
  });
  assert.ok(limits.every(x=>!x.missing),'missing real mineral source '+recipe.id);
  console.log('FINITE_RECIPE_LIMIT '+JSON.stringify({recipe:recipe.id,limits}));
 }
});
