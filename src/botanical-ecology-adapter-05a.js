import {BOTANICAL_PROFILES_05A} from './botanical-profiles-05a.js';
import {botanicalRenewalSeconds05A} from './botanical-lifecycle-05a.js';
import {validateEcologyDefinition,createEcologySite,ecologySiteId} from './ecology-core-05a.js';
/** Ecosystem adapter: replacing plant profiles with mineral, fungus, aquatic, or
 * wildlife definitions does not change ecology-core. Patch count/content can grow
 * independently of species count. These initial sites are deterministic.
 */
export const BOTANICAL_ECOLOGY_DEFS_05A=Object.freeze(BOTANICAL_PROFILES_05A.map(p=>{
 const output={id:p.id,part:p.part,stage:p.part==='flower'?'bloom':'mature',weight:1};
 const def=Object.freeze({id:p.id,habitats:p.regions,capacity:p.renewalClass==='slow'?1:3,
  regrowSeconds:botanicalRenewalSeconds05A(p),mode:p.interaction,
  seasons:p.seasons,...(p.renewalClass==='rain-pulse'?{weather:['rain']}:{}),
  ...(p.purpose==='night-bloom'?{dayparts:['night']}:{}),
  outputs:[output]});
 if(!validateEcologyDefinition(def))throw Error('INVALID_BOTANICAL_ECOLOGY:'+p.id);
 return def;
}));
export const BOTANICAL_ECOLOGY_MAP_05A=new Map(BOTANICAL_ECOLOGY_DEFS_05A.map(d=>[d.id,d]));
export function createBotanicalEcology05A(second=0){
 return Object.fromEntries(BOTANICAL_ECOLOGY_DEFS_05A.flatMap(def=>def.habitats.map(region=>{
  const site=createEcologySite(def,region,0,second);
  return [site.id,site];
 })));
}
export function visibleBotanicalEcology05A(sites,region){
 return Object.values(sites).filter(site=>site.region===region&&BOTANICAL_ECOLOGY_MAP_05A.has(site.speciesId));
}
