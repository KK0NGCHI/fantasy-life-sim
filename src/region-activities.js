/** Region activity contract: no implicit local tile map for a world region. */
export const DEEP_FIELDS=Object.freeze([
 Object.freeze({id:'core:activity/deep-forest',name:'깊은 숲',region:'숲',profession:'채집',kind:'gather',requirements:{exploration:10,profession:10}}),
 Object.freeze({id:'core:activity/deep-mine',name:'심층 광산',region:'광산',profession:'채광',kind:'mine',requirements:{exploration:10,profession:10}}),
 Object.freeze({id:'core:activity/deep-sea',name:'심해',region:'바다',profession:'낚시',kind:'fish',requirements:{exploration:10,profession:10}})
]);
export const SPECIAL_ACTIVITIES=Object.freeze([
 Object.freeze({id:'core:activity/ancient-ruins',name:'유적 조사',region:'고대 유적',kind:'investigate'}),
 Object.freeze({id:'core:activity/abandoned-graves',name:'폐허·묘지 수색',region:'폐허·묘지',kind:'salvage'})
]);
export const DANGEROUS_REGIONS=new Set(['화산지대','사막','설원']);
/** Thresholds are provisional test configuration, NOT balance decisions. */
export function accessDeepField(field,skills){
 if(!field||!DEEP_FIELDS.some(v=>v.id===field.id))return {ok:false,reason:'UNKNOWN_FIELD'};
 const exploration=skills?.탐색,profession=skills?.[field.profession];
 if(!Number.isFinite(exploration)||!Number.isFinite(profession)||exploration<0||profession<0)return {ok:false,reason:'SKILL_DATA_REQUIRED'};
 return exploration>=field.requirements.exploration&&profession>=field.requirements.profession
  ?{ok:true}:{ok:false,reason:'MASTERY_REQUIRED',needed:{탐색:field.requirements.exploration,[field.profession]:field.requirements.profession}};
}
export function activityAt(region){return [...DEEP_FIELDS,...SPECIAL_ACTIVITIES].filter(x=>x.region===region)}
/** A deterministic outcome *placeholder*, not combat, loot, growth or probabilities. */
export function activityPreview(region,activityId,skills){
 const field=DEEP_FIELDS.find(x=>x.id===activityId&&x.region===region);
 const special=SPECIAL_ACTIVITIES.find(x=>x.id===activityId&&x.region===region);
 if(!field&&!special)return {ok:false,reason:'UNKNOWN_ACTIVITY'};
 if(field){const gate=accessDeepField(field,skills);if(!gate.ok)return gate;}
 return {ok:true,kind:(field??special).kind,encounterEligible:!!field||region==='폐허·묘지'||DANGEROUS_REGIONS.has(region),tileTraversal:false};
}
