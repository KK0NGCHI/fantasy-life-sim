/** Versioned v3 save and calendar API.
 * Runtime gameplay still delegates actions to the established v2 dispatcher bridge
 * while persistent saves have an explicitly versioned seconds clock.
 */
export const SAVE_SCHEMA_VERSION=3 as const;
export const CLOCK_BASIS='seconds-v1' as const;
export {createSaveV3,decodeSaveV3,parseBackupV3,exportBackupV3,
 prepareV2ToV3Migration,prepareSecondsV2ToV3} from './save/save-v3.js';
export {IndexedDbSavesV3} from './save/indexeddb-v3.js';
export type {GameStateV3,SaveEnvelopeV3} from './save/save-v3.js';
export {GAME_DAY_SECONDS,GAME_START_SECONDS,gameClockAt,formatTravelSeconds,assertGameSeconds} from './world/time-seconds.js';
export {SECONDS_PER_ACTION,actionSeconds} from './world/action-seconds.js';

export {V3ActionDispatcher} from './core/v3-dispatch.js';
export type {V3Duration,V3DurationPolicy,V3DispatchResult} from './core/v3-dispatch.js';
