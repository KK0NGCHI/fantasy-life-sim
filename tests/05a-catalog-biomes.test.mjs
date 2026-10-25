import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RESOURCES_05A,createResourceNodes05A} from '../src/resources-05a.js';
import {RESOURCE_REGIONS_05A,RESOURCE_DEPTHS_05A,RESOURCE_BIOMES_05A,RESOURCE_SPECIES_05A,CATALOG_ITEMS_05A,validateResourceCatalog05A,acquiredEntries05A,makeResourceProvenance05A} from '../src/resource-catalog-05a.js';
test('05-A taxonomy covers exactly the 16 existing regions and four nested areas',()=>{
 assert.equal(RESOURCE_REGIONS_05A.length,16);assert.equal(Object.keys(RESOURCE_DEPTHS_05A).length,4);
 assert.ok(validateResourceCatalog05A());
 assert.deepEqual(Object.keys(RESOURCE_BIOMES_05A).sort(),[...RESOURCE_REGIONS_05A].sort());
});
test('05-A additive item catalogue preserves all twelve live legacy IDs and node fixture',()=>{
 const ids=new Set(CATALOG_ITEMS_05A.map(x=>x.id));
 for(const r of RESOURCES_05A)assert.ok(ids.has(r.itemId),r.itemId);
 assert.equal(RESOURCES_05A.length,12);
 assert.ok(Object.keys(createResourceNodes05A()).length>0);
});
test('05-A species and item IDs separate, multi-output source and obtain-only catalogue hook',()=>{
 const oak=RESOURCE_SPECIES_05A.find(s=>s.id==='source05a:oak');
 assert.deepEqual(oak.outputs,['item05a:oak-log','item05a:oak-sap']);
 assert.deepEqual(acquiredEntries05A('item05a:oak-sap'),{itemId:'item05a:oak-sap',sourceIds:['source05a:oak']});
 assert.equal(acquiredEntries05A('unobtained:not-defined'),null);
});
test('05-A provenance requires explicit source and does not infer traits',()=>{
 assert.deepEqual(makeResourceProvenance05A({sourceId:'source05a:oak',region:'숲'}),{sourceId:'source05a:oak',region:'숲',traits:[]});
 assert.throws(()=>makeResourceProvenance05A({sourceId:'source05a:missing',region:'숲'}));
 const sacred=makeResourceProvenance05A({sourceId:'source05a:sacred-oak',region:'깊은 숲',traits:['sacred','sacred']});
 assert.deepEqual(sacred.traits,['sacred']);
});
