/** Generic conditional resource tables. No content species or drop rates are shipped here.
 * Immutable configuration; pure evaluation and deterministic caller-supplied RNG.
 * Spawn, availability, harvest output and replenishment remain separate decisions.
 */
const SEASONS=['spring','summer','autumn','winter'];
const DAYPARTS=['dawn','day','dusk','night'];
const WEATHER=['clear','rain','snow','fog','storm'];
const finitePositive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function validConditions(c){
 if(c===undefined)return true;
 if(!record(c))return false;
 const fields={regions:null,seasons:SEASONS,dayparts:DAYPARTS,weather:WEATHER};
 return Object.keys(c).every(k=>Object.hasOwn(fields,k)&&Array.isArray(c[k])&&
 c[k].length>0&&new Set(c[k]).size===c[k].length&&c[k].every(v=>typeof v==='string'&&v.length>0&&(!fields[k]||fields[k].includes(v))));
}
export function matchesResourceConditions05A(conditions,context){
 if(!validConditions(conditions))throw Error('INVALID_RESOURCE_CONDITIONS');
 if(conditions===undefined)return true;
 return Object.entries(conditions).every(([field,allowed])=>{
  const v=field==='regions'?context?.region:field==='seasons'?context?.season:field==='dayparts'?context?.daypart:context?.weather;
  return typeof v==='string'&&allowed.includes(v);
 });
}
/** A pool contains tier-weighted and item-weighted probability distributions.
 * Missing matches do not redistribute weight to other tiers: no output is returned.
 * This prevents a seasonal rarity tier silently becoming 100% common loot.
 */
export function validateResourcePool05A(pool){
 if(!record(pool)||typeof pool.id!=='string'||!pool.id||!validConditions(pool.spawnConditions)||
 !validConditions(pool.harvestConditions)||!record(pool.regenerationPolicy)||
 !['none','fixed','prospect'].includes(pool.regenerationPolicy.kind)||
 !['persist','despawn','dormant'].includes(pool.disappearancePolicy)||!Array.isArray(pool.tiers)||pool.tiers.length===0||pool.tiers.length>30)return false;
 if(pool.regenerationPolicy.kind==='fixed'&&(!Number.isSafeInteger(pool.regenerationPolicy.intervalSeconds)||pool.regenerationPolicy.intervalSeconds<1||
 !Number.isSafeInteger(pool.regenerationPolicy.units)||pool.regenerationPolicy.units<1))return false;
 if(pool.regenerationPolicy.kind==='prospect'&&(!Number.isSafeInteger(pool.regenerationPolicy.attemptSeconds)||pool.regenerationPolicy.attemptSeconds<1))return false;
 const ids=new Set();
 return pool.tiers.every(t=>{
  if(!record(t)||typeof t.id!=='string'||!t.id||ids.has(t.id)||!finitePositive(t.weight)||
 !Array.isArray(t.outputs)||t.outputs.length===0||t.outputs.length>1000)return false;
  ids.add(t.id);
  const itemIds=new Set();
  return t.outputs.every(o=>record(o)&&typeof o.itemId==='string'&&o.itemId.length>0&&!itemIds.has(o.itemId)&&
   finitePositive(o.weight)&&validConditions(o.conditions)&& (itemIds.add(o.itemId),true));
 });
}
function weighted(items,roll){
 const total=items.reduce((n,x)=>n+x.weight,0);
 let pos=roll*total;
 for(const item of items){pos-=item.weight;if(pos<0)return item;}
 return items.at(-1);
}
const validRoll=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<1;
/** Two independent rolls: tierRoll, outputRoll. output may be null for unavailable
 * seasonal item; never reroll restricted entries into an available rarity. */
export function rollResourcePool05A(pool,context,{tierRoll,outputRoll}={}){
 if(!validateResourcePool05A(pool))throw Error('INVALID_RESOURCE_POOL');
 if(!validRoll(tierRoll)||!validRoll(outputRoll))throw Error('INVALID_RANDOM_DRAW');
 if(!matchesResourceConditions05A(pool.spawnConditions,context)||!matchesResourceConditions05A(pool.harvestConditions,context))
  return {ok:false,reason:'CONDITIONS_UNMET'};
 const tier=weighted(pool.tiers,tierRoll);
 const output=weighted(tier.outputs,outputRoll);
 if(!matchesResourceConditions05A(output.conditions,context))
  return {ok:true,itemId:null,tierId:tier.id,reason:'OUTPUT_UNAVAILABLE'};
 return {ok:true,tierId:tier.id,itemId:output.itemId};
}
/** Calculate actual unconditional outcome probabilities for a context.
 * Invalid conditions retain their probability in the no-drop bucket. */
export function resourcePoolProbabilities05A(pool,context){
 if(!validateResourcePool05A(pool))throw Error('INVALID_RESOURCE_POOL');
 if(!matchesResourceConditions05A(pool.spawnConditions,context)||!matchesResourceConditions05A(pool.harvestConditions,context))return {items:{},none:1};
 const tierTotal=pool.tiers.reduce((a,t)=>a+t.weight,0),items={};
 let none=0;
 for(const t of pool.tiers){
  const itemTotal=t.outputs.reduce((a,o)=>a+o.weight,0);
  for(const o of t.outputs){
   const p=t.weight/tierTotal*o.weight/itemTotal;
   if(matchesResourceConditions05A(o.conditions,context))items[o.itemId]=(items[o.itemId]??0)+p;
   else none+=p;
  }
 }
 return {items,none};
}
