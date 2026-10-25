/** Device-local preferences. Not part of any game save or migration. */
export const AUTO_POLICY_KEY='somnium:autosave-policy:v1';
export const DEFAULT_AUTO_POLICY=Object.freeze({everyActions:20,eventTypes:['world.travelled','dungeon.entered','dungeon.left']});
export function validateAutoPolicy(x){
 return x&&Number.isSafeInteger(x.everyActions)&&x.everyActions>=1&&x.everyActions<=100000
  &&Array.isArray(x.eventTypes)&&x.eventTypes.length<=32
  &&x.eventTypes.every(e=>typeof e==='string'&&e.length>0&&e.length<=128);
}
export function readAutoPolicy(storage){
 try{
  const raw=storage?.getItem(AUTO_POLICY_KEY);
  if(!raw)return {...DEFAULT_AUTO_POLICY,eventTypes:[...DEFAULT_AUTO_POLICY.eventTypes]};
  const parsed=JSON.parse(raw);
  if(!validateAutoPolicy(parsed))throw Error('Invalid preferences');
  return {everyActions:parsed.everyActions,eventTypes:[...parsed.eventTypes]};
 }catch{return {...DEFAULT_AUTO_POLICY,eventTypes:[...DEFAULT_AUTO_POLICY.eventTypes]};}
}
export function writeAutoPolicy(storage,policy){
 if(!validateAutoPolicy(policy))throw RangeError('Invalid autosave policy');
 storage?.setItem(AUTO_POLICY_KEY,JSON.stringify({everyActions:policy.everyActions,eventTypes:[...policy.eventTypes]}));
}
