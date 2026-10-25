import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {ACTIVITY_TABLES_05A} from '../src/activity-tables-05a.js';
import {REFINING_RECIPES_05H,refineMineral05H} from '../src/mineral-refining-05h.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const make=()=>createMainV2Inventory([{id:'test:starter',name:'기본',group:'재료',qty:1,tags:[]}],{
 worldSeed:'refining-05h',generatedWorld:true,worldPersistence03E:true,progression04A:true,
 resources05A:true,ecology05A:true,fungi05B:true,woodland05C:true,minerals05E:true,
 incidentalTables05A:ACTIVITY_TABLES_05A,preferences:{getItem:()=>null,setItem:()=>{}}
});
const meta={slotId:'refining-test',worldId:'world',kind:'manual',label:'refining',savedAt:'2026-10-25T00:00:00Z',revision:0};
test('refining recipe definitions have unique input/output and bounded costs',()=>{
 assert.equal(REFINING_RECIPES_05H.length,12);
 assert.equal(new Set(REFINING_RECIPES_05H.map(r=>r.id)).size,12);
 for(const r of REFINING_RECIPES_05H)assert.ok((r.inputs?.every(x=>x.quantity>0)??r.inputQty>0)&&r.outputQty>0&&r.seconds>0);
});
test('insufficient material and invalid recipe fail without state mutation',()=>{
 const g=make(),before=g.current();
 assert.equal(g.dispatch('mineral.refine',{recipeId:'refine05h:copper'}).accepted,false);
 assert.deepEqual(g.current(),before);
 assert.equal(g.dispatch('mineral.refine',{recipeId:'invalid'}).accepted,false);
 assert.deepEqual(g.current(),before);
});
test('owned ore is consumed once, yields refined item and survives save-v3 roundtrip',()=>{
 const g=make();
 assert.equal(g.dispatch('world.travel',{region:'광산'}).accepted,true);
 const p=g.dispatch('mineral.prospect',{itemId:'item05a:stone'});
 assert.equal(p.accepted,true);
 const siteId=p.events.find(x=>x.type==='mineral.discovered').payload.siteId;
 let attempts=0;
 while((g.current().itemWorld.items.find(x=>x.definitionId==='item05a:stone')?.quantity??0)<2&&attempts<16){
  const r=g.dispatch('mineral.extract',{siteId});
  assert.equal(r.accepted,true,JSON.stringify(r));
  attempts++;
 }
 const quantityBefore=g.current().itemWorld.items.find(x=>x.definitionId==='item05a:stone')?.quantity??0;
 assert.ok(quantityBefore>=2,'seeded extraction must yield sufficient ore before refining');
 const beforeNotVillage=g.current();
 assert.equal(g.dispatch('mineral.refine',{recipeId:'refine05h:stone'}).accepted,false);
 assert.deepEqual(g.current(),beforeNotVillage);
 assert.equal(g.dispatch('world.travel',{region:'거점 마을'}).accepted,true);
 const before=g.current();
 const processed=g.dispatch('mineral.refine',{recipeId:'refine05h:stone'});
 assert.equal(processed.accepted,true,JSON.stringify(processed));
 const items=g.current().itemWorld.items;
 assert.equal(items.find(x=>x.definitionId==='item05h:cut-stone').quantity,1);
 assert.equal(items.find(x=>x.definitionId==='item05a:stone')?.quantity??0,quantityBefore-2);
 assert.equal(g.current().clock.elapsedUnits-before.clock.elapsedUnits,300);
 const v2=createSaveV2(g.current(),meta,'test',g.registry);
 const prepared=prepareSecondsV2ToV3(v2,g.registry);assert.equal(prepared.ok,true);
 const saved=createSaveV3(prepared.state,meta,'test',g.registry);
 const decoded=decodeSaveV3(JSON.parse(JSON.stringify(saved)),g.registry);assert.equal(decoded.ok,true);
 const restored=make();restored.applyApprovedSave(decoded.save);
 assert.deepEqual(restored.current(),g.current());
});

