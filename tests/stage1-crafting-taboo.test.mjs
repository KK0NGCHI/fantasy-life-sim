import {test} from 'node:test';
import assert from 'node:assert/strict';
import {craftWithAllocatedMaterials} from '../src/material-crafting-05k.js';
import {checkCraftingTabooStage1} from '../src/crafting-taboo-stage1.js';
import {refineMineral05H,REFINING_RECIPES_05H} from '../src/mineral-refining-05h.js';
const world=()=>({items:[{id:'alien',definitionId:'test:alien-ingot',quantity:2}],placements:[{itemId:'alien',location:{kind:'inventory',ownerId:'p'}}],containers:[]});
const defs={'test:alien-ingot':{family:'metal',form:'ingot',grade:1,originClass:'alien'}};
const recipe=output=>({id:'test:recipe',output,outputQty:1,station:'workbench',inputs:[{itemId:'test:alien-ingot',quantity:1}]});
test('alien-origin material is blocked only when crafting equipment; no stock spent',()=>{
 const inventory=world(),before=structuredClone(inventory);
 const denied=craftWithAllocatedMaterials(inventory,'p',recipe('tool05a:test:pickaxe'),defs);
 assert.equal(denied.ok,false);assert.equal(denied.reason,'ALIEN_EQUIPMENT_TABOO');assert.deepEqual(inventory,before);
 const allowed=craftWithAllocatedMaterials(inventory,'p',recipe('item05n:sealed-sample'),defs);
 assert.equal(allowed.ok,true);assert.equal(allowed.itemWorld.items.find(i=>i.definitionId==='item05n:sealed-sample').quantity,1);
 assert.deepEqual(inventory,before);
});
test('mundane material can make equipment and untrusted instance origin is ignored',()=>{
 const inv=world();inv.items[0].condition={originClass:'alien'};
 const permitted=craftWithAllocatedMaterials(inv,'p',recipe('tool05a:test:pickaxe'),{'test:alien-ingot':{originClass:'mundane'}});
 assert.equal(permitted.ok,true);
});
test('sacred status and dreamlike labels alone do not produce alien equipment taboo',()=>{
 const inv=world();
 for(const originClass of ['sacred','dream','void','mundane']){
  const allowed=craftWithAllocatedMaterials(inv,'p',recipe('tool05a:test:pickaxe'),{'test:alien-ingot':{originClass}});
  assert.equal(allowed.ok,true,originClass);
 }
});
test('legacy equipment recipes and ordinary crafts continue to run',()=>{
 assert.equal(REFINING_RECIPES_05H.length,17);
 const inv={items:[{id:'a',definitionId:'item05h:copper-ingot',quantity:2},{id:'b',definitionId:'item05h:cut-stone',quantity:1}],
 placements:[{itemId:'a',location:{kind:'inventory',ownerId:'p'}},{itemId:'b',location:{kind:'inventory',ownerId:'p'}}],containers:[]};
 assert.equal(refineMineral05H(inv,'p','craft05i:copper-pickaxe').ok,true);
 assert.equal(checkCraftingTabooStage1({output:'item05m:plant-cloth'},[],world(),defs).ok,true);
});
