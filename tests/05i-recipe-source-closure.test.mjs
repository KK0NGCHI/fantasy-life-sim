import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REFINING_RECIPES_05H} from '../src/mineral-refining-05h.js';
import {MINERAL_DEFINITIONS_05E} from '../src/mineral-deposits-05e.js';
import {RESOURCES_05A} from '../src/resources-05a.js';
import {FUNGAL_ITEMS_05B} from '../src/fungal-ecology-05b.js';
import {BOTANICAL_ITEMS_05A} from '../src/botanical-species-05a.js';

const liveSourceItems=new Set([
 ...MINERAL_DEFINITIONS_05E.map(x=>x.id),
 ...RESOURCES_05A.map(x=>x.itemId),
 ...FUNGAL_ITEMS_05B.map(x=>x.id),
 ...BOTANICAL_ITEMS_05A.map(x=>x.id)
]);
const producers=new Map(REFINING_RECIPES_05H.map(r=>[r.output,r]));
const inputs=recipe=>recipe.inputs??[{itemId:recipe.input,quantity:recipe.inputQty}];
function trace(itemId,seen=new Set()){
 if(liveSourceItems.has(itemId))return {raw:[itemId],depth:0};
 const producer=producers.get(itemId);
 assert.ok(producer,'no modeled live source or intermediate recipe for '+itemId);
 assert.ok(!seen.has(itemId),'cycle in recipe dependency graph: '+itemId);
 const children=inputs(producer).map(input=>{
  assert.ok(Number.isSafeInteger(input.quantity)&&input.quantity>0);
  return trace(input.itemId,new Set([...seen,itemId]));
 });
 return {raw:children.flatMap(x=>x.raw),depth:1+Math.max(...children.map(x=>x.depth))};
}
test('all implemented production recipes have acyclic dependencies rooted in live mineral or resource actions',()=>{
 assert.equal(new Set(REFINING_RECIPES_05H.map(x=>x.output)).size,REFINING_RECIPES_05H.length);
 assert.ok(REFINING_RECIPES_05H.length>=16);
 const report=REFINING_RECIPES_05H.map(recipe=>{
  const source=trace(recipe.output);
  assert.ok(source.raw.length>0,recipe.id);
  return {recipe:recipe.id,depth:source.depth,raw:[...new Set(source.raw)].sort()};
 });
 assert.ok(report.some(x=>x.recipe==='craft05i:herbal-fiber-gloves'&&x.raw.includes('item05a:plantago-major')));
 assert.ok(report.some(x=>x.recipe==='craft05i:mycelium-gloves'&&x.raw.includes('item05b:wood-ear')&&x.raw.includes('item05a:grass')));
 assert.ok(report.some(x=>x.recipe==='craft05i:processed-wood-rod'&&x.raw.includes('item05a:oak-log')&&x.raw.includes('item05a:grass')));
 assert.ok(report.some(x=>x.recipe==='upgrade05i:reinforced-stone-pickaxe'&&x.raw.includes('item05a:clay')));
 console.log('RECIPE_SOURCE_CLOSURE '+JSON.stringify({
  recipeCount:report.length,liveSourceItemDefinitions:liveSourceItems.size,
  maximumDependencyDepth:Math.max(...report.map(x=>x.depth)),recipes:report
 }));
});
