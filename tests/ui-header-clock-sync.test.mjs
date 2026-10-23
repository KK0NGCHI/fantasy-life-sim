import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const items=[{id:'test:branch',name:'나뭇가지',group:'재료',qty:2,tags:[]}];
const prefs={getItem:()=>null,setItem:()=>{}};
test('six accepted life actions advance a real 6 minutes, not frozen 08:00',()=>{
 const a=createMainV2Inventory(items,{preferences:prefs});
 for(let i=0;i<6;i++)assert.equal(a.dispatch('life.activity',{name:'나뭇가지 줍기'}).accepted,true);
 assert.equal(a.current().turn,6);
 assert.equal(a.current().clock.elapsedUnits,360);
 assert.deepEqual(a.gameTime(),{day:1,hour:8,minute:6,second:0});
});
test('UI renders header from engine state and refreshes on committed events',()=>{
 const code=readFileSync(new URL('../src/v3.js',import.meta.url),'utf8');
 assert.match(code,/function refreshHeaderClock\(\)/);
 assert.match(code,/mainV2\.gameTime\(\)/);
 assert.match(code,/id="gameClockValue"/);
 assert.match(code,/mainV2\.captureCheckpoint\(s\);refreshHeaderClock\(\)/);
 assert.match(code,/function render\(\)\{refreshV2Inventory\(\)/);
});
