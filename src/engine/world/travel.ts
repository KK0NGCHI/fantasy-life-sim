import type {WorldRegistry,RouteDefinition} from './world-model.js';

export type RoutePolicy='fast'|'safe'|'fewestTurns';
export interface TravelPlan {readonly originSiteId:string;readonly destinationSiteId:string;readonly routeEdgeIds:readonly string[];readonly siteIds:readonly string[];readonly totalTurns:number;readonly totalWorldUnits:number;readonly routingPolicy:RoutePolicy}
export interface TravelProgress {readonly plan:TravelPlan;readonly edgeIndex:number;readonly completedEdgeTurns:number;readonly status:'moving'|'paused'|'interrupted';readonly interruptionReason:string|null}
export type TravelPosition={readonly kind:'site';readonly siteId:string}|{readonly kind:'travel';readonly edgeId:string;readonly fromSiteId:string;readonly toSiteId:string;readonly completedTurns:number};
export interface TravelState {readonly position:TravelPosition;readonly progress:TravelProgress|null}
export interface TravelAccess {readonly knownSites:ReadonlySet<string>;readonly blockedEdges?:ReadonlySet<string>;readonly knownHazards?:ReadonlySet<string>;readonly allowedRequirements?:ReadonlySet<string>;readonly expiredSites?:ReadonlySet<string>}
export type RouteResult={readonly ok:true;readonly plan:TravelPlan}|{readonly ok:false;readonly reason:'UNKNOWN_SITE'|'UNDISCOVERED'|'UNREACHABLE'|'SAME_SITE'};
function edgeAllowed(edge:RouteDefinition,a:TravelAccess):boolean{
 return !a.blockedEdges?.has(edge.id)&&edge.requirementTags.every(t=>a.allowedRequirements?.has(t)??false);
}
export function planTravel(registry:WorldRegistry,from:string,to:string,policy:RoutePolicy,access:TravelAccess):RouteResult{
 if(!registry.sites.has(from)||!registry.sites.has(to))return {ok:false,reason:'UNKNOWN_SITE'};
 if(from===to)return {ok:false,reason:'SAME_SITE'};
 if(!access.knownSites.has(from)||!access.knownSites.has(to)||access.expiredSites?.has(to))return {ok:false,reason:'UNDISCOVERED'};
 type Node={site:string;ids:string[];nodes:string[];turns:number;units:number;danger:number};
 const compare=(a:Node,b:Node)=>{
  const keys=policy==='fewestTurns'?[a.turns-b.turns,a.units-b.units,a.danger-b.danger]:
   policy==='safe'?[a.danger-b.danger,a.units-b.units,a.turns-b.turns]:
   [a.units-b.units,a.turns-b.turns,a.danger-b.danger];
  return keys.find(v=>v!==0)??a.ids.join('|').localeCompare(b.ids.join('|'));
 };
 const frontier:Node[]=[{site:from,ids:[],nodes:[from],turns:0,units:0,danger:0}];
 const best=new Map<string,Node>();
 while(frontier.length){
  frontier.sort(compare);const current=frontier.shift()!;
  if(best.has(current.site))continue;best.set(current.site,current);
  if(current.site===to)return {ok:true,plan:{originSiteId:from,destinationSiteId:to,routeEdgeIds:current.ids,siteIds:current.nodes,totalTurns:current.turns,totalWorldUnits:current.units,routingPolicy:policy}};
  for(const edge of registry.routes.values()){
   if(!edgeAllowed(edge,access))continue;
   const next=edge.fromSiteId===current.site?edge.toSiteId:edge.bidirectional&&edge.toSiteId===current.site?edge.fromSiteId:null;
   if(!next||best.has(next)||!access.knownSites.has(next)||access.expiredSites?.has(next))continue;
   const danger=edge.hazardTags.filter(t=>access.knownHazards?.has(t)).length;
   const candidate:Node={site:next,ids:[...current.ids,edge.id],nodes:[...current.nodes,next],turns:current.turns+edge.turns,units:current.units+edge.worldUnits,danger:current.danger+danger};
   if(Number.isSafeInteger(candidate.turns)&&Number.isSafeInteger(candidate.units))frontier.push(candidate);
  }
 }
 return {ok:false,reason:'UNREACHABLE'};
}
export function beginTravel(plan:TravelPlan):TravelState{
 if(!plan.routeEdgeIds.length||plan.siteIds.length!==plan.routeEdgeIds.length+1)throw RangeError('Invalid plan');
 return {position:{kind:'site',siteId:plan.originSiteId},progress:{plan,edgeIndex:0,completedEdgeTurns:0,status:'paused',interruptionReason:null}};
}
export type TravelStep={readonly ok:true;readonly state:TravelState;readonly turns:1;readonly worldUnits:number;readonly arrived:boolean}|
 {readonly ok:false;readonly reason:'NO_TRAVEL'|'PAUSED'|'ROUTE_CHANGED'|'INVALID_STATE'};
