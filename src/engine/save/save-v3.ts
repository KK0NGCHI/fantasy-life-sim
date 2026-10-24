import {buildWorldRegistry} from '../world/world-model.js';
import {SOMNIUM_WORLD_03A} from '../world/somnium-world.js';
import {validateWorldSnapshot03E} from '../world/world-persistence-03e.js';
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

/** 04-D: validate optional progression/origin BEFORE v3 decode accepts a save.
 * Legacy saves without these extensions remain valid and unmodified. */
const attrKeys=['근력','민첩','체력','지각','지능','의지','매력'] as const;
const skillKeys=Array.from({length:54},(_,i)=>'skill-'+String(i+1).padStart(2,'0'));
const speciesSizes:Readonly<Record<string,string>>={
 human:'medium',elf:'medium',dwarf:'medium',halfling:'small',
 beastfolk:'medium',orc:'medium',gnome:'small',fairy:'tiny'
};
const backgrounds=new Set(['farmer','fisher','miner','woodcutter','hunter','cook','artisan','alchemist',
 'scholar','archaeologist','merchant','traveler','mercenary','healer','acolyte','musician']);
const uint=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const exact=(value:Record<string,unknown>,names:readonly string[])=>
 Object.keys(value).length===names.length&&names.every(k=>Object.hasOwn(value,k));
function validProgressionExtension(progression:unknown):boolean{
 if(!obj(progression))return false;
 if(Object.hasOwn(progression,'system04A')){
  const x=progression.system04A;
  if(!obj(x)||!exact(x,['schema','ruleVersion','attributes','training','skills','awards'])||
   x.schema!==1||x.ruleVersion!==1||!obj(x.attributes)||!obj(x.training)||!obj(x.skills)||
   !exact(x.attributes,attrKeys)||!exact(x.training,attrKeys)||!exact(x.skills,skillKeys)||
   !attrKeys.every(k=>uint((x.attributes as Record<string,unknown>)[k])&&Number((x.attributes as Record<string,unknown>)[k])>=10&&uint((x.training as Record<string,unknown>)[k]))||
   !skillKeys.every(k=>uint((x.skills as Record<string,unknown>)[k]))||!Array.isArray(x.awards)||x.awards.length>10000||
   !x.awards.every(a=>typeof a==='string'&&a.length>0&&a.length<=160)||
   new Set(x.awards).size!==x.awards.length)return false;
 }
 if(Object.hasOwn(progression,'origin04B')){
  const o=progression.origin04B;
  if(!obj(o)||!exact(o,['schema','speciesId','backgroundId','bodySize','exclusiveAbilityId'])||
   o.schema!==1||typeof o.speciesId!=='string'||typeof o.backgroundId!=='string'||
   !backgrounds.has(o.backgroundId)||speciesSizes[o.speciesId]!==o.bodySize||
   o.exclusiveAbilityId!=='origin:'+o.backgroundId||!Object.hasOwn(progression,'system04A'))return false;
 }
 return true;
}

/** 05-A opt-in resource state. Validate before a save is accepted or applied.
 * No resource data is synthesized for legacy slots. */
