import {test} from 'node:test';
import assert from 'node:assert/strict';
import {craftPreview1,craftBatch1} from '../src/crafting-batch-stage1.js';
import {checkCraftingTabooStage1} from '../src/crafting-taboo-stage1.js';
import {craftWithAllocatedMaterials} from '../src/material-crafting-05k.js';
const make=()=>({items:[{id:'a',definitionId:'item05h:oak-planks',quantity:4},{id:'b',definitionId:'item05l:grass-rope',quantity:2}],
 placements:['a','b'].map(itemId=>({itemId,location:{kind:'inventory',ownerId:'p'}})),containers:[]});
test('stage I: preview does not alter world and agrees with real craft feasibility',()=>{
 const world=make(),before=structuredClone(world);
 assert.equal(craftPreview1(world,'p','craft05l:wood-basket').ok,true);
 assert.equal(craftBatch1(world,'p','craft05l:wood-basket',1).ok,true);
 assert.equal(craftPreview1(world,'p','craft05l:wood-basket',{}, {0:'missing'}).ok,false);
 assert.equal(craftBatch1(world,'p','craft05l:wood-basket',1,{}, {0:'missing'}).ok,false);
 assert.deepEqual(world,before);
});
test('stage I: preview cannot bypass trusted equipment taboo checks for selected materials',()=>{
 const world={items:[{id:'x',definitionId:'rare:ingot',quantity:3}],placements:[{itemId:'x',location:{kind:'inventory',ownerId:'p'}}],containers:[]};
 const recipe={id:'test:pickaxe',output:'tool05a:test',outputQty:1,inputs:[{itemId:'rare:ingot',quantity:1}]};
 const definitions={'rare:ingot':{originClass:'alien'}};
 const receipt=checkCraftingTabooStage1(recipe,[{itemId:'x',slotId:'slot:0',quantity:1}],world,definitions);
 assert.equal(receipt.reason,'ALIEN_EQUIPMENT_TABOO');
 const attempt=craftWithAllocatedMaterials(world,'p',recipe,definitions);
 assert.equal(attempt.reason,receipt.reason);
 assert.equal(world.items[0].quantity,3);
});
