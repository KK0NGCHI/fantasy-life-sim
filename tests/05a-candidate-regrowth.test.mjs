import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCandidateSites05A,discoverCandidateSite05A,harvestCandidateSite05A,reconcileCandidateSite05A,prospectCandidateQuartz05A} from '../src/resource-sites-05a.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const DAY=86400,opts={worldSeed:'05a-regen',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,preferences:{getItem:()=>null,setItem:()=>{}}};
const make=()=>createMainV2Inventory([{id:'test:base',name:'시험',group:'재료',qty:1,tags:[]}],opts);
const slot={slotId:'regen-test',worldId:'world',kind:'manual',label:'test',savedAt:'2026-10-24T00:00:00Z',revision:0};
test('candidate partial recovery, cap and season dormancy are time-deterministic',()=>{
 const id='site05a:blueberry:숲';
 let sites=discoverCandidateSite05A(createCandidateSites05A(),id,'숲').nodes;
 for(let t=0;t<4;t++)sites=harvestCandidateSite05A(sites,id,'숲','gather',{seconds:t*60}).nodes;
 const empty=sites[id];
 assert.equal(empty.remaining,0);
 const one=reconcileCandidateSite05A(empty,DAY+180);
 assert.equal(one.remaining,2);
 assert.equal(reconcileCandidateSite05A(empty,3*DAY+180).remaining,4);
 assert.deepEqual(reconcileCandidateSite05A(empty,3*DAY+180),reconcileCandidateSite05A(reconcileCandidateSite05A(empty,DAY+180),3*DAY+180));
 const winterStart=84*DAY-28800;
 const winter={...empty,lastSecond:winterStart,remaining:0,recoveryProgress:0};
 assert.equal(reconcileCandidateSite05A(winter,112*DAY-28800).remaining,0);
 assert.equal(reconcileCandidateSite05A(winter,112*DAY-28800+DAY).remaining,2);
});
test('new quartz vein is gated by exploration conditions not lifetime count',()=>{
 let sites=createCandidateSites05A(),id='site05a:quartz:광산';
 sites=discoverCandidateSite05A(sites,id,'광산').nodes;
 assert.equal(prospectCandidateQuartz05A(sites,'광산',0).reason,'VEIN_REMAINS');
 for(let n=0;n<3;n++)sites=harvestCandidateSite05A(sites,id,'광산','mining',{toolRank:1,seconds:n*60}).nodes;
 const reveal=prospectCandidateQuartz05A(sites,'광산',DAY-1);
 assert.equal(reveal.ok,true);assert.equal(reveal.newSite,false);
 sites=reveal.nodes;
 const second=reveal.nodeId;
 for(let n=0;n<3;n++)sites=harvestCandidateSite05A(sites,second,'광산','mining',{toolRank:1,seconds:1000+n*60}).nodes;
 assert.equal(prospectCandidateQuartz05A(sites,'광산',DAY-1).reason,'PROSPECT_COOLDOWN');
 const newSite=prospectCandidateQuartz05A(sites,'광산',DAY);
 assert.equal(newSite.ok,true);assert.equal(newSite.newSite,true);assert.notEqual(newSite.nodeId,id);
 assert.equal(prospectCandidateQuartz05A(newSite.nodes,'광산',DAY).reason,'VEIN_REMAINS');
});
test('candidate clock and compendium survive v3 save roundtrip, legacy candidate fields remain optional',()=>{
 const g=make(),id='site05a:blueberry:숲';
 g.dispatch('world.travel',{region:'숲'});
 assert.equal(g.dispatch('resource.candidate.discover',{nodeId:id}).accepted,true);
 assert.equal(g.dispatch('resource.candidate.work',{nodeId:id}).accepted,true);
 const raw=g.current(),v2=createSaveV2(raw,slot,'test',g.registry),v3state=prepareSecondsV2ToV3(v2,g.registry);
 assert.equal(v3state.ok,true);
 const saved=createSaveV3(v3state.state,slot,'test',g.registry);
 assert.equal(decodeSaveV3(saved,g.registry).ok,true);
 const restored=make();restored.applyApprovedSave(saved);
 assert.deepEqual(restored.current().world.runtime.resource05A,raw.world.runtime.resource05A);
 const old=structuredClone(saved);
 delete old.state.world.runtime.resource05A.candidateSites;
 delete old.state.world.runtime.resource05A.compendium;
 assert.equal(decodeSaveV3(old,g.registry).ok,true);
 const wrong=structuredClone(saved);
 wrong.state.world.runtime.resource05A.candidateSites[id].lastSecond=Number.MAX_SAFE_INTEGER;
 assert.equal(decodeSaveV3(wrong,g.registry).ok,false);
});
test('28/112/224 game-day recurring supply, zero respawn exploits',()=>{
 const expected={28:{blueberry:62,reed:62,mussel:30,marsh:11},112:{blueberry:170,reed:170,mussel:114,marsh:42},224:{blueberry:338,reed:338,mussel:226,marsh:84}};
 for(const days of [28,112,224]){
  const sites=createCandidateSites05A(),results={};
  for(const [key,id] of Object.entries({blueberry:'site05a:blueberry:숲',reed:'site05a:reed:습지',mussel:'site05a:mussel:해안·항구',marsh:'site05a:marsh-bell:습지'})){
   const site={...sites[id],remaining:0};
   // Continuous depletion at the end of every day. No harvesting without recovered units.
   let n=site,total=0;
   for(let d=1;d<=days;d++){
    n=reconcileCandidateSite05A(n,d*DAY);
    total+=n.remaining;
    n={...n,remaining:0};
   }
   results[key]=total;
  }
  assert.ok(results.blueberry>0&&results.reed>0);
  assert.ok(results.mussel>0&&results.marsh>0);
  if(days>28)assert.ok(results.blueberry>50);
  console.log('CANDIDATE_REGEN_05A '+JSON.stringify({days,results}));
 }
});
