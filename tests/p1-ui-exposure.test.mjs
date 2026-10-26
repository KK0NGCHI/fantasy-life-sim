import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {REFINING_RECIPES_05H} from '../src/mineral-refining-05h.js';
const ui=readFileSync(new URL('../src/v3.js',import.meta.url),'utf8');
test('P1: errors show allowlisted gameplay detail instead of opaque EXECUTION_ERROR',()=>{
 assert.match(ui,/gameplayFailureText\(result\.detail\?\?result\.reason\)/);
 assert.match(ui,/DEPLETED:'자원이 고갈되었습니다/);
});
test('P1: crafting page exposes complete live refining catalog with owned material checks',()=>{
 assert.ok(REFINING_RECIPES_05H.length>=17);
 const start=ui.indexOf("function crafts(){");
 const end=ui.indexOf("function other()",start);
 const page=ui.slice(start,end);
 for(const term of ['REFINING_RECIPES_05H','ownedQtyForCraft','mineral.refine','recipeId:recipe.id','action.disabled=!ready']){
  assert.ok(page.includes(term),'craft page missing live path '+term);
 }
});
