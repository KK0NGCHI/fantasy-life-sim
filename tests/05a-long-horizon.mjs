import {createResourceNodes05A,RESOURCE_MAP_05A,workDuration05A,workResource05A,discoverResource05A,resourceAt05A} from '../src/resources-05a.js';
const DAY=86400;
const scenarios={
 casual:{hours:2,daysPerWeek:3,sequence:['gather','logging','mining','fishing'],materialRank:1},
 specialist:{hours:4,daysPerWeek:5,sequence:['mining'],materialRank:1},
 intensive:{hours:6,daysPerWeek:7,sequence:['mining'],materialRank:1}
};
const byActivity={
 gather:['resource05a:wild-herb','resource05a:mushroom','resource05a:grass'],
 logging:['resource05a:oak-log','resource05a:pine-log'],
 mining:['resource05a:stone','resource05a:coal','resource05a:copper-ore'],
 fishing:['resource05a:small-fish','resource05a:carp','resource05a:trout']
};
function rng(seed){let state=seed>>>0;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296}}
export function simulate05A(days,kind){
 const settings=scenarios[kind];if(!settings)throw Error('UNKNOWN_SCENARIO');
 const next=rng(1647),nodes=createResourceNodes05A(),items={},experience={gather:0,logging:0,mining:0,fishing:0};
 const metrics={work:0,search:0,failedSearch:0,empty:0,seconds:0,regenerated:0};
 let elapsed=0;
 for(let day=0;day<days;day++){
  const start=day*DAY;
  elapsed=Math.max(elapsed,start);
  if(day%7>=settings.daysPerWeek)continue;
  let remaining=settings.hours*3600;
  const activity=settings.sequence[Math.floor(day/7)%settings.sequence.length];
  const candidates=byActivity[activity];
  for(const [nodeId,node] of Object.entries(nodes)){
   const def=RESOURCE_MAP_05A.get(node.resourceId);
   if(candidates.includes(def.id)&&def.regenDays>0)nodes[nodeId]=resourceAt05A(node,def,elapsed);
  }
  while(remaining>=80){
   const viable=Object.entries(nodes).filter(([id,node])=>{
    const def=RESOURCE_MAP_05A.get(node.resourceId);
    return def.activity===activity&&node.discovered&&candidates.includes(def.id)&&
      (node.remaining>0||def.regenDays>0);
   });
   const active=viable.filter(([id,node])=>{
     const def=RESOURCE_MAP_05A.get(node.resourceId);
     // defer exhausted nodes; their recovery is checked by trying a work at current game time
     return node.remaining>0;
   });
   if(!active.length){
    const resourceId=candidates[Math.floor(next()*candidates.length)];
    if(activity==='mining'){
     const found=discoverResource05A(nodes,resourceId,'광산',elapsed);
     if(found.ok&&remaining>=600){Object.assign(nodes,found.nodes);elapsed+=600;remaining-=600;metrics.search++;continue;}
     metrics.failedSearch++;
    }
    metrics.empty++;break;
   }
   const [nodeId,node]=active[Math.floor(next()*active.length)];
   const def=RESOURCE_MAP_05A.get(node.resourceId),duration=workDuration05A(activity,next());
   if(duration>remaining)break;
   const toolKind={gather:null,logging:'axe',mining:'pickaxe',fishing:'rod'}[activity];
   const result=workResource05A(nodes,nodeId,def.region,elapsed,{toolKind,toolRank:settings.materialRank,outcomeRoll:next()});
   if(!result.ok){metrics.empty++;break;}
   nodes[nodeId]=result.node;metrics.work++;metrics.seconds+=duration;
   items[def.id]=(items[def.id]??0)+result.qty;experience[activity]+=result.xp;
   elapsed+=duration;remaining-=duration;
  }
 }
 return {days,kind,metrics,items,experience,nodes:Object.keys(nodes).length,
  totalItems:Object.values(items).reduce((a,b)=>a+b,0),
  totalXp:Object.values(experience).reduce((a,b)=>a+b,0)};
}
if(process.argv[1]?.endsWith('05a-long-horizon.mjs')){
 for(const days of [28,112,224])for(const kind of Object.keys(scenarios)){
  console.log('SIM05A '+JSON.stringify(simulate05A(days,kind)));
 }
}
