import {createEcologySite,ecologyInteract,validateEcologyDefinition} from './ecology-core-05a.js';
import {ecologyClimate05A} from './ecology-climate-05a.js';

/** Ten provisional game-world fungi; edibility is NOT a safety claim.
 * A mycelium persists as a site, whereas its fruiting body is episodic.
 * Substrate and guild are fungi-specific policy, not ecology-core rules.
 */
const fungi=[
 ['oyster','느타리버섯','Pleurotus ostreatus',['숲'],'deadwood','saprotroph','common',['spring','autumn'],3],
 ['shiitake','표고버섯','Lentinula edodes',['숲'],'hardwood','saprotroph','uncommon',['spring','autumn'],2],
 ['wood-ear','목이버섯','Auricularia heimuer',['숲','습지'],'deadwood','saprotroph','common',['spring','summer','autumn'],3],
 ['turkey-tail','운지버섯','Trametes versicolor',['숲'],'deadwood','saprotroph','common',['spring','summer','autumn'],3],
 ['chanterelle','꾀꼬리버섯','Cantharellus cibarius',['숲','산맥'],'living-tree-roots','mycorrhizal','uncommon',['summer','autumn'],2],
 ['porcini','그물버섯','Boletus edulis',['숲','산맥'],'living-tree-roots','mycorrhizal','rare',['summer','autumn'],2],
 ['field-mushroom','들주름버섯','Agaricus campestris',['초원·농경지'],'grassland-soil','saprotroph','common',['summer','autumn'],3],
 ['puffball','말불버섯','Lycoperdon perlatum',['초원·농경지','숲'],'leaf-litter','saprotroph','uncommon',['summer','autumn'],2],
 ['enoki','팽이버섯','Flammulina velutipes',['숲'],'deadwood','saprotroph','uncommon',['autumn','winter'],2],
 ['inkcap','먹물버섯','Coprinopsis atramentaria',['초원·농경지','습지'],'rich-soil','saprotroph','uncommon',['spring','autumn'],2]
];
export const FUNGAL_SPECIES_05B=Object.freeze(fungi.map(([key,name,scientificName,regions,substrate,guild,encounterClass,seasons,capacity])=>Object.freeze({
 key,id:'item05b:'+key,name,scientificName,regions:Object.freeze(regions),substrate,guild,encounterClass,seasons:Object.freeze(seasons),
 capacity,regrowRainDays:encounterClass==='rare'?5:encounterClass==='uncommon'?3:2,
 reviewStatus:'gameplay-provisional',toxicity:'unverified-not-food-safe'
})));
export const FUNGAL_ITEMS_05B=Object.freeze(FUNGAL_SPECIES_05B.map(x=>({id:x.id,name:x.name,family:'fungus'})));
export const FUNGAL_BY_ID_05B=new Map(FUNGAL_SPECIES_05B.map(x=>[x.id,x]));
export const FUNGAL_ECOLOGY_DEFS_05B=Object.freeze(FUNGAL_SPECIES_05B.map(p=>{
 const definition={id:p.id,habitats:p.regions,capacity:p.capacity,regrowSeconds:86400,
  mode:'gather',seasons:p.seasons,outputs:[{id:p.id,part:'material',stage:'bloom',weight:1}]};
 if(!validateEcologyDefinition(definition))throw Error('INVALID_FUNGAL_DEFINITION');
 return Object.freeze(definition);
}));
export const FUNGAL_ECOLOGY_MAP_05B=new Map(FUNGAL_ECOLOGY_DEFS_05B.map(x=>[x.id,x]));
export function createFungalEcology05B(startSecond=0){
 return Object.fromEntries(FUNGAL_ECOLOGY_DEFS_05B.flatMap(def=>def.habitats.map(region=>{
  const site=createEcologySite(def,region,0,startSecond);
  return [site.id,{...site,wetCredit:0}];
 })));
}
/** Pure wet-day count. Time is from the authoritative game clock, weather comes
 * from the deterministic world climate. A dry day never replenishes fruiting stock.
 * Mycelium remains present even when no mushrooms are visible.
 */
