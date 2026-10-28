import {buildWorldRegistry} from '../world/world-model.js';
import {SOMNIUM_WORLD_03A} from '../world/somnium-world.js';
import {validateWorldSnapshot03E} from '../world/world-persistence-03e.js';
import type {GameStateV2,SaveEnvelopeV2} from './save-v2.js';
import type {ItemRegistry} from '../data/item-registry.js';
import type {SaveSlot} from './save-format.js';
import {decodeSaveV2} from './save-v2.js';

/** v3 has an unambiguous global clock; v2 abstract elapsedUnits is never reinterpreted. */
export interface GameStateV3 extends Omit<GameStateV2,'schemaVersion'|'clock'>{
 readonly schemaVersion:3;
 readonly clock:{readonly elapsedSeconds:number;readonly calendarId:'somnium-calendar-v1';readonly startSecondOfDay:28800};
}
export interface SaveEnvelopeV3{
 readonly format:'somnium-save';readonly saveVersion:3;
 readonly contentVersion:string;readonly slot:SaveSlot;readonly state:GameStateV3;
}
export type V3Result={readonly ok:true;readonly save:SaveEnvelopeV3}|
 {readonly ok:false;readonly reason:'INVALID_DATA'|'INCOMPATIBLE_VERSION'};
const obj=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const seconds=(x:unknown):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0&&x<=Number.MAX_SAFE_INTEGER-28800;
const keys=(x:Record<string,unknown>,allowed:readonly string[])=>Object.keys(x).every(k=>allowed.includes(k));

/** 04-D: validate optional progression/origin BEFORE v3 decode accepts a save.
 * Legacy saves without these extensions remain valid and unmodified. */
const attrKeys=['근력','민첩','체력','지각','지능','의지','매력'] as const;
const skillKeys=Array.from({length:54},(_,i)=>'skill-'+String(i+1).padStart(2,'0'));
const speciesSizes:Readonly<Record<string,string>>={
 human:'medium',elf:'medium',dwarf:'medium',halfling:'small',
 beastfolk:'medium',orc:'medium',gnome:'small',fairy:'tiny'
};
const backgrounds=new Set(['farmer','fisher','miner','woodcutter','hunter','cook','artisan','alchemist',
 'scholar','archaeologist','merchant','traveler','mercenary','healer','acolyte','musician']);
const uint=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const exact=(value:Record<string,unknown>,names:readonly string[])=>
 Object.keys(value).length===names.length&&names.every(k=>Object.hasOwn(value,k));
function validProgressionExtension(progression:unknown):boolean{
 if(!obj(progression))return false;
 if(Object.hasOwn(progression,'system04A')){
  const x=progression.system04A;
  if(!obj(x)||!exact(x,['schema','ruleVersion','attributes','training','skills','awards'])||
   x.schema!==1||x.ruleVersion!==1||!obj(x.attributes)||!obj(x.training)||!obj(x.skills)||
   !exact(x.attributes,attrKeys)||!exact(x.training,attrKeys)||!exact(x.skills,skillKeys)||
   !attrKeys.every(k=>uint((x.attributes as Record<string,unknown>)[k])&&Number((x.attributes as Record<string,unknown>)[k])>=10&&uint((x.training as Record<string,unknown>)[k]))||
   !skillKeys.every(k=>uint((x.skills as Record<string,unknown>)[k]))||!Array.isArray(x.awards)||x.awards.length>10000||
   !x.awards.every(a=>typeof a==='string'&&a.length>0&&a.length<=160)||
   new Set(x.awards).size!==x.awards.length)return false;
 }
 if(Object.hasOwn(progression,'origin04B')){
  const o=progression.origin04B;
  if(!obj(o)||!exact(o,['schema','speciesId','backgroundId','bodySize','exclusiveAbilityId'])||
   o.schema!==1||typeof o.speciesId!=='string'||typeof o.backgroundId!=='string'||
   !backgrounds.has(o.backgroundId)||speciesSizes[o.speciesId]!==o.bodySize||
   o.exclusiveAbilityId!=='origin:'+o.backgroundId||!Object.hasOwn(progression,'system04A'))return false;
 }
 return true;
}

