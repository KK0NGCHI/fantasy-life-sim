import {createTreeWorld05C,createWoodlandSubstrates05C,advanceWoodland05C} from './woodland-cycle-05c.js';
import {createSubstrateWorld05B,consumeFungalSubstrate05B,addLoggingDeadwood05B} from './fungal-substrates-05b.js';
import {FUNGAL_ITEMS_05B,FUNGAL_BY_ID_05B,FUNGAL_ECOLOGY_MAP_05B,createFungalEcology05B,fungalReconcile05B,fungalHarvest05B} from './fungal-ecology-05b.js';
import {ecologyClimate05A} from './ecology-climate-05a.js';
import {createBotanicalEcology05A,BOTANICAL_ECOLOGY_MAP_05A,BOTANICAL_SEED_ITEMS_05A} from './botanical-ecology-adapter-05a.js';
import {ecologySiteId,ecologyInteract,ecologyReconcile} from './ecology-core-05a.js';
import {eligibleBotanicalObservations05A,botanicalCanHarvest05A,botanicalMarkHarvest05A} from './botanical-lifecycle-05a.js';
import {BOTANICAL_PROFILE_BY_ID_05A} from './botanical-profiles-05a.js';
import {validateIncidentalTable05A,resolveIncidentalActivity05A,INCIDENTAL_ACTIVITY_SECONDS_05A} from './incidental-resources-05a.js';
import {rollAvailableResourcePool05A,validateResourcePool05A} from './resource-pools-05a.js';
import {BOTANICAL_ITEMS_05A} from './botanical-species-05a.js';
import {CATALOG_ITEMS_05A} from './resource-catalog-05a.js';
import {createCandidateSites05A,discoverCandidateSite05A,harvestCandidateSite05A,acquiredCompendium05A,SOURCE_WORK_RULES_05A,prospectCandidateQuartz05A,reconcileCandidateSite05A} from './resource-sites-05a.js';
import {RESOURCES_05A,createResourceNodes05A,RESOURCE_MAP_05A,workResource05A,workDuration05A,RESOURCE_TOOL_RANK,RESOURCE_TOOL_KINDS,discoverResource05A} from './resources-05a.js';
import {resolveOriginInteraction} from './origin-interactions-04c.js';
import {createOrigin,validateOrigin,applyOriginToProgression} from './character-origin-04b.js';
import {createProgression,validateProgression,SKILL_DEFINITIONS,skillLevel,awardProgression} from './progression-system.js';
import {createInitialWorldRuntime03A} from '../dist/engine/world/world-integrity.js';
import {createWorldSnapshot03E,withGeneratedMap,recordWorldSight,recordWorldLocation,restoreWorldSnapshot03E} from '../dist/engine/world/world-persistence-03e.js';
import {activityPreview} from './region-activities.js';
import {actionSeconds} from '../dist/engine/world/action-seconds.js';
import {resolveLocalStep,localArrival} from '../dist/engine/world/local-movement.js';
import {localVisibility,safeLocalRoute,localPortal} from '../dist/engine/world/local-exploration.js';
import {generateLocalMap} from '../dist/engine/world/local-generator.js';
import {readAutoPolicy,writeAutoPolicy,validateAutoPolicy} from './autosave-preferences.js';
import {buildItemRegistry,createRandomState,V2ActionDispatcher,prepareBulkDiscard,confirmBulkDiscard,createSaveV2,prepareV2Load,IndexedDbSavesV2,shouldAutoSave,buildWorldRegistry,SOMNIUM_WORLD_03A,planTravel,beginTravel,resumeTravel,pauseTravel,cancelTravel,advanceTravel,validateTravelState,drawRandom,gameClockAt,formatTravelSeconds,IndexedDbSavesV3,createSaveV3,decodeSaveV3,prepareV2ToV3Migration,prepareSecondsV2ToV3} from '../dist/engine/v2.js';

/** Bridge for the existing main UI fixture. Game item identity, quantity and ownership live in v2.
 * Legacy UI labels/categories remain presentation-only and are never silently migrated from localStorage.
 */
