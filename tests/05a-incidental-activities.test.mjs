import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveIncidentalActivity05A,validateIncidentalTable05A} from '../src/incidental-resources-05a.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const pool={id:'test:incidental',spawnConditions:{regions:['숲']},regenerationPolicy:{kind:'none'},disappearancePolicy:'persist',tiers:[
 {id:'usual',weight:7,outputs:[{itemId:'item05a:blueberry',weight:1}]},
 {id:'unusual',weight:3,outputs:[{itemId:'item05a:marsh-bell-mushroom',weight:1,conditions:{seasons:['autumn']}}]}]};
const makeTable=(rewardMode='item')=>({region:'숲',activity:'explore',triggerChance:1,rewardMode,pool});
const options=(table)=>({worldSeed:'side-finds',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,
 preferences:{getItem:()=>null,setItem:()=>{}},incidentalTables05A:{'숲:explore':table}});
const make=(table)=>createMainV2Inventory([{id:'test:initial',name:'기본',group:'재료',qty:1,tags:[]}],options(table));
const slot={slotId:'find-test',worldId:'world',kind:'manual',label:'test',savedAt:'2026-10-24T00:00:00Z',revision:0};
test('incidental conditions, discovery and no-result are independent',()=>{
 const table=makeTable();
 assert.equal(validateIncidentalTable05A(table),true);
 assert.equal(resolveIncidentalActivity05A(table,{region:'숲',activity:'explore',season:'spring',daypart:'day',weather:'clear'},
 {trigger:0.2,tier:0.9,output:0.2}).itemId,'item05a:blueberry');
 assert.equal(resolveIncidentalActivity05A({...table,triggerChance:0}, {region:'숲',activity:'explore',season:'spring'}, {trigger:0,tier:0,output:0}).found,false);
 assert.equal(resolveIncidentalActivity05A(table,{region:'설원',activity:'explore'}, {trigger:0,tier:0,output:0}).ok,false);
});
test('authoritative incidental search grants known item and saves RNG and clock',()=>{
 const table=makeTable(),g=make(table);
 assert.equal(g.dispatch('world.travel',{region:'숲'}).accepted,true);
 const before=g.current();
 const r=g.dispatch('resource.incidental.search',{activity:'explore'});
 assert.equal(r.accepted,true,JSON.stringify(r));
 const after=g.current();
 assert.equal(after.clock.elapsedUnits-before.clock.elapsedUnits,600);
 assert.equal(after.itemWorld.items.find(x=>x.definitionId==='item05a:blueberry')?.quantity,1);
 assert.notDeepEqual(before.rng,after.rng);
 const v2=createSaveV2(after,slot,'test',g.registry),p=prepareSecondsV2ToV3(v2,g.registry);
 assert.equal(p.ok,true);
 const save=createSaveV3(p.state,slot,'test',g.registry),decoded=decodeSaveV3(save,g.registry);
 assert.equal(decoded.ok,true);
 const restored=make(table);restored.applyApprovedSave(save);
 assert.deepEqual(restored.current().itemWorld,after.itemWorld);
 assert.deepEqual(restored.current().rng,after.rng);
});
test('discover-site marks a finite hidden source, never mints item',()=>{
 const table=makeTable('discover-site'),g=make(table);
 g.dispatch('world.travel',{region:'숲'});
 const before=g.current();
 const r=g.dispatch('resource.incidental.search',{activity:'explore'});
 assert.equal(r.accepted,true,JSON.stringify(r));
 const after=g.current();
 assert.equal(after.itemWorld.items.length,before.itemWorld.items.length);
 const ids=Object.keys(after.world.runtime.resource05A.candidateSites).filter(k=>k.startsWith('site05a:blueberry:숲'));
 assert.equal(ids.length,1);
 assert.equal(after.world.runtime.resource05A.candidateSites[ids[0]].discovered,true);
 const again=g.dispatch('resource.incidental.search',{activity:'explore'});
 assert.equal(again.accepted,true);
 assert.equal(g.current().itemWorld.items.length,before.itemWorld.items.length);
});
test('rejects undeclared activity and unknown output before action',()=>{
 const g=make(makeTable());
 assert.equal(g.dispatch('resource.incidental.search',{activity:'sail'}).accepted,false);
 assert.throws(()=>make({...makeTable(),pool:{...pool,tiers:[{id:'bad',weight:1,outputs:[{itemId:'test:unknown',weight:1}]}]}}),/INVALID_INCIDENTAL_CONFIG/);
});
test('game-time budget is stable for repeated commands (no free reroll)',()=>{
 const g=make({...makeTable(),triggerChance:0});
 g.dispatch('world.travel',{region:'숲'});
 const before=g.current().clock.elapsedUnits;
 for(let i=0;i<10;i++)assert.equal(g.dispatch('resource.incidental.search',{activity:'explore'}).accepted,true);
 assert.equal(g.current().clock.elapsedUnits-before,6000);
});

