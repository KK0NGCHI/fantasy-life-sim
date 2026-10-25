import {REAL_ATLAS_05E} from './mineral-atlas-05e.js';
import {GEOLOGICAL_SETTINGS_05F,geologyProfile05F} from './mineral-geology-05f.js';

/** Descriptive assemblages: association is not a drop table or stock pool.
 * Deposits keep existing per-material finite ledgers until explicit migration.
 */
const RECIPES=Object.freeze({
 hydrothermal:{name:'열수 광맥 복합체',host:['화강암','변성암'],companions:['quartz','pyrite','chalcopyrite'],depth:'천부~심부'},
 sedimentary:{name:'퇴적 광상',host:['사암','셰일'],companions:['calcite','quartz'],depth:'지표~천부'},
 evaporite:{name:'증발암 퇴적 광상',host:['석회암'],companions:['gypsum','halite','calcite'],depth:'천부'},
 igneous:{name:'관입 화성암 광상',host:['화강암','섬록암'],companions:['feldspar','quartz','magnetite'],depth:'천부~심부'},
 volcanic:{name:'화산 분출 광상',host:['현무암','응회암'],companions:['obsidian','pumice'],depth:'지표~천부'},
 metamorphic:{name:'변성암 광상',host:['편마암','편암'],companions:['garnet','mica','quartz'],depth:'천부~심부'},
 placer:{name:'사광·풍화 집적층',host:['모래','자갈'],companions:['quartz','gold','magnetite'],depth:'지표'},
 generic:{name:'미분류 광상',host:[],companions:[],depth:'미정'}
});
const idByEnglish=new Map(REAL_ATLAS_05E.map(x=>[x.en,x.id]));
export const ASSEMBLAGE_TYPES_05F=Object.freeze(Object.fromEntries(Object.entries(RECIPES).map(([id,r])=>[
 id,Object.freeze({id,name:r.name,hostRockExamples:Object.freeze([...r.host]),depthBand:r.depth,
  // Use existing, actual atlas IDs only; invalid examples never become invented items.
  associatedMaterialIds:Object.freeze(r.companions.map(n=>idByEnglish.get(n)).filter(Boolean))})
])));
export const MATERIAL_ASSEMBLAGES_05F=Object.freeze(REAL_ATLAS_05E.map(entry=>{
 const setting=geologyProfile05F(entry.id);
 const type=ASSEMBLAGE_TYPES_05F[setting.settingId]??ASSEMBLAGE_TYPES_05F.generic;
 return Object.freeze({materialId:entry.id,assemblageId:type.id,hostRockExamples:type.hostRockExamples,
  associatedMaterialIds:Object.freeze(type.associatedMaterialIds.filter(id=>id!==entry.id)),
  depthBand:type.depthBand,spawnEnabled:false,stockCoupled:false});
}));
export const ASSEMBLAGE_BY_MATERIAL_05F=new Map(MATERIAL_ASSEMBLAGES_05F.map(x=>[x.materialId,x]));
export function mineralAssemblage05F(materialId){return ASSEMBLAGE_BY_MATERIAL_05F.get(materialId)??null;}
export function assemblageForDeposit05F(site){
 if(!site||typeof site.itemId!=='string')return null;
 const group=mineralAssemblage05F(site.itemId);
 return group?{...group,depositId:site.id,region:site.region,remaining:site.remaining}:null;
}
