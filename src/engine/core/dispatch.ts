import type { DispatchResult, GameAction, GameEvent, GameState } from './contracts.js';

export interface ActionResolution {
  readonly outcome: 'success' | 'failed';
  readonly nextState: GameState;
  readonly events: readonly GameEvent[];
}
export type ActionHandler = (state: Readonly<GameState>, action: Readonly<GameAction>) => ActionResolution;
export type ActionRegistry = ReadonlyMap<string, ActionHandler>;

/** Keep command/state boundaries JSON-serializable until runtime schemas arrive in 02. */
const copyJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const isRecord = (x: unknown): x is Record<string, unknown> =>
  x !== null && typeof x === 'object' && !Array.isArray(x);
const isNonnegativeInteger = (x: unknown): x is number =>
  typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;

function validState(x: unknown): x is GameState {
  if (!isRecord(x) || x.schemaVersion !== 1 || !isNonnegativeInteger(x.turn)) return false;
  if (!isRecord(x.player) || typeof x.player.id !== 'string' || !x.player.id) return false;
  return isRecord(x.clock) && isRecord(x.rng) && isRecord(x.world) &&
    isRecord(x.inventory) && isRecord(x.progression) && isRecord(x.flags);
}
function validCommand(x: unknown, state: GameState, handlers: ActionRegistry): x is GameAction {
  return isRecord(x) && typeof x.type === 'string' && !!x.type &&
    handlers.has(x.type) && x.actorId === state.player.id && isRecord(x.payload);
}
function validResult(x: unknown): x is ActionResolution {
  return isRecord(x) && (x.outcome === 'success' || x.outcome === 'failed') &&
    validState(x.nextState) && Array.isArray(x.events) &&
    x.events.every((e: unknown) => isRecord(e) && typeof e.type === 'string' &&
      !!e.type && isRecord(e.payload));
}

/** One accepted game attempt spends exactly one turn, success or failure.
 * Invalid/busy/error paths spend zero, with no partial state commit.
 * No world time, randomness or UI updates occur here.
 */
export function dispatchAction(state: GameState, action: unknown, handlers: ActionRegistry): DispatchResult {
  if (!validState(state) || !validCommand(action, state, handlers) ||
      state.turn === Number.MAX_SAFE_INTEGER) {
    return { accepted: false, reason: 'INVALID_COMMAND', turnsSpent: 0 };
  }
  try {
    const handler = handlers.get(action.type);
    if (!handler) return { accepted: false, reason: 'INVALID_COMMAND', turnsSpent: 0 };
    const result: unknown = handler(copyJson(state), copyJson(action));
    if (!validResult(result) || result.nextState.turn !== state.turn ||
        result.nextState.schemaVersion !== state.schemaVersion ||
        result.nextState.player.id !== state.player.id) {
      return { accepted: false, reason: 'EXECUTION_ERROR', turnsSpent: 0 };
    }
    const nextState: GameState = { ...copyJson(result.nextState), turn: state.turn + 1 };
    return {
      accepted: true,
      outcome: result.outcome,
      turnsSpent: 1,
      nextState,
      events: copyJson(result.events)
    };
  } catch {
    return { accepted: false, reason: 'EXECUTION_ERROR', turnsSpent: 0 };
  }
}

/** Reject reentrant synchronous dispatch while an action is resolving. */
export class ActionDispatcher {
  private busy = false;
  constructor(private readonly handlers: ActionRegistry) {}
  dispatch(state: GameState, action: unknown): DispatchResult {
    if (this.busy) return { accepted: false, reason: 'BUSY', turnsSpent: 0 };
    this.busy = true;
    try { return dispatchAction(state, action, this.handlers); }
    finally { this.busy = false; }
  }
}
