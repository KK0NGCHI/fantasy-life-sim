import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3,parseBackupV3} from '../dist/engine/v2.js';
const slot={slotId:'04d-standalone',worldId:'test-world',kind:'manual',label:'04D',savedAt:'2026-10-24T07:00:00Z',revision:0};
const preferences={getItem:()=>null,setItem:()=>{}};
function game(opts={}){return createMainV2Inventory([{id:'test:rock',name:'돌',group:'재료',qty:1,tags:[]}],{worldSeed:'04d-test',generatedWorld:true,worldPersistence03E:true,progression04A:true,preferences,...opts})}
function save(g){const v2=createSaveV2(g.current(),slot,'test-content',g.registry);const v3=prepareSecondsV2ToV3(v2,g.registry);assert.equal(v3.ok,true);return createSaveV3(v3.state,slot,'test-content',g.registry)}
test('04-D rejects corrupted skill, attribute, awards, and inconsistent origin in decoder and backup',()=>{
 const g=game();g.chooseOrigin04B('gnome','miner');const good=save(g);assert.equal(decodeSaveV3(good,g.registry).ok,true);
 for(const alter of [
  s=>{s.state.progression.system04A.skills['skill-01']=-1},
  s=>{s.state.progression.system04A.skills['skill-99']=42},
  s=>{s.state.progression.system04A.training.근력=NaN},
  s=>{s.state.progression.system04A.awards=['repeat','repeat']},
  s=>{s.state.progression.origin04B.bodySize='tiny'},
  s=>{s.state.progression.origin04B.backgroundId='different'},
  s=>{delete s.state.progression.system04A},
 ]){
  const changed=structuredClone(good);alter(changed);
  assert.equal(decodeSaveV3(changed,g.registry).ok,false);
  assert.equal(parseBackupV3(JSON.stringify(changed),g.registry).ok,false);
  assert.throws(()=>g.applyApprovedSave(changed));
 }
 assert.equal(decodeSaveV3(good,g.registry).ok,true);
});
test('04-D old v3 saves remain valid and are not implicitly given progression or origin',()=>{
 const legacy=game({progression04A:false});const old=save(legacy);
 assert.equal(decodeSaveV3(old,legacy.registry).ok,true);
 const target=game();target.applyApprovedSave(old);
 assert.equal(target.progression04A(),null);
 assert.equal(target.origin04B(),null);
 assert.equal('system04A' in old.state.progression,false);
});
test('04-D good opt-in save restores background, point-buy, and single-discovery flags',()=>{
 const source=game();source.chooseOrigin04B('human','cook');source.setInitialAttributes({지능:5,의지:5});
 assert.equal(source.dispatch('origin.insight',{interactionId:'origin:insight/cook'}).accepted,true);
 const raw=save(source);
 const target=game();target.applyApprovedSave(raw);
 assert.deepEqual(target.current().progression,source.current().progression);
 assert.deepEqual(target.current().flags,source.current().flags);
 assert.equal(target.current().clock.elapsedUnits,source.current().clock.elapsedUnits);
});
