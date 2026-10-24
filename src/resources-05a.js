/** 05-A resource catalogue; content candidate values are not final economy balance.
 * Resource origin and properties are independent; do not infer cosmic provenance from region. */
export const RESOURCES_05A=Object.freeze([
 ['wild-herb','야생 약초','gather','숲',5,3,7],
 ['mushroom','일반 버섯','gather','숲',4,4,9],
 ['grass','들풀','gather','숲',8,2,3],
 ['oak-log','참나무 통나무','logging','숲',5,18,30],
 ['pine-log','소나무 통나무','logging','숲',4,14,24],
 ['stone','일반 돌','mining','광산',12,2,3],
 ['coal','석탄','mining','광산',10,0,8],
 ['copper-ore','구리광석','mining','광산',12,0,8],
 ['iron-ore','철광석','mining','광산',10,0,11],
 ['small-fish','작은 민물고기','fishing','강·호수',12,2,10],
 ['carp','잉어','fishing','강·호수',8,4,13],
 ['trout','송어','fishing','강·호수',6,5,16]
].map(([key,name,activity,region,capacity,regenDays,xp])=>
 Object.freeze({id:'resource05a:'+key,name,activity,region,capacity,regenDays,xp,itemId:'item05a:'+key,
 materialOrigin:'mundane',traits:Object.freeze([])})));
export const RESOURCE_MAP_05A=new Map(RESOURCES_05A.map(r=>[r.id,r]));
export function createResourceNodes05A(){
 const counts={'wild-herb':18,mushroom:12,grass:20,'oak-log':18,'pine-log':14,stone:6,coal:3,'copper-ore':4,'iron-ore':3,'small-fish':3,carp:3,trout:3};
 return Object.fromEntries(RESOURCES_05A.flatMap(r=>Array.from({length:counts[r.id.split(':')[1]]},(_,i)=>{
  const id=r.id+':'+String(i+1).padStart(2,'0');
  return [id,{resourceId:r.id,remaining:r.capacity,progress:0,lastSecond:0,discovered:i<2,cycle:0}];
 })));
}
const DAY=86400;
export function resourceAt05A(node,definition,seconds){
 if(!node||!definition||!Number.isSafeInteger(seconds)||seconds<node.lastSecond)throw Error('INVALID_RESOURCE_TIME');
 const next={...node};
 if(definition.regenDays>0&&next.remaining<definition.capacity){
  const step=definition.regenDays*DAY;
  const increments=Math.floor((seconds-next.lastSecond)/step);
  if(increments>0){next.remaining=Math.min(definition.capacity,next.remaining+increments);next.lastSecond+=increments*step;}
 }else if(next.remaining>=definition.capacity)next.lastSecond=seconds;
 return next;
}
/** Only the manually valid short gather cycle is live in this first slice.
 * Other activities remain catalogue definitions until multi-step progress,
 * gear, season and population simulation have test coverage. */
export function gatherResource05A(nodes,nodeId,region,seconds){
 const node=nodes?.[nodeId],resource=RESOURCE_MAP_05A.get(node?.resourceId);
 if(!resource||resource.activity!=='gather'||resource.region!==region)return {ok:false,reason:'NOT_GATHERABLE'};
 if(!node.discovered)return {ok:false,reason:'UNDISCOVERED'};
 const current=resourceAt05A(node,resource,seconds);
 if(current.remaining<1)return {ok:false,reason:'DEPLETED'};
 return {ok:true,resource,node:{...current,remaining:current.remaining-1,lastSecond:seconds}};
}