test('existing region activity side reward only occurs on eligible elapsed-time boundaries',()=>{
 const ruinsPool={...pool,spawnConditions:{regions:['고대 유적']}};
 const table={region:'고대 유적',activity:'investigate',triggerChance:1,rewardMode:'item',pool:ruinsPool};
 const optionsRuins={...options(makeTable()),incidentalTables05A:{'고대 유적:investigate':table}};
 const g=createMainV2Inventory([{id:'test:initial',name:'기본',group:'재료',qty:1,tags:[]}],optionsRuins);
 assert.equal(g.dispatch('world.travel',{region:'고대 유적'}).accepted,true);
 const start=g.current().clock.elapsedUnits;
 let rewards=0;
 for(let i=0;i<120;i++){
  const previous=g.current();
  const result=g.dispatch('region.activity',{activityId:'core:activity/ancient-ruins'});
  assert.equal(result.accepted,true,JSON.stringify(result));
  const after=g.current();
  const prior=previous.itemWorld.items.find(x=>x.definitionId==='item05a:blueberry')?.quantity??0;
  const current=after.itemWorld.items.find(x=>x.definitionId==='item05a:blueberry')?.quantity??0;
  assert.ok(current-prior===0||current-prior===1);
  rewards+=current-prior;
  assert.ok(rewards<=Math.floor((after.clock.elapsedUnits-start)/600)+1);
 }
 assert.ok(rewards>0);
});
test('short work actions do not award extra discovery rolls per click',()=>{
 const table={...makeTable(),activity:'fishing',region:'강·호수',pool:{...pool,spawnConditions:{regions:['강·호수']}}};
 const g=createMainV2Inventory([{id:'test:initial',name:'기본',group:'재료',qty:1,tags:[]}],
  {...options(makeTable()),incidentalTables05A:{'강·호수:fishing':table}});
 assert.equal(g.dispatch('world.travel',{region:'숲'}).accepted,true);
 assert.equal(g.dispatch('world.travel',{region:'강·호수'}).accepted,true);
 const site='resource05a:small-fish:01';
 const start=g.current().clock.elapsedUnits;
 let found=0;
 for(let i=0;i<45;i++){
  const before=g.current();
  const result=g.dispatch('resource.work',{nodeId:site});
  assert.equal(result.accepted,true,JSON.stringify(result));
  const after=g.current();
  const prev=before.itemWorld.items.find(x=>x.id==='incidental05a:item05a:blueberry')?.quantity??0;
  const qty=after.itemWorld.items.find(x=>x.id==='incidental05a:item05a:blueberry')?.quantity??0;
  found+=qty-prev;
  assert.ok(found<=Math.floor((after.clock.elapsedUnits-start)/600)+1);
 }
 assert.ok(found>0);
});

test('a seasonal/weather-gated incidental result cannot be obtained without authoritative weather',()=>{
 const weatherPool={...pool,tiers:[{id:'rain-only',weight:1,outputs:[{itemId:'item05a:blueberry',weight:1,conditions:{weather:['rain']}}]}]};
 const table={...makeTable(),pool:weatherPool};
 const g=make(table);
 assert.equal(g.dispatch('world.travel',{region:'숲'}).accepted,true);
 const result=g.dispatch('resource.incidental.search',{activity:'explore'});
 assert.equal(result.accepted,true,JSON.stringify(result));
 assert.equal(g.current().itemWorld.items.some(x=>x.id==='incidental05a:item05a:blueberry'),false);
});
test('no incidental config preserves the legacy inventory and actions',()=>{
 const g=createMainV2Inventory([{id:'test:initial',name:'기본',group:'재료',qty:1,tags:[]}],
  {...options(makeTable()),incidentalTables05A:{}});
 g.dispatch('world.travel',{region:'숲'});
 const before=g.current().itemWorld;
 for(let i=0;i<4;i++)assert.equal(g.dispatch('resource.work',{nodeId:'resource05a:wild-herb:01'}).accepted,true);
 assert.equal(g.current().itemWorld.items.some(x=>x.id?.startsWith('incidental05a:')),false);
 assert.ok(g.current().itemWorld.items.length>=before.items.length);
});
