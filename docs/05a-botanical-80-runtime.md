# 05-A botanical 80 — runtime policy pass

All 80 entries from `docs/05a-botanical-80-master-table.md` are now connected to the following executable rules:

1. **Season and time:** 28-day seasons and dawn/day/dusk/night derive from authoritative game seconds. Seasonal output conditions determine whether a species is eligible; plants may remain dormant rather than vanish from the world.
2. **Weather:** rain-pulse desert species require authoritative `runtime.weather05A === 'rain'`. Without a weather producer, those species cannot be harvested. This is intentionally not a fake weather simulation.
3. **Observation:** protected/scientifically interesting species marked `observe` appear in a regional observation interface during their eligible seasons. Observing takes 600 in-game seconds and writes one boolean `flags` marker per species. No plant item is minted; attempting to repeat the same observation is rejected.
4. **Species-level harvesting cooldown:** harvestable plant rewards use `botanicalCanHarvest05A` before granting an item. The last harvested **game day** is kept in one replaceable boolean flag per species, retained by the existing save-v3 system. Recovery proposals in game days: renewable 2; seasonal 7; slow 21; rain-pulse 3 plus actual rain. This prevents an unlimited same-species harvest stream but is a *global species cooldown*, not a simulation of distinct physical plant patches.
5. **Inventory:** the collected plant's pre-existing species item ID is awarded, while its `part` and `purpose` describe the harvested portion and use category. Different-part inventory items (leaf vs flower vs seed) are not yet implemented.
6. **Rarity:** common 70 / uncommon 25 / rare 5 weights are provisional content balance, not approved economy. Only nonempty tiers and eligible seasonal items are sampled. Observed-only species never enter the item reward pool.

## Remaining before declaring the biological ecosystem finished
- Climate/weather simulation, altitude, water depth, real habitat microconditions and route-segment environments.
- Separate persistent in-world growth entities per species/patch, per-node inventory, multiple harvestable parts and seed/flower rewards.
- Automated exploration parity under mixed activities and long-travel segmented behavior.
- Individual Latin taxon validation and full economy balance of 80 species.

These are deliberate, documented limits, not claimed implemented features. The rollout is in a Draft PR and is not authorized for main merge.
