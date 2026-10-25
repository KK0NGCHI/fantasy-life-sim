import type {WorldRegistry,PlayerLocation,WorldRuntime03A} from './world-model.js';
import {validatePlayerLocation} from './world-model.js';
import {resolveLocalStep} from './local-movement.js';

const mapAt=(r:WorldRegistry,p:PlayerLocation)=>[...r.maps.values()].find(m=>m.siteId===p.siteId&&m.floor===p.floor);
const key=(p:PlayerLocation)=>p.x+','+p.y;
const directions=['north','east','south','west'] as const;
export interface LocalView {readonly visible:readonly number[];readonly remembered:readonly number[];readonly mapId:string}
/** Deterministic supercover-style visibility: blocking cell visible, cells behind it hidden. */
export function localVisibility(registry:WorldRegistry,position:PlayerLocation,remembered:readonly number[]=[],radius=6):LocalView {
 const map=mapAt(registry,position);
 if(!map||!validatePlayerLocation(registry,position)||!Number.isSafeInteger(radius)||radius<0||radius>32)throw RangeError('Invalid local vision');
 const blocking=(x:number,y:number)=>registry.terrains.get(map.tiles[y]?.split(' ')[x]??'')?.blocksSight!==false;
 const visible:number[]=[];
 for(let y=Math.max(0,position.y-radius);y<Math.min(map.height,position.y+radius+1);y++)
 for(let x=Math.max(0,position.x-radius);x<Math.min(map.width,position.x+radius+1);x++){
  if(Math.max(Math.abs(position.x-x),Math.abs(position.y-y))>radius)continue;
  let clear=true;
  const dx=x-position.x,dy=y-position.y,steps=Math.max(Math.abs(dx),Math.abs(dy));
  for(let i=1;i<steps;i++){
   const xx=Math.round(position.x+dx*i/steps),yy=Math.round(position.y+dy*i/steps);
   if(blocking(xx,yy)){clear=false;break}
  }
  if(clear)visible.push(y*map.width+x);
 }
 return {mapId:map.id,visible,remembered:[...new Set([...remembered,...visible])].sort((a,b)=>a-b)};
}
export function localPortal(registry:WorldRegistry,position:PlayerLocation) {
 const map=mapAt(registry,position);
 const entry=map?.entrances.find(e=>e.x===position.x&&e.y===position.y&&
  !(e.destinationSiteId===map.siteId&&e.destinationFloor===map.floor&&e.destinationEntryId===e.id));
 if(!entry)return null;
 const target=[...registry.maps.values()].find(m=>m.siteId===entry.destinationSiteId&&m.floor===entry.destinationFloor);
 const dest=target?.entrances.find(e=>e.id===entry.destinationEntryId);
 if(!dest||dest.destinationSiteId!==position.siteId||dest.destinationFloor!==position.floor||dest.destinationEntryId!==entry.id)return null;
 const location={siteId:entry.destinationSiteId,floor:entry.destinationFloor,x:dest.x,y:dest.y};
 if(!validatePlayerLocation(registry,location))return null;
 return location;
}
/** BFS only traverses remembered tiles and never consults hidden danger information. */
export function safeLocalRoute(registry:WorldRegistry,from:PlayerLocation,goal:PlayerLocation,knownCells:ReadonlySet<number>,knownHazards:ReadonlySet<string>=new Set()):readonly (typeof directions)[number][] {
 const map=mapAt(registry,from);
 if(!map||from.siteId!==goal.siteId||from.floor!==goal.floor||!validatePlayerLocation(registry,from)||!validatePlayerLocation(registry,goal))return [];
 const index=(p:PlayerLocation)=>p.y*map.width+p.x;
 if(!knownCells.has(index(goal)))return [];
 const seen=new Set([key(from)]),queue:[PlayerLocation,(typeof directions)[number][]][]=[[from,[]]];
 for(let n=0;n<queue.length;n++){
  const [at,path]=queue[n]!;
  if(key(at)===key(goal))return path;
  for(const direction of directions){
   const step=resolveLocalStep(registry,at,direction,knownHazards);
   if(step.status!=='moved'||!knownCells.has(index(step.location))||seen.has(key(step.location)))continue;
   seen.add(key(step.location));queue.push([step.location,[...path,direction]]);
  }
 }
 return [];
}
export function rememberLocalVision(world:WorldRuntime03A,view:LocalView):WorldRuntime03A{
 return {...world,seenCells:{...world.seenCells,[view.mapId]:[...view.remembered]}};
}
