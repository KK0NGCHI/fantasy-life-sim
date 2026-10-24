import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FUNGAL_SPECIES_05B,FUNGAL_ITEMS_05B,FUNGAL_ECOLOGY_MAP_05B,createFungalEcology05B,
 fungalFruiting05B,fungalReconcile05B,fungalHarvest05B} from '../src/fungal-ecology-05b.js';
import {ecologyClimate05A} from '../src/ecology-climate-05a.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {ACTIVITY_TABLES_05A} from '../src/activity-tables-05a.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';

const seed='fungal-test-world',minute=60,day=86400;
const make=()=>createMainV2Inventory([{id:'test:starter',name:'시작',group:'재료',qty:1,tags:[]}],{
 worldSeed:seed,generatedWorld:true,worldPersistence03E:true,progression04A:true,
 resources05A:true,ecology05A:true,fungi05B:true,incidentalTables05A:ACTIVITY_TABLES_05A,
 preferences:{getItem:()=>null,setItem:()=>{}}
});
const meta={slotId:'fungi-test',worldId:'world',kind:'manual',label:'test',savedAt:'2026-10-25T00:00:00Z',revision:0};
test('ten fungi have unique IDs, deterministic initial sites and substrate/guild data',()=>{
 assert.equal(FUNGAL_SPECIES_05B.length,10);
 assert.equal(new Set(FUNGAL_SPECIES_05B.map(x=>x.id)).size,10);
 const sites=createFungalEcology05B();
 assert.ok(Object.values(sites).length>=10);
 for(const s of FUNGAL_SPECIES_05B){
  assert.ok(s.substrate&&s.guild);
  assert.ok(FUNGAL_ECOLOGY_MAP_05B.has(s.id));
  assert.ok(FUNGAL_ITEMS_05B.some(x=>x.id===s.id));
 }
});
test('mycelia survive dry conditions, fruit only in matching rainy windows',()=>{
 const s=FUNGAL_SPECIES_05B.find(x=>x.key==='oyster');
 const dryDays=Array.from({length:112},(_,d)=>d).filter(d=>ecologyClimate05A(seed,'숲',d*day).weather==='clear');
 const wetDays=Array.from({length:112},(_,d)=>d).filter(d=>ecologyClimate05A(seed,'숲',d*day).weather==='rain');
 assert.ok(wetDays.length>0);
 const wet=wetDays.find(d=>s.seasons.includes(['spring','summer','autumn','winter'][Math.floor(d/28)]));
 assert.ok(wet!==undefined);
 assert.equal(fungalFruiting05B(s,'숲',wet*day,seed,s.substrate).fruiting,true);
 assert.equal(fungalFruiting05B(s,'숲',wet*day,seed,'sand').reason,'WRONG_SUBSTRATE');
 const outside=88*day;
 assert.equal(fungalFruiting05B(s,'숲',outside,seed,s.substrate).present,true);
 assert.equal(fungalFruiting05B(s,'숲',outside,seed,s.substrate).fruiting,false);
 assert.ok(dryDays.length>0);
});
test('fungal mycelium stores fractional wet credit until regrowth and caps stock',()=>{
 const sp=FUNGAL_SPECIES_05B.find(x=>x.key==='oyster'),def=FUNGAL_ECOLOGY_MAP_05B.get(sp.id);
 const site=Object.values(createFungalEcology05B()).find(x=>x.speciesId===sp.id&&x.region==='숲');
 const used={...site,remaining:0};
 const one=fungalReconcile05B(used,def,day*12,seed);
 const two=fungalReconcile05B(one,def,day*24,seed);
 const whole=fungalReconcile05B(used,def,day*24,seed);
 assert.equal(two.remaining,whole.remaining);
 assert.equal(two.wetCredit,whole.wetCredit);
 assert.ok(two.remaining<=def.capacity);
 assert.equal(fungalReconcile05B(two,def,day*24,seed).remaining,two.remaining);
});
test('wet-window harvest depletes a fruiting patch but retains underlying mycelium',()=>{
 const sp=FUNGAL_SPECIES_05B.find(x=>x.key==='oyster'),def=FUNGAL_ECOLOGY_MAP_05B.get(sp.id);
 const patch=Object.values(createFungalEcology05B()).find(x=>x.speciesId===sp.id&&x.region==='숲');
 const wet=Array.from({length:28},(_,d)=>d).find(d=>ecologyClimate05A(seed,'숲',d*day).weather==='rain');
 assert.ok(wet!==undefined);
 const result=fungalHarvest05B(patch,def,wet*day,seed,0);
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.site.remaining,patch.remaining-1);
 assert.equal(result.site.speciesId,sp.id);
 assert.equal(result.outputs[0].itemId,sp.id);
});
test('fungal sites and their rain progress survive save-v3 roundtrip',()=>{
 const g=make();
 const state=g.current(),sites=state.world.runtime.resource05A.ecologySites;
 const key=Object.keys(sites).find(x=>sites[x].speciesId==='item05b:oyster');
 assert.ok(key);
 assert.equal(sites[key].wetCredit,0);
 assert.ok(g.registry.items.has('item05b:oyster'));
 const v2=createSaveV2(state,meta,'test',g.registry);
 const converted=prepareSecondsV2ToV3(v2,g.registry);assert.equal(converted.ok,true);
 const save=createSaveV3(converted.state,meta,'test',g.registry);
 assert.equal(decodeSaveV3(save,g.registry).ok,true);
 const g2=make();g2.applyApprovedSave(save);
 assert.deepEqual(g2.current().world.runtime.resource05A.ecologySites,sites);
});

