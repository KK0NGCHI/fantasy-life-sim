import type {MapDefinition,WorldRegistry,WorldRuntime03A,PlayerLocation} from './world-model.js';
import {validatePlayerLocation,buildWorldRegistry} from './world-model.js';
import {validateWorldRuntime03A} from './world-integrity.js';

/** Immutable, validated 03-E snapshot. Schema additions to v3 are opt-in. */
export interface WorldSnapshot03E {
 readonly version:1;
 readonly world:WorldRuntime03A;
 readonly generatedMaps:Readonly<Record<string,MapDefinition>>;
 readonly deltas:Readonly<Record<string,Readonly<Record<string,boolean|string|number>>>>;
}
const own=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const validKey=(k:string)=>/^[a-z][a-z0-9_-]*:[a-z0-9_/-]+$/.test(k);
export function validateWorldSnapshot03E(raw:unknown,base:WorldRegistry):string[]{
 if(!own(raw)||raw.version!==1||!own(raw.generatedMaps)||!own(raw.deltas)||!own(raw.world))
  return ['WORLD_03E_FORMAT'];
 const issues:string[]=[];
 if(Object.keys(raw).some(k=>!['version','world','generatedMaps','deltas'].includes(k)))issues.push('UNKNOWN_FIELD');
 const maps:MapDefinition[]=[];
 for(const [id,value] of Object.entries(raw.generatedMaps)){
  if(!validKey(id)||!own(value)||value.id!==id||!base.maps.has(id)) {issues.push('MAP_ID:'+id);continue;}
  const original=base.maps.get(id)!;
  if(value.siteId!==original.siteId||value.floor!==original.floor||!Number.isSafeInteger(value.width)||!Number.isSafeInteger(value.height)||
   (value.width as number)<1||(value.width as number)>128||(value.height as number)<1||(value.height as number)>128||
   !Array.isArray(value.tiles)||!Array.isArray(value.entrances)){issues.push('MAP_SHAPE:'+id);continue;}
  maps.push(value as unknown as MapDefinition);
 }
 let registry=base;
 if(!issues.length){
  const definition={...base.definition,maps:base.definition.maps.map(m=>maps.find(g=>g.id===m.id)??m)};
  const check=buildWorldRegistry(definition);
  if(!check.ok)issues.push(...check.issues.map(i=>'MAP_'+i.code));
  else registry=check.registry;
 }
 if(!issues.length)issues.push(...validateWorldRuntime03A(raw.world,registry).map(i=>'WORLD_'+i.code));
 for(const [siteId,value] of Object.entries(raw.deltas)){
  if(!base.sites.has(siteId)||!own(value)){issues.push('DELTA_SITE:'+siteId);continue;}
  for(const [key,v] of Object.entries(value)){
   if(!/^[a-z0-9_/-]{1,120}$/.test(key)||!(typeof v==='boolean'||typeof v==='string'&&v.length<=300||typeof v==='number'&&Number.isSafeInteger(v)))
    issues.push('DELTA_VALUE:'+siteId+'/'+key);
  }
 }
 return issues;
}
export function createWorldSnapshot03E(world:WorldRuntime03A,base:WorldRegistry):WorldSnapshot03E{
 const out:WorldSnapshot03E={version:1,world:structuredClone(world),generatedMaps:{},deltas:{}};
 const issues=validateWorldSnapshot03E(out,base);if(issues.length)throw Error(issues.join(','));
 return out;
}
export function withGeneratedMap(snapshot:WorldSnapshot03E,map:MapDefinition,base:WorldRegistry):WorldSnapshot03E{
 if(snapshot.generatedMaps[map.id])throw Error('Existing generated map cannot be silently replaced');
 const next={...snapshot,generatedMaps:{...snapshot.generatedMaps,[map.id]:structuredClone(map)}};
 const issues=validateWorldSnapshot03E(next,base);if(issues.length)throw Error(issues.join(','));
 return next;
}
export function recordWorldSight(snapshot:WorldSnapshot03E,mapId:string,visible:readonly number[],base:WorldRegistry):WorldSnapshot03E{
 const map=snapshot.generatedMaps[mapId]??base.maps.get(mapId);
 if(!map)throw Error('Unknown map');
 if(visible.some(i=>!Number.isSafeInteger(i)||i<0||i>=map.width*map.height))throw Error('Invalid visible index');
 const next:WorldSnapshot03E={...snapshot,world:{...snapshot.world,
  seenCells:{...snapshot.world.seenCells,[mapId]:[...new Set([...(snapshot.world.seenCells[mapId]??[]),...visible])].sort((a,b)=>a-b)}}};
 const issues=validateWorldSnapshot03E(next,base);if(issues.length)throw Error(issues.join(','));
 return next;
}
export function recordWorldLocation(snapshot:WorldSnapshot03E,location:PlayerLocation,base:WorldRegistry):WorldSnapshot03E{
 const next={...snapshot,world:{...snapshot.world,location:{...location},
  discovery:{...snapshot.world.discovery,[location.siteId]:'visited' as const}}};
 const issues=validateWorldSnapshot03E(next,base);if(issues.length)throw Error(issues.join(','));
 return next;
}
export function withWorldDelta(snapshot:WorldSnapshot03E,siteId:string,key:string,value:boolean|string|number,base:WorldRegistry):WorldSnapshot03E{
 const next={...snapshot,deltas:{...snapshot.deltas,[siteId]:{...(snapshot.deltas[siteId]??{}),[key]:value}}};
 const issues=validateWorldSnapshot03E(next,base);if(issues.length)throw Error(issues.join(','));
 return next;
}
export function restoreWorldSnapshot03E(raw:unknown,base:WorldRegistry):WorldSnapshot03E{
 const issues=validateWorldSnapshot03E(raw,base);
 if(issues.length)throw Error('Unsafe 03-E snapshot: '+issues.join(','));
 return structuredClone(raw) as WorldSnapshot03E;
}