/** 05-A opt-in resource state. Validate before a save is accepted or applied.
 * No resource data is synthesized for legacy slots. */
const resourceCaps05A:Readonly<Record<string,number>>={
 'resource05a:wild-herb':5,'resource05a:mushroom':4,'resource05a:grass':8,
 'resource05a:reed':5,'resource05a:flax':5,'resource05a:nettle':5,
 'resource05a:oak-log':5,'resource05a:pine-log':4,'resource05a:birch-log':4,'resource05a:willow-log':4,'resource05a:stone':12,
 'resource05a:coal':10,'resource05a:copper-ore':12,'resource05a:iron-ore':10,
 'resource05a:small-fish':12,'resource05a:carp':8,'resource05a:trout':6
};
const candidateCaps05A:Readonly<Record<string,number>>={
 'source05a:blueberry':4,'source05a:reed':5,'source05a:quartz':3,
 'source05a:mussel':4,'source05a:marsh-bell':2,'source05a:sacred-oak':1
};
function validCandidates05A(x:Record<string,unknown>,now:number):boolean{
 if(!keys(x,['schema','nodes','candidateSites','compendium','ecologySites','ecologyClimateSeed','ecologySubstrates','woodland05C','mineralDeposits05E','treeByproducts05M']))return false;
 if(Object.hasOwn(x,'candidateSites')){
  if(!obj(x.candidateSites)||Object.keys(x.candidateSites).length>100)return false;
  if(!Object.entries(x.candidateSites).every(([id,v])=>obj(v)&&keys(v,['sourceId','region','remaining','discovered','lastSecond','recoveryProgress'])&&
   id.startsWith('site05a:')&&id.length<=140&&typeof v.sourceId==='string'&&
   Object.hasOwn(candidateCaps05A,v.sourceId)&&typeof v.region==='string'&&v.region.length<=50&&
   uint(v.remaining)&&Number(v.remaining)<=(candidateCaps05A[v.sourceId]??-1)&&typeof v.discovered==='boolean'&&
   (!Object.hasOwn(v,'lastSecond')||(uint(v.lastSecond)&&Number(v.lastSecond)<=now))&&
   (!Object.hasOwn(v,'recoveryProgress')||(typeof v.recoveryProgress==='number'&&Number.isFinite(v.recoveryProgress)&&v.recoveryProgress>=0&&v.recoveryProgress<=3*86400))))return false;
 }
 if(Object.hasOwn(x,'treeByproducts05M')){
  const stocks=x.treeByproducts05M;
  if(!obj(stocks)||Object.keys(stocks).length>5000)return false;
  const allowed:Readonly<Record<string,string[]>>={
   'resource05a:oak-log':['item05m:oak-acorn','item05a:oak-sap'],
   'resource05a:pine-log':['item05m:pine-cone','item05m:pine-resin'],
   'resource05a:birch-log':['item05m:birch-bark','item05m:birch-sap'],
   'resource05a:willow-log':['item05m:willow-branch']
  };
  if(!Object.entries(stocks).every(([id,v])=>{
   const split=id.lastIndexOf('|'),nodeId=id.slice(0,split),itemId=id.slice(split+1);
   const def=Object.entries(allowed).find(([resourceId])=>nodeId.startsWith(resourceId+':'));
   return split>0&&Boolean(def)&&def![1].includes(itemId)&&obj(v)&&keys(v,['remaining','lastSecond'])&&
    uint(v.remaining)&&Number(v.remaining)<=2&&uint(v.lastSecond)&&Number(v.lastSecond)<=now;
  }))return false;
 }
 if(Object.hasOwn(x,'ecologyClimateSeed')&&(typeof x.ecologyClimateSeed!=='string'||x.ecologyClimateSeed.length<1||x.ecologyClimateSeed.length>200))return false;
 if(Object.hasOwn(x,'mineralDeposits05E')){
  if(!obj(x.mineralDeposits05E)||Object.keys(x.mineralDeposits05E).length>400)return false;
  const known:Record<string,{regions:string[],stock:number,grade:number}>={
   'item05a:stone':{regions:['광산','산맥'],stock:16,grade:1},
   'item05a:coal':{regions:['광산','산맥'],stock:10,grade:1},
   'item05a:copper-ore':{regions:['광산','산맥'],stock:8,grade:2},
   'item05a:iron-ore':{regions:['광산','산맥'],stock:7,grade:2},
   'item05a:quartz':{regions:['광산','산맥'],stock:5,grade:3},
   'item05e:r-001-hematite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-002-magnetite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-003-limonite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-004-pyrite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-005-chalcopyrite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-006-chalcocite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-007-malachite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-008-azurite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-009-cassiterite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-010-sphalerite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-011-galena':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-012-goethite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-013-bauxite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-014-chromite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-015-ilmenite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-016-rutile':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-017-pentlandite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-018-molybdenite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-019-scheelite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-020-wolframite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-021-pyrolusite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-022-native-gold':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-023-native-silver':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-024-native-platinum':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-025-stibnite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-026-granite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-027-basalt':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-028-andesite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-029-rhyolite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-030-gabbro':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-031-diorite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-032-sandstone':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-033-limestone':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-034-dolostone':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-035-shale':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-036-slate':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-037-marble':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-038-quartzite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-039-gneiss':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-040-tuff':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-041-pumice':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-042-obsidian':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-043-gravel':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-044-clay':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-045-quartz':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-046-silica-sand':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-047-orthoclase':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-048-plagioclase':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-049-muscovite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-050-biotite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-051-calcite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-052-dolomite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-053-fluorite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-054-gypsum':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-055-barite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-056-halite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-057-sylvite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-058-talc':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-059-kaolinite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-060-bentonite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-061-graphite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-062-native-sulfur':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-063-apatite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-064-kyanite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-065-wollastonite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-066-diatomite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-067-zeolite-group':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-068-amethyst':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-069-citrine':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-070-rose-quartz':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-071-smoky-quartz':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-072-garnet-group':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-073-beryl':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-074-emerald':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-075-aquamarine':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-076-corundum':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-077-ruby':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-078-sapphire':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-079-topaz':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-080-tourmaline-group':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-081-spinel':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-082-opal':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-083-turquoise':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-084-jadeite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-085-nephrite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-086-moonstone':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-087-lapis-lazuli':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-088-diamond':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-089-lignite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-090-bituminous-coal':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-091-anthracite':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-092-peat':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-093-bitumen':{regions:['광산','산맥'],stock:4,grade:1},
   'item05e:r-094-oil-shale':{regions:['광산','산맥'],stock:4,grade:1},
   'item05a:tin-ore':{regions:['광산','산맥'],stock:6,grade:2},
   'item05a:silver-ore':{regions:['광산','산맥'],stock:5,grade:2},
   'item05a:gold-ore':{regions:['광산','산맥'],stock:4,grade:3},
   'item05a:limestone':{regions:['광산','산맥'],stock:10,grade:1},
   'item05a:clay':{regions:['광산','산맥'],stock:12,grade:1},
   'item05a:silica-sand':{regions:['광산','산맥'],stock:9,grade:1},
   'item05a:gypsum':{regions:['광산','산맥'],stock:8,grade:1},
   'item05a:sulfur':{regions:['광산','산맥'],stock:6,grade:2}
  };
  if(!Object.entries(x.mineralDeposits05E).every(([id,v])=>{
   if(!obj(v)||!keys(v,['id','region','itemId','index','remaining','grade','discovered']))return false;
   if(typeof v.region!=='string'||typeof v.itemId!=='string')return false;
   const def=known[v.itemId];
   return !!def&&def.regions.includes(v.region)&&v.id===id&&uint(v.index)&&Number(v.index)<=10&&
    id==='mineral05e:'+encodeURIComponent(v.region)+':'+encodeURIComponent(v.itemId)+':'+String(v.index)&&
    uint(v.remaining)&&Number(v.remaining)<=def.stock&&v.grade===def.grade&&typeof v.discovered==='boolean';
  }))return false;
 }
 if(Object.hasOwn(x,'woodland05C')){
  const forest=x.woodland05C;
  if(!obj(forest)||!keys(forest,['trees','day'])||!uint(forest.day)||Number(forest.day)>Math.floor((now+28800)/86400)||
   !obj(forest.trees)||Object.keys(forest.trees).length>40)return false;
  if(!Object.entries(forest.trees).every(([id,t])=>obj(t)&&
   keys(t,['id','region','speciesId','ageDays','health','alive','deadwood'])&&
   typeof t.region==='string'&&t.region.length>0&&t.region.length<80&&
   typeof t.speciesId==='string'&&['oak','pine'].includes(t.speciesId)&&id===t.id&&
   id==='tree05c:'+encodeURIComponent(String(t.region))+':'+t.speciesId+':0'&&
   uint(t.ageDays)&&Number(t.ageDays)<=100000&&uint(t.health)&&Number(t.health)<=100&&
   typeof t.alive==='boolean'&&uint(t.deadwood)&&Number(t.deadwood)<=1000))return false;
 }
 if(Object.hasOwn(x,'ecologySubstrates')){
  if(!obj(x.ecologySubstrates)||Object.keys(x.ecologySubstrates).length>100)return false;
  if(!Object.entries(x.ecologySubstrates).every(([id,v])=>
   obj(v)&&keys(v,['id','region','type','remaining','updatedAt'])&&
   typeof v.id==='string'&&v.id===id&&typeof v.region==='string'&&v.region.length>0&&v.region.length<80&&
   typeof v.type==='string'&&['deadwood','hardwood','living-tree-roots','grassland-soil','leaf-litter','rich-soil'].includes(v.type)&&
   id==='substrate05b:'+encodeURIComponent(v.region)+':'+v.type&&
   uint(v.remaining)&&Number(v.remaining)<=1000&&uint(v.updatedAt)&&Number(v.updatedAt)<=now
  ))return false;
 }
 if(Object.hasOwn(x,'ecologySites')){
  if(!obj(x.ecologySites)||Object.keys(x.ecologySites).length>250)return false;
  if(!Object.entries(x.ecologySites).every(([id,v])=>
   obj(v)&&keys(v,['id','speciesId','region','patch','remaining','updatedAt','discovered','wetCredit','substrate','substrateHealth'])&&
   id.startsWith('eco05a:')&&id.length<=220&&v.id===id&&
   typeof v.speciesId==='string'&&(v.speciesId.startsWith('item05a:')||v.speciesId.startsWith('item05b:'))&&v.speciesId.length<=150&&
   typeof v.region==='string'&&v.region.length<80&&uint(v.patch)&&Number(v.patch)<=10&&
   uint(v.remaining)&&Number(v.remaining)<=10&&uint(v.updatedAt)&&Number(v.updatedAt)<=now&&
   typeof v.discovered==='boolean'&&
   (!Object.hasOwn(v,'wetCredit')||(uint(v.wetCredit)&&Number(v.wetCredit)<=10))&&
   (!Object.hasOwn(v,'substrate')||(typeof v.substrate==='string'&&v.substrate.length<=50))&&
   (!Object.hasOwn(v,'substrateHealth')||(uint(v.substrateHealth)&&Number(v.substrateHealth)<=100))&&
   id==='eco05a:'+encodeURIComponent(String(v.region))+':'+encodeURIComponent(String(v.speciesId))+':'+String(v.patch)
  ))return false;
 }
 if(Object.hasOwn(x,'compendium')){
  if(!obj(x.compendium)||!keys(x.compendium,['sourceIds','itemIds'])||
   !Array.isArray(x.compendium.sourceIds)||!Array.isArray(x.compendium.itemIds))return false;
  if(x.compendium.sourceIds.length>300||x.compendium.itemIds.length>300)return false;
  if(!x.compendium.sourceIds.every((v:unknown)=>typeof v==='string'&&v.length<140)||
   !x.compendium.itemIds.every((v:unknown)=>typeof v==='string'&&v.length<140))return false;
 }
 return true;
}
function validResource05A(runtime:Record<string,unknown>,now:number):boolean{
 if(!Object.hasOwn(runtime,'resource05A'))return true;
 const x=runtime.resource05A;
 if(!obj(x)||!validCandidates05A(x,now)||x.schema!==1||!obj(x.nodes)||Object.keys(x.nodes).length>6000)return false;
 return Object.entries(x.nodes).every(([key,value])=>{
  if(!obj(value)||!keys(value,['resourceId','remaining','progress','lastSecond','recoveryProgress','discovered','cycle']))return false;
  const cap=resourceCaps05A[String(value.resourceId)];
  return typeof cap==='number'&&Number.isSafeInteger(cap)&&key.startsWith(String(value.resourceId)+':')&&key.length<=140&&
   uint(value.remaining)&&Number(value.remaining)<=cap&&uint(value.progress)&&Number(value.progress)<=200&&
   uint(value.lastSecond)&&Number(value.lastSecond)<=now&&
   uint(value.recoveryProgress)&&Number(value.recoveryProgress)<60*86400&&
   typeof value.discovered==='boolean'&&uint(value.cycle);
 });
}

