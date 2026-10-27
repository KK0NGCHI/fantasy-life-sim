/** 05-M byproduct processing: item IDs are distinct from harvested resources.
 * Trial quantities and durations, no assumptions about the usability of the final
 * product as storage/equipment until separate mechanics are implemented.
 */
export const BYPRODUCT_CRAFT_ITEMS_05M=Object.freeze([
 {id:'item05m:refined-pine-resin',name:'정제 송진',family:'binder'},
 {id:'item05m:willow-strips',name:'버드나무 엮음재',family:'processed_fiber'},
 {id:'item05m:birch-bark-sheet',name:'자작나무 수피판',family:'processed_bark'},
 {id:'item05m:resin-sealed-basket',name:'송진 방수처리 바구니',family:'crafted_storage'},
 {id:'item05m:bark-lined-basket',name:'수피 안감 바구니',family:'crafted_storage'}
]);
export const BYPRODUCT_CRAFT_RECIPES_05M=Object.freeze([
 {id:'refine05m:pine-resin',name:'송진 정제',station:'workbench',input:'item05m:pine-resin',inputQty:2,output:'item05m:refined-pine-resin',outputQty:1,seconds:300},
 {id:'refine05m:willow-strips',name:'버드나무 가지 다듬기',station:'workbench',input:'item05m:willow-branch',inputQty:2,output:'item05m:willow-strips',outputQty:2,seconds:300},
 {id:'refine05m:birch-bark-sheet',name:'자작나무 수피 가공',station:'workbench',input:'item05m:birch-bark',inputQty:2,output:'item05m:birch-bark-sheet',outputQty:1,seconds:300},
 {id:'craft05m:resin-sealed-basket',name:'바구니 송진 방수처리',station:'workbench',
  inputs:[{itemId:'item05l:wood-basket',quantity:1},{itemId:'item05m:refined-pine-resin',quantity:1}],
  output:'item05m:resin-sealed-basket',outputQty:1,seconds:600},
 {id:'craft05m:bark-lined-basket',name:'수피 안감 바구니',station:'workbench',
  inputs:[{itemId:'item05l:wood-basket',quantity:1},{itemId:'item05m:birch-bark-sheet',quantity:1},
   {itemId:'item05m:willow-strips',quantity:2}],
  output:'item05m:bark-lined-basket',outputQty:1,seconds:600}
]);
