import type { GameEvent } from '../core/contracts.js';
/** User-configured policy; no game-balance default interval is imposed here. */
export interface AutoSavePolicy {
 readonly everyActions:number;
 readonly eventTypes:readonly string[];
}
export function shouldAutoSave(actionsSinceLastSave:number, events:readonly GameEvent[], policy:AutoSavePolicy):boolean {
 if(!Number.isSafeInteger(actionsSinceLastSave)||actionsSinceLastSave<0||
   !Number.isSafeInteger(policy.everyActions)||policy.everyActions<1||
   !Array.isArray(policy.eventTypes)||!policy.eventTypes.every(x=>typeof x==='string'&&!!x)) throw new RangeError('Invalid autosave policy');
 return actionsSinceLastSave>=policy.everyActions || events.some(x=>policy.eventTypes.includes(x.type));
}
