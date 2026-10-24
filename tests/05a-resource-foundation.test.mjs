import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RESOURCES_05A,createResourceNodes05A,gatherResource05A,resourceAt05A} from '../src/resources-05a.js';
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
 assert.equal(resourceAt05A(n,RESOURCES_05A[0],3*86400).remaining,1);
});
test('05-A full state action: only valid harvest changes XP, item world and clock; v3 roundtrip',()=>{
 const g=make();
 assert.equal(g.resources05A().nodes['resource05a:wild-herb:01'].remaining,5);
 assert.equal(g.dispatch('resource.gather',{nodeId:'missing'}).accepted,false);
 const before=g.current();assert.equal(before.clock.elapsedUnits,0);
 const result=g.dispatch('resource.gather',{nodeId:'resource05a:wild-herb:01'});
 assert.equal(result.accepted,true);
 assert.equal(g.current().clock.elapsedUnits,50);
 assert.equal(g.current().world.runtime.resource05A.nodes['resource05a:wild-herb:01'].remaining,4);
 assert.equal(g.current().progression.system04A.skills['skill-09'],7);
 assert.equal(g.projected().find(i=>i.id==='gather05a:resource05a:wild-herb').qty,1);
 const v3=saved(g);assert.equal(decodeSaveV3(v3,g.registry).ok,true);
 const restored=make();restored.applyApprovedSave(v3);
 assert.deepEqual(restored.current().world.runtime.resource05A,g.current().world.runtime.resource05A);
 assert.deepEqual(restored.current().itemWorld,g.current().itemWorld);
 assert.deepEqual(restored.current().progression,g.current().progression);
});
