import {REAL_ATLAS_05E} from './mineral-atlas-05e.js';

/** 05-F first geological occurrence profiles.
 * Descriptive guidance, NOT a new spawn roll or authorization to mine.
 * Depth bands are qualitative geological accessibility, not exact meters.
 * Never infer world/cosmic provenance from geological region alone.
 */
export const GEOLOGICAL_SETTINGS_05F=Object.freeze({
 igneous:{label:'화성암·관입암',hostRocks:['화강암','섬록암'],depthBand:'지표~심부',notes:'관입체와 관련된 산출'},
 hydrothermal:{label:'열수 광맥',hostRocks:['화강암','변성암'],depthBand:'천부~심부',notes:'균열·맥을 통한 열수 이동'},
 sedimentary:{label:'퇴적층',hostRocks:['사암','셰일'],depthBand:'지표~천부',notes:'퇴적·속성작용 관련'},
 evaporite:{label:'증발암층',hostRocks:['석회암','퇴적암'],depthBand:'천부',notes:'건조 분지의 증발·침전'},
 metamorphic:{label:'변성대',hostRocks:['편마암','편암'],depthBand:'천부~심부',notes:'광역·접촉 변성 관련'},
 placer:{label:'사광·풍화 퇴적',hostRocks:['모래','자갈'],depthBand:'지표',notes:'풍화 후 이동·집적'},
 volcanic:{label:'화산암·화산활동',hostRocks:['현무암','응회암'],depthBand:'지표~천부',notes:'화산 분출·퇴적'},
 generic:{label:'지질 환경 미분류',hostRocks:[],depthBand:'미정',notes:'개별 광상 검증 필요'}
});
/** Curated primary occurrence examples, not exclusionary and not a universal occurrence list. */
export const GEOLOGICAL_OVERRIDES_05F=Object.freeze({
 hematite:'sedimentary',magnetite:'igneous',limonite:'placer',pyrite:'hydrothermal',
 chalcopyrite:'hydrothermal',chalcocite:'hydrothermal',malachite:'hydrothermal',azurite:'hydrothermal',
 cassiterite:'hydrothermal',sphalerite:'hydrothermal',galena:'hydrothermal',
 bauxite:'sedimentary',chromite:'igneous',ilmenite:'igneous',rutile:'metamorphic',
 gold:'placer',silver:'hydrothermal',molybdenite:'hydrothermal',scheelite:'hydrothermal',
 granite:'igneous',basalt:'volcanic',andesite:'volcanic',rhyolite:'volcanic',
 sandstone:'sedimentary',limestone:'sedimentary',dolostone:'sedimentary',shale:'sedimentary',
 slate:'metamorphic',marble:'metamorphic',quartzite:'metamorphic',gneiss:'metamorphic',
 tuff:'volcanic',pumice:'volcanic',obsidian:'volcanic',gravel:'placer',clay:'sedimentary',
 gypsum:'evaporite',halite:'evaporite',sylvite:'evaporite',diatomite:'sedimentary',
 amethyst:'hydrothermal',emerald:'hydrothermal',ruby:'metamorphic',sapphire:'metamorphic',
 diamond:'igneous',lignite:'sedimentary',bituminous:'sedimentary',anthracite:'metamorphic',
 peat:'sedimentary',bitumen:'sedimentary'
});
const fallback=(entry)=>{
 switch(entry.category){
  case '암석·골재·건축재':return 'generic';
  case '연료·유기성 지질 자원':return 'sedimentary';
  default:return 'generic';
 }
};
export const GEOLOGICAL_PROFILES_05F=Object.freeze(REAL_ATLAS_05E.map(entry=>{
 const settingId=GEOLOGICAL_OVERRIDES_05F[entry.en]??fallback(entry);
 const setting=GEOLOGICAL_SETTINGS_05F[settingId];
 return Object.freeze({materialId:entry.id,settingId,settingLabel:setting.label,
  hostRockExamples:[...setting.hostRocks],depthBand:setting.depthBand,
  verifiedForSpawn:false,classificationStatus:settingId==='generic'?'pending':'illustrative'});
}));
export const GEOLOGICAL_PROFILE_BY_ID_05F=new Map(GEOLOGICAL_PROFILES_05F.map(profile=>[profile.materialId,profile]));
export function geologyProfile05F(materialId){return GEOLOGICAL_PROFILE_BY_ID_05F.get(materialId)??null;}
