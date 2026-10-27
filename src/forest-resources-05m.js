/** 05-M2 first source expansion. Existing oak/pine node behavior is retained.
 * Values are provisional and source-specific by resourceId.
 */
export const FOREST_ITEMS_05M=Object.freeze([
 Object.freeze({id:'item05m:birch-planks',name:'자작나무 판재',family:'processed_wood'}),
 Object.freeze({id:'item05m:willow-planks',name:'버드나무 판재',family:'processed_wood'})
]);
export const FOREST_RECIPES_05M=Object.freeze([
 Object.freeze({id:'refine05m:birch-planks',name:'자작나무 판재 가공',station:'workbench',
 input:'item05a:birch-log',inputQty:2,output:'item05m:birch-planks',outputQty:2,seconds:300}),
 Object.freeze({id:'refine05m:willow-planks',name:'버드나무 판재 가공',station:'workbench',
 input:'item05a:willow-log',inputQty:2,output:'item05m:willow-planks',outputQty:2,seconds:300})
]);
export const FOREST_MATERIALS_05M=Object.freeze({
 'item05m:birch-planks':Object.freeze({family:'processed_wood',form:'plank',grade:1,traits:['light'],originClass:'mundane'}),
 'item05m:willow-planks':Object.freeze({family:'processed_wood',form:'plank',grade:1,traits:['flexible'],originClass:'mundane'})
});
