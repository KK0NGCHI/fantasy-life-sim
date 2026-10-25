import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REAL_ATLAS_05E} from '../src/mineral-atlas-05e.js';
import {createMineralDeposits05E,prospectMineral05E,validateMineralDeposits05E} from '../src/mineral-deposits-05e.js';
import {extractAssemblage05G} from '../src/mineral-extraction-05g.js';
import {geologyProfile05F} from '../src/mineral-geology-05f.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {ACTIVITY_TABLES_05A} from '../src/activity-tables-05a.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const ids=(english)=>english.map(name=>{const x=REAL_ATLAS_05E.find(x=>x.en===name);assert.ok(x,name);return x.id});
const make=()=>createMainV2Inventory([{id:'test:starter',name:'기본',group:'재료',qty:1,tags:[]}],{
 worldSeed:'atomic-05g',generatedWorld:true,worldPersistence03E:true,progression04A:true,
 resources05A:true,ecology05A:true,fungi05B:true,woodland05C:true,minerals05E:true,
 incidentalTables05A:ACTIVITY_TABLES_05A,preferences:{getItem:()=>null,setItem:()=>{}}
});
const meta={slotId:'atomic-test',worldId:'world',kind:'manual',label:'atomic',savedAt:'2026-10-25T00:00:00Z',revision:0};
test('hydrothermal pilot consumes actual stocks atomically, never creates a second pool',()=>{
 let world=createMineralDeposits05E(),sites=[];
 for(const id of ids(['chalcopyrite','pyrite','sphalerite'])){
  const discovered=prospectMineral05E(world,'광산',id);assert.equal(discovered.ok,true);world=discovered.deposits;sites.push(discovered.siteId);
 }
 const before=JSON.stringify(world),r=extractAssemblage05G(world,'광산',sites,{toolPower:1,roll:0});
 assert.equal(r.ok,true);assert.equal(r.outputs.length,3);assert.equal(r.consumed,3);
 assert.equal(JSON.stringify(world),before);
 assert.ok(sites.every(id=>r.deposits[id].remaining===world[id].remaining-1));
 assert.equal(validateMineralDeposits05E(r.deposits),true);
 const depleted=structuredClone(world);depleted[sites[1]].remaining=0;
 assert.equal(extractAssemblage05G(depleted,'광산',sites,{toolPower:1,roll:0}).reason,'DEPOSIT_EXHAUSTED');
});
test('same generic extraction applies to distinct formation families and rejects mixed families',()=>{
 const families=[['hematite','limestone'],['gypsum','halite'],['granite','magnetite'],['basalt','pumice'],['slate','marble']];
 for(const pair of families){
  const actual=ids(pair),settings=actual.map(id=>geologyProfile05F(id).settingId);
  if(settings[0]!==settings[1])continue;
  let world=createMineralDeposits05E(),sites=[];
  for(const id of actual){const x=prospectMineral05E(world,'광산',id);assert.equal(x.ok,true);world=x.deposits;sites.push(x.siteId);}
  const result=extractAssemblage05G(world,'광산',sites,{toolPower:1,roll:0});
  assert.equal(result.ok,true,pair.join(','));
 }
 const [ore,rock]=ids(['chalcopyrite','limestone']);
 let world=createMineralDeposits05E(),siteIds=[];
 for(const id of [ore,rock]){const x=prospectMineral05E(world,'광산',id);world=x.deposits;siteIds.push(x.siteId);}
 assert.equal(extractAssemblage05G(world,'광산',siteIds,{toolPower:1,roll:0}).reason,'INCOMPATIBLE_ASSEMBLAGE');
 assert.equal(extractAssemblage05G(world,'광산',[siteIds[0],siteIds[0]],{toolPower:1,roll:0}).reason,'INVALID_SITE_SELECTION');
});
test('dispatcher multi-ore mining, save-v3 roundtrip, and rejection leave state intact',()=>{
 const g=make();assert.equal(g.dispatch('world.travel',{region:'광산'}).accepted,true);
 const sites=[];
 for(const itemId of ids(['chalcopyrite','pyrite'])){
  const discovery=g.dispatch('mineral.prospect',{itemId});assert.equal(discovery.accepted,true,JSON.stringify(discovery));
  sites.push(discovery.events.find(x=>x.type==='mineral.discovered').payload.siteId);
 }
 const pre=g.current();
 const bad=g.dispatch('mineral.assemblage.extract',{siteIds:[sites[0],sites[0]]});
 assert.equal(bad.accepted,false);assert.deepEqual(g.current(),pre);
 const success=g.dispatch('mineral.assemblage.extract',{siteIds:sites});
 assert.equal(success.accepted,true,JSON.stringify(success));
 assert.ok(sites.every(id=>g.current().world.runtime.resource05A.mineralDeposits05E[id].remaining===3));
 const v2=createSaveV2(g.current(),meta,'test',g.registry),prepared=prepareSecondsV2ToV3(v2,g.registry);
 assert.equal(prepared.ok,true);
 const saved=createSaveV3(prepared.state,meta,'test',g.registry);
 const decoded=decodeSaveV3(JSON.parse(JSON.stringify(saved)),g.registry);assert.equal(decoded.ok,true);
 const restored=make();restored.applyApprovedSave(decoded.save);assert.deepEqual(restored.current(),g.current());
});
