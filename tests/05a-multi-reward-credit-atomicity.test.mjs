import {test} from 'node:test';
import assert from 'node:assert/strict';
import {creditMineralOutputs05E} from '../src/mineral-credit-05e.js';
import {creditOwnedResource05A} from '../src/resource-credit-05a.js';

function source(){
 return {items:[
  {id:'mineral05e:item05a:coal',definitionId:'item05a:coal',quantity:1},
  {id:'mineral05e:item05a:stone',definitionId:'item05a:stone',quantity:1}
 ],placements:[
  {itemId:'mineral05e:item05a:coal',location:{kind:'inventory',ownerId:'player'}},
  {itemId:'mineral05e:item05a:stone',location:{kind:'inventory',ownerId:'other'}}
 ],containers:[]};
}
test('second reward cross-owner collision never credits first mineral reward or source',()=>{
 const initial=source(),before=structuredClone(initial);
 assert.throws(()=>creditMineralOutputs05E(initial,'player',[
  {itemId:'item05a:coal',quantity:2},{itemId:'item05a:stone',quantity:1}
 ]),/MINERAL_OUTPUT_NOT_OWNED/);
 assert.deepEqual(initial,before);
});
test('large second mineral reward refuses quantity overflow without partial credit',()=>{
 const initial=source(),before=structuredClone(initial);
 assert.throws(()=>creditMineralOutputs05E(initial,'player',[
  {itemId:'item05a:coal',quantity:2},{itemId:'item05a:coal',quantity:Number.MAX_SAFE_INTEGER}
 ]),/MINERAL_STACK_OVERFLOW/);
 assert.deepEqual(initial,before);
});
test('two separate ordinary rewards preserve a clean precondition copy',()=>{
 const initial={items:[],placements:[],containers:[]};
 const one=creditOwnedResource05A(initial,'player','gather05a:herb','item05a:wild-herb',2);
 const two=creditOwnedResource05A(one,'player','gather05a:grass','item05a:grass',3);
 assert.equal(two.items.length,2);
 assert.deepEqual(two.items.map(i=>i.quantity),[2,3]);
 assert.deepEqual(initial.items,[]);
 assert.deepEqual(one.items.map(i=>i.quantity),[2]);
});
