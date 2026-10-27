/** 05-N first carpentry and textile item expansion. Final products have no housing
 * placement, storage capacity or equipment stats until gameplay actions are implemented.
 */
export const LIFESTYLE_CRAFT_ITEMS_05N=Object.freeze([
 {id:'item05n:wooden-stool',name:'목재 스툴',family:'crafted_furniture'},
 {id:'item05n:wooden-shelf',name:'목재 선반',family:'crafted_furniture'},
 {id:'item05n:cloth-pouch',name:'천 주머니',family:'crafted_accessory'},
 {id:'item05n:bark-journal-cover',name:'수피 책표지',family:'crafted_stationery'},
 {id:'item05n:braided-mat',name:'엮음 돗자리',family:'crafted_decor'},
 {id:'item05n:resin-wood-tray',name:'송진 마감 목재 쟁반',family:'crafted_tableware'}
]);
export const LIFESTYLE_CRAFT_RECIPES_05N=Object.freeze([
 {id:'craft05n:wooden-stool',name:'목재 스툴 제작',station:'workbench',inputs:[
  {material:{family:'processed_wood',form:'plank',minGrade:1},quantity:3},
  {itemId:'item05l:grass-rope',quantity:1}
 ],output:'item05n:wooden-stool',outputQty:1,seconds:600},
 {id:'craft05n:wooden-shelf',name:'목재 선반 제작',station:'workbench',inputs:[
  {material:{family:'processed_wood',form:'plank',minGrade:1},quantity:4},
  {itemId:'item05m:refined-pine-resin',quantity:1}
 ],output:'item05n:wooden-shelf',outputQty:1,seconds:900},
 {id:'craft05n:cloth-pouch',name:'천 주머니 제작',station:'workbench',inputs:[
  {itemId:'item05m:plant-cloth',quantity:2},{itemId:'item05m:plant-yarn',quantity:1}
 ],output:'item05n:cloth-pouch',outputQty:1,seconds:600},
 {id:'craft05n:bark-journal-cover',name:'수피 책표지 제작',station:'workbench',inputs:[
  {itemId:'item05m:birch-bark-sheet',quantity:2},{itemId:'item05m:plant-yarn',quantity:1}
 ],output:'item05n:bark-journal-cover',outputQty:1,seconds:600},
 {id:'craft05n:braided-mat',name:'엮음 돗자리 제작',station:'workbench',inputs:[
  {itemId:'item05m:willow-strips',quantity:3},{itemId:'item05m:plant-yarn',quantity:2}
 ],output:'item05n:braided-mat',outputQty:1,seconds:600},
 {id:'craft05n:resin-wood-tray',name:'송진 마감 목재 쟁반 제작',station:'workbench',inputs:[
  {material:{family:'processed_wood',form:'plank',minGrade:1},quantity:2},
  {itemId:'item05m:refined-pine-resin',quantity:1}
 ],output:'item05n:resin-wood-tray',outputQty:1,seconds:600}
]);
