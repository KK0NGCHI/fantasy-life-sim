import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AUTO_POLICY_KEY,readAutoPolicy,writeAutoPolicy} from '../src/autosave-preferences.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const inventory=[{id:'ore',name:'광석',group:'광석',qty:2,tags:[]}];
function mem(){
 const entries=new Map();
 return {getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value),get:key=>entries.get(key)};
}
test('device autosave preferences survive new game adapter instances',()=>{
 const prefs=mem();const a=createMainV2Inventory(inventory,{preferences:prefs});
 a.configureAutosave({everyActions:7,eventTypes:['world.travelled']});
 assert.equal(JSON.parse(prefs.get(AUTO_POLICY_KEY)).everyActions,7);
 const b=createMainV2Inventory(inventory,{preferences:prefs});
 assert.deepEqual(b.getAutosavePolicy(),{everyActions:7,eventTypes:['world.travelled']});
});
test('invalid or corrupted preferences fall back safely without changing stored bytes',()=>{
 const prefs=mem();prefs.setItem(AUTO_POLICY_KEY,'{malformed');
 assert.equal(readAutoPolicy(prefs).everyActions,20);
 assert.equal(prefs.get(AUTO_POLICY_KEY),'{malformed');
 assert.throws(()=>writeAutoPolicy(prefs,{everyActions:0,eventTypes:[]}));
 assert.throws(()=>writeAutoPolicy(prefs,{everyActions:10,eventTypes:['']}));
});
test('game journal is preserved with the latest action state before persistence',()=>{
 const a=createMainV2Inventory(inventory,{preferences:mem()});
 a.configureAutosave({everyActions:99,eventTypes:[]});
 const action=a.dispatch('life.activity',{name:'휴식한다'});
 assert.equal(action.accepted,true);
 a.captureCheckpoint({logs:[{kind:'생활',text:'휴식했습니다',turn:action.nextState.turn}],visitedRegions:['거점 마을']});
 const snap=a.current();
 assert.equal(snap.world.runtime.journal.logs[0].turn,snap.turn);
 assert.equal(snap.world.runtime.journal.logs[0].text,'휴식했습니다');
});
