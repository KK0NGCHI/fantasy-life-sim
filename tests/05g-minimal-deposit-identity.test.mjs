import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REAL_ATLAS_05E} from '../src/mineral-atlas-05e.js';
import {mineralDepositId05E,createMineralDeposits05E} from '../src/mineral-deposits-05e.js';
import {depositIdentity05G} from '../src/mineral-clusters-05g.js';
const item=en=>REAL_ATLAS_05E.find(x=>x.en===en).id;
test('derived deposit identity is stable, region-scoped and order-independent',()=>{
 const sites=['chalcopyrite','pyrite','sphalerite'].map(en=>mineralDepositId05E('광산',item(en)));
 const original=JSON.stringify(createMineralDeposits05E());
 const a=depositIdentity05G('광산',sites),b=depositIdentity05G('광산',sites.slice().reverse());
 assert.ok(a);assert.deepEqual(a,b);
 assert.equal(a.kind,'DERIVED_PROTOTYPE');
 assert.notEqual(depositIdentity05G('산맥',sites),a);
 const mountain=sites.map(id=>id.replace(encodeURIComponent('광산'),encodeURIComponent('산맥')));
 assert.ok(depositIdentity05G('산맥',mountain));
 assert.equal(depositIdentity05G('광산',[sites[0],sites[0]]),null);
 assert.equal(depositIdentity05G('광산',[sites[0],mineralDepositId05E('광산',item('galena'))]),null);
 assert.equal(JSON.stringify(createMineralDeposits05E()),original);
});
