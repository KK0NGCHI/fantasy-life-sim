import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

function read(path){
 const text=readFileSync(new URL('../docs/'+path,import.meta.url),'utf8').trim();
 const [head,...lines]=text.split(/\r?\n/);
 const names=head.split('\t');
 return lines.map((line,i)=>Object.fromEntries(names.map((name,j)=>[name,line.split('\t')[j]??''])));
}
const sources=read('resource-master-v05.tsv'),edges=read('resource-edges-v05.tsv'),
 parts=read('resource-item-parts-v05.tsv'),recipes=read('resource-recipes-v05.tsv'),
 sourceLinks=read('resource-recipe-mapping-v05.tsv'),partLinks=read('resource-item-recipe-links-v05.tsv');
const unique=(rows,key)=>new Set(rows.map(x=>x[key])).size===rows.length;

test('master: v03 256 + v04 128 with stable referential integrity',()=>{
 assert.equal(edges.length,384);
 assert.equal(sources.length,348);
 assert.ok(unique(sources,'sourceId'));
 assert.ok(unique(edges,'rowId'));
 const ids=new Set(sources.map(x=>x.sourceId));
 const regions=new Set(edges.map(x=>x.region));
 assert.equal(regions.size,16);
 for(const edge of edges){
  assert.ok(ids.has(edge.sourceId),edge.sourceId);
  assert.ok(edge.stage1Drop&&edge.stage3Use);
  assert.ok(['v0.3','v0.4'].includes(edge.evidence));
 }
 assert.equal(edges.filter(x=>x.evidence==='v0.3').length,256);
 assert.equal(edges.filter(x=>x.evidence==='v0.4').length,128);
});
test('parts: provisional outputs link to known sources',()=>{
 assert.equal(parts.length,539);
 assert.ok(unique(parts,'proposedItemId'));
 const ids=new Set(sources.map(x=>x.sourceId));
 for(const p of parts)assert.ok(ids.has(p.sourceId)&&p.partOrLoot,p.proposedItemId);
});
test('recipe design: all 384 source and 539 part links refer to valid candidate recipes',()=>{
 assert.equal(recipes.length,56);
 assert.ok(unique(recipes,'recipeId'));
 const recipeIds=new Set(recipes.map(x=>x.recipeId));
 const sourceIds=new Set(sources.map(x=>x.sourceId));
 const partIds=new Set(parts.map(x=>x.proposedItemId));
 assert.equal(sourceLinks.length,384);
 assert.equal(partLinks.length,539);
 assert.ok(unique(sourceLinks,'rowId'));
 assert.ok(unique(partLinks,'itemPartId'));
 for(const row of sourceLinks){
  assert.ok(sourceIds.has(row.sourceId));
  for(const recipeId of row.possibleRecipeIds.split(';'))assert.ok(recipeIds.has(recipeId),recipeId);
 }
 for(const row of partLinks){
  assert.ok(partIds.has(row.itemPartId));
  for(const recipeId of row.conceptualRecipes.split(';'))assert.ok(recipeIds.has(recipeId),recipeId);
 }
});
