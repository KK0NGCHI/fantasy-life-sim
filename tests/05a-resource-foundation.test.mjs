import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RESOURCES_05A,createResourceNodes05A,gatherResource05A,resourceAt05A,activeResourceSeconds05A,workDuration05A,workResource05A,discoverResource05A} from '../src/resources-05a.js';
import {createMainV2Inventory} from '../src/main-v2-inventory.js';
import {createSaveV2,prepareSecondsV2ToV3,createSaveV3,decodeSaveV3} from '../dist/engine/v2.js';
const item=[{id:'test:stone',name:'돌',group:'재료',qty:1,tags:[]}];
const opts={worldSeed:'05a-seed',generatedWorld:true,worldPersistence03E:true,progression04A:true,resources05A:true,preferences:{getItem:()=>null,setItem:()=>{}}};
const make=()=>createMainV2Inventory(item,opts);
const slot={slotId:'05a-test',worldId:'world',kind:'manual',label:'test',savedAt:'2026-10-24T00:00:00Z',revision:0};
function saved(g){const v2=createSaveV2(g.current(),slot,'test',g.registry);const v3=prepareSecondsV2ToV3(v2,g.registry);assert.equal(v3.ok,true);return createSaveV3(v3.state,slot,'test',g.registry)}
test('05-A stable catalogue and deterministic initial node counts',()=>{
 assert.equal(RESOURCES_05A.length,12);
 const a=createResourceNodes05A(),b=createResourceNodes05A();
 assert.deepEqual(a,b);
 assert.equal(Object.keys(a).length,18+12+20+18+14+6+3+4+3+3+3+3);
});
test('05-A harvesting cannot duplicate consumed node and respects discovery, region, regeneration',()=>{
 const nodes=createResourceNodes05A(),id='resource05a:wild-herb:01';
 assert.equal(gatherResource05A(nodes,id,'광산',0).ok,false);
 assert.equal(gatherResource05A(nodes,'resource05a:wild-herb:03','숲',0).reason,'UNDISCOVERED');
 let n=nodes[id];
 for(let i=0;i<5;i++){const result=gatherResource05A({...nodes,[id]:n},id,'숲',i*50);assert.equal(result.ok,true);n=result.node;}
 assert.equal(gatherResource05A({...nodes,[id]:n},id,'숲',250).reason,'DEPLETED');
 assert.equal(resourceAt05A(n,RESOURCES_05A[0],3*86400+200).remaining,1);
});
test('05-A full state action: only valid harvest changes XP, item world and clock; v3 roundtrip',()=>{
 const g=make();
 assert.equal(g.resources05A().nodes['resource05a:wild-herb:01'].remaining,5);
 assert.equal(g.dispatch('resource.work',{nodeId:'missing'}).accepted,false);
 assert.equal(g.dispatch('world.travel',{region:'숲'}).accepted,true);
 const before=g.current();
 const result=g.dispatch('resource.work',{nodeId:'resource05a:wild-herb:01'});
 assert.equal(result.accepted,true,JSON.stringify(result));
 assert.ok(g.current().clock.elapsedUnits-before.clock.elapsedUnits>=45&&g.current().clock.elapsedUnits-before.clock.elapsedUnits<=55);
 assert.equal(g.current().world.runtime.resource05A.nodes['resource05a:wild-herb:01'].remaining,4);
 assert.equal(g.current().progression.system04A.skills['skill-09'],7);
 assert.equal(g.projected().find(i=>i.id==='gather05a:resource05a:wild-herb').qty,1);
 const v3=saved(g);assert.equal(decodeSaveV3(v3,g.registry).ok,true);
 const restored=make();restored.applyApprovedSave(v3);
 assert.deepEqual(restored.current().world.runtime.resource05A,g.current().world.runtime.resource05A);
 assert.deepEqual(restored.current().itemWorld,g.current().itemWorld);
 assert.deepEqual(restored.current().progression,g.current().progression);
});

