/** 05-M non-destructive byproduct stocks, separate from logging remaining/progress.
 * Sidecar keys are nodeId + output item; no changes to legacy resource node shape.
 */
const DAY=86400;
export const TREE_BYPRODUCTS_05M=Object.freeze({
 'resource05a:oak-log':Object.freeze([
  {itemId:'item05m:oak-acorn',name:'도토리',capacity:2,regenDays:3},
  {itemId:'item05a:oak-sap',name:'참나무 수액',capacity:2,regenDays:4}
 ]),
 'resource05a:pine-log':Object.freeze([
  {itemId:'item05m:pine-cone',name:'솔방울',capacity:2,regenDays:3},
  {itemId:'item05m:pine-resin',name:'송진',capacity:2,regenDays:5}
 ]),
 'resource05a:birch-log':Object.freeze([
  {itemId:'item05m:birch-bark',name:'자작나무 수피',capacity:2,regenDays:4},
  {itemId:'item05m:birch-sap',name:'자작나무 수액',capacity:2,regenDays:5}
 ]),
 'resource05a:willow-log':Object.freeze([
  {itemId:'item05m:willow-branch',name:'버드나무 가지',capacity:2,regenDays:3}
 ])
});
export const TREE_BYPRODUCT_ITEMS_05M=Object.freeze(
 [...new Map(Object.values(TREE_BYPRODUCTS_05M).flat().filter(x=>x.itemId!=='item05a:oak-sap').map(x=>[x.itemId,{id:x.itemId,name:x.name,family:'tree_byproduct'}])).values()]
);
export const treeByproductKey05M=(nodeId,itemId)=>nodeId+'|'+itemId;
export function takeTreeByproduct05M(nodes,stocks,nodeId,itemId,region,now,resourceMap){
 const node=nodes?.[nodeId],def=resourceMap.get(node?.resourceId);
 const entry=TREE_BYPRODUCTS_05M[node?.resourceId]?.find(x=>x.itemId===itemId);
 if(!node||!def||!entry||def.region!==region)return {ok:false,reason:'WRONG_TREE_SOURCE'};
 if(!node.discovered)return {ok:false,reason:'UNDISCOVERED'};
 if(!Number.isSafeInteger(now)||now<node.lastSecond)return {ok:false,reason:'INVALID_RESOURCE_TIME'};
 if(node.remaining<=0)return {ok:false,reason:'TREE_DEPLETED'};
 const key=treeByproductKey05M(nodeId,itemId),old=stocks?.[key];
 if(old&&(!Number.isSafeInteger(old.remaining)||old.remaining<0||old.remaining>entry.capacity||
  !Number.isSafeInteger(old.lastSecond)||old.lastSecond<0||old.lastSecond>now))
  return {ok:false,reason:'INVALID_BYPRODUCT_STOCK'};
 let remaining=old?.remaining??entry.capacity,lastSecond=old?.lastSecond??now;
 if(old&&remaining<entry.capacity){
  const restored=Math.floor((now-lastSecond)/(entry.regenDays*DAY));
  if(restored>0){remaining=Math.min(entry.capacity,remaining+restored);lastSecond+=restored*entry.regenDays*DAY;}
 }
 if(remaining<1)return {ok:false,reason:'BYPRODUCT_DEPLETED'};
 return {ok:true,itemId,quantity:1,stocks:{...(stocks??{}),[key]:{remaining:remaining-1,lastSecond}}};
}
