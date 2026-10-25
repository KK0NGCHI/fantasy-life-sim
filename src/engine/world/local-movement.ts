import type {WorldRegistry,WorldRuntime03A,PlayerLocation,MapDefinition} from './world-model.js';
import {validatePlayerLocation} from './world-model.js';

export type CardinalDirection='north'|'south'|'west'|'east';
export interface LocalStepResult {
 readonly status:'moved'|'blocked'|'invalid'|'hazard';
 readonly turns:0|1;
 readonly elapsedSeconds:number;
 readonly location:PlayerLocation;
 readonly mapId:string;
 readonly hazardTags:readonly string[];
}
const offsets:Record<CardinalDirection,readonly [number,number]>={
 north:[0,-1],south:[0,1],west:[-1,0],east:[1,0]
};
const ZERO:readonly string[]=[];
const mapAt=(registry:WorldRegistry,location:PlayerLocation):MapDefinition|undefined=>
 [...registry.maps.values()].find(m=>m.siteId===location.siteId&&m.floor===location.floor);
/** Pure movement resolver. Caller commits turns/seconds and state via a dispatcher.
 * Invalid input is free. A valid cardinal attempt into a wall costs one turn.
 * Hazards are reported before stepping, never silently ignored.
 */
export function resolveLocalStep(
 registry:WorldRegistry,location:PlayerLocation,direction:unknown,
 knownHazards:ReadonlySet<string>=new Set()
):LocalStepResult {
 const map=mapAt(registry,location);
 const unchanged={...location};
 if(!map||!validatePlayerLocation(registry,location))
  return {status:'invalid',turns:0,elapsedSeconds:0,location:unchanged,mapId:map?.id??'',hazardTags:ZERO};
 if(typeof direction!=='string'||!Object.hasOwn(offsets,direction))
  return {status:'invalid',turns:0,elapsedSeconds:0,location:unchanged,mapId:map.id,hazardTags:ZERO};
 const [dx,dy]=offsets[direction as CardinalDirection];
 const to={...location,x:location.x+dx,y:location.y+dy};
 if(!validatePlayerLocation(registry,to))
  return {status:'blocked',turns:1,elapsedSeconds:6,location:unchanged,mapId:map.id,hazardTags:ZERO};
 const terrainId=map.tiles[to.y]!.split(' ')[to.x]!;
 const terrain=registry.terrains.get(terrainId)!;
 const hazards=terrain.hazardTags.filter(tag=>knownHazards.has(tag));
 if(hazards.length)return {status:'hazard',turns:0,elapsedSeconds:0,location:unchanged,mapId:map.id,hazardTags:hazards};
 const seconds=6*terrain.movementCost;
 if(!Number.isSafeInteger(seconds))throw new RangeError('Movement duration overflow');
 return {status:'moved',turns:1,elapsedSeconds:seconds,location:to,mapId:map.id,hazardTags:terrain.hazardTags};
}
export interface LocalVisitResult {readonly world:WorldRuntime03A;readonly newlySeen:boolean}
/** Marks only the entered cell. True line-of-sight is a later 03-C phase. */
export function recordLocalVisit(world:WorldRuntime03A,registry:WorldRegistry,location:PlayerLocation):LocalVisitResult {
 if(!validatePlayerLocation(registry,location))throw new RangeError('Invalid local player tile');
 const map=mapAt(registry,location)!;
 const index=location.y*map.width+location.x;
 const seen=world.seenCells[map.id]??[];
 const newlySeen=!seen.includes(index);
 return {newlySeen,world:{...world,location:{...location},
  discovery:{...world.discovery,[location.siteId]:'visited'},
  seenCells:{...world.seenCells,[map.id]:newlySeen?[...seen,index]:[...seen]}}};
}
/** Arrival is explicit: use the destination site's declared entry, never its map coordinate on the overworld UI. */
export function localArrival(registry:WorldRegistry,siteId:string):PlayerLocation {
 const site=registry.sites.get(siteId);
 if(!site)throw new RangeError('Unknown arrival site');
 const map=[...registry.maps.values()].find(m=>m.siteId===siteId&&m.floor===site.floors[0]);
 const entry=map?.entrances.find(e=>e.id===site.entryId);
 if(!map||!entry)throw new RangeError('Missing arrival entrance');
 const position={siteId,floor:map.floor,x:entry.x,y:entry.y};
 if(!validatePlayerLocation(registry,position))throw new RangeError('Blocked arrival entrance');
 return position;
}
