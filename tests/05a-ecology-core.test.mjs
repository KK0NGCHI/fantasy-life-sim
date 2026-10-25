import {ecologyClimate05A} from '../src/ecology-climate-05a.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createEcologySite,ecologyInteract,ecologyReconcile,ecologyAdvance,validateEcologyDefinition} from '../src/ecology-core-05a.js';
import {createBotanicalEcology05A,BOTANICAL_ECOLOGY_DEFS_05A,BOTANICAL_ECOLOGY_MAP_05A,BOTANICAL_SEED_ITEMS_05A} from '../src/botanical-ecology-adapter-05a.js';
import {ACTIVITY_TABLES_05A} from '../src/activity-tables-05a.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const base={id:'test:fungus',habitats:['숲'],capacity:2,regrowSeconds:3600,mode:'gather',outputs:[
 {id:'test:spores',part:'material',stage:'mature',weight:1},
 {id:'test:cap',part:'material',stage:'bloom',weight:1}]};
const ctx={region:'숲',season:'spring',mature:true,bloom:false};
test('generic ecology kernel works for a non-botanical species and depletion',()=>{
 assert.equal(validateEcologyDefinition(base),true);
 let site=createEcologySite(base,'숲');
 let a=ecologyInteract(site,base,ctx,{second:0,roll:0});
 assert.equal(a.outputs[0].itemId,'test:spores');site=a.site;
 a=ecologyInteract(site,base,ctx,{second:0,roll:0});site=a.site;
 assert.equal(site.remaining,0);
 assert.equal(ecologyInteract(site,base,ctx,{second:0,roll:0}).reason,'DEPLETED');
 assert.equal(ecologyReconcile(site,base,3600).remaining,1);
 assert.equal(ecologyReconcile(site,base,7200).remaining,2);
 assert.deepEqual(ecologyAdvance({[site.id]:site},new Map([[base.id,base]]),7200)[site.id],ecologyReconcile(site,base,7200));
});
test('ecological conditions fail closed without climate/elevation information',()=>{
 const d={...base,weather:['rain'],minElevation:700,maxDepth:0};
 const site=createEcologySite(d,'숲');
 assert.equal(ecologyInteract(site,d,ctx,{second:0}).reason,'WEATHER_REQUIRED');
 assert.equal(ecologyInteract(site,d,{...ctx,weather:'rain'},{second:0}).reason,'ELEVATION_REQUIRED');
 assert.equal(ecologyInteract(site,d,{...ctx,weather:'rain',elevation:800,depth:2},{second:0}).reason,'DEPTH_REQUIRED');
 assert.equal(ecologyInteract(site,d,{...ctx,weather:'rain',elevation:800,depth:0},{second:0}).ok,true);
});
test('botanical adapter generates all 80 species and bounded region patches',()=>{
 assert.equal(BOTANICAL_ECOLOGY_DEFS_05A.length,80);
 const sites=createBotanicalEcology05A();
 assert.ok(Object.keys(sites).length>=80);
 assert.equal(new Set(Object.keys(sites)).size,Object.keys(sites).length);
 assert.ok(Object.values(sites).every(s=>BOTANICAL_ECOLOGY_MAP_05A.has(s.speciesId)));
});
const options={worldSeed:'eco-80',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,ecology05A:true,
 preferences:{getItem:()=>null,setItem:()=>{}},incidentalTables05A:ACTIVITY_TABLES_05A};
const make=()=>createMainV2Inventory([{id:'test:starter',name:'기본',group:'재료',qty:1,tags:[]}],options);
const meta={slotId:'eco-80',worldId:'world',kind:'manual',label:'test',savedAt:'2026-10-25T00:00:00Z',revision:0};
test('real world patch depletes on incidental collection and survives save-v3',()=>{
 const g=make();assert.equal(g.dispatch('world.travel',{region:'초원·농경지'}).accepted,true);
 const before=g.current().world.runtime.resource05A.ecologySites;
 let changed;
 for(let i=0;i<500;i++){
  const r=g.dispatch('resource.incidental.search',{activity:'explore'});
  assert.equal(r.accepted,true,JSON.stringify(r));
  changed=Object.values(g.current().world.runtime.resource05A.ecologySites).find(s=>s.remaining<before[s.id].remaining);
  if(changed)break;
 }
 assert.ok(changed,'must deplete a real plant patch');
 const v2=createSaveV2(g.current(),meta,'test',g.registry);
 const upgraded=prepareSecondsV2ToV3(v2,g.registry);
 assert.equal(upgraded.ok,true,JSON.stringify(upgraded));
 const save=createSaveV3(upgraded.state,meta,'test',g.registry);
 assert.equal(decodeSaveV3(save,g.registry).ok,true);
 const restored=make();restored.applyApprovedSave(save);
 assert.deepEqual(restored.current().world.runtime.resource05A.ecologySites,g.current().world.runtime.resource05A.ecologySites);
});