export function fungalReconcile05B(site,def,second,worldSeed){
 if(!FUNGAL_ECOLOGY_MAP_05B.has(def?.id)||site.speciesId!==def.id||!Number.isSafeInteger(second)||second<site.updatedAt)
  throw Error('INVALID_FUNGAL_RECONCILIATION');
 const sp=FUNGAL_BY_ID_05B.get(def.id);
 const fromDay=Math.floor((site.updatedAt+28800)/86400);
 const toDay=Math.floor((second+28800)/86400);
 if(toDay-fromDay>20000)throw Error('FUNGAL_TIME_HORIZON');
 let wetDays=0;
 // Count completed in-game days; do not award partial weather days.
 for(let d=fromDay;d<toDay;d++){
  const w=ecologyClimate05A(worldSeed,site.region,d*86400).weather;
  if(w==='rain')wetDays++;
 }
 const credit=(site.wetCredit??0)+wetDays;
 const grown=Math.floor(credit/sp.regrowRainDays);
 // Consume all processed days in the clock; remainder can only be carried if
 // encoded separately. For the first iteration, fruiting is pulse-based per window.
 return {...site,remaining:Math.min(def.capacity,site.remaining+grown),
  wetCredit:credit%sp.regrowRainDays,updatedAt:second};
}
/** Fruiting requires rain recently, adequate season and correct substrate.
 * A species can survive the season without a fruiting body.
 */
/** Age since last triggering rain day, including today. The underlying
 * mycelium persists when a fruit body ages out. Provisional lifecycle:
 * fresh on rain day, mature next day, old on day 2, decomposed from day 3.
 */
export function fungalFruiting05B(species,region,second,seed,substrate){
 if(!Number.isSafeInteger(second)||second<0)throw Error('INVALID_FUNGAL_TIME');
 if(!species||!species.regions.includes(region))return {present:false,fruiting:false,stage:'absent',reason:'WRONG_HABITAT'};
 const day=Math.floor((second+28800)/86400);
 const season=['spring','summer','autumn','winter'][Math.floor(day%112/28)];
 if(substrate!==undefined&&substrate!==species.substrate)return {present:true,fruiting:false,stage:'dormant',reason:'WRONG_SUBSTRATE'};
 if(!species.seasons.includes(season))return {present:true,fruiting:false,stage:'dormant',reason:'OFF_SEASON'};
 let lastWet=-1;
 for(let d=day;d>=Math.max(0,day-3);d--){
  if(ecologyClimate05A(seed,region,d*86400).weather==='rain'){lastWet=d;break}
 }
 if(lastWet<0)return {present:true,fruiting:false,stage:'dormant',reason:'DRY_PERIOD'};
 const ageDays=day-lastWet;
 const stage=ageDays===0?'fresh':ageDays===1?'mature':ageDays===2?'aging':'decomposed';
 return {present:true,fruiting:ageDays<=1,stage,ageDays,reason:ageDays<=1?'FRUITING':stage==='aging'?'AGING':'DECOMPOSED'};
}
export function fungalHarvest05B(site,def,second,seed,roll=0){
 const p=FUNGAL_BY_ID_05B.get(site?.speciesId);
 if(!p)throw Error('UNKNOWN_FUNGUS');
 const siteNow=fungalReconcile05B(site,def,second,seed);
 const fruiting=fungalFruiting05B(p,site.region,second,seed,p.substrate);
 if(!fruiting.fruiting)return {ok:false,reason:fruiting.reason,site:siteNow};
 const day=Math.floor((second+28800)/86400);
 const season=['spring','summer','autumn','winter'][Math.floor(day%112/28)];
 return ecologyInteract(siteNow,def,{region:site.region,season,bloom:true,mature:true},
  {second,roll,action:'gather'});
}
