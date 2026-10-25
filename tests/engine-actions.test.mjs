import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dispatchAction, ActionDispatcher } from '../dist/engine/index.js';

const state = () => ({
  schemaVersion: 1, turn: 4, clock: { elapsedUnits: 20 },
  rng: { algorithm: 'undecided', seed: 'test', state: [] },
  player: { id: 'p1', regionId: 'test:camp', currentHp: 9, currentMp: 4, hunger: 6, statusEffects: [] },
  inventory: { items: [] }, world: { activeRegionId: 'test:camp' },
  progression: { skillExperience: {} }, flags: {}
});
const act = (type, payload = {}) => ({ type, actorId: 'p1', payload });
const handlers = new Map([
  ['test:move', (s, a) => a.payload.blocked
    ? { outcome: 'failed', nextState: s, events: [{ type: 'movement.blocked', payload: {} }] }
    : { outcome: 'success', nextState: { ...s, player: { ...s.player, regionId: 'test:grove' } }, events: [{ type: 'region.entered', payload: {} }] }],
  ['test:rest', s => ({ outcome: 'success', nextState: s, events: [{ type: 'rest.completed', payload: {} }] })],
  ['test:gather', s => ({ outcome: 'failed', nextState: s, events: [{ type: 'gather.failed', payload: {} }] })]
]);
test('success: exactly one turn, original state untouched, clock not advanced', () => {
  const before = state();
  const result = dispatchAction(before, act('test:move'), handlers);
  assert.equal(result.accepted, true);
  assert.equal(result.outcome, 'success');
  assert.equal(result.turnsSpent, 1);
  assert.equal(result.nextState.turn, 5);
  assert.equal(result.nextState.player.regionId, 'test:grove');
  assert.equal(result.nextState.clock.elapsedUnits, 20);
  assert.equal(before.turn, 4);
  assert.equal(before.player.regionId, 'test:camp');
  assert.equal(result.events[0].type, 'region.entered');
});
test('blocked move and failed gather still spend one turn', () => {
  for (const action of [act('test:move', { blocked: true }), act('test:gather')]) {
    const r = dispatchAction(state(), action, handlers);
    assert.equal(r.accepted, true); assert.equal(r.outcome, 'failed');
    assert.equal(r.nextState.turn, 5);
  }
});
test('three sequential attempts spend three turns', () => {
  let s = state();
  for (let i = 0; i < 3; i++) {
    const r = dispatchAction(s, act('test:rest'), handlers);
    assert.equal(r.accepted, true); s = r.nextState;
  }
  assert.equal(s.turn, 7);
});
test('invalid, unknown or wrong-actor commands spend zero', () => {
  const s = state();
  for (const x of [null, {}, act('unknown'), { ...act('test:rest'), actorId: 'wrong' }, act('test:rest', null)]) {
    assert.deepEqual(dispatchAction(s, x, handlers), { accepted: false, reason: 'INVALID_COMMAND', turnsSpent: 0 });
  }
  assert.equal(s.turn, 4);
});
test('handler error cannot partly commit changes', () => {
  const s = state();
  const faulty = new Map([['test:throw', draft => { draft.player.currentHp = 0; throw Error('failure'); }]]);
  assert.deepEqual(dispatchAction(s, act('test:throw'), faulty), { accepted: false, reason: 'EXECUTION_ERROR', turnsSpent: 0 });
  assert.equal(s.player.currentHp, 9);
});
test('handler cannot spend its own turn before dispatcher', () => {
  const broken = new Map([['test:bad', s => ({ outcome: 'success', nextState: { ...s, turn: 5 }, events: [] })]]);
  assert.equal(dispatchAction(state(), act('test:bad'), broken).accepted, false);
});
test('reentrant action is rejected as busy', () => {
  let dispatcher;
  const nested = new Map([['test:nested', s => {
    assert.deepEqual(dispatcher.dispatch(s, act('test:nested')), { accepted: false, reason: 'BUSY', turnsSpent: 0 });
    return { outcome: 'success', nextState: s, events: [] };
  }]]);
  dispatcher = new ActionDispatcher(nested);
  const result = dispatcher.dispatch(state(), act('test:nested'));
  assert.equal(result.accepted, true);
  assert.equal(result.nextState.turn, 5);
});
