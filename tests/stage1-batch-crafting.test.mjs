import {test} from 'node:test';
import assert from 'node:assert/strict';
import {craftBatch1,craftPreview1} from '../src/crafting-batch-stage1.js';
import {refineMineral05H} from '../src/mineral-refining-05h.js';
import {readCraftMaterials05N} from '../src/material-composition-05n.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const w=(lines)=>({items:lines.map(([definitionId,quantity],i)=>({id:'t:'+i,definitionId,quantity})),placements:lines.map((_,i)=>({itemId:'t:'+i,location:{kind:'inventory',ownerId:'p'}})),containers:[]});
const template=[{id:'starter:stone',name:'시작',group:'재료',qty:1,tags:[]}];
const options={worldSeed:'stage1-batch',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,preferences:{getItem:()=>null,setItem:()=>{}}};
const make=()=>createMainV2Inventory(template,options);
const meta={slotId:'stage1',worldId:'world',kind:'manual',label:'craft',savedAt:'2026-10-27T00:00:00Z',revision:0};
function withItems(lines){
 const g=make(),saveV2=createSaveV2(g.current(),meta,'test',g.registry),v3=prepareSecondsV2ToV3(saveV2,g.registry);
 assert.equal(v3.ok,true);
 const save=createSaveV3(v3.state,meta,'test',g.registry);
 const items=w(lines);save.state.itemWorld={...save.state.itemWorld,items:[...save.state.itemWorld.items,...items.items],placements:[...save.state.itemWorld.placements,...items.placements]};
 const loaded=make();loaded.applyApprovedSave(save);return loaded;
}
test('generic wood preview recognizes actual plank type, not accidental exact-ID check',()=>{
 const itemWorld=w([['item05m:birch-planks',2],['item05l:grass-rope',1]]);
 assert.equal(craftPreview1(itemWorld,'p','craft05l:wood-basket').ok,true);
 assert.equal(craftPreview1(w([['item05a:stone',2],['item05l:grass-rope',1]]),'p','craft05l:wood-basket').reason,'INSUFFICIENT_MATERIAL');
});
test('batch performs identical sequential crafting, preserving receipts and stack identities',()=>{
 const initial=w([['item05h:oak-planks',4],['item05l:grass-rope',2]]);
 let manual=initial;
 for(let i=0;i<2;i++){const r=refineMineral05H(manual,'p','craft05l:wood-basket');assert.equal(r.ok,true);manual=r.itemWorld;}
 const batch=craftBatch1(initial,'p','craft05l:wood-basket',2);
 assert.equal(batch.ok,true);
 assert.deepEqual(batch.itemWorld,manual);
 assert.equal(batch.seconds,1200);
 assert.deepEqual(readCraftMaterials05N(batch.itemWorld.items.find(i=>i.definitionId==='item05l:wood-basket')),[
  {definitionId:'item05h:oak-planks',quantity:2},{definitionId:'item05l:grass-rope',quantity:1}
 ]);
});
test('batch shortage on second iteration is wholly atomic',()=>{
 const initial=w([['item05m:birch-planks',2],['item05l:grass-rope',1]]),before=structuredClone(initial);
 const result=craftBatch1(initial,'p','craft05l:wood-basket',2);
 assert.equal(result.ok,false);assert.equal(result.reason,'INSUFFICIENT_MATERIAL');
 assert.equal(result.failedAt,2);assert.deepEqual(initial,before);
});
test('invalid counts do not modify stock',()=>{
 const initial=w([['item05h:oak-planks',40],['item05l:grass-rope',20]]);
 for(const count of [0,-1,21,1.1,'2']){
  const r=craftBatch1(initial,'p','craft05l:wood-basket',count);
  assert.equal(r.ok,false);assert.deepEqual(initial,w([['item05h:oak-planks',40],['item05l:grass-rope',20]]));
 }
});
test('live dispatcher bulk craft spends N turns and N durations and survives v3 save',()=>{
 const g=withItems([['item05h:oak-planks',4],['item05l:grass-rope',2]]);
 const before=g.current(),result=g.dispatch('craft.batch',{recipeId:'craft05l:wood-basket',count:2});
 assert.equal(result.accepted,true,JSON.stringify(result));
 const after=g.current();
 assert.equal(after.turn,before.turn+2);
 assert.equal(after.clock.elapsedUnits,before.clock.elapsedUnits+1200);
 assert.equal(after.itemWorld.items.filter(x=>x.definitionId==='item05l:wood-basket').reduce((n,x)=>n+x.quantity,0),2);
 const v2=createSaveV2(after,meta,'test',g.registry),converted=prepareSecondsV2ToV3(v2,g.registry);
 assert.equal(converted.ok,true);
 const save=createSaveV3(converted.state,meta,'test',g.registry);
 assert.equal(decodeSaveV3(save,g.registry).ok,true);
 const loaded=make();loaded.applyApprovedSave(save);
 assert.deepEqual(loaded.current(),after);
});
test('live failed batch does not consume time or resources',()=>{
 const g=withItems([['item05h:oak-planks',2],['item05l:grass-rope',1]]);
 const before=g.current(),result=g.dispatch('craft.batch',{recipeId:'craft05l:wood-basket',count:2});
 assert.equal(result.accepted,false);assert.equal(result.turnsSpent,0);assert.deepEqual(g.current(),before);
});
