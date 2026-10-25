import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REFINING_RECIPES_05H} from '../src/mineral-refining-05h.js';
import {simulate05A} from './05a-long-horizon.mjs';

const recipes=new Map(REFINING_RECIPES_05H.map(recipe=>[recipe.output,recipe]));
const inputs=recipe=>recipe.inputs??[{itemId:recipe.input,quantity:recipe.inputQty}];
function rawCost(itemId,quantity,seen=new Set()){
 const recipe=recipes.get(itemId);
 if(!recipe)return {[itemId]:quantity};
 assert.ok(!seen.has(itemId),'circular recipe path: '+itemId);
 const batches=Math.ceil(quantity/recipe.outputQty);
 const result={};
 for(const req of inputs(recipe)){
  const cost=rawCost(req.itemId,req.quantity*batches,new Set([...seen,itemId]));
  for(const [id,qty] of Object.entries(cost))result[id]=(result[id]??0)+qty;
 }
 return result;
}
const tools=REFINING_RECIPES_05H.filter(recipe=>recipe.id.startsWith('craft05i:')&&/-(pickaxe|axe)$/.test(recipe.id));
test('six tool recipes resolve through real 05-H production chains with no circular dependencies',()=>{
 assert.equal(tools.length,6);
 const expected={
  'craft05i:copper-pickaxe':{'item05a:copper-ore':4,'item05a:stone':2},
  'craft05i:copper-axe':{'item05a:copper-ore':4,'item05a:stone':2},
  'craft05i:iron-pickaxe':{'item05a:iron-ore':4,'item05a:stone':2},
  'craft05i:iron-axe':{'item05a:iron-ore':4,'item05a:stone':2},
  'craft05i:bronze-pickaxe':{'item05a:copper-ore':4,'item05a:tin-ore':2,'item05a:stone':2},
  'craft05i:bronze-axe':{'item05a:copper-ore':4,'item05a:tin-ore':2,'item05a:stone':2}
 };
 for(const recipe of tools)assert.deepEqual(rawCost(recipe.output,1),expected[recipe.id],recipe.id);
});
test('28/112/224-day resource output is compared against full raw-material costs for six tools',()=>{
 for(const kind of ['casual','specialist','intensive']){
  for(const days of [28,112,224]){
   const sim=simulate05A(days,kind);
   const available=id=>sim.items['resource05a:'+id.split(':')[1]]??0;
   const counts=Object.fromEntries(tools.map(recipe=>{
    const raw=rawCost(recipe.output,1);
    // Each candidate estimate is independent; crafting all tool types at once
    // would share stocks and cannot be inferred by summing these counts.
    const possible=Math.min(...Object.entries(raw).map(([id,qty])=>Math.floor(available(id)/qty)));
    assert.ok(Number.isSafeInteger(possible)&&possible>=0);
    return [recipe.id,possible];
   }));
   assert.equal(counts['craft05i:bronze-axe'],0,
    '05-A prototype scenario does not produce tin ore; do not imply bronze is obtainable');
   console.log('TOOL_CHAIN_COVERAGE '+JSON.stringify({kind,days,rawSupplies:{
    copper:available('item05a:copper-ore'),iron:available('item05a:iron-ore'),
    tin:available('item05a:tin-ore'),stone:available('item05a:stone')},potentialTools:counts}));
  }
 }
});
