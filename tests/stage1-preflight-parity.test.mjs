import {test} from 'node:test';
import assert from 'node:assert/strict';
import {previewWorkshopActionStage1} from '../src/crafting-preflight-stage1.js';
import {craftUntilStage1} from '../src/crafting-workshop-stage1.js';
import {craftBatch1} from '../src/crafting-batch-stage1.js';
const state=()=>({player:{id:'p',currentHp:100,currentMp:80,hunger:18},
 world:{runtime:{region:'거점 마을',dungeon:false}},
 itemWorld:{items:[{id:'oak',definitionId:'item05h:oak-planks',quantity:4},
 {id:'rope',definitionId:'item05l:grass-rope',quantity:2}],
 placements:['oak','rope'].map(itemId=>({itemId,location:{kind:'inventory',ownerId:'p'}})),containers:[]}
});
test('full-action preflight matches atomic failure and never mutates',()=>{
 const input=state(),original=structuredClone(input);
 const req={recipeId:'craft05l:wood-basket',count:3,mode:'atomic'};
 assert.equal(previewWorkshopActionStage1(input,req).ok,false);
 assert.equal(craftBatch1(input.itemWorld,'p',req.recipeId,3).ok,false);
 assert.deepEqual(input,original);
});
test('partial preview gives same completed count, time and stop reason as execution',()=>{
 const input=state(),before=structuredClone(input);
 const req={recipeId:'craft05l:wood-basket',count:5,mode:'until'};
 const preview=previewWorkshopActionStage1(input,req);
 const actual=craftUntilStage1(input.itemWorld,'p',req.recipeId,5,{}, {},{},input.player);
 assert.equal(preview.ok,true);assert.equal(preview.completed,actual.completed);
 assert.equal(preview.stopReason,actual.stopReason);assert.equal(preview.seconds,actual.seconds);
 assert.equal(preview.completed,2);
 assert.deepEqual(input,before);
});
test('survival and station failures appear before craft is enabled',()=>{
 const input=state();
 assert.equal(previewWorkshopActionStage1(input,{recipeId:'craft05l:wood-basket',count:2,mode:'until',
 survivalLimits:{minHunger:20}}).reason,'SURVIVAL_LIMIT_REACHED');
 input.world.runtime.region='숲';
 assert.equal(previewWorkshopActionStage1(input,{recipeId:'craft05l:wood-basket',count:1,mode:'atomic'}).reason,'WORKSTATION_REQUIRED');
});
test('time cap and pinned stock stop produce exact preview',()=>{
 const input=state();
 const request={recipeId:'craft05l:wood-basket',count:5,mode:'until',
 policy:{maxSeconds:600},stackChoices:{0:'oak'}};
 const trial=previewWorkshopActionStage1(input,request);
 assert.equal(trial.ok,true);assert.equal(trial.completed,1);assert.equal(trial.stopReason,'TIME_BUDGET_REACHED');
});
