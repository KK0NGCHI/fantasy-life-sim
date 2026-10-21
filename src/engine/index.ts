/** Public engine import surface; stage 01-A deliberately performs no actions. */
export const ENGINE_STAGE = '01-A' as const;
export const GAME_STATE_SCHEMA_VERSION = 1 as const;
export type { EntityId, DefinitionId, RegionId, WorldClockState, RandomState, StatusEffectInstance, PlayerState, ItemInstance, InventoryState, WorldState, ProgressionState, GameState, GameAction, GameEvent, DispatchResult } from './core/contracts.js';
