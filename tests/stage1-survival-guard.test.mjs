import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkCraftSurvivalStage1} from '../src/crafting-survival-stage1.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const player={currentHp:18,currentMp:32,hunger:50};
test('opt-in survival floors reject only undershot stats',()=>{
 assert.deepEqual(checkCraftSurvivalStage1(player,{}),{ok:true});
 assert.equal(checkCraftSurvivalStage1(player,{minHp:20}).reason,'SURVIVAL_LIMIT_REACHED');
 assert.equal(checkCraftSurvivalStage1(player,{minMp:30,minHunger:40}).ok,true);
 assert.equal(checkCraftSurvivalStage1(player,{minHunger:51}).stat,'hunger');
});
test('reject unknown, negative and nonfinite policy; unavailable player stats fail closed',()=>{
 for(const v of [{minHp:-1},{minMp:NaN},{minHunger:'20'},{unrecognized:1},null,[]])
  assert.equal(checkCraftSurvivalStage1(player,v).ok,false);
 assert.equal(checkCraftSurvivalStage1({}, {minHp:20}).reason,'SURVIVAL_STATUS_UNAVAILABLE');
});
test('real crafting dispatcher rejects survival floor before spending turns or stock',()=>{
 const g=createMainV2Inventory([{id:'initial:stone',name:'시작',group:'재료',qty:1,tags:[]}],{
  worldSeed:'survival-craft',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,
  preferences:{getItem:()=>null,setItem:()=>{}}
 });
 const state=g.current(),limits={minHp:state.player.currentHp+1};
 const result=g.dispatch('craft.until',{recipeId:'craft05l:wood-basket',count:3,survivalLimits:limits});
 assert.equal(result.accepted,false);
 assert.equal(result.turnsSpent,0);
 assert.deepEqual(g.current(),state);
});
