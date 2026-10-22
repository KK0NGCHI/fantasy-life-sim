/** Public engine import surface; stage 01-C extends the isolated action dispatcher with timing, random streams and automation. */
export const ENGINE_STAGE = '01-C' as const;
export const GAME_STATE_SCHEMA_VERSION = 1 as const;
export { dispatchAction, ActionDispatcher } from './core/dispatch.js';
export type { ActionHandler, ActionRegistry, ActionResolution } from './core/dispatch.js';
export type { EntityId, DefinitionId, RegionId, WorldClockState, RandomState, StatusEffectInstance, PlayerState, ItemInstance, InventoryState, WorldState, ProgressionState, GameState, GameAction, GameEvent, DispatchResult } from './core/contracts.js';

export { createRandomState, drawRandom, randomInt } from './core/rng.js';
export type { RngStream } from './core/rng.js';
export { sampleSkilledTurns, advanceWorldTime } from './core/time.js';
export type { SkilledTurnRange, TurnCost } from './core/time.js';
export { dispatchTimedAction, defaultTiming } from './core/timed-dispatch.js';
export type { TimingPolicy, ActionTiming } from './core/timed-dispatch.js';
export { shouldStopAuto, findSafePath, AutoController } from './core/automation.js';
export type { AutoTile, AutoSensors, AutoThresholds, AutoPauseReason } from './core/automation.js';

export { buildItemRegistry, validateItemInstances, canStackItems, mergeItemStacks } from './data/item-registry.js';
export type { ItemCatalog, ItemRegistry, ValidationIssue } from './data/item-registry.js';
export type { ItemDefinition, MaterialDefinition, EffectDefinition, ItemInstanceDraft, ItemEffect, ItemLocation, ContainerContents, RecipeDefinition, IngredientMatcher, IngredientRequirement } from './data/item-model.js';

export { validateItemWorld, prepareInventoryMigration } from './data/item-world.js';
export type { ItemWorldSnapshot, ItemPlacement } from './data/item-world.js';