const resourceCaps05A:Readonly<Record<string,number>>={
 'resource05a:wild-herb':5,'resource05a:mushroom':4,'resource05a:grass':8,
 'resource05a:oak-log':5,'resource05a:pine-log':4,'resource05a:stone':12,
 'resource05a:coal':10,'resource05a:copper-ore':12,'resource05a:iron-ore':10,
 'resource05a:small-fish':12,'resource05a:carp':8,'resource05a:trout':6
};
const candidateCaps05A:Readonly<Record<string,number>>={
 'source05a:blueberry':4,'source05a:reed':5,'source05a:quartz':3,
 'source05a:mussel':4,'source05a:marsh-bell':2,'source05a:sacred-oak':1
};
function validCandidates05A(x:Record<string,unknown>):boolean{
 if(!keys(x,['schema','nodes','candidateSites','compendium']))return false;
 if(Object.hasOwn(x,'candidateSites')){
  if(!obj(x.candidateSites)||Object.keys(x.candidateSites).length>100)return false;
  if(!Object.entries(x.candidateSites).every(([id,v])=>obj(v)&&keys(v,['sourceId','region','remaining','discovered'])&&
   id.startsWith('site05a:')&&id.length<=140&&typeof v.sourceId==='string'&&
   Object.hasOwn(candidateCaps05A,v.sourceId)&&typeof v.region==='string'&&v.region.length<=50&&
   uint(v.remaining)&&Number(v.remaining)<=candidateCaps05A[v.sourceId]&&typeof v.discovered==='boolean'))return false;
 }
 if(Object.hasOwn(x,'compendium')){
  if(!obj(x.compendium)||!keys(x.compendium,['sourceIds','itemIds'])||
   !Array.isArray(x.compendium.sourceIds)||!Array.isArray(x.compendium.itemIds))return false;
  if(x.compendium.sourceIds.length>300||x.compendium.itemIds.length>300)return false;
  if(!x.compendium.sourceIds.every((v:unknown)=>typeof v==='string'&&v.length<140)||
   !x.compendium.itemIds.every((v:unknown)=>typeof v==='string'&&v.length<140))return false;
 }
 return true;
}
function validResource05A(runtime:Record<string,unknown>,now:number):boolean{
 if(!Object.hasOwn(runtime,'resource05A'))return true;
 const x=runtime.resource05A;
 if(!obj(x)||!validCandidates05A(x)||x.schema!==1||!obj(x.nodes)||Object.keys(x.nodes).length>6000)return false;
 return Object.entries(x.nodes).every(([key,value])=>{
  if(!obj(value)||!keys(value,['resourceId','remaining','progress','lastSecond','recoveryProgress','discovered','cycle']))return false;
  const cap=resourceCaps05A[String(value.resourceId)];
  return typeof cap==='number'&&Number.isSafeInteger(cap)&&key.startsWith(String(value.resourceId)+':')&&key.length<=140&&
   uint(value.remaining)&&Number(value.remaining)<=cap&&uint(value.progress)&&Number(value.progress)<=200&&
   uint(value.lastSecond)&&Number(value.lastSecond)<=now&&
   uint(value.recoveryProgress)&&Number(value.recoveryProgress)<60*86400&&
   typeof value.discovered==='boolean'&&uint(value.cycle);
 });
}

export function decodeSaveV3(raw:unknown,registry:ItemRegistry):V3Result{
 if(!obj(raw)||raw.format!=='somnium-save'||raw.saveVersion!==3||!obj(raw.state)||raw.state.schemaVersion!==3)return {ok:false,reason:'INCOMPATIBLE_VERSION'};
 const clock=raw.state.clock;
 if(!obj(clock)||!keys(clock,['elapsedSeconds','calendarId','startSecondOfDay'])||
  !seconds(clock.elapsedSeconds)||clock.calendarId!=='somnium-calendar-v1'||clock.startSecondOfDay!==28800)return {ok:false,reason:'INVALID_DATA'};
 if(!obj(raw.state.world)||!obj(raw.state.world.runtime)||raw.state.world.runtime.timeBasis!=='seconds-v1')return {ok:false,reason:'INVALID_DATA'};
 // Existing v3 saves without world03E remain valid and are never silently converted.
 // When present, the complete generated map snapshot is validated before any restore.
 if(Object.hasOwn(raw.state.world.runtime,'world03E')){
  const built=buildWorldRegistry(SOMNIUM_WORLD_03A);
  if(!built.ok||validateWorldSnapshot03E(raw.state.world.runtime.world03E,built.registry).length)
   return {ok:false,reason:'INVALID_DATA'};
 }
 if(!validResource05A(raw.state.world.runtime,clock.elapsedSeconds as number))return {ok:false,reason:'INVALID_DATA'};
 if(!validProgressionExtension(raw.state.progression))return {ok:false,reason:'INVALID_DATA'};
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
  world:{...(rest.world as object),runtime:{...runtime,timeBasis:'seconds-v1',day:1,hour:8,travel03B:null}} as unknown as GameStateV3['world']};
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
