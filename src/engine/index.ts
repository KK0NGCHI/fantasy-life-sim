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

export { createSave, decodeSave, parseBackup, exportBackup, prepareLoad } from './save/save-format.js';
export type { SaveKind, SaveSlot, SaveEnvelope, DecodeResult } from './save/save-format.js';
export { IndexedDbSaves, SaveConflictError } from './save/indexeddb.js';
export { shouldAutoSave } from './save/autosave.js';
export type { AutoSavePolicy } from './save/autosave.js';

export { createSaveV2, decodeSaveV2, parseBackupV2, exportBackupV2, migrateV1ToV2 } from './save/save-v2.js';
export type { GameStateV2, SaveEnvelopeV2, V2Result } from './save/save-v2.js';
export { IndexedDbSavesV2 } from './save/indexeddb-v2.js';

export { dispatchItemAction } from './core/item-actions-v2.js';
export type { ItemCommand, ItemOutcome } from './core/item-actions-v2.js';

export { prepareBulkDiscard, confirmBulkDiscard, pickupWorldItem } from './core/item-transfer-v2.js';
export type { ItemSelection, DiscardPreview, DiscardResult, PickupResult } from './core/item-transfer-v2.js';

export { previewDiscard, discardSelected, pickUpItem } from './core/item-transfers-v2.js';
export type { ItemSelection, TransferResult } from './core/item-transfers-v2.js';
