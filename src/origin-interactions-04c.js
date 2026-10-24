/** 04-C narrative origin interactions: verified one-time contextual recognition.
 * No invented inventory rewards, combat, NPC relationships or skill XP. */
import {BACKGROUNDS,hasExclusiveAbility,validateOrigin} from './character-origin-04b.js';
export const ORIGIN_INTERACTIONS=Object.freeze([
 {
  "id": "origin:insight/farmer",
  "backgroundId": "farmer",
  "region": "초원·농경지",
  "title": "오래된 밭의 흔적 읽기",
  "description": "농부만 알아보는 작물 윤작의 흔적이 남아 있습니다."
 },
 {
  "id": "origin:insight/fisher",
  "backgroundId": "fisher",
  "region": "강·호수",
  "title": "물길의 징후 읽기",
  "description": "어부에게 익숙한 물살과 어군 이동의 징후가 보입니다."
 },
 {
  "id": "origin:insight/miner",
  "backgroundId": "miner",
  "region": "광산",
  "title": "갱도 표식 해독",
  "description": "오래된 채굴자들의 경고 표식이 보입니다."
 },
 {
  "id": "origin:insight/woodcutter",
  "backgroundId": "woodcutter",
  "region": "숲",
  "title": "나이테의 기록 읽기",
  "description": "수목의 성장과 오래된 벌목 흔적을 구별했습니다."
 },
 {
  "id": "origin:insight/hunter",
  "backgroundId": "hunter",
  "region": "숲",
  "title": "사냥꾼 표식 확인",
  "description": "사냥꾼들이 남긴 방향과 위험 경고를 읽었습니다."
 },
 {
  "id": "origin:insight/cook",
  "backgroundId": "cook",
  "region": "거점 마을",
  "title": "전승 조리 기록 해석",
  "description": "조리사들의 전승 기록에서 비공개 조리 관습을 알아보았습니다."
 },
 {
  "id": "origin:insight/artisan",
  "backgroundId": "artisan",
  "region": "거점 마을",
  "title": "공방 인장 판독",
  "description": "낯익은 공방의 각인과 제작 계통을 식별했습니다."
 },
 {
  "id": "origin:insight/alchemist",
  "backgroundId": "alchemist",
  "region": "고대 유적",
  "title": "비전 배합의 흔적 확인",
  "description": "연금술 학맥에서 전승된 배합 흔적을 감지했습니다."
 },
 {
  "id": "origin:insight/scholar",
  "backgroundId": "scholar",
  "region": "고대 유적",
  "title": "학맥의 해석법 적용",
  "description": "학파에서 배운 방식으로 고문서의 배열을 해석했습니다."
 },
 {
  "id": "origin:insight/archaeologist",
  "backgroundId": "archaeologist",
  "region": "고대 유적",
  "title": "발굴 흔적 복원",
  "description": "유물의 위치와 파손 방향에서 현장 배치를 재구성했습니다."
 },
 {
  "id": "origin:insight/merchant",
  "backgroundId": "merchant",
  "region": "해안·항구",
  "title": "상단 암호 확인",
  "description": "출신 상단의 비공개 거래 표식을 알아보았습니다."
 },
 {
  "id": "origin:insight/traveler",
  "backgroundId": "traveler",
  "region": "해안·항구",
  "title": "여행자 암호 찾기",
  "description": "여행자들이 서로에게 남긴 약속의 표지를 발견했습니다."
 },
 {
  "id": "origin:insight/mercenary",
  "backgroundId": "mercenary",
  "region": "폐허·묘지",
  "title": "전장 신호 분석",
  "description": "용병단에서 사용하던 이동·철수 신호를 식별했습니다."
 },
 {
  "id": "origin:insight/healer",
  "backgroundId": "healer",
  "region": "습지",
  "title": "전승 처치의 단서 찾기",
  "description": "습지의 약초 흔적을 스승의 처치법과 연결했습니다."
 },
 {
  "id": "origin:insight/acolyte",
  "backgroundId": "acolyte",
  "region": "만신전",
  "title": "성역의 예법 수행",
  "description": "출신 사원에서 배운 의례 절차를 올바르게 재현했습니다."
 },
 {
  "id": "origin:insight/musician",
  "backgroundId": "musician",
  "region": "거점 마을",
  "title": "거리의 악보 읽기",
  "description": "거리 연주자들 사이에서 전승되는 멜로디의 암호를 알아보았습니다."
 }
].map(x=>Object.freeze(x)));
export function availableOriginInteractions(origin,region,flags={}){
 if(!validateOrigin(origin)||typeof region!=='string')return [];
 return ORIGIN_INTERACTIONS.filter(x=>x.region===region&&hasExclusiveAbility(origin,'origin:'+x.backgroundId))
 .map(x=>({...x,completed:flags['origin-insight:'+x.id]===true}));
}
export function resolveOriginInteraction(origin,region,interactionId,flags={}){
 if(!validateOrigin(origin))return {ok:false,reason:'ORIGIN_REQUIRED'};
 const interaction=ORIGIN_INTERACTIONS.find(x=>x.id===interactionId);
 if(!interaction||interaction.region!==region)return {ok:false,reason:'NOT_IN_REGION'};
 if(!hasExclusiveAbility(origin,'origin:'+interaction.backgroundId))return {ok:false,reason:'EXCLUSIVE_BACKGROUND'};
 const key='origin-insight:'+interaction.id;
 if(flags[key]===true)return {ok:false,reason:'ALREADY_DISCOVERED'};
 return {ok:true,interaction,flagKey:key};
}
