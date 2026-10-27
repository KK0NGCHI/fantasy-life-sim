import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {readCraftMaterials05N} from '../src/material-composition-05n.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3,canStackItems} from '../dist/engine/v2.js';

const opts={worldSeed:'05n-material-roundtrip',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,preferences:{getItem:()=>null,setItem:()=>{}}};
const make=()=>createMainV2Inventory([{id:'starter:stone',name:'시작',group:'재료',qty:1,tags:[]}],opts);
const meta={slotId:'05n-test',worldId:'world',kind:'manual',label:'material-receipt',savedAt:'2026-10-27T10:00:00Z',revision:0};
function saved(g){
 const v2=createSaveV2(g.current(),meta,'test',g.registry);
 const migrated=prepareSecondsV2ToV3(v2,g.registry);assert.equal(migrated.ok,true);
 return createSaveV3(migrated.state,meta,'test',g.registry);
}
const owned=(g,def)=>g.current().itemWorld.items.filter(i=>i.definitionId===def&&g.current().itemWorld.placements.some(p=>p.itemId===i.id&&p.location.kind==='inventory'&&p.location.ownerId===g.current().player.id));
function assemble(g,entries){
 const state=g.current();
 const additions=entries.map(([definitionId,quantity],i)=>({id:'fixture05n:'+definitionId+':'+i,definitionId,quantity}));
 const extra=additions.map(x=>({itemId:x.id,location:{kind:'inventory',ownerId:state.player.id}}));
 const snapshot={...state,itemWorld:{...state.itemWorld,items:[...state.itemWorld.items,...additions],placements:[...state.itemWorld.placements,...extra]}};
 const raw=saved(g);raw.state.itemWorld=snapshot.itemWorld;
 const newGame=make();newGame.applyApprovedSave(raw);
 return newGame;
}
test('real dispatcher: craft receipt survives v3 save/load and identical repeated outputs share stack',()=>{
 let g=assemble(make(),[['item05h:oak-planks',4],['item05l:grass-rope',2]]);
 const start=g.current().clock.elapsedUnits,turn=g.current().turn;
 for(let i=0;i<2;i++){
  const res=g.dispatch('mineral.refine',{recipeId:'craft05l:wood-basket'});
  assert.equal(res.accepted,true,JSON.stringify(res));
 }
 assert.equal(g.current().turn,turn+2);
 assert.equal(g.current().clock.elapsedUnits-start,1200);
 let basket=owned(g,'item05l:wood-basket');
 assert.equal(basket.length,1);assert.equal(basket[0].quantity,2);
 assert.deepEqual(readCraftMaterials05N(basket[0]),[{definitionId:'item05h:oak-planks',quantity:2},{definitionId:'item05l:grass-rope',quantity:1}]);
 const before=g.current(),raw=saved(g);
 assert.equal(decodeSaveV3(raw,g.registry).ok,true);
 const restored=make();restored.applyApprovedSave(raw);
 assert.deepEqual(restored.current(),before);
 assert.deepEqual(readCraftMaterials05N(owned(restored,'item05l:wood-basket')[0]),readCraftMaterials05N(basket[0]));
});
test('oak and birch baskets remain separate after real dispatch and reload',()=>{
 let g=assemble(make(),[['item05h:oak-planks',2],['item05m:birch-planks',2],['item05l:grass-rope',2]]);
 assert.equal(g.dispatch('mineral.refine',{recipeId:'craft05l:wood-basket'}).accepted,true);
 const first=owned(g,'item05l:wood-basket')[0],firstUsed=readCraftMaterials05N(first);
 assert.equal(firstUsed.length,2);
 assert.equal(g.dispatch('mineral.refine',{recipeId:'craft05l:wood-basket'}).accepted,true);
 const before=owned(g,'item05l:wood-basket');
 assert.equal(before.length,2);
 assert.notEqual(before[0].condition.materials05n,before[1].condition.materials05n);
 const raw=saved(g);assert.equal(decodeSaveV3(raw,g.registry).ok,true);
 const restored=make();restored.applyApprovedSave(raw);
 const after=owned(restored,'item05l:wood-basket');
 assert.deepEqual(after,before);
 assert.equal(canStackItems(after[0],after[1],restored.registry),false);
});
test('legacy unrecorded basket and new crafted basket are separate across save',()=>{
 let g=assemble(make(),[['item05h:oak-planks',2],['item05l:grass-rope',1],['item05l:wood-basket',1]]);
 assert.equal(g.dispatch('mineral.refine',{recipeId:'craft05l:wood-basket'}).accepted,true);
 const baskets=owned(g,'item05l:wood-basket');
 assert.equal(baskets.length,2);
 assert.equal(baskets.filter(i=>readCraftMaterials05N(i)===null).length,1);
 const raw=saved(g),restored=make();restored.applyApprovedSave(raw);
 assert.equal(owned(restored,'item05l:wood-basket').length,2);
});
test('failed real craft after load spends zero turns and preserves item receipts',()=>{
 let g=assemble(make(),[['item05m:birch-planks',2],['item05l:grass-rope',1]]);
 assert.equal(g.dispatch('mineral.refine',{recipeId:'craft05l:wood-basket'}).accepted,true);
 const checkpoint=saved(g),r=make();r.applyApprovedSave(checkpoint);
 const before=r.current(),fail=r.dispatch('mineral.refine',{recipeId:'craft05l:wood-basket'});
 assert.equal(fail.accepted,false);
 assert.equal(fail.turnsSpent,0);
 assert.deepEqual(r.current(),before);
});
