/** Public engine import surface; stage 01-B provides the isolated action dispatcher. */
export const ENGINE_STAGE = '01-B' as const;
export const GAME_STATE_SCHEMA_VERSION = 1 as const;
export { dispatchAction, ActionDispatcher } from './core/dispatch.js';
export type { ActionHandler, ActionRegistry, ActionResolution } from './core/dispatch.js';
export type { EntityId, DefinitionId, RegionId, WorldClockState, RandomState, StatusEffectInstance, PlayerState, ItemInstance, InventoryState, WorldState, ProgressionState, GameState, GameAction, GameEvent, DispatchResult } from './core/contracts.js';