test('05-A four activity rules: valid progress, tool gates, only completed outputs award XP',()=>{
 const nodes=createResourceNodes05A();
 const treeId='resource05a:oak-log:01',oreId='resource05a:stone:01',fishId='resource05a:small-fish:01';
 assert.equal(workResource05A(nodes,treeId,'숲',0).reason,'TOOL_REQUIRED');
 const chopped=workResource05A(nodes,treeId,'숲',0,{toolKind:'axe',toolRank:1});
 assert.equal(chopped.ok,true);assert.equal(chopped.qty,0);assert.equal(chopped.node.progress,1);
 const mined=workResource05A(nodes,oreId,'광산',0,{toolKind:'pickaxe',toolRank:1});
 assert.equal(mined.qty,0);assert.equal(mined.node.progress,1);
 const missed=workResource05A(nodes,fishId,'강·호수',0,{toolKind:'rod',toolRank:1,outcomeRoll:0.7});
 assert.equal(missed.qty,0);assert.equal(missed.node.remaining,12);
 const caught=workResource05A(nodes,fishId,'강·호수',0,{toolKind:'rod',toolRank:1,outcomeRoll:0.001});
 assert.equal(caught.qty,1);assert.equal(caught.xp,10);assert.equal(caught.node.remaining,11);
 assert.equal(workResource05A(nodes,'resource05a:iron-ore:01','광산',0,{toolKind:'pickaxe',toolRank:1}).reason,'TOOL_REQUIRED');
 for(const a of ['gather','logging','mining','fishing']){
  const base={gather:50,logging:65,mining:70,fishing:60}[a],span=a==='gather'?5:10;
  for(const roll of [0,0.5,0.999999])assert.ok(Math.abs(workDuration05A(a,roll)-base)<=span);
 }
});
test('05-A 28-day season boundary freezes herb regeneration in winter',()=>{
 const def=RESOURCES_05A.find(x=>x.id==='resource05a:wild-herb');
 const node={...createResourceNodes05A()['resource05a:wild-herb:01'],remaining:0};
 const early=resourceAt05A(node,def,84*86400-28800);
 const winter=resourceAt05A(early,def,112*86400-28800);
 assert.equal(winter.remaining,early.remaining);
 assert.equal(activeResourceSeconds05A(def,84*86400-28800,112*86400-28800),0);
});
test('05-A bounded work to log completion and save file rejects corrupted resource fields',()=>{
 const g=make();assert.equal(g.dispatch('world.travel',{region:'숲'}).accepted,true);
 const done=g.workUntil05A('resource05a:oak-log:01',50);
 assert.equal(done.accepted,true);assert.equal(done.qty,5);assert.ok(done.actions>=35&&done.actions<=50);
 assert.equal(g.projected().find(x=>x.id==='gather05a:resource05a:oak-log').qty,5);
 const save=saved(g),altered=structuredClone(save);
 altered.state.world.runtime.resource05A.nodes['resource05a:oak-log:01'].remaining=-2;
 assert.equal(decodeSaveV3(altered,g.registry).ok,false);
 assert.equal(decodeSaveV3(save,g.registry).ok,true);
});

test('05-A first-year and second-year mine supply uses fresh bounded sites, never resets old veins',()=>{
 const nodes=createResourceNodes05A(),id='resource05a:iron-ore';
 const found=discoverResource05A(nodes,id,'광산',0);
 assert.equal(found.ok,true);assert.equal(found.newSite,false);
 assert.equal(discoverResource05A(found.nodes,id,'광산',0).reason,'SUPPLY_NOT_READY');
 const week=discoverResource05A(found.nodes,id,'광산',7*86400);
 assert.equal(week.ok,true);assert.equal(week.newSite,true);
 assert.equal(week.nodes[week.nodeId].remaining,10);
 assert.equal(discoverResource05A(week.nodes,id,'광산',7*86400).reason,'SUPPLY_NOT_READY');
 const secondYear=discoverResource05A(week.nodes,id,'광산',224*86400);
 assert.equal(secondYear.ok,true);
 assert.equal(week.nodes[week.nodeId].remaining,10);
 assert.equal(Object.keys(secondYear.nodes).length,Object.keys(week.nodes).length+1);
});
test('05-A resource search respects region/time and cannot re-discover identical sites',()=>{
 const g=make();
 const rejected=g.dispatch('resource.search',{resourceId:'resource05a:iron-ore'});
 assert.equal(rejected.accepted,false);
 assert.equal(g.current().clock.elapsedUnits,0);
 assert.equal(g.dispatch('world.travel',{region:'광산'}).accepted,true);
 const oldClock=g.current().clock.elapsedUnits;
 const discovered=g.dispatch('resource.search',{resourceId:'resource05a:iron-ore'});
 assert.equal(discovered.accepted,true);
 assert.equal(g.current().clock.elapsedUnits-oldClock,600);
 const unhidden=Object.values(g.resources05A().nodes).filter(n=>n.resourceId==='resource05a:iron-ore'&&n.discovered);
 assert.equal(unhidden.length,3);
 const noExtra=g.dispatch('resource.search',{resourceId:'resource05a:iron-ore'});
 assert.equal(noExtra.accepted,false);
 assert.equal(g.current().clock.elapsedUnits-oldClock,600);
});
