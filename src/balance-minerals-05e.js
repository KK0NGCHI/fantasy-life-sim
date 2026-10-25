/** Provisional geology tuning only. Source identities and worldbuilding live elsewhere.
 * Values are intentionally unchanged; changes require finite-stock and crafting tests.
 */
export const ATLAS_MINERAL_BALANCE_05E=Object.freeze({stock:4,grade:1,hardness:1});
export const NAMED_MINERAL_BALANCE_05E=Object.freeze({
 'item05a:tin-ore':{stock:6,grade:2,hardness:2},
 'item05a:silver-ore':{stock:5,grade:2,hardness:2},
 'item05a:gold-ore':{stock:4,grade:3,hardness:2},
 'item05a:limestone':{stock:10,grade:1,hardness:1},
 'item05a:clay':{stock:12,grade:1,hardness:1},
 'item05a:silica-sand':{stock:9,grade:1,hardness:1},
 'item05a:gypsum':{stock:8,grade:1,hardness:1},
 'item05a:sulfur':{stock:6,grade:2,hardness:2},
 'item05a:stone':{stock:16,grade:1,hardness:1},
 'item05a:coal':{stock:10,grade:1,hardness:2},
 'item05a:copper-ore':{stock:8,grade:2,hardness:2},
 'item05a:iron-ore':{stock:7,grade:2,hardness:3},
 'item05a:quartz':{stock:5,grade:3,hardness:2}
});
for(const rule of Object.values(NAMED_MINERAL_BALANCE_05E))Object.freeze(rule);