test('provisional climate is deterministic across repeats and differs between region/day',()=>{
 const a=ecologyClimate05A('world-seed','사막',14*86400);
 assert.deepEqual(a,ecologyClimate05A('world-seed','사막',14*86400));
 assert.notDeepEqual(a,ecologyClimate05A('world-seed','설원',14*86400));
 assert.ok(['rain','snow','fog','clear'].includes(a.weather));
 const samples=Array.from({length:112},(_,day)=>ecologyClimate05A('world-seed','사막',day*86400).weather);
 assert.ok(samples.includes('rain'),'there must be some plausible seasonal desert rainfall');
});
test('common species can occupy multiple independent regional patches',()=>{
 const sites=createBotanicalEcology05A();
 const plant='item05a:plantago-major';
 const patches=Object.values(sites).filter(s=>s.region==='초원·농경지'&&s.speciesId===plant);
 assert.equal(patches.length,2);
 const def=BOTANICAL_ECOLOGY_MAP_05A.get(plant);
 const updated=ecologyInteract(patches[0],def,{region:'초원·농경지',season:'spring',mature:true,bloom:true},{second:0,roll:0});
 assert.equal(updated.ok,true);
 assert.equal(updated.site.remaining,patches[0].remaining-1);
 assert.equal(patches[1].remaining,def.capacity);
});
test('game-created ecological climate seed stays unchanged over approved-save roundtrip',()=>{
 const g=make();
 const initial=g.current().world.runtime.resource05A.ecologyClimateSeed;
 assert.ok(initial);
 const v2=createSaveV2(g.current(),meta,'test',g.registry);
 const converted=prepareSecondsV2ToV3(v2,g.registry);assert.equal(converted.ok,true);
 const save=createSaveV3(converted.state,meta,'test',g.registry);
 assert.equal(decodeSaveV3(save,g.registry).ok,true);
 const restored=make();restored.applyApprovedSave(save);
 assert.equal(restored.current().world.runtime.resource05A.ecologyClimateSeed,initial);
 assert.deepEqual(ecologyClimate05A(initial,'숲',86400),ecologyClimate05A(restored.current().world.runtime.resource05A.ecologyClimateSeed,'숲',86400));
});

test('discovered patch supports direct harvest, stock cap, rejection, and game time',()=>{
 const g=make();g.dispatch('world.travel',{region:'초원·농경지'});
 let selected;
 for(let i=0;i<500;i++){
  const r=g.dispatch('resource.incidental.search',{activity:'explore'});
  assert.equal(r.accepted,true);
  selected=Object.values(g.current().world.runtime.resource05A.ecologySites).find(x=>x.discovered&&x.remaining>0&&x.region==='초원·농경지');
  if(selected)break;
 }
 assert.ok(selected);
 const original=g.current(),before=original.itemWorld.items.reduce((v,x)=>v+(x.definitionId===selected.speciesId||x.definitionId===selected.speciesId+':seed'?x.quantity:0),0);
 const result=g.dispatch('botanical.patch.harvest',{siteId:selected.id});
 assert.equal(result.accepted,true,JSON.stringify(result));
 const now=g.current();
 assert.equal(now.clock.elapsedUnits-original.clock.elapsedUnits,60);
 const after=now.itemWorld.items.reduce((v,x)=>v+(x.definitionId===selected.speciesId||x.definitionId===selected.speciesId+':seed'?x.quantity:0),0);
 assert.equal(after,before+1);
 assert.equal(now.world.runtime.resource05A.ecologySites[selected.id].remaining,selected.remaining-1);
 const credited=result.events.find(e=>e.type==='botanical.patch_harvested').payload.itemId;
 assert.ok(now.itemWorld.items.some(i=>i.id==='ecology05a:'+credited&&i.definitionId===credited),
  'direct harvest stack ID must match its actual output, not the source species');
 const attempt=g.dispatch('botanical.patch.harvest',{siteId:'eco05a:unknown'});
 assert.equal(attempt.accepted,false);
});

test('seed outputs are distinct, valid species stage rewards registered in the inventory',()=>{
 const g=make();
 assert.ok(BOTANICAL_SEED_ITEMS_05A.length>40);
 for(const item of BOTANICAL_SEED_ITEMS_05A)assert.ok(g.registry.items.has(item.id));
 const d=BOTANICAL_ECOLOGY_MAP_05A.get('item05a:plantago-major');
 const site=createEcologySite(d,'초원·농경지');
 const seed=ecologyInteract(site,d,{region:'초원·농경지',season:'spring',mature:true,bloom:true},{second:0,roll:0.95});
 assert.equal(seed.outputs[0].itemId,'item05a:plantago-major:seed');
 assert.equal(seed.outputs[0].part,'seed');
 const immature=ecologyInteract(site,d,{region:'초원·농경지',season:'spring',mature:true,bloom:false},{second:0,roll:0.95});
 assert.equal(immature.outputs[0].itemId,'item05a:plantago-major');
});

