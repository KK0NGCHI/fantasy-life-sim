import {createBotanicalEcology05A} from './botanical-ecology-adapter-05a.js';
import {createFungalEcology05B} from './fungal-ecology-05b.js';
import {createSubstrateWorld05B} from './fungal-substrates-05b.js';
import {createTreeWorld05C,createWoodlandSubstrates05C} from './woodland-cycle-05c.js';
/** Opt-in legacy ecology conversion. Pure, immutable, and all-or-nothing.
 * Never infer depleted stock from an older save; migration is explicit and
 * shows users which new populations will be seeded.
 */
export function previewEcologyUpgrade05D(state){
 const runtime=state?.world?.runtime,resources=runtime?.resource05A;
 if(!resources||runtime.timeBasis!=='seconds-v1'||!Number.isSafeInteger(state?.clock?.elapsedUnits))
  return {ok:false,reason:'ECOLOGY_MIGRATION_UNAVAILABLE'};
 const missing=['ecologySites','ecologySubstrates','ecologyClimateSeed','woodland05C'].filter(k=>!Object.hasOwn(resources,k));
 return {ok:true,required:missing.length>0,missing,existingKeys:Object.keys(resources).filter(k=>!missing.includes(k)),
  worldSecond:state.clock.elapsedUnits,
  warning:'새 생태계 초기 군락과 기질이 생성됩니다. 이전 세계에서 채집한 내역을 역추정하지 않습니다.'};
}
export function upgradeEcologyWorld05D(state,{approved=false,seed}={}){
 const preview=previewEcologyUpgrade05D(state);
 if(!preview.ok)throw Error(preview.reason);
 if(!approved)throw Error('ECOLOGY_MIGRATION_APPROVAL_REQUIRED');
 if(typeof seed!=='string'||!seed||seed.length>200)throw Error('INVALID_ECOLOGY_SEED');
 const next=structuredClone(state),resource=next.world.runtime.resource05A;
 const second=next.clock.elapsedUnits;
 // Initial state at the current game second: no retroactive fast-forward.
 if(!resource.ecologySites)resource.ecologySites={...createBotanicalEcology05A(second),...createFungalEcology05B(second)};
 if(!resource.ecologySubstrates)resource.ecologySubstrates=createWoodlandSubstrates05C(createSubstrateWorld05B());
 if(!resource.ecologyClimateSeed)resource.ecologyClimateSeed=seed;
 if(!resource.woodland05C)resource.woodland05C={trees:createTreeWorld05C(),day:Math.floor((second+28800)/86400)};
 return {state:next,preview,changed:preview.required};
}
