/** 02-C is the canonical v2 runtime surface. Legacy index.ts exports remain available
 * for v1 regression tests and explicit migrations, not for new game sessions.
 */
export const ENGINE_STAGE_V2='02-C' as const;
export const ACTIVE_GAME_STATE_SCHEMA_VERSION=2 as const;
export {V2ActionDispatcher} from './core/v2-dispatch.js';
export type {V2Action,V2ActionRegistry,V2ActionHandler,V2DispatchResult,V2DurationPolicy} from './core/v2-dispatch.js';
export {prepareBulkDiscard,confirmBulkDiscard,pickupWorldItem} from './core/item-transfer-v2.js';
export {dispatchItemAction} from './core/item-actions-v2.js';
export {buildItemRegistry,validateItemInstances,canStackItems,mergeItemStacks} from './data/item-registry.js';
export {validateItemWorld} from './data/item-world.js';
export {createRandomState,drawRandom,randomInt} from './core/rng.js';
export {createSaveV2,decodeSaveV2,parseBackupV2,exportBackupV2,migrateV1ToV2} from './save/save-v2.js';
export {IndexedDbSavesV2} from './save/indexeddb-v2.js';
export {V2SaveSession,prepareV2Load,prepareLegacyGameState} from './save/v2-session.js';
export {shouldAutoSave} from './save/autosave.js';
export type {GameStateV2,SaveEnvelopeV2} from './save/save-v2.js';
export type {ItemCatalog,ItemRegistry,ValidationIssue} from './data/item-registry.js';
export type {ItemInstanceDraft,ItemDefinition,MaterialDefinition,EffectDefinition,RecipeDefinition} from './data/item-model.js';