export function createMainV2Inventory(uiItems,options={}) {
 const knownResourceItems05A=[...CATALOG_ITEMS_05A,...BOTANICAL_ITEMS_05A,...BOTANICAL_SEED_ITEMS_05A,...FUNGAL_ITEMS_05B];
 const poolOverrides=options.resourcePools05A??{};
 if(!poolOverrides||typeof poolOverrides!=='object'||Array.isArray(poolOverrides)||Object.entries(poolOverrides).some(([source,pool])=>!SOURCE_WORK_RULES_05A[source]||!validateResourcePool05A(pool)||pool.tiers.some(t=>t.outputs.some(o=>!knownResourceItems05A.some(i=>i.id===o.itemId)))))throw Error('INVALID_RESOURCE_POOL_CONFIG');
 const incidentalTables05A=options.incidentalTables05A??{};
 if(!incidentalTables05A||typeof incidentalTables05A!=='object'||Array.isArray(incidentalTables05A)||
 Object.entries(incidentalTables05A).some(([key,t])=>key!==t.region+':'+t.activity||
 !validateIncidentalTable05A(t)||t.pool.tiers.some(tier=>tier.outputs.some(o=>!knownResourceItems05A.some(item=>item.id===o.itemId)))))
 throw Error('INVALID_INCIDENTAL_CONFIG');
 const preferences=options.preferences??(typeof localStorage==='undefined'?null:localStorage);
 const resourceItems=knownResourceItems05A.map(r=>({id:r.id,name:r.name,group:'채취 재료',qty:0,tags:[]}));
 const starterTools=[{id:'tool05a:gloves',name:'천 채집 장갑',group:'도구',qty:1,tags:['tool:gather']},{id:'tool05a:axe',name:'석재 벌목 도끼',group:'도구',qty:1,tags:['tool:logging']},{id:'tool05a:pickaxe',name:'석재 곡괭이',group:'도구',qty:1,tags:['tool:mining']},{id:'tool05a:rod',name:'목재 낚싯대',group:'도구',qty:1,tags:['tool:fishing']}];
 const materialTools05A=[
  ...[['copper',2,'구리'],['iron',3,'철'],['steel',4,'강철']].flatMap(([material,rank,name])=>
   [['axe','벌목 도끼'],['pickaxe','곡괭이']].map(([kind,label])=>({
    id:'tool05a:'+kind+':'+material,name:name+' '+label,group:'도구',qty:0,tags:['tool:'+kind,'material:'+material,'rank:'+rank]
   }))),
  ...[['processedWood',2,'가공 목재'],['reinforcedWood',3,'강화 목재']].map(([material,rank,name])=>({
   id:'tool05a:rod:'+material,name:name+' 낚싯대',group:'도구',qty:0,tags:['tool:rod','material:'+material,'rank:'+rank]
  })),
  ...[['leather',2,'가죽'],['reinforcedLeather',3,'강화 가죽']].map(([material,rank,name])=>({
   id:'tool05a:gloves:'+material,name:name+' 채집 장갑',group:'도구',qty:0,tags:['tool:gather','material:'+material,'rank:'+rank]
  }))
 ];
 const initialItems=options.resources05A===true?[...uiItems,...starterTools]:uiItems;
 const templates=new Map([...initialItems,...resourceItems,...materialTools05A].map(item=>[item.id,{...item}]));
 const categories=[...new Set([...initialItems,...resourceItems,...materialTools05A].map(x=>x.group))];
 const catalog={categories,rarities:[],materials:[],effects:[],items:[...initialItems,...resourceItems,...materialTools05A].map(item=>({
  id:item.id,nameKey:item.name,categoryId:item.group,tags:item.tags??[],capabilities:[]
 }))};
 const built=buildItemRegistry(catalog);
 if(!built.registry)throw new Error('Main inventory registry invalid: '+JSON.stringify(built.issues));
 const registry=built.registry;
 const worldBuilt=buildWorldRegistry(SOMNIUM_WORLD_03A);
 if(!worldBuilt.ok)throw Error('Invalid 03-A world graph');
 const worldRegistry=worldBuilt.registry;
 // 03-D prototype is opt-in to protect legacy fixtures and existing save assumptions.
 // Formal per-world seed, generated snapshot and Delta persistence are 03-E gates.
 let localRegistry=worldRegistry;
 const persistedWorld=options.worldPersistence03E===true;
 const freshSeed=persistedWorld?(options.worldSeed??('somnium-'+crypto.randomUUID())):(options.worldSeed??'somnium-03d-preview-v1');
 const generatedMaps=options.generatedWorld===true?[
  {siteId:'core:site/labyrinth',algorithm:'dungeon',floor:0},
  {siteId:'core:site/labyrinth',algorithm:'cavern',floor:-1},
  {siteId:'core:site/forest',algorithm:'forest',floor:0}
 ].map(({siteId,algorithm,floor})=>generateLocalMap(worldRegistry,{
  id:'core:generator/'+algorithm,version:1,algorithm,width:24,height:24,
  siteId,floor,maxAttempts:4
 },freshSeed).map):[];
 const registryFromMaps=maps=>{
  const definition=structuredClone(worldRegistry.definition);
  definition.maps=definition.maps.map(m=>maps.find(g=>g.id===m.id)??m);
  const built=buildWorldRegistry(definition);
  if(!built.ok)throw Error('Invalid persisted geometry: '+JSON.stringify(built.issues));
  return built.registry;
 };
 if(generatedMaps.length)localRegistry=registryFromMaps(generatedMaps);
 let initialWorld03E=null;
 if(persistedWorld){
  initialWorld03E=createWorldSnapshot03E(createInitialWorldRuntime03A(worldRegistry,freshSeed),worldRegistry);
  for(const map of generatedMaps)initialWorld03E=withGeneratedMap(initialWorld03E,map,worldRegistry);
 }
 const regionToSite=new Map(Array.from(worldRegistry.regions.values(),r=>[r.name,r.siteIds[0]]));
 const siteToRegion=new Map(Array.from(worldRegistry.sites.values(),site=>[site.id,worldRegistry.regions.get(site.regionId)?.name]));
 const localSite=snapshot=>snapshot.world.runtime.localSiteId??'core:site/labyrinth';
 const localPosition=snapshot=>{const [x,y]=snapshot.world.runtime.pos;return {siteId:localSite(snapshot),floor:snapshot.world.runtime.localFloor??0,x,y};};
 const routeAccess=()=>({knownSites:new Set(worldRegistry.sites.keys()),knownHazards:new Set(),allowedRequirements:new Set()});
 const slot={slotId:'main-manual',worldId:'main-world',kind:'manual',label:'메인 UI 저장',savedAt:'2000-01-01T00:00:00Z',revision:0};
 const legacyStore=new IndexedDbSavesV2(registry,'somnium-main-v2');
 const store=new IndexedDbSavesV3(registry,'somnium-main-v3');
 const asV3=()=>{const {schemaVersion,clock,...rest}=structuredClone(state);return {...rest,schemaVersion:3,clock:{elapsedSeconds:clock.elapsedUnits,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}}};
 const asV2=input=>{const {schemaVersion,clock,...rest}=structuredClone(input);return {...rest,schemaVersion:2,clock:{elapsedUnits:clock.elapsedSeconds}}};
 let state={
  schemaVersion:2,turn:0,clock:{elapsedUnits:0},rng:createRandomState('somnium-main-v2'),
  player:{id:'main-player',regionId:'거점 마을',currentHp:100,currentMp:80,hunger:85,statusEffects:[]},
  world:{activeRegionId:'거점 마을',runtime:{region:'거점 마을',pos:[2,2],dungeon:false,localSiteId:null,localFloor:0,day:1,hour:8,travel03B:null,timeBasis:'seconds-v1',...(initialWorld03E?{world03E:initialWorld03E}:{}) ,...(options.resources05A===true?{resource05A:{schema:1,nodes:createResourceNodes05A(),candidateSites:createCandidateSites05A(),compendium:{sourceIds:[],itemIds:[]},...(options.ecology05A===true?{ecologySites:{...createBotanicalEcology05A(),...(options.fungi05B===true?createFungalEcology05B():{})},ecologyClimateSeed:freshSeed,...(options.fungi05B===true?{ecologySubstrates:options.woodland05C===true?createWoodlandSubstrates05C(createSubstrateWorld05B()):createSubstrateWorld05B(),...(options.woodland05C===true?{woodland05C:{trees:createTreeWorld05C(),day:0}}:{})}: {})}: {})}}:{})}},progression:{skillExperience:{},...(options.progression04A===true?{system04A:createProgression(options.attributeAllocation??{})}:{})},flags:{},
  itemWorld:{
   items:initialItems.map(i=>({id:i.id,definitionId:i.id,quantity:i.qty})),
   placements:initialItems.map(i=>({itemId:i.id,location:{kind:'inventory',ownerId:'main-player'}})),
   containers:[]
  }
 };
 const revisions=new Map();
 let actionsSinceAuto=0;
 let autoPolicy=readAutoPolicy(preferences);
 let autosaveError=null;
 let autoQueue=Promise.resolve();
 async function saveInto(kind,slotId,label){
   if(!['manual','quick','auto'].includes(kind)||!slotId||typeof label!=='string')throw Error('Invalid save slot');
   const meta={...slot,slotId,kind,label:label||kind+' 저장',savedAt:new Date().toISOString()};
   if(state.world.runtime.timeBasis!=='seconds-v1')throw Error('구형 시간 데이터는 별도 이전 승인이 필요합니다.');
   const envelope=createSaveV3(asV3(),meta,'main-prototype',registry);
   const expected=revisions.has(slotId)?revisions.get(slotId):null;
   if(expected===null){
    const existing=await store.listSlots();
    const found=existing.find(x=>x.slotId===slotId);
    if(found){
     if(kind==='quick'&&found.status==='valid')revisions.set(slotId,found.revision);
     else throw Error('이미 존재하거나 손상된 슬롯입니다. 덮어쓰지 않고 복구 후보를 확인하세요.');
    }
   }
   const saved=await store.commit(envelope,revisions.has(slotId)?revisions.get(slotId):expected);
   revisions.set(slotId,saved.slot.revision);
   if(kind==='auto')autosaveError=null;
   return saved;
 }
 function enqueueAuto(){
  autoQueue=autoQueue.then(async()=>{
   if(!revisions.has('main-auto')){
    const existing=await store.loadLatest('main-auto');
    if(existing)revisions.set('main-auto',existing.slot.revision);
   }
   await saveInto('auto','main-auto','자동 저장');
  }).catch(error=>{autosaveError=String(error?.message??error);console.warn('Somnium autosave failed:',error)});
 }
 // Travel is simulated in memory and committed in a single v2 action. Encounters
 // interrupt after a completed travel turn. Never advance real time or RNG in UI.
 function simulateJourney(snapshot){
  if(snapshot.world.runtime.timeBasis!=='seconds-v1')throw Error('Legacy abstract clock: explicit migration required');
  let travel=snapshot.world.runtime.travel03B;
  if(!travel?.progress||travel.progress.status!=='moving')throw Error('Travel not active');
  let rng=snapshot.rng,turns=0,units=0,encounter=false,arrival=false;
  const access=routeAccess();
  const total=travel.progress.plan.totalTurns;
  for(let guard=0;guard<total;guard++){
   const step=advanceTravel(travel,worldRegistry,access);
   if(!step.ok)throw Error(step.reason);
   travel=step.state;turns+=step.turns;units+=step.worldUnits;arrival=step.arrived;
   if(travel.position.kind==='site'||arrival){
    const draw=drawRandom(rng,'world');rng=draw.rng;
    // Encounter roll per actual road segment; no item weight effects.
    if(draw.value<0.12){encounter=true;travel=pauseTravel(travel);break}
   }
   if(arrival)break;
  }
  if(!turns)throw Error('No travel progress');
  return {travel,rng,turns,units,encounter,arrival};
 }
 // Deterministic full-clock buckets: one opportunity per complete 600 seconds of
 // qualifying activity, including every crossed boundary in long actions.
 // The same time windows are processed whether actions are split or batched.
 const sideResult=(before,base,kind,elapsed,region)=>{
  if(!Number.isSafeInteger(elapsed)||elapsed<0)throw Error('INVALID_ACTIVITY_TIME');
  if(!incidentalTables05A[region+':'+kind]||elapsed===0)return base;
  const start=before.clock.elapsedUnits,end=start+elapsed;
  if(!Number.isSafeInteger(end))throw Error('INVALID_ACTIVITY_TIME');
  const first=Math.floor(start/INCIDENTAL_ACTIVITY_SECONDS_05A)+1;
  const last=Math.floor(end/INCIDENTAL_ACTIVITY_SECONDS_05A);
  if(last-first+1>100000)throw Error('INCIDENTAL_ACTION_TOO_LONG');
  let next=base.nextState,events=[...base.events];
  for(let bucket=first;bucket<=last;bucket++){
   const at=bucket*INCIDENTAL_ACTIVITY_SECONDS_05A;
   const virtual={...next,clock:{...next.clock,elapsedUnits:at},
    world:{...next.world,runtime:{...next.world.runtime,region}}};
   const extra=handlers.get('resource.incidental.search')(virtual,{payload:{activity:kind}});
   // Restore original action clock; dispatcher is the only clock owner.
   next={...extra.nextState,clock:next.clock};
   events.push(...extra.events);
  }
  return {...base,nextState:next,events};
 };
 const handlers=new Map([
 ['life.activity',(snapshot,command)=>({outcome:'success',nextState:snapshot,events:[{type:'life.activity',payload:{name:command.payload.name}}]})],
 ['world.travel',(snapshot,command)=>{
   const region=command.payload.region;
   if(typeof region!=='string'||!region.trim())throw Error('Invalid region');
   return {outcome:'success',nextState:{...snapshot,player:{...snapshot.player,regionId:region},world:{...snapshot.world,activeRegionId:region,runtime:{...snapshot.world.runtime,region}}},events:[{type:'world.travelled',payload:{region}}]};
 }],
 ['travel.skip',(snapshot)=>{
   const result=simulateJourney(snapshot);
   const region=result.travel.position.kind==='site'?siteToRegion.get(result.travel.position.siteId):null;
   const runtime={...snapshot.world.runtime,travel03B:result.travel,...(region?{region}:{})};
   const base={outcome:'success',nextState:{...snapshot,rng:result.rng,
    world:{...snapshot.world,runtime,activeRegionId:region??snapshot.world.activeRegionId},
    player:{...snapshot.player,regionId:region??snapshot.player.regionId}},
    events:[{type:result.encounter?'world.travel_encounter':result.arrival?'world.travelled':'world.travel_progress',
       payload:{encounter:result.encounter,arrived:result.arrival}}]};
  // Route travel uses the destination region only when actually arrived.
  if(!region)return base;
  return sideResult(snapshot,base,'explore',result.units,region);
 }],
 ['origin.insight',(snapshot,command)=>{
   if(snapshot.world.runtime.dungeon)throw Error('Origin insight is a regional interaction');
   const result=resolveOriginInteraction(snapshot.progression?.origin04B,snapshot.world.runtime.region,command.payload.interactionId,snapshot.flags);
   if(!result.ok)throw Error(result.reason);
   return {outcome:'success',nextState:{...snapshot,flags:{...snapshot.flags,[result.flagKey]:true}},
     events:[{type:'origin.insight_discovered',payload:{id:result.interaction.id,description:result.interaction.description}}]};
 }],
 ['resource.search',(snapshot,command)=>{
  if(snapshot.world.runtime.dungeon||!snapshot.world.runtime.resource05A)throw Error('RESOURCE_UNAVAILABLE');
  const result=discoverResource05A(snapshot.world.runtime.resource05A.nodes,command.payload?.resourceId,
   snapshot.world.runtime.region,snapshot.clock.elapsedUnits);
  if(!result.ok)throw Error(result.reason);
  const def=RESOURCE_MAP_05A.get(command.payload.resourceId);
  return {outcome:'success',nextState:{...snapshot,world:{...snapshot.world,runtime:{...snapshot.world.runtime,resource05A:{
    ...snapshot.world.runtime.resource05A,nodes:result.nodes
  }}}},events:[{type:'resource.site_discovered',payload:{nodeId:result.nodeId,name:def.name,newSite:result.newSite}}]};
 }],
 ['botanical.patch.harvest',(snapshot,command)=>{
  const runtime=snapshot.world.runtime,resources=runtime.resource05A;
  if(runtime.dungeon||!resources?.ecologySites)throw Error('ECOLOGY_UNAVAILABLE');
  const id=command.payload?.siteId,site=resources.ecologySites[id];
  if(!site||!site.discovered||site.region!==runtime.region)throw Error('ECOLOGY_SITE_UNKNOWN');
  const isFungus=FUNGAL_BY_ID_05B.has(site.speciesId);
  const def=isFungus?FUNGAL_ECOLOGY_MAP_05B.get(site.speciesId):BOTANICAL_ECOLOGY_MAP_05A.get(site.speciesId);
  if(!def||def.mode!=='gather')throw Error('ECOLOGY_NOT_HARVESTABLE');
  const second=snapshot.clock.elapsedUnits,day=Math.floor((second+28800)/86400);
  const hour=Math.floor(((second+28800)%86400)/3600);
  const season=['spring','summer','autumn','winter'][Math.floor(day%112/28)];
  const daypart=hour<6?'dawn':hour<18?'day':hour<21?'dusk':'night';
  const weather=runtime.weather05A??(typeof resources.ecologyClimateSeed==='string'?
   ecologyClimate05A(resources.ecologyClimateSeed,runtime.region,second).weather:undefined);
  const draw=drawRandom(snapshot.rng,'action');
  const sharedSubstrate=isFungus&&resources.ecologySubstrates?consumeFungalSubstrate05B(resources.ecologySubstrates,site,second):null;
  if(isFungus&&resources.ecologySubstrates&&!sharedSubstrate.ok)throw Error(sharedSubstrate.reason);
  const outcome=isFungus?fungalHarvest05B(site,def,second,resources.ecologyClimateSeed,draw.value):
   ecologyInteract(site,def,{region:runtime.region,season,daypart,weather,
    mature:true,bloom:def.outputs.some(o=>o.stage==='bloom')},
    {second,roll:draw.value,action:'gather'});
  if(!outcome.ok)throw Error(outcome.reason);
  const item=outcome.outputs[0];
  const inventoryId='ecology05a:'+site.speciesId;
  const original=snapshot.itemWorld.items.find(x=>x.id===inventoryId);
  const itemWorld={...snapshot.itemWorld,
   items:original?snapshot.itemWorld.items.map(x=>x.id===inventoryId?{...x,quantity:x.quantity+item.quantity}:x):
    [...snapshot.itemWorld.items,{id:inventoryId,definitionId:item.itemId,quantity:item.quantity}],
   placements:original?snapshot.itemWorld.placements:
    [...snapshot.itemWorld.placements,{itemId:inventoryId,location:{kind:'inventory',ownerId:snapshot.player.id}}]};
  const resource05A={...resources,
   ...(sharedSubstrate?.ok?{ecologySubstrates:sharedSubstrate.world}:{}),
   ecologySites:{...resources.ecologySites,[site.id]:outcome.site},
   compendium:acquiredCompendium05A(resources.compendium,[{itemId:item.itemId,quantity:item.quantity}])};
  return {outcome:'success',nextState:{...snapshot,rng:draw.rng,itemWorld,
   world:{...snapshot.world,runtime:{...runtime,resource05A}}},
   events:[{type:'botanical.patch_harvested',payload:{siteId:site.id,itemId:item.itemId,part:item.part,quantity:item.quantity}}]};
 }],
 ['botanical.observe',(snapshot,command)=>{
  const runtime=snapshot.world.runtime;
  if(runtime.dungeon||!runtime.resource05A)throw Error('BOTANICAL_UNAVAILABLE');
  const available=eligibleBotanicalObservations05A(runtime.region,snapshot.clock.elapsedUnits,snapshot.flags);
  const species=available.find(p=>p.id===command.payload?.itemId);
  if(!species)throw Error('BOTANICAL_NOT_OBSERVABLE');
  const flag='botany05a:observed:'+species.id;
  return {outcome:'success',nextState:{...snapshot,flags:{...snapshot.flags,[flag]:true}},
   events:[{type:'botanical.observed',payload:{itemId:species.id,name:species.name,region:runtime.region}}]};
 }],
 ['resource.incidental.search',(snapshot,command)=>{
  const runtime=snapshot.world.runtime;
  if(runtime.dungeon||!runtime.resource05A)throw Error('RESOURCE_UNAVAILABLE');
  const kind=command.payload?.activity;
  if(typeof kind!=='string')throw Error('INVALID_ACTIVITY');
  const table=incidentalTables05A[runtime.region+':'+kind];
  if(!table)throw Error('ACTIVITY_NOT_CONFIGURED');
  const a=drawRandom(snapshot.rng,'action'),b=drawRandom(a.rng,'action'),c=drawRandom(b.rng,'action');
  const season=['spring','summer','autumn','winter'][Math.floor((Math.floor((snapshot.clock.elapsedUnits+28800)/86400)%112)/28)];
  const hour=Math.floor(((snapshot.clock.elapsedUnits+28800)%86400)/3600);
  const daypart=hour<6?'dawn':hour<18?'day':hour<21?'dusk':'night';
  const ecoWeather=runtime.weather05A??(typeof runtime.resource05A.ecologyClimateSeed==='string'?ecologyClimate05A(runtime.resource05A.ecologyClimateSeed,runtime.region,snapshot.clock.elapsedUnits).weather:undefined);
  const result=resolveIncidentalActivity05A(table,{
    region:runtime.region,activity:kind,season,daypart,weather:ecoWeather
   },{trigger:a.value,tier:b.value,output:c.value});
  if(!result.ok)throw Error(result.reason);
  let resource05A=runtime.resource05A,itemWorld=snapshot.itemWorld,found=result.found,flags=snapshot.flags;
  const botanical=BOTANICAL_PROFILE_BY_ID_05A.get(result.itemId);
  const fungus=FUNGAL_BY_ID_05B.get(result.itemId);
  let updatedEcoSite=null,updatedSharedSubstrate=null;
  if(found&&botanical){
   if(resource05A.ecologySites){
    const def=BOTANICAL_ECOLOGY_MAP_05A.get(botanical.id);
    const sites=Object.values(resource05A.ecologySites).filter(site=>site.region===runtime.region&&site.speciesId===botanical.id).sort((a,b)=>a.patch-b.patch);
    const available=def?sites.map(site=>ecologyReconcile(site,def,snapshot.clock.elapsedUnits)).filter(site=>site.remaining>0):[];
    if(!available.length)found=false;
    else{
     const site=available[Math.floor(b.value*available.length)];
     const attempt=ecologyInteract(site,def,{
      region:runtime.region,season,daypart,weather:ecoWeather,
      mature:true,bloom:botanical.part==='flower'
     },{second:snapshot.clock.elapsedUnits,roll:c.value,action:'gather'});
     if(!attempt.ok)found=false;
     else updatedEcoSite=attempt.site;
    }
   }else{
    const allowed=botanicalCanHarvest05A(flags,botanical,snapshot.clock.elapsedUnits,ecoWeather);
    if(!allowed.ok)found=false;
   }
  }
  if(found&&fungus){
   if(!resource05A.ecologySites||!resource05A.ecologyClimateSeed)found=false;
   else{
    const def=FUNGAL_ECOLOGY_MAP_05B.get(fungus.id);
    const sites=Object.values(resource05A.ecologySites).filter(site=>site.speciesId===fungus.id&&site.region===runtime.region).sort((a,b)=>a.patch-b.patch);
    const available=sites.map(site=>fungalReconcile05B(site,def,snapshot.clock.elapsedUnits,resource05A.ecologyClimateSeed)).filter(site=>site.remaining>0);
    if(!available.length)found=false;
    else{
     const selected=available[Math.floor(b.value*available.length)];
     const substrate=resource05A.ecologySubstrates?consumeFungalSubstrate05B(resource05A.ecologySubstrates,selected,snapshot.clock.elapsedUnits):null;
     if(substrate&&!substrate.ok)found=false;
     else{
      const outcome=fungalHarvest05B(selected,def,snapshot.clock.elapsedUnits,resource05A.ecologyClimateSeed,c.value);
      if(!outcome.ok)found=false;
      else{updatedEcoSite=outcome.site;updatedSharedSubstrate=substrate?.world??null;}
     }
    }
   }
  }
  let event={type:'resource.incidental_empty',payload:{activity:kind}};
  if(found&&result.rewardMode==='discover-site'){
   const entry=Object.entries(resource05A.candidateSites??{}).sort(([a],[b])=>a.localeCompare(b))
    .find(([,site])=>site.region===runtime.region&&!site.discovered&&
      SOURCE_WORK_RULES_05A[site.sourceId]?.outputs.includes(result.itemId));
   if(entry){
    const [nodeId,site]=entry;
    resource05A={...resource05A,candidateSites:{...resource05A.candidateSites,[nodeId]:{...site,discovered:true}}};
    event={type:'resource.incidental_discovered',payload:{activity:kind,nodeId,itemId:result.itemId}};
   }else found=false;
  }else if(found){
   if(botanical||fungus){
    if(updatedEcoSite)resource05A={...resource05A,
     ...(updatedSharedSubstrate?{ecologySubstrates:updatedSharedSubstrate}:{}),
     ecologySites:{...resource05A.ecologySites,[updatedEcoSite.id]:updatedEcoSite}};
    else if(botanical)flags=botanicalMarkHarvest05A(flags,botanical,snapshot.clock.elapsedUnits);
   }
   const itemId='incidental05a:'+result.itemId;
   const original=itemWorld.items.find(x=>x.id===itemId);
   itemWorld={...itemWorld,
    items:original?itemWorld.items.map(x=>x.id===itemId?{...x,quantity:x.quantity+1}:x):
    [...itemWorld.items,{id:itemId,definitionId:result.itemId,quantity:1}],
    placements:original?itemWorld.placements:
     [...itemWorld.placements,{itemId,location:{kind:'inventory',ownerId:snapshot.player.id}}]};
   resource05A={...resource05A,compendium:acquiredCompendium05A(resource05A.compendium,
    [{itemId:result.itemId,quantity:1}])};
   event={type:'resource.incidental_acquired',payload:{activity:kind,itemId:result.itemId,quantity:1}};
  }
  return {outcome:'success',nextState:{...snapshot,rng:c.rng,itemWorld,flags,
   world:{...snapshot.world,runtime:{...runtime,resource05A}}},
   events:[event]};
 }],
 ['resource.candidate.discover',(snapshot,command)=>{
  const runtime=snapshot.world.runtime,resources=runtime.resource05A;
  if(runtime.dungeon||!resources?.candidateSites)throw Error('CANDIDATE_UNAVAILABLE');
  const result=discoverCandidateSite05A(resources.candidateSites,command.payload?.nodeId,runtime.region);
  if(!result.ok)throw Error(result.reason);
  return {outcome:'success',nextState:{...snapshot,world:{...snapshot.world,runtime:{...runtime,resource05A:{...resources,candidateSites:result.nodes}}}},
   events:[{type:'resource.site_discovered',payload:{nodeId:command.payload.nodeId,name:'신규 자원 지점',newSite:false}}]};
 }],
 ['resource.candidate.prospect',(snapshot,command)=>{
  const runtime=snapshot.world.runtime,resources=runtime.resource05A;
  if(runtime.dungeon||!resources?.candidateSites)throw Error('CANDIDATE_UNAVAILABLE');
  const found=prospectCandidateQuartz05A(resources.candidateSites,runtime.region,snapshot.clock.elapsedUnits);
  if(!found.ok)throw Error(found.reason);
  return {outcome:'success',nextState:{...snapshot,world:{...snapshot.world,runtime:{...runtime,resource05A:{...resources,candidateSites:found.nodes}}}},
    events:[{type:'resource.site_discovered',payload:{nodeId:found.nodeId,name:'수정 광맥',newSite:found.newSite}}]};
 }],
 ['resource.candidate.work',(snapshot,command)=>{
  const runtime=snapshot.world.runtime,resources=runtime.resource05A;
  if(runtime.dungeon||!resources?.candidateSites)throw Error('CANDIDATE_UNAVAILABLE');
  const nodeId=command.payload?.nodeId,site=resources.candidateSites[nodeId];
  const rule=SOURCE_WORK_RULES_05A[site?.sourceId];
  if(!rule)throw Error('UNKNOWN_CANDIDATE');
  const requested=command.payload?.toolId;
  const prefix={mining:'tool05a:pickaxe',logging:'tool05a:axe',gather:'tool05a:gloves'}[rule.activity];
  const owned=snapshot.itemWorld.items.filter(x=>x.quantity>0&&(x.definitionId===prefix||x.definitionId.startsWith(prefix+':'))&&snapshot.itemWorld.placements.some(p=>p.itemId===x.id&&p.location.kind==='inventory'&&p.location.ownerId===snapshot.player.id));
  const selected=requested?owned.find(x=>x.definitionId===requested):owned[0];
  if(requested&&!selected)throw Error('TOOL_NOT_OWNED');
  const rank=selected?(Number(materialTools05A.find(x=>x.id===selected.definitionId)?.tags.find(t=>t.startsWith('rank:'))?.slice(5)??1)):0;
  const outcome=harvestCandidateSite05A(resources.candidateSites,nodeId,runtime.region,rule.activity,{toolRank:rank,seconds:snapshot.clock.elapsedUnits});
  if(!outcome.ok)throw Error(outcome.reason);
  const pool=poolOverrides[site.sourceId];
  let rng=snapshot.rng,rewards=outcome.rewards;
  if(pool){
   const first=drawRandom(rng,'action'),second=drawRandom(first.rng,'action');
   rng=second.rng;
   const season=['spring','summer','autumn','winter'][Math.floor((Math.floor((snapshot.clock.elapsedUnits+28800)/86400)%112)/28)];
   const hour=Math.floor(((snapshot.clock.elapsedUnits+28800)%86400)/3600);
   const daypart=hour<6?'dawn':hour<18?'day':hour<21?'dusk':'night';
   const pick=rollAvailableResourcePool05A(pool,{region:runtime.region,season,daypart,weather:runtime.weather05A},
    {tierRoll:first.value,outputRoll:second.value,mode:command.payload?.poolMode??'eligible-only'});
   if(!pick.ok)throw Error(pick.reason);
   rewards=pick.itemId?[{itemId:pick.itemId,quantity:1,sourceId:site.sourceId,region:runtime.region,traits:[]}]:[];
  }
  let itemWorld=snapshot.itemWorld;
  for(const reward of rewards){
   const itemId='candidate05a:'+reward.itemId,old=itemWorld.items.find(x=>x.id===itemId);
   itemWorld={...itemWorld,items:old?itemWorld.items.map(x=>x.id===itemId?{...x,quantity:x.quantity+reward.quantity}:x):[...itemWorld.items,{id:itemId,definitionId:reward.itemId,quantity:reward.quantity}],
    placements:old?itemWorld.placements:[...itemWorld.placements,{itemId,location:{kind:'inventory',ownerId:snapshot.player.id}}]};
  }
  const compendium=acquiredCompendium05A(resources.compendium,rewards);
  return {outcome:'success',nextState:{...snapshot,rng,itemWorld,world:{...snapshot.world,runtime:{...runtime,resource05A:{...resources,candidateSites:outcome.nodes,compendium}}}},
   events:[{type:'resource.candidate_acquired',payload:{nodeId,rewards}}]};
 }],
 ['resource.work',(snapshot,command)=>{
  if(snapshot.world.runtime.dungeon||!snapshot.world.runtime.resource05A)throw Error('RESOURCE_UNAVAILABLE');
  const nodeId=command.payload?.nodeId;
  const def=RESOURCE_MAP_05A.get(snapshot.world.runtime.resource05A.nodes?.[nodeId]?.resourceId);
  if(!def)throw Error('RESOURCE_NOT_FOUND');
  const toolPrefix={logging:'tool05a:axe',mining:'tool05a:pickaxe',fishing:'tool05a:rod',gather:'tool05a:gloves'}[def.activity];
  const requested=command.payload?.toolId;
  const owned=snapshot.itemWorld.items.filter(x=>x.quantity>0&&(x.definitionId===toolPrefix||x.definitionId.startsWith(toolPrefix+':'))&&
   snapshot.itemWorld.placements.some(p=>p.itemId===x.id&&p.location.kind==='inventory'&&p.location.ownerId===snapshot.player.id));
  const chosen=requested?owned.find(x=>x.definitionId===requested):owned[0];
  if(requested&&!chosen)throw Error('TOOL_NOT_OWNED');
  const baseRank=chosen?.definitionId===toolPrefix?1:0;
  const materialRank=materialTools05A.find(x=>x.id===chosen?.definitionId)?.tags.find(x=>x.startsWith('rank:'));
  const toolRank=chosen?Number(materialRank?.slice(5)??baseRank):0;
  const toolKind=RESOURCE_TOOL_KINDS[def.activity];
  const timer=drawRandom(snapshot.rng,'action');
  const outcome=drawRandom(timer.rng,'action');
  const result=workResource05A(snapshot.world.runtime.resource05A.nodes,nodeId,snapshot.world.runtime.region,snapshot.clock.elapsedUnits,
   {toolKind:chosen?toolKind:null,toolRank,outcomeRoll:outcome.value});
  if(!result.ok)throw Error(result.reason);
  const itemId='gather05a:'+result.resource.id,original=snapshot.itemWorld.items.find(x=>x.id===itemId);
  const itemWorld=result.qty===0?snapshot.itemWorld:{
   ...snapshot.itemWorld,
   items:original?snapshot.itemWorld.items.map(x=>x.id===itemId?{...x,quantity:x.quantity+result.qty}:x):
    [...snapshot.itemWorld.items,{id:itemId,definitionId:result.resource.itemId,quantity:result.qty}],
   placements:original?snapshot.itemWorld.placements:
    [...snapshot.itemWorld.placements,{itemId,location:{kind:'inventory',ownerId:snapshot.player.id}}]
  };
  const prior=snapshot.progression?.system04A;
  const xpSkill={gather:'채집',logging:'벌목',mining:'채광',fishing:'낚시'}[result.activity];
  const progression=prior&&result.xp>0?{...snapshot.progression,system04A:awardProgression(prior,{
    actionId:'05a:'+nodeId+':'+snapshot.turn,skillId:SKILL_DEFINITIONS.find(x=>x.name===xpSkill).id,xp:result.xp
   })}:snapshot.progression;
  const base={outcome:result.qty>0?'success':'failed',nextState:{...snapshot,rng:outcome.rng,itemWorld,progression,
   world:{...snapshot.world,runtime:{...snapshot.world.runtime,resource05A:{
    ...snapshot.world.runtime.resource05A,
    ...(snapshot.world.runtime.resource05A.ecologySubstrates&&result.qty>0?{
     ecologySubstrates:addLoggingDeadwood05B(snapshot.world.runtime.resource05A.ecologySubstrates,
      snapshot.world.runtime.region,result.resource.itemId,result.qty,snapshot.clock.elapsedUnits)}:{}),
    nodes:{...snapshot.world.runtime.resource05A.nodes,[nodeId]:result.node}
   }}}},
   events:[{type:'resource.work_done',payload:{resourceId:result.resource.id,name:result.resource.name,
    activity:result.activity,qty:result.qty,xp:result.xp,progress:result.node.progress}}]};
  // The timer roll was already used by dispatcher to determine work duration.
  const spent=workDuration05A(def.activity,timer.value);
  return sideResult(snapshot,base,result.activity,spent,snapshot.world.runtime.region);
 }],
 ['region.activity',(snapshot,command)=>{
   if(snapshot.world.runtime.dungeon)throw Error('Cannot start a regional activity during dungeon exploration');
   const result=activityPreview(snapshot.world.runtime.region,command.payload.activityId,snapshot.progression?.system04A?Object.fromEntries(SKILL_DEFINITIONS.map(def=>[def.name,skillLevel(snapshot.progression.system04A.skills[def.id])])):snapshot.progression?.skillExperience??{});
   if(!result.ok)throw Error(result.reason);
   const event={type:'region.activity_performed',payload:{activityId:command.payload.activityId,activityKind:result.kind,encounterEligible:result.encounterEligible,combatStarted:false}};
   return sideResult(snapshot,{outcome:'success',nextState:snapshot,events:[event]},
    result.kind,actionSeconds('region.activity'),snapshot.world.runtime.region);
 }],
 ['dungeon.enter',(snapshot,command)=>{const target=command.payload.siteId??'core:site/labyrinth';if(!['core:site/labyrinth','core:site/forest'].includes(target))throw Error('Invalid local site');if(target==='core:site/forest'&&snapshot.world.runtime.region!=='숲')throw Error('Forest region required');const entry=localArrival(localRegistry,target);return {outcome:'success',nextState:{...snapshot,world:{...snapshot.world,runtime:{...snapshot.world.runtime,dungeon:true,localSiteId:entry.siteId,localFloor:entry.floor,pos:[entry.x,entry.y]}}},events:[{type:'dungeon.entered',payload:{}}]};}],
 ['dungeon.leave',(snapshot)=>({outcome:'success',nextState:{...snapshot,world:{...snapshot.world,runtime:{...snapshot.world.runtime,dungeon:false,localFloor:0}}},events:[{type:'dungeon.left',payload:{}}]})],
 ['dungeon.portal',(snapshot)=>{
   if(!snapshot.world.runtime.dungeon)throw Error('Not exploring');
   const [x,y]=snapshot.world.runtime.pos;
   const target=localPortal(localRegistry,localPosition(snapshot));
   if(!target)throw Error('No linked portal');
   return {outcome:'success',nextState:{...snapshot,world:{...snapshot.world,runtime:{...snapshot.world.runtime,localFloor:target.floor,pos:[target.x,target.y]}}},events:[{type:'dungeon.portal_used',payload:{floor:target.floor}}]};
 }],
 ['dungeon.move',(snapshot,command)=>{
   const direction=command.payload.direction;
   if(!snapshot.world.runtime.dungeon||typeof direction!=='string'||!['north','south','east','west'].includes(direction))throw Error('Invalid local action');
   const [x,y]=snapshot.world.runtime.pos;
   const step=resolveLocalStep(localRegistry,localPosition(snapshot),direction);
   if(step.status==='invalid')throw Error('Invalid local position');
   if(step.status==='hazard')throw Error('Known hazard requires explicit handling');
   if(step.status==='blocked')return {outcome:'failed',nextState:snapshot,events:[{type:'dungeon.blocked',payload:{direction}}]};
   return {outcome:'success',nextState:{...snapshot,world:{...snapshot.world,runtime:{...snapshot.world.runtime,pos:[step.location.x,step.location.y]}}},events:[{type:'dungeon.moved',payload:{to:[step.location.x,step.location.y]}}]};

 }]
 ]);
 const dispatcher=new V2ActionDispatcher(registry,handlers,(current,action)=>{
  if(action.type==='travel.skip'){
   const result=simulateJourney(current);
   return {turns:result.turns,worldUnits:result.units};
  }
    if(action.type==='botanical.patch.harvest')return {turns:1,worldUnits:60};
    if(action.type==='botanical.observe')return {turns:1,worldUnits:600};
    if(action.type==='resource.incidental.search')return {turns:1,worldUnits:INCIDENTAL_ACTIVITY_SECONDS_05A};
    if(action.type==='resource.candidate.prospect')return {turns:1,worldUnits:600};
    if(action.type==='resource.candidate.discover')return {turns:1,worldUnits:600};
    if(action.type==='resource.candidate.work')return {turns:1,worldUnits:60};
    if(action.type==='resource.search')return {turns:1,worldUnits:600};
    if(action.type==='resource.work'){
     const node=current.world.runtime.resource05A?.nodes?.[action.payload?.nodeId];
     const def=RESOURCE_MAP_05A.get(node?.resourceId);
     if(!def)throw Error('Unknown resource duration');
     return {turns:1,worldUnits:workDuration05A(def.activity,drawRandom(current.rng,'action').value)};
    }
    if(action.type==='origin.insight')return {turns:1,worldUnits:60};
    if(action.type==='dungeon.portal')return {turns:1,worldUnits:6};
    if(action.type==='dungeon.move'){
     const [x,y]=current.world.runtime.pos;
     const step=resolveLocalStep(localRegistry,localPosition(current),action.payload.direction);
     if(step.status==='invalid'||step.status==='hazard')throw Error('Invalid local duration');
     return {turns:1,worldUnits:step.elapsedSeconds};
    }
    return {turns:1,worldUnits:actionSeconds(action.type)};
 });
 const projected=()=>state.itemWorld.items
  .filter(item=>state.itemWorld.placements.some(p=>p.itemId===item.id&&p.location.kind==='inventory'&&p.location.ownerId===state.player.id))
  .map(item=>({...templates.get(item.definitionId),id:item.id,qty:item.quantity}));
 const current=()=>structuredClone(state);
 const validateLocalPosition=(reg,p)=>{const map=[...reg.maps.values()].find(m=>m.siteId===p.siteId&&m.floor===p.floor);return !!map&&p.x>=0&&p.y>=0&&p.x<map.width&&p.y<map.height&&!!reg.terrains.get(map.tiles[p.y]?.split(' ')[p.x])?.traversable};
 const replace=(candidate,expectedRevision=null)=>{
  const checked=candidate?.saveVersion===3?decodeSaveV3(candidate,registry):prepareV2Load(candidate,registry);
  if(!checked.ok)throw new Error(checked.reason);
  const loaded=candidate?.saveVersion===3?asV2(checked.save.state):checked.state;
  const travel=loaded.world?.runtime?.travel03B;
  if(travel!==undefined&&travel!==null&&!validateTravelState(travel,worldRegistry))throw new Error('Invalid 03-B travel state');
  if(candidate?.saveVersion!==3)throw Error('v2는 승인형 이전 후에만 적용 가능합니다.');
  // Stage validation before touching live state or map registry.
  const origin=loaded.progression?.origin04B;
  if(origin!==undefined&&!validateOrigin(origin))throw Error('Invalid 04-B origin payload');
  const newProgress=loaded.progression?.system04A;
  if(newProgress!==undefined&&!validateProgression(newProgress))throw Error('Invalid 04-A progression payload');
  const candidateWorld=loaded.world?.runtime?.world03E;
  if(options.generatedWorld===true&&persistedWorld&&!candidateWorld&&loaded.world.runtime.dungeon)
   throw Error('이전 생성형 던전 저장에는 지형 스냅샷이 없습니다. 원본 슬롯을 유지하고 별도 이전 절차가 필요합니다.');
  const legacyMaps=options.generatedWorld===true&&persistedWorld?[
   {siteId:'core:site/labyrinth',algorithm:'dungeon',floor:0},
   {siteId:'core:site/labyrinth',algorithm:'cavern',floor:-1},
   {siteId:'core:site/forest',algorithm:'forest',floor:0}
  ].map(({siteId,algorithm,floor})=>generateLocalMap(worldRegistry,{
   id:'core:generator/'+algorithm,version:1,algorithm,width:24,height:24,
   siteId,floor,maxAttempts:4
  },'somnium-03d-preview-v1').map):generatedMaps;
  let checkedRegistry=options.generatedWorld===true?registryFromMaps(legacyMaps):worldRegistry;
  if(candidateWorld){
   const restored=restoreWorldSnapshot03E(candidateWorld,worldRegistry);
   checkedRegistry=registryFromMaps(Object.values(restored.generatedMaps));
   const pos=loaded.world.runtime.pos;
   const siteId=loaded.world.runtime.localSiteId??'core:site/labyrinth';
   if(loaded.world.runtime.dungeon&&!validateLocalPosition(checkedRegistry,{siteId,floor:loaded.world.runtime.localFloor??0,x:pos[0],y:pos[1]}))
    throw Error('Saved local position not traversable in recorded world');
  }
  state=structuredClone(loaded);
  localRegistry=checkedRegistry;
  if(expectedRevision!==null&&candidate?.slot?.slotId)revisions.set(candidate.slot.slotId,expectedRevision);
 };
 return {
  registry,projected,current,
  skillLevels(){const p=state.progression?.system04A;return p&&validateProgression(p)?Object.fromEntries(SKILL_DEFINITIONS.map(def=>[def.name,skillLevel(p.skills[def.id])])):null;},
  progression04A(){return state.progression?.system04A?structuredClone(state.progression.system04A):null;},
  resources05A(){if(!state.world.runtime.resource05A)return null;
   const r=structuredClone(state.world.runtime.resource05A);
   if(r.candidateSites)for(const [id,site] of Object.entries(r.candidateSites))r.candidateSites[id]=reconcileCandidateSite05A(site,state.clock.elapsedUnits);
   return r;
  },
  availableTools05A(activity){
   const prefix={gather:'tool05a:gloves',logging:'tool05a:axe',mining:'tool05a:pickaxe',fishing:'tool05a:rod'}[activity];
   if(!prefix)return [];
   return state.itemWorld.items.filter(x=>x.quantity>0&&(x.definitionId===prefix||x.definitionId.startsWith(prefix+':'))&&
    state.itemWorld.placements.some(p=>p.itemId===x.id&&p.location.kind==='inventory'&&p.location.ownerId===state.player.id))
    .map(x=>({id:x.definitionId,name:templates.get(x.definitionId)?.name??x.definitionId}));
  },
  workUntil05A(nodeId,maxAttempts=50,toolId=null){
   if(!Number.isSafeInteger(maxAttempts)||maxAttempts<1||maxAttempts>50)return {accepted:false,reason:'INVALID_COUNT'};
   let actions=0,qty=0,xp=0,seconds=0,last=null;
   for(;actions<maxAttempts;actions++){
    const before=state.clock.elapsedUnits;
    const result=this.dispatch('resource.work',{nodeId,...(toolId?{toolId}:{})});
    if(!result.accepted){last=result;break;}
    seconds+=state.clock.elapsedUnits-before;
    for(const event of result.events)if(event.type==='resource.work_done'){
     qty+=event.payload.qty;xp+=event.payload.xp;
    }
    if(qty>0){actions++;break;}
   }
   return {accepted:actions>0,actions,qty,xp,seconds,last};
  },
  origin04B(){return state.progression?.origin04B?structuredClone(state.progression.origin04B):null;},
  chooseOrigin04B(speciesId,backgroundId){
   if(!state.progression?.system04A)throw Error('04-B origin requires a new progression character');
   if(state.turn!==0||state.progression.origin04B||state.progression.system04A.awards.length||revisions.size)throw Error('Origin selection is locked');
   const origin=createOrigin(speciesId,backgroundId);
   const progressed=applyOriginToProgression(state.progression.system04A,origin);
   state={...state,progression:{...state.progression,origin04B:origin,system04A:progressed}};
   return structuredClone(origin);
  },
  setInitialAttributes(allocation){
   if(!state.progression?.system04A)throw Error('No 04-A progression on legacy save');
   if(state.turn!==0||state.progression.system04A.awards.length||revisions.size)throw Error('Creation attributes are locked after play or saving');
   const next=createProgression(allocation);
   const combined=state.progression.origin04B?applyOriginToProgression(next,state.progression.origin04B):next;
   state={...state,progression:{...state.progression,system04A:combined}};
   return structuredClone(next);
  },
  localSite(){return localSite(state);},
  rememberedCells(){const snapshot=state.world.runtime.world03E;const map=[...localRegistry.maps.values()].find(m=>m.siteId===localSite(state)&&m.floor===(state.world.runtime.localFloor??0));return snapshot?.world?.seenCells?.[map?.id]??[];},
  localMap(){return structuredClone([...localRegistry.maps.values()].find(m=>m.siteId===localSite(state)&&m.floor===(state.world.runtime.localFloor??0)));},
  localView(remembered=[]){const [x,y]=state.world.runtime.pos;return localVisibility(localRegistry,localPosition(state),remembered);},
  localFloor(){return state.world.runtime.localFloor??0;},
  localPortal(){const [x,y]=state.world.runtime.pos;return localPortal(localRegistry,localPosition(state));},
  localRoute(goal,known){const [x,y]=state.world.runtime.pos;return safeLocalRoute(localRegistry,localPosition(state),{siteId:localSite(state),floor:state.world.runtime.localFloor??0,x:goal[0],y:goal[1]},new Set(known));},
  dispatch(type,payload={}){
    const result=dispatcher.dispatch(state,{type,actorId:state.player.id,payload});
    if(result.accepted){
     state=result.nextState;
     const eco=state.world.runtime.resource05A;
     if(eco?.woodland05C&&eco.ecologySubstrates&&eco.ecologySites){
      const cycle=advanceWoodland05C({trees:eco.woodland05C.trees,day:eco.woodland05C.day,
       substrates:eco.ecologySubstrates,sites:eco.ecologySites},state.clock.elapsedUnits,eco.ecologyClimateSeed);
      if(cycle.day!==eco.woodland05C.day){
       state={...state,world:{...state.world,runtime:{...state.world.runtime,
        resource05A:{...eco,woodland05C:{trees:cycle.trees,day:cycle.day},
         ecologySubstrates:cycle.substrates,ecologySites:cycle.sites}}}};
      }
     }
     if(state.world.runtime.dungeon&&state.world.runtime.world03E&&['dungeon.enter','dungeon.move','dungeon.portal'].includes(type)){
      const position=localPosition(state);
      const old=state.world.runtime.world03E;
      const located=recordWorldLocation(old,position,worldRegistry);
      const map=[...localRegistry.maps.values()].find(m=>m.siteId===position.siteId&&m.floor===position.floor);
      const previous=located.world.seenCells[map.id]??[];
      const visible=localVisibility(localRegistry,position,previous).visible;
      const recorded=recordWorldSight(located,map.id,visible,worldRegistry);
      const discoveries=(recorded.world.seenCells[map.id]??[]).length-(old.world.seenCells[map.id]??[]).length;
      state={...state,world:{...state.world,runtime:{...state.world.runtime,world03E:recorded}}};
      if(discoveries>0&&state.progression?.system04A){
       // Only newly revealed, verified world tiles award exploration XP.
       // Prototype ratio: 1 XP/new cell; repeated visits and wall bumps grant none.
       const next=awardProgression(state.progression.system04A,{actionId:'discovery:'+map.id+':'+state.turn,skillId:SKILL_DEFINITIONS.find(d=>d.name==='탐색').id,xp:discoveries});
       state={...state,progression:{...state.progression,system04A:next}};
      }
     }
     actionsSinceAuto++;
     if(shouldAutoSave(actionsSinceAuto,result.events,autoPolicy)){actionsSinceAuto=0;enqueueAuto()}
    }
    return result;
  },
  gameTime(){return state.world.runtime.timeBasis==='seconds-v1'?gameClockAt(state.clock.elapsedUnits):null},
  formatTravelSeconds(seconds){return formatTravelSeconds(seconds)},
  worldRegions(){return worldRegistry.definition.regions.map(r=>({id:r.id,name:r.name,siteId:r.siteIds[0],worldPoint:r.worldPoint}))},
  routePreview(region,policy='fast'){
   if(state.world.runtime.timeBasis!=='seconds-v1')return {ok:false,reason:'LEGACY_TIME_MIGRATION_REQUIRED'};
   const to=regionToSite.get(region),current=state.world.runtime.travel03B;
   if(!to)return {ok:false,reason:'UNKNOWN_SITE'};
   if(current?.progress)return {ok:false,reason:'TRAVEL_IN_PROGRESS'};
   const from=current?.position.kind==='site'?current.position.siteId:regionToSite.get(state.world.runtime.region);
   if(!from)return {ok:false,reason:'UNKNOWN_SITE'};
   return planTravel(worldRegistry,from,to,policy,routeAccess());
  },
  travelState(){return structuredClone(state.world.runtime.travel03B)},
  travelBegin(plan){
   if(state.world.runtime.timeBasis!=='seconds-v1')return false;
   if(state.world.runtime.travel03B?.progress)return false;
   const checked=planTravel(worldRegistry,plan.originSiteId,plan.destinationSiteId,plan.routingPolicy,routeAccess());
   if(!checked.ok||JSON.stringify(checked.plan)!==JSON.stringify(plan))return false;
   state={...state,world:{...state.world,runtime:{...state.world.runtime,travel03B:beginTravel(plan)}}};return true;
  },
  travelPause(){const current=state.world.runtime.travel03B;if(!current)return false;
   state={...state,world:{...state.world,runtime:{...state.world.runtime,travel03B:pauseTravel(current)}}};return true},
  travelResume(){if(state.world.runtime.timeBasis!=='seconds-v1')return false;const current=state.world.runtime.travel03B;if(!current?.progress||!validateTravelState(current,worldRegistry))return false;
   state={...state,world:{...state.world,runtime:{...state.world.runtime,travel03B:resumeTravel(current)}}};return true},
  travelCancel(){const current=state.world.runtime.travel03B;if(!current?.progress)return false;
   try{const next=cancelTravel(current);state={...state,world:{...state.world,runtime:{...state.world.runtime,travel03B:next}}};return true}catch{return false}},
  travelSkip(){if(state.world.runtime.timeBasis!=='seconds-v1')return {accepted:false,reason:'INVALID_COMMAND',turnsSpent:0};return this.dispatch('travel.skip')},
  prepareDiscard(selections){return prepareBulkDiscard(state,selections,registry)},
  confirmDiscard(preview){
   const outcome=confirmBulkDiscard(state,preview,registry);
   if(!outcome.accepted)throw new Error(outcome.reason);
   state=outcome.nextState;return outcome;
  },
  syncVitals({hp,mp,hunger}){
   if(![hp,mp,hunger].every(Number.isFinite))return;
   state={...state,player:{...state.player,currentHp:hp,currentMp:mp,hunger}};
  },
  /** Per-save game-facing journal, not display preferences. Never store arbitrary UI objects. */
  captureCheckpoint(ui){
   if(!ui||!Array.isArray(ui.logs)||ui.logs.length>500)throw Error('Invalid journal');
   const logs=ui.logs.map(x=>{
    if(!x||typeof x.kind!=='string'||typeof x.text!=='string'||x.kind.length>80||x.text.length>1200)throw Error('Invalid journal entry');
    return {kind:x.kind,text:x.text,detail:typeof x.detail==='string'?x.detail.slice(0,3000):'',turn:Number.isSafeInteger(x.turn)?x.turn:state.turn,count:Number.isSafeInteger(x.count)&&x.count>0?x.count:1};
   });
   const journal={logs,visitedRegions:Array.isArray(ui.visitedRegions)?ui.visitedRegions.filter(x=>typeof x==='string').slice(0,100):[]};
   state={...state,world:{...state.world,runtime:{...state.world.runtime,journal}}};
  },
  checkpoint(){return structuredClone(state.world.runtime?.journal??{logs:[],visitedRegions:[]})},
  configureAutosave(policy){
   if(!validateAutoPolicy(policy))throw Error('Invalid autosave policy');
   writeAutoPolicy(preferences,policy);
   autoPolicy={everyActions:policy.everyActions,eventTypes:[...policy.eventTypes]};
  },
  getAutosavePolicy(){return structuredClone(autoPolicy)},
  getAutosaveError(){return autosaveError},
  async flushAutosave(){await autoQueue},
  async save(kind='quick',slotId=kind==='quick'?'main-manual':kind==='auto'?'main-auto':'manual-'+crypto.randomUUID(),label=''){
   return saveInto(kind,slotId,label);
  },
  async listSlots(){const modern=await store.listSlots();const legacy=await legacyStore.listSlots();return [...modern.map(x=>({...x,source:'v3'})),...legacy.map(x=>({...x,source:'v2'}))]},
  async loadCandidate(slotId='main-manual',source='v3'){
   const found=await (source==='v2'?legacyStore:store).loadLatest(slotId);
   if(!found)throw new Error('저장된 슬롯이 없습니다.');
   return found;
  },
  async recoveryCandidates(slotId='main-manual',source='v3'){return (source==='v2'?legacyStore:store).listRevisions(slotId)},
  async migrateLegacyCandidate(candidate,approvedReset){
   if(candidate?.saveVersion!==2)throw Error('v2 저장만 이전할 수 있습니다.');
   const converted=candidate.state?.world?.runtime?.timeBasis==='seconds-v1'
    ?prepareSecondsV2ToV3(candidate,registry)
    :prepareV2ToV3Migration(candidate,registry,approvedReset);
   if(!converted.ok)throw Error('시간 이전 불가: '+converted.reason);
   const newSlot={...candidate.slot,slotId:'migrated-'+crypto.randomUUID(),label:'v3 이전: '+candidate.slot.label,revision:0,savedAt:new Date().toISOString(),kind:'manual'};
   const proposed=createSaveV3(converted.state,newSlot,candidate.contentVersion,registry);
   return store.commit(proposed,null);
  },
  applyApprovedSave(candidate){
   replace(candidate,candidate.slot?.revision??null);
  },
  async exportCandidate(slotId,source='v3'){
   const found=await (source==='v2'?legacyStore:store).loadLatest(slotId);
   if(!found)throw Error('저장된 슬롯이 없습니다.');
   return found;
  },
  clearRevision(){revisions.clear()}
 };
}
