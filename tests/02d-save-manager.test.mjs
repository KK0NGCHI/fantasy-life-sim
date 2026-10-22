import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const fixture=[{id:'core:ore',name:'광석',group:'광석',qty:4,tags:[],quality:'보통',material:'돌'}];
test('02-D exposes unlimited manual slot API and validated autosave policy',()=>{
 const manager=createMainV2Inventory(fixture);
 assert.equal(manager.getAutosavePolicy().everyActions,20);
 manager.configureAutosave({everyActions:50,eventTypes:['world.travelled']});
 assert.deepEqual(manager.getAutosavePolicy(),{everyActions:50,eventTypes:['world.travelled']});
 assert.throws(()=>manager.configureAutosave({everyActions:0,eventTypes:[]}));
 assert.equal(typeof manager.listSlots,'function');
 assert.equal(typeof manager.recoveryCandidates,'function');
 assert.equal(typeof manager.loadCandidate,'function');
 assert.equal(typeof manager.save,'function');
});
test('02-D game action persists in memory without requiring browser storage until autosave threshold',()=>{
 const manager=createMainV2Inventory(fixture);
 manager.configureAutosave({everyActions:100,eventTypes:[]});
 const result=manager.dispatch('life.activity',{name:'주변을 살핀다'});
 assert.equal(result.accepted,true);
 assert.equal(manager.current().turn,1);
 assert.equal(manager.current().itemWorld.items[0].quantity,4);
});