test('bronze alloy requires both inputs and town facilities, cannot partially consume',()=>{
 const g=make();
 const input={
  items:[{id:'a',definitionId:'item05h:copper-ingot',quantity:2},
   {id:'b',definitionId:'item05h:tin-ingot',quantity:1}],
  placements:[{itemId:'a',location:{kind:'inventory',ownerId:'player'}},
   {itemId:'b',location:{kind:'inventory',ownerId:'player'}}],
  containers:[]
 };
 const before=JSON.stringify(input);
 const made=refineMineral05H(input,'player','refine05h:bronze');
 assert.equal(made.ok,true);
 assert.equal(JSON.stringify(input),before);
 assert.equal(made.itemWorld.items.find(i=>i.definitionId==='item05h:bronze-ingot').quantity,2);
 assert.equal(made.itemWorld.items.filter(i=>i.definitionId==='item05h:tin-ingot').length,0);
 const insufficient=structuredClone(input);insufficient.items[1].quantity=0;
 assert.equal(refineMineral05H(insufficient,'player','refine05h:bronze').reason,'INSUFFICIENT_MATERIAL');
 assert.equal(JSON.stringify(input),before);
});

test('refined copper, iron and bronze produce owned tools without double spending',()=>{
 for(const material of ['copper','iron','bronze']){
  for(const type of ['pickaxe','axe']){
   const ingotId='item05h:'+material+'-ingot';
   const world={items:[
    {id:'metal',definitionId:ingotId,quantity:2},
    {id:'stone',definitionId:'item05h:cut-stone',quantity:1}
   ],placements:[
    {itemId:'metal',location:{kind:'inventory',ownerId:'p'}},
    {itemId:'stone',location:{kind:'inventory',ownerId:'p'}}
   ],containers:[]};
   const before=JSON.stringify(world);
   const crafted=refineMineral05H(world,'p','craft05i:'+material+'-'+type);
   assert.equal(crafted.ok,true,material+' '+type);
   assert.equal(JSON.stringify(world),before);
   assert.equal(crafted.itemWorld.items.length,1);
   assert.equal(crafted.itemWorld.items[0].definitionId,'tool05a:'+type+':'+material);
   assert.equal(crafted.itemWorld.items[0].quantity,1);
   assert.equal(crafted.itemWorld.placements.length,1);
   assert.equal(refineMineral05H(world,'intruder','craft05i:'+material+'-'+type).reason,'INSUFFICIENT_MATERIAL');
   const short=structuredClone(world);short.items[1].quantity=0;
   assert.equal(refineMineral05H(short,'p','craft05i:'+material+'-'+type).reason,'INSUFFICIENT_MATERIAL');
  }
 }
});

test('starter mining extracts real stone, refines it, and preserves v3 state',()=>{
 const game=make();
 const owned=id=>game.current().itemWorld.items.filter(x=>x.definitionId===id).reduce((n,x)=>n+x.quantity,0);
 assert.equal(game.dispatch('world.travel',{region:'광산'}).accepted,true);
 const stone=game.dispatch('mineral.prospect',{itemId:'item05a:stone'});
 assert.equal(stone.accepted,true,JSON.stringify(stone));
 const siteId=stone.events.find(e=>e.type==='mineral.discovered')?.payload.siteId;
 for(let i=0;owned('item05a:stone')<2&&i<16;i++){
  const result=game.dispatch('mineral.extract',{siteId});
  assert.equal(result.accepted,true,JSON.stringify(result));
 }
 assert.ok(owned('item05a:stone')>=2);
 const copper=game.dispatch('mineral.prospect',{itemId:'item05a:copper-ore'});
 assert.equal(copper.accepted,true);
 const copperSite=copper.events.find(e=>e.type==='mineral.discovered').payload.siteId;
 const beforeBlocked=game.current();
 const denied=game.dispatch('mineral.extract',{siteId:copperSite});
 assert.equal(denied.accepted,false,'starter rank 1 must not mine rank 2 copper');
 assert.deepEqual(game.current(),beforeBlocked,'tool gate must be atomic');
 assert.equal(game.dispatch('world.travel',{region:'거점 마을'}).accepted,true);
 const before=owned('item05a:stone');
 assert.equal(game.dispatch('mineral.refine',{recipeId:'refine05h:stone'}).accepted,true);
 assert.equal(owned('item05a:stone'),before-2);
 assert.equal(owned('item05h:cut-stone'),1);
 const snapshot=game.current();
 assert.equal(game.dispatch('mineral.refine',{recipeId:'craft05i:copper-pickaxe'}).accepted,false);
 assert.deepEqual(game.current(),snapshot);
 const converted=prepareSecondsV2ToV3(createSaveV2(game.current(),meta,'test',game.registry),game.registry);
 assert.equal(converted.ok,true);
 const saved=createSaveV3(converted.state,meta,'test',game.registry);
 const restored=make();restored.applyApprovedSave(saved);
 assert.deepEqual(restored.current(),game.current());
});
