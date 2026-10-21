/** 01-A type contracts only: no gameplay logic. Keep state JSON-serializable. */
export type EntityId = string;
export type DefinitionId = string;
export type RegionId = string;
export interface WorldClockState {
  /** Unit and calendar mapping are deliberately undecided. */
  readonly elapsedUnits: number;
}
export interface RandomState {
  /** Algorithm selection and implementation belong to 01-C. */
  readonly algorithm: string;
  readonly seed: string;
  readonly state: readonly number[];
}
export interface StatusEffectInstance {
  readonly id: EntityId;
  readonly definitionId: DefinitionId;
  readonly remainingTurns: number | null;
}
export interface PlayerState {
  readonly id: EntityId;
  readonly regionId: RegionId;
  readonly currentHp: number;
  readonly currentMp: number;
  readonly hunger: number;
  readonly statusEffects: readonly StatusEffectInstance[];
}
export interface ItemInstance {
  readonly id: EntityId;
  readonly definitionId: DefinitionId;
  readonly quantity: number;
  /** Material, quality, durability and enchantment contracts are deferred. */
}
export interface InventoryState {
  readonly items: readonly ItemInstance[];
}
export interface WorldState {
  readonly activeRegionId: RegionId;
}
export interface ProgressionState {
  readonly skillExperience: Readonly<Record<DefinitionId, number>>;
}
export interface GameState {
  readonly schemaVersion: 1;
  readonly turn: number;
  readonly clock: WorldClockState;
  readonly rng: RandomState;
  readonly player: PlayerState;
  readonly inventory: InventoryState;
  readonly world: WorldState;
  readonly progression: ProgressionState;
  readonly flags: Readonly<Record<string, boolean>>;
}
/** Input independent of keyboard, UI and automation. */
export interface GameAction {
  readonly type: string;
  readonly actorId: EntityId;
  readonly payload: Readonly<Record<string, unknown>>;
}
export interface GameEvent {
  readonly type: string;
  readonly payload: Readonly<Record<string, unknown>>;
}
export type DispatchResult =
  | { readonly accepted: true; readonly outcome: 'success' | 'failed'; readonly turnsSpent: 1; readonly nextState: GameState; readonly events: readonly GameEvent[] }
  | { readonly accepted: false; readonly reason: 'INVALID_COMMAND' | 'BUSY'; readonly turnsSpent: 0 };
