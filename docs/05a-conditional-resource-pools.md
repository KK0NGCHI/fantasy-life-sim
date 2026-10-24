# 05-A / conditional resource output pools — isolated foundation

**Status:** additive proof-of-contract, not a production spawn or harvest integration. No existing rates or 12+6 resource instances changed.

## Two-stage draw and diverse species
A resource interaction can use a pool of rarity groups. First draw selects a rarity group by group weight, second selects an output within it by item weight. The familiar 70/30 then 1/3 vs 1/2 example is **only a test fixture**; no test herb/flower becomes a canonical in-game item.

## Distinct lifecycle policies
- `spawnConditions`: where/when a world source is allowed to appear, not when existing inventory is valid.
- `harvestConditions`: whether an existing site may be harvested at the current region/time/weather.
- `outputs[].conditions`: a particular result is obtainable at that time.
- `regenerationPolicy`: `none`, `fixed`, or `prospect`. The generic definitions are schema only; existing clock reconciliation remains in the old engines.
- `disappearancePolicy`: `persist`, `despawn`, or `dormant` for a future region population controller.

Currently supported condition dimensions: region, season, daypart, weather. Other dimensions (habitat, depth, temperature, skill, tide, world flags) require a separately reviewed schema extension rather than silent implicit behavior.

Conditional/unavailable item rolls become explicit no-drop results. We intentionally **do not** silently normalize out seasonally restricted items, which would alter the rarity group weight. A future content decision may prefer explicit reweighting of eligible item entries, but must not occur accidentally.

## Safety / scope
- Pure functions, no calls to global randomness, with two caller-supplied random draws.
- Validate all tables, percentages/weights, duplicate IDs and condition vocabulary.
- Current source nodes, 05-A time/season systems, existing save files, rarity definitions, XP and UI remain unchanged.
- Before production wiring: choose player-facing no-drop vs reweighted seasonal pools; ensure a failed result still advances intended in-game time exactly once; source item grants remain atomic with RNG and progression; persisted source outcomes should record correct source and tags; add E2E tests with many species.
- No merge to `main` without user approval.
