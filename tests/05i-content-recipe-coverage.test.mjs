import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG_ITEMS_05A} from '../src/resource-catalog-05a.js';
import {BOTANICAL_ITEMS_05A} from '../src/botanical-species-05a.js';
import {BOTANICAL_SEED_ITEMS_05A} from '../src/botanical-ecology-adapter-05a.js';
import {FUNGAL_ITEMS_05B} from '../src/fungal-ecology-05b.js';
import {MINERAL_DEFINITIONS_05E} from '../src/mineral-deposits-05e.js';
import {REFINED_ITEMS_05H,REFINING_RECIPES_05H} from '../src/mineral-refining-05h.js';

// This is definition-to-recipe coverage, not a claim that every item is obtainable,
// usable in the UI, or approved as a finished gameplay loop.
test('registered materials and 05-H/I recipe input coverage remains measurable',()=>{
 const catalog=[...CATALOG_ITEMS_05A,...BOTANICAL_ITEMS_05A,
  ...BOTANICAL_SEED_ITEMS_05A,...FUNGAL_ITEMS_05B,...REFINED_ITEMS_05H];
 const registered=new Set(catalog.map(item=>item.id));
 const sources=new Set([...MINERAL_DEFINITIONS_05E.map(def=>def.id),
  ...BOTANICAL_ITEMS_05A.map(item=>item.id),
  ...FUNGAL_ITEMS_05B.map(item=>item.id)]);
 const consumed=new Set(),produced=new Set();
 for(const recipe of REFINING_RECIPES_05H){
  const requirements=recipe.inputs??[{itemId:recipe.input,quantity:recipe.inputQty}];
  assert.ok(requirements.length>0,recipe.id+' needs material inputs');
  for(const req of requirements){
   assert.ok(registered.has(req.itemId),'unregistered recipe input: '+recipe.id+' '+req.itemId);
   assert.ok(Number.isSafeInteger(req.quantity)&&req.quantity>0);
   consumed.add(req.itemId);
  }
  assert.ok(registered.has(recipe.output)||recipe.output.startsWith('tool05a:'),
   'unregistered output: '+recipe.id+' '+recipe.output);
  produced.add(recipe.output);
 }
 assert.ok(REFINING_RECIPES_05H.length>=12);
 const report={
  registeredMaterialDefinitions:registered.size,
  mineralDepositDefinitions:MINERAL_DEFINITIONS_05E.length,
  botanicalItemDefinitions:BOTANICAL_ITEMS_05A.length,
  fungalItemDefinitions:FUNGAL_ITEMS_05B.length,
  recipeCount:REFINING_RECIPES_05H.length,
  distinctRecipeInputs:consumed.size,
  distinctRecipeOutputs:produced.size,
  directlyModeledSourceInputs:[...consumed].filter(id=>sources.has(id)).sort(),
  recipeInputsNotInModeledSources:[...consumed].filter(id=>!sources.has(id)).sort(),
  registeredItemsNotConsumedByTheseRecipes:[...registered].filter(id=>!consumed.has(id)).length
 };
 console.log('CONTENT_COVERAGE_05H '+JSON.stringify(report));
});
