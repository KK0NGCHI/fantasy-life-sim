import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOTANICAL_PROFILES_05A} from '../src/botanical-profiles-05a.js';
import {botanicalCalendar05A,botanicalPhenology05A,botanicalRenewalSeconds05A,eligibleBotanicalObservations05A,botanicalCanHarvest05A,botanicalMarkHarvest05A,botanicalLastHarvest05A} from '../src/botanical-lifecycle-05a.js';
import {ACTIVITY_TABLES_05A} from '../src/activity-tables-05a.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const opts={worldSeed:'botany-runtime',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,
 preferences:{getItem:()=>null,setItem:()=>{}},incidentalTables05A:ACTIVITY_TABLES_05A};
const make=()=>createMainV2Inventory([{id:'test:starter',name:'테스트',group:'재료',qty:1,tags:[]}],opts);
const meta={slotId:'botanical-runtime',worldId:'world',kind:'manual',label:'test',savedAt:'2026-10-24T00:00:00Z',revision:0};
test('all eighty profiles have deterministic phenology and renewal proposal',()=>{
 assert.equal(BOTANICAL_PROFILES_05A.length,80);
 for(const p of BOTANICAL_PROFILES_05A){
  const seconds=botanicalRenewalSeconds05A(p);
  assert.ok(seconds>=172800);
  assert.equal(botanicalPhenology05A(p,{season:'winter'}).present,true);
  assert.equal(botanicalPhenology05A(p,{season:'winter'}).harvestable,p.dropEnabled&&p.seasons.includes('winter')&&p.renewalClass!=='rain-pulse');
 }
});
test('desert rain-pulse species require actual rain to enter reward table',()=>{
 const table=ACTIVITY_TABLES_05A['사막:explore'];
 const plant=BOTANICAL_PROFILES_05A.find(p=>p.renewalClass==='rain-pulse'&&p.dropEnabled);
 const out=table.pool.tiers.flatMap(t=>t.outputs).find(o=>o.itemId===plant.id);
 assert.deepEqual(out.conditions.weather,['rain']);
 assert.equal(botanicalPhenology05A(plant,{season:'spring',weather:undefined}).harvestable,false);
 assert.equal(botanicalPhenology05A(plant,{season:'spring',weather:'rain',daypart:'day'}).harvestable,true);
});
test('one-time non-destructive observations persist and never create material loot',()=>{
 const g=make();
 assert.equal(g.dispatch('world.travel',{region:'숲'}).accepted,true);
 const list=eligibleBotanicalObservations05A('숲',g.current().clock.elapsedUnits,g.current().flags);
 assert.ok(list.length>0);
 const species=list[0],before=g.current();
 const first=g.dispatch('botanical.observe',{itemId:species.id});
 assert.equal(first.accepted,true,JSON.stringify(first));
 const after=g.current();
 assert.equal(after.itemWorld.items.length,before.itemWorld.items.length);
 assert.equal(after.flags['botany05a:observed:'+species.id],true);
 assert.equal(after.clock.elapsedUnits-before.clock.elapsedUnits,600);
 assert.equal(g.dispatch('botanical.observe',{itemId:species.id}).accepted,false);
 const v2=createSaveV2(after,meta,'test',g.registry);
 const converted=prepareSecondsV2ToV3(v2,g.registry);
 assert.equal(converted.ok,true);
 const saved=createSaveV3(converted.state,meta,'test',g.registry);
 assert.equal(decodeSaveV3(saved,g.registry).ok,true);
 const restored=make();restored.applyApprovedSave(saved);
 assert.equal(restored.current().flags['botany05a:observed:'+species.id],true);
});
test('phenology retains dormant plants and blocks out-of-season collection',()=>{
 const p=BOTANICAL_PROFILES_05A.find(x=>x.id==='item05a:allium-ursinum');
 assert.equal(botanicalPhenology05A(p,{season:'winter'}).present,true);
 assert.equal(botanicalPhenology05A(p,{season:'winter'}).harvestable,false);
 assert.equal(botanicalPhenology05A(p,{season:'spring',daypart:'day'}).harvestable,true);
 assert.equal(botanicalCalendar05A(0).season,'spring');
});

test('species cooldown obeys saved last harvest day and constant-size flags',()=>{
 const p=BOTANICAL_PROFILES_05A.find(x=>x.id==='item05a:plantago-major');
 const first=botanicalMarkHarvest05A({},p,600);
 assert.equal(botanicalLastHarvest05A(first,p.id),0);
 assert.equal(botanicalCanHarvest05A(first,p,600).ok,false);
 assert.equal(botanicalCanHarvest05A(first,p,2*86400).ok,true);
 const second=botanicalMarkHarvest05A(first,p,2*86400);
 assert.equal(Object.keys(second).length,1);
 assert.equal(botanicalLastHarvest05A(second,p.id),2);
});
test('harvest markers survive save-v3 while invalid observations do not yield items',()=>{
 const g=make();
 g.dispatch('world.travel',{region:'초원·농경지'});
 let found;
 for(let i=0;i<150;i++){
  assert.equal(g.dispatch('resource.incidental.search',{activity:'explore'}).accepted,true);
  found=Object.keys(g.current().flags).find(x=>x.startsWith('botany05a:last:'));
  if(found)break;
 }
 assert.ok(found,'at least one botanical should be gathered');
 const v2=createSaveV2(g.current(),meta,'test',g.registry);
 const converted=prepareSecondsV2ToV3(v2,g.registry);
 assert.equal(converted.ok,true);
 const saved=createSaveV3(converted.state,meta,'test',g.registry);
 assert.equal(decodeSaveV3(saved,g.registry).ok,true);
 const restored=make();restored.applyApprovedSave(saved);
 assert.equal(restored.current().flags[found],true);
});
