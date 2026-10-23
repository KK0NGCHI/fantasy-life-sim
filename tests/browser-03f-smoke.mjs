import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({baseURL:'http://127.0.0.1:8000'});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.locator('#top .top-title').waitFor();
 assert.match(await page.locator('#top').innerText(),/08:00:00/);
 assert.equal(await page.locator('#main').isVisible(),true);
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
  const slot={slotId:'03f-browser',worldId:'main-world',kind:'manual',label:'Browser',savedAt:'2026-10-24T00:00:00Z',revision:0};
  const proposal=prepareSecondsV2ToV3(createSaveV2(before,slot,'main-prototype',g.registry),g.registry);
  if(!proposal.ok)return {ok:false,reason:proposal.reason};
  const packed=createSaveV3(proposal.state,slot,'main-prototype',g.registry);
  const restored=createMainV2Inventory(items,{...options,worldSeed:'a-different-world'});
  restored.applyApprovedSave(packed);
  return {ok:entered.accepted&&moved.accepted,sameWorld:JSON.stringify(before.world)===JSON.stringify(restored.current().world),
   sameClock:JSON.stringify(before.clock)===JSON.stringify(restored.current().clock),
   sameRng:JSON.stringify(before.rng)===JSON.stringify(restored.current().rng),
   sameMap:JSON.stringify(tiles)===JSON.stringify(restored.localMap().tiles),cells:restored.rememberedCells().length};
 });
 assert.equal(dungeonRuntime.ok,true);
 assert.equal(dungeonRuntime.sameWorld,true);
 assert.equal(dungeonRuntime.sameClock,true);
 assert.equal(dungeonRuntime.sameRng,true);
 assert.equal(dungeonRuntime.sameMap,true);
 assert.ok(dungeonRuntime.cells>0);
 assert.deepEqual(errors,[]);
 console.log('03-F Chromium browser smoke: render, F5 commit, reload, F9 approval, 16 regions PASS');
}finally{await browser.close();}
