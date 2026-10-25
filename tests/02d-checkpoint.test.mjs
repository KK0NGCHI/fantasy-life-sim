import {test} from 'node:test';import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const fixture=[{id:'ore',name:'광석',group:'광석',qty:2,tags:[]}];
test('02-D journal is captured and defensively cloned without adding weight',()=>{
 const a=createMainV2Inventory(fixture);
 const log=[{kind:'생활',text:'약초 채집',detail:'기록',turn:3,count:1}];
 a.captureCheckpoint({logs:log,visitedRegions:['거점 마을']});
 log[0].text='외부 수정';
 assert.equal(a.checkpoint().logs[0].text,'약초 채집');
 const copy=a.checkpoint();copy.logs[0].text='또 수정';
 assert.equal(a.checkpoint().logs[0].text,'약초 채집');
 assert.equal(a.current().world.runtime.journal.visitedRegions[0],'거점 마을');
 assert.equal(JSON.stringify(a.current()).includes('"weight"'),false);
});
test('02-D journal validation rejects excessive or malformed entries without changing state',()=>{
 const a=createMainV2Inventory(fixture),before=a.current();
 assert.throws(()=>a.captureCheckpoint({logs:Array(501).fill({kind:'생활',text:'x'})}));
 assert.throws(()=>a.captureCheckpoint({logs:[{kind:1,text:'x'}]}));
 assert.deepEqual(a.current(),before);
});
