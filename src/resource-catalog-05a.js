/** 05-A approved taxonomy + proposed biome catalogue (additive, not live spawns).
 * No runtime/save changes. Species, sources and obtained items remain distinct.
 * Candidate fantasy species must not silently become canonical worldbuilding.
 */
export const RESOURCE_REGIONS_05A=Object.freeze([
'거점 마을','초원·농경지','숲','강·호수','습지','산맥','광산','설원',
'사막','해안·항구','바다','화산지대','고대 유적','폐허·묘지','만신전','지하미궁'
]);
export const RESOURCE_DEPTHS_05A=Object.freeze({
'깊은 숲':'숲','심층 광산':'광산','심해':'바다','심층 미궁':'지하미궁'
});
export const RESOURCE_FAMILIES_05A=Object.freeze([
'herb','flower','fruit','vine','moss','fungus','tree','wood','stone','soil',
'metal_ore','nonmetal_mineral','gem','freshwater_life','marine_life','deepsea_life',
'animal_product','monster_product','relic'
]);
const item=(id,name,family)=>Object.freeze({id:'item05a:'+id,name,family});
export const CATALOG_ITEMS_05A=Object.freeze([
item('wild-herb','야생 약초','herb'),item('mushroom','일반 버섯','fungus'),
item('grass','들풀','herb'),item('oak-log','참나무 통나무','wood'),
item('pine-log','소나무 통나무','wood'),item('stone','일반 돌','stone'),
item('coal','석탄','nonmetal_mineral'),item('copper-ore','구리광석','metal_ore'),
item('iron-ore','철광석','metal_ore'),item('small-fish','작은 민물고기','freshwater_life'),
item('carp','잉어','freshwater_life'),item('trout','송어','freshwater_life'),
item('blueberry','블루베리','fruit'),item('oak-sap','참나무 수액','wood'),
item('quartz','수정 원석','gem'),item('reed','갈대','herb'),
item('mussel','홍합','marine_life'),item('sacred-oak-log','신성한 참나무 통나무','wood'),
item('marsh-bell-mushroom','늪은방울버섯','fungus')
]);
/** One source may produce multiple items. Source id is never an inventory item id. */
export const RESOURCE_SPECIES_05A=Object.freeze([
{id:'source05a:oak',name:'참나무',family:'tree',regions:['숲','초원·농경지'],outputs:['item05a:oak-log','item05a:oak-sap'],status:'existing'},
{id:'source05a:pine',name:'소나무',family:'tree',regions:['숲','산맥','설원'],outputs:['item05a:pine-log'],status:'existing'},
{id:'source05a:wild-herb',name:'야생 약초',family:'herb',regions:['숲','초원·농경지'],outputs:['item05a:wild-herb'],status:'existing'},
{id:'source05a:mushroom',name:'일반 버섯',family:'fungus',regions:['숲','습지'],outputs:['item05a:mushroom'],status:'existing'},
{id:'source05a:grass',name:'들풀',family:'herb',regions:['초원·농경지','숲'],outputs:['item05a:grass'],status:'existing'},
{id:'source05a:stone',name:'일반 암석',family:'stone',regions:['광산','산맥'],outputs:['item05a:stone'],status:'existing'},
{id:'source05a:coal',name:'석탄층',family:'nonmetal_mineral',regions:['광산','산맥'],outputs:['item05a:coal'],status:'existing'},
{id:'source05a:copper',name:'구리 광맥',family:'metal_ore',regions:['광산','산맥'],outputs:['item05a:copper-ore'],status:'existing'},
{id:'source05a:iron',name:'철 광맥',family:'metal_ore',regions:['광산','산맥'],outputs:['item05a:iron-ore'],status:'existing'},
{id:'source05a:small-fish',name:'작은 민물고기',family:'freshwater_life',regions:['강·호수'],outputs:['item05a:small-fish'],status:'existing'},
{id:'source05a:carp',name:'잉어',family:'freshwater_life',regions:['강·호수','습지'],outputs:['item05a:carp'],status:'existing'},
{id:'source05a:trout',name:'송어',family:'freshwater_life',regions:['강·호수','설원'],outputs:['item05a:trout'],status:'existing'},
{id:'source05a:blueberry',name:'블루베리 관목',family:'fruit',regions:['숲','초원·농경지'],outputs:['item05a:blueberry'],status:'candidate'},
{id:'source05a:quartz',name:'수정 광맥',family:'gem',regions:['광산','산맥'],outputs:['item05a:quartz'],status:'candidate'},
{id:'source05a:reed',name:'갈대',family:'herb',regions:['습지','강·호수'],outputs:['item05a:reed'],status:'candidate'},
{id:'source05a:mussel',name:'홍합',family:'marine_life',regions:['해안·항구'],outputs:['item05a:mussel'],status:'candidate'},
{id:'source05a:sacred-oak',name:'신성한 참나무',family:'tree',regions:['깊은 숲'],outputs:['item05a:sacred-oak-log'],status:'test-only'},
{id:'source05a:marsh-bell',name:'늪은방울버섯',family:'fungus',regions:['습지'],outputs:['item05a:marsh-bell-mushroom'],status:'candidate'}
].map(x=>Object.freeze({...x,regions:Object.freeze(x.regions),outputs:Object.freeze(x.outputs)})));
export const RESOURCE_BIOMES_05A=Object.freeze({
'거점 마을':{families:['herb','flower','fruit'],note:'기초 채집·시설 중심'},
'초원·농경지':{families:['herb','flower','fruit','soil','tree'],note:'풀·약초·야생 과실'},
'숲':{families:['tree','wood','herb','fungus','fruit','vine','moss'],note:'일반 수목·버섯'},
'강·호수':{families:['freshwater_life','herb','moss'],note:'담수 어획·수생 식물'},
'습지':{families:['herb','moss','fungus','freshwater_life','soil'],note:'습생 식물·균류'},
'산맥':{families:['stone','metal_ore','nonmetal_mineral','gem','tree'],note:'암석·광물·고산 식생'},
'광산':{families:['stone','metal_ore','nonmetal_mineral','gem'],note:'채굴 필드 (비타일)'},
'설원':{families:['tree','moss','herb','freshwater_life'],note:'한대 자연물'},
'사막':{families:['herb','soil','stone','nonmetal_mineral','gem'],note:'건조지 자원'},
'해안·항구':{families:['marine_life','herb','relic'],note:'연안 채집·어업'},
'바다':{families:['marine_life','relic'],note:'해양 생물·인양'},
'화산지대':{families:['stone','nonmetal_mineral','tree'],note:'고열 광물·화산암'},
'고대 유적':{families:['relic','gem','stone'],note:'유물·고대 잔해'},
'폐허·묘지':{families:['relic','monster_product','stone'],note:'잔해·뼈·부패'},
'만신전':{families:['relic'],note:'제단·봉헌 중심, 강제 자연 노드 없음'},
'지하미궁':{families:['stone','gem','fungus','relic'],note:'층별 자원'}
});
const itemIds=new Set(CATALOG_ITEMS_05A.map(x=>x.id));
const speciesIds=new Set(RESOURCE_SPECIES_05A.map(x=>x.id));
export function validateResourceCatalog05A(){
 if(itemIds.size!==CATALOG_ITEMS_05A.length||speciesIds.size!==RESOURCE_SPECIES_05A.length)return false;
 if(Object.keys(RESOURCE_BIOMES_05A).length!==16)return false;
 if(!RESOURCE_REGIONS_05A.every(r=>Object.hasOwn(RESOURCE_BIOMES_05A,r)))return false;
 return RESOURCE_SPECIES_05A.every(s=>s.regions.every(r=>RESOURCE_REGIONS_05A.includes(r)||Object.hasOwn(RESOURCE_DEPTHS_05A,r))&&s.outputs.every(id=>itemIds.has(id)));
}
/** Inventory/compendium hook: only successful acquisition records count. */
export function acquiredEntries05A(itemId){
 if(!itemIds.has(itemId))return null;
 const sources=RESOURCE_SPECIES_05A.filter(s=>s.outputs.includes(itemId)).map(s=>s.id);
 return {itemId,sourceIds:sources};
}
/** Item origin is explicit; region alone never implies sacred/cosmic tags. */
export function makeResourceProvenance05A({sourceId,region,traits=[]}){
 if(!speciesIds.has(sourceId)||!(RESOURCE_REGIONS_05A.includes(region)||Object.hasOwn(RESOURCE_DEPTHS_05A,region)))throw Error('INVALID_RESOURCE_ORIGIN');
 if(!Array.isArray(traits)||!traits.every(t=>typeof t==='string'&&t.length>0))throw Error('INVALID_RESOURCE_TRAITS');
 return {sourceId,region,traits:[...new Set(traits)]};
}
