/** 05-H pilot mineral processing; deterministic and independent of geology/save layers.
 * This is an intentionally small crafting bridge, not a metallurgical simulation.
 */
export const REFINING_RECIPES_05H=Object.freeze([
 {id:'refine05h:copper',name:'구리 제련',station:'furnace',input:'item05a:copper-ore',inputQty:2,output:'item05h:copper-ingot',outputQty:1,seconds:600},
 {id:'refine05h:iron',name:'철 제련',station:'furnace',input:'item05a:iron-ore',inputQty:2,output:'item05h:iron-ingot',outputQty:1,seconds:600},
 {id:'refine05h:tin',name:'주석 제련',station:'furnace',input:'item05a:tin-ore',inputQty:2,output:'item05h:tin-ingot',outputQty:1,seconds:600},
 {id:'refine05h:stone',name:'석재 가공',station:'workbench',input:'item05a:stone',inputQty:2,output:'item05h:cut-stone',outputQty:1,seconds:300},
 {id:'refine05h:clay',name:'점토 성형',station:'workbench',input:'item05a:clay',inputQty:2,output:'item05h:clay-brick',outputQty:1,seconds:300},
 {id:'refine05h:bronze',name:'청동 합금',station:'furnace',inputs:[{itemId:'item05h:copper-ingot',quantity:2},{itemId:'item05h:tin-ingot',quantity:1}],output:'item05h:bronze-ingot',outputQty:2,seconds:900},
 {id:'craft05i:copper-pickaxe',name:'구리 곡괭이 제작',station:'workbench',inputs:[{itemId:'item05h:copper-ingot',quantity:2},{itemId:'item05h:cut-stone',quantity:1}],output:'tool05a:pickaxe:copper',outputQty:1,seconds:600},
 {id:'craft05i:copper-axe',name:'구리 벌목 도끼 제작',station:'workbench',inputs:[{itemId:'item05h:copper-ingot',quantity:2},{itemId:'item05h:cut-stone',quantity:1}],output:'tool05a:axe:copper',outputQty:1,seconds:600},
 {id:'craft05i:iron-pickaxe',name:'철 곡괭이 제작',station:'workbench',inputs:[{itemId:'item05h:iron-ingot',quantity:2},{itemId:'item05h:cut-stone',quantity:1}],output:'tool05a:pickaxe:iron',outputQty:1,seconds:600},
 {id:'craft05i:iron-axe',name:'철 벌목 도끼 제작',station:'workbench',inputs:[{itemId:'item05h:iron-ingot',quantity:2},{itemId:'item05h:cut-stone',quantity:1}],output:'tool05a:axe:iron',outputQty:1,seconds:600},
 {id:'craft05i:bronze-pickaxe',name:'청동 곡괭이 제작',station:'workbench',inputs:[{itemId:'item05h:bronze-ingot',quantity:2},{itemId:'item05h:cut-stone',quantity:1}],output:'tool05a:pickaxe:bronze',outputQty:1,seconds:600},
 {id:'craft05i:bronze-axe',name:'청동 벌목 도끼 제작',station:'workbench',inputs:[{itemId:'item05h:bronze-ingot',quantity:2},{itemId:'item05h:cut-stone',quantity:1}],output:'tool05a:axe:bronze',outputQty:1,seconds:600}
]);
export const REFINING_BY_ID_05H=new Map(REFINING_RECIPES_05H.map(r=>[r.id,r]));
export const REFINED_ITEMS_05H=Object.freeze([
 {id:'item05h:copper-ingot',name:'구리 주괴',family:'processed_metal'},
 {id:'item05h:iron-ingot',name:'철 주괴',family:'processed_metal'},
 {id:'item05h:tin-ingot',name:'주석 주괴',family:'processed_metal'},
 {id:'item05h:cut-stone',name:'다듬은 석재',family:'processed_stone'},
 {id:'item05h:clay-brick',name:'성형 점토벽돌',family:'processed_clay'},
 {id:'item05h:bronze-ingot',name:'청동 주괴',family:'processed_metal'}
]);
export function refineMineral05H(itemWorld,ownerId,recipeId){
 const recipe=REFINING_BY_ID_05H.get(recipeId);
 if(!recipe)return {ok:false,reason:'UNKNOWN_RECIPE'};
 const requirements=recipe.inputs??[{itemId:recipe.input,quantity:recipe.inputQty}];
 let items=itemWorld.items;
 for(const req of requirements){
  const owned=items.filter(item=>item.definitionId===req.itemId&&item.quantity>0&&
   itemWorld.placements.some(p=>p.itemId===item.id&&p.location.kind==='inventory'&&p.location.ownerId===ownerId));
  if(owned.reduce((n,item)=>n+item.quantity,0)<req.quantity)return {ok:false,reason:'INSUFFICIENT_MATERIAL'};
 }
 // All material availability was checked before changing any item instance.
 for(const req of requirements){
  let needed=req.quantity;
  items=items.map(item=>{
   if(needed===0||item.definitionId!==req.itemId||!itemWorld.placements.some(p=>p.itemId===item.id&&p.location.kind==='inventory'&&p.location.ownerId===ownerId))return item;
   const used=Math.min(needed,item.quantity);needed-=used;
   return {...item,quantity:item.quantity-used};
  });
 }
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
