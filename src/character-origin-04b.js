/** 04-B origin contract. Single-cell movement is unchanged for all body sizes.
 * Background abilities are exclusive identity permissions, not learnable skills.
 * Names and mechanics are candidates; non-existent game systems are not simulated. */
import {SKILL_DEFINITIONS,skillThreshold} from './progression-system.js';
export const BODY_SIZES=Object.freeze(['medium','small','tiny']);
export const SPECIES=Object.freeze([
 {
  "id": "human",
  "name": "인간",
  "size": "medium",
  "trait": "적응력"
 },
 {
  "id": "elf",
  "name": "엘프",
  "size": "medium",
  "trait": "자연 친화"
 },
 {
  "id": "dwarf",
  "name": "드워프",
  "size": "medium",
  "trait": "지하 친화"
 },
 {
  "id": "halfling",
  "name": "소인족",
  "size": "small",
  "trait": "공동체 친화"
 },
 {
  "id": "beastfolk",
  "name": "수인족",
  "size": "medium",
  "trait": "예민한 감각"
 },
 {
  "id": "orc",
  "name": "오크",
  "size": "medium",
  "trait": "강인함"
 },
 {
  "id": "gnome",
  "name": "노움",
  "size": "small",
  "trait": "공구 친화"
 },
 {
  "id": "fairy",
  "name": "요정족",
  "size": "tiny",
  "trait": "마법 친화"
 }
].map(x=>Object.freeze(x)));
export const BACKGROUNDS=Object.freeze([
 {
  "id": "farmer",
  "name": "농부",
  "primary": "농업",
  "secondary": "목축",
  "ability": "땅의 기억"
 },
 {
  "id": "fisher",
  "name": "어부",
  "primary": "낚시",
  "secondary": "항해",
  "ability": "물길의 감각"
 },
 {
  "id": "miner",
  "name": "광부",
  "primary": "채광",
  "secondary": "탐색",
  "ability": "갱도의 언어"
 },
 {
  "id": "woodcutter",
  "name": "나무꾼",
  "primary": "벌목",
  "secondary": "목공",
  "ability": "수목 감별"
 },
 {
  "id": "hunter",
  "name": "사냥꾼",
  "primary": "사냥",
  "secondary": "추적",
  "ability": "사냥꾼의 표식"
 },
 {
  "id": "cook",
  "name": "요리사",
  "primary": "요리",
  "secondary": "채집",
  "ability": "비전의 조리법"
 },
 {
  "id": "artisan",
  "name": "장인 견습생",
  "primary": "수공예",
  "secondary": "대장장이",
  "ability": "공방의 인장"
 },
 {
  "id": "alchemist",
  "name": "연금술 견습생",
  "primary": "연금술",
  "secondary": "학문",
  "ability": "비전 배합"
 },
 {
  "id": "scholar",
  "name": "학자",
  "primary": "학문",
  "secondary": "독해",
  "ability": "학맥의 해석법"
 },
 {
  "id": "archaeologist",
  "name": "유적 조사원",
  "primary": "고고학",
  "secondary": "감정",
  "ability": "현장 복원술"
 },
 {
  "id": "merchant",
  "name": "상인",
  "primary": "상업",
  "secondary": "협상",
  "ability": "거래망"
 },
 {
  "id": "traveler",
  "name": "여행자",
  "primary": "탐색",
  "secondary": "항해",
  "ability": "길 위의 약속"
 },
 {
  "id": "mercenary",
  "name": "용병",
  "primary": "검술",
  "secondary": "경갑 숙련",
  "ability": "전장의 관례"
 },
 {
  "id": "healer",
  "name": "수습 치료사",
  "primary": "의술",
  "secondary": "채집",
  "ability": "스승의 처치법"
 },
 {
  "id": "acolyte",
  "name": "사원 수행자",
  "primary": "신앙",
  "secondary": "명상",
  "ability": "성역의 예법"
 },
 {
  "id": "musician",
  "name": "거리의 연주자",
  "primary": "연주",
  "secondary": "협상",
  "ability": "거리의 악보"
 }
].map(x=>Object.freeze(x)));
const skillId=name=>{const result=SKILL_DEFINITIONS.find(s=>s.name===name);if(!result)throw Error('Unknown skill '+name);return result.id};
export function createOrigin(speciesId,backgroundId){
 const race=SPECIES.find(x=>x.id===speciesId),bg=BACKGROUNDS.find(x=>x.id===backgroundId);
 if(!race||!bg)throw RangeError('Unknown species or background');
 return {schema:1,speciesId,backgroundId,bodySize:race.size,exclusiveAbilityId:'origin:'+bg.id};
}
export function validateOrigin(x){
 if(!x||typeof x!=='object'||Array.isArray(x)||x.schema!==1)return false;
 const keys=Object.keys(x).sort().join(',');
 if(keys!=='backgroundId,bodySize,exclusiveAbilityId,schema,speciesId')return false;
 try{return JSON.stringify(x)===JSON.stringify(createOrigin(x.speciesId,x.backgroundId))}catch{return false}
}
export function applyOriginToProgression(progression,origin){
 if(!validateOrigin(origin)||!progression||!progression.skills)throw RangeError('Invalid origin');
 const bg=BACKGROUNDS.find(x=>x.id===origin.backgroundId);
 const next=structuredClone(progression);
 // Initial history is expressed as cumulative XP, not a direct mutable level.
 next.skills[skillId(bg.primary)]=Math.max(next.skills[skillId(bg.primary)],skillThreshold(3));
 next.skills[skillId(bg.secondary)]=Math.max(next.skills[skillId(bg.secondary)],skillThreshold(2));
 return next;
}
export function hasExclusiveAbility(origin,abilityId){
 return validateOrigin(origin)&&origin.exclusiveAbilityId===abilityId;
}
/** All characters occupy ONE unchanged local tile. Size may gate tagged passages later,
 * but does not alter map dimensions, movement seconds or diagonal/cardinal geometry. */
export function tileFootprint(_origin){return 1}
export function canUsePassage(origin,passage){
 if(!validateOrigin(origin))return {ok:false,reason:'ORIGIN_REQUIRED'};
 if(!passage||!BODY_SIZES.includes(passage.minimumSize))return {ok:false,reason:'INVALID_PASSAGE'};
 const ranks={tiny:0,small:1,medium:2};
 return {ok:ranks[origin.bodySize]<=ranks[passage.minimumSize],reason:ranks[origin.bodySize]<=ranks[passage.minimumSize]?null:'BODY_SIZE_BLOCKED'};
}
