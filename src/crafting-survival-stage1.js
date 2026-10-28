/** Survival floor checks for synchronous crafting commands.
 * No HP/MP/hunger are simulated during batch duration in the existing engine.
 * This is a command-start guard, not a live per-step survival simulator.
 */
export function checkCraftSurvivalStage1(player,limits={}){
 if(!limits||typeof limits!=='object'||Array.isArray(limits)||
  Object.keys(limits).some(k=>!['minHp','minMp','minHunger'].includes(k))||
  Object.values(limits).some(v=>!Number.isFinite(v)||v<0))
  return {ok:false,reason:'INVALID_SURVIVAL_LIMIT'};
 for(const [key,stat] of [['minHp','currentHp'],['minMp','currentMp'],['minHunger','hunger']]){
  if(limits[key]!==undefined){
   if(!Number.isFinite(player?.[stat]))return {ok:false,reason:'SURVIVAL_STATUS_UNAVAILABLE'};
   if(player[stat]<limits[key])return {ok:false,reason:'SURVIVAL_LIMIT_REACHED',stat};
  }
 }
 return {ok:true};
}
