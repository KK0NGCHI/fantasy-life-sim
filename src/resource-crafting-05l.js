/** 05-L first playable closed crafting loop. All inputs already have acquisition
 * paths (grass via gathering, oak planks via existing 05-H woodworking).
 * Recipes are data definitions, not world-spawn or save migrations.
 */
export const CRAFTING_ITEMS_05L=Object.freeze([
 Object.freeze({id:'item05l:grass-rope',name:'풀섬유 밧줄',family:'processed_fiber'}),
 Object.freeze({id:'item05l:wood-basket',name:'목재 바구니',family:'crafted_storage'})
]);
export const CRAFTING_RECIPES_05L=Object.freeze([
 Object.freeze({id:'craft05l:grass-rope',name:'풀섬유 밧줄 만들기',station:'workbench',
  inputs:[{itemId:'item05a:grass',quantity:3}],
  output:'item05l:grass-rope',outputQty:1,seconds:300}),
 Object.freeze({id:'craft05l:wood-basket',name:'목재 바구니 만들기',station:'workbench',
  inputs:[{material:{family:'processed_wood',form:'plank',minGrade:1},quantity:2},
   {itemId:'item05l:grass-rope',quantity:1}],
  output:'item05l:wood-basket',outputQty:1,seconds:600})
]);
/** Trusted registry-derived material properties, not user-supplied input. */
export const CRAFTING_MATERIALS_05L=Object.freeze({
 'item05h:oak-planks':Object.freeze({family:'processed_wood',form:'plank',grade:1,traits:[],originClass:'mundane'})
});
