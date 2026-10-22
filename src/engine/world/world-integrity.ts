import type {WorldDefinition,WorldRegistry,WorldRuntime03A,WorldValidationIssue,PlayerLocation} from './world-model.js';
import {deriveSiteSeed,validatePlayerLocation} from './world-model.js';
const id=(s:string)=>/^[a-z][a-z0-9_-]*:[a-z0-9_/-]+$/.test(s);
const safe=(n:unknown):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0;
const obj=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const issue=(code:string,path:string,message:string):WorldValidationIssue=>({code,path,message});
const mapFor=(w:WorldDefinition,siteId:string,floor:number)=>w.maps.find(m=>m.siteId===siteId&&m.floor===floor);
const posKey=(p:PlayerLocation)=>p.siteId+'/'+p.floor;
const reachable=(w:WorldDefinition,siteId:string,floor:number,startX:number,startY:number)=>{
 const m=mapFor(w,siteId,floor);const visited=new Set<string>();if(!m)return visited;
 const pass=(x:number,y:number)=>x>=0&&y>=0&&x<m.width&&y<m.height&&
 w.terrains.find(t=>t.id===m.tiles[y]?.split(' ')[x])?.traversable===true;
 const queue:[[number,number]]=[[startX,startY]];
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i]!;const k=x+','+y;if(visited.has(k)||!pass(x,y))continue;
 visited.add(k);queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}
 return visited;
};
/** 03-A strict entry, floor, route, and static reachability preflight.
 * Existing simple fixtures have to define one local entry per floor.
 */
