import {validateResourcePool05A,rollAvailableResourcePool05A} from './resource-pools-05a.js';

/** Optional game-time activity: the main action is exploration, salvage, or scouting.
 * A secondary resource event is independent of action success. No real-world time.
 * All three rolls are supplied by the authoritative RNG caller, never user payload.
 */
export const INCIDENTAL_ACTIVITY_KINDS_05A=Object.freeze(['explore','scavenge','survey','sail','investigate','salvage','gather','mine','fish','logging','mining','fishing']);
export const INCIDENTAL_ACTIVITY_SECONDS_05A=600;
const validRoll=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<1;
export function validateIncidentalTable05A(table){
 return !!table&&typeof table==='object'&&!Array.isArray(table)&&
 INCIDENTAlActivity(table.activity)&&
 typeof table.region==='string'&&table.region.length>0&&
 typeof table.triggerChance==='number'&&Number.isFinite(table.triggerChance)&&table.triggerChance>=0&&table.triggerChance<=1&&
 ['item','discover-site'].includes(table.rewardMode)&&validateResourcePool05A(table.pool);
}
function INCIDENTAlActivity(v){return INCIDENTAL_ACTIVITY_KINDS_05A.includes(v)}
export function resolveIncidentalActivity05A(table,context,rolls){
 if(!validateIncidentalTable05A(table))throw Error('INVALID_INCIDENTAL_TABLE');
 if(!rolls||![rolls.trigger,rolls.tier,rolls.output].every(validRoll))throw Error('INVALID_RANDOM_DRAW');
 if(context?.region!==table.region||context?.activity!==table.activity)return {ok:false,reason:'WRONG_ACTIVITY_REGION'};
 if(rolls.trigger>=table.triggerChance)return {ok:true,found:false,reason:'NOT_FOUND'};
 const draw=rollAvailableResourcePool05A(table.pool,context,{tierRoll:rolls.tier,outputRoll:rolls.output,mode:table.poolMode??'eligible-only'});
 if(!draw.ok)return {ok:true,found:false,reason:draw.reason};
 return draw.itemId?{ok:true,found:true,rewardMode:table.rewardMode,itemId:draw.itemId,tierId:draw.tierId}:
  {ok:true,found:false,reason:draw.reason};
}
