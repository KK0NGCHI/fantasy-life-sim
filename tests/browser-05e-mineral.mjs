import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({baseURL:'http://127.0.0.1:8000'});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 page.setDefaultTimeout(8000);
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.locator('#top .top-title').waitFor();
 await page.getByRole('button',{name:'세계 지도',exact:true}).first().click();
 await page.getByRole('button',{name:'광산',exact:true}).click();
 await page.getByRole('button',{name:'이동하기'}).click();
 let arrived=false;
 for(let i=0;i<90;i++){
  const encounter=page.getByRole('dialog',{name:'여행 중 인카운터'});
  if(await encounter.isVisible()){
   await encounter.getByRole('button',{name:'확인 후 계속'}).click();continue;
  }
  const progress=page.getByRole('button',{name:'남은 여행 진행'});
  if(await progress.isVisible()){await progress.click();continue;}
  await page.locator('#bottomNav button[aria-label="생활"]').click();
  if(await page.getByRole('region',{name:'통합 채광'}).isVisible()){arrived=true;break}
  await page.getByRole('button',{name:'세계 지도',exact:true}).first().click();
 }
 assert.ok(arrived,'mine mineral panel should appear after travel to 광산');
 const mineral=page.getByRole('region',{name:'통합 채광'});
 assert.match(await mineral.innerText(),/일반 돌/);
 assert.match(await mineral.innerText(),/보유 곡괭이 최대 등급 1/);
 const iron=mineral.locator('.resource05a-row').filter({hasText:'철광석'});
 await iron.getByRole('button',{name:'광맥 탐사 (10분)'}).click();
 const updated=page.getByRole('region',{name:'통합 채광'}).locator('.resource05a-row').filter({hasText:'철광석'});
 assert.match(await updated.innerText(),/확인 매장량 7\/7/);
 assert.equal(await updated.getByRole('button',{name:'광맥 채굴 (3분)'}).isDisabled(),true);
 const stone=page.getByRole('region',{name:'통합 채광'}).locator('.resource05a-row').filter({hasText:'일반 돌'});
 await stone.getByRole('button',{name:'광맥 탐사 (10분)'}).click();
 const found=page.getByRole('region',{name:'통합 채광'}).locator('.resource05a-row').filter({hasText:'일반 돌'});
 assert.equal(await found.getByRole('button',{name:'광맥 채굴 (3분)'}).isEnabled(),true);
 await found.getByRole('button',{name:'광맥 채굴 (3분)'}).click();
 assert.match(await page.getByRole('region',{name:'통합 채광'}).locator('.resource05a-row').filter({hasText:'일반 돌'}).innerText(),/확인 매장량 15\/16/);
 assert.deepEqual(errors,[]);
 console.log('BROWSER_05E_MINERAL_UI_PASS');
}finally{await browser.close()}
