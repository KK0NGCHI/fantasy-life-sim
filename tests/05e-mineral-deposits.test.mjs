import {test} from 'node:test';
import {REAL_ATLAS_05E,EXOTIC_ATLAS_05E,ALTERED_TRAITS_05E,SPECIAL_FORMATIONS_05E} from '../src/mineral-atlas-05e.js';
import assert from 'node:assert/strict';
import {createMineralDeposits05E,validateMineralDeposits05E,prospectMineral05E,mineMineral05E,consumeLegacyMineral05E,MINERAL_DEFINITIONS_05E} from '../src/mineral-deposits-05e.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {ACTIVITY_TABLES_05A} from '../src/activity-tables-05a.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const make=()=>createMainV2Inventory([{id:'test:starter',name:'기본',group:'재료',qty:1,tags:[]}],{
 worldSeed:'minerals-05e',generatedWorld:true,worldPersistence03E:true,progression04A:true,
 resources05A:true,ecology05A:true,fungi05B:true,woodland05C:true,minerals05E:true,
 incidentalTables05A:ACTIVITY_TABLES_05A,preferences:{getItem:()=>null,setItem:()=>{}}
});
const meta={slotId:'mineral-test',worldId:'world',kind:'manual',label:'test',savedAt:'2026-10-25T00:00:00Z',revision:0};
test('five base mineral definitions create bounded never-regenerating deposits',()=>{
 const sites=createMineralDeposits05E();
 assert.equal(MINERAL_DEFINITIONS_05E.length,107);
 assert.equal(validateMineralDeposits05E(sites),true);
 const d=prospectMineral05E(sites,'광산','item05a:iron-ore');
 assert.equal(d.ok,true);
 let current=d.deposits,count=0;
 for(let i=0;i<7;i++){
  const m=mineMineral05E(current,'광산',d.siteId,{toolPower:3,roll:0});
  assert.equal(m.ok,true);
  current=m.deposits;count+=m.outputs.length;
 }
 assert.equal(count,7);
 assert.equal(current[d.siteId].remaining,0);
 assert.equal(mineMineral05E(current,'광산',d.siteId,{toolPower:3}).reason,'DEPOSIT_EXHAUSTED');
 assert.equal(prospectMineral05E(current,'광산','item05a:iron-ore').reason,'DEPOSIT_EXHAUSTED');
});
test('wrong habitat, missing discovery and insufficient tool cannot extract',()=>{
 const sites=createMineralDeposits05E();
 assert.equal(prospectMineral05E(sites,'숲','item05a:coal').reason,'NO_LOCAL_DEPOSIT');
 const id=Object.keys(sites).find(x=>sites[x].itemId==='item05a:iron-ore');
 assert.equal(mineMineral05E(sites,'광산',id).reason,'DEPOSIT_NOT_KNOWN');
 const found=prospectMineral05E(sites,'광산','item05a:iron-ore');
 assert.equal(mineMineral05E(found.deposits,'광산',found.siteId,{toolPower:1}).reason,'TOOL_TOO_WEAK');
});
test('real mineral prospect, extraction, finite inventory and save roundtrip',()=>{
 const g=make();assert.equal(g.dispatch('world.travel',{region:'광산'}).accepted,true);
 const p=g.dispatch('mineral.prospect',{itemId:'item05a:stone'});
 assert.equal(p.accepted,true,JSON.stringify(p));
 const id=p.events.find(x=>x.type==='mineral.discovered').payload.siteId;
 const pre=g.current().clock.elapsedUnits;
 const m=g.dispatch('mineral.extract',{siteId:id,toolPower:999});
 assert.equal(m.accepted,true,JSON.stringify(m));
 assert.equal(g.current().clock.elapsedUnits-pre,180);
 assert.equal(g.current().world.runtime.resource05A.mineralDeposits05E[id].remaining,15);
 const v2=createSaveV2(g.current(),meta,'test',g.registry);
 const converted=prepareSecondsV2ToV3(v2,g.registry);assert.equal(converted.ok,true);
 const saved=createSaveV3(converted.state,meta,'test',g.registry);
 assert.equal(decodeSaveV3(saved,g.registry).ok,true);
 const restored=make();restored.applyApprovedSave(saved);
 assert.deepEqual(restored.current(),g.current());
});

