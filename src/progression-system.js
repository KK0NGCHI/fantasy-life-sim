/** Somnium 04-A: versioned opt-in progression, no global character level.
 * Numbers are trial rules, kept in PROGRESSION_RULES for future balancing.
 * No changes to existing save format or slots. */
export const ATTRIBUTES=Object.freeze(['근력','민첩','체력','지각','지능','의지','매력']);
export const SKILL_DEFINITIONS=Object.freeze([
 {
  "id": "skill-01",
  "name": "탐색",
  "group": "탐험·이동",
  "primary": "지각",
  "secondary": "지능"
 },
 {
  "id": "skill-02",
  "name": "추적",
  "group": "탐험·이동",
  "primary": "지각",
  "secondary": "민첩"
 },
 {
  "id": "skill-03",
  "name": "은신",
  "group": "탐험·이동",
  "primary": "민첩",
  "secondary": "지각"
 },
 {
  "id": "skill-04",
  "name": "자물쇠 해제",
  "group": "탐험·이동",
  "primary": "민첩",
  "secondary": "지각"
 },
 {
  "id": "skill-05",
  "name": "함정 탐지",
  "group": "탐험·이동",
  "primary": "지각",
  "secondary": "지능"
 },
 {
  "id": "skill-06",
  "name": "함정 해제",
  "group": "탐험·이동",
  "primary": "민첩",
  "secondary": "지능"
 },
 {
  "id": "skill-07",
  "name": "항해",
  "group": "탐험·이동",
  "primary": "지각",
  "secondary": "의지"
 },
 {
  "id": "skill-08",
  "name": "승마",
  "group": "탐험·이동",
  "primary": "민첩",
  "secondary": "의지"
 },
 {
  "id": "skill-09",
  "name": "채집",
  "group": "채취·생활",
  "primary": "지각",
  "secondary": "민첩"
 },
 {
  "id": "skill-10",
  "name": "벌목",
  "group": "채취·생활",
  "primary": "근력",
  "secondary": "민첩"
 },
 {
  "id": "skill-11",
  "name": "채광",
  "group": "채취·생활",
  "primary": "근력",
  "secondary": "지각"
 },
 {
  "id": "skill-12",
  "name": "낚시",
  "group": "채취·생활",
  "primary": "지각",
  "secondary": "민첩"
 },
 {
  "id": "skill-13",
  "name": "농업",
  "group": "채취·생활",
  "primary": "체력",
  "secondary": "지능"
 },
 {
  "id": "skill-14",
  "name": "목축",
  "group": "채취·생활",
  "primary": "지각",
  "secondary": "매력"
 },
 {
  "id": "skill-15",
  "name": "사냥",
  "group": "채취·생활",
  "primary": "지각",
  "secondary": "민첩"
 },
 {
  "id": "skill-16",
  "name": "조련",
  "group": "채취·생활",
  "primary": "매력",
  "secondary": "의지"
 },
 {
  "id": "skill-17",
  "name": "도축",
  "group": "채취·생활",
  "primary": "민첩",
  "secondary": "지각"
 },
 {
  "id": "skill-18",
  "name": "요리",
  "group": "제작·기술",
  "primary": "민첩",
  "secondary": "지능"
 },
 {
  "id": "skill-19",
  "name": "목공",
  "group": "제작·기술",
  "primary": "민첩",
  "secondary": "근력"
 },
 {
  "id": "skill-20",
  "name": "석공",
  "group": "제작·기술",
  "primary": "근력",
  "secondary": "민첩"
 },
 {
  "id": "skill-21",
  "name": "대장장이",
  "group": "제작·기술",
  "primary": "근력",
  "secondary": "민첩"
 },
 {
  "id": "skill-22",
  "name": "가죽세공",
  "group": "제작·기술",
  "primary": "민첩",
  "secondary": "지각"
 },
 {
  "id": "skill-23",
  "name": "재봉",
  "group": "제작·기술",
  "primary": "민첩",
  "secondary": "지각"
 },
 {
  "id": "skill-24",
  "name": "직조",
  "group": "제작·기술",
  "primary": "민첩",
  "secondary": "지능"
 },
 {
  "id": "skill-25",
  "name": "세공",
  "group": "제작·기술",
  "primary": "민첩",
  "secondary": "지각"
 },
 {
  "id": "skill-26",
  "name": "연금술",
  "group": "제작·기술",
  "primary": "지능",
  "secondary": "민첩"
 },
 {
  "id": "skill-27",
  "name": "건축",
  "group": "제작·기술",
  "primary": "지능",
  "secondary": "근력"
 },
 {
  "id": "skill-28",
  "name": "수공예",
  "group": "제작·기술",
  "primary": "민첩",
  "secondary": "지능"
 },
 {
  "id": "skill-29",
  "name": "검술",
  "group": "전투·무술",
  "primary": "민첩",
  "secondary": "근력"
 },
 {
  "id": "skill-30",
  "name": "단검술",
  "group": "전투·무술",
  "primary": "민첩",
  "secondary": "지각"
 },
 {
  "id": "skill-31",
  "name": "도끼술",
  "group": "전투·무술",
  "primary": "근력",
  "secondary": "민첩"
 },
 {
  "id": "skill-32",
  "name": "둔기술",
  "group": "전투·무술",
  "primary": "근력",
  "secondary": "체력"
 },
 {
  "id": "skill-33",
  "name": "창술",
  "group": "전투·무술",
  "primary": "민첩",
  "secondary": "지각"
 },
 {
  "id": "skill-34",
  "name": "궁술",
  "group": "전투·무술",
  "primary": "지각",
  "secondary": "민첩"
 },
 {
  "id": "skill-35",
  "name": "투척술",
  "group": "전투·무술",
  "primary": "민첩",
  "secondary": "근력"
 },
 {
  "id": "skill-36",
  "name": "격투",
  "group": "전투·무술",
  "primary": "근력",
  "secondary": "민첩"
 },
 {
  "id": "skill-37",
  "name": "방패술",
  "group": "전투·무술",
  "primary": "체력",
  "secondary": "근력"
 },
 {
  "id": "skill-38",
  "name": "회피",
  "group": "전투·무술",
  "primary": "민첩",
  "secondary": "지각"
 },
 {
  "id": "skill-39",
  "name": "경갑 숙련",
  "group": "전투·무술",
  "primary": "민첩",
  "secondary": "체력"
 },
 {
  "id": "skill-40",
  "name": "중갑 숙련",
  "group": "전투·무술",
  "primary": "체력",
  "secondary": "근력"
 },
 {
  "id": "skill-41",
  "name": "주문 시전",
  "group": "마법·신앙",
  "primary": "지능",
  "secondary": "의지"
 },
 {
  "id": "skill-42",
  "name": "마력 제어",
  "group": "마법·신앙",
  "primary": "의지",
  "secondary": "지능"
 },
 {
  "id": "skill-43",
  "name": "명상",
  "group": "마법·신앙",
  "primary": "의지",
  "secondary": null
 },
 {
  "id": "skill-44",
  "name": "마도구 운용",
  "group": "마법·신앙",
  "primary": "지능",
  "secondary": "민첩"
 },
 {
  "id": "skill-45",
  "name": "치유마법",
  "group": "마법·신앙",
  "primary": "의지",
  "secondary": "지능"
 },
 {
  "id": "skill-46",
  "name": "신앙",
  "group": "마법·신앙",
  "primary": "의지",
  "secondary": "매력"
 },
 {
  "id": "skill-47",
  "name": "학문",
  "group": "지식·사회",
  "primary": "지능",
  "secondary": "의지"
 },
 {
  "id": "skill-48",
  "name": "독해",
  "group": "지식·사회",
  "primary": "지능",
  "secondary": "지각"
 },
 {
  "id": "skill-49",
  "name": "감정",
  "group": "지식·사회",
  "primary": "지각",
  "secondary": "지능"
 },
 {
  "id": "skill-50",
  "name": "고고학",
  "group": "지식·사회",
  "primary": "지능",
  "secondary": "지각"
 },
 {
  "id": "skill-51",
  "name": "의술",
  "group": "지식·사회",
  "primary": "지능",
  "secondary": "민첩"
 },
 {
  "id": "skill-52",
  "name": "협상",
  "group": "지식·사회",
  "primary": "매력",
  "secondary": "지각"
 },
 {
  "id": "skill-53",
  "name": "상업",
  "group": "지식·사회",
  "primary": "매력",
  "secondary": "지능"
 },
 {
  "id": "skill-54",
  "name": "연주",
  "group": "지식·사회",
  "primary": "민첩",
  "secondary": "매력"
 }
].map(s=>Object.freeze(s)));
export const PROGRESSION_RULES=Object.freeze({
 version:1,normalMilestone:30,startAttribute:10,creationPoints:10,creationMax:15,
 skillTrainingFraction:0.2,secondaryTrainingShare:0.25,
 skillBaseXp:60,skillLinearXp:12,skillQuadraticXp:3,
 attributeBaseTp:100,attributeLinearTp:15,attributeQuadraticTp:4,
 overlevelEffectCap:0.05,overlevelScale:20
});
const safe=(x)=>Number.isSafeInteger(x)&&x>=0&&x<=Number.MAX_SAFE_INTEGER;
export function skillThreshold(level,rules=PROGRESSION_RULES){
 if(!safe(level)||level<1)throw RangeError('Invalid skill level');
 const n=level-1;
 const sum=n*rules.skillBaseXp+rules.skillLinearXp*n*(n-1)/2+
 rules.skillQuadraticXp*n*(n-1)*(2*n-1)/6-
 rules.skillQuadraticXp*n*(n-1)/2;
 if(!Number.isSafeInteger(sum)||sum<0)throw RangeError('Skill XP overflow');
 return sum;
}
export function skillLevel(xp,rules=PROGRESSION_RULES){
 if(!safe(xp))throw RangeError('Invalid skill XP');
 let lo=1,hi=2;
 while(true){try{if(skillThreshold(hi,rules)>xp)break;}catch{break;}lo=hi;hi=Math.min(hi*2,Number.MAX_SAFE_INTEGER);if(hi===lo)break;}
 while(lo+1<hi){const mid=Math.floor((lo+hi)/2);let reaches=false;
 try{reaches=skillThreshold(mid,rules)<=xp;}catch{}
 if(reaches)lo=mid;else hi=mid;}
 return lo;
}
export function skillEffect(level,rules=PROGRESSION_RULES){
 if(!safe(level)||level<1)throw RangeError('Invalid level');
 // One normalized sample effect, not a universal combat or production formula.
 const base=Math.min(level,rules.normalMilestone)/rules.normalMilestone*0.20;
 const over=Math.max(0,level-rules.normalMilestone);
 return base+(over?rules.overlevelEffectCap*(1-Math.exp(-over/rules.overlevelScale)):0);
}
export function attributeNextTraining(value,rules=PROGRESSION_RULES){
 if(!safe(value)||value<rules.startAttribute)throw RangeError('Invalid attribute');
 const n=value-rules.startAttribute;
 const tp=rules.attributeBaseTp+rules.attributeLinearTp*n+rules.attributeQuadraticTp*n*n;
 if(!safe(tp))throw RangeError('Attribute overflow');
 return tp;
}
export function createProgression(allocation={}){
 if(!allocation||typeof allocation!=='object'||Array.isArray(allocation))throw RangeError('Invalid allocation');
 const given=Object.keys(allocation);if(given.some(k=>!ATTRIBUTES.includes(k)))throw RangeError('Unknown attribute');
 const attributes=Object.fromEntries(ATTRIBUTES.map(key=>[key,PROGRESSION_RULES.startAttribute+(allocation[key]??0)]));
 let spent=0;for(const val of Object.values(allocation)){if(!safe(val))throw RangeError('Invalid allocation');spent+=val;}
 if(spent>PROGRESSION_RULES.creationPoints||Object.values(attributes).some(x=>x>PROGRESSION_RULES.creationMax))throw RangeError('Creation budget exceeded');
 return {schema:1,ruleVersion:PROGRESSION_RULES.version,attributes,
 training:Object.fromEntries(ATTRIBUTES.map(k=>[k,0])),
 skills:Object.fromEntries(SKILL_DEFINITIONS.map(s=>[s.id,0])),
 awards:[]};
}
export function validateProgression(p){
 if(!p||p.schema!==1||p.ruleVersion!==1||!p.attributes||!p.training||!p.skills||!Array.isArray(p.awards))return false;
 if(Object.keys(p.attributes).length!==7||Object.keys(p.training).length!==7||Object.keys(p.skills).length!==54)return false;
 if(!ATTRIBUTES.every(k=>safe(p.attributes[k])&&p.attributes[k]>=10&&safe(p.training[k])))return false;
 if(!SKILL_DEFINITIONS.every(s=>safe(p.skills[s.id])))return false;
 return p.awards.every(x=>typeof x==='string'&&x.length>0&&x.length<=160)&&new Set(p.awards).size===p.awards.length;
}
/** Only a validated action result may call this reducer; never call from mere UI clicks.
 * Idempotency keys ensure action replay does not grant multiple XP awards. */
