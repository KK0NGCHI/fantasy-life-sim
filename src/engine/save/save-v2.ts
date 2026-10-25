import type { GameState } from '../core/contracts.js';
import type { ItemWorldSnapshot } from '../data/item-world.js';
import type { ItemRegistry, ValidationIssue } from '../data/item-registry.js';
import { validateItemWorld } from '../data/item-world.js';
import type { SaveSlot } from './save-format.js';

/** v2 stores the complete item world once, not a duplicated legacy inventory. */
export interface GameStateV2 extends Omit<GameState, 'schemaVersion' | 'inventory'> {
 readonly schemaVersion: 2;
 readonly itemWorld: ItemWorldSnapshot;
}
export interface SaveEnvelopeV2 {
 readonly format: 'somnium-save';
 readonly saveVersion: 2;
 readonly contentVersion: string;
 readonly slot: SaveSlot;
 readonly state: GameStateV2;
}
export type V2Result = {readonly ok:true; readonly save:SaveEnvelopeV2} |
 {readonly ok:false;readonly reason:'INVALID_DATA'|'INCOMPATIBLE_VERSION';readonly issues?:readonly ValidationIssue[]};
const rec=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const id=(x:unknown):x is string=>typeof x==='string'&&x.trim().length>0;
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const uint=(x:unknown):x is number=>Number.isSafeInteger(x)&&typeof x==='number'&&x>=0;
const keys=(x:Record<string,unknown>,allowed:readonly string[])=>Object.keys(x).every(k=>allowed.includes(k));
/** Deep-enough authoritative state validation for save v2 (not a gameplay balance validator). */
function validV2State(x:unknown):x is GameStateV2 {
 if(!rec(x)||x.schemaVersion!==2||!uint(x.turn)||!keys(x,['schemaVersion','turn','clock','rng','player','itemWorld','world','progression','flags']))return false;
 if(!rec(x.clock)||!uint(x.clock.elapsedUnits)||!keys(x.clock,['elapsedUnits']))return false;
 if(!rec(x.rng)||x.rng.algorithm!=='xorshift32-two-stream-v1'||!id(x.rng.seed)||
  !Array.isArray(x.rng.state)||x.rng.state.length!==2||!x.rng.state.every((s:unknown)=>uint(s)&&s>0&&s<=0xffffffff))return false;
 if(!rec(x.player)||!id(x.player.id)||!id(x.player.regionId)||!finite(x.player.currentHp)||!finite(x.player.currentMp)||!finite(x.player.hunger)||!Array.isArray(x.player.statusEffects))return false;
 if(!x.player.statusEffects.every((e:unknown)=>rec(e)&&id(e.id)&&id(e.definitionId)&&(e.remainingTurns===null||uint(e.remainingTurns))))return false;
 if(!rec(x.world)||!id(x.world.activeRegionId)||!rec(x.progression)||!rec(x.progression.skillExperience)||!rec(x.flags))return false;
 if(Object.values(x.progression.skillExperience).some(v=>!finite(v))||Object.values(x.flags).some(v=>typeof v!=='boolean'))return false;
 if(!rec(x.itemWorld)||!Array.isArray(x.itemWorld.items)||!Array.isArray(x.itemWorld.placements)||!Array.isArray(x.itemWorld.containers))return false;
 return true;
}
export function decodeSaveV2(raw:unknown,registry:ItemRegistry):V2Result {
 if(!rec(raw))return {ok:false,reason:'INVALID_DATA'};
 if(raw.format!=='somnium-save'||raw.saveVersion!==2||!rec(raw.state)||raw.state.schemaVersion!==2)return {ok:false,reason:'INCOMPATIBLE_VERSION'};
 if(!keys(raw,['format','saveVersion','contentVersion','slot','state'])||!id(raw.contentVersion)||!rec(raw.slot)||!keys(raw.slot,['slotId','worldId','kind','label','savedAt','revision'])||
 !id(raw.slot.slotId)||!id(raw.slot.worldId)||!['manual','quick','auto'].includes(String(raw.slot.kind))||
 typeof raw.slot.label!=='string'||!id(raw.slot.savedAt)||!uint(raw.slot.revision)||!validV2State(raw.state))return {ok:false,reason:'INVALID_DATA'};
 const issues=validateItemWorld(raw.state.itemWorld,registry);
 if(issues.length)return {ok:false,reason:'INVALID_DATA',issues};
 // Do not silently discard unrecognized fields from a newer schema.
 return {ok:true,save:structuredClone(raw) as unknown as SaveEnvelopeV2};
}
export function createSaveV2(state:GameStateV2,slot:SaveSlot,contentVersion:string,registry:ItemRegistry):SaveEnvelopeV2 {
 const result=decodeSaveV2({format:'somnium-save',saveVersion:2,contentVersion,slot,state},registry);
 if(!result.ok)throw new Error('Invalid v2 save: '+result.reason);
 return result.save;
}
export function parseBackupV2(text:string,registry:ItemRegistry,maxBytes=8_000_000):V2Result {
 if(typeof text!=='string'||new TextEncoder().encode(text).length>maxBytes)return {ok:false,reason:'INVALID_DATA'};
 try{return decodeSaveV2(JSON.parse(text) as unknown,registry);}catch{return {ok:false,reason:'INVALID_DATA'};}
}
export function exportBackupV2(save:SaveEnvelopeV2,registry:ItemRegistry):string{
 const result=decodeSaveV2(save,registry);if(!result.ok)throw new Error('Invalid v2 save');
 return JSON.stringify(result.save,null,2);
}
/** Explicit v1 -> v2 conversion: inventory items become player-owned, no attributes invented.
 * This does not overwrite the caller's original game or save data.
 */
export function migrateV1ToV2(old:GameState,registry:ItemRegistry):{ok:true;state:GameStateV2}|{ok:false;issues:readonly ValidationIssue[]} {
 const items=structuredClone(old.inventory.items);
 const {inventory: _inventory,schemaVersion:_version,...base}=old;
 const state:GameStateV2={...structuredClone(base),schemaVersion:2,
  itemWorld:{items,placements:items.map(item=>({itemId:item.id,location:{kind:'inventory' as const,ownerId:old.player.id}})),containers:[]}};
 const issues=validateItemWorld(state.itemWorld,registry);
 return issues.length?{ok:false,issues}:{ok:true,state};
}
