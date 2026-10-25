import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';

const game=()=>createMainV2Inventory([{id:'starter:test',name:'기본',group:'재료',qty:1,tags:[]}],{
 worldSeed:'bridge-progression-test',generatedWorld:true,worldPersistence03E:true,progression04A:true,
 resources05A:true,ecology05A:true,fungi05B:true,woodland05C:true,minerals05E:true,
 preferences:{getItem:()=>null,setItem:()=>{}}
});
const meta={slotId:'bridge',worldId:'world',kind:'manual',label:'bridge',savedAt:'2026-10-26T00:00:00Z',revision:0};
function owned(g,id){return g.current().itemWorld.items.filter(item=>item.definitionId===id).reduce((n,item)=>n+item.quantity,0)}
function command(g,type,payload){
 const r=g.dispatch(type,payload);assert.equal(r.accepted,true,JSON.stringify({type,payload,r}));return r;
}
function mine(g,id,needed){
 for(const region of ['광산','산맥']){
  if(owned(g,id)>=needed)break;
  if(g.current().world.runtime.region!==region)command(g,'world.travel',{region});
  const p=command(g,'mineral.prospect',{itemId:id});
  const siteId=p.events.find(e=>e.type==='mineral.discovered').payload.siteId;
  for(let n=0;n<24&&owned(g,id)<needed;n++){
   const before=g.current().world.runtime.resource05A.mineralDeposits05E[siteId].remaining;
   if(!before)break;
   command(g,'mineral.extract',{siteId});
  }
 }
 assert.ok(owned(g,id)>=needed,'insufficient finite mineral output: '+id+' '+owned(g,id));
}
test('stone/clay -> provisional rank 2 -> bronze -> rank 3 -> iron, all through live dispatch and v3 save',()=>{
 const g=game();
 command(g,'world.travel',{region:'광산'});
 const copper=command(g,'mineral.prospect',{itemId:'item05a:copper-ore'});
 const copperSite=copper.events.find(e=>e.type==='mineral.discovered').payload.siteId;
 const snapshot=g.current();
 assert.equal(g.dispatch('mineral.extract',{siteId:copperSite}).accepted,false,'rank 1 must not mine copper');
 assert.deepEqual(g.current(),snapshot);
 mine(g,'item05a:stone',6);
 mine(g,'item05a:clay',2);
 command(g,'world.travel',{region:'거점 마을'});
 for(let i=0;i<2;i++)command(g,'mineral.refine',{recipeId:'refine05h:stone'});
 command(g,'mineral.refine',{recipeId:'refine05h:clay'});
 command(g,'mineral.refine',{recipeId:'upgrade05i:reinforced-stone-pickaxe'});
 assert.equal(owned(g,'tool05a:pickaxe:reinforcedStone'),1);
 mine(g,'item05a:copper-ore',4);
 mine(g,'item05a:tin-ore',2);
 command(g,'world.travel',{region:'거점 마을'});
 for(let i=0;i<2;i++)command(g,'mineral.refine',{recipeId:'refine05h:copper'});
 command(g,'mineral.refine',{recipeId:'refine05h:tin'});
 command(g,'mineral.refine',{recipeId:'refine05h:bronze'});
 mine(g,'item05a:stone',2);
 command(g,'world.travel',{region:'거점 마을'});
 command(g,'mineral.refine',{recipeId:'refine05h:stone'});
 command(g,'mineral.refine',{recipeId:'upgrade05i:reinforced-bronze-pickaxe'});
 assert.equal(owned(g,'tool05a:pickaxe:reinforcedBronze'),1);
 mine(g,'item05a:iron-ore',2);
 command(g,'world.travel',{region:'거점 마을'});
 command(g,'mineral.refine',{recipeId:'refine05h:iron'});
 assert.equal(owned(g,'item05h:iron-ingot'),1);
 const source=createSaveV2(g.current(),meta,'test',g.registry);
 const prepared=prepareSecondsV2ToV3(source,g.registry);assert.equal(prepared.ok,true);
 const save=createSaveV3(prepared.state,meta,'test',g.registry);
 assert.equal(decodeSaveV3(save,g.registry).ok,true);
 const restored=game();restored.applyApprovedSave(save);
 assert.deepEqual(restored.current(),g.current());
});
