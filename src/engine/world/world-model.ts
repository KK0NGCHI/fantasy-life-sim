/** 03-A static world contract. World graph coordinates never substitute for local tile coordinates. */
export type FieldLifecycleKind='permanent'|'renewable'|'temporary'|'repeatable';
export interface FieldLifecyclePolicy {
 readonly kind:FieldLifecycleKind;
 /** World-clock units, never wall-clock milliseconds. */
 readonly lifetimeUnits?:number;
 readonly renewalUnits?:number;
 readonly regenerationUnits?:number;
}
export interface RegionDefinition {
 readonly id:string;readonly name:string;readonly biomeId:string;
 readonly worldPoint:Readonly<{x:number;y:number}>;
 readonly siteIds:readonly string[];
}
export interface SiteDefinition {
 readonly id:string;readonly regionId:string;
 readonly type:'settlement'|'field'|'dungeon'|'special';
 readonly generation:'fixed'|'seeded';
 readonly templateId:string;
 readonly floors:readonly number[];
 readonly entryId:string;
 readonly lifecycle:FieldLifecyclePolicy;
}
export interface TerrainDefinition {
 readonly id:string;readonly traversable:boolean;readonly blocksSight:boolean;
 readonly movementCost:number;readonly hazardTags:readonly string[];
}
export interface MapDefinition {
 readonly id:string;readonly siteId:string;readonly floor:number;
 readonly width:number;readonly height:number;
 readonly tiles:readonly string[];
 readonly entrances:readonly {id:string;x:number;y:number;destinationSiteId:string;destinationFloor:number;destinationEntryId:string}[];
}
export interface RouteDefinition {
 readonly id:string;readonly fromSiteId:string;readonly toSiteId:string;
 readonly bidirectional:boolean;readonly turns:number;readonly worldUnits:number;
 readonly requirementTags:readonly string[];readonly hazardTags:readonly string[];
}
export interface WorldDefinition {
 readonly id:string;readonly generatorVersion:number;
 readonly regions:readonly RegionDefinition[];
 readonly sites:readonly SiteDefinition[];
 readonly maps:readonly MapDefinition[];
 readonly terrains:readonly TerrainDefinition[];
 readonly routes:readonly RouteDefinition[];
 readonly initialSiteId:string;
}
export interface SiteLifecycleState {
 readonly siteId:string;readonly generationIndex:number;readonly createdAt:number;
 readonly expiresAt:number|null;readonly renewAt:number|null;
 readonly status:'active'|'expiration_pending'|'expired';
}
export interface PlayerLocation {readonly siteId:string;readonly floor:number;readonly x:number;readonly y:number}
export interface WorldRuntime03A {
 readonly worldStateVersion:1;readonly worldSeed:string;readonly generatorVersion:number;
 readonly location:PlayerLocation;
 readonly discovery:Readonly<Record<string,'discovered'|'visited'>>;
 readonly seenCells:Readonly<Record<string,readonly number[]>>;
 readonly lifecycle:Readonly<Record<string,SiteLifecycleState>>;
 readonly generatedSites:Readonly<Record<string,unknown>>;
 readonly siteDeltas:Readonly<Record<string,unknown>>;
}
export interface WorldValidationIssue {readonly code:string;readonly path:string;readonly message:string}
export interface WorldRegistry {
 readonly definition:WorldDefinition;
 readonly regions:ReadonlyMap<string,RegionDefinition>;
 readonly sites:ReadonlyMap<string,SiteDefinition>;
 readonly maps:ReadonlyMap<string,MapDefinition>;
 readonly terrains:ReadonlyMap<string,TerrainDefinition>;
 readonly routes:ReadonlyMap<string,RouteDefinition>;
}
const id=(v:unknown)=>typeof v==='string'&&/^[a-z][a-z0-9_-]*:[a-z0-9_/-]+$/.test(v);
const nonnegative=(v:number)=>Number.isSafeInteger(v)&&v>=0;
const positive=(v:number)=>Number.isSafeInteger(v)&&v>0;
export function validateWorldDefinition(world:WorldDefinition):WorldValidationIssue[]{
 const issues:WorldValidationIssue[]=[];
 const fail=(code:string,path:string,message:string)=>issues.push({code,path,message});
 const uniq=<T extends {id:string}>(list:readonly T[],path:string)=>{
  const seen=new Set<string>();
  list.forEach((v,i)=>{if(!id(v.id))fail('INVALID_ID',path+'['+i+'].id','Use a stable namespaced ID');
   if(seen.has(v.id))fail('DUPLICATE_ID',path+'['+i+'].id','Duplicate ID');seen.add(v.id)});
  return new Map(list.map(v=>[v.id,v]));
 };
 if(!id(world.id)||!positive(world.generatorVersion))fail('INVALID_WORLD','world','Invalid world identity or generator version');
 const regions=uniq(world.regions,'regions'),sites=uniq(world.sites,'sites');
 const maps=uniq(world.maps,'maps'),terrains=uniq(world.terrains,'terrains'),routes=uniq(world.routes,'routes');
 if(world.regions.length!==16)fail('REGION_COUNT','regions','Somnium must define 16 fixed public regions');
 if(!sites.has(world.initialSiteId))fail('INITIAL_SITE','initialSiteId','Initial site does not exist');
 for(const [i,region] of world.regions.entries()){
  if(!id(region.biomeId)||!Number.isSafeInteger(region.worldPoint.x)||!Number.isSafeInteger(region.worldPoint.y))fail('INVALID_REGION','regions['+i+']','Invalid biome or world point');
  if(new Set(region.siteIds).size!==region.siteIds.length)fail('DUPLICATE_SITE_REF','regions['+i+'].siteIds','Duplicated member');
  for(const siteId of region.siteIds)if(!sites.has(siteId)||sites.get(siteId)?.regionId!==region.id)fail('SITE_REF','regions['+i+']','Missing or wrong-region site');
 }
 for(const [i,site] of world.sites.entries()){
  if(!regions.has(site.regionId)||!regions.get(site.regionId)?.siteIds.includes(site.id))fail('REGION_REF','sites['+i+']','Site not registered in region');
  if(!id(site.templateId)||!site.floors.length||!site.floors.every(Number.isSafeInteger)||new Set(site.floors).size!==site.floors.length||!id(site.entryId))
   fail('INVALID_SITE','sites['+i+']','Invalid site metadata');
  const policy=site.lifecycle;
  if(!['permanent','renewable','temporary','repeatable'].includes(policy.kind))fail('LIFECYCLE','sites['+i+']','Unknown policy');
  const check=(n:number|undefined)=>n===undefined||positive(n);
  if(!check(policy.lifetimeUnits)||!check(policy.renewalUnits)||!check(policy.regenerationUnits))fail('LIFECYCLE','sites['+i+']','Invalid schedule');
  if(policy.kind==='permanent'&&(policy.lifetimeUnits!==undefined||policy.renewalUnits!==undefined||policy.regenerationUnits!==undefined))fail('LIFECYCLE','sites['+i+']','Permanent sites have no resets');
  if(policy.kind==='temporary'&&!positive(policy.lifetimeUnits??0))fail('LIFECYCLE','sites['+i+']','Temporary lifetime required');
  if(policy.kind==='renewable'&&!positive(policy.renewalUnits??0))fail('LIFECYCLE','sites['+i+']','Renewal interval required');
  if(policy.kind==='repeatable'&&!positive(policy.regenerationUnits??0))fail('LIFECYCLE','sites['+i+']','Regeneration interval required');
  if(site.generation==='fixed'&&policy.kind==='temporary')fail('LIFECYCLE','sites['+i+']','Fixed core sites cannot disappear');
  for(const floor of site.floors){
   const matches=world.maps.filter(m=>m.siteId===site.id&&m.floor===floor);
   if(matches.length!==1)fail('FLOOR_MAP','sites['+i+']','Each floor must have exactly one map');
  }
 }
 for(const [i,terrain] of world.terrains.entries())if(!positive(terrain.movementCost)||!Array.isArray(terrain.hazardTags))fail('TERRAIN','terrains['+i+']','Invalid terrain cost/tags');
 for(const [i,map] of world.maps.entries()){
  const path='maps['+i+']',site=sites.get(map.siteId);
  if(!site||!site.floors.includes(map.floor))fail('MAP_REF',path,'Invalid floor/site');
  if(!positive(map.width)||!positive(map.height)||map.width>128||map.height>128||map.tiles.length!==map.height||
   map.tiles.some(row=>typeof row!=='string'||row.split(' ').length!==map.width))fail('MAP_SIZE',path,'Map must have bounded rectangular rows');
  for(const row of map.tiles)for(const tile of row.split(' '))if(!terrains.has(tile))fail('TILE_REF',path,'Unknown tile '+tile);
  const entries=new Set<string>();
  for(const e of map.entrances){
   if(entries.has(e.id)||!id(e.id))fail('ENTRY_ID',path,'Duplicate/invalid entry');entries.add(e.id);
   const dest=world.maps.find(m=>m.siteId===e.destinationSiteId&&m.floor===e.destinationFloor);
   if(!dest||!dest.entrances.some(v=>v.id===e.destinationEntryId))fail('ENTRY_TARGET',path,'Destination entrance missing');
   if(!nonnegative(e.x)||!nonnegative(e.y)||e.x>=map.width||e.y>=map.height||
    !terrains.get(map.tiles[e.y]?.split(' ')[e.x]??'')?.traversable)fail('ENTRY_TILE',path,'Entrance must be traversable');
  }
 }
 for(const [i,route] of world.routes.entries()){
  if(!sites.has(route.fromSiteId)||!sites.has(route.toSiteId)||route.fromSiteId===route.toSiteId)fail('ROUTE_REF','routes['+i+']','Invalid endpoints');
  if(!positive(route.turns)||!positive(route.worldUnits))fail('ROUTE_COST','routes['+i+']','Cost must be positive');
 }
 return issues;
}
export function buildWorldRegistry(definition:WorldDefinition):{ok:true;registry:WorldRegistry}|{ok:false;issues:readonly WorldValidationIssue[]}{
 const issues=validateWorldDefinition(definition);
 if(issues.length)return {ok:false,issues};
 const copy=structuredClone(definition);
 const registry:WorldRegistry={definition:copy,regions:new Map(copy.regions.map(v=>[v.id,v])),sites:new Map(copy.sites.map(v=>[v.id,v])),maps:new Map(copy.maps.map(v=>[v.id,v])),terrains:new Map(copy.terrains.map(v=>[v.id,v])),routes:new Map(copy.routes.map(v=>[v.id,v]))};
 return {ok:true,registry};
}
/** Stable noncryptographic 32-bit hash; never advance action/world RNG streams. */
export function deriveSiteSeed(worldSeed:string,generatorVersion:number,siteId:string,generationIndex=0):number{
 if(!worldSeed||!positive(generatorVersion)||!id(siteId)||!nonnegative(generationIndex))throw RangeError('Invalid seed components');
 let h=2166136261;
 for(const c of JSON.stringify([worldSeed,generatorVersion,siteId,generationIndex]))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;
 return h||1;
}
export function validatePlayerLocation(registry:WorldRegistry,location:PlayerLocation):boolean{
 if(!location||!Number.isSafeInteger(location.floor)||!nonnegative(location.x)||!nonnegative(location.y))return false;
 const map=[...registry.maps.values()].find(m=>m.siteId===location.siteId&&m.floor===location.floor);
 if(!map||location.x>=map.width||location.y>=map.height)return false;
 return !!registry.terrains.get(map.tiles[location.y]?.split(' ')[location.x]??'')?.traversable;
}
