/** 05-N second lifestyle-crafting expansion: material roles are recipe annotations.
 * They express the part's function, not buffs or housing functionality.
 */
const plank={family:'processed_wood',form:'plank',minGrade:1};
export const ROLE_CRAFT_ITEMS_05N=Object.freeze([
 {id:'item05n:framed-cloth-panel',name:'목재 틀 직물 패널',family:'crafted_decor'},
 {id:'item05n:reed-screen',name:'갈대 가림막',family:'crafted_decor'},
 {id:'item05n:wooden-writing-board',name:'목재 필기판',family:'crafted_stationery'},
 {id:'item05n:resin-bound-case',name:'송진 결합 수피함',family:'crafted_storage'}
]);
export const ROLE_CRAFT_RECIPES_05N=Object.freeze([
 {id:'craft05n:framed-cloth-panel',name:'목재 틀 직물 패널 제작',station:'workbench',inputs:[
  {material:plank,quantity:2,role:'structural'},
  {itemId:'item05m:plant-cloth',quantity:2,role:'functional'},
  {itemId:'item05m:plant-yarn',quantity:1,role:'binding'}
 ],output:'item05n:framed-cloth-panel',outputQty:1,seconds:600},
 {id:'craft05n:reed-screen',name:'갈대 가림막 제작',station:'workbench',inputs:[
  {material:plank,quantity:2,role:'structural'},
  {itemId:'item05m:reed-fiber',quantity:3,role:'functional'},
  {itemId:'item05m:willow-strips',quantity:2,role:'binding'}
 ],output:'item05n:reed-screen',outputQty:1,seconds:600},
 {id:'craft05n:wooden-writing-board',name:'목재 필기판 제작',station:'workbench',inputs:[
  {material:plank,quantity:2,role:'structural'},
  {itemId:'item05m:birch-bark-sheet',quantity:1,role:'functional'},
  {itemId:'item05m:refined-pine-resin',quantity:1,role:'binding'}
 ],output:'item05n:wooden-writing-board',outputQty:1,seconds:600},
 {id:'craft05n:resin-bound-case',name:'송진 결합 수피함 제작',station:'workbench',inputs:[
  {material:plank,quantity:2,role:'structural'},
  {itemId:'item05m:birch-bark-sheet',quantity:2,role:'functional'},
  {itemId:'item05m:refined-pine-resin',quantity:1,role:'binding'}
 ],output:'item05n:resin-bound-case',outputQty:1,seconds:900}
]);
