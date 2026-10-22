import type { GameState } from '../core/contracts.js';

export type SaveKind = 'manual' | 'quick' | 'auto';
export interface SaveSlot {
  readonly slotId: string;
  readonly worldId: string;
  readonly kind: SaveKind;
  readonly label: string;
  readonly savedAt: string;
  readonly revision: number;
}
export interface SaveEnvelope {
  readonly format: 'somnium-save';
  readonly saveVersion: 1;
  readonly contentVersion: string;
  readonly slot: SaveSlot;
  readonly state: GameState;
}
export type DecodeResult =
  | { readonly ok: true; readonly save: SaveEnvelope }
  | { readonly ok: false; readonly reason: 'INVALID_DATA' | 'INCOMPATIBLE_VERSION' };

const obj=(x:unknown): x is Record<string,unknown> => x!==null && typeof x==='object' && !Array.isArray(x);
const str=(x:unknown):x is string=>typeof x==='string'&&x.trim().length>0;
const uint=(x:unknown):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0;
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
function checkState(x: unknown): x is GameState {
 if(!obj(x)||x.schemaVersion!==1||!uint(x.turn)||!obj(x.clock)||!uint(x.clock.elapsedUnits))return false;
 if(!obj(x.rng)||!str(x.rng.algorithm)||!str(x.rng.seed)||!Array.isArray(x.rng.state)||!x.rng.state.every(uint))return false;
 if(!obj(x.player)||!str(x.player.id)||!str(x.player.regionId)||!finite(x.player.currentHp)||!finite(x.player.currentMp)||!finite(x.player.hunger)||!Array.isArray(x.player.statusEffects))return false;
 if(!x.player.statusEffects.every((e:unknown)=>obj(e)&&str(e.id)&&str(e.definitionId)&&(e.remainingTurns===null||uint(e.remainingTurns))))return false;
 if(!obj(x.inventory)||!Array.isArray(x.inventory.items)||!x.inventory.items.every((i:unknown)=>obj(i)&&str(i.id)&&str(i.definitionId)&&uint(i.quantity)&&i.quantity>0))return false;
 if(new Set(x.inventory.items.map((i: {id:string})=>i.id)).size!==x.inventory.items.length)return false;
 if(!obj(x.world)||!str(x.world.activeRegionId)||!obj(x.progression)||!obj(x.progression.skillExperience)||!obj(x.flags))return false;
 if(Object.values(x.progression.skillExperience).some(v=>!finite(v))||Object.values(x.flags).some(v=>typeof v!=='boolean'))return false;
 return true;
}
export function decodeSave(raw:unknown):DecodeResult {
 if(!obj(raw))return {ok:false,reason:'INVALID_DATA'};
 if(raw.format!=='somnium-save'||raw.saveVersion!==1||!obj(raw.state)||raw.state.schemaVersion!==1)
  return {ok:false,reason:'INCOMPATIBLE_VERSION'};
 if(!obj(raw.slot)||!str(raw.slot.slotId)||!str(raw.slot.worldId)||!['manual','quick','auto'].includes(String(raw.slot.kind))||
    typeof raw.slot.label!=='string'||!str(raw.slot.savedAt)||!uint(raw.slot.revision)||
    !str(raw.contentVersion)||!checkState(raw.state))return {ok:false,reason:'INVALID_DATA'};
 // Reject unknown top-level state keys to avoid silently losing future item-instance fields.
 if(Object.keys(raw.state).some(k=>!['schemaVersion','turn','clock','rng','player','inventory','world','progression','flags'].includes(k)))return {ok:false,reason:'INCOMPATIBLE_VERSION'};
 return {ok:true,save:structuredClone(raw) as unknown as SaveEnvelope};
}
export function createSave(state:GameState,slot:SaveSlot,contentVersion:string):SaveEnvelope {
 const data={format:'somnium-save',saveVersion:1,contentVersion,slot,state} as const;
 const result=decodeSave(data);
 if(!result.ok)throw new Error('Invalid save: '+result.reason);
 return result.save;
}
export function parseBackup(text:string,maxBytes=8_000_000):DecodeResult {
 if(typeof text!=='string'||text.length>maxBytes)return {ok:false,reason:'INVALID_DATA'};
 try{return decodeSave(JSON.parse(text) as unknown);}catch{return {ok:false,reason:'INVALID_DATA'};}
}
export function exportBackup(save:SaveEnvelope):string {
 const result=decodeSave(save);if(!result.ok)throw new Error('Cannot export invalid save');
 return JSON.stringify(result.save,null,2);
}
/** Never replace live state until the entire candidate is valid and user approves. */
export function prepareLoad(candidate:unknown,current:GameState):{readonly ok:true;readonly nextState:GameState}|{readonly ok:false;readonly reason:string;readonly unchanged:GameState}{
 const result=decodeSave(candidate);
 return result.ok?{ok:true,nextState:result.save.state}:{ok:false,reason:result.reason,unchanged:current};
}
