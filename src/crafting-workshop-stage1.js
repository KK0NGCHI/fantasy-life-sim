import {advanceCraftSurvivalStage1} from './crafting-survival-progress-stage1.js';
import {REFINING_BY_ID_05H} from './mineral-refining-05h.js';
import {craftBatch1,CRAFTING_BATCH_LIMIT_1} from './crafting-batch-stage1.js';

/** Workshop access is a world rule, not a recipe-name/UI heuristic. */
export const STATIONS_STAGE1=Object.freeze({
 furnace:Object.freeze({region:'거점 마을',label:'공용 용광로'}),
 workbench:Object.freeze({region:'거점 마을',label:'공용 작업대'})
});
export function checkWorkshopStage1(runtime,recipeId){
 const recipe=REFINING_BY_ID_05H.get(recipeId);
 if(!recipe)return {ok:false,reason:'UNKNOWN_RECIPE'};
 const station=STATIONS_STAGE1[recipe.station];
 if(!station)return {ok:false,reason:'UNKNOWN_STATION'};
 if(runtime?.dungeon||runtime?.region!==station.region)return {ok:false,reason:'WORKSTATION_REQUIRED'};
 return {ok:true,stationId:recipe.station,recipe};
}
/** Bounded synchronous auto-repeat. Each completed craft is real, partial completion
 * is retained when ingredients run out. No extra time for the blocked attempt.
 * This is NOT a background job and requires one explicit player command.
 */
export function craftUntilStage1(world,ownerId,recipeId,count,choices={},stackChoices={},policy={},player=null,survivalLimits={},survivalDelta={}){
 if(!Number.isSafeInteger(count)||count<1||count>CRAFTING_BATCH_LIMIT_1)
  return {ok:false,reason:'INVALID_BATCH_COUNT',completed:0};
 if(!policy||typeof policy!=='object'||Array.isArray(policy)||
  Object.keys(policy).some(k=>k!=='maxSeconds')||
  (policy.maxSeconds!==undefined&&(!Number.isSafeInteger(policy.maxSeconds)||policy.maxSeconds<1||policy.maxSeconds>86400)))
  return {ok:false,reason:'INVALID_REPEAT_POLICY',completed:0};
 const recipe=REFINING_BY_ID_05H.get(recipeId);
 if(!recipe)return {ok:false,reason:'UNKNOWN_RECIPE',completed:0};
 if(!Number.isSafeInteger(recipe.seconds)||recipe.seconds<1)
  return {ok:false,reason:'INVALID_RECIPE',completed:0};
 let current=world,completed=0,blockedBy=null,activePlayer=player;
 if(player!==null){const check=advanceCraftSurvivalStage1(player,{},survivalLimits);if(!check.ok)return {...check,completed:0};}
 for(let i=0;i<count;i++){
  if(policy.maxSeconds!==undefined&&recipe.seconds*(completed+1)>policy.maxSeconds){
   blockedBy='TIME_BUDGET_REACHED';break;
  }
  if(activePlayer!==null){
   const check=advanceCraftSurvivalStage1(activePlayer,{},survivalLimits);
   if(!check.ok){blockedBy=check.reason;break;}
  }
  const next=craftBatch1(current,ownerId,recipeId,1,choices,stackChoices);
  if(!next.ok){blockedBy=next.reason;break;}
  if(activePlayer!==null){
   const change=advanceCraftSurvivalStage1(activePlayer,survivalDelta,{});
   if(!change.ok){blockedBy=change.reason;break;}
   activePlayer=change.player;
  }
  current=next.itemWorld;completed++;
 }
 if(completed===0)return {ok:false,reason:blockedBy,completed:0};
 const seconds=recipe.seconds*completed;
 if(!Number.isSafeInteger(seconds))return {ok:false,reason:'INVALID_RECIPE',completed:0};
 return {ok:true,itemWorld:current,recipe,completed,requested:count,
  stopReason:blockedBy,seconds,...(activePlayer!==null?{player:activePlayer}:{})};
}
