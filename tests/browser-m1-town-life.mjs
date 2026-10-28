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

 console.log('M1_TOWN_LIFE_BROWSER_PASS');
}finally{await browser.close();}
