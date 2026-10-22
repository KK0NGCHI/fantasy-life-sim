import type { ActionRegistry } from './dispatch.js';
import { dispatchAction } from './dispatch.js';
import type { DispatchResult, GameAction, GameState, RandomState } from './contracts.js';
import { advanceWorldTime } from './time.js';
export interface ActionTiming { readonly turns: number; readonly worldUnits: number; readonly rng: RandomState; }
export type TimingPolicy = (state: Readonly<GameState>, action: Readonly<GameAction>) => ActionTiming;
/** Applies game-design timing after an accepted 01-B transition; never advances on rejection. */
export function dispatchTimedAction(state: GameState, action: unknown, handlers: ActionRegistry, timing: TimingPolicy): DispatchResult {
  // Execute the action first; avoid ever drawing RNG for rejected commands.
  const base = dispatchAction(state, action, handlers);
  if (!base.accepted) return base;
  try {
    const policy = timing(state, action as GameAction);
    if (!Number.isSafeInteger(policy.turns) || policy.turns < 1 ||
        !Number.isSafeInteger(policy.worldUnits) || policy.worldUnits < 0 ||
        !Number.isSafeInteger(state.turn + policy.turns) ||
        policy.rng.algorithm !== state.rng.algorithm || policy.rng.seed !== state.rng.seed ||
        !Array.isArray(policy.rng.state)) throw new RangeError('Invalid timing result');
    const units = advanceWorldTime(state.clock.elapsedUnits, policy.worldUnits);
    return {
      ...base,
      turnsSpent: policy.turns,
      nextState: { ...base.nextState, turn: state.turn + policy.turns,
        clock: { ...base.nextState.clock, elapsedUnits: units }, rng: policy.rng }
    };
  } catch {
    return { accepted: false, reason: 'EXECUTION_ERROR', turnsSpent: 0 };
  }
}
/** Default test integration: a normal attempt takes one turn and one abstract world unit. */
export const defaultTiming: TimingPolicy = (state) => ({ turns: 1, worldUnits: 1, rng: state.rng });