test('fungal fruit bodies progress fresh to mature, aging, then decomposed while mycelium persists',()=>{
 const sp=FUNGAL_SPECIES_05B.find(x=>x.key==='oyster');
 const days=Array.from({length:112},(_,d)=>d);
 const suitable=days.find(d=>d<108&&sp.seasons.includes(['spring','summer','autumn','winter'][Math.floor(d/28)])&&
  ecologyClimate05A(seed,'숲',d*day).weather==='rain'&&
  [1,2,3].every(k=>ecologyClimate05A(seed,'숲',(d+k)*day).weather!=='rain'));
 assert.ok(suitable!==undefined,'fixture requires an isolated rainy day');
 const stages=[0,1,2,3].map(n=>fungalFruiting05B(sp,'숲',(suitable+n)*day,seed,sp.substrate));
 assert.deepEqual(stages.map(x=>x.stage),['fresh','mature','aging','decomposed']);
 assert.deepEqual(stages.map(x=>x.fruiting),[true,true,false,false]);
 assert.ok(stages.every(x=>x.present));
 const def=FUNGAL_ECOLOGY_MAP_05B.get(sp.id);
 const patch=Object.values(createFungalEcology05B()).find(x=>x.speciesId===sp.id&&x.region==='숲');
 assert.equal(fungalHarvest05B(patch,def,(suitable+2)*day,seed,0).reason,'AGING');
});

test('finite substrate reserves persist and eventually prevent new fruit body harvests',()=>{
 const sp=FUNGAL_SPECIES_05B.find(x=>x.key==='oyster'),def=FUNGAL_ECOLOGY_MAP_05B.get(sp.id);
 const sites=createFungalEcology05B();
 const patch=Object.values(sites).find(x=>x.speciesId===sp.id&&x.region==='숲');
 assert.equal(patch.substrate,sp.substrate);
 assert.equal(patch.substrateHealth,100);
 const wet=Array.from({length:28},(_,d)=>d).find(d=>ecologyClimate05A(seed,'숲',d*day).weather==='rain');
 const done=fungalHarvest05B(patch,def,wet*day,seed,0);
 assert.equal(done.ok,true);
 assert.equal(done.site.substrateHealth,95);
 const exhausted={...patch,substrateHealth:4};
 assert.equal(fungalHarvest05B(exhausted,def,wet*day,seed).reason,'SUBSTRATE_EXHAUSTED');
 assert.equal(fungalHarvest05B({...patch,substrate:'sand'},def,wet*day,seed).reason,'WRONG_SUBSTRATE');
});
