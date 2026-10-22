import type {FieldLifecyclePolicy,SiteLifecycleState} from './world-model.js';
const positive=(v:number)=>Number.isSafeInteger(v)&&v>=0;
export function createSiteLifecycle(siteId:string,policy:FieldLifecyclePolicy,createdAt:number,generationIndex=0):SiteLifecycleState{
 if(!siteId||!positive(createdAt)||!positive(generationIndex))throw RangeError('Invalid lifecycle inputs');
 return {siteId,generationIndex,createdAt,status:'active',
  expiresAt:policy.kind==='temporary'?createdAt+(policy.lifetimeUnits??0):null,
  renewAt:policy.kind==='renewable'?createdAt+(policy.renewalUnits??0):
   policy.kind==='repeatable'?createdAt+(policy.regenerationUnits??0):null};
}
export type LifecycleTransition=
 | {readonly state:SiteLifecycleState;readonly action:'none'|'defer'|'renew'|'regenerate'|'expire'};
/** Only game world units count; never Date.now(). Current/quest-protected sites never vanish. */
export function advanceSiteLifecycle(
 state:SiteLifecycleState,policy:FieldLifecyclePolicy,now:number,
 protectedSite:boolean,playerInside:boolean
):LifecycleTransition{
 if(!positive(now)||now<state.createdAt)throw RangeError('Invalid world clock');
 if(state.status==='expired')return {state,action:'none'};
 if(policy.kind==='permanent')return {state,action:'none'};
 if(policy.kind==='temporary'){
  if(state.expiresAt===null||now<state.expiresAt)return {state,action:'none'};
  if(protectedSite||playerInside)return {state:{...state,status:'expiration_pending'},action:'defer'};
  return {state:{...state,status:'expired'},action:'expire'};
 }
 if(state.renewAt===null||now<state.renewAt)return {state,action:'none'};
 if(protectedSite||playerInside)return {state,action:'defer'};
 const step=policy.kind==='renewable'?policy.renewalUnits:policy.regenerationUnits;
 if(!step||!Number.isSafeInteger(step)||step<=0)throw RangeError('Invalid recurrence');
 // Anchor to the original schedule: visiting cannot reset the clock.
 const windows=Math.floor((now-state.renewAt)/step)+1;
 const next=state.renewAt+windows*step;
 if(!Number.isSafeInteger(next))throw RangeError('World clock overflow');
 return {action:policy.kind==='renewable'?'renew':'regenerate',
  state:{...state,renewAt:next,generationIndex:policy.kind==='repeatable'?state.generationIndex+windows:state.generationIndex}};
}
