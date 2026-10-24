import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({baseURL:'http://127.0.0.1:8000'});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 page.setDefaultTimeout(7000);
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.locator('#top .top-title').waitFor();
 assert.match(await page.locator('#top').innerText(),/08:00:00/);
 assert.equal(await page.locator('#main').isVisible(),true);
 // 04-A: creation points are displayed with immediate feedback and confirm semantics.
 await page.getByRole('button',{name:'캐릭터',exact:true}).first().click();
 await page.getByRole('button',{name:'능력치',exact:true}).click();
 await page.getByRole('button',{name:'초기 능력치 배분'}).click();
 const creation=page.getByRole('dialog',{name:'초기 능력치 배분'});
 await creation.waitFor();
 await creation.getByRole('combobox',{name:'능력치 배분 프리셋'}).selectOption('제작형');
 assert.match(await creation.locator('.creation-summary').innerText(),/남은 포인트 0/);
 assert.equal(await creation.locator('.creation-attribute-row').filter({hasText:'지능'}).locator('output').innerText(),'15');
 await creation.getByRole('button',{name:'배분 확정'}).click();
 await page.getByRole('button',{name:'닫기'}).first().click();
 // F5 is intercepted by the app, not browser refresh. Wait for durable transaction result.
 await page.keyboard.press('F5');
 await page.getByText(/IndexedDB에 저장했습니다/).first().waitFor({timeout:15000});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#top .top-title').waitFor();
 await page.keyboard.press('F9');
 const dialog=page.getByRole('dialog',{name:'저장 상태 불러오기 확인'});
 await dialog.waitFor({timeout:15000});
 await dialog.getByRole('button',{name:'불러오기'}).click();
 await page.getByText(/승인된 v2 저장 데이터를 불러왔습니다/).first().waitFor();
 await page.getByRole('button',{name:'세계 지도'}).first().click();
 assert.equal(await page.locator('.mapgrid .region').count(),16);
 // End-to-end world navigation is a separate user-visible contract.
 await page.getByRole('button',{name:'지하미궁',exact:true}).click();
 await page.getByRole('button',{name:'이동하기'}).click();
 let arrived=false;
 for(let attempt=0;attempt<60;attempt++){
   const encounter=page.getByRole('dialog',{name:'여행 중 인카운터'});
   if(await encounter.isVisible()){
     await encounter.getByRole('button',{name:'확인 후 계속'}).click();
     continue;
   }
   const progress=page.getByRole('button',{name:'남은 여행 진행'});
   if(await progress.isVisible()){await progress.click();continue;}
   await page.locator('#bottomNav button[aria-label="생활"]').click();
   if(attempt===0)console.log('AFTER_LIFESTYLE_CLICK',JSON.stringify({heading:await page.locator('#main h1').innerText(), buttons:await page.locator('#main button').allTextContents()}));
   if(await page.getByRole('button',{name:'던전 진입'}).isVisible()){arrived=true;break;}
   if(attempt===0||attempt===59)console.log('TRAVEL_LIFESTYLE_DIAGNOSTIC',JSON.stringify({screen:(await page.locator('#main').innerText()).slice(0,1300), buttons:await page.locator('#main button').allTextContents(), current:await page.locator('#bottomNav .current').allTextContents()}));
   await page.getByRole('button',{name:'세계 지도',exact:true}).first().click();
 }
 if(!arrived)throw Error('WORLD_DUNGEON_ARRIVAL_UI: '+JSON.stringify({
   heading:await page.locator('#main').innerText(),
   activeRegion:await page.locator('.mapgrid .region.active').getAttribute('aria-label').catch(()=>null)
 }));
 await page.getByRole('button',{name:'던전 진입'}).click();
 await page.locator('.dungeon-screen .tile.player').waitFor();
 assert.equal(await page.locator('.dungeon-screen .tile').count(),576);
 await page.getByRole('button',{name:'자동 탐색 시작'}).click();
 await page.getByRole('button',{name:'자동 탐색 중지'}).click();
 await page.keyboard.press('ArrowRight');
 const dungeonClock=await page.locator('#top .top-meta').innerText();
 await page.keyboard.press('F5');
 await page.getByText(/IndexedDB에 저장했습니다/).first().waitFor({timeout:15000});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.keyboard.press('F9');
 const restoredDungeon=page.getByRole('dialog',{name:'저장 상태 불러오기 확인'});
 await restoredDungeon.waitFor();
 await restoredDungeon.getByRole('button',{name:'불러오기'}).click();
 await page.locator('.dungeon-screen .tile.player').waitFor();
 assert.equal(await page.locator('.dungeon-screen .tile').count(),576);
 assert.equal(await page.locator('#top .top-meta').innerText(),dungeonClock);
 await page.getByRole('button',{name:'던전 나가기'}).click();
 // Validate the dungeon runtime in a real browser process, independently from
 // the unresolved world-map-to-dungeon navigation UI path.
 const dungeonRuntime=await page.evaluate(async()=>{
  const {createMainV2Inventory}=await import('/src/main-v2-inventory.js');
  const {createSaveV2,prepareSecondsV2ToV3,createSaveV3}=await import('/dist/engine/v2.js');
  const items=[{id:'test:ore',name:'광석',group:'재료',qty:1,tags:[]}];
  const options={generatedWorld:true,worldPersistence03E:true,worldSeed:'03f-browser-dungeon',
   preferences:{getItem:()=>null,setItem:()=>{}}};
  const g=createMainV2Inventory(items,options);
  const entered=g.dispatch('dungeon.enter',{}),moved=g.dispatch('dungeon.move',{direction:'east'});
  const before=g.current(),tiles=g.localMap().tiles;
  const route=[];const map=g.localMap();const goal=map.entrances.find(x=>x.destinationFloor===-1);
  const start=g.current().world.runtime.pos;const queue=[[start[0],start[1],[]]],visited=new Set();
  while(queue.length){const [x,y,path]=queue.shift(),k=x+','+y;if(visited.has(k))continue;visited.add(k);
   if(x===goal.x&&y===goal.y){route.push(...path);break;}
   for(const [direction,dx,dy] of [['east',1,0],['west',-1,0],['north',0,-1],['south',0,1]]){
    const nx=x+dx,ny=y+dy;if(map.tiles[ny]?.split(' ')[nx]==='core:terrain/ground'&&!visited.has(nx+','+ny))queue.push([nx,ny,[...path,direction]]);
   }
  }
  const stairWorld=createMainV2Inventory(items,options);stairWorld.dispatch('dungeon.enter');stairWorld.dispatch('dungeon.move',{direction:'east'});
  for(const d of route){const step=stairWorld.dispatch('dungeon.move',{direction:d});if(!step.accepted)return {ok:false,reason:'stair path rejected'};}
  const beforePortal=stairWorld.localPortal(),positionBefore=stairWorld.current().world.runtime.pos;
  const down=stairWorld.dispatch('dungeon.portal',{}),floorDown=stairWorld.localFloor();
  const up=stairWorld.dispatch('dungeon.portal',{}),floorUp=stairWorld.localFloor();
  const slot={slotId:'03f-browser',worldId:'main-world',kind:'manual',label:'Browser',savedAt:'2026-10-24T00:00:00Z',revision:0};
  const proposal=prepareSecondsV2ToV3(createSaveV2(before,slot,'main-prototype',g.registry),g.registry);
  if(!proposal.ok)return {ok:false,reason:proposal.reason};
  const packed=createSaveV3(proposal.state,slot,'main-prototype',g.registry);
  const restored=createMainV2Inventory(items,{...options,worldSeed:'a-different-world'});
  restored.applyApprovedSave(packed);
  return {ok:entered.accepted&&moved.accepted,sameWorld:JSON.stringify(before.world)===JSON.stringify(restored.current().world),
   sameClock:JSON.stringify(before.clock)===JSON.stringify(restored.current().clock),
   sameRng:JSON.stringify(before.rng)===JSON.stringify(restored.current().rng),
   sameMap:JSON.stringify(tiles)===JSON.stringify(restored.localMap().tiles),cells:restored.rememberedCells().length,
   stairs:route.length>0&&down.accepted&&up.accepted&&floorDown===-1&&floorUp===0,
   stairDebug:{routeLength:route.length,goal,beforePortal,positionBefore,downAccepted:down.accepted,downReason:down.reason,
    upAccepted:up.accepted,upReason:up.reason,floorDown,floorUp}};
 });
 assert.equal(dungeonRuntime.ok,true);
 assert.equal(dungeonRuntime.sameWorld,true);
 assert.equal(dungeonRuntime.sameClock,true);
 assert.equal(dungeonRuntime.sameRng,true);
 assert.equal(dungeonRuntime.sameMap,true);
 assert.ok(dungeonRuntime.cells>0);
 assert.equal(dungeonRuntime.stairs,true,JSON.stringify(dungeonRuntime.stairDebug));
 assert.deepEqual(errors,[]);
 console.log('03-F Chromium browser smoke: render, F5 commit, reload, F9 approval, 16 regions PASS');
}finally{await browser.close();}
