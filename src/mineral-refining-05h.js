import {craftWithAllocatedMaterials} from './material-crafting-05k.js';
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
 {id:'craft05i:bronze-axe',name:'청동 벌목 도끼 제작',station:'workbench',inputs:[{itemId:'item05h:bronze-ingot',quantity:2},{itemId:'item05h:cut-stone',quantity:1}],output:'tool05a:axe:bronze',outputQty:1,seconds:600},
 {id:'upgrade05i:reinforced-stone-pickaxe',name:'보강 석재 곡괭이 제작 (임시 성장 연결)',station:'workbench',inputs:[{itemId:'item05h:cut-stone',quantity:2},{itemId:'item05h:clay-brick',quantity:1}],output:'tool05a:pickaxe:reinforcedStone',outputQty:1,seconds:600},
 {id:'upgrade05i:reinforced-bronze-pickaxe',name:'보강 청동 곡괭이 제작 (임시 성장 연결)',station:'workbench',inputs:[{itemId:'item05h:bronze-ingot',quantity:2},{itemId:'item05h:cut-stone',quantity:1}],output:'tool05a:pickaxe:reinforcedBronze',outputQty:1,seconds:600},
 {id:'refine05h:oak-planks',name:'참나무 판재 가공',station:'workbench',input:'item05a:oak-log',inputQty:2,output:'item05h:oak-planks',outputQty:2,seconds:300},
 {id:'craft05i:processed-wood-rod',name:'가공 목재 낚싯대 제작',station:'workbench',inputs:[{itemId:'item05h:oak-planks',quantity:2},{itemId:'item05a:grass',quantity:2}],output:'tool05a:rod:processedWood',outputQty:1,seconds:600},
 {id:'craft05i:mycelium-gloves',name:'균사 섬유 채집 장갑 제작 (임시 생활 연결)',station:'workbench',inputs:[{itemId:'item05b:wood-ear',quantity:2},{itemId:'item05a:grass',quantity:2}],output:'tool05a:gloves:mycelium',outputQty:1,seconds:600}
]);
export const REFINING_BY_ID_05H=new Map(REFINING_RECIPES_05H.map(r=>[r.id,r]));
export const REFINED_ITEMS_05H=Object.freeze([
 {id:'item05h:copper-ingot',name:'구리 주괴',family:'processed_metal'},
 {id:'item05h:iron-ingot',name:'철 주괴',family:'processed_metal'},
 {id:'item05h:tin-ingot',name:'주석 주괴',family:'processed_metal'},
 {id:'item05h:cut-stone',name:'다듬은 석재',family:'processed_stone'},
 {id:'item05h:clay-brick',name:'성형 점토벽돌',family:'processed_clay'},
 {id:'item05h:oak-planks',name:'참나무 판재',family:'processed_wood'},
 {id:'item05h:bronze-ingot',name:'청동 주괴',family:'processed_metal'}
]);
/** Legacy 05-H/I dispatcher API; now shares the 05-J allocator through 05-K.
 * All existing exact-ID recipes, output IDs, and station/duration metadata stay unchanged.
 */
export function refineMineral05H(itemWorld,ownerId,recipeId){
 const recipe=REFINING_BY_ID_05H.get(recipeId);
 if(!recipe)return {ok:false,reason:'UNKNOWN_RECIPE'};
 return craftWithAllocatedMaterials(itemWorld,ownerId,recipe);
}