test('ecological definitions reject invalid conditions, duplicate outputs and malformed weights',()=>{
 assert.equal(validateEcologyDefinition({...base,weather:['hail']}),false);
 assert.equal(validateEcologyDefinition({...base,seasons:['spring','spring']}),false);
 assert.equal(validateEcologyDefinition({...base,minElevation:Infinity}),false);
 assert.equal(validateEcologyDefinition({...base,outputs:[base.outputs[0],base.outputs[0]]}),false);
 assert.equal(validateEcologyDefinition({...base,outputs:[{...base.outputs[0],weight:0}]}),false);
});

test('discover-site incidental rewards reveal candidate nodes without harvesting ecological stock',()=>{
 const region='초원·농경지',activity='explore',key=region+':'+activity;
 const table={...ACTIVITY_TABLES_05A[key],triggerChance:1,rewardMode:'discover-site',
  pool:{...ACTIVITY_TABLES_05A[key].pool,tiers:[{id:'common',weight:1,outputs:[{itemId:'item05a:blueberry',weight:1}]}]}};
 const game=createMainV2Inventory([{id:'test:starter',name:'기본',group:'재료',qty:1,tags:[]}],
  {...options,incidentalTables05A:{[key]:table}});
 assert.equal(game.dispatch('world.travel',{region}).accepted,true);
 const before=game.current(),initial=before.world.runtime.resource05A;
 const r=game.dispatch('resource.incidental.search',{activity});
 assert.equal(r.accepted,true,JSON.stringify(r));
 assert.ok(r.events.some(e=>e.type==='resource.incidental_discovered'),JSON.stringify(r.events));
 const after=game.current(),current=after.world.runtime.resource05A;
 assert.deepEqual(current.ecologySites,initial.ecologySites,'discovery is not a biological harvest');
 assert.deepEqual(current.ecologySubstrates,initial.ecologySubstrates,'discovery cannot spend fungal substrates');
 assert.deepEqual(after.itemWorld,before.itemWorld,'discovery never grants an item');
});

test('incidental botanical awards cannot exceed actual patch stock consumption across save roundtrip',()=>{
 const region='초원·농경지',activity='explore',key=region+':'+activity,itemId='item05a:plantago-major';
 const template=ACTIVITY_TABLES_05A[key];
 const table={...template,triggerChance:1,rewardMode:'item',pool:{...template.pool,
  tiers:[{id:'common',weight:1,outputs:[{itemId,weight:1}]}]}};
 const makeFixed=()=>createMainV2Inventory([{id:'test:starter',name:'기본',group:'재료',qty:1,tags:[]}],
  {...options,incidentalTables05A:{[key]:table}});
 const g=makeFixed();assert.equal(g.dispatch('world.travel',{region}).accepted,true);
 let credited=0;
 for(let n=0;n<50;n++){
  const before=g.current(),oldSites=Object.values(before.world.runtime.resource05A.ecologySites)
   .filter(site=>site.speciesId===itemId&&site.region===region);
  const prior=before.itemWorld.items.filter(item=>item.definitionId===itemId).reduce((total,item)=>total+item.quantity,0);
  const r=g.dispatch('resource.incidental.search',{activity});
  assert.equal(r.accepted,true,JSON.stringify(r));
  const after=g.current(),nextSites=after.world.runtime.resource05A.ecologySites;
  const now=after.itemWorld.items.filter(item=>item.definitionId===itemId).reduce((total,item)=>total+item.quantity,0);
  const consumed=oldSites.reduce((total,site)=>total+Math.max(0,site.remaining-nextSites[site.id].remaining),0);
  assert.equal(now-prior,consumed,'item award must debit an actual matching ecological patch');
  assert.ok(now-prior===0||now-prior===1);
  credited+=now-prior;
 }
 assert.ok(credited>0,'deterministic test must exercise at least one successful acquisition');
 const v2=createSaveV2(g.current(),meta,'test',g.registry);
 const converted=prepareSecondsV2ToV3(v2,g.registry);assert.equal(converted.ok,true);
 const saved=createSaveV3(converted.state,meta,'test',g.registry);
 const restored=makeFixed();restored.applyApprovedSave(saved);
 assert.deepEqual(restored.current(),g.current(),'reward and stock ledgers survive reload together');
});
