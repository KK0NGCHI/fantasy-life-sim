import {REAL_ATLAS_05E} from './mineral-atlas-05e.js';
import {mineralDepositId05E} from './mineral-deposits-05e.js';

/** Explicit prototype extraction clusters, not proven geological coordinates.
 * These immutable recipes are a conservative allowlist until spatial sites exist.
 * Existing stocks, save IDs and single-resource mining remain untouched.
 */
const recipes=Object.freeze([
 {id:'hydrothermal-sulfides',formation:'hydrothermal',materials:['chalcopyrite','pyrite','sphalerite']},
 {id:'evaporite-gypsum-salt',formation:'evaporite',materials:['gypsum','halite']},
 {id:'volcanic-glass',formation:'volcanic',materials:['basalt','pumice']},
 {id:'metamorphic-stone',formation:'metamorphic',materials:['slate','marble']},
 {id:'igneous-iron',formation:'igneous',materials:['granite','magnetite']}
]);
const byName=new Map(REAL_ATLAS_05E.map(m=>[m.en,m.id]));
export const EXTRACTION_CLUSTERS_05G=Object.freeze(recipes.map(recipe=>{
 const ids=recipe.materials.map(name=>byName.get(name));
 if(ids.some(id=>!id))throw Error('UNKNOWN_CLUSTER_MATERIAL:'+recipe.id);
 return Object.freeze({id:recipe.id,formation:recipe.formation,materialIds:Object.freeze(ids)});
}));
/** Check membership by *exact site IDs*, not just region or formation label.
 * Do not accept index > 0 because there is no verified location for those sites.
 */
export function extractionCluster05G(region,siteIds){
 if(typeof region!=='string'||!Array.isArray(siteIds)||siteIds.length<2||siteIds.length>3||
    siteIds.some(id=>typeof id!=='string')||new Set(siteIds).size!==siteIds.length)return null;
 return EXTRACTION_CLUSTERS_05G.find(recipe=>{
  const allowed=new Set(recipe.materialIds.map(id=>mineralDepositId05E(region,id,0)));
  return siteIds.every(id=>allowed.has(id));
 })??null;
}
