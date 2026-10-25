/** 05-H pilot mineral processing; deterministic and independent of geology/save layers.
 * This is an intentionally small crafting bridge, not a metallurgical simulation.
 */
export const REFINING_RECIPES_05H=Object.freeze([
 {id:'refine05h:copper',name:'구리 제련',station:'furnace',input:'item05a:copper-ore',inputQty:2,output:'item05h:copper-ingot',outputQty:1,seconds:600},
 {id:'refine05h:iron',name:'철 제련',station:'furnace',input:'item05a:iron-ore',inputQty:2,output:'item05h:iron-ingot',outputQty:1,seconds:600},
 {id:'refine05h:tin',name:'주석 제련',station:'furnace',input:'item05a:tin-ore',inputQty:2,output:'item05h:tin-ingot',outputQty:1,seconds:600},
 {id:'refine05h:stone',name:'석재 가공',station:'workbench',input:'item05a:stone',inputQty:2,output:'item05h:cut-stone',outputQty:1,seconds:300},
 {id:'refine05h:clay',name:'점토 성형',station:'workbench',input:'item05a:clay',inputQty:2,output:'item05h:clay-brick',outputQty:1,seconds:300}
]);
export const REFINING_BY_ID_05H=new Map(REFINING_RECIPES_05H.map(r=>[r.id,r]));
export const REFINED_ITEMS_05H=Object.freeze([
 {id:'item05h:copper-ingot',name:'구리 주괴',family:'processed_metal'},
 {id:'item05h:iron-ingot',name:'철 주괴',family:'processed_metal'},
 {id:'item05h:tin-ingot',name:'주석 주괴',family:'processed_metal'},
 {id:'item05h:cut-stone',name:'다듬은 석재',family:'processed_stone'},
 {id:'item05h:clay-brick',name:'성형 점토벽돌',family:'processed_clay'}
]);
export function refineMineral05H(itemWorld,ownerId,recipeId){
 const recipe=REFINING_BY_ID_05H.get(recipeId);
 if(!recipe)return {ok:false,reason:'UNKNOWN_RECIPE'};
 const owned=itemWorld.items.filter(item=>item.definitionId===recipe.input&&item.quantity>0&&
  itemWorld.placements.some(p=>p.itemId===item.id&&p.location.kind==='inventory'&&p.location.ownerId===ownerId));
 const available=owned.reduce((n,item)=>n+item.quantity,0);
 if(available<recipe.inputQty)return {ok:false,reason:'INSUFFICIENT_MATERIAL'};
 let needed=recipe.inputQty;
 let items=itemWorld.items.map(item=>{
  if(needed===0||!owned.some(x=>x.id===item.id))return item;
  const used=Math.min(needed,item.quantity);needed-=used;
  return {...item,quantity:item.quantity-used};
 });
 // The canonical item world forbids zero-quantity item instances. Remove exhausted stacks and placements atomically.
 const exhausted=new Set(items.filter(item=>item.quantity===0).map(item=>item.id));
 items=items.filter(item=>item.quantity>0);
 const retainedPlacements=itemWorld.placements.filter(p=>!exhausted.has(p.itemId));
 const outputId='refined05h:'+recipe.output;
 const prev=items.find(item=>item.id===outputId);
 if(prev){
  if(!retainedPlacements.some(p=>p.itemId===outputId&&p.location.kind==='inventory'&&p.location.ownerId===ownerId))return {ok:false,reason:'OUTPUT_NOT_OWNED'};
  items=items.map(item=>item.id===outputId?{...item,quantity:item.quantity+recipe.outputQty}:item);
 }else items=[...items,{id:outputId,definitionId:recipe.output,quantity:recipe.outputQty}];
 const placements=prev?retainedPlacements:[...retainedPlacements,{itemId:outputId,location:{kind:'inventory',ownerId}}];
 return {ok:true,itemWorld:{...itemWorld,items,placements},recipe};
}
