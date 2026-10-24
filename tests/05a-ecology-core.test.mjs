import {ecologyClimate05A} from '../src/ecology-climate-05a.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createEcologySite,ecologyInteract,ecologyReconcile,ecologyAdvance,validateEcologyDefinition} from '../src/ecology-core-05a.js';
import {createBotanicalEcology05A,BOTANICAL_ECOLOGY_DEFS_05A,BOTANICAL_ECOLOGY_MAP_05A} from '../src/botanical-ecology-adapter-05a.js';
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
