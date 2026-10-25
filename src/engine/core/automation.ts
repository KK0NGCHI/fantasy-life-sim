import type { DispatchResult, GameAction, GameState } from './contracts.js';
export type AutoPauseReason = 'manual' | 'information-panel' | 'background' | 'danger' | 'threshold' | 'no-safe-route' | 'done' | 'invalid-command';
export interface AutoThresholds {
  readonly hpPercent: number | null;
  readonly mpPercent: number | null;
  /** Hunger is assumed to grow toward danger; game rules may adapt the sensor. */
  readonly hungerPercent: number | null;
}
export interface AutoSensors {
  readonly hpPercent: number;
  readonly mpPercent: number;
  readonly hungerPercent: number;
  readonly dangerVisible: boolean;
  readonly incapacitated: boolean;
}
const percent = (n: number): boolean => Number.isFinite(n) && n >= 0 && n <= 100;
export function shouldStopAuto(s: AutoSensors, t: AutoThresholds): AutoPauseReason | null {
  for (const v of [s.hpPercent,s.mpPercent,s.hungerPercent,t.hpPercent,t.mpPercent,t.hungerPercent]) {
    if (v !== null && !percent(v)) throw new RangeError('Invalid percentage');
  }
  if (s.incapacitated || s.dangerVisible) return 'danger';
  if ((t.hpPercent !== null && s.hpPercent <= t.hpPercent) ||
      (t.mpPercent !== null && s.mpPercent <= t.mpPercent) ||
      (t.hungerPercent !== null && s.hungerPercent >= t.hungerPercent)) return 'threshold';
  return null;
}
export interface AutoTile { readonly id: string; readonly neighbours: readonly string[]; readonly walkable: boolean; readonly hazardous: boolean; }
export function findSafePath(tiles: ReadonlyMap<string, AutoTile>, from: string, goal: string): readonly string[] | null {
  if (!tiles.get(from)?.walkable || !tiles.get(goal)?.walkable || tiles.get(goal)?.hazardous) return null;
  const queue: string[] = [from], previous = new Map<string,string | null>([[from,null]]);
  for (let head=0; head<queue.length; head++) {
    const curr = queue[head]!;
    if (curr === goal) {
      const route: string[] = [];
      let id: string | null = curr;
      while (id !== null) { route.push(id); id = previous.get(id) ?? null; }
      return route.reverse();
    }
    for (const next of tiles.get(curr)?.neighbours ?? []) {
      const tile=tiles.get(next);
      if (!previous.has(next) && tile?.walkable && !tile.hazardous) {
        previous.set(next,curr); queue.push(next);
      }
    }
  }
  return null;
}
/** One tick = at most one ordinary dispatch. No timer, automatic restart or catch-up turns. */
export class AutoController {
  private running = false;
  private reason: AutoPauseReason | null = null;
  start(): void { this.running = true; this.reason = null; }
  pause(reason: AutoPauseReason = 'manual'): void { this.running = false; this.reason = reason; }
  onInformationPanelOpen(): void { this.pause('information-panel'); }
  onHidden(): void { this.pause('background'); }
  get status(): { running: boolean; reason: AutoPauseReason | null } { return { running:this.running, reason:this.reason }; }
  tick(state: GameState, sensors: AutoSensors, limits: AutoThresholds,
       select: (state: GameState) => GameAction | null,
       execute: (state: GameState, action: GameAction) => DispatchResult,
       observeAfter?: (state: GameState) => AutoSensors): DispatchResult | null {
    if (!this.running) return null;
    const before = shouldStopAuto(sensors, limits);
    if (before) { this.pause(before); return null; }
    const action = select(state);
    if (!action) { this.pause('no-safe-route'); return null; }
    const result = execute(state, action);
    if (!result.accepted) this.pause('invalid-command');
    else if (observeAfter) {
      const after = shouldStopAuto(observeAfter(result.nextState), limits);
      if (after) this.pause(after);
    }
    return result;
  }
}
