import type {GameAction,GameEvent} from './contracts.js';
import type {ItemRegistry} from '../data/item-registry.js';
import type {GameStateV2} from '../save/save-v2.js';
import type {GameStateV3} from '../save/save-v3.js';
import {V2ActionDispatcher} from './v2-dispatch.js';
import type {V2ActionHandler,V2ActionRegistry} from './v2-dispatch.js';
import {actionSeconds} from '../world/action-seconds.js';

export interface V3Duration {readonly turns:number;readonly elapsedSeconds:number}
export type V3DurationPolicy=(state:Readonly<GameStateV3>,action:Readonly<GameAction>)=>V3Duration;
export type V3DispatchResult=
 | {readonly accepted:true;readonly outcome:'success'|'failed';readonly turnsSpent:number;readonly nextState:GameStateV3;readonly events:readonly GameEvent[]}
 | {readonly accepted:false;readonly reason:'INVALID_COMMAND'|'BUSY'|'EXECUTION_ERROR';readonly turnsSpent:0};
const standardDuration:V3DurationPolicy=(_state,action)=>({turns:1,elapsedSeconds:actionSeconds(action.type)});
const toV2=(state:GameStateV3):GameStateV2=>{
 const {schemaVersion:_s,clock,...rest}=structuredClone(state);
 return {...rest,schemaVersion:2,clock:{elapsedUnits:clock.elapsedSeconds}};
};
const toV3=(state:GameStateV2):GameStateV3=>{
 const {schemaVersion:_s,clock,...rest}=structuredClone(state);
 return {...rest,schemaVersion:3,clock:{elapsedSeconds:clock.elapsedUnits,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}};
};
/** Native v3 contract, reusing battle-tested v2 action handlers and item rules.
 * Handler writes are uncharged. This façade applies seconds and turns once
 * and never mutates rejected input. The old elapsedUnits field cannot enter
 * through the public v3 state type.
 */
export class V3ActionDispatcher{
 private readonly dispatcher:V2ActionDispatcher;
 constructor(registry:ItemRegistry,handlers:V2ActionRegistry=new Map(),duration:V3DurationPolicy=standardDuration){
  this.dispatcher=new V2ActionDispatcher(registry,handlers,(legacy,action)=>{
   const cost=duration(toV3(legacy),action);
   return {turns:cost.turns,worldUnits:cost.elapsedSeconds};
  });
 }
 dispatch(state:GameStateV3,action:unknown):V3DispatchResult{
  const runtime=(state?.world as unknown as Record<string,unknown>|undefined)?.runtime;
  if(!state||state.schemaVersion!==3||!state.clock||
   state.clock.calendarId!=='somnium-calendar-v1'||state.clock.startSecondOfDay!==28800||
   !Number.isSafeInteger(state.clock.elapsedSeconds)||state.clock.elapsedSeconds<0||
   state.clock.elapsedSeconds>Number.MAX_SAFE_INTEGER-28800||
   !runtime||typeof runtime!=='object'||(runtime as Record<string,unknown>).timeBasis!=='seconds-v1')
   return {accepted:false,reason:'INVALID_COMMAND',turnsSpent:0};
  const result=this.dispatcher.dispatch(toV2(state),action);
  if(!result.accepted)return result;
  return {...result,nextState:toV3(result.nextState)};
 }
}
