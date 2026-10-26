import type { GameAction, GameEvent } from './contracts.js';
import type { GameStateV2 } from '../save/save-v2.js';
import type { ItemRegistry } from '../data/item-registry.js';
import { validateItemWorld } from '../data/item-world.js';
import { dispatchItemAction } from './item-actions-v2.js';
import type { ItemCommand } from './item-actions-v2.js';
import { pickupWorldItem, confirmBulkDiscard } from './item-transfer-v2.js';
import type { DiscardPreview } from './item-transfer-v2.js';

export type V2Action = GameAction;
export interface V2ActionResolution {
 readonly outcome:'success'|'failed';
 readonly nextState:GameStateV2;
 readonly events:readonly GameEvent[];
}
export type V2ActionHandler = (state:Readonly<GameStateV2>,action:Readonly<GameAction>)=>V2ActionResolution;
export type V2ActionRegistry = ReadonlyMap<string,V2ActionHandler>;
export type V2DispatchResult =
 | {readonly accepted:true;readonly outcome:'success'|'failed';readonly turnsSpent:number;readonly nextState:GameStateV2;readonly events:readonly GameEvent[]}
 | {readonly accepted:false;readonly reason:'INVALID_COMMAND'|'BUSY'|'EXECUTION_ERROR';readonly turnsSpent:0;readonly detail?:string};
export interface V2Duration {readonly turns:number;readonly worldUnits:number;}
export type V2DurationPolicy=(state:Readonly<GameStateV2>,action:Readonly<GameAction>)=>V2Duration;
const record=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const positive=(x:unknown):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=1;
const nonnegative=(x:unknown):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0;
const reject=(reason:'INVALID_COMMAND'|'BUSY'|'EXECUTION_ERROR',detail?:string):V2DispatchResult=>({accepted:false,reason,turnsSpent:0,...(detail?{detail}:{})});
/** Only expose explicit gameplay-domain failure codes, never arbitrary exception messages. */
const KNOWN_GAMEPLAY_FAILURES=new Set(['DEPLETED','UNDISCOVERED','WRONG_RESOURCE_REGION','TOOL_REQUIRED','NOT_GATHERABLE','WRONG_SITE','WRONG_REGION','WRONG_ACTIVITY','NO_DISCOVERABLE_SITES','SUPPLY_NOT_READY','VEIN_REMAINS','PROSPECT_COOLDOWN','RESOURCE_HISTORY_LIMIT','SITE_STORAGE_LIMIT']);
const safeFailureDetail=(error:unknown):string|undefined=>{
 const message=error instanceof Error?error.message:null;
 return message&&KNOWN_GAMEPLAY_FAILURES.has(message)?message:undefined;
};
const validEvents=(events:unknown):events is GameEvent[]=>Array.isArray(events)&&events.every(e=>record(e)&&typeof e.type==='string'&&!!e.type&&record(e.payload));
const standardDuration:V2DurationPolicy=()=>({turns:1,worldUnits:1});

/** Single v2 action entrypoint for gameplay and UI; all gameplay handlers return UNCHARGED
 * state and the dispatcher applies the turn/world clock exactly once.
 */
export class V2ActionDispatcher {
 private busy=false;
 constructor(private readonly registry:ItemRegistry,private readonly handlers:V2ActionRegistry=new Map(),
   private readonly duration:V2DurationPolicy=standardDuration){}
 dispatch(state:GameStateV2,input:unknown):V2DispatchResult {
  if(this.busy)return reject('BUSY');
  if(!record(input)||typeof input.type!=='string'||!input.type||!record(input.payload)||
    input.actorId!==state.player.id||state.schemaVersion!==2||validateItemWorld(state.itemWorld,this.registry).length)
   return reject('INVALID_COMMAND');
  const action=input as unknown as GameAction;
  const itemAction=action.type.startsWith('item.');
  const supported=itemAction?
   ['item.move','item.consume','item.merge','item.split','item.craft','item.pickup','item.discard.confirm'].includes(action.type):
   this.handlers.has(action.type);
  if(!supported)return reject('INVALID_COMMAND');
  if(!nonnegative(state.turn)||!nonnegative(state.clock.elapsedUnits))return reject('INVALID_COMMAND');
  this.busy=true;
  try{
   let outcome:'success'|'failed', nextState:GameStateV2,events:readonly GameEvent[];
   if(itemAction){
    if(action.type==='item.discard.confirm'){
     const preview=action.payload.preview as DiscardPreview;
     const r=confirmBulkDiscard(state,preview,this.registry);
     if(!r.accepted)return reject('INVALID_COMMAND');
     ({outcome,nextState,events}=r);
    }else if(action.type==='item.pickup'){
     const r=pickupWorldItem(state,action.payload.itemId as string,action.payload.locationId as string,this.registry);
     if(!r.accepted)return reject('INVALID_COMMAND');
     outcome=r.outcome;nextState=r.nextState;
     events=[{type:r.outcome==='success'?'item.picked_up':'item.action_failed',payload:{itemId:action.payload.itemId}}];
    }else{
     const r=dispatchItemAction(state,{...action.payload,type:action.type} as ItemCommand,this.registry);
     if(!r.accepted)return reject('INVALID_COMMAND');
     ({outcome,nextState,events}=r);
    }
    // Existing item code charges a turn; strip it and let this dispatcher charge once.
    if(nextState.turn!==state.turn+1)return reject('EXECUTION_ERROR');
   }else{
    const resolved=this.handlers.get(action.type)!(structuredClone(state),structuredClone(action));
    if(!resolved||!['success','failed'].includes(resolved.outcome)||!validEvents(resolved.events))return reject('EXECUTION_ERROR');
    ({outcome,nextState,events}=resolved);
    if(nextState.turn!==state.turn)return reject('EXECUTION_ERROR');
   }
   if(nextState.schemaVersion!==2||nextState.player.id!==state.player.id||
      validateItemWorld(nextState.itemWorld,this.registry).length)return reject('EXECUTION_ERROR');
   const cost=this.duration(state,action);
   if(!positive(cost.turns)||!nonnegative(cost.worldUnits)||
      !Number.isSafeInteger(state.turn+cost.turns)||
      !Number.isSafeInteger(state.clock.elapsedUnits+cost.worldUnits))return reject('EXECUTION_ERROR');
   const committed:GameStateV2={...structuredClone(nextState),turn:state.turn+cost.turns,
     clock:{...nextState.clock,elapsedUnits:state.clock.elapsedUnits+cost.worldUnits}};
   return {accepted:true,outcome,turnsSpent:cost.turns,nextState:committed,events:structuredClone(events)};
  }catch(error){return reject('EXECUTION_ERROR',safeFailureDetail(error));}
  finally{this.busy=false;}
 }
}