export function decodeSaveV3(raw:unknown,registry:ItemRegistry):V3Result{
 if(!obj(raw)||raw.format!=='somnium-save'||raw.saveVersion!==3||!obj(raw.state)||raw.state.schemaVersion!==3)return {ok:false,reason:'INCOMPATIBLE_VERSION'};
 const clock=raw.state.clock;
 if(!obj(clock)||!keys(clock,['elapsedSeconds','calendarId','startSecondOfDay'])||
  !seconds(clock.elapsedSeconds)||clock.calendarId!=='somnium-calendar-v1'||clock.startSecondOfDay!==28800)return {ok:false,reason:'INVALID_DATA'};
 if(!obj(raw.state.world)||!obj(raw.state.world.runtime)||raw.state.world.runtime.timeBasis!=='seconds-v1')return {ok:false,reason:'INVALID_DATA'};
 // Existing v3 saves without world03E remain valid and are never silently converted.
 // When present, the complete generated map snapshot is validated before any restore.
 if(Object.hasOwn(raw.state.world.runtime,'world03E')){
  const built=buildWorldRegistry(SOMNIUM_WORLD_03A);
  if(!built.ok||validateWorldSnapshot03E(raw.state.world.runtime.world03E,built.registry).length)
   return {ok:false,reason:'INVALID_DATA'};
 }
 // M2 combat state is optional; pre-M2 v3 slots remain valid.
 // A malformed turn queue must never be applied to live gameplay.
 if(Object.hasOwn(raw.state.world.runtime,'m2Combat')){
  const x=raw.state.world.runtime.m2Combat;
  const validNumber=(n:unknown)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0;
  if(!obj(x)||!keys(x,['schema','encounterId','phase','round','queue','cursor','participants','seed','log','outcome'])||
   x.schema!==1||typeof x.encounterId!=='string'||x.encounterId.length<1||x.encounterId.length>160||
   !['active','resolved'].includes(String(x.phase))||!validNumber(x.round)||Number(x.round)<1||
   !validNumber(x.seed)||!validNumber(x.cursor)||!Array.isArray(x.queue)||!Array.isArray(x.participants)||
   x.participants.length<2||x.participants.length>5||x.queue.length!==x.participants.length||
   Number(x.cursor)>=x.queue.length||new Set(x.queue).size!==x.queue.length||
   !x.queue.every((id:unknown)=>typeof id==='string'&&x.participants.some((p:unknown)=>obj(p)&&p.id===id))||
   !x.participants.every((p:unknown,i:number)=>obj(p)&&keys(p,['id','hp','maxHp','side','guard'])&&
     p.id===(i?'enemy:'+(i-1):'player')&&p.side===(i?'enemy':'player')&&
     validNumber(p.hp)&&validNumber(p.maxHp)&&Number(p.maxHp)>0&&Number(p.hp)<=Number(p.maxHp)&&
     typeof p.guard==='boolean')||
   !Array.isArray(x.log)||x.log.length>40||
   !(x.outcome===null||['victory','defeat','retreat'].includes(String(x.outcome)))||
   (x.phase==='active'&&x.outcome!==null)||(x.phase==='resolved'&&x.outcome===null))
   return {ok:false,reason:'INVALID_DATA'};
 }
 // M1 opt-in runtime; legacy v3 saves without this extension stay intact.
 if(Object.hasOwn(raw.state.world.runtime,'m1Life')){
  const x=raw.state.world.runtime.m1Life;
  const nonnegative=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
  const catalog=['m1:seed:wheat','m1:seed:potato','m1:seed:strawberry','m1:seed:blueberry',
   'm1:crop:wheat','m1:crop:potato','m1:crop:strawberry','m1:crop:blueberry',
   'm1:food:bread','m1:food:baked-potato','m1:seed:apple','m1:crop:apple'];
  const crop=['wheat','potato','strawberry','blueberry','apple'];
  if(!obj(x)||!keys(x,['schema','now','turn','gold','hunger','inventory','plots','facilities','merchant','events','recentRequests'])||
   x.schema!==1||!nonnegative(x.now)||Number(x.now)>Number(clock.elapsedSeconds)||
   !nonnegative(x.turn)||!nonnegative(x.gold)||!nonnegative(x.hunger)||Number(x.hunger)>100||
   !obj(x.inventory)||Object.keys(x.inventory).length>catalog.length||
   !Object.entries(x.inventory).every(([k,v])=>catalog.includes(k)&&nonnegative(v))||
   !obj(x.facilities)||!keys(x.facilities,['kitchen','workbench','plotCapacity','woodShed'])||
   typeof x.facilities.kitchen!=='boolean'||typeof x.facilities.workbench!=='boolean'||
   (Object.hasOwn(x.facilities,'woodShed')&&typeof x.facilities.woodShed!=='boolean')||
   !nonnegative(x.facilities.plotCapacity)||Number(x.facilities.plotCapacity)>32||
   !Array.isArray(x.plots)||x.plots.length!==x.facilities.plotCapacity||
   !x.plots.every((p:unknown)=>p===null||(obj(p)&&keys(p,['crop','readyAt','spoilsAt','remainingHarvests'])&&
    crop.includes(String(p.crop))&&nonnegative(p.readyAt)&&nonnegative(p.spoilsAt)&&
    Number(p.spoilsAt)>=Number(p.readyAt)&&nonnegative(p.remainingHarvests)&&
    Number(p.remainingHarvests)>0&&Number(p.remainingHarvests)<=3))||
   !obj(x.merchant)||!keys(x.merchant,['stock','lastRestock'])||!obj(x.merchant.stock)||
   (Object.hasOwn(x.merchant,'lastRestock')&&(!nonnegative(x.merchant.lastRestock)||Number(x.merchant.lastRestock)>Number(x.now)))||
   !Object.entries(x.merchant.stock).every(([k,v])=>catalog.includes(k)&&nonnegative(v))||
   (Object.hasOwn(x,'recentRequests')&&(!Array.isArray(x.recentRequests)||x.recentRequests.length>32||
    !x.recentRequests.every((id:unknown)=>typeof id==='string'&&/^[A-Za-z0-9:_-]{1,80}$/.test(id))||
    new Set(x.recentRequests).size!==x.recentRequests.length))||
   !Array.isArray(x.events)||x.events.length>200||
   !x.events.every((e:unknown)=>obj(e)&&typeof e.type==='string'&&e.type.length>0&&e.type.length<=80))return {ok:false,reason:'INVALID_DATA'};
 }
 if(!validResource05A(raw.state.world.runtime,clock.elapsedSeconds as number))return {ok:false,reason:'INVALID_DATA'};
 if(!validProgressionExtension(raw.state.progression))return {ok:false,reason:'INVALID_DATA'};
 const source=structuredClone(raw.state) as unknown as Record<string,unknown>;
 source.schemaVersion=2;source.clock={elapsedUnits:clock.elapsedSeconds};
 // Reuse every existing item, RNG, world-root, progress and envelope validation.
 const v2=decodeSaveV2({...raw,saveVersion:2,state:source},registry);
 if(!v2.ok)return {ok:false,reason:'INVALID_DATA'};
 return {ok:true,save:structuredClone(raw) as unknown as SaveEnvelopeV3};
}
export function createSaveV3(state:GameStateV3,slot:SaveSlot,contentVersion:string,registry:ItemRegistry):SaveEnvelopeV3{
 const decoded=decodeSaveV3({format:'somnium-save',saveVersion:3,contentVersion,slot,state},registry);
 if(!decoded.ok)throw Error('Invalid v3 save: '+decoded.reason);
 return decoded.save;
}
export function parseBackupV3(text:string,registry:ItemRegistry,maxBytes=8_000_000):V3Result{
 if(typeof text!=='string'||new TextEncoder().encode(text).length>maxBytes)return {ok:false,reason:'INVALID_DATA'};
 try{return decodeSaveV3(JSON.parse(text) as unknown,registry)}catch{return {ok:false,reason:'INVALID_DATA'}}
}
export function exportBackupV3(save:SaveEnvelopeV3,registry:ItemRegistry):string{
 const result=decodeSaveV3(save,registry);if(!result.ok)throw Error('Invalid v3 backup');
 return JSON.stringify(result.save,null,2);
}
/** A legacy v2 save has NO known time conversion. Never auto-upgrade on load.
 * Only an explicit reset-to-first-day approval permits migration, and only
 * when no travel/field lifecycle needs chronological preservation.
 */
