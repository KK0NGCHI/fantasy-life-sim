import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ATLAS_MINERAL_BALANCE_05E,NAMED_MINERAL_BALANCE_05E} from '../src/balance-minerals-05e.js';
import {ATLAS_DEPOSIT_DEFINITIONS_05E,MINERAL_DEFINITIONS_05E,
 createMineralDeposits05E,validateMineralDeposits05E,mineMineral05E,prospectMineral05E} from '../src/mineral-deposits-05e.js';

test('provisional geology values preserve 05-E inventory of thirteen named ore grades',()=>{
 const baseline={
 'item05a:tin-ore':[6,2,2],'item05a:silver-ore':[5,2,2],'item05a:gold-ore':[4,3,2],
 'item05a:limestone':[10,1,1],'item05a:clay':[12,1,1],'item05a:silica-sand':[9,1,1],
 'item05a:gypsum':[8,1,1],'item05a:sulfur':[6,2,2],'item05a:stone':[16,1,1],
 'item05a:coal':[10,1,2],'item05a:copper-ore':[8,2,2],
 'item05a:iron-ore':[7,2,3],'item05a:quartz':[5,3,2]
 };
 assert.deepEqual(ATLAS_MINERAL_BALANCE_05E,{stock:4,grade:1,hardness:1});
 assert.equal(Object.keys(NAMED_MINERAL_BALANCE_05E).length,13);
 for(const [id,values] of Object.entries(baseline)){
  const config=NAMED_MINERAL_BALANCE_05E[id];
  const def=MINERAL_DEFINITIONS_05E.find(x=>x.id===id);
  assert.deepEqual([config.stock,config.grade,config.hardness],values,id);
  assert.deepEqual([def.stock,def.grade,def.hardness],values,id);
  assert.ok(Object.isFrozen(config));
 }
 assert.ok(ATLAS_DEPOSIT_DEFINITIONS_05E.every(x=>x.stock===4&&x.grade===1&&x.hardness===1));
 assert.equal(MINERAL_DEFINITIONS_05E.length,ATLAS_DEPOSIT_DEFINITIONS_05E.length+13);
});
test('finite deposit and tool hardness contracts survive tuning extraction',()=>{
 const baseline=createMineralDeposits05E();
 assert.equal(validateMineralDeposits05E(baseline),true);
 for(const itemId of ['item05a:stone','item05a:clay','item05a:copper-ore','item05a:tin-ore','item05a:iron-ore']){
  const discovery=prospectMineral05E(baseline,'광산',itemId);
  assert.equal(discovery.ok,true,itemId);
  const site=discovery.siteId,def=MINERAL_DEFINITIONS_05E.find(x=>x.id===itemId);
  if(def.hardness>1){
   const denied=mineMineral05E(discovery.deposits,'광산',site,{toolPower:def.hardness-1,roll:0});
   assert.equal(denied.ok,false,itemId);
   assert.equal(denied.reason,'TOOL_TOO_WEAK');
   assert.equal(discovery.deposits[site].remaining,def.stock);
  }
  let deposits=discovery.deposits;
  for(let n=0;n<def.stock;n++){
   const outcome=mineMineral05E(deposits,'광산',site,{toolPower:def.hardness,roll:0});
   assert.equal(outcome.ok,true,itemId);
   assert.equal(outcome.remaining,def.stock-n-1);
   deposits=outcome.deposits;
  }
  assert.equal(mineMineral05E(deposits,'광산',site,{toolPower:4,roll:0}).reason,'DEPOSIT_EXHAUSTED');
  assert.equal(validateMineralDeposits05E(deposits),true);
 }
});
