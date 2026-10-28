import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({baseURL:'http://127.0.0.1:8000'});
try{
 await page.goto('/');
 await page.locator('#bottomNav button[aria-label="생활"]').click();
 const panel=page.getByRole('region',{name:'M1 실제 농업·교역'});
 await panel.waitFor();
 await panel.getByRole('button',{name:/밀 씨앗 구매/}).click();
 assert.match(await panel.innerText(),/밀 씨앗 1/);
 await panel.getByRole('button',{name:'밀 심기'}).first().click();
 assert.match(await panel.innerText(),/밀 \/ 생장 중/);
 await panel.getByRole('button',{name:/하루 경과/}).click();
 await panel.getByRole('button',{name:'수확'}).first().click();
 assert.match(await panel.innerText(),/밀 3/);
 await panel.getByRole('button',{name:/밀빵 요리/}).click();
 assert.match(await panel.innerText(),/밀빵 1/);
 assert.match(await panel.innerText(),/밀빵 직전 조리 재료: 밀 ×2/);
 await panel.getByRole('button',{name:/밀빵 먹기/}).click();
 assert.match(await panel.innerText(),/허기 100\/100/);
 await panel.getByRole('button',{name:/밀 1개 판매/}).click();
 await panel.getByRole('button',{name:/농지 한 칸 확장/}).click();
 assert.match(await panel.innerText(),/농지 3개/);
 // Second crop uses the bounded automation path; inventory is still authoritative.
 await panel.getByRole('button',{name:/감자 씨앗 구매/}).click();
 await panel.getByRole('button',{name:'감자 심기'}).first().click();
 await panel.getByRole('button',{name:/하루 경과/}).click();
 await panel.getByRole('button',{name:/익은 작물 일괄 수확/}).click();
 assert.match(await panel.innerText(),/감자 2/);
 // A real orchard purchase, first fruit, then browser reload from IndexedDB.
 await panel.getByRole('button',{name:/감자 1개 판매/}).click();
 await panel.getByRole('button',{name:/사과나무 씨앗 구매/}).click();
 await panel.getByRole('button',{name:'사과 심기'}).first().click();
 for(let day=0;day<7;day++)await panel.getByRole('button',{name:/하루 경과/}).click();
 await panel.getByRole('button',{name:'수확'}).first().click();
 assert.match(await panel.innerText(),/사과 4/);
 assert.match(await panel.innerText(),/사과나무/);
 await page.keyboard.press('F5');
 await page.getByText(/IndexedDB에 저장했습니다/).first().waitFor({timeout:15000});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.keyboard.press('F9');
 const confirm=page.getByRole('dialog',{name:'저장 상태 불러오기 확인'});
 await confirm.waitFor({timeout:15000});
 await confirm.getByRole('button',{name:'불러오기'}).click();
 await page.locator('#bottomNav button[aria-label="생활"]').click();
 const restored=page.getByRole('region',{name:'M1 실제 농업·교역'});
 await restored.waitFor();
 assert.match(await restored.innerText(),/사과 4/);
 assert.match(await restored.innerText(),/사과나무/);


 console.log('M1_TOWN_LIFE_BROWSER_PASS');
}finally{await browser.close();}
