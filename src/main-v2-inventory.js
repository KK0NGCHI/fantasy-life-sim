import {buildItemRegistry,createRandomState,V2ActionDispatcher,prepareBulkDiscard,confirmBulkDiscard,createSaveV2,prepareV2Load,IndexedDbSavesV2} from '../dist/engine/v2.js';

/** Bridge for the existing main UI fixture. Game item identity, quantity and ownership live in v2.
 * Legacy UI labels/categories remain presentation-only and are never silently migrated from localStorage.
 */
export function createMainV2Inventory(uiItems) {
 const templates=new Map(uiItems.map(item=>[item.id,{...item}]));
 const categories=[...new Set(uiItems.map(x=>x.group))];
 const catalog={categories,rarities:[],materials:[],effects:[],items:uiItems.map(item=>({
  id:item.id,nameKey:item.name,categoryId:item.group,tags:item.tags??[],capabilities:[]
 }))};
 const built=buildItemRegistry(catalog);
 if(!built.registry)throw new Error('Main inventory registry invalid: '+JSON.stringify(built.issues));
 const registry=built.registry;
 const slot={slotId:'main-manual',worldId:'main-world',kind:'manual',label:'메인 UI 저장',savedAt:'2000-01-01T00:00:00Z',revision:0};
 const store=new IndexedDbSavesV2(registry,'somnium-main-v2');
 let state={
  schemaVersion:2,turn:0,clock:{elapsedUnits:0},rng:createRandomState('somnium-main-v2'),
  player:{id:'main-player',regionId:'거점 마을',currentHp:100,currentMp:80,hunger:85,statusEffects:[]},
  world:{activeRegionId:'거점 마을',runtime:{region:'거점 마을',pos:[2,2],dungeon:false,day:1,hour:8}},progression:{skillExperience:{}},flags:{},
  itemWorld:{
   items:uiItems.map(i=>({id:i.id,definitionId:i.id,quantity:i.qty})),
   placements:uiItems.map(i=>({itemId:i.id,location:{kind:'inventory',ownerId:'main-player'}})),
   containers:[]
  }
 };
 const revisions=new Map();
 const handlers=new Map([
 ['life.activity',(snapshot,command)=>({outcome:'success',nextState:snapshot,events:[{type:'life.activity',payload:{name:command.payload.name}}]})],
 ['world.travel',(snapshot,command)=>{
   const region=command.payload.region;
   if(typeof region!=='string'||!region.trim())throw Error('Invalid region');
   return {outcome:'success',nextState:{...snapshot,player:{...snapshot.player,regionId:region},world:{...snapshot.world,activeRegionId:region,runtime:{...snapshot.world.runtime,region}}},events:[{type:'world.travelled',payload:{region}}]};
 }],
 ['dungeon.enter',(snapshot)=>({outcome:'success',nextState:{...snapshot,world:{...snapshot.world,runtime:{...snapshot.world.runtime,dungeon:true,pos:[2,2]}}},events:[{type:'dungeon.entered',payload:{}}]})],
 ['dungeon.leave',(snapshot)=>({outcome:'success',nextState:{...snapshot,world:{...snapshot.world,runtime:{...snapshot.world.runtime,dungeon:false}}},events:[{type:'dungeon.left',payload:{}}]})],
 ['dungeon.move',(snapshot,command)=>{
   const to=command.payload.to;
   if(!Array.isArray(to)||to.length!==2||!to.every(Number.isSafeInteger))throw Error('Invalid tile');
   return {outcome:'success',nextState:{...snapshot,world:{...snapshot.world,runtime:{...snapshot.world.runtime,pos:[...to]}}},events:[{type:'dungeon.moved',payload:{to}}]};
 }]
 ]);
 const dispatcher=new V2ActionDispatcher(registry,handlers);
 const projected=()=>state.itemWorld.items
  .filter(item=>state.itemWorld.placements.some(p=>p.itemId===item.id&&p.location.kind==='inventory'&&p.location.ownerId===state.player.id))
  .map(item=>({...templates.get(item.definitionId),id:item.id,qty:item.quantity}));
 const current=()=>structuredClone(state);
 const replace=(candidate,expectedRevision=null)=>{
  const checked=prepareV2Load(candidate,registry);
  if(!checked.ok)throw new Error(checked.reason);
  state=structuredClone(checked.state);
  if(expectedRevision!==null&&candidate?.slot?.slotId)revisions.set(candidate.slot.slotId,expectedRevision);
 };
 return {
  registry,projected,current,
  dispatch(type,payload={}){
    const result=dispatcher.dispatch(state,{type,actorId:state.player.id,payload});
    if(result.accepted)state=result.nextState;
    return result;
  },
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
  async save(kind='quick',slotId=kind==='quick'?'main-manual':kind==='auto'?'main-auto':'manual-'+crypto.randomUUID(),label=''){
   if(!['manual','quick','auto'].includes(kind)||!slotId||typeof label!=='string')throw Error('Invalid save slot');
   const meta={...slot,slotId,kind,label:label||kind+' 저장',savedAt:new Date().toISOString()};
   const envelope=createSaveV2(state,meta,'main-prototype',registry);
   let expected=revisions.has(slotId)?revisions.get(slotId):null;
   if(expected===null){
    const existing=await store.listSlots();
    const found=existing.find(x=>x.slotId===slotId);
    if(found)throw Error('이미 존재하는 슬롯입니다. 슬롯을 불러오거나 새 이름으로 저장하세요.');
   }
   const saved=await store.commit(envelope,expected);
   revisions.set(slotId,saved.slot.revision);return saved;
  },
  async listSlots(){return store.listSlots()},
  async loadCandidate(slotId='main-manual'){
   const found=await store.loadLatest(slotId);
   if(!found)throw new Error('저장된 슬롯이 없습니다.');
   return found;
  },
  async recoveryCandidates(slotId='main-manual'){return store.listRevisions(slotId)},
  applyApprovedSave(candidate){
   replace(candidate,candidate.slot?.revision??null);
  },
  async exportCandidate(slotId){
   const found=await store.loadLatest(slotId);
   if(!found)throw Error('저장된 슬롯이 없습니다.');
   return found;
  },
  clearRevision(){revisions.clear()}
 };
}
