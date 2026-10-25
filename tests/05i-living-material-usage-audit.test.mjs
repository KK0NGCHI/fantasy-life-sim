import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOTANICAL_ITEMS_05A} from '../src/botanical-species-05a.js';
import {FUNGAL_ITEMS_05B} from '../src/fungal-ecology-05b.js';
import {REFINING_RECIPES_05H} from '../src/mineral-refining-05h.js';
const requirements=r=>r.inputs??[{itemId:r.input,quantity:r.inputQty}];
test('plant and fungus material usage gaps are measured against actual implemented recipes',()=>{
 const materials=[...BOTANICAL_ITEMS_05A,...FUNGAL_ITEMS_05B];
 const ids=materials.map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length,'botanical and fungal definitions must not share item IDs');
 const directInputs=new Set(REFINING_RECIPES_05H.flatMap(requirements).map(x=>x.itemId));
 const used=ids.filter(id=>directInputs.has(id));
 const unused=ids.filter(id=>!directInputs.has(id));
 assert.equal(used.length+unused.length,ids.length);
 console.log('LIVING_MATERIAL_USAGE '+JSON.stringify({
  botanicalDefinitions:BOTANICAL_ITEMS_05A.length,fungalDefinitions:FUNGAL_ITEMS_05B.length,
  directlyConsumed:used.length,unused:unused.length,usedIds:used,unusedIds:unused,
  note:'This measures only 05-H/I refining recipes, not all future cooking or life-skill activities.'
 }));
 // A measurable baseline; future recipes should make utilization grow rather than
 // misleadingly interpreting presence in the item registry as usable content.
 assert.ok(ids.length>0);
});
