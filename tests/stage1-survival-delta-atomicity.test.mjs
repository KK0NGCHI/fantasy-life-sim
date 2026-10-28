import {test} from 'node:test';
import assert from 'node:assert/strict';
import {craftUntilStage1} from '../src/crafting-workshop-stage1.js';
const world=()=>({items:[
 {id:'wood',definitionId:'item05h:oak-planks',quantity:10},
 {id:'rope',definitionId:'item05l:grass-rope',quantity:5}
],placements:['wood','rope'].map(itemId=>({itemId,location:{kind:'inventory',ownerId:'p'}})),containers:[]});
const player={id:'p',currentHp:100,currentMp:80,hunger:85};
test('invalid per-craft survival change fails before any craft or time is spent',()=>{
 const stock=world(),initial=structuredClone(stock);
 for(const delta of [{mp:1},{hunger:NaN},{hp:-1001},{unknown:5},null,[]]){
  const result=craftUntilStage1(stock,'p','craft05l:wood-basket',5,{}, {},{},player,{},delta);
  assert.equal(result.ok,false);
  assert.equal(result.completed,0);
  assert.equal(result.reason,'INVALID_SURVIVAL_DELTA');
  assert.deepEqual(stock,initial);
 }
});
test('valid explicit change still interrupts after completed crafts',()=>{
 const result=craftUntilStage1(world(),'p','craft05l:wood-basket',5,{}, {},{},player,{minHunger:75},{hunger:-6});
 assert.equal(result.ok,true);
 assert.equal(result.completed,2);
 assert.equal(result.stopReason,'SURVIVAL_LIMIT_REACHED');
});
