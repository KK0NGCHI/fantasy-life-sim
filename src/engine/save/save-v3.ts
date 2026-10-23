import type {GameStateV2,SaveEnvelopeV2} from './save-v2.js';
import type {ItemRegistry} from '../data/item-registry.js';
import type {SaveSlot} from './save-format.js';
import {decodeSaveV2} from './save-v2.js';

/** v3 has an unambiguous global clock; v2 abstract elapsedUnits is never reinterpreted. */
export interface GameStateV3 extends Omit<GameStateV2,'schemaVersion'|'clock'>{
 readonly schemaVersion:3;
 readonly clock:{readonly elapsedSeconds:number;readonly calendarId:'somnium-calendar-v1';readonly startSecondOfDay:28800};
}
export interface SaveEnvelopeV3{
 readonly format:'somnium-save';readonly saveVersion:3;
 readonly contentVersion:string;readonly slot:SaveSlot;readonly state:GameStateV3;
}
export type V3Result={readonly ok:true;readonly save:SaveEnvelopeV3}|
 {readonly ok:false;readonly reason:'INVALID_DATA'|'INCOMPATIBLE_VERSION'};
const obj=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const seconds=(x:unknown):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0&&x<=Number.MAX_SAFE_INTEGER-28800;
const keys=(x:Record<string,unknown>,allowed:readonly string[])=>Object.keys(x).every(k=>allowed.includes(k));

export function decodeSaveV3(raw:unknown,registry:ItemRegistry):V3Result{
 if(!obj(raw)||raw.format!=='somnium-save'||raw.saveVersion!==3||!obj(raw.state)||raw.state.schemaVersion!==3)return {ok:false,reason:'INCOMPATIBLE_VERSION'};
 const clock=raw.state.clock;
 if(!obj(clock)||!keys(clock,['elapsedSeconds','calendarId','startSecondOfDay'])||
  !seconds(clock.elapsedSeconds)||clock.calendarId!=='somnium-calendar-v1'||clock.startSecondOfDay!==28800)return {ok:false,reason:'INVALID_DATA'};
 if(!obj(raw.state.world)||!obj(raw.state.world.runtime)||raw.state.world.runtime.timeBasis!=='seconds-v1')return {ok:false,reason:'INVALID_DATA'};
 const source=structuredClone(raw.state) as unknown as Record<string,unknown>;
 source.schemaVersion=2;source.clock={elapsedUnits:clock.elapsedSeconds};
 // Reuse every existing item, RNG, world-root, progress and envelope validation.
 const v2=decodeSaveV2({...raw,saveVersion:2,state:source},registry);
 if(!v2.ok)return {ok:false,reason:'INVALID_DATA'};
 return {ok:true,save:structuredClone(raw) as unknown as SaveEnvelopeV3};
}
export function createSaveV3(state:GameStateV3,slot:SaveSlot,contentVersion:string,registry:ItemRegistry):SaveEnvelopeV3{
 const decoded=decodeSaveV3({format:'somnium-save',saveVersion:3,contentVersion,slot,state},registry);
 if(!decoded.ok)throw Error('Invalid v3 save: '+decoded.reason);
 return decoded.save;
}
export function parseBackupV3(text:string,registry:ItemRegistry,maxBytes=8_000_000):V3Result{
 if(typeof text!=='string'||new TextEncoder().encode(text).length>maxBytes)return {ok:false,reason:'INVALID_DATA'};
 try{return decodeSaveV3(JSON.parse(text) as unknown,registry)}catch{return {ok:false,reason:'INVALID_DATA'}}
}
export function exportBackupV3(save:SaveEnvelopeV3,registry:ItemRegistry):string{
 const result=decodeSaveV3(save,registry);if(!result.ok)throw Error('Invalid v3 backup');
 return JSON.stringify(result.save,null,2);
}
/** A legacy v2 save has NO known time conversion. Never auto-upgrade on load.
 * Only an explicit reset-to-first-day approval permits migration, and only
 * when no travel/field lifecycle needs chronological preservation.
 */
export function prepareV2ToV3Migration(raw:unknown,registry:ItemRegistry,approvedReset:boolean):
 {ok:true;state:GameStateV3}|{ok:false;reason:string}{
 const decoded=decodeSaveV2(raw,registry);
 if(!decoded.ok)return {ok:false,reason:'INVALID_V2'};
 if(!approvedReset)return {ok:false,reason:'APPROVAL_REQUIRED'};
 const old=decoded.save.state, runtime=(old.world as unknown as Record<string,unknown>).runtime as Record<string,unknown>|undefined;
 if(!runtime||runtime.travel03B&&typeof runtime.travel03B==='object'&&
  (runtime.travel03B as Record<string,unknown>).progress)return {ok:false,reason:'ACTIVE_TRAVEL'};
 if(runtime.lifecycle&&Object.keys(runtime.lifecycle as object).length||
  runtime.generatedSites&&Object.keys(runtime.generatedSites as object).length||
  runtime.siteDeltas&&Object.keys(runtime.siteDeltas as object).length)
  return {ok:false,reason:'CHRONOLOGY_REQUIRES_MANUAL_REVIEW'};
 const base=structuredClone(old);
 const {schemaVersion:_s,clock:_c,...rest}=base;
 const state:GameStateV3={...rest,schemaVersion:3,
  clock:{elapsedSeconds:0,calendarId:'somnium-calendar-v1',startSecondOfDay:28800},
  world:{...(rest.world as object),runtime:{...runtime,timeBasis:'seconds-v1',day:1,hour:8,travel03B:null}} as GameStateV3['world']};
 return {ok:true,state};
}
/** Converts only a validated, explicitly seconds-tagged transitional v2 save.
 * Does not reset its already genuine elapsed seconds.
 */
export function prepareSecondsV2ToV3(raw:unknown,registry:ItemRegistry){
 const decoded=decodeSaveV2(raw,registry);
 if(!decoded.ok)return {ok:false as const,reason:'INVALID_V2'};
 const state=decoded.save.state, runtime=(state.world as unknown as Record<string,unknown>).runtime as Record<string,unknown>|undefined;
 if(runtime?.timeBasis!=='seconds-v1')return {ok:false as const,reason:'ABSTRACT_TIME'};
 const {schemaVersion:_s,clock:_c,...rest}=structuredClone(state);
 return {ok:true as const,state:{...rest,schemaVersion:3 as const,
  clock:{elapsedSeconds:state.clock.elapsedUnits,calendarId:'somnium-calendar-v1' as const,startSecondOfDay:28800 as const}} satisfies GameStateV3};
}
