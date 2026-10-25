import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const js=readFileSync(new URL('../src/v3.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/v9.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('v9 design system loads SUIT variable and native controls',()=>{
 assert.match(html,/src\/v9\.css/);
 assert.match(css,/SUIT-Variable\.css/);
 assert.match(css,/font-family:'SUIT Variable'/);
 assert.match(css,/font-variant-numeric:tabular-nums/);
 assert.match(css,/select:focus-visible/);
});
test('top actions order is save then settings',()=>{
 const top=js.slice(js.indexOf('function top(){'),js.indexOf('function side(){'));
 assert.ok(top.indexOf("svgIcon('save')")<top.indexOf("svgIcon('settings')"));
});
test('save manager labels above fields and slot separator',()=>{
 assert.match(js,/class:'save-manager-field'/);
 assert.match(js,/for:'saveInterval'/);
 assert.match(js,/class:'save-manager-section-heading'/);
 assert.match(css,/\.save-manager-section-heading\{margin-top:20px/);
});
test('inventory row selection fill belongs to parent, no select-all regression',()=>{
 assert.match(css,/\.inventory-discard-mode \.inventory-choice\.discard-marked/);
 assert.match(css,/\.inventory-choice \.inventory-item-button:hover/);
 assert.match(css,/background:transparent!important/);
 assert.doesNotMatch(js,/id:'selectAllItems'/);
});
