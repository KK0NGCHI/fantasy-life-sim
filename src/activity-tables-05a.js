/** Provisional activity tables using ONLY existing catalogued items.
 * These are playable starter values, not approved final ecology or rarity.
 * No speculative 80-species botanical entries are shipped.
 */
import {BOTANICAL_PROFILES_05A} from './botanical-profiles-05a.js';
const entries=[
 ['숲','explore','item05a:wild-herb',0.20],
 ['숲','gather','item05a:mushroom',0.10],
 ['숲','logging','item05a:oak-log',0.04],
 ['초원·농경지','explore','item05a:blueberry',0.12],
 ['습지','explore','item05a:reed',0.16],
 ['강·호수','fishing','item05a:reed',0.08],
 ['해안·항구','explore','item05a:mussel',0.12],
 ['설원','explore','item05a:stone',0.03],
 ['사막','explore','item05a:stone',0.06],
 ['산맥','explore','item05a:stone',0.10],
 ['광산','mining','item05a:stone',0.08],
 ['고대 유적','investigate','item05a:stone',0.10],
 ['폐허·묘지','salvage','item05a:stone',0.12],
 ['바다','explore','item05a:mussel',0.06]
];
const noRegrowth={kind:'none'};
export const ACTIVITY_TABLES_05A=Object.freeze(Object.fromEntries(entries.map(([region,activity,itemId,triggerChance])=>[
 region+':'+activity,Object.freeze({region,activity,triggerChance,rewardMode:'item',
 pool:{id:'activity05a:'+region+':'+activity,spawnConditions:{regions:[region]},regenerationPolicy:noRegrowth,
 disappearancePolicy:'persist',tiers:[
 {id:'common',weight:70,outputs:[{itemId,weight:4},...BOTANICAL_PROFILES_05A.filter(s=>s.dropEnabled&&s.encounterClass==='common'&&s.regions.includes(region)&&activity==='explore').map(s=>({itemId:s.id,weight:1,conditions:{seasons:s.seasons}}))]},
 {id:'uncommon',weight:25,outputs:BOTANICAL_PROFILES_05A.filter(s=>s.dropEnabled&&s.encounterClass==='uncommon'&&s.regions.includes(region)&&activity==='explore').map(s=>({itemId:s.id,weight:1,conditions:{seasons:s.seasons}}))},
 {id:'rare',weight:5,outputs:BOTANICAL_PROFILES_05A.filter(s=>s.dropEnabled&&s.encounterClass==='rare'&&s.regions.includes(region)&&activity==='explore').map(s=>({itemId:s.id,weight:1,conditions:{seasons:s.seasons}}))}
 ].filter(t=>t.outputs.length)}})
])));
