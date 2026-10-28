import {test} from 'node:test';
import assert from 'node:assert/strict';
import {craftBatch1,craftPreview1} from '../src/crafting-batch-stage1.js';
import {craftUntilStage1,checkWorkshopStage1} from '../src/crafting-workshop-stage1.js';
import {checkCraftSurvivalStage1} from '../src/crafting-survival-stage1.js';
import {readCraftMaterials05N} from '../src/material-composition-05n.js';
import {REFINING_BY_ID_05H} from '../src/mineral-refining-05h.js';

const world=()=>({items:[
 {id:'oak-a',definitionId:'item05h:oak-planks',quantity:2},
 {id:'oak-b',definitionId:'item05h:oak-planks',quantity:4},
 {id:'birch',definitionId:'item05m:birch-planks',quantity:4},
 {id:'rope',definitionId:'item05l:grass-rope',quantity:5}
],placements:['oak-a','oak-b','birch','rope'].map(itemId=>({itemId,location:{kind:'inventory',ownerId:'p'}})),containers:[]});
const amount=(w,id)=>w.items.filter(x=>x.definitionId===id).reduce((n,x)=>n+x.quantity,0);
test('stage I: manual one-by-one and atomic batch produce identical receipts and item state',()=>{
 const initial=world(),choices={0:'item05m:birch-planks'};
 let manual=initial;
 for(let i=0;i<2;i++){const r=craftBatch1(manual,'p','craft05l:wood-basket',1,choices);assert.equal(r.ok,true);manual=r.itemWorld;}
 const combined=craftBatch1(initial,'p','craft05l:wood-basket',2,choices);
 assert.equal(combined.ok,true);
 assert.deepEqual(combined.itemWorld,manual);
 const basket=combined.itemWorld.items.find(i=>i.definitionId==='item05l:wood-basket');
 assert.equal(basket.quantity,2);
 assert.ok(readCraftMaterials05N(basket).some(x=>x.definitionId==='item05m:birch-planks'&&x.quantity===2));
 assert.deepEqual(initial,world());
});
test('stage I: pinned stack stays pinned across bounded stop-on-shortage repeat',()=>{
 const initial=world(),choices={},pins={0:'oak-b'};
 const result=craftUntilStage1(initial,'p','craft05l:wood-basket',5,choices,pins,{maxSeconds:2400});
 assert.equal(result.ok,true);
 assert.equal(result.completed,2);
 assert.equal(result.stopReason,'INSUFFICIENT_MATERIAL');
 assert.equal(result.seconds,1200);
 assert.equal(result.itemWorld.items.find(x=>x.id==='oak-a').quantity,2);
 assert.equal(result.itemWorld.items.find(x=>x.id==='birch').quantity,4);
 assert.deepEqual(initial,world());
});
test('stage I: invalid policies, station access, or survival floor do not mutate stock',()=>{
 const initial=world(),snapshot=structuredClone(initial);
 assert.equal(checkWorkshopStage1({region:'숲',dungeon:false},'craft05l:wood-basket').ok,false);
 assert.equal(checkCraftSurvivalStage1({currentHp:19,currentMp:50,hunger:50},{minHp:20}).ok,false);
 assert.equal(craftUntilStage1(initial,'p','craft05l:wood-basket',5,{}, {},{maxSeconds:599}).ok,false);
 assert.equal(craftBatch1(initial,'p','craft05l:wood-basket',20).ok,false);
 assert.deepEqual(initial,snapshot);
});
test('stage I: active recipes have recognized station and positive duration, distinct outputs',()=>{
 for(const recipe of REFINING_BY_ID_05H.values()){
  assert.ok(['furnace','workbench'].includes(recipe.station),recipe.id);
  assert.ok(Number.isSafeInteger(recipe.seconds)&&recipe.seconds>0,recipe.id);
  assert.ok(Number.isSafeInteger(recipe.outputQty)&&recipe.outputQty>0,recipe.id);
  assert.ok(typeof recipe.output==='string'&&recipe.output,recipe.id);
 }
 assert.equal(craftPreview1(world(),'p','craft05l:wood-basket').ok,true);
 assert.equal(amount(world(),'item05h:oak-planks'),6);
});
