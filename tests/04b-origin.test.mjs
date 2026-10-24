import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES,BACKGROUNDS,createOrigin,validateOrigin,applyOriginToProgression,hasExclusiveAbility,tileFootprint,canUsePassage} from '../src/character-origin-04b.js';
import {createProgression,SKILL_DEFINITIONS,skillLevel} from '../src/progression-system.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
const preferences={getItem:()=>null,setItem:()=>{}};
const make=()=>createMainV2Inventory([{id:'test:stone',name:'돌',group:'재료',qty:1,tags:[]}],{progression04A:true,preferences});
test('04-B has 8 species, 16 backgrounds, exclusive identities',()=>{
 assert.equal(SPECIES.length,8);assert.equal(BACKGROUNDS.length,16);
 assert.equal(new Set(BACKGROUNDS.map(x=>x.ability)).size,16);
 for(const s of SPECIES)for(const b of BACKGROUNDS){
  const origin=createOrigin(s.id,b.id);assert.equal(validateOrigin(origin),true);
  assert.equal(tileFootprint(origin),1);assert.equal(hasExclusiveAbility(origin,'origin:'+b.id),true);
  assert.equal(hasExclusiveAbility(origin,'origin:other'),false);
 }
});
test('04-B tiny/small/medium gates do not subdivide tile or change geometry',()=>{
 const normal=createOrigin('human','miner'),small=createOrigin('gnome','scholar'),tiny=createOrigin('fairy','cook');
 assert.equal(canUsePassage(normal,{minimumSize:'small'}).ok,false);
 assert.equal(canUsePassage(small,{minimumSize:'small'}).ok,true);
 assert.equal(canUsePassage(small,{minimumSize:'tiny'}).ok,false);
 assert.equal(canUsePassage(tiny,{minimumSize:'tiny'}).ok,true);
 assert.equal(tileFootprint(normal),tileFootprint(tiny));
});
test('04-B background XP grants exact levels 3 and 2 and validates save payload shape',()=>{
 const o=createOrigin('dwarf','miner');
 const p=applyOriginToProgression(createProgression(),o);
 const id=n=>SKILL_DEFINITIONS.find(s=>s.name===n).id;
 assert.equal(skillLevel(p.skills[id('채광')]),3);
 assert.equal(skillLevel(p.skills[id('탐색')]),2);
 assert.equal(validateOrigin({...o,bodySize:'tiny'}),false);
});
test('04-B runtime selection is permanent after commit and attribute allocation retains origin skills',()=>{
 const g=make();g.chooseOrigin04B('fairy','scholar');
 assert.equal(g.origin04B().bodySize,'tiny');
 assert.throws(()=>g.chooseOrigin04B('human','miner'),/locked/);
 g.setInitialAttributes({지능:5});
 const id=SKILL_DEFINITIONS.find(x=>x.name==='학문').id;
 assert.equal(skillLevel(g.progression04A().skills[id]),3);
 assert.equal(g.progression04A().attributes.지능,15);
});