export function validateWorldTopology(w:WorldDefinition):WorldValidationIssue[]{
 const errors:WorldValidationIssue[]=[];
 const maps=new Map(w.maps.map(m=>[posKey({siteId:m.siteId,floor:m.floor,x:0,y:0}),m]));
 const entrances=new Map<string,{siteId:string;floor:number;id:string;x:number;y:number;destinationSiteId:string;destinationFloor:number;destinationEntryId:string}>();
 for(const m of w.maps)for(const e of m.entrances)entrances.set(m.siteId+'/'+m.floor+'/'+e.id,{...e,siteId:m.siteId,floor:m.floor});
 for(const site of w.sites){
  const surface=mapFor(w,site.id,site.floors[0]!);
  if(!surface?.entrances.some(e=>e.id===site.entryId))errors.push(issue('SITE_ENTRY','sites/'+site.id,'Site entry missing from initial floor'));
  for(const floor of site.floors){
   const map=maps.get(site.id+'/'+floor);if(!map)continue;
   if(!map.entrances.length)errors.push(issue('FLOOR_ENTRY','maps/'+map.id,'Floor needs an entrance'));
   for(const e of map.entrances){
    const target=entrances.get(e.destinationSiteId+'/'+e.destinationFloor+'/'+e.destinationEntryId);
    if(!target)continue; // Basic validator owns dangling references.
    if(target.destinationSiteId!==map.siteId||target.destinationFloor!==map.floor||target.destinationEntryId!==e.id)
     errors.push(issue('ONE_WAY_ENTRY','maps/'+map.id,'Entrance must have a reciprocal return link'));
    const walk=reachable(w,map.siteId,map.floor,e.x,e.y);
    if(!walk.has(e.x+','+e.y))errors.push(issue('BLOCKED_ENTRY','maps/'+map.id,'Entry is blocked'));
    for(const other of map.entrances)if(!walk.has(other.x+','+other.y))
     errors.push(issue('UNREACHABLE_ENTRY','maps/'+map.id,'All floor exits must be connected'));
   }
  }
 }
 // All public regions must be reachable by a chain of actual routes from initial site.
 const adj=new Map<string,string[]>();for(const site of w.sites)adj.set(site.id,[]);
 for(const edge of w.routes){adj.get(edge.fromSiteId)?.push(edge.toSiteId);if(edge.bidirectional)adj.get(edge.toSiteId)?.push(edge.fromSiteId);}
 const seen=new Set<string>(),queue=[w.initialSiteId];
 while(queue.length){const at=queue.shift()!;if(seen.has(at))continue;seen.add(at);queue.push(...(adj.get(at)??[]));}
 for(const region of w.regions)if(!region.siteIds.some(x=>seen.has(x)))errors.push(issue('UNREACHABLE_REGION','regions/'+region.id,'Public region cannot be reached'));
 // Route endpoints must each have a usable site entrance; routes are independent of local portals.
 for(const route of w.routes)for(const siteId of [route.fromSiteId,route.toSiteId]){
  const site=w.sites.find(s=>s.id===siteId);
  if(site&&!mapFor(w,site.id,site.floors[0]!)?.entrances.some(e=>e.id===site.entryId))
   errors.push(issue('ROUTE_ENTRY','routes/'+route.id,'Route endpoint has no site entry'));
 }
 return errors;
}
/** Validate saved 03-A world data without applying or overwriting any live state. */
export function validateWorldRuntime03A(raw:unknown,registry:WorldRegistry):WorldValidationIssue[]{
 const errors:WorldValidationIssue[]=[];const fail=(code:string,path:string)=>errors.push(issue(code,path,'Invalid saved world runtime'));
 if(!obj(raw)||raw.worldStateVersion!==1||typeof raw.worldSeed!=='string'||!raw.worldSeed||
  raw.generatorVersion!==registry.definition.generatorVersion)return [issue('WORLD_VERSION','world','Incompatible world state/version')];
 const allowed=['worldStateVersion','worldSeed','generatorVersion','location','discovery','seenCells','lifecycle','generatedSites','siteDeltas'];
 if(Object.keys(raw).some(k=>!allowed.includes(k)))fail('UNKNOWN_FIELD','world');
 if(!obj(raw.location)||typeof raw.location.siteId!=='string'||!safe(raw.location.x)||!safe(raw.location.y)||!Number.isSafeInteger(raw.location.floor)||
  !validatePlayerLocation(registry,raw.location as unknown as PlayerLocation))fail('PLAYER_LOCATION','location');
 for(const key of ['discovery','seenCells','lifecycle','generatedSites','siteDeltas'])if(!obj(raw[key]))fail('FIELD',key);
 if(obj(raw.discovery))for(const [siteId,status] of Object.entries(raw.discovery)){
  if(!registry.sites.has(siteId)||!['discovered','visited'].includes(String(status)))fail('DISCOVERY',siteId);
 }
 if(obj(raw.seenCells))for(const [key,cells] of Object.entries(raw.seenCells)){
  const map=registry.maps.get(key);
  if(!map||!Array.isArray(cells)||cells.some(c=>!safe(c)||c>=map.width*map.height)||new Set(cells).size!==cells.length)fail('SEEN_CELLS',key);
 }
 if(obj(raw.lifecycle))for(const [siteId,value] of Object.entries(raw.lifecycle)){
  const site=registry.sites.get(siteId);
  if(!site||!obj(value)||value.siteId!==siteId||!safe(value.generationIndex)||!safe(value.createdAt)||
    !(value.expiresAt===null||safe(value.expiresAt))||!(value.renewAt===null||safe(value.renewAt))||
    !['active','expiration_pending','expired'].includes(String(value.status)))fail('LIFECYCLE',siteId);
  if(site?.lifecycle.kind==='permanent'&&obj(value)&&(value.status!=='active'||value.expiresAt!==null||value.renewAt!==null))fail('PERMANENT',siteId);
 }
 for(const key of ['generatedSites','siteDeltas'])if(obj(raw[key]))for(const siteId of Object.keys(raw[key])){
  if(!registry.sites.has(siteId))fail('SITE_REFERENCE',key+'/'+siteId);
 }
 return errors;
}
export function createInitialWorldRuntime03A(registry:WorldRegistry,worldSeed:string):WorldRuntime03A{
 if(!worldSeed)throw RangeError('World seed required');
 const site=registry.sites.get(registry.definition.initialSiteId)!;
 const map=registry.definition.maps.find(m=>m.siteId===site.id&&m.floor===site.floors[0])!;
 const entry=map.entrances.find(e=>e.id===site.entryId)!;
 const initial:WorldRuntime03A={worldStateVersion:1,worldSeed,generatorVersion:registry.definition.generatorVersion,
  location:{siteId:site.id,floor:map.floor,x:entry.x,y:entry.y},
  discovery:{[site.id]:'visited'},seenCells:{[map.id]:[entry.y*map.width+entry.x]},
  lifecycle:{},generatedSites:{},siteDeltas:{}};
 if(validateWorldRuntime03A(initial,registry).length)throw Error('Invalid initial world');
 return initial;
}
/** Pure copy, no mutation, no v2-save-schema change. */
export function prepareWorldRuntime03ALoad(raw:unknown,registry:WorldRegistry):
 {ok:true;world:WorldRuntime03A}|{ok:false;issues:readonly WorldValidationIssue[]}{
 const issues=validateWorldRuntime03A(raw,registry);
 return issues.length?{ok:false,issues}:{ok:true,world:structuredClone(raw) as WorldRuntime03A};
}
export function siteGenerationSeed(world:WorldRuntime03A,siteId:string,registry:WorldRegistry,generationIndex=0){
 if(!registry.sites.has(siteId))throw RangeError('Unknown site');
 return deriveSiteSeed(world.worldSeed,world.generatorVersion,siteId,generationIndex);
}
