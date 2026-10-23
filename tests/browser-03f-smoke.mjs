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
 // Navigate the world through the public UI; road encounters can pause travel.
 await page.getByRole('button',{name:'지하미궁',exact:true}).click();
 await page.getByRole('button',{name:'이동하기'}).click();
 for(let i=0;i<30;i++){
  if(await page.locator('.region-scene.scene-dungeon').count())break;
  const continueEncounter=page.getByRole('button',{name:'확인 후 계속'});
  if(await continueEncounter.count()&&await continueEncounter.isVisible()){await continueEncounter.click();continue;}
  const continueTravel=page.getByRole('button',{name:'남은 여행 진행'});
  if(await continueTravel.count()&&await continueTravel.isVisible()){await continueTravel.click();continue;}
  await page.getByRole('button',{name:'생활'}).first().click();
  if(await page.locator('.region-scene.scene-dungeon').count())break;
  await page.getByRole('button',{name:'세계 지도'}).first().click();
 }
 await page.getByRole('button',{name:'던전 진입'}).click();
 await page.locator('.dungeon-screen .tile.player').waitFor();
 const mapBefore=await page.locator('.dungeon-screen .tile').count();
 assert.equal(mapBefore,24*24);
 const priorClock=await page.locator('#top').innerText();
 await page.keyboard.press('ArrowRight');
 await page.locator('.dungeon-screen .tile.player').waitFor();
 const afterClock=await page.locator('#top').innerText();
 assert.notEqual(priorClock,afterClock);
 await page.keyboard.press('F5');
 await page.getByText(/IndexedDB에 저장했습니다/).first().waitFor({timeout:15000});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#top .top-title').waitFor();
 await page.keyboard.press('F9');
 const dungeonLoad=page.getByRole('dialog',{name:'저장 상태 불러오기 확인'});
 await dungeonLoad.waitFor({timeout:15000});
 await dungeonLoad.getByRole('button',{name:'불러오기'}).click();
 await page.locator('.dungeon-screen .tile.player').waitFor();
 assert.equal(await page.locator('.dungeon-screen .tile').count(),mapBefore);
 assert.equal(await page.locator('#top').innerText(),afterClock);

 assert.deepEqual(errors,[]);
 console.log('03-F Chromium browser smoke: render, F5 commit, reload, F9 approval, 16 regions PASS');
}finally{await browser.close();}
