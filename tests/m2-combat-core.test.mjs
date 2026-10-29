import test from 'node:test';
import assert from 'node:assert/strict';
import {M2_ACTIONS,startM2Encounter,actM2Combat,validateM2Combat} from '../src/m2-combat-core.js';
test('M2 combat actions omit position movement and rotate through all actors',()=>{
 assert.deepEqual(M2_ACTIONS,['attack','defend','retreat','skill','item']);
 const begun=startM2Encounter({encounterId:'cave:1',playerHp:20,enemyHps:[8,8],seed:7});
 assert.equal(begun.ok,true);
 const initial=structuredClone(begun.state);
 assert.equal(actM2Combat(initial,{actorId:'enemy:0',type:'attack',targetId:'player'}).reason,'NOT_ACTORS_TURN');
 assert.equal(actM2Combat(initial,{actorId:'player',type:'move'}).reason,'INVALID_ACTION');
 const a=actM2Combat(initial,{actorId:'player',type:'defend'});
 assert.equal(a.ok,true);assert.equal(a.state.queue[a.state.cursor],'enemy:0');
 const b=actM2Combat(a.state,{actorId:'enemy:0',type:'attack',targetId:'player'});
 assert.equal(b.ok,true);assert.equal(b.state.queue[b.state.cursor],'enemy:1');
 const c=actM2Combat(b.state,{actorId:'enemy:1',type:'defend'});
 assert.equal(c.ok,true);assert.equal(c.state.round,2);
 assert.equal(c.state.queue[c.state.cursor],'player');
 assert.equal(validateM2Combat(c.state),true);
 assert.deepEqual(initial,begun.state);
});
test('M2 handles guard, exact seeded replay, victory and resolved no-duplicate action',()=>{
 const start=startM2Encounter({encounterId:'cave:2',playerHp:25,enemyHps:[3],seed:42}).state;
 const one=actM2Combat(start,{actorId:'player',type:'attack',targetId:'enemy:0'});
 assert.equal(one.ok,true);assert.equal(one.state.outcome,'victory');
 assert.equal(one.state.phase,'resolved');
 assert.equal(actM2Combat(one.state,{actorId:'player',type:'attack',targetId:'enemy:0'}).reason,'RESOLVED');
 assert.deepEqual(one,actM2Combat(structuredClone(start),{actorId:'player',type:'attack',targetId:'enemy:0'}));
 assert.equal(start.participants[1].hp,3);
 assert.equal(actM2Combat(start,{actorId:'player',type:'attack',targetId:'player'}).reason,'INVALID_TARGET');
});
test('M2 seed and retreat are reproducible; bad input leaves state unchanged',()=>{
 const state=startM2Encounter({encounterId:'escape:1',playerHp:10,enemyHps:[11],seed:12}).state;
 const before=structuredClone(state);
 const retreat=actM2Combat(state,{actorId:'player',type:'retreat'});
 assert.equal(retreat.ok,true);
 assert.deepEqual(actM2Combat(state,{actorId:'player',type:'retreat'}),retreat);
 assert.deepEqual(state,before);
 assert.equal(startM2Encounter({encounterId:'bad',playerHp:10,enemyHps:[-1]}).ok,false);
});
