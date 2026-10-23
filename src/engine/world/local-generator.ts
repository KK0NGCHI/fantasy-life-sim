import type {MapDefinition,WorldRegistry} from './world-model.js';
import {deriveSiteSeed} from './world-model.js';

export type GenerationAlgorithm='forest'|'cavern'|'dungeon';
export interface GenerationProfile {
 readonly id:string;readonly version:number;readonly algorithm:GenerationAlgorithm;
 readonly width:number;readonly height:number;
 readonly siteId:string;readonly floor:number;
 readonly maxAttempts:number;
}
export interface GeneratedLocalMap {
 readonly map:MapDefinition;readonly profileId:string;readonly profileVersion:number;
 readonly worldSeed:string;readonly generationIndex:number;readonly attempt:number;
 readonly placements:readonly {id:string;kind:'resource-slot'|'landmark-slot';x:number;y:number}[];
}
const WALL='core:terrain/wall',GROUND='core:terrain/ground';
const positive=(n:number)=>Number.isSafeInteger(n)&&n>0;
export function validateGenerationProfile(p:GenerationProfile,registry:WorldRegistry):void{
 if(!p||!registry.sites.has(p.siteId)||!['forest','cavern','dungeon'].includes(p.algorithm)||
 !positive(p.version)||!positive(p.width)||!positive(p.height)||p.width<16||p.height<16||
 p.width>128||p.height>128||!positive(p.maxAttempts)||p.maxAttempts>16||
 !registry.sites.get(p.siteId)!.floors.includes(p.floor)||!registry.terrains.has(WALL)||!registry.terrains.has(GROUND)||
 !/^[a-z][a-z0-9_-]*:[a-z0-9_/-]+$/.test(p.id))throw RangeError('Invalid generation profile');
}
function stream(seed:number){let x=seed>>>0;return ()=>{x=(x+0x6d2b79f5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function subSeed(seed:number,domain:string){let h=seed;for(const ch of domain)h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h||1;}
type XY=readonly [number,number];
const inBounds=(x:number,y:number,w:number,h:number)=>x>0&&y>0&&x<w-1&&y<h-1;
function carve(grid:string[][],a:XY,b:XY,rand:()=>number){
 let [x,y]=a;const [tx,ty]=b;
 while(x!==tx||y!==ty){
  grid[y]![x]=GROUND;
  const horizontal=(x!==tx&&(y===ty||rand()<.5));
  if(horizontal)x+=Math.sign(tx-x);else y+=Math.sign(ty-y);
 }
 grid[y]![x]=GROUND;
}
function connected(grid:string[][],start:XY,goal:XY):boolean{
 const h=grid.length,w=grid[0]!.length;
 const queue:XY[]=[start],seen=new Set<string>();
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i]!,k=x+','+y;
  if(seen.has(k)||grid[y]?.[x]!==GROUND)continue;
  if(x===goal[0]&&y===goal[1])return true;
  seen.add(k);
  for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]])if(inBounds(x+dx,y+dy,w,h))queue.push([x+dx,y+dy]);
 }
 return false;
}
/** Separate RNG streams ensure decoration changes cannot alter structural topology. */
export function generateLocalMap(registry:WorldRegistry,p:GenerationProfile,worldSeed:string,generationIndex=0):GeneratedLocalMap{
 validateGenerationProfile(p,registry);
 if(!worldSeed||!Number.isSafeInteger(generationIndex)||generationIndex<0)throw RangeError('Invalid generation seed');
 const seed=deriveSiteSeed(worldSeed,registry.definition.generatorVersion,p.siteId,generationIndex);
 const start:XY=[2,2],goal:XY=[p.width-3,p.height-3];
 const origin=registry.definition.maps.find(m=>m.siteId===p.siteId&&m.floor===p.floor);
 if(!origin)throw RangeError('No template map');
 for(let attempt=0;attempt<p.maxAttempts;attempt++){
  const geometry=stream(subSeed(seed,'geometry:'+p.id+':'+p.version+':'+p.floor+':'+attempt));
  const paths=stream(subSeed(seed,'paths:'+p.id+':'+p.version+':'+p.floor+':'+attempt));
  const decorations=stream(subSeed(seed,'decor:'+p.id+':'+p.version+':'+p.floor+':'+attempt));
  const grid=Array.from({length:p.height},(_,y)=>Array.from({length:p.width},(_,x)=>
   !inBounds(x,y,p.width,p.height)?WALL:geometry()<(p.algorithm==='forest'?.14:p.algorithm==='cavern'?.46:.76)?GROUND:WALL));
  if(p.algorithm==='dungeon'){
   // Designed flow first: connected room centers and at least one cross link.
   const centers:XY[]=[start,[Math.floor(p.width/2),2],[Math.floor(p.width/2),Math.floor(p.height/2)],
    [2,Math.floor(p.height/2)],[p.width-3,Math.floor(p.height/2)],goal];
   for(const [x,y] of centers)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)
    if(inBounds(x+dx,y+dy,p.width,p.height))grid[y+dy]![x+dx]=GROUND;
   for(let i=1;i<centers.length;i++)carve(grid,centers[i-1]!,centers[i]!,paths);
   carve(grid,centers[1]!,centers[4]!,paths);
  }else{
   // Guarantee the critical route before embellishment.
   carve(grid,start,goal,paths);
   for(let i=0;i<Math.floor(p.width*p.height/80);i++){
    const a:XY=[2+Math.floor(geometry()*(p.width-4)),2+Math.floor(geometry()*(p.height-4))];
    const b:XY=[2+Math.floor(geometry()*(p.width-4)),2+Math.floor(geometry()*(p.height-4))];
    carve(grid,a,b,paths);
   }
  }
  // Fixed legacy entry ID and link remain valid, now moved to a guaranteed floor point.
  const entrances=origin.entrances.map((e,i)=>({...e,x:i===0?start[0]:goal[0],y:i===0?start[1]:goal[1]}));
  for(const e of entrances)grid[e.y]![e.x]=GROUND;
  for(let i=1;i<entrances.length;i++)carve(grid,[entrances[0]!.x,entrances[0]!.y],[entrances[i]!.x,entrances[i]!.y],paths);
  const placements:{id:string;kind:'resource-slot'|'landmark-slot';x:number;y:number}[]=[];
  for(let y=2;y<p.height-2;y++)for(let x=2;x<p.width-2;x++){
   if(grid[y]![x]!==GROUND||entrances.some(e=>e.x===x&&e.y===y))continue;
   if(decorations()<.016)placements.push({id:p.siteId+'/slot-'+x+'-'+y,kind:decorations()<.2?'landmark-slot':'resource-slot',x,y});
  }
  if(!connected(grid,start,goal)||entrances.some(e=>!connected(grid,start,[e.x,e.y])))continue;
  return {map:{...origin,width:p.width,height:p.height,tiles:grid.map(row=>row.join(' ')),entrances},
   profileId:p.id,profileVersion:p.version,worldSeed,generationIndex,attempt,placements};
 }
 throw Error('GENERATION_CONSTRAINT_FAILED');
}
