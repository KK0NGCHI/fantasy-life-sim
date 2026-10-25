import type { RandomState } from './contracts.js';
import { randomInt } from './rng.js';

/** Game-design supplied ranges; these are NOT balance constants. */
export interface SkilledTurnRange {
  readonly noviceMin: number;
  readonly noviceMax: number;
  readonly masteryMin: number;
  readonly masteryMax: number;
}
export interface TurnCost { readonly turns: number; readonly rng: RandomState; }
const good = (a: number, b: number): boolean => Number.isSafeInteger(a) && Number.isSafeInteger(b) && a >= 1 && a <= b;
export function sampleSkilledTurns(config: SkilledTurnRange, mastery: number, rng: RandomState): TurnCost {
  const { noviceMin, noviceMax, masteryMin, masteryMax } = config;
  if (!good(noviceMin, noviceMax) || !good(masteryMin, masteryMax) ||
      masteryMin > noviceMin || masteryMax > noviceMax ||
      !Number.isFinite(mastery) || mastery < 0 || mastery > 1) throw new RangeError('Invalid skill duration configuration');
  const min = Math.max(masteryMin, Math.ceil(noviceMin + (masteryMin - noviceMin) * mastery));
  const max = Math.max(masteryMax, Math.ceil(noviceMax + (masteryMax - noviceMax) * mastery));
  const chosen = randomInt(rng, 'action', min, max);
  return { turns: chosen.value, rng: chosen.rng };
}
/** World time is independent from turn count, supplied as integer units per action. */
export function advanceWorldTime(elapsedUnits: number, cost: number): number {
  if (!Number.isSafeInteger(elapsedUnits) || elapsedUnits < 0 ||
      !Number.isSafeInteger(cost) || cost < 0 ||
      !Number.isSafeInteger(elapsedUnits + cost)) throw new RangeError('Invalid world time');
  return elapsedUnits + cost;
}
