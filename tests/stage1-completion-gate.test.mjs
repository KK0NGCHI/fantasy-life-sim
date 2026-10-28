import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REFINING_BY_ID_05H,refineMineral05H} from '../src/mineral-refining-05h.js';
import {craftBatch1,craftPreview1} from '../src/crafting-batch-stage1.js';
import {craftUntilStage1,checkWorkshopStage1} from '../src/crafting-workshop-stage1.js';
import {checkCraftSurvivalStage1} from '../src/crafting-survival-stage1.js';
import {checkCraftingTabooStage1} from '../src/crafting-taboo-stage1.js';
import {readCraftMaterials05N} from '../src/material-composition-05n.js';
const inventory=()=>({items:[
 {id:'oak1',definitionId:'item05h:oak-planks',quantity:2},
 {id:'oak2',definitionId:'item05h:oak-planks',quantity:38},
 {id:'rope',definitionId:'item05l:grass-rope',quantity:20}
],placements:['oak1','oak2','rope'].map(itemId=>({itemId,location:{kind:'inventory',ownerId:'p'}})),containers:[]});
test('stage I: twenty crafts equal twenty sequential commits including receipts',()=>{
 const start=inventory();let single=start;
 for(let i=0;i<20;i++){const r=refineMineral05H(single,'p','craft05l:wood-basket');assert.equal(r.ok,true);single=r.itemWorld;}
 const result=craftBatch1(start,'p','craft05l:wood-basket',20);
 assert.equal(result.ok,true);assert.deepEqual(result.itemWorld,single);
 assert.equal(result.seconds,12000);
 const output=result.itemWorld.items.find(i=>i.definitionId==='item05l:wood-basket');
 assert.equal(output.quantity,20);assert.equal(readCraftMaterials05N(output).length,2);
 assert.deepEqual(start,inventory());
});
test('stage I: exact stack prevents fallback even when other stacks contain sufficient material',()=>{
 const start=inventory();
 const result=craftUntilStage1(start,'p','craft05l:wood-basket',20,{},{0:'oak1'},{maxSeconds:12000});
 assert.equal(result.ok,true);assert.equal(result.completed,1);
 assert.equal(result.stopReason,'INSUFFICIENT_MATERIAL');
 assert.equal(result.itemWorld.items.find(i=>i.id==='oak2').quantity,38);
});
test('stage I: common prereqs distinguish world facilities, survival and taboo',()=>{
 assert.equal(checkWorkshopStage1({region:'거점 마을',dungeon:false},'craft05l:wood-basket').ok,true);
 assert.equal(checkWorkshopStage1({region:'숲'},'craft05l:wood-basket').ok,false);
 assert.equal(checkCraftSurvivalStage1({currentHp:19,currentMp:30,hunger:40},{minHp:20}).ok,false);
 const sample={items:[{id:'rare',definitionId:'test:alien',quantity:1}],placements:[],containers:[]};
 const defs={'test:alien':{originClass:'alien'}};
 assert.equal(checkCraftingTabooStage1({output:'tool05a:axe:test'},[{itemId:'rare',quantity:1}],sample,defs).reason,'ALIEN_EQUIPMENT_TABOO');
 assert.equal(checkCraftingTabooStage1({output:'item05m:sample'},[{itemId:'rare',quantity:1}],sample,defs).ok,true);
});
test('stage I: current active recipes all have declared valid station, duration and known input slots',()=>{
 assert.ok(REFINING_BY_ID_05H.size>20);
 const ids=new Set();
 for(const recipe of REFINING_BY_ID_05H.values()){
  assert.ok(!ids.has(recipe.id));ids.add(recipe.id);
  assert.ok(['workbench','furnace'].includes(recipe.station),recipe.id);
  assert.ok(Number.isSafeInteger(recipe.seconds)&&recipe.seconds>0,recipe.id);
  assert.ok(Number.isSafeInteger(recipe.outputQty)&&recipe.outputQty>0,recipe.id);
  const inputs=recipe.inputs??[{itemId:recipe.input,quantity:recipe.inputQty}];
  assert.ok(inputs.length>0&&inputs.every(x=>Number.isSafeInteger(x.quantity)&&x.quantity>0&&(x.itemId||x.material?.family)),recipe.id);
 }
 assert.equal(craftPreview1(inventory(),'p','craft05l:wood-basket').ok,true);
});
