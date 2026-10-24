import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ATTRIBUTES,SKILL_DEFINITIONS,PROGRESSION_RULES,createProgression,validateProgression,skillThreshold,skillLevel,skillEffect,attributeNextTraining,awardProgression} from '../src/progression-system.js';
test('04-A covers all 54 skills in six groups and 7 distinct attributes',()=>{
 assert.equal(SKILL_DEFINITIONS.length,54);assert.equal(new Set(SKILL_DEFINITIONS.map(x=>x.id)).size,54);
 assert.equal(new Set(SKILL_DEFINITIONS.map(x=>x.group)).size,6);assert.equal(ATTRIBUTES.length,7);
 for(const skill of SKILL_DEFINITIONS){assert.ok(ATTRIBUTES.includes(skill.primary));assert.ok(!skill.secondary||ATTRIBUTES.includes(skill.secondary));}
});
test('04-A skill curve is monotone and 30 is milestone, not cap',()=>{
 assert.equal(skillThreshold(1),0);assert.equal(skillThreshold(2),60);
 assert.equal(skillThreshold(30),29754);
 assert.equal(skillLevel(skillThreshold(30)),30);
 assert.equal(skillLevel(skillThreshold(31)),31);
 assert.ok(skillThreshold(40)>skillThreshold(30));
 assert.ok(skillEffect(31)>skillEffect(30));assert.ok(skillEffect(100)<0.25);
});
test('04-A character creation rejects invalid budgets, preserves available unspent points',()=>{
 const basic=createProgression();assert.equal(validateProgression(basic),true);
 assert.deepEqual(Object.values(basic.attributes),Array(7).fill(10));
 const specialist=createProgression({지능:5,의지:5});assert.equal(specialist.attributes.지능,15);
 assert.throws(()=>createProgression({지능:6}));assert.throws(()=>createProgression({지능:5,의지:5,근력:1}));
 assert.throws(()=>createProgression({아무거나:1}));assert.throws(()=>createProgression({민첩:-1}));
 assert.equal(attributeNextTraining(10),100);
});
test('04-A awards once for each action, invalid action and replay cannot farm XP',()=>{
 const first=createProgression();
 const s=SKILL_DEFINITIONS.find(x=>x.name==='채광');
 const gained=awardProgression(first,{actionId:'event-001',skillId:s.id,xp:20});
 assert.equal(gained.skills[s.id],20);assert.equal(gained.training.근력,3);assert.equal(gained.training.지각,1);
 assert.deepEqual(awardProgression(gained,{actionId:'event-001',skillId:s.id,xp:999}),gained);
 assert.deepEqual(awardProgression(gained,{actionId:'invalid',skillId:s.id,xp:20,valid:false}),gained);
 assert.deepEqual(first,createProgression());
});
test('04-A XP and attribute growth are deterministic across JSON saves',()=>{
 let p=createProgression({근력:5});
 const skill=SKILL_DEFINITIONS.find(s=>s.name==='벌목');
 for(let i=0;i<40;i++)p=awardProgression(p,{actionId:'wood-'+i,skillId:skill.id,xp:20});
 assert.equal(validateProgression(p),true);
 assert.ok(p.attributes.근력>15);
 assert.deepEqual(JSON.parse(JSON.stringify(p)),p);
 assert.equal(validateProgression({...p,skills:{...p.skills,[skill.id]:-2}}),false);
});
