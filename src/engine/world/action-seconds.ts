/** Game seconds are independent of logical action turns.
 * These first-pass durations are explicit game-balance constants, not legacy v2 units.
 */
export const SECONDS_PER_ACTION=Object.freeze({
 'life.activity':60,
 'region.activity':60,
 'world.travel':900,
 'dungeon.move':6,
 'dungeon.enter':10,
 'dungeon.leave':10,
 'item.move':5,
 'item.consume':5,
 'item.merge':5,
 'item.split':5,
 'item.pickup':5,
 'item.discard.confirm':5,
 'item.craft':900
});
export function actionSeconds(type:string):number{
 if(!Object.hasOwn(SECONDS_PER_ACTION,type))throw RangeError('No game-second duration for action: '+type);
 const n=SECONDS_PER_ACTION[type as keyof typeof SECONDS_PER_ACTION];
 if(!Number.isSafeInteger(n)||n<1)throw RangeError('Invalid action seconds');
 return n;
}
