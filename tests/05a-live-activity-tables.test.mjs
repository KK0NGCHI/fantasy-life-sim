import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVITY_TABLES_05A} from '../src/activity-tables-05a.js';
import {validateIncidentalTable05A} from '../src/incidental-resources-05a.js';
import {BOTANICAL_ITEMS_05A,BOTANICAL_SPECIES_05A} from '../src/botanical-species-05a.js';
import {CATALOG_ITEMS_05A} from '../src/resource-catalog-05a.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const items=new Set([...CATALOG_ITEMS_05A,...BOTANICAL_ITEMS_05A].map(x=>x.id));
const make=()=>createMainV2Inventory([{id:'test:base',name:'기본',group:'재료',qty:1,tags:[]}],{
 worldSeed:'live-provisional-tables',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,
 preferences:{getItem:()=>null,setItem:()=>{}},incidentalTables05A:ACTIVITY_TABLES_05A
});
test('all live activity tables use registered items and correct keyed habitats',()=>{
 assert.ok(Object.keys(ACTIVITY_TABLES_05A).length>=10);
 for(const [key,t] of Object.entries(ACTIVITY_TABLES_05A)){
  assert.equal(key,t.region+':'+t.activity);
  assert.equal(validateIncidentalTable05A(t),true,key);
  assert.ok(t.pool.tiers.flatMap(x=>x.outputs).every(o=>items.has(o.itemId)),key);
  assert.deepEqual(t.pool.spawnConditions.regions,[t.region]);
 }
});
test('desert discovery uses 600 seconds and grants only a declared local item',()=>{
 const g=make();
 assert.equal(g.dispatch('world.travel',{region:'사막'}).accepted,true);
 const initial=g.current(),itemId='item05a:stone';
 let found=0;
 for(let i=0;i<50;i++){
  const response=g.dispatch('resource.incidental.search',{activity:'explore'});
  assert.equal(response.accepted,true,JSON.stringify(response));
  const current=g.current();
  const obtained=current.itemWorld.items.find(x=>x.id==='incidental05a:'+itemId)?.quantity??0;
  found=obtained;
 }
 assert.ok(found>0);
 assert.equal(g.current().clock.elapsedUnits-initial.clock.elapsedUnits,30000);
 assert.equal(g.current().itemWorld.items.filter(x=>x.id.startsWith('incidental05a:')).length,1);
});
test('no incidental rewards can be claimed from a mismatched biome',()=>{
 const g=make();
 g.dispatch('world.travel',{region:'사막'});
 const result=g.dispatch('resource.incidental.search',{activity:'fishing'});
 assert.equal(result.accepted,false);
});
test('existing region investigation remains usable with configured side finds',()=>{
 const g=make();
 g.dispatch('world.travel',{region:'고대 유적'});
 const r=g.dispatch('region.activity',{activityId:'core:activity/ancient-ruins'});
 assert.equal(r.accepted,true,JSON.stringify(r));
});

test('curated plant entries are taxonomically distinct, source-linked and season-filtered',()=>{
 assert.equal(BOTANICAL_SPECIES_05A.length,6);
 assert.equal(new Set(BOTANICAL_SPECIES_05A.map(s=>s.scientificName)).size,6);
 for(const sp of BOTANICAL_SPECIES_05A){
  assert.match(sp.source,/^https:\/\//);
  assert.ok(sp.seasons.length>0);
  for(const reg of sp.regions){
   const table=ACTIVITY_TABLES_05A[reg+':explore'];
   assert.ok(table,reg);
   const found=table.pool.tiers.flatMap(t=>t.outputs).find(o=>o.itemId===sp.id);
   assert.deepEqual(found.conditions.seasons,sp.seasons);
  }
 }
});
test('curated botanical item can be earned by a season-eligible world exploration action',()=>{
 const g=make();
 assert.equal(g.dispatch('world.travel',{region:'초원·농경지'}).accepted,true);
 let found=false;
 for(let i=0;i<700;i++){
  assert.equal(g.dispatch('resource.incidental.search',{activity:'explore'}).accepted,true);
  if(g.current().itemWorld.items.some(x=>BOTANICAL_ITEMS_05A.some(b=>b.id===x.definitionId))){found=true;break}
 }
 assert.equal(found,true);
});