/** Exactly one travel turn. The caller must charge these values via the central dispatcher. */
export function advanceTravel(state:TravelState,registry:WorldRegistry,access:TravelAccess):TravelStep{
 const p=state.progress;if(!p)return {ok:false,reason:'NO_TRAVEL'};
 if(p.status!=='moving')return {ok:false,reason:'PAUSED'};
 const i=p.edgeIndex,edge=registry.routes.get(p.plan.routeEdgeIds[i]??'');
 const from=p.plan.siteIds[i],to=p.plan.siteIds[i+1];
 if(!edge||!from||!to||!edgeAllowed(edge,access)||access.expiredSites?.has(to)||
  !(edge.fromSiteId===from&&edge.toSiteId===to||edge.bidirectional&&edge.toSiteId===from&&edge.fromSiteId===to))
  return {ok:false,reason:'ROUTE_CHANGED'};
 if(!Number.isSafeInteger(p.completedEdgeTurns)||p.completedEdgeTurns<0||p.completedEdgeTurns>=edge.turns)return {ok:false,reason:'INVALID_STATE'};
 const completed=p.completedEdgeTurns+1;
 const worldUnits=Math.floor(edge.worldUnits*completed/edge.turns)-Math.floor(edge.worldUnits*p.completedEdgeTurns/edge.turns);
 if(!Number.isSafeInteger(worldUnits)||worldUnits<0)return {ok:false,reason:'INVALID_STATE'};
 if(completed<edge.turns)return {ok:true,turns:1,worldUnits,arrived:false,
  state:{position:{kind:'travel',edgeId:edge.id,fromSiteId:from,toSiteId:to,completedTurns:completed},
   progress:{...p,completedEdgeTurns:completed}}};
 if(i+1===p.plan.routeEdgeIds.length)return {ok:true,turns:1,worldUnits,arrived:true,state:{position:{kind:'site',siteId:to},progress:null}};
 return {ok:true,turns:1,worldUnits,arrived:false,state:{position:{kind:'site',siteId:to},progress:{...p,edgeIndex:i+1,completedEdgeTurns:0}}};
}
export function pauseTravel(state:TravelState):TravelState{
 return state.progress?{...state,progress:{...state.progress,status:'paused'}}:state;
}
export function resumeTravel(state:TravelState):TravelState{
 return state.progress?{...state,progress:{...state.progress,status:'moving',interruptionReason:null}}:state;
}
export function cancelTravel(state:TravelState):TravelState{
 return {...state,progress:null};
}
/** Static compatibility preflight for resumable travel; never mutate the saved snapshot. */
export function validateTravelState(raw:TravelState,registry:WorldRegistry):boolean{
 if(!raw||!raw.position||!raw.progress)return !!raw&&raw.position?.kind==='site'&&registry.sites.has(raw.position.siteId);
 const p=raw.progress;
 if(!['moving','paused','interrupted'].includes(p.status)||!p.plan?.routeEdgeIds?.length||p.plan.siteIds.length!==p.plan.routeEdgeIds.length+1||
 !Number.isSafeInteger(p.edgeIndex)||p.edgeIndex<0||p.edgeIndex>=p.plan.routeEdgeIds.length)return false;
 const edge=registry.routes.get(p.plan.routeEdgeIds[p.edgeIndex]??'');
 return !!edge&&Number.isSafeInteger(p.completedEdgeTurns)&&p.completedEdgeTurns>=0&&p.completedEdgeTurns<edge.turns;
}
