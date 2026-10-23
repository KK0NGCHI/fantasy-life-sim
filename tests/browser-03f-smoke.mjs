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
 assert.deepEqual(errors,[]);
 console.log('03-F Chromium browser smoke: render, F5 commit, reload, F9 approval, 16 regions PASS');
}finally{await browser.close();}
