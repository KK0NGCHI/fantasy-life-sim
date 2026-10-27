/** 05-M fiber processing: harvested plants -> species fiber -> yarn -> cloth.
 * No assumption that leaves, flowers or all plants are spinnable.
 */
export const FIBER_ITEMS_05M=Object.freeze([
 {id:'item05m:reed-fiber',name:'갈대 섬유',family:'processed_fiber'},
 {id:'item05m:flax-fiber',name:'아마 섬유',family:'processed_fiber'},
 {id:'item05m:nettle-fiber',name:'쐐기풀 섬유',family:'processed_fiber'},
 {id:'item05m:plant-yarn',name:'식물성 실',family:'processed_fiber'},
 {id:'item05m:plant-cloth',name:'식물성 천',family:'processed_textile'},
 {id:'item05m:reed-mat',name:'갈대 돗자리',family:'crafted_decor'}
]);
export const FIBER_MATERIALS_05M=Object.freeze({
 'item05m:reed-fiber':Object.freeze({family:'plant_fiber',form:'spinnable',grade:1,traits:['coarse'],originClass:'mundane'}),
 'item05m:flax-fiber':Object.freeze({family:'plant_fiber',form:'spinnable',grade:1,traits:['fine'],originClass:'mundane'}),
 'item05m:nettle-fiber':Object.freeze({family:'plant_fiber',form:'spinnable',grade:1,traits:['strong'],originClass:'mundane'})
});
export const FIBER_RECIPES_05M=Object.freeze([
 {id:'refine05m:reed-fiber',name:'갈대 섬유 분리',station:'workbench',input:'item05a:reed',inputQty:2,output:'item05m:reed-fiber',outputQty:2,seconds:300},
 {id:'refine05m:flax-fiber',name:'아마 섬유 분리',station:'workbench',input:'item05a:flax',inputQty:2,output:'item05m:flax-fiber',outputQty:2,seconds:300},
 {id:'refine05m:nettle-fiber',name:'쐐기풀 섬유 분리',station:'workbench',input:'item05a:nettle',inputQty:2,output:'item05m:nettle-fiber',outputQty:2,seconds:300},
 {id:'refine05m:plant-yarn',name:'식물 섬유 방적',station:'workbench',inputs:[{material:{family:'plant_fiber',form:'spinnable',minGrade:1},quantity:2}],output:'item05m:plant-yarn',outputQty:2,seconds:300},
 {id:'refine05m:plant-cloth',name:'식물 실 직조',station:'workbench',input:'item05m:plant-yarn',inputQty:3,output:'item05m:plant-cloth',outputQty:1,seconds:600},
 {id:'craft05m:reed-mat',name:'갈대 돗자리 제작',station:'workbench',inputs:[{itemId:'item05m:reed-fiber',quantity:3},{itemId:'item05m:plant-yarn',quantity:1}],output:'item05m:reed-mat',outputQty:1,seconds:600}
]);
