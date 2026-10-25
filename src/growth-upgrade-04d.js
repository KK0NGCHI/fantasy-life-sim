/** 04-D: explicit, non-writing, copy-only upgrade preparation.
 * Never rewrites an original slot, assumes consent, or changes world/time history. */
import {decodeSaveV3} from '../dist/engine/v2.js';
import {createProgression} from './progression-system.js';
import {createOrigin,applyOriginToProgression} from './character-origin-04b.js';

export function prepareGrowthUpgrade04D(candidate,registry,{approved=false,newSlotId,attributeAllocation={},speciesId,backgroundId}={}){
 if(approved!==true)return {ok:false,reason:'APPROVAL_REQUIRED'};
 if(typeof newSlotId!=='string'||newSlotId.length<1||newSlotId.length>120)
  return {ok:false,reason:'NEW_SLOT_REQUIRED'};
 const decoded=decodeSaveV3(candidate,registry);
 if(!decoded.ok)return {ok:false,reason:decoded.reason};
 const source=decoded.save;
 if(source.slot.slotId===newSlotId)return {ok:false,reason:'SOURCE_SLOT_PROTECTED'};
 if(source.state.progression.system04A||source.state.progression.origin04B)
  return {ok:false,reason:'GROWTH_ALREADY_PRESENT'};
 if(!speciesId||!backgroundId)return {ok:false,reason:'ORIGIN_REQUIRED'};
 let progression,origin;
 try{
  origin=createOrigin(speciesId,backgroundId);
  progression=applyOriginToProgression(createProgression(attributeAllocation),origin);
 }catch{return {ok:false,reason:'INVALID_CREATION'};}
 const prepared=structuredClone(source);
 prepared.slot={...prepared.slot,slotId:newSlotId,revision:0,kind:'manual',label:'성장 이전: '+source.slot.label};
 prepared.state.progression={...prepared.state.progression,system04A:progression,origin04B:origin};
 const validated=decodeSaveV3(prepared,registry);
 if(!validated.ok)return {ok:false,reason:'INVALID_PREPARED_SAVE'};
 return {ok:true,save:validated.save,sourceSlotId:source.slot.slotId};
}