test('forged tool power cannot bypass owned stone pickaxe hardness',()=>{
 const g=make();assert.equal(g.dispatch('world.travel',{region:'광산'}).accepted,true);
 const p=g.dispatch('mineral.prospect',{itemId:'item05a:iron-ore'});
 assert.equal(p.accepted,true);
 const id=p.events[0].payload.siteId;
 const original=g.current();
 const denied=g.dispatch('mineral.extract',{siteId:id,toolPower:999});
 assert.equal(denied.accepted,false);
 assert.deepEqual(g.current(),original);
});
test('legacy mineral and new deposit share stock without regrowth or double yields',()=>{
 let world=createMineralDeposits05E();
 const p=prospectMineral05E(world,'광산','item05a:stone');
 const mined=mineMineral05E(p.deposits,'광산',p.siteId,{toolPower:1,roll:0});
 assert.equal(mined.ok,true);
 const legacy=consumeLegacyMineral05E(mined.deposits,'광산','item05a:stone',3);
 assert.equal(legacy.ok,true);
 assert.equal(legacy.deposits[p.siteId].remaining,12);
 assert.equal(consumeLegacyMineral05E(legacy.deposits,'광산','item05a:stone',13).reason,'DEPOSIT_EXHAUSTED');
 assert.deepEqual(consumeLegacyMineral05E(legacy.deposits,'광산','item05a:wood',1).deposits,legacy.deposits);
});

test('actual legacy mining through dispatcher debits the same 05-E regional deposit',()=>{
 const g=make();assert.equal(g.dispatch('world.travel',{region:'광산'}).accepted,true);
 const deposits=g.current().world.runtime.resource05A.mineralDeposits05E;
 const id=Object.keys(deposits).find(id=>deposits[id].itemId==='item05a:stone'&&deposits[id].region==='광산');
 assert.ok(id);
 const before=deposits[id].remaining;
 const work=g.workUntil05A('resource05a:stone:01',50);
 assert.equal(work.accepted,true,JSON.stringify(work));
 assert.ok(work.qty>0);
 const updated=g.current().world.runtime.resource05A.mineralDeposits05E[id];
 assert.equal(updated.remaining,before-work.qty);
 assert.equal(updated.discovered,true);
 const later=g.dispatch('mineral.prospect',{itemId:'item05a:stone'});
 assert.equal(later.accepted,false,'legacy discovery already marks the shared deposit known');
});

test('eight new mineral definitions are finite and yield valid discovered ores',()=>{
 const additions=['tin-ore','silver-ore','gold-ore','limestone','clay','silica-sand','gypsum','sulfur'];
 let deposits=createMineralDeposits05E();
 for(const name of additions){
  const id='item05a:'+name;
  const def=MINERAL_DEFINITIONS_05E.find(x=>x.id===id);
  assert.ok(def,'mineral '+id+' registered');
  const found=prospectMineral05E(deposits,'광산',id);
  assert.equal(found.ok,true,id);
  const denied=mineMineral05E(found.deposits,'광산',found.siteId,{toolPower:def.hardness-1,roll:0});
  assert.equal(denied.reason,'TOOL_TOO_WEAK');
  const mined=mineMineral05E(found.deposits,'광산',found.siteId,{toolPower:def.hardness,roll:0});
  assert.equal(mined.ok,true,id);
  assert.equal(mined.outputs[0].itemId,id);
  assert.equal(mined.remaining,def.stock-1);
  deposits=mined.deposits;
 }
 assert.equal(validateMineralDeposits05E(deposits),true);
});

test('complete 05-E candidate atlas retains ontology and finite stock',()=>{
 assert.equal(REAL_ATLAS_05E.length,94);
 assert.equal(EXOTIC_ATLAS_05E.length,16);
 assert.equal(ALTERED_TRAITS_05E.length,6);
 assert.equal(SPECIAL_FORMATIONS_05E.length,4);
 assert.equal(new Set([...REAL_ATLAS_05E,...EXOTIC_ATLAS_05E].map(x=>x.id)).size,110);
 const defs=MINERAL_DEFINITIONS_05E.filter(x=>x.atlasCategory);
 assert.equal(defs.length,94);
 const all=createMineralDeposits05E();
 assert.equal(Object.keys(all).length,214);
 assert.equal(validateMineralDeposits05E(all),true);
 const mineral=REAL_ATLAS_05E[0], found=prospectMineral05E(all,'광산',mineral.id);
 assert.equal(found.ok,true);
 const extracted=mineMineral05E(found.deposits,'광산',found.siteId,{toolPower:1,roll:0});
 assert.equal(extracted.ok,true);
 assert.equal(extracted.outputs[0].itemId,mineral.id);
 assert.equal(extracted.remaining,3);
 assert.equal(validateMineralDeposits05E(extracted.deposits),true);
});


test('finite mineral worlds reject legacy quartz discovery, prospect and extraction without mutation',()=>{
 const g=make();
 assert.equal(g.dispatch('world.travel',{region:'광산'}).accepted,true);
 const before=g.current();
 const siteId='site05a:quartz:광산';
 for(const [action,payload] of [
  ['resource.candidate.discover',{nodeId:siteId}],
  ['resource.candidate.prospect',{}],
  ['resource.candidate.work',{nodeId:siteId}]
 ]){
  const result=g.dispatch(action,payload);
  assert.equal(result.accepted,false,action);
  assert.deepEqual(g.current(),before,action+' mutated game state');
 }
 const valid=g.dispatch('mineral.prospect',{itemId:'item05a:quartz'});
 assert.equal(valid.accepted,true,'official finite quartz exploration remains available');
});