export function awardProgression(snapshot,{actionId,skillId,xp,valid=true},rules=PROGRESSION_RULES){
 if(!validateProgression(snapshot))throw RangeError('Invalid progression');
 const spec=SKILL_DEFINITIONS.find(x=>x.id===skillId);
 if(!spec||typeof actionId!=='string'||actionId.length<1||actionId.length>160||!safe(xp))throw RangeError('Invalid reward');
 if(!valid||xp===0||snapshot.awards.includes(actionId))return structuredClone(snapshot);
 if(snapshot.awards.length>=10000)throw RangeError('Award ledger requires compaction');
 const next=structuredClone(snapshot),gained=Math.floor(xp*rules.skillTrainingFraction);
 if(!safe(next.skills[skillId]+xp))throw RangeError('XP overflow');
 next.skills[skillId]+=xp;
 const primary=gained-Math.floor(gained*rules.secondaryTrainingShare),secondary=spec.secondary?gained-primary:0;
 const weights=spec.secondary?[[spec.primary,primary],[spec.secondary,secondary]]:[[spec.primary,gained]];
 for(const [key,amount] of weights){let training=next.training[key]+amount;
 while(training>=attributeNextTraining(next.attributes[key],rules)){
  training-=attributeNextTraining(next.attributes[key],rules);next.attributes[key]++;
 }
 next.training[key]=training;
 }
 next.awards.push(actionId);
 return next;
}
