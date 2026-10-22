import type { GameState } from '../core/contracts.js';
import type { GameStateV2, SaveEnvelopeV2 } from './save-v2.js';
import { createSaveV2,decodeSaveV2,migrateV1ToV2 } from './save-v2.js';
import type { SaveEnvelope,SaveSlot } from './save-format.js';
import {decodeSave} from './save-format.js';
import type {ItemRegistry} from '../data/item-registry.js';
import {IndexedDbSavesV2} from './indexeddb-v2.js';

export type LoadPreparation =
 | {readonly ok:true;readonly state:GameStateV2;readonly originalVersion:1|2}
 | {readonly ok:false;readonly reason:string};

/** Pure preflight; neither existing live state nor original save is modified. */
export function prepareV2Load(input:unknown,registry:ItemRegistry):LoadPreparation{
 const v2=decodeSaveV2(input,registry);
 if(v2.ok)return {ok:true,state:v2.save.state,originalVersion:2};
 const v1=decodeSave(input);
 if(!v1.ok)return {ok:false,reason:'Invalid or unsupported save version'};
 const converted=migrateV1ToV2(v1.save.state,registry);
 return converted.ok?{ok:true,state:converted.state,originalVersion:1}:
  {ok:false,reason:'Legacy item definitions are missing or incompatible'};
}
/** Avoid silently committing a legacy save. Ask the user to approve migration before saveAsV2. */
export class V2SaveSession {
 private current:GameStateV2;
 private revision:number|null=null;
 constructor(initial:GameStateV2,private readonly registry:ItemRegistry,
   private readonly store:IndexedDbSavesV2=new IndexedDbSavesV2(registry)) {
  if(!decodeSaveV2({format:'somnium-save',saveVersion:2,contentVersion:'runtime',slot:
  {slotId:'validation',worldId:'validation',kind:'manual',label:'',savedAt:'2000-01-01T00:00:00Z',revision:0},
   state:initial},registry).ok)throw new Error('Invalid initial v2 state');
  this.current=structuredClone(initial);
 }
 state():GameStateV2{return structuredClone(this.current);}
 /** Used only after explicit load/migration confirmation in the UI. */
 replaceAfterApproval(prepared:LoadPreparation,approved:boolean):boolean{
  if(!approved||!prepared.ok)return false;
  this.current=structuredClone(prepared.state);this.revision=null;return true;
 }
 update(next:GameStateV2):void{
  const probe=createSaveV2(next,{slotId:'validation',worldId:'validation',kind:'manual',label:'',savedAt:'2000-01-01T00:00:00Z',revision:0},'runtime',this.registry);
  this.current=probe.state;
 }
 async save(slot:SaveSlot,contentVersion:string,expectedRevision:number|null=this.revision):Promise<SaveEnvelopeV2>{
  const snapshot=createSaveV2(this.current,slot,contentVersion,this.registry);
  const saved=await this.store.commit(snapshot,expectedRevision);
  this.revision=saved.slot.revision;return saved;
 }
 async loadCandidate(slotId:string):Promise<LoadPreparation>{
  const save=await this.store.loadLatest(slotId);
  return save?prepareV2Load(save,this.registry):{ok:false,reason:'No save in slot'};
 }
 async recoverable(slotId:string){return this.store.listRevisions(slotId);}
}
/** Note: the v1 original stays in its own DB. Export backup before migration is recommended. */
export function prepareLegacyGameState(input:GameState,registry:ItemRegistry):LoadPreparation{
 const v=migrateV1ToV2(input,registry);
 return v.ok?{ok:true,state:v.state,originalVersion:1}:{ok:false,reason:'Legacy item validation failed'};
}
