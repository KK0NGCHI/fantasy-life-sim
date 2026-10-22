/**
 * 02-A candidate data contracts. Additive only: NOT plugged into GameState yet.
 * The current ItemInstance in core/contracts.ts remains active until migration.
 * All unresolved game balance and stacking semantics are deliberately omitted.
 */
import type { DefinitionId, EntityId } from '../core/contracts.js';

export type ItemCategoryId = DefinitionId;
export type MaterialId = DefinitionId;
export type EffectId = DefinitionId;
export type RecipeId = DefinitionId;

/** Static content record; localization keys, not saved display names. */
export interface ItemDefinition {
  readonly id: DefinitionId;
  readonly nameKey: string;
  readonly categoryId: ItemCategoryId;
  readonly tags: readonly string[];
  readonly defaultMaterialId?: MaterialId;
  /** Behaviour flags, not statistical modifiers or search tags. */
  readonly capabilities: readonly DefinitionId[];
  /** Properties shared by all instances; numbers live in a future balance pack. */
  readonly data?: Readonly<Record<string, string | number | boolean>>;
}
export interface MaterialDefinition {
  readonly id: MaterialId;
  readonly nameKey: string;
  readonly tags: readonly string[];
  /** Hardness, mass, value and other effects remain independently defined. */
  readonly properties: Readonly<Record<string, number>>;
}
export interface EffectDefinition {
  readonly id: EffectId;
  readonly nameKey: string;
  readonly tags: readonly string[];
}
/** Instance-scoped effect; effect resolution and stacking are later decisions. */
export interface ItemEffect {
  readonly definitionId: EffectId;
  readonly level?: number;
}
export interface ItemInstanceDraft {
  readonly id: EntityId;
  readonly definitionId: DefinitionId;
  readonly quantity: number;
  readonly materialId?: MaterialId;
  /** Quality, rarity, enhancement and identification are distinct concepts. */
  readonly quality?: number;
  readonly rarityId?: DefinitionId;
  readonly enhancementLevel?: number;
  readonly effects?: readonly ItemEffect[];
  readonly condition?: Readonly<Record<string, number | string | boolean>>;
}
export type ItemLocation =
  | { readonly kind: 'inventory'; readonly ownerId: EntityId }
  | { readonly kind: 'equipped'; readonly ownerId: EntityId; readonly slotId: DefinitionId }
  | { readonly kind: 'container'; readonly containerId: EntityId }
  | { readonly kind: 'world'; readonly regionId: DefinitionId; readonly locationId: string };
/** Container contents are references, never recursively embedded objects. */
export interface ContainerContents {
  readonly containerId: EntityId;
  readonly itemIds: readonly EntityId[];
}
/** Multiple conditions are OR alternatives in each required ingredient slot. */
export type IngredientMatcher =
  | { readonly kind: 'item'; readonly definitionId: DefinitionId }
  | { readonly kind: 'material'; readonly materialId: MaterialId }
  | { readonly kind: 'category'; readonly categoryId: ItemCategoryId }
  | { readonly kind: 'tag'; readonly tag: string };
export interface IngredientRequirement {
  readonly quantity: number;
  readonly anyOf: readonly IngredientMatcher[];
  readonly optional?: boolean;
}
export interface RecipeDefinition {
  readonly id: RecipeId;
  readonly stationTags: readonly string[];
  readonly ingredients: readonly IngredientRequirement[];
  readonly resultDefinitionId: DefinitionId;
  /** Crafting inheritance calculation is intentionally not specified here. */
}
