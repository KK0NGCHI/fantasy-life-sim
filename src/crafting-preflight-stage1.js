import {craftBatch1} from './crafting-batch-stage1.js';
import {checkWorkshopStage1,craftUntilStage1} from './crafting-workshop-stage1.js';
import {checkCraftSurvivalStage1} from './crafting-survival-stage1.js';

/** Shared no-write action preview. Match exactly the dispatcher policies.
 * A completed count is a forecast, not a committed action.
 */
export function previewWorkshopActionStage1(state,request){
 const {recipeId,count,mode='atomic',choices={},stackChoices={},policy={},survivalLimits={},survivalDelta={}}=request??{};
 const access=checkWorkshopStage1(state?.world?.runtime,recipeId);
 if(!access.ok)return access;
 if(mode==='until'){
  const guard=checkCraftSurvivalStage1(state?.player,survivalLimits);
  if(!guard.ok)return guard;
  const outcome=craftUntilStage1(state.itemWorld,state.player.id,recipeId,count,
   choices,stackChoices,policy,state.player,survivalLimits,survivalDelta);
  return outcome.ok?{ok:true,completed:outcome.completed,requested:count,seconds:outcome.seconds,
   stopReason:outcome.stopReason}:outcome;
 }
 if(mode!=='atomic')return {ok:false,reason:'INVALID_REPEAT_POLICY'};
 const outcome=craftBatch1(state.itemWorld,state.player.id,recipeId,count,choices,stackChoices);
 return outcome.ok?{ok:true,completed:count,requested:count,seconds:outcome.seconds,stopReason:null}:outcome;
}
