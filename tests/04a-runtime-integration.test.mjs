import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const items=[{id:'test:rock',name:'돌',group:'재료',qty:1,tags:[]}];
const preferences={getItem:()=>null,setItem:()=>{}};
const make=options=>createMainV2Inventory(items,{generatedWorld:true,worldPersistence03E:true,worldSeed:'04a-test',preferences,...options});
const slot={slotId:'04a-optin',worldId:'main-world',kind:'manual',label:'04A',savedAt:'2026-10-24T00:00:00Z',revision:0};
const pack=game=>{const v2=createSaveV2(game.current(),slot,'main-prototype',game.registry);const proposal=prepareSecondsV2ToV3(v2,game.registry);assert.equal(proposal.ok,true);return createSaveV3(proposal.state,slot,'main-prototype',game.registry)};
test('04-A opt-in initializes 54 actual level-1 skills and 7 attributes',()=>{
 const game=make({progression04A:true,attributeAllocation:{지각:5,지능:5}});
 const progression=game.progression04A();
 assert.equal(Object.keys(progression.skills).length,54);
 assert.equal(Object.keys(progression.attributes).length,7);
 assert.equal(progression.attributes.지각,15);
 assert.equal(game.skillLevels().탐색,1);
 assert.equal(game.skillLevels().채광,1);
 const gate=game.dispatch('region.activity',{activityId:'core:activity/deep-forest'});
 assert.equal(gate.accepted,false);
});
test('04-A snapshot survives v3 saved envelope and restoration',()=>{
 const source=make({progression04A:true,attributeAllocation:{의지:5}});
 const save=pack(source);
 assert.equal(decodeSaveV3(save,source.registry).ok,true);
 const target=make({progression04A:true});
 target.applyApprovedSave(save);
 assert.deepEqual(target.progression04A(),source.progression04A());
 assert.equal(target.progression04A().attributes.의지,15);
});
test('04-A legacy snapshot is not migrated silently',()=>{
 const old=make({progression04A:false});
 const save=pack(old);
 const fresh=make({progression04A:true});
 fresh.applyApprovedSave(save);
 assert.equal(fresh.progression04A(),null);
 assert.equal(fresh.skillLevels(),null);
});
test('04-A rejects modified invalid progression before applying live state',()=>{
 const game=make({progression04A:true});
 const save=pack(game);
 const bad=structuredClone(save);
 bad.state.progression.system04A.skills['skill-01']=-100;
 const previous=game.current();
 assert.throws(()=>game.applyApprovedSave(bad),/Invalid 04-A/);
 assert.deepEqual(game.current(),previous);
});
