import {checkCraftSurvivalStage1} from './crafting-survival-stage1.js';
/** Optional explicitly chosen change per completed craft. No implicit survival
 * drain rate: the game design has not established a time-based metabolism rule.
 * Negative means spending the stat, positive means gaining it.
 */
export function advanceCraftSurvivalStage1(player,delta={},limits={}){
 if(!delta||typeof delta!=='object'||Array.isArray(delta)||
  Object.keys(delta).some(k=>!['hp','mp','hunger'].includes(k))||
  Object.values(delta).some(n=>!Number.isFinite(n)||n>0||n< -1000))
  return {ok:false,reason:'INVALID_SURVIVAL_DELTA'};
 const before=checkCraftSurvivalStage1(player,limits);
 if(!before.ok)return before;
 const next={...player};
 for(const [field,key] of [['currentHp','hp'],['currentMp','mp'],['hunger','hunger']]){
  const value=delta[key]??0;
  if(!Number.isFinite(next[field])||!Number.isFinite(next[field]+value)||next[field]+value<0)
   return {ok:false,reason:'SURVIVAL_STATUS_UNAVAILABLE'};
  next[field]+=value;
 }
 return {ok:true,player:next};
}
