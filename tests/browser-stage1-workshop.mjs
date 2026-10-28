import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({baseURL:'http://127.0.0.1:8000'});
try {
 await page.goto('/');
 await page.locator('#bottomNav button[aria-label="생활"]').click();
 const panel=page.getByRole('region',{name:'광물 가공'});
 await panel.waitFor();
 const mode=panel.getByRole('combobox',{name:'연속 제작 정책'});
 await mode.selectOption('until');
 assert.equal(await mode.inputValue(),'until');
 await panel.getByRole('combobox',{name:'연속 제작 횟수'}).selectOption('5');
 await panel.getByRole('combobox',{name:'자동 제작 게임 시간 제한'}).selectOption('600');
 await panel.getByRole('combobox',{name:'자동 제작 생존 안전 설정'}).selectOption('cautious');
 console.log('STAGE1_WORKSHOP_BROWSER_PASS');
} finally {await browser.close();}