export function prepareV2ToV3Migration(raw:unknown,registry:ItemRegistry,approvedReset:boolean):
 {ok:true;state:GameStateV3}|{ok:false;reason:string}{
 const decoded=decodeSaveV2(raw,registry);
 if(!decoded.ok)return {ok:false,reason:'INVALID_V2'};
 if(!approvedReset)return {ok:false,reason:'APPROVAL_REQUIRED'};
 const old=decoded.save.state, runtime=(old.world as unknown as Record<string,unknown>).runtime as Record<string,unknown>|undefined;
 if(!runtime||runtime.travel03B&&typeof runtime.travel03B==='object'&&
  (runtime.travel03B as Record<string,unknown>).progress)return {ok:false,reason:'ACTIVE_TRAVEL'};
 if(runtime.lifecycle&&Object.keys(runtime.lifecycle as object).length||
  runtime.generatedSites&&Object.keys(runtime.generatedSites as object).length||
  runtime.siteDeltas&&Object.keys(runtime.siteDeltas as object).length)
  return {ok:false,reason:'CHRONOLOGY_REQUIRES_MANUAL_REVIEW'};
 const base=structuredClone(old);
 const {schemaVersion:_s,clock:_c,...rest}=base;
 const state:GameStateV3={...rest,schemaVersion:3,
  clock:{elapsedSeconds:0,calendarId:'somnium-calendar-v1',startSecondOfDay:28800},
  world:{...(rest.world as object),runtime:{...runtime,timeBasis:'seconds-v1',day:1,hour:8,travel03B:null}} as unknown as GameStateV3['world']};
 return {ok:true,state};
}
/** Converts only a validated, explicitly seconds-tagged transitional v2 save.
 * Does not reset its already genuine elapsed seconds.
 */
export function prepareSecondsV2ToV3(raw:unknown,registry:ItemRegistry){
 const decoded=decodeSaveV2(raw,registry);
 if(!decoded.ok)return {ok:false as const,reason:'INVALID_V2'};
 const state=decoded.save.state, runtime=(state.world as unknown as Record<string,unknown>).runtime as Record<string,unknown>|undefined;
 if(runtime?.timeBasis!=='seconds-v1')return {ok:false as const,reason:'ABSTRACT_TIME'};
 const {schemaVersion:_s,clock:_c,...rest}=structuredClone(state);
 return {ok:true as const,state:{...rest,schemaVersion:3 as const,
  clock:{elapsedSeconds:state.clock.elapsedUnits,calendarId:'somnium-calendar-v1' as const,startSecondOfDay:28800 as const}} satisfies GameStateV3};
}
