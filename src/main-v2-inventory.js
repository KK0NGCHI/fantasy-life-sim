import {buildItemRegistry,createRandomState,prepareBulkDiscard,confirmBulkDiscard,createSaveV2,prepareV2Load,IndexedDbSavesV2} from '../dist/engine/v2.js';

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
  player:{id:'main-player',regionId:'main-region',currentHp:100,currentMp:80,hunger:85,statusEffects:[]},
  world:{activeRegionId:'main-region'},progression:{skillExperience:{}},flags:{},
  itemWorld:{
   items:uiItems.map(i=>({id:i.id,definitionId:i.id,quantity:i.qty})),
   placements:uiItems.map(i=>({itemId:i.id,location:{kind:'inventory',ownerId:'main-player'}})),
   containers:[]
  }
 };
 let revision=null;
 const projected=()=>state.itemWorld.items
  .filter(item=>state.itemWorld.placements.some(p=>p.itemId===item.id&&p.location.kind==='inventory'&&p.location.ownerId===state.player.id))
  .map(item=>({...templates.get(item.definitionId),id:item.id,qty:item.quantity}));
 const current=()=>structuredClone(state);
 const replace=(candidate,expectedRevision=null)=>{
  const checked=prepareV2Load(candidate,registry);
  if(!checked.ok)throw new Error(checked.reason);
  state=structuredClone(checked.state);revision=expectedRevision;
 };
 return {
  registry,projected,current,
  prepareDiscard(selections){return prepareBulkDiscard(state,selections,registry)},
  confirmDiscard(preview){
   const outcome=confirmBulkDiscard(state,preview,registry);
   if(!outcome.accepted)throw new Error(outcome.reason);
   state=outcome.nextState;return outcome;
  },
  syncVitals({turn,hp,mp,hunger}){
   if(!Number.isSafeInteger(turn)||turn<0)return;
   state={...state,turn,player:{...state.player,currentHp:hp,currentMp:mp,hunger}};
  },
  async save(){
   const envelope=createSaveV2(state,{...slot,savedAt:new Date().toISOString()},'main-prototype',registry);
   const saved=await store.commit(envelope,revision);
   revision=saved.slot.revision;return saved;
  },
  async loadCandidate(){
   const found=await store.loadLatest(slot.slotId);
   if(!found)throw new Error('저장된 메인 v2 슬롯이 없습니다.');
   return found;
  },
  async recoveryCandidates(){return store.listRevisions(slot.slotId)},
  applyApprovedSave(candidate){
   replace(candidate,candidate.slot?.slotId===slot.slotId?candidate.slot.revision:null);
  },
  clearRevision(){revision=null}
 };
}
