import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/v10.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../src/v3.js',import.meta.url),'utf8');
test('SUIT has explicit publisher stylesheet, plus updated UI entrypoint',()=>{
 assert.match(html,/SUIT-Variable\.css/);assert.match(html,/src\/v10\.css\?v=2/);
 assert.match(css,/font-family:"SUIT Variable"/);
});
test('discard trigger is flat dark with white text, theme-based',()=>{
 assert.match(css,/\.inventory-discard-trigger/);assert.match(css,/background:var\(--somnium-action\)!important/);
 assert.match(css,/color:#fff!important/);assert.match(css,/box-shadow:none!important/);
});
test('selection colors whole inventory row, not separate child panels',()=>{
 assert.match(css,/\.inventory-list\.inventory-discard-mode \.inventory-choice\.discard-marked/);
 assert.match(css,/\.inventory-choice \.inventory-item-button/);
 assert.match(css,/background:transparent!important/);
});
test('save manager has field, toggle, sections and separate close footer',()=>{
 assert.match(js,/class:'save-manager-field'/);assert.match(js,/class:'save-manager-toggle'/);
 assert.match(js,/class:'save-manager-section-heading'/);assert.match(js,/class:'save-manager-footer'/);
 assert.match(css,/margin-top:20px;margin-bottom:14px/);
});
